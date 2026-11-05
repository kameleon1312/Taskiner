import { create } from "zustand";
import { persist } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";
import type { Task, Filter, Priority, Recurring, Subtask } from "../types";
import { generateId } from "../utils/generateId";
import { compareDeadlines, deadlineDue, nextRecurrence, normalizeDeadline, formatDeadlineAbsolute as formatDeadline } from "../utils/deadline";
import { logActivity } from "./useActivityStore";

const LOG_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export interface CompletionRecord {
  completedAt: string;
  categoryId:  number | null;
  taskId?:     number;
}

function pruneLog(log: CompletionRecord[]): CompletionRecord[] {
  const cutoff = Date.now() - LOG_MAX_AGE_MS;
  return log.filter((r) => new Date(r.completedAt).getTime() > cutoff);
}

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "Pilne", high: "Ważne", normal: "Normalne", low: "Niskie",
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
  ) => number;
  toggleTask:        (id: number) => void;
  completeTask:      (id: number) => void;
  deleteTask:        (id: number) => void;
  restoreTask:       (task: Task) => void;
  updateTask:        (id: number, text: string) => void;
  updateTaskNotes:   (id: number, notes: string) => void;
  rescheduleTask:    (id: number, deadline: string | null) => void;
  reorderTasks:      (activeId: number, overId: number) => void;
  clearCompleted:    () => void;
  importTasks:       (tasks: Task[], mode?: "replace" | "merge") => void;

  setFilter:           (filter: Filter) => void;
  setSearchQuery:      (q: string) => void;
  setActiveCategoryId: (id: number | null) => void;

  addSubtask:    (taskId: number, text: string) => void;
  toggleSubtask: (taskId: number, subtaskId: number) => void;
  deleteSubtask: (taskId: number, subtaskId: number) => void;

  updateTaskFields: (id: number, fields: Partial<Task>) => void;
  getFilteredTasks: () => Task[];
}

