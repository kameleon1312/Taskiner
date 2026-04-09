import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTaskStore } from "../stores/useTaskStore";

const RADIUS = 38;
const CIRC   = 2 * Math.PI * RADIUS; // ≈ 238.76

export default function DailyWidget() {
  const tasks        = useTaskStore((s) => s.tasks);
  const clearCompleted = useTaskStore((s) => s.clearCompleted);

  const total      = tasks.length;
  const completed  = tasks.filter((t) => t.completed).length;
  const active     = total - completed;
  const percent    = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasCompleted = tasks.some((t) => t.completed);

  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    let current = displayPercent;
    const interval = setInterval(() => {
      if (current < percent) { current += 1; setDisplayPercent(current); }
      else if (current > percent) { current -= 1; setDisplayPercent(current); }
      else clearInterval(interval);
    }, 10);
    return () => clearInterval(interval);
  }, [percent]);

  if (total === 0) return null;

  const offset = CIRC * (1 - percent / 100);

  return (
    <motion.div
      className="daily-ring"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Circular ring SVG */}
      <div className="daily-ring__chart">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--success)" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx="48" cy="48" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <motion.circle
            cx="48" cy="48" r={RADIUS}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{ transform: "rotate(-90deg)", transformOrigin: "48px 48px" }}
          />
        </svg>

        {/* Center label */}
        <div className="daily-ring__center">
          <motion.span
            className="daily-ring__pct"
            key={displayPercent}
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            {displayPercent}%
          </motion.span>
          <span className="daily-ring__sub">ukończono</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="daily-ring__stats">
        <div className="daily-ring__stat">
          <span className="daily-ring__val">{active}</span>
          <span className="daily-ring__key">aktywnych</span>
        </div>

        <div className="daily-ring__divider" />

        <div className="daily-ring__stat">
          <span className="daily-ring__val daily-ring__val--done">{completed}</span>
          <span className="daily-ring__key">ukończonych</span>
        </div>

        {hasCompleted && (
          <button
            className="daily-ring__clear"
            onClick={clearCompleted}
            title="Usuń ukończone zadania"
          >
            Usuń ✕
          </button>
        )}
      </div>
    </motion.div>
  );
}
