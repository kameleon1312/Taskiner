import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ActivityTimeline from "../components/activity/ActivityTimeline";
import { useActivityStore, ACTIVITY_GROUP, type ActivityGroup } from "../stores/useActivityStore";
import { toDateKey, addDays, plural } from "../utils/dateUtils";

const FILTERS: { id: ActivityGroup | "all"; label: string }[] = [
  { id: "all",    label: "Wszystko" },
  { id: "tasks",  label: "Zadania" },
  { id: "habits", label: "Nawyki" },
  { id: "focus",  label: "Skupienie" },
  { id: "system", label: "Przypomnienia" },
];

const PERIODS = [
  { days: 7,   label: "7 dni" },
  { days: 30,  label: "30 dni" },
  { days: 365, label: "Rok" },
];

function toCSV(rows: ReturnType<typeof useActivityStore.getState>["entries"]): string {
  const q = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const head = "data,godzina,typ,tytuł,szczegóły,minuty";
  const body = rows.map((e) => {
    const d = new Date(e.at);
    return [toDateKey(d), d.toTimeString().slice(0, 5), e.type, e.title, e.detail ?? "", e.minutes ?? ""].map(q).join(",");
  });
  return [head, ...body].join("\n");
}

export default function ActivityPage() {
  const navigate = useNavigate();
  const entries  = useActivityStore((s) => s.entries);
  const clear    = useActivityStore((s) => s.clear);

  const [filter, setFilter] = useState<ActivityGroup | "all">("all");
  const [period, setPeriod] = useState(30);
  const [query,  setQuery]  = useState("");
  const [limitDays, setLimitDays] = useState(10);
  const [confirmClear, setConfirmClear] = useState(false);

  const inPeriod = useMemo(() => {
    const from = toDateKey(addDays(new Date(), -(period - 1)));
    return entries.filter((e) => toDateKey(new Date(e.at)) >= from);
  }, [entries, period]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inPeriod.filter((e) => {
      if (filter !== "all" && ACTIVITY_GROUP[e.type] !== filter) return false;
      if (q && !`${e.title} ${e.detail ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [inPeriod, filter, query]);

  // Paginate by days (keeps day groups intact)
  const visible = useMemo(() => {
    const days = [...new Set(filtered.map((e) => toDateKey(new Date(e.at))))].sort().reverse();
    const allowed = new Set(days.slice(0, limitDays));
    return { list: filtered.filter((e) => allowed.has(toDateKey(new Date(e.at)))), more: days.length > limitDays };
  }, [filtered, limitDays]);

  const kpi = useMemo(() => {
    const done    = inPeriod.filter((e) => e.type === "task_completed").length;
    const created = inPeriod.filter((e) => e.type === "task_created").length;
    const focus   = inPeriod.reduce((s, e) => s + (e.type === "focus_session" ? e.minutes ?? 0 : 0), 0);
    const habits  = inPeriod.filter((e) => e.type === "habit_done").length;
    const activeDays = new Set(inPeriod.map((e) => toDateKey(new Date(e.at)))).size;
    return { done, created, focus, habits, activeDays };
  }, [inPeriod]);

  const exportCsv = () => {
    const blob = new Blob(["﻿" + toCSV(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `taskiner-dziennik-${toDateKey(new Date())}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="app">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="profile-page__header">
          <motion.button className="profile-page__back" onClick={() => navigate(-1)} whileTap={{ scale: 0.88 }} aria-label="Wróć">
            ←
          </motion.button>
          <div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Dziennik aktywności</h1>
            <p className="page-subtitle">
              {kpi.activeDays} {plural(kpi.activeDays, "aktywny dzień", "aktywne dni", "aktywnych dni")} · ostatnie {PERIODS.find((p) => p.days === period)?.label}
            </p>
          </div>
        </div>

        <div className="activity-kpis">
          <div className="activity-kpi"><strong>{kpi.done}</strong><span>ukończonych</span></div>
          <div className="activity-kpi"><strong>{kpi.created}</strong><span>dodanych</span></div>
          <div className="activity-kpi"><strong>{kpi.focus}<small>min</small></strong><span>skupienia</span></div>
          <div className="activity-kpi"><strong>{kpi.habits}</strong><span>nawyków</span></div>
        </div>

        <div className="segmented" role="tablist" aria-label="Okres">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              role="tab"
              aria-selected={period === p.days}
              className={`segmented__btn${period === p.days ? " active" : ""}`}
              onClick={() => { setPeriod(p.days); setLimitDays(10); }}
            >
              {period === p.days && <motion.span layoutId="activity-period" className="segmented__pill" />}
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        <div className="activity-toolbar">
          <input
            className="activity-search"
            type="search"
            placeholder="Szukaj w dzienniku…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="chip-row">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`chip${filter === f.id ? " chip--active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <ActivityTimeline
          entries={visible.list}
          emptyText={entries.length ? "Nic nie pasuje do filtrów" : "Dziennik zapełni się, gdy zaczniesz działać ✨"}
        />

        {visible.more && (
          <button className="btn-ghost activity-more" onClick={() => setLimitDays((n) => n + 14)}>
            Pokaż starsze dni
          </button>
        )}

        <div className="activity-footer">
          <button className="btn-ghost" onClick={exportCsv} disabled={!filtered.length}>⇩ Eksport CSV</button>
          <AnimatePresence mode="wait" initial={false}>
            {!confirmClear ? (
              <motion.button key="a" className="btn-ghost btn-ghost--danger" onClick={() => setConfirmClear(true)} disabled={!entries.length}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Wyczyść dziennik
              </motion.button>
            ) : (
              <motion.div key="b" className="activity-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <span>Na pewno?</span>
                <button className="btn-ghost" onClick={() => setConfirmClear(false)}>Nie</button>
                <button className="btn-ghost btn-ghost--danger" onClick={() => { clear(); setConfirmClear(false); }}>Tak, wyczyść</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
