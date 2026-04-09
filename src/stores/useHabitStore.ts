import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Habit } from "../types";
import { generateId } from "../utils/generateId";

interface HabitStore {
  habits: Habit[];
  addHabit: (data: Omit<Habit, "id" | "createdAt" | "completions">) => void;
  toggleCompletion: (id: number, date: string) => void;
  deleteHabit: (id: number) => void;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set) => ({
      habits: [],
      addHabit: (data) =>
        set((s) => ({
          habits: [
            ...s.habits,
            { ...data, id: generateId(), createdAt: new Date().toISOString(), completions: [] },
          ],
        })),
      toggleCompletion: (id, date) =>
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
        })),
      deleteHabit: (id) =>
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
    }),
    { name: "taskiner-habits" }
  )
);
