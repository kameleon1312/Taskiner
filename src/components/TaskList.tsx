import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TaskListSkeleton from "./TaskListSkeleton";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useTaskStore } from "../stores/useTaskStore";
import TaskItem from "./TaskItem";
import type { Task } from "../types";

function SortableTaskItem({ task, index }: { task: Task; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex:  isDragging ? 50 : undefined,
        position: "relative",
      }}
    >
      <TaskItem
        task={task}
        index={index}
        dragHandleListeners={listeners as Record<string, unknown>}
        dragHandleAttributes={attributes as Record<string, unknown>}
      />
    </div>
  );
}

function IllustrationEmpty() {
  return (
    <svg viewBox="0 0 140 140" fill="none" className="task-empty__svg" aria-hidden="true">
      {/* Shadow */}
      <ellipse cx="70" cy="118" rx="34" ry="7" fill="rgba(129,140,248,0.1)" />

      {/* Document body */}
      <rect x="32" y="22" width="76" height="88" rx="12" fill="rgba(129,140,248,0.07)" stroke="rgba(129,140,248,0.22)" strokeWidth="1.5" />

      {/* Header strip */}
      <rect x="32" y="22" width="76" height="20" rx="12" fill="rgba(129,140,248,0.12)" />
      <rect x="32" y="34" width="76" height="8" fill="rgba(129,140,248,0.12)" />

      {/* Three dots in header */}
      <circle cx="47" cy="32" r="3" fill="rgba(129,140,248,0.5)" />
      <circle cx="57" cy="32" r="3" fill="rgba(129,140,248,0.3)" />
      <circle cx="67" cy="32" r="3" fill="rgba(129,140,248,0.2)" />

      {/* Content lines */}
      <rect x="46" y="56" width="48" height="5" rx="2.5" fill="rgba(129,140,248,0.18)" />
      <rect x="46" y="68" width="36" height="5" rx="2.5" fill="rgba(129,140,248,0.12)" />
      <rect x="46" y="80" width="42" height="5" rx="2.5" fill="rgba(129,140,248,0.12)" />

      {/* Big plus button */}
      <circle cx="70" cy="97" r="13" fill="rgba(129,140,248,0.13)" stroke="rgba(129,140,248,0.35)" strokeWidth="1.5" />
      <line x1="70" y1="91" x2="70" y2="103" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="64" y1="97" x2="76" y2="97" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" />

      {/* Sparkles */}
      <path d="M22 38 L23.4 34 L24.8 38 L29 39.4 L24.8 40.8 L23.4 45 L22 40.8 L18 39.4Z" fill="#818cf8" opacity="0.45" />
      <path d="M108 52 L109 49.5 L110 52 L112.5 53 L110 54 L109 56.5 L108 54 L105.5 53Z" fill="#34d399" opacity="0.5" />
      <circle cx="115" cy="34" r="2.5" fill="#fbbf24" opacity="0.55" />
      <circle cx="20" cy="68" r="1.8" fill="#34d399" opacity="0.4" />
      <circle cx="118" cy="78" r="1.5" fill="#818cf8" opacity="0.4" />
    </svg>
  );
}

function IllustrationAllDone() {
  return (
    <svg viewBox="0 0 140 140" fill="none" className="task-empty__svg" aria-hidden="true">
      {/* Glow behind trophy */}
      <ellipse cx="70" cy="70" rx="44" ry="44" fill="rgba(52,211,153,0.07)" />
      <ellipse cx="70" cy="116" rx="28" ry="6" fill="rgba(52,211,153,0.1)" />

      {/* Base plate */}
      <rect x="54" y="102" width="32" height="7" rx="3.5" fill="rgba(52,211,153,0.2)" stroke="rgba(52,211,153,0.4)" strokeWidth="1.2" />
      <rect x="48" y="109" width="44" height="7" rx="3.5" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.35)" strokeWidth="1.2" />

      {/* Stem */}
      <rect x="65" y="88" width="10" height="16" rx="3" fill="rgba(52,211,153,0.2)" stroke="rgba(52,211,153,0.35)" strokeWidth="1.2" />

      {/* Cup body */}
      <path d="M40 30 L100 30 L100 72 Q100 92 70 92 Q40 92 40 72 Z"
        fill="rgba(52,211,153,0.1)" stroke="rgba(52,211,153,0.38)" strokeWidth="1.5" />

      {/* Cup inner highlight */}
      <path d="M50 30 L90 30 L90 68 Q90 84 70 84 Q50 84 50 68 Z"
        fill="rgba(52,211,153,0.06)" />

      {/* Handles */}
      <path d="M40 40 Q24 40 24 56 Q24 72 40 72" stroke="rgba(52,211,153,0.38)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M100 40 Q116 40 116 56 Q116 72 100 72" stroke="rgba(52,211,153,0.38)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Star inside cup */}
      <path d="M70 44 L73.5 54 L84 54 L76 61 L79 71 L70 65 L61 71 L64 61 L56 54 L66.5 54Z"
        fill="#34d399" opacity="0.75" />

      {/* Sparkles */}
      <path d="M22 24 L23.6 19.5 L25.2 24 L30 25.6 L25.2 27.2 L23.6 32 L22 27.2 L17 25.6Z" fill="#fbbf24" opacity="0.65" />
      <path d="M110 34 L111.2 31 L112.4 34 L116 35.2 L112.4 36.4 L111.2 40 L110 36.4 L106 35.2Z" fill="#818cf8" opacity="0.55" />
      <circle cx="28" cy="44" r="2.5" fill="#34d399" opacity="0.5" />
      <circle cx="112" cy="24" r="2" fill="#fbbf24" opacity="0.6" />
      <circle cx="118" cy="60" r="1.8" fill="#34d399" opacity="0.4" />
      <circle cx="20" cy="78" r="1.5" fill="#818cf8" opacity="0.4" />
    </svg>
  );
}

