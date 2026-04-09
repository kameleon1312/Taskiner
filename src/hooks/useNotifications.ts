import { useEffect, useState, useRef } from "react";
import { useTaskStore } from "../stores/useTaskStore";
import { useUIStore }   from "../stores/useUIStore";
import { useStats }     from "./useStats";

const NOTIF_ICON  = "/icons/icon-192x192.png";
const NOTIF_BADGE = "/icons/icon-32x32.png";
const VIBRATE     = [200, 100, 200] as const;
const SEVEN_DAYS  = 7 * 24 * 60 * 60 * 1000;

interface ScheduledNotif {
  fireAt:             number;
  title:              string;
  body:               string;
  icon:               string;
  badge:              string;
  vibrate:            number[];
  tag:                string;
  requireInteraction: boolean;
}

function sendToSW(notifications: ScheduledNotif[]) {
  if (!("serviceWorker" in navigator)) return;

  const tryPost = (attempts = 0) => {
    const ctrl = navigator.serviceWorker.controller;
    if (ctrl) {
      ctrl.postMessage({ type: "SCHEDULE_NOTIFICATIONS", notifications });
    } else if (attempts < 10) {
      setTimeout(() => tryPost(attempts + 1), 500);
    }
  };

  tryPost();
}

async function showNotification(title: string, options: NotificationOptions): Promise<void> {
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await (reg as ServiceWorkerRegistration & {
        showNotification(title: string, opts?: NotificationOptions): Promise<void>;
      }).showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  } catch {
    try { new Notification(title, options); } catch { /* silent */ }
  }
}

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  useEffect(() => {
    const sync = () => {
      if (typeof Notification !== "undefined") setPermission(Notification.permission);
    };
    // Fires when user returns from system settings and has changed the permission
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("notification-permission-changed", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("notification-permission-changed", sync);
    };
  }, []);

  const request = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
    window.dispatchEvent(new Event("notification-permission-changed"));
  };

  return { permission, request };
}

function buildNotifList(
  tasks: ReturnType<typeof useTaskStore.getState>["tasks"],
  offsets: number[]
): ScheduledNotif[] {
  const notifications: ScheduledNotif[] = [];
  const now = Date.now();
  // Always include offset=0 (fire at deadline) even if not in user offsets
  const effectiveOffsets = offsets.includes(0) ? offsets : [0, ...offsets];

  tasks
    .filter((t) => !t.completed && t.deadline)
    .forEach((t) => {
      const deadline = new Date(t.deadline!).getTime();
      const msLeft   = deadline - now;

      if (msLeft <= 0 || msLeft > SEVEN_DAYS) return;

      for (const offsetMin of effectiveOffsets) {
        const fireAt = deadline - offsetMin * 60 * 1000;
        if (fireAt <= now) continue;

        let title: string;
        let body: string;

        if (offsetMin === 0) {
          title = "Taskiner – termin mija teraz! ⏰";
          body  = t.text;
        } else if (offsetMin < 60) {
          title = `Taskiner – za ${offsetMin} min termin ⚡`;
          body  = `Za ${offsetMin} minut: ${t.text}`;
        } else if (offsetMin === 60) {
          title = "Taskiner – za godzinę termin 🕐";
          body  = `Za godzinę: ${t.text}`;
        } else if (offsetMin === 120) {
          title = "Taskiner – za 2 godziny termin 🕑";
          body  = `Za 2 godziny: ${t.text}`;
        } else {
          const hours = Math.round(offsetMin / 60);
          title = `Taskiner – za ${hours}h termin 📅`;
          body  = `Jutro mija: ${t.text}`;
        }

        notifications.push({
          fireAt,
          title,
          body,
          icon:               NOTIF_ICON,
          badge:              NOTIF_BADGE,
          vibrate:            [...VIBRATE],
          tag:                `deadline-${offsetMin}m-${t.id}`,
          requireInteraction: offsetMin === 0,
        });
      }
    });

  return notifications;
}

export function useDeadlineNotifications() {
  const tasks                = useTaskStore((s) => s.tasks);
  const notificationsEnabled = useUIStore((s) => s.notificationsEnabled);
  const notifyOffsets        = useUIStore((s) => s.notifyOffsets);
  const timeoutsRef          = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    if (!notificationsEnabled) return;

    const notifications = buildNotifList(tasks, notifyOffsets);

    // Service Worker handles background; timeouts fire when the app is in the foreground
    sendToSW(notifications);

    const now = Date.now();
    for (const n of notifications) {
      const delay = n.fireAt - now;
      if (delay <= 0) continue;
      timeoutsRef.current.push(
        setTimeout(() => {
          showNotification(n.title, {
            body:               n.body,
            icon:               n.icon,
            badge:              n.badge,
            vibrate:            n.vibrate,
            tag:                n.tag,
            requireInteraction: n.requireInteraction,
          });
        }, delay)
      );
    }

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [tasks, notificationsEnabled, notifyOffsets]);
}

export function useStreakDangerNotification() {
  const { streak, completedToday } = useStats();
  const notificationsEnabled = useUIStore((s) => s.notificationsEnabled);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    if (!notificationsEnabled) return;
    if (streak === 0) return;

    const now    = new Date();
    const target = new Date();
    target.setHours(20, 0, 0, 0);

    const msLeft = target.getTime() - now.getTime();
    if (msLeft <= 0) return;

    const notif: ScheduledNotif = {
      fireAt:             target.getTime(),
      title:              "Taskiner – seria w niebezpieczeństwie! 🔥",
      body:               `Masz serię ${streak} ${streak === 1 ? "dnia" : "dni"}. Wykonaj jedno zadanie, żeby jej nie stracić!`,
      icon:               NOTIF_ICON,
      badge:              NOTIF_BADGE,
      vibrate:            [200, 100, 200, 100, 200],
      tag:                "streak-danger",
      requireInteraction: false,
    };

    if (completedToday === 0) sendToSW([notif]);

    let t: ReturnType<typeof setTimeout> | null = null;
    if (completedToday === 0) {
      t = setTimeout(() => {
        showNotification(notif.title, {
          body: notif.body, icon: notif.icon, badge: notif.badge,
          vibrate: notif.vibrate, tag: notif.tag,
        });
      }, msLeft);
    }

    return () => { if (t) clearTimeout(t); };
  }, [streak, completedToday, notificationsEnabled]);
}

export async function sendTestNotification(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") return false;
  try {
    await showNotification("Taskiner – test powiadomień ✅", {
      body:    "Powiadomienia działają poprawnie!",
      icon:    NOTIF_ICON,
      badge:   NOTIF_BADGE,
      vibrate: [...VIBRATE],
      tag:     "test",
    });
    return true;
  } catch {
    return false;
  }
}
