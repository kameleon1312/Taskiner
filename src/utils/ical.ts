/**
 * iCalendar (RFC 5545) export / import.
 * Tasks with a deadline become VEVENTs (so every calendar app shows them on the
 * right day) with VALARMs matching the user's reminder offsets.
 */
import type { Task, Category, Priority } from "../types";
import { isAllDay, parseDeadline, normalizeDeadline, nextRecurrence } from "./deadline";
import { toDateKey, addDays } from "./dateUtils";

const PRIORITY_ICS: Record<Priority, number> = { urgent: 1, high: 3, normal: 5, low: 9 };

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function unesc(s: string): string {
  return s.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\;/g, ";").replace(/\\\\/g, "\\");
}

/** RFC 5545 line folding at 75 octets. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  let curLen = 0;
  for (const ch of line) {
    const l = new TextEncoder().encode(ch).length;
    if (curLen + l > (out.length ? 74 : 75)) { out.push(cur); cur = ""; curLen = 0; }
    cur += ch; curLen += l;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const pad = (n: number) => String(n).padStart(2, "0");
const icsDate = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const icsLocal = (d: Date) => `${icsDate(d)}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
const icsUtc = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const RRULE: Record<string, string> = { daily: "FREQ=DAILY", weekly: "FREQ=WEEKLY", monthly: "FREQ=MONTHLY" };

export interface IcsOptions {
  categories:   Category[];
  alarmOffsets: number[];     // minutes
  allDayTime:   string;       // HH:mm for all-day alarms
  includeCompleted?: boolean;
}

export function tasksToICS(tasks: Task[], opts: IcsOptions): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const stamp = icsUtc(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Taskiner//Taskiner PWA//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Taskiner",
    `X-WR-TIMEZONE:${tz}`,
  ];

  for (const t of tasks) {
    if (!t.deadline) continue;
    if (t.completed && !opts.includeCompleted) continue;
    const cat = opts.categories.find((c) => c.id === t.categoryId);
    const start = parseDeadline(t.deadline);
    const allDay = isAllDay(t.deadline);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:taskiner-${t.id}@taskiner.app`);
    lines.push(`DTSTAMP:${stamp}`);
    if (allDay) {
      lines.push(`DTSTART;VALUE=DATE:${icsDate(start)}`);
      lines.push(`DTEND;VALUE=DATE:${icsDate(addDays(start, 1))}`);
    } else {
      lines.push(`DTSTART:${icsUtc(start)}`);
      lines.push(`DTEND:${icsUtc(new Date(start.getTime() + 30 * 60_000))}`);
    }
    lines.push(`SUMMARY:${esc((t.completed ? "✔ " : "") + t.text)}`);
    const desc = [
      t.notes?.trim(),
      t.subtasks?.length ? t.subtasks.map((s) => `${s.completed ? "☑" : "☐"} ${s.text}`).join("\n") : "",
      "— Taskiner",
    ].filter(Boolean).join("\n\n");
    lines.push(`DESCRIPTION:${esc(desc)}`);
    if (cat) lines.push(`CATEGORIES:${esc(cat.name)}`);
    lines.push(`PRIORITY:${PRIORITY_ICS[t.priority ?? "normal"]}`);
    lines.push(`STATUS:${t.completed ? "CANCELLED" : "CONFIRMED"}`);
    lines.push("TRANSP:TRANSPARENT");
    if (t.recurring) lines.push(`RRULE:${RRULE[t.recurring]}`);
    lines.push(`X-TASKINER-ID:${t.id}`);
    lines.push(`X-TASKINER-PRIORITY:${t.priority ?? "normal"}`);

    if (!t.completed) {
      const offsets = allDay
        ? [0, ...opts.alarmOffsets.filter((o) => o >= 1440)]
        : [0, ...opts.alarmOffsets];
      for (const off of [...new Set(offsets)]) {
        lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(t.text)}`);
        if (allDay) {
          // Relative to the all-day start (00:00) → remind at the configured hour
          const [h, m] = opts.allDayTime.split(":").map(Number);
          const mins = h * 60 + m - off;
          const sign = mins < 0 ? "-" : "";
          const a = Math.abs(mins);
          lines.push(`TRIGGER:${sign}PT${Math.floor(a / 60)}H${a % 60}M`);
        } else {
          lines.push(`TRIGGER:${off === 0 ? "PT0M" : `-PT${off}M`}`);
        }
        lines.push("END:VALARM");
      }
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/* ── import ────────────────────────────────────────────────────────────── */

