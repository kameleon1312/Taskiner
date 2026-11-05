import { useActivityStore, type ActivityEntry } from "./useActivityStore";
import { useTaskStore } from "./useTaskStore";
import { useHabitStore } from "./useHabitStore";
import { useFocusStore } from "./useFocusStore";
import { fromDateKey } from "../utils/dateUtils";

const FLAG = "taskiner-activity-backfilled";

/**
 * One-time: rebuild the journal from data that existed before the journal did
 * (completion log, habit check-ins, focus sessions), so long-time users see
 * their history right away.
 */
export function backfillActivity(): void {
  try {
    if (localStorage.getItem(FLAG)) return;
  } catch { return; }

  const { entries } = useActivityStore.getState();
  if (entries.length > 0) { try { localStorage.setItem(FLAG, "1"); } catch { /* */ } return; }

  const tasks = useTaskStore.getState().tasks;
  const out: ActivityEntry[] = [];
  let id = 1;

  for (const r of useTaskStore.getState().completionLog) {
    const t = tasks.find((x) => x.completedAt === r.completedAt || x.id === r.taskId);
    out.push({
      id: id++, type: "task_completed", at: r.completedAt,
      title: t?.text ?? "Ukończone zadanie", taskId: t?.id ?? r.taskId ?? null, categoryId: r.categoryId,
    });
  }
  for (const h of useHabitStore.getState().habits) {
    for (const day of h.completions) {
      out.push({
        id: id++, type: "habit_done", at: new Date(fromDateKey(day).getTime() + 12 * 3600_000).toISOString(),
        title: `${h.emoji} ${h.name}`, habitId: h.id,
      });
    }
  }
  for (const s of useFocusStore.getState().sessions) {
    out.push({
      id: id++, type: "focus_session", at: s.startedAt, title: s.taskText ?? "Sesja skupienia",
      taskId: s.taskId, categoryId: s.categoryId, minutes: s.minutes, detail: `${s.minutes} min`,
    });
  }

  out.sort((a, b) => a.at.localeCompare(b.at));
  const base = Date.now() * 10;
  useActivityStore.setState({ entries: out.map((e, i) => ({ ...e, id: base + i })) });
  try { localStorage.setItem(FLAG, "1"); } catch { /* */ }
}
