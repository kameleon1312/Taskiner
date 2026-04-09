import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import confetti from "canvas-confetti";
import { useTaskStore }  from "../stores/useTaskStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import { useUIStore }    from "../stores/useUIStore";
import type { Task } from "../types";
import { PRIORITY_CONFIG } from "../utils/constants";

const SWIPE_THRESHOLD = 75;

interface Props {
  task:  Task;
  index?: number;
  dragHandleListeners?:   Record<string, unknown>;
  dragHandleAttributes?:  Record<string, unknown>;
}

const TaskItem = React.memo(function TaskItem({
  task,
  index = 0,
  dragHandleListeners,
  dragHandleAttributes,
}: Props) {
  const { toggleTask, deleteTask, toggleSubtask } = useTaskStore();
  const { categories }             = useCategoryStore();
  const setSelectedTaskId          = useUIStore((s) => s.setSelectedTaskId);

  const [justCompleted, setJustCompleted] = useState(false);
  const [expanded,      setExpanded]      = useState(false);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress    = useRef(false);

  const completeSound  = useRef<HTMLAudioElement | null>(null);
  const deadlineSound  = useRef<HTMLAudioElement | null>(null);
  const checkboxRef    = useRef<HTMLButtonElement>(null);
  const alertPlayedRef = useRef(false);

  // Swipe motion values
  const x               = useMotionValue(0);
  const completeOpacity = useTransform(x, [0, SWIPE_THRESHOLD],  [0, 1]);
  const deleteOpacity   = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  useEffect(() => {
    const complete = new Audio("/sounds/complete.wav");
    const deadline = new Audio("/sounds/deadline.wav");
    complete.volume = 0.4;
    deadline.volume = 0.35;
    completeSound.current = complete;
    deadlineSound.current = deadline;
    return () => {
      complete.pause();
      complete.src = "";
      deadline.pause();
      deadline.src = "";
    };
  }, []);

  useEffect(() => {
    return () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };
  }, []);

  // Deadline status
  const today        = new Date();
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  let statusColor    = "";
  if (deadlineDate) {
    if (deadlineDate.toDateString() === today.toDateString()) statusColor = "today";
    else if (deadlineDate < today)                            statusColor = "overdue";
    else                                                      statusColor = "upcoming";
  }

  useEffect(() => {
    if (statusColor === "overdue" && !task.completed && !alertPlayedRef.current) {
      try {
        if (deadlineSound.current) {
          deadlineSound.current.currentTime = 0;
          deadlineSound.current.play();
        }
      } catch {
        // autoplay blocked — ignore
      }
      alertPlayedRef.current = true;
    }
  }, [statusColor, task]);

  const fireConfetti = () => {
    const rect = checkboxRef.current?.getBoundingClientRect();
    if (!rect) return;
    confetti({
      particleCount: 55,
      spread: 60,
      startVelocity: 28,
      decay: 0.88,
      scalar: 0.9,
      origin: {
        x: (rect.left + rect.width / 2)  / window.innerWidth,
        y: (rect.top  + rect.height / 2) / window.innerHeight,
      },
      colors: ["#818cf8", "#34d399", "#fbbf24", "#ffffff", "#a78bfa"],
      zIndex: 9999,
    });
  };

  const handlePointerDown = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      navigator.vibrate?.(40);
      setSelectedTaskId(task.id);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTextAreaClick = () => {
    if (isLongPress.current) { isLongPress.current = false; return; }
    setExpanded((v) => !v);
  };

  const handleToggle = () => {
    if (!task.completed) {
      fireConfetti();
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 650);
      navigator.vibrate?.(9);
      try {
        if (completeSound.current) {
          completeSound.current.currentTime = 0;
          completeSound.current.play();
        }
      } catch (e) {}
    } else {
      navigator.vibrate?.(4);
    }
    toggleTask(task.id);
  };

  const priority     = task.priority || "normal";
  const priorityConf = PRIORITY_CONFIG[priority];
  const category     = categories.find((c) => c.id === task.categoryId);
  const subtasks     = task.subtasks || [];
  const completedSubs = subtasks.filter((s) => s.completed).length;
  const hasNotes     = Boolean(task.notes && task.notes.trim());

  return (
    <motion.div
      className="task-swipe-wrap"
      layout
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.91, y: -8, transition: { duration: 0.18 } }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 32,
        delay: Math.min(index * 0.05, 0.25),
      }}
    >
      {/* Swipe hint — complete (right) */}
      <motion.div className="swipe-hint swipe-hint--complete" style={{ opacity: completeOpacity }}>
        <span>✔</span>
        <span className="swipe-hint__label">Ukończ</span>
      </motion.div>

      {/* Swipe hint — delete (left) */}
      <motion.div className="swipe-hint swipe-hint--delete" style={{ opacity: deleteOpacity }}>
        <span className="swipe-hint__label">Usuń</span>
        <span>✕</span>
      </motion.div>

      {/* Draggable task card */}
      <motion.li
        className={`task-item ${task.completed ? "done" : ""} ${statusColor}`}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        animate={{
          boxShadow: justCompleted
            ? "0 0 24px rgba(52, 211, 153, 0.4), 0 0 0 1px rgba(52, 211, 153, 0.2)"
            : "0 0 0px rgba(52, 211, 153, 0)",
        }}
        transition={{ duration: 0.5 }}
        style={{
          x,
          position: "relative",
          zIndex: 1,
          "--priority-color": priorityConf.color,
        } as React.CSSProperties}
        onDragStart={cancelLongPress}
        onDragEnd={(_, info) => {
          if (info.offset.x > SWIPE_THRESHOLD)       handleToggle();
          else if (info.offset.x < -SWIPE_THRESHOLD) deleteTask(task.id);
        }}
        whileDrag={{ cursor: "grabbing" }}
      >
        {/* Drag handle */}
        {dragHandleListeners && (
          <button
            className="task-drag-handle"
            {...dragHandleListeners}
            {...dragHandleAttributes}
            aria-label="Przeciągnij aby zmienić kolejność"
            tabIndex={-1}
          >
            ⠿
          </button>
        )}

        {/* Checkbox */}
        <button
          ref={checkboxRef}
          className="checkbox"
          aria-pressed={task.completed}
          onClick={handleToggle}
          title={task.completed ? "Oznacz jako nieukończone" : "Ukończ"}
        >
          <AnimatePresence mode="wait">
            {task.completed ? (
              <motion.span
                key="check"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
              >
                ✔
              </motion.span>
            ) : null}
          </AnimatePresence>
        </button>

        {/* Content — tap to expand, long press to edit */}
        <div
          className="text-area"
          onClick={handleTextAreaClick}
          onPointerDown={handlePointerDown}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          style={{ cursor: "pointer" }}
        >
          {/* Title row */}
          <div className="task-header">
            <span
              className="priority-dot"
              style={{ background: priorityConf.color }}
              title={priorityConf.label}
            />
            <span className="text">
              {task.text}
            </span>
            {task.recurring && (
              <span className="recurring-badge" title={`Powtarza się: ${task.recurring}`}>
                🔁
              </span>
            )}
            {hasNotes && (
              <span className="notes-indicator" title="Ma notatkę">📝</span>
            )}
          </div>

          {/* Meta: category + deadline */}
          {(category || task.deadline) && (
            <div className="task-meta">
              {category && (
                <span
                  className="category-chip"
                  style={{
                    background: `${category.color}22`,
                    color: category.color,
                    border: `1px solid ${category.color}55`,
                  }}
                >
                  {category.emoji} {category.name}
                </span>
              )}
              {task.deadline && (
                <span className={`deadline ${statusColor}`}>
                  📅{" "}
                  {new Date(task.deadline).toLocaleString("pl-PL", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              )}
            </div>
          )}

          {/* Subtask progress bar (read-only visual) */}
          {subtasks.length > 0 && (
            <div className="subtask-progress-mini">
              <span className="subtask-toggle__bar">
                <span
                  className="subtask-toggle__fill"
                  style={{ width: `${(completedSubs / subtasks.length) * 100}%` }}
                />
              </span>
              <span className="subtask-progress-mini__label">
                {completedSubs}/{subtasks.length}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="task-actions">
          <motion.button
            className="task-edit-btn"
            onClick={(e) => { e.stopPropagation(); setSelectedTaskId(task.id); }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            title="Edytuj zadanie"
          >
            ✏️
          </motion.button>
          <motion.button
            className="remove"
            onClick={(e) => { e.stopPropagation(); navigator.vibrate?.(12); deleteTask(task.id); }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            title="Usuń zadanie"
          >
            ✕
          </motion.button>
        </div>

        {/* Inline expand — notes + subtasks */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              className="task-expand"
              key="expand"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: "hidden" }}
              onClick={(e) => e.stopPropagation()}
            >
              {hasNotes && (
                <p className="task-expand__notes">{task.notes}</p>
              )}
              {subtasks.length > 0 && (
                <div className="task-expand__subtasks">
                  {subtasks.map((s) => (
                    <button
                      key={s.id}
                      className={`task-expand__subtask${s.completed ? " done" : ""}`}
                      onClick={(e) => { e.stopPropagation(); toggleSubtask(task.id, s.id); }}
                      type="button"
                    >
                      <span className="task-expand__sub-check">{s.completed ? "✔" : ""}</span>
                      <span>{s.text}</span>
                    </button>
                  ))}
                </div>
              )}
              {!hasNotes && subtasks.length === 0 && (
                <p className="task-expand__empty">Brak notatek ani podzadań</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.li>
    </motion.div>
  );
});

export default TaskItem;
