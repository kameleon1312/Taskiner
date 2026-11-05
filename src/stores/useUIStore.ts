import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme } from "../types";

export type SoundId = "chime" | "crystal" | "bell" | "pulse" | "classic" | "soft";

export interface QuietHours {
  enabled: boolean;
  start:   string; // HH:mm
  end:     string; // HH:mm
}

export interface NotificationPrefs {
  notificationsEnabled: boolean;
  notifyOffsets:        number[];  // minutes before deadline
  allDayTime:           string;    // when to remind about all-day tasks (HH:mm)
  soundEnabled:         boolean;
  soundId:              SoundId;
  soundVolume:          number;    // 0..1
  vibrate:              boolean;
  quietHours:           QuietHours;
  snoozeMinutes:        number;
  streakReminder:       boolean;
  habitReminder:        boolean;
  habitReminderTime:    string;
  dailyBrief:           boolean;
  dailyBriefTime:       string;
  focusAlerts:          boolean;
  inAppWhenFocused:     boolean;
  appBadge:             boolean;
}

interface UIStore extends NotificationPrefs {
  theme: Theme;
  loading: boolean;
  selectedTaskId: number | null;
  userName: string;
  userAvatar: string;
  reduceMotion: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLoading: (loading: boolean) => void;
  setSelectedTaskId: (id: number | null) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setNotifyOffsets: (offsets: number[]) => void;
  setPrefs: (p: Partial<NotificationPrefs & { reduceMotion: boolean }>) => void;
  setUserName: (name: string) => void;
  setUserAvatar: (avatar: string) => void;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  notificationsEnabled: true,
  notifyOffsets:        [30, 1440],
  allDayTime:           "09:00",
  soundEnabled:         true,
  soundId:              "chime",
  soundVolume:          0.6,
  vibrate:              true,
  quietHours:           { enabled: true, start: "22:30", end: "07:00" },
  snoozeMinutes:        10,
  streakReminder:       true,
  habitReminder:        true,
  habitReminderTime:    "19:00",
  dailyBrief:           true,
  dailyBriefTime:       "08:00",
  focusAlerts:          true,
  inAppWhenFocused:     true,
  appBadge:             true,
};

const PERSISTED_KEYS = [
  "theme", "userName", "userAvatar", "reduceMotion",
  ...Object.keys(DEFAULT_NOTIFICATION_PREFS),
] as const;

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...DEFAULT_NOTIFICATION_PREFS,
      theme: "dark",
      loading: true,
      selectedTaskId: null,
      userName: "",
      userAvatar: "🙂",
      reduceMotion: false,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setLoading: (loading) => set({ loading }),
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setNotifyOffsets: (offsets) => set({ notifyOffsets: [...new Set(offsets)].sort((a, b) => a - b) }),
      setPrefs: (p) => set(p),
      setUserName: (name) => set({ userName: name }),
      setUserAvatar: (avatar) => set({ userAvatar: avatar }),
    }),
    {
      name: "taskiner-ui",
      version: 2,
      partialize: (state) =>
        Object.fromEntries(PERSISTED_KEYS.map((k) => [k, state[k as keyof UIStore]])) as Partial<UIStore>,
      // Older versions persisted only a subset — fill new prefs with defaults
      migrate: (persisted: unknown) => ({ ...DEFAULT_NOTIFICATION_PREFS, ...(persisted as object) }) as UIStore,
      merge: (persisted, current) => ({ ...current, ...(persisted as object) }),
    }
  )
);