/** Advance a recurring deadline until it lands in the future (no stale clones). */
function upcomingRecurrence(deadline: string, recurring: Recurring): string {
  let next = nextRecurrence(deadline, recurring);
  const now = Date.now();
  for (let i = 0; i < 400 && deadlineDue(next).getTime() < now; i++) {
    next = nextRecurrence(next, recurring);
  }
  return next;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      completionLog: [],
      filter: "all",
      searchQuery: "",
      activeCategoryId: null,

      addTask: (text, deadline, priority = "normal", categoryId = null, recurring = null) => {
        const id = generateId();
        const task: Task = {
          id,
          text,
          completed: false,
          deadline: normalizeDeadline(deadline),
          priority,
          categoryId,
          subtasks: [],
          recurring,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
        logActivity({
          type: "task_created", title: text, taskId: id, categoryId,
          detail: task.deadline ? `Termin: ${formatDeadline(task.deadline)}` : undefined,
        });
        return id;
      },

      toggleTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const isCompleting = !task.completed;
        const now = new Date().toISOString();
        let spawned: Task | null = null;

        set((state) => {
          const toggled = state.tasks.map((t) =>
            t.id === id
              ? { ...t, completed: isCompleting, completedAt: isCompleting ? now : undefined }
              : t
          );

          let newLog = [...state.completionLog];
          if (isCompleting) {
            newLog.push({ completedAt: now, categoryId: task.categoryId ?? null, taskId: id });
          } else {
            const idx = newLog.findIndex(
              (r) => (r.taskId === id && r.completedAt === task.completedAt) || r.completedAt === task.completedAt
            );
            if (idx !== -1) newLog.splice(idx, 1);
          }
          newLog = pruneLog(newLog);

          // Auto-create the next instance for recurring tasks
          if (isCompleting && task.recurring && task.deadline) {
            const nextDeadline  = upcomingRecurrence(task.deadline, task.recurring);
            const alreadyExists = toggled.some(
              (t) => !t.completed && t.recurring === task.recurring
                && t.text === task.text && t.deadline === nextDeadline
            );
            if (!alreadyExists) {
              spawned = {
                id: generateId(),
                text: task.text,
                completed: false,
                deadline: nextDeadline,
                priority: task.priority,
                categoryId: task.categoryId,
                notes: task.notes,
                subtasks: (task.subtasks ?? []).map((s) => ({ ...s, id: generateId(), completed: false })),
                recurring: task.recurring,
                createdAt: now,
              };
              toggled.push(spawned);
            }
          }

          return { tasks: toggled, completionLog: newLog };
        });

        logActivity({
          type: isCompleting ? "task_completed" : "task_reopened",
          title: task.text, taskId: id, categoryId: task.categoryId ?? null,
          detail: spawned ? `Następne: ${formatDeadline((spawned as Task).deadline!)}` : undefined,
        });
      },

      completeTask: (id) => {
        const t = get().tasks.find((x) => x.id === id);
        if (t && !t.completed) get().toggleTask(id);
      },

      deleteTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
        logActivity({
          type: "task_deleted", title: task.text, taskId: id,
          categoryId: task.categoryId ?? null, snapshot: task,
        });
      },

      restoreTask: (task) => {
        if (get().tasks.some((t) => t.id === task.id)) return;
        set((state) => ({ tasks: [...state.tasks, task] }));
        logActivity({ type: "task_restored", title: task.text, taskId: task.id, categoryId: task.categoryId ?? null });
      },

      updateTask: (id, text) => get().updateTaskFields(id, { text }),

      updateTaskNotes: (id, notes) => get().updateTaskFields(id, { notes }),

      rescheduleTask: (id, deadline) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        const normalized = normalizeDeadline(deadline);
        if (normalized === task.deadline) return;
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, deadline: normalized, alertPlayed: false } : t)),
        }));
        logActivity({
          type: "task_rescheduled", title: task.text, taskId: id, categoryId: task.categoryId ?? null,
          detail: normalized ? `Nowy termin: ${formatDeadline(normalized)}` : "Usunięto termin",
        });
      },

      reorderTasks: (activeId, overId) =>
        set((state) => {
          const oldIndex = state.tasks.findIndex((t) => t.id === activeId);
          const newIndex = state.tasks.findIndex((t) => t.id === overId);
          if (oldIndex === -1 || newIndex === -1) return state;
          const reordered = arrayMove(state.tasks, oldIndex, newIndex);
          return { tasks: reordered.map((t, i) => ({ ...t, order: i })) };
        }),

      // Completed tasks stay in the journal & completion log — only the list is cleaned
      clearCompleted: () =>
        set((state) => ({ tasks: state.tasks.filter((t) => !t.completed) })),

      importTasks: (incoming, mode = "replace") => {
        const normalized = incoming.map((t) => ({ ...t, deadline: normalizeDeadline(t.deadline) }));
        set((state) => {
          const base   = mode === "merge" ? state.tasks : [];
          const ids    = new Set(base.map((t) => t.id));
          const merged = [...base, ...normalized.filter((t) => !ids.has(t.id))];
          // Keep existing history; add completion records the log does not know yet
          const known  = new Set(state.completionLog.map((r) => r.completedAt));
          const extra: CompletionRecord[] = normalized
            .filter((t) => t.completed && t.completedAt && !known.has(t.completedAt))
            .map((t) => ({ completedAt: t.completedAt!, categoryId: t.categoryId ?? null, taskId: t.id }));
          return { tasks: merged, completionLog: pruneLog([...state.completionLog, ...extra]) };
        });
        logActivity({
          type: "import", title: `Zaimportowano ${incoming.length} zadań`,
          detail: mode === "merge" ? "Scalono z istniejącymi" : "Zastąpiono listę",
        });
      },

      setFilter:           (filter)           => set({ filter }),
      setSearchQuery:      (searchQuery)      => set({ searchQuery }),
      setActiveCategoryId: (activeCategoryId) => set({ activeCategoryId }),

      addSubtask: (taskId, text) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...(t.subtasks || []), { id: generateId(), text, completed: false } as Subtask] }
              : t
          ),
        })),

      toggleSubtask: (taskId, subtaskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        const sub  = task?.subtasks?.find((s) => s.id === subtaskId);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: (t.subtasks || []).map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s)) }
              : t
          ),
        }));
        if (task && sub && !sub.completed) {
          logActivity({
            type: "subtask_completed", title: sub.text, taskId, categoryId: task.categoryId ?? null,
            detail: `w „${task.text}”`,
          });
        }
      },

      deleteSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId) } : t
          ),
        })),

      updateTaskFields: (id, fields) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        if ("deadline" in fields) {
          const { deadline, ...rest } = fields;
          if (Object.keys(rest).length) get().updateTaskFields(id, rest);
          get().rescheduleTask(id, deadline ?? null);
          return;
        }
        const changed = (Object.keys(fields) as (keyof Task)[]).filter((k) => fields[k] !== task[k]);
        if (!changed.length) return;
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...fields } : t)),
        }));

        const detail: string[] = [];
        if (changed.includes("text"))       detail.push("zmieniono tytuł");
        if (changed.includes("priority") && fields.priority) detail.push(`priorytet: ${PRIORITY_LABEL[fields.priority]}`);
        if (changed.includes("categoryId")) detail.push("zmieniono kategorię");
        if (changed.includes("recurring"))  detail.push(fields.recurring ? "ustawiono powtarzanie" : "wyłączono powtarzanie");
        if (changed.includes("notes"))      detail.push("zaktualizowano notatki");
        if (detail.length) {
          logActivity({
            type: "task_edited", title: fields.text ?? task.text, taskId: id,
            categoryId: fields.categoryId ?? task.categoryId ?? null, detail: detail.join(" · "),
          });
        }
      },

      getFilteredTasks: () => {
        const { tasks, filter, searchQuery, activeCategoryId } = get();
        const q = searchQuery.trim().toLowerCase();
        const hasManualOrder = tasks.some((t) => t.order !== undefined);

        return tasks
          .filter((task) => {
            if (!q) {
              if (filter === "active"    && task.completed)  return false;
              if (filter === "completed" && !task.completed) return false;
            } else {
              const haystack = [task.text, task.notes ?? "", task.subtasks?.map((s) => s.text).join(" ") ?? ""]
                .join(" ").toLowerCase();
              if (!haystack.includes(q)) return false;
            }
            if (activeCategoryId !== null && task.categoryId !== activeCategoryId) return false;
            return true;
          })
          .sort((a, b) => {
            if (hasManualOrder) {
              const oa = a.order ?? Infinity;
              const ob = b.order ?? Infinity;
              if (oa !== ob) return oa - ob;
            }
            const pa = PRIORITY_ORDER[a.priority || "normal"];
            const pb = PRIORITY_ORDER[b.priority || "normal"];
            if (pa !== pb) return pa - pb;
            return compareDeadlines(a.deadline, b.deadline);
          });
      },
    }),
    {
      name: "taskiner-tasks",
      version: 2,
      partialize: (state) => ({
        tasks:         state.tasks,
        filter:        state.filter,
        completionLog: state.completionLog,
      }),
      migrate: (persisted: unknown, version) => {
        const s = (persisted ?? {}) as { tasks?: Task[]; completionLog?: CompletionRecord[]; filter?: Filter };
        if (version < 2) {
          s.tasks = (s.tasks ?? []).map((t) => ({ ...t, deadline: normalizeDeadline(t.deadline) }));
          s.completionLog = s.completionLog ?? [];
        }
        return s as TaskStore;
      },
    }
  )
);
