import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHabitStore } from "../stores/useHabitStore";
import type { Habit } from "../types";
import { toDateKey } from "../utils/dateUtils";

const EMOJIS = [
  "📚", "💪", "🧘", "💧", "🏃", "✍️", "🎯", "😴",
  "🥗", "🧹", "🎸", "🧠", "🌿", "☕", "🚴", "🎨",
  "🛁", "🏋️", "🎻", "🧖", "🍎", "🌅", "🤸", "🧗",
];

const COLORS = [
  "#818cf8", "#34d399", "#fb923c", "#f472b6",
  "#60a5fa", "#a78bfa", "#fbbf24", "#f87171",
];

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return toDateKey(d);
  });
}

function calcStreak(completions: string[]): number {
  const set = new Set(completions);
  const today = toDateKey(new Date());
  let d = new Date();
  if (!set.has(today)) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (set.has(toDateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

const DAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

function getDayLabel(dateStr: string): string {
  const dow = new Date(dateStr + "T12:00:00").getDay(); // 0=Sun
  const idx = dow === 0 ? 6 : dow - 1;
  return DAY_LABELS[idx];
}

// ─── Habit Card ─────────────────────────────────────────────────────────────

function HabitCard({ habit, today }: { habit: Habit; today: string }) {
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const deleteHabit      = useHabitStore((s) => s.deleteHabit);

  const done   = habit.completions.includes(today);
  const streak = calcStreak(habit.completions);
  const last7  = getLast7Days();

  const handleToggle = () => {
    toggleCompletion(habit.id, today);
    navigator.vibrate?.(done ? 4 : [10, 5, 15]);
  };

  return (
    <motion.div
      className={`habit-card${done ? " habit-card--done" : ""}`}
      style={{ "--habit-color": habit.color } as React.CSSProperties}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
    >
      {/* Completion button */}
      <motion.button
        className={`habit-check${done ? " habit-check--done" : ""}`}
        onClick={handleToggle}
        whileTap={{ scale: 0.78 }}
        style={
          done
            ? { background: habit.color, borderColor: habit.color }
            : { borderColor: habit.color }
        }
        aria-label={done ? "Odznacz nawyk" : "Zaznacz nawyk"}
      >
        <AnimatePresence mode="wait">
          {done ? (
            <motion.span
              key="check"
              className="habit-check__mark"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 700, damping: 28 }}
            >
              ✓
            </motion.span>
          ) : (
            <motion.span
              key="emoji"
              className="habit-check__emoji"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {habit.emoji}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Body */}
      <div className="habit-card__body">
        <div className="habit-card__top-row">
          <span className="habit-card__name">{habit.name}</span>
          {streak > 0 && (
            <motion.span
              className="habit-card__streak"
              key={streak}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 0.35 }}
            >
              🔥 {streak}
            </motion.span>
          )}
        </div>

        <div className="habit-card__dots-row">
          {last7.map((date) => (
            <span key={date} className="habit-dot-wrap" title={`${getDayLabel(date)} ${date.slice(5)}`}>
              <span
                className={`habit-dot${habit.completions.includes(date) ? " habit-dot--filled" : ""}${date === today ? " habit-dot--today" : ""}`}
                style={habit.completions.includes(date) ? { background: habit.color, boxShadow: `0 0 5px ${habit.color}88` } : undefined}
              />
            </span>
          ))}
        </div>
      </div>

      {/* Delete */}
      <button
        className="habit-card__delete"
        onClick={() => deleteHabit(habit.id)}
        aria-label="Usuń nawyk"
      >
        ✕
      </button>
    </motion.div>
  );
}

// ─── Add Form ────────────────────────────────────────────────────────────────

