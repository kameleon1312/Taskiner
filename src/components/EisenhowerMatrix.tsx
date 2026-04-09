import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useTaskStore } from "../stores/useTaskStore";
import { useUIStore }   from "../stores/useUIStore";
import type { Task } from "../types";

function isUrgentTask(task: Task): boolean {
  if (task.priority === "urgent") return true;
  if (!task.deadline) return false;
  const diffDays = (new Date(task.deadline).getTime() - Date.now()) / 86400000;
  return diffDays <= 3;
}

function isImportantTask(task: Task): boolean {
  return task.priority === "urgent" || task.priority === "high";
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#f87171",
  high:   "#fbbf24",
  normal: "#818cf8",
  low:    "#8892a8",
};

type QuadrantKey = "q1" | "q2" | "q3" | "q4";

// Deadline within 24 h (or overdue) always forces Q1 — overrides manual placement
function isDeadlineCritical(task: Task): boolean {
  if (!task.deadline) return false;
  const diffMs = new Date(task.deadline).getTime() - Date.now();
  return diffMs <= 86_400_000; // ≤24 h or already past
}

// Compute the quadrant for a task
// Priority: critical deadline > manual drag > auto-classification
function getTaskQuadrant(task: Task): QuadrantKey {
  if (isDeadlineCritical(task)) return "q1";
  if (task.eisenhowerQuadrant)  return task.eisenhowerQuadrant;
  const urgent    = isUrgentTask(task);
  const important = isImportantTask(task);
  if ( urgent &&  important) return "q1";
  if (!urgent &&  important) return "q2";
  if ( urgent && !important) return "q3";
  return "q4";
}

interface QuadrantConfig {
  key:      "q1" | "q2" | "q3" | "q4";
  emoji:    string;
  title:    string;
  strategy: string;
  hint:     string;
  accent:   string;
  filter:   (urgent: boolean, important: boolean) => boolean;
}

const QUADRANTS: QuadrantConfig[] = [
  {
    key:      "q1",
    emoji:    "🔴",
    title:    "Zrób teraz",
    strategy: "Pilne i ważne",
    hint:     "Brak pilnych i ważnych zadań",
    accent:   "#f87171",
    filter:   (u, i) => u && i,
  },
  {
    key:      "q2",
    emoji:    "🟡",
    title:    "Zaplanuj",
    strategy: "Ważne, niepilne",
    hint:     "Brak zadań do zaplanowania",
    accent:   "#fbbf24",
    filter:   (u, i) => !u && i,
  },
  {
    key:      "q3",
    emoji:    "🔵",
    title:    "Deleguj",
    strategy: "Pilne, nieważne",
    hint:     "Brak zadań do delegowania",
    accent:   "#60a5fa",
    filter:   (u, i) => u && !i,
  },
  {
    key:      "q4",
    emoji:    "⚫",
    title:    "Eliminuj",
    strategy: "Niepilne i nieważne",
    hint:     "Brak zadań do eliminacji",
    accent:   "#64748b",
    filter:   (u, i) => !u && !i,
  },
];

interface TaskChipProps {
  task:     Task;
  onSelect: (id: number) => void;
  onDone:   (id: number) => void;
  accent:   string;
}

// Draggable task chip
const DraggableTaskChip = React.memo(function DraggableTaskChip({
  task, onSelect, onDone, accent,
}: TaskChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(task.id),
    data: { taskId: task.id },
  });
  const dotColor = PRIORITY_COLORS[task.priority || "normal"];

  return (
    <motion.div
      ref={setNodeRef}
      className="eisenhower__task"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isDragging ? 0.2 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
    >
      <button
        className="eisenhower__task-check"
        style={{ borderColor: accent }}
        onClick={(e) => { e.stopPropagation(); onDone(task.id); }}
        aria-label="Ukończ zadanie"
      />
      <div
        className="eisenhower__task-body"
        role="button"
        tabIndex={0}
        onClick={() => !isDragging && onSelect(task.id)}
        onKeyDown={(e) => { if (e.key === "Enter") onSelect(task.id); }}
      >
        <span className="eisenhower__task-dot" style={{ background: dotColor }} />
        <span className="eisenhower__task-text">{task.text}</span>
      </div>
      {task.deadline && (
        <span className="eisenhower__task-badge">
          {new Date(task.deadline).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
        </span>
      )}
      <span
        className="eisenhower__drag-handle"
        {...attributes}
        {...listeners}
        role="button"
        aria-label="Przeciągnij do innego sektora"
      >
        ⠿
      </span>
    </motion.div>
  );
});

