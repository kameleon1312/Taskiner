/**
 * Single source of truth for deadlines.
 *
 * Canonical storage formats (always LOCAL time, never UTC):
 *   - all-day:  "YYYY-MM-DD"
 *   - timed:    "YYYY-MM-DDTHH:mm:ss"
 *
 * Legacy values (UTC "…Z" timestamps, "T00:00:00" midnights) are normalised by
 * `normalizeDeadline` during store migration and import.
 */
import { toDateKey, toLocalISOString, fromDateKey, DAY_MS, fmtTime } from "./dateUtils";

export type DeadlineStatus = "overdue" | "soon" | "today" | "tomorrow" | "upcoming";

export function isAllDay(deadline: string): boolean {
  return !deadline.includes("T");
}

/** Moment the deadline refers to (all-day → local midnight of that day). */
export function parseDeadline(deadline: string): Date {
  if (isAllDay(deadline)) return fromDateKey(deadline);
  // Local ISO without zone is parsed as local by the spec; with Z as UTC.
  return new Date(deadline);
}

/** Moment after which the task counts as overdue. */
export function deadlineDue(deadline: string): Date {
  if (isAllDay(deadline)) {
    const d = fromDateKey(deadline);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  return new Date(deadline);
}

export function deadlineDateKey(deadline: string): string {
  return isAllDay(deadline) ? deadline.slice(0, 10) : toDateKey(new Date(deadline));
}

export function makeDeadline(dateKey: string, time?: string | null): string {
  if (!dateKey) return "";
  return time ? `${dateKey}T${time.length === 5 ? time + ":00" : time}` : dateKey;
}

/** Convert any legacy representation into a canonical one. */
export function normalizeDeadline(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // Old NLP all-day format: "YYYY-MM-DDT00:00:00.000Z" — the date part was the intended day
  if (/^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z$/.test(raw)) return raw.slice(0, 10);
  // Old form all-day format: local midnight
  if (/^\d{4}-\d{2}-\d{2}T00:00(:00)?$/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return toLocalISOString(d);
}

export function deadlineStatus(deadline: string, now = new Date()): DeadlineStatus {
  const due = deadlineDue(deadline);
  if (due.getTime() < now.getTime()) return "overdue";
  const key   = deadlineDateKey(deadline);
  const today = toDateKey(now);
  if (key === today) {
    if (!isAllDay(deadline) && due.getTime() - now.getTime() <= 60 * 60 * 1000) return "soon";
    return "today";
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (key === toDateKey(tomorrow)) return "tomorrow";
  return "upcoming";
}

/** Human, relative label: "Dziś 14:00", "Jutro", "pt, 14 lis", "Spóźnione 2 dni". */
export function formatDeadline(deadline: string, now = new Date()): string {
  const d       = parseDeadline(deadline);
  const allDay  = isAllDay(deadline);
  const status  = deadlineStatus(deadline, now);
  const timeStr = allDay ? "" : ` ${fmtTime(d)}`;

  const dayDiff = Math.round(
    (fromDateKey(deadlineDateKey(deadline)).getTime() - fromDateKey(toDateKey(now)).getTime()) / DAY_MS
  );

  if (status === "overdue") {
    if (dayDiff === 0)  return `Minął termin${timeStr}`;
    if (dayDiff === -1) return `Wczoraj${timeStr}`;
    const n = -dayDiff;
    return `Spóźnione ${n} ${n === 1 ? "dzień" : "dni"}`;
  }
  if (status === "today" || status === "soon") return `Dziś${timeStr}`;
  if (status === "tomorrow") return `Jutro${timeStr}`;

  const opts: Intl.DateTimeFormatOptions =
    dayDiff < 7 ? { weekday: "long" } : { weekday: "short", day: "numeric", month: "short" };
  if (d.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  const label = d.toLocaleDateString("pl-PL", opts);
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}${timeStr}`;
}

/** Next occurrence for recurring tasks — keeps the all-day / timed shape. */
export function nextRecurrence(deadline: string, recurring: "daily" | "weekly" | "monthly"): string {
  const allDay = isAllDay(deadline);
  const next   = parseDeadline(deadline);
  if (recurring === "daily")  next.setDate(next.getDate() + 1);
  if (recurring === "weekly") next.setDate(next.getDate() + 7);
  if (recurring === "monthly") {
    const origDay = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(origDay, lastDay));
  }
  return allDay ? toDateKey(next) : toLocalISOString(next);
}

export function compareDeadlines(a: string | null, b: string | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return deadlineDue(a).getTime() - deadlineDue(b).getTime();
}

/** Absolute, compact: "5 lis, 17:00" / "5 lis" (for logs, where relative labels age badly). */
export function formatDeadlineAbsolute(deadline: string): string {
  const d = parseDeadline(deadline);
  const date = d.toLocaleDateString("pl-PL", {
    day: "numeric", month: "short",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
  return isAllDay(deadline) ? date : `${date}, ${fmtTime(d)}`;
}
