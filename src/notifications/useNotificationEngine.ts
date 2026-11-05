import { useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useNavigate } from "react-router-dom";
import { useTaskStore }       from "../stores/useTaskStore";
import { useHabitStore }      from "../stores/useHabitStore";
import { useUIStore, DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from "../stores/useUIStore";
import { useFocusTimerStore, FOCUS_MODES } from "../stores/useFocusTimerStore";
import { logActivity, useActivityStore } from "../stores/useActivityStore";
import { useStats }           from "../hooks/useStats";
import { buildSchedule, type ScheduledNotif } from "./schedule";
import { playTone, installAudioUnlock } from "./sound";
import { toast } from "./toastStore";
import {
  hasSW, notifGranted, postToSW, syncSchedule, swAvailable,
  fetchPendingActions, registerBackgroundSync, showSystemNotification,
} from "./bridge";
import { deadlineStatus } from "../utils/deadline";

const HEARTBEAT_MS = 30_000;
const LOCAL_DELIVERED_KEY = "taskiner-delivered";

function pickPrefs(s: ReturnType<typeof useUIStore.getState>): NotificationPrefs {
  const out = {} as Record<string, unknown>;
  for (const k of Object.keys(DEFAULT_NOTIFICATION_PREFS)) out[k] = s[k as keyof typeof s];
  return out as unknown as NotificationPrefs;
}

function inQuiet(p: NotificationPrefs, ts = Date.now()): boolean {
  if (!p.quietHours.enabled) return false;
  const d = new Date(ts);
  const m = d.getHours() * 60 + d.getMinutes();
  const toM = (s: string) => { const [h, mm] = s.split(":").map(Number); return h * 60 + mm; };
  const a = toM(p.quietHours.start), b = toM(p.quietHours.end);
  return a <= b ? m >= a && m < b : m >= a || m < b;
}

function readLocalDelivered(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(LOCAL_DELIVERED_KEY) || "{}"); } catch { return {}; }
}
function writeLocalDelivered(d: Record<string, number>) {
  const cutoff = Date.now() - 10 * 86_400_000;
  for (const k of Object.keys(d)) if (d[k] < cutoff) delete d[k];
  try { localStorage.setItem(LOCAL_DELIVERED_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

/** Everything the reminder system needs, mounted once inside the router. */
export function useNotificationEngine() {
  const navigate = useNavigate();
  const tasks    = useTaskStore((s) => s.tasks);
  const habits   = useHabitStore((s) => s.habits);
  const prefs    = useUIStore(useShallow(pickPrefs));
  const focusEndAt = useFocusTimerStore((s) => s.endAt);
  const focusMode  = useFocusTimerStore((s) => s.mode);
  const { streak, completedToday } = useStats();

  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const swModeRef = useRef<boolean | null>(null);
  const localTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Coarse "now" bucket (per minute) so the schedule refreshes over midnight etc.
  const minuteBucket = Math.floor(Date.now() / 60_000);

  const schedule = useMemo(
    () => buildSchedule({
      tasks, habits, prefs, streak, completedToday,
      focusEndAt, focusMode, focusLabel: FOCUS_MODES[focusMode].label,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, habits, prefs, streak, completedToday, focusEndAt, focusMode, Math.floor(minuteBucket / 15)]
  );

  /* ── one-time setup ─────────────────────────────────────────────────── */
  useEffect(() => {
    installAudioUnlock();

    const onMessage = (e: MessageEvent) => {
      const data = e.data || {};
      const p = prefsRef.current;
      if (data.type === "PLAY_SOUND") {
        // Hidden page → the system notification carries the sound (avoid a double chime)
        const visible = document.visibilityState === "visible";
        if (p.soundEnabled && !inQuiet(p) && visible) playTone(p.soundId, p.soundVolume);
      }
      if (data.type === "NOTIFICATION_DELIVERED" && data.item) {
        handleDelivered(data.item as ScheduledNotif, !!data.inApp);
      }
      if (data.type === "TASK_ACTION" && data.action) applyAction(data.action);
      if (data.type === "NAVIGATE" && typeof data.url === "string") navigate(data.url);
    };

    if (hasSW()) navigator.serviceWorker.addEventListener("message", onMessage);

    (async () => {
      swModeRef.current = await swAvailable();
      if (swModeRef.current) {
        const pending = await fetchPendingActions();
        pending.forEach(applyAction);
        registerBackgroundSync();
      }
    })();

    const beat = setInterval(() => { postToSW({ type: "TICK" }); }, HEARTBEAT_MS);
    const onVis = () => { if (document.visibilityState === "visible") postToSW({ type: "TICK" }); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (hasSW()) navigator.serviceWorker.removeEventListener("message", onMessage);
      clearInterval(beat);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── push schedule to SW (or arm local fallback timers) ─────────────── */
  useEffect(() => {
    const t = setTimeout(async () => {
      const activeIds = tasks.filter((x) => !x.completed).map((x) => x.id);
      const swOk = notifGranted() && (swModeRef.current ?? (await swAvailable()));
      localTimers.current.forEach(clearTimeout);
      localTimers.current = [];

      if (swOk) {
        syncSchedule(schedule, prefs, activeIds);
        // Browsers stop an idle SW after ~30 s (its timers die with it). While the
        // page is alive it wakes the SW exactly on time; otherwise periodic sync,
        // fetches and the next app start catch up on missed reminders.
        const now = Date.now();
        for (const item of schedule) {
          const delay = item.fireAt - now;
          if (delay < 0 || delay > 2 ** 31 - 1) continue;
          localTimers.current.push(setTimeout(() => postToSW({ type: "TICK" }), delay + 150));
        }
        return;
      }
      // Fallback: page-level timers (dev mode, no SW, or permission not granted → in-app only)
      const now = Date.now();
      for (const item of schedule) {
        const delay = item.fireAt - now;
        if (delay < -60_000 || delay > 2 ** 31 - 1) continue;
        localTimers.current.push(setTimeout(() => fireLocal(item), Math.max(0, delay)));
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, prefs]);

  useEffect(() => () => localTimers.current.forEach(clearTimeout), []);

  /* ── Focus timer completion (works on any page) ─────────────────────── */
  useEffect(() => {
    if (!focusEndAt) return;
    const finish = () => {
      const st = useFocusTimerStore.getState();
      if (st.endAt && st.endAt <= Date.now() + 250) st.finish();
    };
    const delay = focusEndAt - Date.now();
    if (delay <= 0) { finish(); return; }
    const t = setTimeout(finish, delay);
    const onVis = () => { if (document.visibilityState === "visible") finish(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearTimeout(t); document.removeEventListener("visibilitychange", onVis); };
  }, [focusEndAt]);

  /* ── App icon badge: overdue + due today ────────────────────────────── */
  useEffect(() => {
    if (!navigator.setAppBadge) return;
    if (!prefs.appBadge) { navigator.clearAppBadge?.().catch(() => {}); return; }
    const n = tasks.filter((t) => {
      if (t.completed || !t.deadline) return false;
      const st = deadlineStatus(t.deadline);
      return st === "overdue" || st === "today" || st === "soon";
    }).length;
    (n > 0 ? navigator.setAppBadge(n) : navigator.clearAppBadge?.())?.catch?.(() => {});
  }, [tasks, prefs.appBadge, minuteBucket]);

  /* ── helpers (closures read fresh store state) ──────────────────────── */
  function applyAction(action: { type: string; taskId: number }) {
    if (action.type === "complete") {
      const t = useTaskStore.getState().tasks.find((x) => x.id === action.taskId);
      if (t && !t.completed) {
        useTaskStore.getState().completeTask(action.taskId);
        toast({ kind: "success", title: "Ukończono z powiadomienia", body: t.text, ttl: 3500 });
      }
    }
  }

  function handleDelivered(item: ScheduledNotif, inApp: boolean) {
    // Journal: one entry per reminder key
    const exists = useActivityStore.getState().entries.some((e) => e.type === "reminder" && e.detail === item.key);
    if (!exists) {
      logActivity({ type: "reminder", title: item.body, taskId: item.taskId ?? null, detail: item.key });
    }
    if (inApp && prefsRef.current.inAppWhenFocused) {
      toast({ id: item.key, kind: item.kind, title: item.title, body: item.body, taskId: item.taskId, url: item.url });
    }
  }

  function fireLocal(item: ScheduledNotif) {
    const delivered = readLocalDelivered();
    if (delivered[item.key]) return;
    delivered[item.key] = Date.now();
    writeLocalDelivered(delivered);

    const p = prefsRef.current;
    const quiet = inQuiet(p);
    if (p.soundEnabled && !quiet) playTone(p.soundId, p.soundVolume);
    if (p.vibrate && !quiet) navigator.vibrate?.(item.vibrate ?? [180, 90, 180]);

    const visible = document.visibilityState === "visible" && document.hasFocus();
    if (!visible || !p.inAppWhenFocused) showSystemNotification(item, true);
    handleDelivered(item, visible);
  }
}

/** Fire a sample through the very same pipeline the real reminders use. */
export async function sendTestNotification(): Promise<"system" | "in-app"> {
  const p = pickPrefs(useUIStore.getState());
  const item: ScheduledNotif = {
    key: `test-${Date.now()}`, kind: "test", fireAt: Date.now(),
    title: "🔔 Taskiner – test", body: "Powiadomienia i dźwięk działają poprawnie.",
    tag: "test", url: "/settings",
  };
  if (p.soundEnabled) playTone(p.soundId, p.soundVolume);
  if (notifGranted()) {
    // Always show a system banner for the test, even with the app focused
    await showSystemNotification(item, true);
    return "system";
  }
  toast({ kind: "test", title: item.title, body: item.body });
  return "in-app";
}