function AddHabitForm({ onClose }: { onClose: () => void }) {
  const addHabit = useHabitStore((s) => s.addHabit);

  const [name,      setName]      = useState("");
  const [emoji,     setEmoji]     = useState(EMOJIS[0]);
  const [color,     setColor]     = useState(COLORS[0]);
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");

  const canAdd = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canAdd) return;
    addHabit({ name: name.trim(), emoji, color, frequency });
    onClose();
    navigator.vibrate?.(8);
  };

  return (
    <motion.div
      className="add-habit-form"
      initial={{ opacity: 0, y: -12, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{ overflow: "hidden" }}
    >
      <div className="add-habit-form__inner">
        <div className="add-habit-form__preview">
          <span className="add-habit-form__preview-emoji" style={{ background: color }}>
            {emoji}
          </span>
          <input
            className="add-habit-form__name-input"
            type="text"
            placeholder="Nazwa nawyku…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
            maxLength={40}
          />
        </div>

        <div className="add-habit-form__section-label">Emoji</div>
        <div className="emoji-picker">
          {EMOJIS.map((em) => (
            <button
              key={em}
              className={`emoji-picker__btn${emoji === em ? " emoji-picker__btn--active" : ""}`}
              onClick={() => setEmoji(em)}
              type="button"
            >
              {em}
            </button>
          ))}
        </div>

        <div className="add-habit-form__section-label">Kolor</div>
        <div className="color-picker">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-picker__swatch${color === c ? " color-picker__swatch--active" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              type="button"
              aria-label={c}
            />
          ))}
        </div>

        <div className="add-habit-form__section-label">Częstotliwość</div>
        <div className="add-habit-form__freq">
          {(["daily", "weekly"] as const).map((f) => (
            <button
              key={f}
              className={`freq-btn${frequency === f ? " freq-btn--active" : ""}`}
              style={frequency === f ? { borderColor: color, color } : undefined}
              onClick={() => setFrequency(f)}
              type="button"
            >
              {f === "daily" ? "📅 Dziennie" : "📆 Tygodniowo"}
            </button>
          ))}
        </div>

        <div className="add-habit-form__actions">
          <button className="add-habit-form__cancel" onClick={onClose} type="button">
            Anuluj
          </button>
          <motion.button
            className="add-habit-form__submit"
            style={canAdd ? { background: color } : undefined}
            onClick={handleSubmit}
            disabled={!canAdd}
            whileTap={canAdd ? { scale: 0.95 } : {}}
            type="button"
          >
            Dodaj nawyk
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HabitsPage() {
  const habits  = useHabitStore((s) => s.habits);
  const [formOpen, setFormOpen] = useState(false);

  const today = toDateKey(new Date());
  const doneCount  = habits.filter((h) => h.completions.includes(today)).length;
  const totalCount = habits.length;
  const allDone    = totalCount > 0 && doneCount === totalCount;

  return (
    <div className="app">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Header */}
        <div className="habits-header">
          <h1 className="page-title">Nawyki</h1>
          <motion.button
            className={`habits-add-btn${formOpen ? " habits-add-btn--open" : ""}`}
            onClick={() => setFormOpen((o) => !o)}
            whileTap={{ scale: 0.88 }}
          >
            <motion.span
              animate={{ rotate: formOpen ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
            >
              +
            </motion.span>
          </motion.button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {formOpen && <AddHabitForm key="form" onClose={() => setFormOpen(false)} />}
        </AnimatePresence>

        {/* Today's progress */}
        <AnimatePresence>
          {totalCount > 0 && (
            <motion.div
              className={`habits-progress${allDone ? " habits-progress--all-done" : ""}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="habits-progress__top">
                <span className="habits-progress__label">
                  {allDone ? "🎉 Wszystkie nawyki dziś zaliczone!" : `${doneCount} z ${totalCount} dziś`}
                </span>
                <span className="habits-progress__fraction">{doneCount}/{totalCount}</span>
              </div>
              <div className="habits-progress__track">
                <motion.div
                  className="habits-progress__fill"
                  initial={{ width: "0%" }}
                  animate={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {habits.length === 0 && !formOpen && (
          <motion.div
            className="habits-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <motion.div
              className="habits-empty__icon"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              🌱
            </motion.div>
            <p className="habits-empty__title">Zacznij budować nawyki</p>
            <p className="habits-empty__hint">
              Nawyki budują twoją tożsamość.<br />Każde małe działanie ma znaczenie.
            </p>
            <motion.button
              className="habits-empty__cta"
              onClick={() => setFormOpen(true)}
              whileTap={{ scale: 0.95 }}
            >
              + Dodaj pierwszy nawyk
            </motion.button>
          </motion.div>
        )}

        {/* Habit list */}
        <AnimatePresence>
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} today={today} />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
