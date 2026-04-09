import { create } from "zustand";
import { persist } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";
import type { Task, Filter, Priority, Recurring, Subtask } from "../types";
import { generateId } from "../utils/generateId";
import { toLocalISOString } from "../utils/dateUtils";

const LOG_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 dni

function pruneLog(log: CompletionRecord[]): CompletionRecord[] {
  const cutoff = Date.now() - LOG_MAX_AGE_MS;
  return log.filter((r) => new Date(r.completedAt).getTime() > cutoff);
}

export interface CompletionRecord {
  completedAt: string;
  categoryId: number | null;
}

const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  high:   1,
  normal: 2,
  low:    3,
};

interface TaskStore {
  tasks: Task[];
  completionLog: CompletionRecord[];
  filter: Filter;
  searchQuery: string;
  activeCategoryId: number | null;

  addTask: (
    text: string,
    deadline: string | null,
    priority?: Priority,
    categoryId?: number | null,
    recurring?: Recurring | null
  ) => void;
  toggleTask:        (id: number) => void;
  deleteTask:        (id: number) => void;
  updateTask:        (id: number, text: string) => void;
  updateTaskNotes:   (id: number, notes: string) => void;
  reorderTasks:      (activeId: number, overId: number) => void;
  clearCompleted:    () => void;
  importTasks:       (tasks: Task[]) => void;

  setFilter:           (filter: Filter) => void;
  setSearchQuery:      (q: string) => void;
  setActiveCategoryId: (id: number | null) => void;

  addSubtask:    (taskId: number, text: string) => void;
  toggleSubtask: (taskId: number, subtaskId: number) => void;
  deleteSubtask: (taskId: number, subtaskId: number) => void;

  updateTaskFields: (id: number, fields: Partial<Task>) => void;
  getFilteredTasks: () => Task[];
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      completionLog: [],
      filter: "all",
      searchQuery: "",
      activeCategoryId: null,

      addTask: (text, deadline, priority = "normal", categoryId = null, recurring = null) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              id: generateId(),
              text,
              completed: false,
              deadline,
              priority,
              categoryId,
              subtasks: [],
              recurring,
            },
          ],
        })),

      toggleTask: (id) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          if (!task) return state;

          const isCompleting = !task.completed;
          const now = new Date().toISOString();

          const toggled = state.tasks.map((t) =>
            t.id === id
              ? { ...t, completed: isCompleting, completedAt: isCompleting ? now : undefined }
              : t
          );

          let newLog = [...state.completionLog];
          if (isCompleting) {
            newLog.push({ completedAt: now, categoryId: task.categoryId ?? null });
          } else if (task.completedAt) {
            // Remove the matching log entry when un-completing
            const idx = newLog.findIndex((r) => r.completedAt === task.completedAt);
            if (idx !== -1) newLog.splice(idx, 1);
          }
          newLog = pruneLog(newLog);

          // Auto-create next instance for recurring tasks
          if (isCompleting && task.recurring && task.deadline) {
            const next = new Date(task.deadline);
            if (task.recurring === "daily")  next.setDate(next.getDate() + 1);
            if (task.recurring === "weekly") next.setDate(next.getDate() + 7);
            if (task.recurring === "monthly") {
              const origDay = next.getDate();
              next.setDate(1);
              next.setMonth(next.getMonth() + 1);
              const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
              next.setDate(Math.min(origDay, lastDay));
            }

            const nextDeadline = toLocalISOString(next);
            const alreadyExists = toggled.some(
              (t) => !t.completed && t.recurring === task.recurring
                && t.text === task.text && t.deadline === nextDeadline
            );
            if (!alreadyExists) {
              toggled.push({
                id: generateId(),
                text: task.text,
                completed: false,
                deadline: nextDeadline,
                priority: task.priority,
                categoryId: task.categoryId,
                subtasks: [],
                recurring: task.recurring,
              });
            }
          }

          return { tasks: toggled, completionLog: newLog };
        }),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      updateTask: (id, text) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, text } : t)),
        })),

      updateTaskNotes: (id, notes) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, notes } : t)),
        })),

      reorderTasks: (activeId, overId) =>
        set((state) => {
          const oldIndex = state.tasks.findIndex((t) => t.id === activeId);
          const newIndex = state.tasks.findIndex((t) => t.id === overId);
          if (oldIndex === -1 || newIndex === -1) return state;

          const reordered = arrayMove(state.tasks, oldIndex, newIndex);
          // Stamp explicit order on every task so future renders respect this
          return { tasks: reordered.map((t, i) => ({ ...t, order: i })) };
        }),

      clearCompleted: () =>
        set((state) => ({
          tasks: state.tasks.filter((t) => !t.completed),
        })),

      importTasks: (tasks) => {
        const newLog: CompletionRecord[] = tasks
          .filter((t) => t.completed && t.completedAt)
          .map((t) => ({ completedAt: t.completedAt!, categoryId: t.categoryId ?? null }));
        set({ tasks, completionLog: newLog });
      },

      setFilter:           (filter)           => set({ filter }),
      setSearchQuery:      (searchQuery)      => set({ searchQuery }),
      setActiveCategoryId: (activeCategoryId) => set({ activeCategoryId }),

      addSubtask: (taskId, text) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: [
                    ...(t.subtasks || []),
                    { id: generateId(), text, completed: false } as Subtask,
                  ],
                }
              : t
          ),
        })),

      toggleSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: (t.subtasks || []).map((s) =>
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s
                  ),
                }
              : t
          ),
        })),

      deleteSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId),
                }
              : t
          ),
        })),

      updateTaskFields: (id, fields) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...fields } : t)),
        })),

      getFilteredTasks: () => {
        const { tasks, filter, searchQuery, activeCategoryId } = get();
        const q = searchQuery.toLowerCase();
        const hasManualOrder = tasks.some((t) => t.order !== undefined);

        return tasks
          .filter((task) => {
            // When searching, ignore active/completed filter — search everything
            if (!q) {
              if (filter === "active"    && task.completed)  return false;
              if (filter === "completed" && !task.completed) return false;
            }
            if (q) {
              const haystack = [
                task.text,
                task.notes ?? "",
                task.subtasks?.map((s) => s.text).join(" ") ?? "",
              ].join(" ").toLowerCase();
              if (!haystack.includes(q)) return false;
            }
            if (activeCategoryId !== null && task.categoryId !== activeCategoryId)
              return false;
            return true;
          })
          .sort((a, b) => {
            if (hasManualOrder) {
              // Explicit manual order — new tasks (no order) go to the end
              const oa = a.order ?? Infinity;
              const ob = b.order ?? Infinity;
              if (oa !== ob) return oa - ob;
            }
            // Priority / deadline sort (default or tiebreak)
            const pa = PRIORITY_ORDER[a.priority || "normal"];
            const pb = PRIORITY_ORDER[b.priority || "normal"];
            if (pa !== pb) return pa - pb;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          });
      },
    }),
    {
      name: "taskiner-tasks",
      partialize: (state) => ({
        tasks:         state.tasks,
        filter:        state.filter,
        completionLog: state.completionLog,
      }),
    }
  )
);
