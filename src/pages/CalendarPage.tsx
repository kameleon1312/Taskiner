import React, { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "../stores/useTaskStore";
import { useHabitStore } from "../stores/useHabitStore";
import { useActivityStore } from "../stores/useActivityStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import { useUIStore } from "../stores/useUIStore";
import ActivityTimeline, { dayHeading } from "../components/activity/ActivityTimeline";
import CalendarSync from "../components/CalendarSync";
import type { Task } from "../types";
import { PRIORITY_CONFIG } from "../utils/constants";
import { toDateKey, fromDateKey, addDays, startOfWeek, plural, fmtTime } from "../utils/dateUtils";
import { deadlineDateKey, isAllDay, parseDeadline, makeDeadline, deadlineStatus } from "../utils/deadline";
import { projectRecurrences } from "../utils/ical";
import { parseTaskInput } from "../utils/nlp";
import { useMinuteClock } from "../hooks/useClock";

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];
const DAY_NAMES = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

type View = "month" | "agenda";
type PanelTab = "plan" | "log";

interface DayInfo {
  tasks:      Task[];
  ghosts:     Task[];        // projected recurring occurrences
  completed:  number;        // completions that happened that day (journal)
  focusMin:   number;
  habits:     number;
  events:     number;
}

const isValidKey = (k: string | null): k is string => !!k && /^\d{4}-\d{2}-\d{2}$/.test(k);

