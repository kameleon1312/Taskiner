import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useFocusStore } from "./useFocusStore";
import { useTaskStore } from "./useTaskStore";
import { useHabitStore } from "./useHabitStore";
import { todayKey } from "../utils/dateUtils";

export const FOCUS_MODES = {
  work:       { label: "Skupienie",      minutes: 25, color: "#818cf8" },
  shortBreak: { label: "Krótka przerwa", minutes: 5,  color: "#34d399" },
  longBreak:  { label: "Długa przerwa",  minutes: 15, color: "#c084fc" },
} as const;

export type FocusMode = keyof typeof FOCUS_MODES;

/**
 * Wall-clock based Pomodoro timer. Instead of decrementing a counter every
 * second (which drifts / freezes in background tabs) we store the moment the
 * run ends. The timer keeps going across pages, reloads and backgrounding.
 */
interface FocusTimerStore {
  mode:            FocusMode;
  endAt:           number | null;  // running → timestamp of end
  remainingMs:     number;         // paused → what is left
  runStartedAt:    number | null;  // start of current running segment
  workAccumMs:     number;         // work time not yet logged
  sessionStartedAt: string | null;
  completedCount:  number;
  countDate:       string;
  selectedTaskId:  number | null;
  selectedHabitId: number | null;
  lastFinished:    { mode: FocusMode; at: number } | null;

  start:      () => void;
  pause:      () => void;
  reset:      () => void;
  switchMode: (m: FocusMode) => void;
  finish:     () => void;
  select:     (taskId: number | null, habitId: number | null) => void;
}

const durationMs = (m: FocusMode) => FOCUS_MODES[m].minutes * 60_000;

export function getRemainingMs(s: Pick<FocusTimerStore, "endAt" | "remainingMs">, now = Date.now()): number {
  return s.endAt ? Math.max(0, s.endAt - now) : s.remainingMs;
}

export const useFocusTimerStore = create<FocusTimerStore>()(
  persist(
    (set, get) => {
      /** Log accumulated work time as a focus session. */
      const flush = (completed: boolean, extraMs = 0) => {
        const s = get();
        const total = s.workAccumMs + extraMs;
        if (s.mode === "work" && total >= 60_000) {
          const task  = s.selectedTaskId  ? useTaskStore.getState().tasks.find((t) => t.id === s.selectedTaskId)    : null;
          const habit = s.selectedHabitId ? useHabitStore.getState().habits.find((h) => h.id === s.selectedHabitId) : null;
          useFocusStore.getState().logSession({
            taskId:     s.selectedTaskId,
            taskText:   task?.text ?? (habit ? `${habit.emoji} ${habit.name}` : null),
            categoryId: task?.categoryId ?? null,
            startedAt:  s.sessionStartedAt ?? new Date(Date.now() - total).toISOString(),
            minutes:    Math.round(total / 60_000),
            completed,
          });
        }
        set({ workAccumMs: 0, sessionStartedAt: null });
      };

      const segment = () => {
        const s = get();
        return s.endAt && s.runStartedAt ? Math.min(Date.now(), s.endAt) - s.runStartedAt : 0;
      };

      return {
        mode: "work",
        endAt: null,
        remainingMs: durationMs("work"),
        runStartedAt: null,
        workAccumMs: 0,
        sessionStartedAt: null,
        completedCount: 0,
        countDate: todayKey(),
        selectedTaskId: null,
        selectedHabitId: null,
        lastFinished: null,

        start: () => {
          const s = get();
          if (s.endAt) return;
          const now = Date.now();
          set({
            endAt: now + (s.remainingMs > 0 ? s.remainingMs : durationMs(s.mode)),
            runStartedAt: now,
            sessionStartedAt: s.sessionStartedAt ?? new Date(now).toISOString(),
          });
        },

        pause: () => {
          const s = get();
          if (!s.endAt) return;
          const seg = segment();
          set({
            remainingMs: getRemainingMs(s),
            endAt: null,
            runStartedAt: null,
            workAccumMs: s.mode === "work" ? s.workAccumMs + seg : 0,
          });
        },

        reset: () => {
          flush(false, get().mode === "work" ? segment() : 0);
          set({ endAt: null, runStartedAt: null, remainingMs: durationMs(get().mode) });
        },

        switchMode: (m) => {
          flush(false, get().mode === "work" ? segment() : 0);
          set({ mode: m, endAt: null, runStartedAt: null, remainingMs: durationMs(m) });
        },

        finish: () => {
          const s = get();
          if (!s.endAt) return;
          const isWork = s.mode === "work";
          flush(true, isWork ? segment() : 0);
          const today = todayKey();
          const count = (s.countDate === today ? s.completedCount : 0) + (isWork ? 1 : 0);
          // Suggest the natural next phase
          const next: FocusMode = isWork ? (count % 4 === 0 ? "longBreak" : "shortBreak") : "work";
          set({
            completedCount: count,
            countDate: today,
            endAt: null,
            runStartedAt: null,
            mode: next,
            remainingMs: durationMs(next),
            lastFinished: { mode: s.mode, at: Date.now() },
          });
        },

        select: (taskId, habitId) => set({ selectedTaskId: taskId, selectedHabitId: habitId }),
      };
    },
    {
      name: "taskiner-focus-timer",
      version: 1,
      partialize: (s) => ({
        mode: s.mode, endAt: s.endAt, remainingMs: s.remainingMs, runStartedAt: s.runStartedAt,
        workAccumMs: s.workAccumMs, sessionStartedAt: s.sessionStartedAt,
        completedCount: s.completedCount, countDate: s.countDate,
        selectedTaskId: s.selectedTaskId, selectedHabitId: s.selectedHabitId,
      }),
    }
  )
);

/** Sessions done today (resets at midnight). */
export function todaysFocusCount(s: Pick<FocusTimerStore, "completedCount" | "countDate">): number {
  return s.countDate === todayKey() ? s.completedCount : 0;
}
