import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task } from "../types";
import { generateId } from "../utils/generateId";

/**
 * Dziennik aktywności — append-only event journal.
 * Every meaningful user action lands here, so the calendar, stats and
 * the journal screen read the same history.
 */
export type ActivityType =
  | "task_created"
  | "task_completed"
  | "task_reopened"
  | "task_deleted"
  | "task_restored"
  | "task_rescheduled"
  | "task_edited"
  | "subtask_completed"
  | "habit_done"
  | "habit_undone"
  | "focus_session"
  | "reminder"
  | "import";

export type ActivityGroup = "tasks" | "habits" | "focus" | "system";

export const ACTIVITY_GROUP: Record<ActivityType, ActivityGroup> = {
  task_created:      "tasks",
  task_completed:    "tasks",
  task_reopened:     "tasks",
  task_deleted:      "tasks",
  task_restored:     "tasks",
  task_rescheduled:  "tasks",
  task_edited:       "tasks",
  subtask_completed: "tasks",
  habit_done:        "habits",
  habit_undone:      "habits",
  focus_session:     "focus",
  reminder:          "system",
  import:            "system",
};

export interface ActivityEntry {
  id:          number;
  type:        ActivityType;
  at:          string;            // ISO timestamp
  title:       string;            // task text / habit name / session label
  taskId?:     number | null;
  habitId?:    number | null;
  categoryId?: number | null;
  detail?:     string;            // human readable extra info
  minutes?:    number;            // focus sessions
  snapshot?:   Task;              // deleted task — allows restore
}

const MAX_AGE_MS  = 365 * 86_400_000;
const MAX_ENTRIES = 4000;

interface ActivityStore {
  entries: ActivityEntry[];
  log:     (e: Omit<ActivityEntry, "id" | "at"> & { at?: string }) => void;
  remove:  (id: number) => void;
  markRestored: (id: number) => void;
  clear:   () => void;
}

function prune(list: ActivityEntry[]): ActivityEntry[] {
  const cutoff = Date.now() - MAX_AGE_MS;
  const kept = list.filter((e) => new Date(e.at).getTime() > cutoff);
  return kept.length > MAX_ENTRIES ? kept.slice(kept.length - MAX_ENTRIES) : kept;
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set) => ({
      entries: [],

      log: (e) =>
        set((s) => {
          const at = e.at ?? new Date().toISOString();
          const last = s.entries[s.entries.length - 1];
          // Collapse rapid duplicate edits of the same task (typing in the sheet)
          if (
            last && e.type === "task_edited" && last.type === "task_edited" &&
            last.taskId === e.taskId && Date.now() - new Date(last.at).getTime() < 60_000
          ) {
            const merged = { ...last, ...e, id: last.id, at };
            return { entries: [...s.entries.slice(0, -1), merged] };
          }
          return { entries: prune([...s.entries, { ...e, at, id: generateId() }]) };
        }),

      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      markRestored: (id) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, snapshot: undefined } : e)),
        })),

      clear: () => set({ entries: [] }),
    }),
    { name: "taskiner-activity", version: 1 }
  )
);

export const logActivity = (e: Parameters<ActivityStore["log"]>[0]) =>
  useActivityStore.getState().log(e);
