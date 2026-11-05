/** Thin, defensive wrapper around the service-worker message channel. */
import type { ScheduledNotif } from "./schedule";

export const hasSW = () => typeof navigator !== "undefined" && "serviceWorker" in navigator;
export const notifSupported = () => typeof Notification !== "undefined";
export const notifGranted = () => notifSupported() && Notification.permission === "granted";

async function controller(timeoutMs = 4000): Promise<ServiceWorker | null> {
  if (!hasSW()) return null;
  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((r) => setTimeout(() => r(null), timeoutMs)),
    ]);
    return (reg && (reg as ServiceWorkerRegistration).active) || navigator.serviceWorker.controller || null;
  } catch {
    return null;
  }
}

export async function postToSW(msg: Record<string, unknown>): Promise<boolean> {
  const c = await controller();
  if (!c) return false;
  try { c.postMessage(msg); return true; } catch { return false; }
}

export async function swAvailable(): Promise<boolean> {
  return !!(await controller(2500));
}

export async function syncSchedule(items: ScheduledNotif[], prefs: object, activeTaskIds: number[]) {
  return postToSW({ type: "SYNC_SCHEDULE", items, prefs, activeTaskIds });
}

export async function fetchPendingActions(): Promise<{ type: string; taskId: number }[]> {
  const c = await controller();
  if (!c) return [];
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    const t = setTimeout(() => resolve([]), 3000);
    ch.port1.onmessage = (e) => { clearTimeout(t); resolve(Array.isArray(e.data) ? e.data : []); };
    try { c.postMessage({ type: "GET_PENDING_ACTIONS" }, [ch.port2]); } catch { resolve([]); }
  });
}

/** Ask the browser to wake the SW periodically (installed PWAs, Chromium). */
export async function registerBackgroundSync(): Promise<boolean> {
  if (!hasSW()) return false;
  try {
    const reg = await navigator.serviceWorker.ready as ServiceWorkerRegistration & {
      periodicSync?: { register: (tag: string, o: { minInterval: number }) => Promise<void> };
    };
    if (!reg.periodicSync) return false;
    const status = await (navigator.permissions?.query({ name: "periodic-background-sync" as PermissionName })
      .catch(() => null));
    if (status && status.state !== "granted") return false;
    await reg.periodicSync.register("taskiner-reminders", { minInterval: 15 * 60 * 1000 });
    return true;
  } catch {
    return false;
  }
}

export async function showSystemNotification(item: ScheduledNotif, silent: boolean) {
  if (!notifGranted()) return;
  const opts: NotificationOptions = {
    body: item.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-32x32.png",
    tag: item.tag,
    silent,
    requireInteraction: !!item.requireInteraction,
    data: { url: item.url, taskId: item.taskId ?? null, key: item.key },
  };
  try {
    if (hasSW()) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) { await reg.showNotification(item.title, opts); return; }
    }
    new Notification(item.title, opts);
  } catch {
    try { new Notification(item.title, opts); } catch { /* ignore */ }
  }
}
