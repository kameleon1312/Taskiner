import type { Priority, Recurring } from "../types";

export interface NLPToken {
  type: "date" | "priority" | "recurring";
  label: string;
}

export interface NLPResult {
  text: string;
  deadline: string | null;
  priority: Priority | null;
  recurring: Recurring | null;
  tokens: NLPToken[];
}

interface Span {
  start: number;
  end: number;
}

// ─── lookup tables ────────────────────────────────────────────────────────────

const WEEKDAY: Record<string, number> = {
  niedziela: 0, niedzielę: 0, niedzieli: 0,
  poniedziałek: 1, poniedziałku: 1,
  wtorek: 2, wtorku: 2,
  środa: 3, środę: 3, środy: 3,
  czwartek: 4, czwartku: 4,
  piątek: 5, piątku: 5,
  sobota: 6, sobotę: 6, soboty: 6,
};

const MONTH: Record<string, number> = {
  stycznia: 0,  luty: 1,      lutego: 1,
  marca: 2,     kwiecień: 3,  kwietnia: 3,
  maja: 4,      czerwca: 5,   lipca: 6,
  sierpnia: 7,  września: 8,  października: 9,
  listopada: 10, grudnia: 11,
  styczeń: 0,   marzec: 2,    maj: 4,
  czerwiec: 5,  lipiec: 6,    sierpień: 7,
  wrzesień: 8,  październik: 9, listopad: 10,
  grudzień: 11,
};

// ─── date helpers ─────────────────────────────────────────────────────────────

function midnight(d: Date): Date {
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  midnight(d);
  d.setDate(d.getDate() + n);
  return d;
}

function monthsFromNow(n: number): Date {
  const d = new Date();
  midnight(d);
  d.setMonth(d.getMonth() + n);
  return d;
}

