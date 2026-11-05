import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore }    from "../stores/useTaskStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import SubtaskList from "./SubtaskList";
import type { Priority, Recurring } from "../types";
import { PRIORITY_CONFIG } from "../utils/constants";
import { useUIStore } from "../stores/useUIStore";
import { useActivityStore } from "../stores/useActivityStore";
import { isAllDay, parseDeadline, makeDeadline, formatDeadline, deadlineStatus } from "../utils/deadline";
import { toDateKey, addDays, fmtTime } from "../utils/dateUtils";
import { googleCalendarUrl, tasksToICS, shareOrDownloadICS } from "../utils/ical";
import { toast } from "../notifications/toastStore";
import { ACTIVITY_META } from "./activity/ActivityTimeline";

const RECURRING_OPTS: { value: Recurring | null; label: string }[] = [
  { value: null,      label: "Brak"        },
  { value: "daily",   label: "📅 Dziennie"  },
  { value: "weekly",  label: "📆 Tygodn."   },
  { value: "monthly", label: "🗓️ Miesięcz." },
];

function splitDeadline(deadline: string | null | undefined): { date: string; time: string } {
  if (!deadline) return { date: "", time: "" };
  if (isAllDay(deadline)) return { date: deadline, time: "" };
  const d = parseDeadline(deadline);
  return { date: toDateKey(d), time: fmtHM(d) };
}

const fmtHM = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const QUICK_DATES: { label: string; days: number }[] = [
  { label: "Dziś",       days: 0 },
  { label: "Jutro",      days: 1 },
  { label: "Za 3 dni",   days: 3 },
  { label: "Za tydzień", days: 7 },
];

interface Props {
  taskId: number;
  onClose: () => void;
}

