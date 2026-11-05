import { motion, AnimatePresence } from "framer-motion";
import { useActivityStore, type ActivityEntry, type ActivityType } from "../../stores/useActivityStore";
import { useTaskStore } from "../../stores/useTaskStore";
import { useCategoryStore } from "../../stores/useCategoryStore";
import { useUIStore } from "../../stores/useUIStore";
import { toast } from "../../notifications/toastStore";
import { fmtTime, toDateKey, fromDateKey, addDays, plural } from "../../utils/dateUtils";

export const ACTIVITY_META: Record<ActivityType, { icon: string; label: string; tone: string }> = {
  task_created:      { icon: "＋", label: "Dodano",            tone: "accent"  },
  task_completed:    { icon: "✔",  label: "Ukończono",         tone: "success" },
  task_reopened:     { icon: "↺",  label: "Przywrócono do pracy", tone: "muted" },
  task_deleted:      { icon: "✕",  label: "Usunięto",          tone: "error"   },
  task_restored:     { icon: "⤺",  label: "Odzyskano",         tone: "accent"  },
  task_rescheduled:  { icon: "⇢",  label: "Przełożono",        tone: "warning" },
  task_edited:       { icon: "✎",  label: "Edytowano",         tone: "muted"   },
  subtask_completed: { icon: "☑",  label: "Podzadanie",        tone: "success" },
  habit_done:        { icon: "🌱", label: "Nawyk wykonany",    tone: "success" },
  habit_undone:      { icon: "○",  label: "Nawyk cofnięty",    tone: "muted"   },
  focus_session:     { icon: "◎",  label: "Skupienie",         tone: "accent"  },
  reminder:          { icon: "🔔", label: "Przypomnienie",     tone: "warning" },
  import:            { icon: "⇩",  label: "Import",            tone: "muted"   },
};

export function dayHeading(key: string): string {
  const today = toDateKey(new Date());
  if (key === today) return "Dziś";
  if (key === toDateKey(addDays(new Date(), -1))) return "Wczoraj";
  const d = fromDateKey(key);
  const s = d.toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function EntryRow({ e, index }: { e: ActivityEntry; index: number }) {
  const meta        = ACTIVITY_META[e.type];
  const categories  = useCategoryStore((s) => s.categories);
  const taskExists  = useTaskStore((s) => (e.taskId ? s.tasks.some((t) => t.id === e.taskId) : false));
  const restoreTask = useTaskStore((s) => s.restoreTask);
  const markRestored = useActivityStore((s) => s.markRestored);
  const openTask    = useUIStore((s) => s.setSelectedTaskId);
  const cat = e.categoryId ? categories.find((c) => c.id === e.categoryId) : undefined;

  const canOpen    = !!e.taskId && taskExists && e.type !== "task_deleted";
  const canRestore = e.type === "task_deleted" && !!e.snapshot && !taskExists;

  return (
    <motion.li
      className={`activity-row activity-row--${meta.tone}`}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.25) }}
    >
      <span className="activity-row__time">{fmtTime(new Date(e.at))}</span>
      <span className="activity-row__node" aria-hidden>{meta.icon}</span>
      <div
        className={`activity-row__body${canOpen ? " activity-row__body--link" : ""}`}
        onClick={canOpen ? () => openTask(e.taskId!) : undefined}
        role={canOpen ? "button" : undefined}
        tabIndex={canOpen ? 0 : undefined}
        onKeyDown={canOpen ? (ev) => { if (ev.key === "Enter") openTask(e.taskId!); } : undefined}
      >
        <span className="activity-row__label">
          {meta.label}
          {e.minutes ? <em> · {e.minutes} min</em> : null}
        </span>
        <span className={`activity-row__title${e.type === "task_deleted" ? " activity-row__title--struck" : ""}`}>
          {e.title}
        </span>
        {(e.detail && e.type !== "reminder") || cat ? (
          <span className="activity-row__detail">
            {cat && <span className="activity-row__cat" style={{ color: cat.color }}>{cat.emoji} {cat.name}</span>}
            {e.detail && e.type !== "reminder" && <span>{e.detail}</span>}
          </span>
        ) : null}
      </div>
      {canRestore && (
        <button
          className="activity-row__action"
          onClick={() => {
            restoreTask(e.snapshot!);
            markRestored(e.id);
            toast({ kind: "success", title: "Przywrócono zadanie", body: e.title, ttl: 3000 });
          }}
        >
          Przywróć
        </button>
      )}
    </motion.li>
  );
}

interface Props {
  entries: ActivityEntry[];
  grouped?: boolean;
  emptyText?: string;
}

/** Vertical timeline, newest first, optionally grouped by local day. */
export default function ActivityTimeline({ entries, grouped = true, emptyText = "Brak aktywności" }: Props) {
  if (!entries.length) {
    return <p className="activity-empty">{emptyText}</p>;
  }

  const sorted = [...entries].sort((a, b) => b.at.localeCompare(a.at));

  if (!grouped) {
    return (
      <ul className="activity-list">
        <AnimatePresence initial={false}>
          {sorted.map((e, i) => <EntryRow key={e.id} e={e} index={i} />)}
        </AnimatePresence>
      </ul>
    );
  }

  const groups = new Map<string, ActivityEntry[]>();
  for (const e of sorted) {
    const k = toDateKey(new Date(e.at));
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(e);
  }

  return (
    <div className="activity-groups">
      {[...groups.entries()].map(([day, list]) => {
        const done  = list.filter((e) => e.type === "task_completed").length;
        const focus = list.reduce((s, e) => s + (e.type === "focus_session" ? e.minutes ?? 0 : 0), 0);
        return (
          <section key={day} className="activity-group">
            <header className="activity-group__head">
              <h3>{dayHeading(day)}</h3>
              <span className="activity-group__meta">
                {done > 0 && <span>✔ {done}</span>}
                {focus > 0 && <span>◎ {focus} min</span>}
                <span>{list.length} {plural(list.length, "zdarzenie", "zdarzenia", "zdarzeń")}</span>
              </span>
            </header>
            <ul className="activity-list">
              <AnimatePresence initial={false}>
                {list.map((e, i) => <EntryRow key={e.id} e={e} index={i} />)}
              </AnimatePresence>
            </ul>
          </section>
        );
      })}
    </div>
  );
}