function nextWeekday(idx: number): Date {
  const d = new Date();
  midnight(d);
  let diff = idx - d.getDay();
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dateLabel(d: Date): string {
  const today = new Date();
  midnight(today);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "dzisiaj";
  if (diff === 1) return "jutro";
  if (diff === 2) return "pojutrze";
  const weekdays = ["ndz", "pon", "wt", "śr", "czw", "pt", "sob"];
  if (diff > 0 && diff <= 6) return weekdays[d.getDay()];
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

// ─── extractors ───────────────────────────────────────────────────────────────

function matchDate(s: string): { date: Date; span: Span } | null {
  let m: RegExpExecArray | null;

  const check = (re: RegExp, fn: (m: RegExpExecArray) => Date) => {
    re.lastIndex = 0;
    m = re.exec(s);
    if (m) return { date: fn(m), span: { start: m.index, end: m.index + m[0].length } };
    return null;
  };

  return (
    check(/\bpojutrze\b/i,                    () => daysFromNow(2)) ||
    check(/\bjutro\b/i,                        () => daysFromNow(1)) ||
    check(/\b(dziś|dzisiaj)\b/i,              () => daysFromNow(0)) ||
    check(/\bza\s+(\d+)\s+(dni|dnia|dzień)\b/i, m => daysFromNow(+m[1])) ||
    check(/\bza\s+tydzień\b/i,                () => daysFromNow(7)) ||
    check(/\bza\s+(\d+)\s+(tygodnie|tygodni|tygodnia)\b/i, m => daysFromNow(+m[1] * 7)) ||
    check(/\bza\s+miesiąc\b/i,                () => monthsFromNow(1)) ||
    check(/\bza\s+(\d+)\s+(miesięcy|miesiące|miesiąca|miesiąc)\b/i, m => monthsFromNow(+m[1])) ||
    (() => {
      const days = Object.keys(WEEKDAY).join("|");
      const re = new RegExp(`\\b(?:w\\s+|we\\s+)?(?:następn[yą]\\s+|przyszł[yą]\\s+)?(${days})\\b`, "i");
      re.lastIndex = 0;
      m = re.exec(s);
      if (m) return { date: nextWeekday(WEEKDAY[m[1].toLowerCase()]), span: { start: m.index, end: m.index + m[0].length } };
      return null;
    })() ||
    (() => {
      const months = Object.keys(MONTH).join("|");
      const re = new RegExp(`\\b(\\d{1,2})\\s+(${months})\\b`, "i");
      re.lastIndex = 0;
      m = re.exec(s);
      if (m) {
        const day = +m[1], mon = MONTH[m[2].toLowerCase()];
        const now = new Date();
        let yr = now.getFullYear();
        let d = new Date(yr, mon, day);
        if (d < now) d = new Date(yr + 1, mon, day);
        return { date: d, span: { start: m.index, end: m.index + m[0].length } };
      }
      return null;
    })() ||
    check(/\b(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?\b/, m => {
      const day = +m[1], mon = +m[2] - 1, yr = m[3] ? +m[3] : new Date().getFullYear();
      const d = new Date(yr, mon, day);
      if (!m[3] && d < new Date()) d.setFullYear(d.getFullYear() + 1);
      return d;
    }) ||
    null
  );
}

function matchTime(s: string): { h: number; min: number; span: Span } | null {
  let m: RegExpExecArray | null;

  const check = (re: RegExp, fn: (m: RegExpExecArray) => { h: number; min: number }) => {
    re.lastIndex = 0;
    m = re.exec(s);
    if (m) return { ...fn(m), span: { start: m.index, end: m.index + m[0].length } };
    return null;
  };

  return (
    check(/\bo\s+(\d{1,2})[.:h](\d{2})\b/i,       m => ({ h: +m[1], min: +m[2] })) ||
    check(/\bo\s+(\d{1,2})\s+rano\b/i,             m => ({ h: +m[1], min: 0 })) ||
    check(/\bo\s+(\d{1,2})\s+wieczorem\b/i,        m => ({ h: +m[1], min: 0 })) ||
    check(/\bo\s+(\d{1,2})\b/i,                    m => ({ h: +m[1], min: 0 })) ||
    check(/\bw\s+południe\b/i,                      () => ({ h: 12, min: 0 })) ||
    check(/\bpo\s+południu\b/i,                     () => ({ h: 14, min: 0 })) ||
    check(/\brano\b/i,                              () => ({ h: 8,  min: 0 })) ||
    check(/\bwieczorem\b/i,                         () => ({ h: 19, min: 0 })) ||
    check(/\b(w\s+nocy|nocą)\b/i,                  () => ({ h: 22, min: 0 })) ||
    null
  );
}

function matchPriority(s: string): { priority: Priority; span: Span } | null {
  let m: RegExpExecArray | null;
  const lo = s.toLowerCase();

  const check = (re: RegExp, p: Priority, src = lo) => {
    re.lastIndex = 0;
    m = re.exec(src);
    if (m) return { priority: p, span: { start: m.index, end: m.index + m[0].length } };
    return null;
  };

  return (
    check(/!!/,                                                                       "urgent", s) ||
    check(/(?:^|[\s,])(pilne?|pilnie|asap|natychmiast)(?=[\s,!]|$)/i,               "urgent") ||
    check(/(?:^|[\s,])(wysoki\s+priorytet|bardzo\s+ważne?)(?=[\s,]|$)/i,            "urgent") ||
    check(/(?:^|[\s,])(ważne?|ważny|ważna|ważniej)(?=[\s,]|$)/i,                   "high") ||
    check(/(?:^|[\s,])(!(?!!))(?=[\s,]|$)/,                                         "high", s) ||
    check(/(?:^|[\s,])(mało\s+ważne?|nieważne?|niski\s+priorytet|nisko)(?=[\s,]|$)/i, "low") ||
    null
  );
}

function matchRecurring(s: string): { recurring: Recurring; span: Span } | null {
  let m: RegExpExecArray | null;
  const lo = s.toLowerCase();

  const check = (re: RegExp, r: Recurring) => {
    re.lastIndex = 0;
    m = re.exec(lo);
    if (m) return { recurring: r, span: { start: m.index, end: m.index + m[0].length } };
    return null;
  };

  return (
    check(/\b(codziennie|każdego\s+dnia|każdy\s+dzień|co\s+dzień)\b/,  "daily") ||
    check(/\b(co\s+tydzień|tygodniowo|każdego\s+tygodnia|co\s+tydz\.?)\b/, "weekly") ||
    check(/\b(co\s+miesiąc|miesięcznie|każdego\s+miesiąca)\b/,         "monthly") ||
    null
  );
}

// ─── strip consumed spans from text ──────────────────────────────────────────

function stripSpans(text: string, spans: Span[]): string {
  if (!spans.length) return text;
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  let out = "";
  let pos = 0;
  for (const { start, end } of sorted) {
    out += text.slice(pos, start);
    pos = end;
  }
  out += text.slice(pos);
  return out
    .replace(/\s*,\s*,/g, ",")
    .replace(/^[\s,]+|[\s,]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ─── public API ───────────────────────────────────────────────────────────────

export function parseTaskInput(raw: string): NLPResult {
  if (!raw.trim()) {
    return { text: raw, deadline: null, priority: null, recurring: null, tokens: [] };
  }

  const spans: Span[] = [];
  const tokens: NLPToken[] = [];

  let deadline: string | null = null;
  let detectedPriority: Priority | null = null;
  let detectedRecurring: Recurring | null = null;

  // Date + time
  const dateMatch = matchDate(raw);
  if (dateMatch) {
    spans.push(dateMatch.span);
    const timeMatch = matchTime(raw);
    let timeStr = "";
    if (timeMatch) {
      spans.push(timeMatch.span);
      timeStr = `${String(timeMatch.h).padStart(2, "0")}:${String(timeMatch.min).padStart(2, "0")}`;
      const d = new Date(dateMatch.date);
      d.setHours(timeMatch.h, timeMatch.min, 0, 0);
      deadline = d.toISOString();
    } else {
      deadline = `${toYMD(dateMatch.date)}T00:00:00.000Z`;
    }
    tokens.push({
      type: "date",
      label: timeStr
        ? `📅 ${dateLabel(dateMatch.date)}, ${timeStr}`
        : `📅 ${dateLabel(dateMatch.date)}`,
    });
  } else {
    // Time only → assume today
    const timeMatch = matchTime(raw);
    if (timeMatch) {
      spans.push(timeMatch.span);
      const d = new Date();
      d.setHours(timeMatch.h, timeMatch.min, 0, 0);
      deadline = d.toISOString();
      const timeStr = `${String(timeMatch.h).padStart(2, "0")}:${String(timeMatch.min).padStart(2, "0")}`;
      tokens.push({ type: "date", label: `📅 dzisiaj, ${timeStr}` });
    }
  }

  // Priority
  const prioMatch = matchPriority(raw);
  if (prioMatch) {
    spans.push(prioMatch.span);
    detectedPriority = prioMatch.priority;
    const labels: Record<Priority, string> = {
      urgent: "🔴 Pilne",
      high:   "🟠 Ważne",
      normal: "🔵 Normalne",
      low:    "⚪ Niskie",
    };
    tokens.push({ type: "priority", label: labels[prioMatch.priority] });
  }

  // Recurring
  const recMatch = matchRecurring(raw);
  if (recMatch) {
    spans.push(recMatch.span);
    detectedRecurring = recMatch.recurring;
    const labels: Record<NonNullable<Recurring>, string> = {
      daily:   "🔁 Codziennie",
      weekly:  "🔁 Co tydzień",
      monthly: "🔁 Co miesiąc",
    };
    tokens.push({ type: "recurring", label: labels[recMatch.recurring!] });
  }

  return {
    text: spans.length ? stripSpans(raw, spans) : raw.trim(),
    deadline,
    priority: detectedPriority,
    recurring: detectedRecurring,
    tokens,
  };
}