// Compact chip for DragOverlay (no animations, no dnd hooks)
function OverlayChip({ task }: { task: Task }) {
  const dotColor = PRIORITY_COLORS[task.priority || "normal"];
  return (
    <div className="eisenhower__task eisenhower__task--overlay">
      <span className="eisenhower__task-dot" style={{ background: dotColor }} />
      <span className="eisenhower__task-text">{task.text}</span>
    </div>
  );
}

interface QuadrantCardProps {
  config:   QuadrantConfig;
  tasks:    Task[];
  onSelect: (id: number) => void;
  onDone:   (id: number) => void;
}

const QuadrantCard = React.memo(function QuadrantCard({
  config, tasks, onSelect, onDone,
}: QuadrantCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: config.key });

  return (
    <motion.div
      ref={setNodeRef}
      className={`eisenhower__quadrant eisenhower__quadrant--${config.key}${isOver ? " drop-over" : ""}`}
      style={{ "--q-accent": config.accent } as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <button
        className="eisenhower__q-header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className="eisenhower__q-emoji">{config.emoji}</span>
        <div className="eisenhower__q-titles">
          <span className="eisenhower__q-title">{config.title}</span>
          <span className="eisenhower__q-strategy">{config.strategy}</span>
        </div>
        <span className="eisenhower__q-count" style={{ background: `${config.accent}22`, color: config.accent }}>
          {tasks.length}
        </span>
        <motion.span
          className="eisenhower__q-chevron"
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            className="eisenhower__q-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
          >
            {tasks.length === 0 ? (
              <p className="eisenhower__empty">{config.hint}</p>
            ) : (
              <AnimatePresence>
                {tasks.map((task) => (
                  <DraggableTaskChip
                    key={task.id}
                    task={task}
                    accent={config.accent}
                    onSelect={onSelect}
                    onDone={onDone}
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default function EisenhowerMatrix() {
  const tasks             = useTaskStore((s) => s.tasks);
  const toggleTask        = useTaskStore((s) => s.toggleTask);
  const updateTaskFields  = useTaskStore((s) => s.updateTaskFields);
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const activeTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const activeTask  = useMemo(
    () => (activeId ? activeTasks.find((t) => String(t.id) === activeId) ?? null : null),
    [activeTasks, activeId],
  );

  const quadrantTasks = useMemo(() =>
    QUADRANTS.map((config) => ({
      config,
      tasks: activeTasks.filter((t) => getTaskQuadrant(t) === config.key),
    })),
    [activeTasks],
  );

  const totalActive = activeTasks.length;
  const q1Count = quadrantTasks.find((q) => q.config.key === "q1")?.tasks.length ?? 0;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const taskId      = active.data.current?.taskId as number | undefined;
    const quadrantKey = String(over.id) as QuadrantKey;
    if (taskId && QUADRANTS.some((q) => q.key === quadrantKey)) {
      updateTaskFields(taskId, { eisenhowerQuadrant: quadrantKey });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="eisenhower">
        {/* Summary bar */}
        <div className="eisenhower__summary">
          <div className="eisenhower__summary-stat">
            <span className="eisenhower__summary-val">{totalActive}</span>
            <span className="eisenhower__summary-lbl">aktywnych</span>
          </div>
          {q1Count > 0 && (
            <div className="eisenhower__summary-stat eisenhower__summary-stat--urgent">
              <span className="eisenhower__summary-val">{q1Count}</span>
              <span className="eisenhower__summary-lbl">pilnych</span>
            </div>
          )}
          <div className="eisenhower__summary-tip">
            {q1Count === 0
              ? "✅ Brak pilnych zadań"
              : `⚠️ ${q1Count} ${q1Count === 1 ? "zadanie wymaga" : "zadania wymagają"} uwagi`}
          </div>
        </div>

        {/* Axis labels */}
        <div className="eisenhower__axis-row">
          <span className="eisenhower__axis-label eisenhower__axis-label--urgent">⚡ Pilne</span>
          <span className="eisenhower__axis-label eisenhower__axis-label--not-urgent">☁️ Niepilne</span>
        </div>

        <div className="eisenhower__grid">
          {quadrantTasks.map(({ config, tasks: qTasks }) => (
            <QuadrantCard
              key={config.key}
              config={config}
              tasks={qTasks}
              onSelect={setSelectedTaskId}
              onDone={toggleTask}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {activeTask ? <OverlayChip task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
