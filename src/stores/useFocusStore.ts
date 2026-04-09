import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FocusSession } from "../types";
import { generateId } from "../utils/generateId";

const KEEP_DAYS = 90;
const DAY_MS    = 86_400_000;

interface FocusStore {
  sessions: FocusSession[];
  logSession: (data: Omit<FocusSession, "id">) => void;
}

export const useFocusStore = create<FocusStore>()(
  persist(
    (set) => ({
      sessions: [],
      logSession: (data) => {
        if (data.minutes < 1) return;
        set((s) => ({ sessions: [...s.sessions, { ...data, id: generateId() }] }));
      },
    }),
    {
      name: "taskiner-focus-sessions",
      partialize: (state) => {
        const cutoff = Date.now() - KEEP_DAYS * DAY_MS;
        return {
          sessions: state.sessions.filter(
            (s) => new Date(s.startedAt).getTime() > cutoff
          ),
        };
      },
    }
  )
);
