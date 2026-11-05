import { create } from "zustand";
import type { NotifKind } from "./schedule";

export interface Toast {
  id:      string;
  title:   string;
  body:    string;
  kind:    NotifKind | "info" | "success";
  taskId?: number;
  url?:    string;
  undo?:   () => void;
  ttl?:    number;
}

interface ToastStore {
  toasts:  Toast[];
  push:    (t: Omit<Toast, "id"> & { id?: string }) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => {
      const id = t.id ?? `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const rest = s.toasts.filter((x) => x.id !== id);
      return { toasts: [...rest, { ...t, id }].slice(-3) };
    }),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (t: Omit<Toast, "id"> & { id?: string }) => useToastStore.getState().push(t);
