import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme } from "../types";

interface UIStore {
  theme: Theme;
  loading: boolean;
  selectedTaskId: number | null;
  notificationsEnabled: boolean;
  notifyOffsets: number[];
  userName: string;
  userAvatar: string;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLoading: (loading: boolean) => void;
  setSelectedTaskId: (id: number | null) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setNotifyOffsets: (offsets: number[]) => void;
  setUserName: (name: string) => void;
  setUserAvatar: (avatar: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: "dark",
      loading: true,
      selectedTaskId: null,
      notificationsEnabled: true,
      notifyOffsets: [30, 60, 1440],
      userName: "",
      userAvatar: "🙂",

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setLoading: (loading) => set({ loading }),
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setNotifyOffsets: (offsets) => set({ notifyOffsets: offsets }),
      setUserName: (name) => set({ userName: name }),
      setUserAvatar: (avatar) => set({ userAvatar: avatar }),
    }),
    {
      name: "taskiner-ui",
      partialize: (state) => ({
        theme: state.theme,
        notificationsEnabled: state.notificationsEnabled,
        notifyOffsets: state.notifyOffsets,
        userName: state.userName,
        userAvatar: state.userAvatar,
      }),
    }
  )
);