function IllustrationInProgress() {
  return (
    <svg viewBox="0 0 140 140" fill="none" className="task-empty__svg" aria-hidden="true">
      {/* Shadow */}
      <ellipse cx="70" cy="118" rx="28" ry="6" fill="rgba(129,140,248,0.1)" />

      {/* Hourglass frame */}
      <path d="M42 20 L98 20 L98 26 L78 58 L78 82 L98 114 L98 120 L42 120 L42 114 L62 82 L62 58 L42 26Z"
        fill="rgba(129,140,248,0.07)" stroke="rgba(129,140,248,0.28)" strokeWidth="1.5" />

      {/* Top cap */}
      <rect x="38" y="16" width="64" height="10" rx="5" fill="rgba(129,140,248,0.16)" stroke="rgba(129,140,248,0.3)" strokeWidth="1.2" />
      {/* Bottom cap */}
      <rect x="38" y="114" width="64" height="10" rx="5" fill="rgba(129,140,248,0.16)" stroke="rgba(129,140,248,0.3)" strokeWidth="1.2" />

      {/* Top sand (amber) */}
      <path d="M48 26 L92 26 L76 54 L64 54Z" fill="rgba(251,191,36,0.28)" />
      {/* Remaining top sand line */}
      <path d="M54 26 L86 26 L74 46 L66 46Z" fill="rgba(251,191,36,0.18)" />

      {/* Bottom sand pile */}
      <path d="M64 86 L76 86 L90 114 L50 114Z" fill="rgba(251,191,36,0.3)" />
      {/* Center mound */}
      <ellipse cx="70" cy="86" rx="8" ry="3" fill="rgba(251,191,36,0.38)" />

      {/* Falling sand dots */}
      <circle cx="70" cy="62" r="1.5" fill="rgba(251,191,36,0.6)" />
      <circle cx="70" cy="68" r="1.2" fill="rgba(251,191,36,0.5)" />
      <circle cx="70" cy="74" r="1" fill="rgba(251,191,36,0.4)" />
      <circle cx="70" cy="79" r="0.8" fill="rgba(251,191,36,0.3)" />

      {/* Sparkles */}
      <path d="M18 42 L19.4 38 L20.8 42 L25 43.4 L20.8 44.8 L19.4 49 L18 44.8 L14 43.4Z" fill="#818cf8" opacity="0.4" />
      <path d="M116 58 L117 55.5 L118 58 L121 59 L118 60 L117 62.5 L116 60 L113 59Z" fill="#fbbf24" opacity="0.5" />
      <circle cx="22" cy="80" r="2" fill="#34d399" opacity="0.4" />
      <circle cx="118" cy="40" r="2.2" fill="#818cf8" opacity="0.4" />
      <circle cx="115" cy="90" r="1.5" fill="#34d399" opacity="0.35" />
    </svg>
  );
}

export default function TaskList() {
  const getFilteredTasks  = useTaskStore((s) => s.getFilteredTasks);
  const filter            = useTaskStore((s) => s.filter);
  const reorderTasks      = useTaskStore((s) => s.reorderTasks);
  const allTasks          = useTaskStore((s) => s.tasks);
  // Subscribe to searchQuery and activeCategoryId so the list re-renders when they change
  useTaskStore((s) => s.searchQuery);
  useTaskStore((s) => s.activeCategoryId);
  const tasks             = getFilteredTasks();

  const [isFirstLoad, setIsFirstLoad] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsFirstLoad(false), 320);
    return () => clearTimeout(t);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 6 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTasks(active.id as number, over.id as number);
    }
  };

  if (isFirstLoad && allTasks.length > 0) {
    return <TaskListSkeleton count={Math.min(allTasks.length, 5)} />;
  }

  if (tasks.length === 0) {
    const config = {
      completed: {
        illustration: <IllustrationInProgress />,
        title: "Brak ukończonych zadań",
        hint: "Ukończ zadania, żeby je tu zobaczyć",
        cta: null,
      },
      active: {
        illustration: <IllustrationAllDone />,
        title: "Wszystko gotowe! 🎉",
        hint: "Nie masz żadnych aktywnych zadań. Czas na zasłużony odpoczynek.",
        cta: null,
      },
      all: {
        illustration: <IllustrationEmpty />,
        title: "Brak zadań",
        hint: "Dotknij + żeby dodać swoje pierwsze zadanie.",
        cta: "↓",
      },
    }[filter];

    return (
      <motion.div
        className="task-empty"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
        <motion.div
          className="task-empty__illus-wrap"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {config.illustration}
        </motion.div>

        <motion.p
          className="task-empty__title"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          {config.title}
        </motion.p>

        <motion.p
          className="task-empty__hint"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
        >
          {config.hint}
        </motion.p>

        {config.cta && (
          <motion.div
            className="task-empty__arrow"
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            {config.cta}
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <motion.ul
          className="task-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence>
            {tasks.map((task, i) => (
              <SortableTaskItem key={task.id} task={task} index={i} />
            ))}
          </AnimatePresence>
        </motion.ul>
      </SortableContext>
    </DndContext>
  );
}
