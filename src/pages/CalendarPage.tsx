import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "../stores/useTaskStore";
import type { Task } from "../types";

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];
const DAY_NAMES = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "N"];

// Use LOCAL date parts — avoids UTC offset shifting day by 1 in UTC+1/+2
function toDateKey(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function CalendarPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const today = new Date();
  const todayKey = toDateKey(today);

  const [year, setYear]           = useState(today.getFullYear());
  const [month, setMonth]         = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Build task map: date -> task[] (local date key, consistent with calendar cells)
  const tasksByDay = new Map<string, Task[]>();
  tasks.forEach((t) => {
    if (t.deadline) {
      const key = toDateKey(new Date(t.deadline));
      if (!tasksByDay.has(key)) tasksByDay.set(key, []);
      tasksByDay.get(key)!.push(t);
    }
  });

  // Build calendar cells (Mon-first grid)
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1; // convert Mon=0

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const selectedTasks = selectedDay ? (tasksByDay.get(selectedDay) || []) : [];

  return (
    <div className="app">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="page-title">Kalendarz</h1>

        {/* Month navigation */}
        <div className="cal-header">
          <button className="cal-nav-btn" onClick={prevMonth} aria-label="Poprzedni miesiąc">
            ‹
          </button>
          <span className="cal-month-label">
            {MONTH_NAMES[month]} {year}
          </span>
          <button className="cal-nav-btn" onClick={nextMonth} aria-label="Następny miesiąc">
            ›
          </button>
        </div>

        {/* Day-of-week header */}
        <div className="cal-grid cal-grid--header">
          {DAY_NAMES.map((d) => (
            <div key={d} className="cal-day-name">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="cal-grid">
          {cells.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="cal-cell cal-cell--empty" />;
            const key = toDateKey(date);
            const dayTasks = tasksByDay.get(key) || [];
            const isToday    = key === todayKey;
            const isSelected = key === selectedDay;
            const doneCount  = dayTasks.filter((t) => t.completed).length;
            const pendCount  = dayTasks.length - doneCount;

            return (
              <button
                key={key}
                className={[
                  "cal-cell",
                  isToday    ? "cal-cell--today"    : "",
                  isSelected ? "cal-cell--selected" : "",
                  dayTasks.length > 0 ? "cal-cell--has-tasks" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedDay(isSelected ? null : key)}
              >
                <span className="cal-cell__num">{date.getDate()}</span>
                {dayTasks.length > 0 && (
                  <div className="cal-cell__dots">
                    {doneCount > 0 && <span className="cal-dot cal-dot--done" />}
                    {pendCount > 0 && <span className="cal-dot cal-dot--pending" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected-day task panel */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              className="cal-day-panel"
              key={selectedDay}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
            >
              <h3 className="cal-day-panel__title">
                {new Date(selectedDay + "T12:00:00").toLocaleDateString("pl-PL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>

              {selectedTasks.length === 0 ? (
                <p className="cal-day-panel__empty">Brak zadań na ten dzień</p>
              ) : (
                <ul className="cal-day-panel__list">
                  {selectedTasks.map((t) => (
                    <li
                      key={t.id}
                      className={`cal-day-panel__item ${
                        t.completed ? "cal-day-panel__item--done" : ""
                      }`}
                    >
                      <span
                        className={`cal-day-panel__bullet ${
                          t.completed ? "cal-day-panel__bullet--done" : ""
                        }`}
                      />
                      <span className="cal-day-panel__text">{t.text}</span>
                      {t.deadline && (
                        <span className="cal-day-panel__time">
                          {new Date(t.deadline).toLocaleTimeString("pl-PL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
