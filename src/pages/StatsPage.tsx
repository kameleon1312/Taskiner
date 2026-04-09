import React from "react";
import { motion } from "framer-motion";
import { useStats } from "../hooks/useStats";
import type { CatDistItem } from "../hooks/useStats";
import { useFocusStore } from "../stores/useFocusStore";
import { useCategoryStore } from "../stores/useCategoryStore";

const fadeUp = (delay: number) => ({
  initial:    { opacity: 0, y: 14 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay, ease: "easeOut" as const },
});

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100, 200, 365];

const DONUT_R    = 36;
const DONUT_CIRC = 2 * Math.PI * DONUT_R; // ≈ 226.19

function StreakHero({ streak, longestStreak }: { streak: number; longestStreak: number }) {
  const next = STREAK_MILESTONES.find((m) => m > streak) ?? streak + 1;
  const progress = Math.min((streak / next) * 100, 100);
  const daysLeft = next - streak;

  return (
    <motion.div className="stats-streak" {...fadeUp(0.05)}>
      <div className="stats-streak__top">
        <div className="stats-streak__left">
          <motion.span
            className="stats-streak__fire"
            animate={{ scale: [1, 1.14, 1], rotate: [-5, 5, -3, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            🔥
          </motion.span>
          <div>
            <div className="stats-streak__count">{streak}</div>
            <div className="stats-streak__unit">
              {streak === 1 ? "dzień z rzędu" : "dni z rzędu"}
            </div>
          </div>
        </div>

        <div className="stats-streak__record">
          <span className="stats-streak__record-lbl">🏆 Rekord</span>
          <span className="stats-streak__record-val">{longestStreak}</span>
        </div>
      </div>

      {streak > 0 && (
        <div className="stats-streak__progress-wrap">
          <div className="stats-streak__progress-track">
            <motion.div
              className="stats-streak__progress-fill"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            />
          </div>
          <span className="stats-streak__progress-lbl">
            {daysLeft === 0
              ? `🎯 Cel ${next} dni osiągnięty!`
              : `${daysLeft} ${daysLeft === 1 ? "dzień" : "dni"} do celu ${next}`}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function KpiCard({
  value,
  label,
  icon,
  color,
  delay,
}: {
  value: string | number;
  label: string;
  icon: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div className="stats-kpi-card" {...fadeUp(delay)}>
      <span className="stats-kpi-card__icon">{icon}</span>
      <span className="stats-kpi-card__value" style={{ color }}>
        {value}
      </span>
      <span className="stats-kpi-card__label">{label}</span>
    </motion.div>
  );
}

function Heatmap12w({ data }: { data: Array<{ date: string; count: number }> }) {
  const rowLabels = ["Pn", "", "Śr", "", "Pt", "", "Nd"];

  const getLevel = (count: number): number => {
    if (count < 0) return -1; // future
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3)  return 2;
    if (count <= 6)  return 3;
    return 4;
  };

  return (
    <motion.div className="stats-section" {...fadeUp(0.25)}>
      <h3 className="stats-section__title">Aktywność · 12 tygodni</h3>

      <div className="heatmap-12w">
        {/* Day labels */}
        <div className="heatmap-12w__day-labels">
          {rowLabels.map((lbl, i) => (
            <span key={i} className="heatmap-12w__day-lbl">{lbl}</span>
          ))}
        </div>

        {/* Cell grid — grid-auto-flow: column fills Mon→Sun per column */}
        <div className="heatmap-12w__grid">
          {data.map((day, i) => {
            const lvl = getLevel(day.count);
            return (
              <div
                key={i}
                className={`heatmap-12w__cell${lvl >= 0 ? ` heatmap-12w__cell--l${lvl}` : " heatmap-12w__cell--future"}`}
                title={lvl >= 0 && day.count >= 0 ? `${day.date}: ${day.count}` : ""}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="heatmap-12w__legend">
        <span className="heatmap-12w__legend-lbl">Mniej</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={`heatmap-12w__cell heatmap-12w__cell--l${l}`} style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0 }} />
        ))}
        <span className="heatmap-12w__legend-lbl">Więcej</span>
      </div>
    </motion.div>
  );
}

function WeeklyChart({ weeklyData }: { weeklyData: ReturnType<typeof useStats>["weeklyData"] }) {
  const maxVal = Math.max(...weeklyData.map((d) => d.count), 1);
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <motion.div className="stats-section" {...fadeUp(0.35)}>
      <h3 className="stats-section__title">Ostatnie 7 dni</h3>
      <div className="stats-chart">
        {weeklyData.map((day, i) => (
          <motion.div
            key={day.date}
            className="stats-chart__col"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 + i * 0.055 }}
          >
            <span className="stats-chart__count">{day.count > 0 ? day.count : ""}</span>
            <div className="stats-chart__bar-wrap">
              <motion.div
                className={[
                  "stats-chart__bar",
                  day.max         ? "stats-chart__bar--max"   : "",
                  day.date === todayKey ? "stats-chart__bar--today" : "",
                ].join(" ")}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: day.count > 0 ? day.count / maxVal : 0.03 }}
                transition={{ duration: 0.55, delay: 0.5 + i * 0.055, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ transformOrigin: "bottom" }}
              />
            </div>
            <span className={`stats-chart__label${day.date === todayKey ? " stats-chart__label--today" : ""}`}>
              {day.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function CategoryDonut({ cats }: { cats: CatDistItem[] }) {
  if (cats.length < 2) return null;

  const total = cats.reduce((s, c) => s + c.count, 0);

  let accumulated = 0;
  const segments = cats.map((c) => {
    const dash   = (c.count / total) * DONUT_CIRC;
    const offset = DONUT_CIRC - accumulated;
    accumulated += dash;
    return { ...c, dash, offset };
  });

  return (
    <motion.div className="stats-section" {...fadeUp(0.45)}>
      <h3 className="stats-section__title">Kategorie</h3>
      <div className="stats-donut">
        {/* SVG ring */}
        <div className="stats-donut__wrap">
          <svg width="96" height="96" viewBox="0 0 96 96">
            {/* Track */}
            <circle cx="48" cy="48" r={DONUT_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
            {/* Segments */}
            {segments.map((seg, i) => (
              <motion.circle
                key={i}
                cx="48" cy="48" r={DONUT_R}
                fill="none"
                stroke={seg.color}
                strokeWidth="9"
                strokeLinecap="butt"
                strokeDashoffset={seg.offset}
                style={{ transform: "rotate(-90deg)", transformOrigin: "48px 48px" }}
                initial={{ strokeDasharray: `0 ${DONUT_CIRC}` }}
                animate={{ strokeDasharray: `${seg.dash} ${DONUT_CIRC}` }}
                transition={{ duration: 0.65, delay: 0.5 + i * 0.1, ease: "easeOut" }}
              />
            ))}
          </svg>
          {/* Center label */}
          <div className="stats-donut__center">
            <span className="stats-donut__total">{total}</span>
            <span className="stats-donut__total-lbl">zadań</span>
          </div>
        </div>

        {/* Legend */}
        <div className="stats-donut__legend">
          {cats.map((c, i) => (
            <motion.div
              key={i}
              className="stats-donut__legend-row"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.55 + i * 0.07 }}
            >
              <span className="stats-donut__dot" style={{ background: c.color }} />
              <span className="stats-donut__cat-name">{c.emoji} {c.name}</span>
              <span className="stats-donut__cat-pct">{c.percent}%</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function PeakHours({ data }: { data: number[] }) {
  const hasData = data.some((v) => v > 0);
  if (!hasData) return null;

  const maxVal  = Math.max(...data, 1);
  const peakHour = data.indexOf(Math.max(...data));

  const barColor = (h: number): string => {
    if (h >= 6  && h < 12) return "#fbbf24"; // morning amber
    if (h >= 12 && h < 18) return "#818cf8"; // afternoon indigo
    if (h >= 18 && h < 23) return "#a78bfa"; // evening violet
    return "#475569";                         // night slate
  };

  return (
    <motion.div className="stats-section" {...fadeUp(0.55)}>
      <h3 className="stats-section__title">Godziny szczytowe</h3>
      <div className="stats-hours">
        <div className="stats-hours__bars">
          {data.map((val, h) => (
            <motion.div
              key={h}
              className="stats-hours__bar"
              title={val > 0 ? `${h}:00 — ${val} ukończonych` : ""}
              style={{
                background: barColor(h),
                transformOrigin: "bottom",
                opacity: val === 0 ? 0.1 : 0.3 + (val / maxVal) * 0.7,
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: Math.max(val / maxVal, 0.05) }}
              transition={{ duration: 0.45, delay: 0.3 + h * 0.014, ease: "easeOut" }}
            />
          ))}
        </div>
        <div className="stats-hours__time-row">
          {["0h", "6h", "12h", "18h", "23h"].map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <p className="stats-hours__peak-note">
          Szczyt: <strong>{peakHour}:00–{peakHour + 1}:00</strong>
          <span> · {data[peakHour]} ukończonych</span>
        </p>
      </div>
    </motion.div>
  );
}

function InsightPill({ icon, text }: { icon: string; text: React.ReactNode }) {
  return (
    <motion.div className="stats-insight" {...fadeUp(0.65)}>
      <span className="stats-insight__icon">{icon}</span>
      <p className="stats-insight__text">{text}</p>
    </motion.div>
  );
}

function fmtMins(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

function DeepWorkSection() {
  const sessions    = useFocusStore((s) => s.sessions);
  const { categories } = useCategoryStore();
  const weekAgo     = Date.now() - 7 * 86400000;
  const weekSess    = sessions.filter((s) => new Date(s.startedAt).getTime() > weekAgo);
  const weekMinutes = weekSess.reduce((sum, s) => sum + s.minutes, 0);

  if (weekSess.length === 0) return null;

  // aggregate by task
  const byTask: Record<string, { text: string; minutes: number }> = {};
  for (const s of weekSess) {
    if (!s.taskText) continue;
    const key = String(s.taskId ?? s.taskText);
    if (!byTask[key]) byTask[key] = { text: s.taskText, minutes: 0 };
    byTask[key].minutes += s.minutes;
  }
  const topTasks = Object.values(byTask).sort((a, b) => b.minutes - a.minutes).slice(0, 5);

  // aggregate by category
  const byCat: Record<number, { minutes: number }> = {};
  for (const s of weekSess) {
    if (s.categoryId == null) continue;
    if (!byCat[s.categoryId]) byCat[s.categoryId] = { minutes: 0 };
    byCat[s.categoryId].minutes += s.minutes;
  }
  const topCat = Object.entries(byCat)
    .map(([id, v]) => ({ cat: categories.find((c) => c.id === Number(id)), ...v }))
    .filter((x) => x.cat)
    .sort((a, b) => b.minutes - a.minutes)[0] ?? null;

  return (
    <motion.div className="stats-section" {...fadeUp(0.62)}>
      <h3 className="stats-section__title">Głęboka praca · 7 dni</h3>
      <div className="stats-deep">

        {/* Summary row */}
        <div className="stats-deep__summary">
          <div className="stats-deep__stat">
            <span className="stats-deep__stat-val">{fmtMins(weekMinutes)}</span>
            <span className="stats-deep__stat-lbl">skupienia</span>
          </div>
          <div className="stats-deep__stat">
            <span className="stats-deep__stat-val">{weekSess.length}</span>
            <span className="stats-deep__stat-lbl">
              {weekSess.length === 1 ? "sesja" : weekSess.length < 5 ? "sesje" : "sesji"}
            </span>
          </div>
        </div>

        {/* Category insight pill */}
        {topCat && (
          <motion.div
            className="stats-deep__insight"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <span className="stats-deep__insight-icon">{topCat.cat!.emoji}</span>
            <span className="stats-deep__insight-text">
              Spędziłeś <strong>{fmtMins(topCat.minutes)}</strong> na kategorii{" "}
              <strong style={{ color: topCat.cat!.color }}>{topCat.cat!.name}</strong>
            </span>
          </motion.div>
        )}

        {/* Top tasks breakdown */}
        {topTasks.length > 0 && (
          <div className="stats-deep__tasks">
            {topTasks.map((t, i) => {
              const pct = Math.round((t.minutes / weekMinutes) * 100);
              return (
                <motion.div
                  key={i}
                  className="stats-deep__task-row"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.07 }}
                >
                  <span className="stats-deep__task-name">{t.text}</span>
                  <div className="stats-deep__task-bar-wrap">
                    <motion.div
                      className="stats-deep__task-bar"
                      initial={{ width: "0%" }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: 0.75 + i * 0.07, ease: "easeOut" }}
                    />
                  </div>
                  <span className="stats-deep__task-mins">{fmtMins(t.minutes)}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function StatsPage() {
  const stats = useStats();
  const isEmpty = stats.totalCompleted === 0;

  return (
    <div className="app">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

        <motion.div className="stats-page-header" {...fadeUp(0)}>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Statystyki</h1>
          {stats.activeDaysCount > 0 && (
            <p className="stats-page-header__sub">
              {stats.activeDaysCount} aktywnych {stats.activeDaysCount === 1 ? "dzień" : "dni"} · {stats.totalCompleted} ukończonych
            </p>
          )}
        </motion.div>

        {isEmpty && (
          <motion.div className="stats-empty" {...fadeUp(0.3)}>
            <motion.div
              className="stats-empty__icon"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              📊
            </motion.div>
            <p className="stats-empty__title">Brak danych</p>
            <p className="stats-empty__hint">Ukończ kilka zadań, żeby zobaczyć swoje statystyki!</p>
          </motion.div>
        )}

        {!isEmpty && (
          <>
            <StreakHero streak={stats.streak} longestStreak={stats.longestStreak} />

            <div className="stats-kpi-grid">
              <KpiCard value={stats.totalCompleted}       label="Ukończonych"  icon="✅" color="var(--accent)"  delay={0.1}  />
              <KpiCard value={`${stats.completionRate}%`} label="Skuteczność"  icon="🎯" color="var(--success)" delay={0.15} />
              <KpiCard value={stats.avgPerActiveDay}      label="Śr. / dzień"  icon="⚡" color="#fbbf24"        delay={0.2}  />
              <KpiCard value={stats.activeDaysCount}      label="Aktywne dni"  icon="📅" color="var(--muted)"  delay={0.25} />
            </div>

            <Heatmap12w data={stats.heatmap12w} />
            <WeeklyChart weeklyData={stats.weeklyData} />
            <CategoryDonut cats={stats.categoryDistribution} />
            <PeakHours data={stats.hourlyData} />
            <DeepWorkSection />

            {stats.bestDayOfWeek && (
              <InsightPill
                icon="💡"
                text={
                  <>
                    Najbardziej produktywny dzień:{" "}
                    <strong>{stats.bestDayOfWeek.label}</strong>
                    <span className="stats-insight__muted">
                      {" "}(~{stats.bestDayOfWeek.avg} ukończonych)
                    </span>
                  </>
                }
              />
            )}
          </>
        )}

      </motion.div>
    </div>
  );
}
