import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore }    from "../stores/useTaskStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import SubtaskList from "./SubtaskList";
import type { Priority, Recurring } from "../types";
import { PRIORITY_CONFIG } from "../utils/constants";

const RECURRING_OPTS: { value: Recurring | null; label: string }[] = [
  { value: null,      label: "Brak"        },
  { value: "daily",   label: "📅 Dziennie"  },
  { value: "weekly",  label: "📆 Tygodn."   },
  { value: "monthly", label: "🗓️ Miesięcz." },
];

function toLocalDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function toLocalTimeStr(d: Date): string {
  return [
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
  ].join(":");
}

interface Props {
  taskId: number;
  onClose: () => void;
}

export default function TaskDetailSheet({ taskId, onClose }: Props) {
  const task             = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  const { updateTaskFields, toggleTask, deleteTask } = useTaskStore();
  const { categories }   = useCategoryStore();

  const [titleVal, setTitleVal] = useState(task?.text ?? "");
  const [notesVal, setNotesVal] = useState(task?.notes ?? "");
  const [dateVal,  setDateVal]  = useState(() =>
    task?.deadline ? toLocalDateStr(new Date(task.deadline)) : ""
  );
  const [timeVal, setTimeVal]   = useState(() =>
    task?.deadline ? toLocalTimeStr(new Date(task.deadline)) : ""
  );

  // Sync if task id changes
  useEffect(() => {
    if (!task) return;
    setTitleVal(task.text);
    setNotesVal(task.notes ?? "");
    if (task.deadline) {
      const d = new Date(task.deadline);
      setDateVal(toLocalDateStr(d));
      setTimeVal(toLocalTimeStr(d));
    } else {
      setDateVal("");
      setTimeVal("");
    }
  }, [taskId]);

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
    if (!newDate) {
      updateTaskFields(task.id, { deadline: null });
    } else {
      const iso = `${newDate}T${newTime || "00:00"}:00`;
      updateTaskFields(task.id, { deadline: iso });
    }
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
                const deadline = task.deadline
                  ? `\nTermin: ${new Date(task.deadline).toLocaleDateString("pl-PL")}`
                  : "";
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
              />
            </div>
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

          {/* Delete */}
          <button
            className="sheet__delete-btn"
            onClick={() => { navigator.vibrate?.(18); deleteTask(task.id); onClose(); }}
          >
            🗑️ Usuń zadanie
          </button>

          <div className="sheet__bottom-space" />
        </div>
      </motion.div>
    </>
  );
}
