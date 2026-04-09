import { useMemo } from "react";
import { motion }        from "framer-motion";
import { useStats }      from "../hooks/useStats";
import { useTaskStore }  from "../stores/useTaskStore";

const DAY_LABELS_FULL = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

interface Props {
  onClose: () => void;
}

export default function WeeklyReview({ onClose }: Props) {
  const { streak, weeklyData, totalCompleted } = useStats();
  const tasks = useTaskStore((s) => s.tasks);

  // Completed this week (sum of last 7 days)
  const weeklyCount = weeklyData.reduce((sum, d) => sum + d.count, 0);

  // Active (non-completed) tasks
  const activeTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);

  // Best day this week
  const bestDay = useMemo(() => {
    const max = weeklyData.reduce((best, d) => (d.count > best.count ? d : best), weeklyData[0]);
    return max && max.count > 0 ? max : null;
  }, [weeklyData]);

  // Max bar height scaling
  const maxBarCount = Math.max(...weeklyData.map((d) => d.count), 1);

  // Current date string
  const dateStr = new Date().toLocaleDateString("pl-PL", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
  });
  const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  // Active tasks message
  function getActiveMessage(count: number): string {
    if (count === 0) return "Wszystkie zadania ukończone! 🎉";
    if (count === 1) return "1 zadanie do ukończenia";
    if (count < 5)   return `${count} zadania do ukończenia`;
    return `${count} zadań do ukończenia`;
  }

  return (
    <motion.div
      className="weekly-review"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.45 }}
    >
      {/* Ambient glows */}
      <div className="weekly-review__glow weekly-review__glow--top"    aria-hidden="true" />
      <div className="weekly-review__glow weekly-review__glow--bottom" aria-hidden="true" />

      {/* Calendar icon */}
      <motion.div
        className="weekly-review__icon"
        animate={{
          y:       [0, -6, 0],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        📅
      </motion.div>

      {/* Title */}
      <motion.h2
        className="weekly-review__title"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        Przegląd tygodnia
      </motion.h2>

      <motion.p
        className="weekly-review__date"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
      >
        {dateFormatted}
      </motion.p>

      {/* KPI cards */}
      <motion.div
        className="weekly-review__kpis"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.26 }}
      >
        <div className="weekly-review__kpi">
          <span className="weekly-review__kpi-val">{weeklyCount}</span>
          <span className="weekly-review__kpi-label">Ten tydzień</span>
        </div>

        <div className="weekly-review__kpi">
          <span className="weekly-review__kpi-val">🔥 {streak}</span>
          <span className="weekly-review__kpi-label">Seria dni</span>
        </div>

        <div className="weekly-review__kpi">
          <span className="weekly-review__kpi-val">
            {bestDay ? bestDay.label : "—"}
          </span>
          <span className="weekly-review__kpi-label">Najlepszy dzień</span>
        </div>
      </motion.div>

      {/* Week heatmap */}
      <motion.div
        className="weekly-review__week-grid"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.34 }}
      >
        {weeklyData.map((day, i) => {
          const barHeight = day.count > 0
            ? Math.max(8, Math.round((day.count / maxBarCount) * 56))
            : 8;

          return (
            <div key={day.date} className="weekly-review__day">
              <div
                className="weekly-review__day-bar"
                style={{ height: `${barHeight}px` }}
                aria-label={`${DAY_LABELS_FULL[i]}: ${day.count}`}
              />
              <span className="weekly-review__day-label">
                {DAY_LABELS_FULL[i]}
              </span>
            </div>
          );
        })}
      </motion.div>

      {/* Active tasks pill */}
      <motion.div
        className={`weekly-review__tasks-pill${activeTasks.length === 0 ? " weekly-review__tasks-pill--clear" : ""}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.44, type: "spring", stiffness: 400, damping: 28 }}
      >
        <span className="weekly-review__tasks-icon">
          {activeTasks.length === 0 ? "✅" : "📋"}
        </span>
        <span>{getActiveMessage(activeTasks.length)}</span>
      </motion.div>

      {/* CTA */}
      <motion.button
        className="weekly-review__cta"
        onClick={onClose}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.54, type: "spring", stiffness: 380, damping: 30 }}
      >
        Zacznij nowy tydzień 🚀
      </motion.button>
    </motion.div>
  );
}
