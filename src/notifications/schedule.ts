import type { Task, Habit } from "../types";
import type { NotificationPrefs } from "../stores/useUIStore";
import { deadlineDateKey, isAllDay, parseDeadline } from "../utils/deadline";
import { addDays, fromDateKey, toDateKey, fmtTime, plural } from "../utils/dateUtils";

export type NotifKind = "deadline" | "allday" | "streak" | "habit" | "brief" | "focus" | "snooze" | "test";

export interface ScheduledNotif {
  key:      string;     // stable & unique → dedup across page and SW
  fireAt:   number;
  kind:     NotifKind;
  title:    string;
  body:     string;
  tag:      string;
  url:      string;
  taskId?:  number;
  taskText?: string;
  requireInteraction?: boolean;
  vibrate?: number[];
  grace?:   number;     // ms a late reminder is still worth delivering
}

const HORIZON_MS = 8 * 86_400_000;
const HOUR = 3_600_000;

export interface ScheduleInput {
  tasks:  Task[];
  habits: Habit[];
  prefs:  NotificationPrefs;
  streak: number;
  completedToday: number;
  focusEndAt: number | null;
  focusMode:  string;
  focusLabel: string;
  now?: number;
}

function atTime(dateKey: string, hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const d = fromDateKey(dateKey);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.getTime();
}

function offsetLabel(min: number): string {
  if (min < 60) return `za ${min} min`;
  if (min < 1440) {
    const h = Math.round(min / 60);
    return h === 1 ? "za godzinę" : `za ${h} ${plural(h, "godzinę", "godziny", "godzin")}`;
  }
  const d = Math.round(min / 1440);
  return d === 1 ? "jutro" : `za ${d} dni`;
}

