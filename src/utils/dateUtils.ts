export const DAY_MS = 86_400_000;

/** Local calendar key YYYY-MM-DD (never UTC). */
export function toDateKey(d: Date): string {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local ISO without zone: YYYY-MM-DDTHH:mm:ss */
export function toLocalISOString(d: Date): string {
  const h   = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const sec = String(d.getSeconds()).padStart(2, "0");
  return `${toDateKey(d)}T${h}:${min}:${sec}`;
}

/** Parse YYYY-MM-DD as LOCAL midnight (new Date("YYYY-MM-DD") would be UTC). */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Date key of any ISO timestamp, in local time. */
export function isoToDateKey(iso: string): string {
  return toDateKey(new Date(iso));
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

/** Monday-based start of week. */
export function startOfWeek(d: Date): Date {
  const r = startOfDay(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return r;
}

/** ISO-8601 week id, e.g. 2026-W45 */
export function isoWeekId(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dow = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Polish plural: plural(5, "zadanie", "zadania", "zadań") */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const n10 = n % 10, n100 = n % 100;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}
