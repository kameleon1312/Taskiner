import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Habit } from "../types";
import { generateId } from "../utils/generateId";
import { logActivity } from "./useActivityStore";
import { todayKey, fromDateKey } from "../utils/dateUtils";

interface HabitStore {
  habits: Habit[];
  addHabit: (data: Omit<Habit, "id" | "createdAt" | "completions">) => void;
  toggleCompletion: (id: number, date: string) => void;
  deleteHabit: (id: number) => void;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      addHabit: (data) =>
        set((s) => ({
          habits: [
            ...s.habits,
            { ...data, id: generateId(), createdAt: new Date().toISOString(), completions: [] },
          ],
        })),
      toggleCompletion: (id, date) => {
        const habit = get().habits.find((h) => h.id === id);
        if (habit) {
          const done = !habit.completions.includes(date);
          // Retro-checks are dated to that day (noon) so the calendar shows them where they belong
          const at = date === todayKey() ? undefined : new Date(fromDateKey(date).getTime() + 12 * 3600_000).toISOString();
          logActivity({ type: done ? "habit_done" : "habit_undone", title: `${habit.emoji} ${habit.name}`, habitId: id, at });
        }
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id !== id
              ? h
              : {
                  ...h,
                  completions: h.completions.includes(date)
                    ? h.completions.filter((d) => d !== date)
                    : [...h.completions, date],
                }
          ),
        }));
      },
      deleteHabit: (id) =>
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
    }),
    { name: "taskiner-habits" }
  )
);