export function buildSchedule(input: ScheduleInput): ScheduledNotif[] {
  const { tasks, habits, prefs } = input;
  const now = input.now ?? Date.now();
  const out: ScheduledNotif[] = [];
  const push = (n: ScheduledNotif) => {
    // Only future moments: late delivery of past ones is the service worker's job
    if (n.fireAt > now && n.fireAt - now <= HORIZON_MS) out.push(n);
  };

  if (!prefs.notificationsEnabled) return out;

  const active = tasks.filter((t) => !t.completed);

  // ── Deadlines ────────────────────────────────────────────────────────────
  for (const t of active) {
    if (!t.deadline) continue;
    const url = `/tasks?task=${t.id}`;

    if (isAllDay(t.deadline)) {
      const day = deadlineDateKey(t.deadline);
      // Morning of the day
      push({
        key: `allday-${t.id}-${day}`, kind: "allday", fireAt: atTime(day, prefs.allDayTime),
        title: "📌 Na dziś", body: t.text, tag: `task-${t.id}`, url, taskId: t.id, taskText: t.text,
        grace: 12 * HOUR,
      });
      // Day-before style offsets (≥ 1 day) at the same hour
      for (const off of prefs.notifyOffsets.filter((o) => o >= 1440)) {
        const days = Math.round(off / 1440);
        const dk   = toDateKey(addDays(fromDateKey(day), -days));
        push({
          key: `allday-${t.id}-${day}-m${days}`, kind: "allday", fireAt: atTime(dk, prefs.allDayTime),
          title: days === 1 ? "📅 Jutro termin" : `📅 Termin za ${days} dni`, body: t.text,
          tag: `task-${t.id}`, url, taskId: t.id, taskText: t.text, grace: 12 * HOUR,
        });
      }
      continue;
    }

    const due = parseDeadline(t.deadline).getTime();
    const stamp = t.deadline;
    push({
      key: `due-${t.id}-${stamp}`, kind: "deadline", fireAt: due,
      title: "⏰ Termin mija teraz", body: t.text, tag: `task-${t.id}`, url,
      taskId: t.id, taskText: t.text, requireInteraction: true,
      vibrate: [220, 100, 220, 100, 320], grace: 3 * HOUR,
    });
    for (const off of prefs.notifyOffsets) {
      if (off <= 0) continue;
      push({
        key: `pre-${t.id}-${stamp}-${off}`, kind: "deadline", fireAt: due - off * 60_000,
        title: `🔔 ${offsetLabel(off).replace(/^./, (c) => c.toUpperCase())} · ${fmtTime(new Date(due))}`,
        body: t.text, tag: `task-${t.id}`, url, taskId: t.id, taskText: t.text,
        grace: Math.min(off * 60_000, 2 * HOUR),
      });
    }
  }

  const today = toDateKey(new Date(now));
  const tomorrow = toDateKey(addDays(new Date(now), 1));

  // ── Daily brief (today + tomorrow) ───────────────────────────────────────
  if (prefs.dailyBrief) {
    for (const day of [today, tomorrow]) {
      const dayTasks = active.filter((t) => t.deadline && deadlineDateKey(t.deadline) === day);
      const overdue  = day === today
        ? active.filter((t) => t.deadline && deadlineDateKey(t.deadline) < day).length
        : 0;
      if (!dayTasks.length && !overdue) continue;
      const first = dayTasks
        .filter((t) => !isAllDay(t.deadline!))
        .sort((a, b) => parseDeadline(a.deadline!).getTime() - parseDeadline(b.deadline!).getTime())[0];
      const parts = [`${dayTasks.length} ${plural(dayTasks.length, "zadanie", "zadania", "zadań")} na dziś`];
      if (overdue) parts.push(`${overdue} zaległe`);
      if (first) parts.push(`pierwsze o ${fmtTime(parseDeadline(first.deadline!))}`);
      push({
        key: `brief-${day}`, kind: "brief", fireAt: atTime(day, prefs.dailyBriefTime),
        title: "☀️ Twój plan dnia", body: parts.join(" · "), tag: "brief",
        url: `/calendar?date=${day}`, grace: 4 * HOUR,
      });
    }
  }

  // ── Streak in danger (20:00 when nothing done today) ─────────────────────
  if (prefs.streakReminder && input.streak > 0 && input.completedToday === 0) {
    push({
      key: `streak-${today}`, kind: "streak", fireAt: atTime(today, "20:00"),
      title: "🔥 Seria w niebezpieczeństwie",
      body: `Masz serię ${input.streak} ${plural(input.streak, "dnia", "dni", "dni")}. Jedno zadanie wystarczy, by ją utrzymać.`,
      tag: "streak", url: "/tasks", grace: 2 * HOUR,
    });
  }

  // ── Habits not done today ────────────────────────────────────────────────
  if (prefs.habitReminder) {
    const pending = habits.filter((h) => h.frequency === "daily" && !h.completions.includes(today));
    if (pending.length) {
      push({
        key: `habit-${today}`, kind: "habit", fireAt: atTime(today, prefs.habitReminderTime),
        title: "🌱 Nawyki czekają",
        body: pending.slice(0, 3).map((h) => `${h.emoji} ${h.name}`).join(", ") +
          (pending.length > 3 ? ` i ${pending.length - 3} więcej` : ""),
        tag: "habits", url: "/habits", grace: 3 * HOUR,
      });
    }
  }

  // ── Focus timer end ──────────────────────────────────────────────────────
  if (prefs.focusAlerts && input.focusEndAt && input.focusEndAt > now) {
    const isWork = input.focusMode === "work";
    push({
      key: `focus-${input.focusEndAt}`, kind: "focus", fireAt: input.focusEndAt,
      title: isWork ? "✅ Sesja skupienia zakończona" : "⏱ Koniec przerwy",
      body: isWork ? "Świetna robota! Czas na krótką przerwę." : "Wracamy do pracy — następna sesja czeka.",
      tag: "focus", url: "/focus", requireInteraction: true, vibrate: [120, 80, 120, 80, 260],
      grace: 30 * 60_000,
    });
  }

  return out.sort((a, b) => a.fireAt - b.fireAt);
}