export interface ParsedEvent {
  uid:       string;
  text:      string;
  deadline:  string | null;
  notes?:    string;
  priority?: Priority;
  recurring?: Task["recurring"];
  taskinerId?: number;
}

function parseIcsDate(value: string, params: string): string | null {
  // 20261105 | 20261105T140000 | 20261105T140000Z
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (!h || /VALUE=DATE(?!-)/i.test(params)) return `${y}-${mo}-${d}`;
  if (z) return normalizeDeadline(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`; // floating / TZID → treat as local
}

export function parseICS(text: string): ParsedEvent[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  const events: ParsedEvent[] = [];
  let cur: Partial<ParsedEvent> & { _prio?: number } | null = null;
  let depth = 0; // ignore nested VALARM properties

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^BEGIN:(VEVENT|VTODO)$/i.test(line)) { cur = {}; depth = 0; continue; }
    if (/^END:(VEVENT|VTODO)$/i.test(line)) {
      if (cur && cur.text) {
        events.push({
          uid: cur.uid ?? `${cur.text}-${cur.deadline}`,
          text: cur.text,
          deadline: cur.deadline ?? null,
          notes: cur.notes,
          priority: cur.priority ?? (cur._prio ? (cur._prio <= 2 ? "urgent" : cur._prio <= 4 ? "high" : cur._prio >= 7 ? "low" : "normal") : undefined),
          recurring: cur.recurring ?? null,
          taskinerId: cur.taskinerId,
        });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;
    if (/^BEGIN:/i.test(line)) { depth++; continue; }
    if (/^END:/i.test(line))   { depth--; continue; }
    if (depth > 0) continue;

    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const head = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const [name, ...paramParts] = head.split(";");
    const params = paramParts.join(";");

    switch (name.toUpperCase()) {
      case "UID":         cur.uid = value; break;
      case "SUMMARY":     cur.text = unesc(value).replace(/^✔\s*/, "").slice(0, 500); break;
      case "DESCRIPTION": cur.notes = unesc(value).replace(/\n*— Taskiner$/, "").slice(0, 5000) || undefined; break;
      case "DTSTART":     cur.deadline = parseIcsDate(value, params); break;
      case "DUE":         cur.deadline = parseIcsDate(value, params); break;
      case "PRIORITY":    cur._prio = Number(value) || undefined; break;
      case "X-TASKINER-PRIORITY":
        if (["urgent", "high", "normal", "low"].includes(value)) cur.priority = value as Priority;
        break;
      case "X-TASKINER-ID": cur.taskinerId = Number(value) || undefined; break;
      case "RRULE": {
        const f = value.match(/FREQ=(DAILY|WEEKLY|MONTHLY)/i)?.[1]?.toLowerCase();
        cur.recurring = (f as Task["recurring"]) ?? null;
        break;
      }
    }
  }
  return events;
}

/* ── download / share helpers ──────────────────────────────────────────── */

export async function shareOrDownloadICS(ics: string, filename = "taskiner.ics"): Promise<"shared" | "downloaded"> {
  const file = new File([ics], filename, { type: "text/calendar" });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] }) && /android|iphone|ipad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({ files: [file], title: "Taskiner – kalendarz" });
      return "shared";
    } catch { /* user cancelled → fall back to download */ }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return "downloaded";
}

/** "Add to Google Calendar" deep link for a single task. */
export function googleCalendarUrl(t: Task): string | null {
  if (!t.deadline) return null;
  const start = parseDeadline(t.deadline);
  let dates: string;
  if (isAllDay(t.deadline)) {
    dates = `${icsDate(start)}/${icsDate(addDays(start, 1))}`;
  } else {
    dates = `${icsUtc(start)}/${icsUtc(new Date(start.getTime() + 30 * 60_000))}`;
  }
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: t.text,
    dates,
    details: [t.notes ?? "", "Dodano z Taskiner"].filter(Boolean).join("\n\n"),
  });
  if (t.recurring) p.set("recur", `RRULE:${RRULE[t.recurring]}`);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

/** Occurrences of a recurring task inside [from, to] — used by the calendar grid. */
export function projectRecurrences(t: Task, fromKey: string, toKey: string, max = 62): string[] {
  if (!t.deadline || !t.recurring || t.completed) return [];
  const out: string[] = [];
  let d = nextRecurrence(t.deadline, t.recurring);
  for (let i = 0; i < 400 && out.length < max; i++) {
    const key = toDateKey(parseDeadline(d));
    if (key > toKey) break;
    if (key >= fromKey) out.push(d);
    d = nextRecurrence(d, t.recurring);
  }
  return out;
}