export default function TaskDetailSheet({ taskId, onClose }: Props) {
  const task             = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  const updateTaskFields = useTaskStore((s) => s.updateTaskFields);
  const rescheduleTask   = useTaskStore((s) => s.rescheduleTask);
  const toggleTask       = useTaskStore((s) => s.toggleTask);
  const deleteTask       = useTaskStore((s) => s.deleteTask);
  const restoreTask      = useTaskStore((s) => s.restoreTask);
  const notifyOffsets    = useUIStore((s) => s.notifyOffsets);
  const allDayTime       = useUIStore((s) => s.allDayTime);
  const taskLog          = useActivityStore((s) => s.entries);
  const { categories }   = useCategoryStore();

  const [titleVal, setTitleVal] = useState(task?.text ?? "");
  const [notesVal, setNotesVal] = useState(task?.notes ?? "");
  const [dateVal,  setDateVal]  = useState(() => splitDeadline(task?.deadline).date);
  const [timeVal,  setTimeVal]  = useState(() => splitDeadline(task?.deadline).time);

  // Sync if task id changes
  useEffect(() => {
    if (!task) return;
    setTitleVal(task.text);
    setNotesVal(task.notes ?? "");
    const parts = splitDeadline(task.deadline);
    setDateVal(parts.date);
    setTimeVal(parts.time);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, task?.deadline]);

  // Close automatically if task is deleted
  useEffect(() => {
    if (!task) onClose();
  }, [task, onClose]);

  // Drag-to-close on handle bar
  const dragStartY  = useRef(0);
  const sheetRef    = useRef<HTMLDivElement>(null);

  const onHandleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const onHandleTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - dragStartY.current;
    if (dy > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  };
  const onHandleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - dragStartY.current;
    if (dy > 90) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
  };

  const saveTitle = () => {
    const t = titleVal.trim();
    if (t && task) updateTaskFields(task.id, { text: t });
    else if (task)  setTitleVal(task.text);
  };

  const saveNotes = () => {
    if (task) updateTaskFields(task.id, { notes: notesVal });
  };

  const applyDeadline = (newDate: string, newTime: string) => {
    if (!task) return;
    // No time → all-day task (reminded at the configured morning hour)
    rescheduleTask(task.id, newDate ? makeDeadline(newDate, newTime || null) : null);
  };

  if (!task) return null;

  const subtasks     = task.subtasks ?? [];
  const doneSubs     = subtasks.filter((s) => s.completed).length;
  const priority     = task.priority ?? "normal";

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="sheet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        ref={sheetRef}
        className="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
      >
        {/* Handle bar — drag zone */}
        <div
          className="sheet__handle-bar"
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
        />

        {/* Top actions */}
        <div className="sheet__top-row">
          <button
            className={`sheet__status-btn ${task.completed ? "done" : ""}`}
            onClick={() => toggleTask(task.id)}
            aria-label={task.completed ? "Oznacz jako nieukończone" : "Ukończ"}
          >
            {task.completed ? "✔" : ""}
          </button>
          <span className="sheet__status-label">
            {task.completed ? "Ukończone" : "Aktywne"}
          </span>
          {"share" in navigator && (
            <button
              className="sheet__share-btn"
              onClick={() => {
                const deadline = task.deadline ? `\nTermin: ${formatDeadline(task.deadline)}` : "";
                const notes = task.notes ? `\n\n${task.notes}` : "";
                navigator.share({
                  title: "Taskiner – zadanie",
                  text:  `${task.text}${deadline}${notes}`,
                }).catch(() => {});
              }}
              aria-label="Udostępnij"
            >
              ↑
            </button>
          )}
          <button
            className="sheet__close-btn"
            onClick={onClose}
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="sheet__body">

          {/* Title */}
          <textarea
            className={`sheet__title-input ${task.completed ? "done" : ""}`}
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveTitle(); (e.target as HTMLTextAreaElement).blur(); } }}
            rows={2}
            placeholder="Tytuł zadania..."
          />

          <div className="sheet__divider" />

          {/* Priority */}
          <div className="sheet__section">
            <p className="sheet__label">Priorytet</p>
            <div className="sheet__priority-row">
              {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => {
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    className={`sheet__priority-btn ${priority === p ? "active" : ""}`}
                    style={{ "--pc": cfg.color } as React.CSSProperties}
                    onClick={() => updateTaskFields(task.id, { priority: p })}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sheet__divider" />

          {/* Category */}
          <div className="sheet__section">
            <p className="sheet__label">Kategoria</p>
            <div className="sheet__chips-row">
              <button
                className={`sheet__chip-btn ${!task.categoryId ? "active" : ""}`}
                onClick={() => updateTaskFields(task.id, { categoryId: null })}
              >
                — Brak
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`sheet__chip-btn ${task.categoryId === cat.id ? "active" : ""}`}
                  style={{ "--cc": cat.color } as React.CSSProperties}
                  onClick={() => updateTaskFields(task.id, { categoryId: cat.id })}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="sheet__divider" />

          {/* Deadline */}
          <div className="sheet__section">
            <div className="sheet__label-row">
              <p className="sheet__label">Termin</p>
              {dateVal && (
                <button
                  className="sheet__link-btn sheet__link-btn--danger"
                  onClick={() => { setDateVal(""); setTimeVal(""); applyDeadline("", ""); }}
                >
                  Usuń
                </button>
              )}
            </div>
            <div className="sheet__datetime-row">
              <input
                type="date"
                className="sheet__date-input"
                value={dateVal}
                onChange={(e) => { setDateVal(e.target.value); applyDeadline(e.target.value, timeVal); }}
              />
              <input
                type="time"
                className="sheet__time-input"
                value={timeVal}
                disabled={!dateVal}
                onChange={(e) => { setTimeVal(e.target.value); applyDeadline(dateVal, e.target.value); }}
                aria-label="Godzina (puste = cały dzień)"
              />
              {timeVal && (
                <button className="sheet__link-btn" onClick={() => { setTimeVal(""); applyDeadline(dateVal, ""); }}>
                  Cały dzień
                </button>
              )}
            </div>
            <div className="sheet__chips-row sheet__chips-row--tight">
              {QUICK_DATES.map((q) => {
                const key = toDateKey(addDays(new Date(), q.days));
                return (
                  <button
                    key={q.label}
                    className={`sheet__chip-btn${dateVal === key ? " active" : ""}`}
                    onClick={() => { setDateVal(key); applyDeadline(key, timeVal); }}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
            {task.deadline && (
              <p className={`sheet__deadline-hint sheet__deadline-hint--${task.completed ? "done" : deadlineStatus(task.deadline)}`}>
                {formatDeadline(task.deadline)}
                {isAllDay(task.deadline) ? ` · przypomnienie o ${allDayTime}` : ""}
              </p>
            )}
            {task.deadline && (
              <div className="sheet__cal-row">
                <a
                  className="sheet__cal-btn"
                  href={googleCalendarUrl(task) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span aria-hidden>📆</span> Google Calendar
                </a>
                <button
                  className="sheet__cal-btn"
                  onClick={async () => {
                    const ics = tasksToICS([task], { categories, alarmOffsets: notifyOffsets, allDayTime, includeCompleted: true });
                    await shareOrDownloadICS(ics, `taskiner-${task.id}.ics`);
                  }}
                >
                  <span aria-hidden>⇪</span> Plik .ics
                </button>
              </div>
            )}
          </div>

          <div className="sheet__divider" />

          {/* Recurring */}
          <div className="sheet__section">
            <p className="sheet__label">Powtarzanie</p>
            <div className="sheet__recurring-row">
              {RECURRING_OPTS.map((opt) => (
                <button
                  key={String(opt.value)}
                  className={`sheet__recurring-btn ${(task.recurring ?? null) === opt.value ? "active" : ""}`}
                  onClick={() => updateTaskFields(task.id, { recurring: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sheet__divider" />

          {/* Notes */}
          <div className="sheet__section">
            <p className="sheet__label">Notatki</p>
            <textarea
              className="sheet__notes-input"
              placeholder="Dodaj notatki, linki, szczegóły..."
              value={notesVal}
              onChange={(e) => setNotesVal(e.target.value)}
              onBlur={saveNotes}
              rows={4}
            />
          </div>

          <div className="sheet__divider" />

          {/* Subtasks */}
          <div className="sheet__section">
            <p className="sheet__label">
              Podzadania
              {subtasks.length > 0 && (
                <span className="sheet__badge">{doneSubs}/{subtasks.length}</span>
              )}
            </p>
            <SubtaskList taskId={task.id} subtasks={subtasks} />
          </div>

          <div className="sheet__divider" />

          {/* History of this task (from the activity journal) */}
          {(() => {
            const hist = taskLog.filter((e) => e.taskId === task.id && e.type !== "reminder").slice(-6).reverse();
            if (!hist.length) return null;
            return (
              <>
                <div className="sheet__section">
                  <p className="sheet__label">Historia</p>
                  <ul className="sheet__history">
                    {hist.map((e) => (
                      <li key={e.id}>
                        <span className="sheet__history-icon">{ACTIVITY_META[e.type].icon}</span>
                        <span className="sheet__history-text">
                          {ACTIVITY_META[e.type].label}{e.detail ? ` · ${e.detail}` : ""}
                        </span>
                        <time>
                          {new Date(e.at).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })} {fmtTime(new Date(e.at))}
                        </time>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="sheet__divider" />
              </>
            );
          })()}

          {/* Delete */}
          <button
            className="sheet__delete-btn"
            onClick={() => {
              navigator.vibrate?.(18);
              const snapshot = task;
              deleteTask(task.id);
              onClose();
              toast({ kind: "info", title: "Usunięto zadanie", body: snapshot.text, undo: () => restoreTask(snapshot), ttl: 5000 });
            }}
          >
            🗑️ Usuń zadanie
          </button>

          <div className="sheet__bottom-space" />
        </div>
      </motion.div>
    </>
  );
}
