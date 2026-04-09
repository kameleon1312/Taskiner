import { useMemo } from "react";
import { useTaskStore }    from "../stores/useTaskStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import { toDateKey } from "../utils/dateUtils";

export interface DayStats {
  date: string;
  count: number;
}

export interface WeekDay {
  label: string;
  date: string;
  count: number;
  max: boolean;
}

export interface CatDistItem {
  name: string;
  emoji: string;
  color: string;
  count: number;
  percent: number;
}

export interface StatsData {
  streak: number;
  longestStreak: number;
  totalCompleted: number;
  completedToday: number;
  totalTasks: number;
  completionRate: number;

  weeklyData: WeekDay[];
  heatmap: DayStats[];
  heatmap12w: DayStats[];

  categoryDistribution: CatDistItem[];
  hourlyData: number[];
  activeDaysCount: number;
  avgPerActiveDay: number;
  bestDayOfWeek: { label: string; avg: number } | null;

  topCategory: { name: string; emoji: string; count: number } | null;
}


export function useStats(): StatsData {
  const tasks         = useTaskStore((s) => s.tasks);
  const completionLog = useTaskStore((s) => s.completionLog);
  const { categories } = useCategoryStore();

  return useMemo(() => {
    const today    = new Date();
    const todayKey = toDateKey(today);

    const completedByDay = new Map<string, number>();
    completionLog.forEach((r) => {
      const key = r.completedAt.slice(0, 10);
      completedByDay.set(key, (completedByDay.get(key) || 0) + 1);
    });

    // Current streak — walks back day by day from today
    let streak = 0;
    const streakStart = new Date(today);
    if (!completedByDay.has(todayKey)) {
      streakStart.setDate(streakStart.getDate() - 1);
    }
    {
      const d = new Date(streakStart);
      while (true) {
        if ((completedByDay.get(toDateKey(d)) || 0) > 0) {
          streak++;
          d.setDate(d.getDate() - 1);
        } else break;
      }
    }

    // Longest streak
    const sortedDates = Array.from(completedByDay.keys())
      .filter((k) => completedByDay.get(k)! > 0)
      .sort();
    let longestStreak = streak;
    if (sortedDates.length > 0) {
      let run = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = Math.floor(
          (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()) / 86400000
        );
        if (diff === 1) { run++; if (run > longestStreak) longestStreak = run; }
        else run = 1;
      }
    }

    // Weekly chart (last 7 days)
    const DAY_LABELS = ["N", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
    const weeklyData: WeekDay[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      weeklyData.push({ date: key, label: DAY_LABELS[d.getDay()], count: completedByDay.get(key) || 0, max: false });
    }
    const maxWkCount = Math.max(...weeklyData.map((d) => d.count), 1);
    weeklyData.forEach((d) => { d.max = d.count > 0 && d.count === maxWkCount; });

    // Legacy 30-day heatmap
    const heatmap: DayStats[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      heatmap.push({ date: key, count: completedByDay.get(key) || 0 });
    }

    // 12-week aligned heatmap (Mon–Sun, 84 cells)
    const todayDow = (today.getDay() + 6) % 7; // Mon=0 … Sun=6
    const heatmapStart = new Date(today);
    heatmapStart.setDate(today.getDate() - todayDow - 77);

    const heatmap12w: DayStats[] = [];
    for (let i = 0; i < 84; i++) {
      const d = new Date(heatmapStart);
      d.setDate(heatmapStart.getDate() + i);
      const key   = toDateKey(d);
      const count = d > today ? -1 : (completedByDay.get(key) || 0);
      heatmap12w.push({ date: key, count });
    }

    const totalCompleted  = completionLog.length;
    const totalTasks      = tasks.length;
    const currentDone     = tasks.filter((t) => t.completed).length;
    const completionRate  = totalTasks > 0 ? Math.round((currentDone / totalTasks) * 100) : 0;
    const completedToday  = completedByDay.get(todayKey) || 0;
    const activeDaysCount = completedByDay.size;
    const avgPerActiveDay = activeDaysCount > 0
      ? Math.round((totalCompleted / activeDaysCount) * 10) / 10
      : 0;

    // Category distribution
    const catCounts = new Map<number, number>();
    completionLog
      .filter((r) => r.categoryId != null)
      .forEach((r) => {
        const cid = r.categoryId!;
        catCounts.set(cid, (catCounts.get(cid) || 0) + 1);
      });

    let topCategory: StatsData["topCategory"] = null;
    if (catCounts.size > 0) {
      const topEntry = Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      const cat = categories.find((c) => c.id === topEntry[0]);
      if (cat) topCategory = { name: cat.name, emoji: cat.emoji, count: topEntry[1] };
    }

    const totalCatCompleted = Array.from(catCounts.values()).reduce((a, b) => a + b, 0);
    const categoryDistribution: CatDistItem[] = Array.from(catCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .reduce<CatDistItem[]>((acc, [catId, count]) => {
        const cat = categories.find((c) => c.id === catId);
        if (cat) {
          acc.push({
            name: cat.name,
            emoji: cat.emoji,
            color: cat.color,
            count,
            percent: totalCatCompleted > 0 ? Math.round((count / totalCatCompleted) * 100) : 0,
          });
        }
        return acc;
      }, []);

    // Completions by hour of day (local time)
    const hourlyData = new Array(24).fill(0);
    completionLog.forEach((r) => {
      const hour = new Date(r.completedAt).getHours();
      hourlyData[hour]++;
    });

    // Best day of week
    const DOW_PL = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
    const dowTotals = new Array(7).fill(0);
    const dowWeekCounts = new Array(7).fill(0);
    completedByDay.forEach((count, dateKey) => {
      const dow = new Date(dateKey).getDay();
      dowTotals[dow] += count;
      dowWeekCounts[dow]++;
    });
    const maxDowTotal = Math.max(...dowTotals);
    let bestDayOfWeek: StatsData["bestDayOfWeek"] = null;
    if (maxDowTotal > 0) {
      const maxDow = dowTotals.indexOf(maxDowTotal);
      const weeks  = Math.max(dowWeekCounts[maxDow], 1);
      bestDayOfWeek = {
        label: DOW_PL[maxDow],
        avg: Math.round((dowTotals[maxDow] / weeks) * 10) / 10,
      };
    }

    return {
      streak,
      longestStreak,
      totalCompleted,
      completedToday,
      totalTasks,
      completionRate,
      weeklyData,
      heatmap,
      heatmap12w,
      categoryDistribution,
      hourlyData,
      activeDaysCount,
      avgPerActiveDay,
      bestDayOfWeek,
      topCategory,
    };
  }, [tasks, completionLog, categories]);
}