export default function CalendarPage() {
  const tasks      = useTaskStore((s) => s.tasks);
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const addTask    = useTaskStore((s) => s.addTask);
  const habits     = useHabitStore((s) => s.habits);
  const entries    = useActivityStore((s) => s.entries);
  const categories = useCategoryStore((s) => s.categories);
  const openTask   = useUIStore((s) => s.setSelectedTaskId);

  useMinuteClock();
  const [params, setParams] = useSearchParams();
  const todayKey = toDateKey(new Date());
  const initial  = isValidKey(params.get("date")) ? params.get("date")! : todayKey;

  const [cursor, setCursor]   = useState(() => { const d = fromDateKey(initial); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selected, setSelectedRaw] = useState<string>(initial);
  const [view, setView]       = useState<View>("month");
  const [tab, setTab]         = useState<PanelTab>("plan");
  const [dir, setDir]         = useState(0);
  const [quick, setQuick]     = useState("");
  const quickRef = useRef<HTMLInputElement>(null);

  const setSelected = (k: string) => {
    setSelectedRaw(k);
    const next = new URLSearchParams(params);
    next.set("date", k);
    setParams(next, { replace: true });
  };

  // Grid range (Mon-first, 6 weeks max)
  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const start = startOfWeek(first);
    const last  = new Date(cursor.y, cursor.m + 1, 0);
    const cells: Date[] = [];
    for (let d = new Date(start); d <= last || cells.length % 7 !== 0; d = addDays(d, 1)) cells.push(d);
    return cells;
  }, [cursor]);

  const rangeFrom = toDateKey(grid[0]);
  const rangeTo   = toDateKey(addDays(grid[grid.length - 1], view === "agenda" ? 60 : 0));
  const agendaFrom = todayKey;
  const agendaTo   = toDateKey(addDays(new Date(), 30));

  /** Everything the calendar shows, indexed by local day. */
  const byDay = useMemo(() => {
    const map = new Map<string, DayInfo>();
    const get = (k: string) => {
      let v = map.get(k);
      if (!v) { v = { tasks: [], ghosts: [], completed: 0, focusMin: 0, habits: 0, events: 0 }; map.set(k, v); }
      return v;
    };
    const from = rangeFrom < agendaFrom ? rangeFrom : agendaFrom;
    const to   = rangeTo > agendaTo ? rangeTo : agendaTo;

    for (const t of tasks) {
      if (!t.deadline) continue;
      get(deadlineDateKey(t.deadline)).tasks.push(t);
      for (const occ of projectRecurrences(t, from, to)) {
        const k = deadlineDateKey(occ);
        // Skip if a real instance already exists on that day
        if (!get(k).tasks.some((x) => x.text === t.text && x.recurring === t.recurring)) {
          get(k).ghosts.push({ ...t, deadline: occ });
        }
      }
    }
    for (const e of entries) {
      const k = toDateKey(new Date(e.at));
      if (k < from || k > to) continue;
      const d = get(k);
      d.events++;
      if (e.type === "task_completed") d.completed++;
      if (e.type === "focus_session")  d.focusMin += e.minutes ?? 0;
    }
    for (const h of habits) for (const k of h.completions) if (k >= from && k <= to) get(k).habits++;

    for (const v of map.values()) {
      v.tasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const ad = isAllDay(a.deadline!), bd = isAllDay(b.deadline!);
        if (ad !== bd) return ad ? -1 : 1;
        return parseDeadline(a.deadline!).getTime() - parseDeadline(b.deadline!).getTime();
      });
    }
    return map;
  }, [tasks, entries, habits, rangeFrom, rangeTo, agendaFrom, agendaTo]);

  const maxActivity = useMemo(() => {
    let m = 1;
    for (const [k, v] of byDay) if (k >= rangeFrom && k <= rangeTo) m = Math.max(m, v.completed + v.habits + Math.round(v.focusMin / 25));
    return m;
  }, [byDay, rangeFrom, rangeTo]);

  const shiftMonth = (delta: number) => {
    setDir(delta);
    setCursor(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const goToday = () => {
    const d = new Date();
    setDir(0);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
    setSelected(todayKey);
  };

  const info     = byDay.get(selected);
  const dayTasks = info?.tasks ?? [];
  const ghosts   = info?.ghosts ?? [];
  const dayLog   = useMemo(() => entries.filter((e) => toDateKey(new Date(e.at)) === selected), [entries, selected]);

  const handleQuickAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    const raw = quick.trim();
    if (!raw) return;
    const nlp = parseTaskInput(raw);
    // The selected day wins; a time typed in the text is kept
    const time = nlp.deadline && !isAllDay(nlp.deadline) ? nlp.deadline.slice(11, 16) : null;
    addTask(nlp.tokens.length ? nlp.text || raw : raw, makeDeadline(selected, time), nlp.priority ?? "normal", null, nlp.recurring);
    setQuick("");
    navigator.vibrate?.(8);
  };

  const monthTotals = useMemo(() => {
    let pending = 0, done = 0;
    for (const [k, v] of byDay) {
      if (!k.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}`)) continue;
      pending += v.tasks.filter((t) => !t.completed).length;
      done    += v.completed;
    }
    return { pending, done };
  }, [byDay, cursor]);

  return (
    <div className="app calendar-page">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="cal-top">
          <div>
            <h1 className="page-title" style={{ marginBottom: 2 }}>Kalendarz</h1>
            <p className="page-subtitle">
              {monthTotals.pending} {plural(monthTotals.pending, "zaplanowane", "zaplanowane", "zaplanowanych")} · {monthTotals.done} ukończonych w tym miesiącu
            </p>
          </div>
          <Link to="/activity" className="cal-journal-link" aria-label="Dziennik aktywności">
            <span aria-hidden>📓</span> Dziennik
          </Link>
        </div>

        <div className="segmented" role="tablist" aria-label="Widok kalendarza">
          {(["month", "agenda"] as View[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              className={`segmented__btn${view === v ? " active" : ""}`}
              onClick={() => setView(v)}
            >
              {view === v && <motion.span layoutId="cal-view-pill" className="segmented__pill" />}
              <span>{v === "month" ? "Miesiąc" : "Agenda"}</span>
            </button>
          ))}
        </div>

        {view === "month" && (
          <>
            <div className="cal-header">
              <button className="cal-nav-btn" onClick={() => shiftMonth(-1)} aria-label="Poprzedni miesiąc">‹</button>
              <button className="cal-month-label" onClick={goToday} title="Wróć do dziś">
                {MONTH_NAMES[cursor.m]} <span>{cursor.y}</span>
              </button>
              <button className="cal-nav-btn" onClick={() => shiftMonth(1)} aria-label="Następny miesiąc">›</button>
            </div>

            <div className="cal-grid cal-grid--header">
              {DAY_NAMES.map((d, i) => (
                <div key={d} className={`cal-day-name${i >= 5 ? " cal-day-name--weekend" : ""}`}>{d}</div>
              ))}
            </div>

            <div className="cal-grid-viewport">
              <AnimatePresence initial={false} custom={dir} mode="popLayout">
                <motion.div
                  key={`${cursor.y}-${cursor.m}`}
                  className="cal-grid"
                  custom={dir}
                  initial={{ opacity: 0, x: dir * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -40 }}
                  transition={{ duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  onDragEnd={(_, i) => {
                    if (i.offset.x < -60) shiftMonth(1);
                    else if (i.offset.x > 60) shiftMonth(-1);
                  }}
                >
                  {grid.map((date) => {
                    const key   = toDateKey(date);
                    const d     = byDay.get(key);
                    const out   = date.getMonth() !== cursor.m;
                    const pend  = d?.tasks.filter((t) => !t.completed) ?? [];
                    const overdue = key < todayKey && pend.length > 0;
                    const intensity = d ? Math.min(1, (d.completed + d.habits + Math.round(d.focusMin / 25)) / maxActivity) : 0;
                    const dots = [...pend.map((t) => PRIORITY_CONFIG[t.priority ?? "normal"].color)].slice(0, 3);

                    return (
                      <button
                        key={key}
                        className={[
                          "cal-cell",
                          out && "cal-cell--outside",
                          key === todayKey && "cal-cell--today",
                          key === selected && "cal-cell--selected",
                          overdue && "cal-cell--overdue",
                        ].filter(Boolean).join(" ")}
                        style={{ "--heat": intensity } as React.CSSProperties}
                        onClick={() => {
                          setSelected(key);
                          if (out) { setDir(date < grid[10] ? -1 : 1); setCursor({ y: date.getFullYear(), m: date.getMonth() }); }
                        }}
                        aria-label={`${dayHeading(key)}${pend.length ? `, ${pend.length} zadań` : ""}`}
                        aria-pressed={key === selected}
                      >
                        <span className="cal-cell__num">{date.getDate()}</span>
                        <span className="cal-cell__dots">
                          {dots.map((c, i) => <span key={i} className="cal-dot" style={{ background: c }} />)}
                          {!dots.length && (d?.ghosts.length ?? 0) > 0 && <span className="cal-dot cal-dot--ghost" />}
                          {pend.length > 3 && <span className="cal-cell__more">+{pend.length - 3}</span>}
                        </span>
                        {(d?.completed ?? 0) > 0 && <span className="cal-cell__done" aria-hidden>✓</span>}
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="cal-legend">
              <span><i className="cal-legend__heat" /> aktywność</span>
              <span><i className="cal-dot" style={{ background: PRIORITY_CONFIG.urgent.color }} /> pilne</span>
              <span><i className="cal-dot cal-dot--ghost" /> powtarzające</span>
            </div>

            {/* Day panel */}
            <AnimatePresence mode="wait">
              <motion.section
                key={selected}
                className="cal-day-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <header className="cal-day-panel__head">
                  <div>
                    <h3 className="cal-day-panel__title">{dayHeading(selected)}</h3>
                    <p className="cal-day-panel__sub">
                      {fromDateKey(selected).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="cal-day-panel__stats">
                    {(info?.completed ?? 0) > 0 && <span title="Ukończone">✔ {info!.completed}</span>}
                    {(info?.focusMin ?? 0) > 0 && <span title="Skupienie">◎ {info!.focusMin}m</span>}
                    {(info?.habits ?? 0) > 0 && <span title="Nawyki">🌱 {info!.habits}</span>}
                  </div>
                </header>

                <div className="cal-tabs" role="tablist">
                  <button role="tab" aria-selected={tab === "plan"} className={tab === "plan" ? "active" : ""} onClick={() => setTab("plan")}>
                    Plan {dayTasks.length + ghosts.length > 0 && <em>{dayTasks.length + ghosts.length}</em>}
                  </button>
                  <button role="tab" aria-selected={tab === "log"} className={tab === "log" ? "active" : ""} onClick={() => setTab("log")}>
                    Dziennik {dayLog.length > 0 && <em>{dayLog.length}</em>}
                  </button>
                </div>

                {tab === "plan" ? (
                  <>
                    {dayTasks.length === 0 && ghosts.length === 0 ? (
                      <p className="cal-day-panel__empty">
                        {selected < todayKey ? "Tego dnia nic nie było zaplanowane" : "Wolny dzień — dodaj coś poniżej"}
                      </p>
                    ) : (
                      <ul className="cal-day-panel__list">
                        {dayTasks.map((t) => {
                          const cat = categories.find((c) => c.id === t.categoryId);
                          const status = t.completed ? "" : deadlineStatus(t.deadline!);
                          return (
                            <motion.li
                              key={t.id}
                              layout
                              className={`cal-task${t.completed ? " cal-task--done" : ""}${status === "overdue" ? " cal-task--overdue" : ""}`}
                              style={{ "--pc": PRIORITY_CONFIG[t.priority ?? "normal"].color } as React.CSSProperties}
                            >
                              <button
                                className={`cal-task__check${t.completed ? " checked" : ""}`}
                                onClick={() => toggleTask(t.id)}
                                aria-label={t.completed ? "Oznacz jako nieukończone" : "Ukończ"}
                              >
                                {t.completed ? "✔" : ""}
                              </button>
                              <button className="cal-task__body" onClick={() => openTask(t.id)}>
                                <span className="cal-task__text">{t.text}</span>
                                <span className="cal-task__meta">
                                  {cat && <span style={{ color: cat.color }}>{cat.emoji} {cat.name}</span>}
                                  {t.recurring && <span>🔁</span>}
                                  {(t.subtasks?.length ?? 0) > 0 && (
                                    <span>☑ {t.subtasks!.filter((s) => s.completed).length}/{t.subtasks!.length}</span>
                                  )}
                                </span>
                              </button>
                              <span className="cal-task__time">
                                {isAllDay(t.deadline!) ? "cały dzień" : fmtTime(parseDeadline(t.deadline!))}
                              </span>
                            </motion.li>
                          );
                        })}
                        {ghosts.map((g, i) => (
                          <li key={`g-${g.id}-${i}`} className="cal-task cal-task--ghost" title="Kolejne powtórzenie">
                            <span className="cal-task__check" aria-hidden>🔁</span>
                            <span className="cal-task__body">
                              <span className="cal-task__text">{g.text}</span>
                              <span className="cal-task__meta"><span>pojawi się po ukończeniu poprzedniego</span></span>
                            </span>
                            <span className="cal-task__time">
                              {isAllDay(g.deadline!) ? "cały dzień" : fmtTime(parseDeadline(g.deadline!))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <form className="cal-quick-add" onSubmit={handleQuickAdd}>
                      <input
                        ref={quickRef}
                        value={quick}
                        onChange={(e) => setQuick(e.target.value)}
                        placeholder={`Dodaj na ${dayHeading(selected).toLowerCase()}… np. „raport o 14”`}
                        aria-label="Szybko dodaj zadanie na wybrany dzień"
                      />
                      <button type="submit" disabled={!quick.trim()} aria-label="Dodaj">＋</button>
                    </form>
                  </>
                ) : (
                  <ActivityTimeline entries={dayLog} grouped={false} emptyText="Brak zapisów tego dnia" />
                )}
              </motion.section>
            </AnimatePresence>
          </>
        )}

        {view === "agenda" && <Agenda byDay={byDay} from={agendaFrom} to={agendaTo} onOpen={openTask} onToggle={toggleTask} />}

        <CalendarSync />
      </motion.div>
    </div>
  );
}

function Agenda({
  byDay, from, to, onOpen, onToggle,
}: {
  byDay: Map<string, DayInfo>;
  from: string; to: string;
  onOpen: (id: number) => void;
  onToggle: (id: number) => void;
}) {
  const tasks   = useTaskStore((s) => s.tasks);
  const overdue = useMemo(
    () => tasks.filter((t) => !t.completed && t.deadline && deadlineStatus(t.deadline) === "overdue" && deadlineDateKey(t.deadline) < from),
    [tasks, from]
  );
  const noDate  = tasks.filter((t) => !t.completed && !t.deadline).length;
  const days: string[] = [];
  for (let d = fromDateKey(from); toDateKey(d) <= to; d = addDays(d, 1)) {
    const k = toDateKey(d);
    const v = byDay.get(k);
    if (v && (v.tasks.some((t) => !t.completed) || v.ghosts.length)) days.push(k);
  }

  const Row = ({ t, ghost }: { t: Task; ghost?: boolean }) => (
    <li className={`agenda-row${ghost ? " agenda-row--ghost" : ""}`} style={{ "--pc": PRIORITY_CONFIG[t.priority ?? "normal"].color } as React.CSSProperties}>
      <span className="agenda-row__time">{isAllDay(t.deadline!) ? "—" : fmtTime(parseDeadline(t.deadline!))}</span>
      {!ghost ? (
        <button className="cal-task__check" onClick={() => onToggle(t.id)} aria-label="Ukończ" />
      ) : <span className="cal-task__check" aria-hidden>🔁</span>}
      <button className="agenda-row__text" onClick={() => !ghost && onOpen(t.id)} disabled={ghost}>{t.text}</button>
    </li>
  );

  return (
    <div className="agenda">
      {overdue.length > 0 && (
        <section className="agenda-day agenda-day--overdue">
          <h4>Zaległe <em>{overdue.length}</em></h4>
          <ul>{overdue.map((t) => <Row key={t.id} t={t} />)}</ul>
        </section>
      )}
      {days.length === 0 && overdue.length === 0 && (
        <p className="cal-day-panel__empty">Najbliższe 30 dni są wolne 🌤</p>
      )}
      {days.map((k) => {
        const v = byDay.get(k)!;
        return (
          <section key={k} className="agenda-day">
            <h4>{dayHeading(k)} <span>{fromDateKey(k).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}</span></h4>
            <ul>
              {v.tasks.filter((t) => !t.completed).map((t) => <Row key={t.id} t={t} />)}
              {v.ghosts.map((g, i) => <Row key={`g${g.id}-${i}`} t={g} ghost />)}
            </ul>
          </section>
        );
      })}
      {noDate > 0 && (
        <p className="agenda-nodate">
          <Link to="/tasks">{noDate} {plural(noDate, "zadanie", "zadania", "zadań")} bez terminu →</Link>
        </p>
      )}
    </div>
  );
}
