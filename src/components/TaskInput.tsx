import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "../stores/useTaskStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import { parseTaskInput } from "../utils/nlp";
import type { Priority, Recurring } from "../types";
import { PRIORITY_CONFIG } from "../utils/constants";

const PRIORITIES = (Object.keys(PRIORITY_CONFIG) as Priority[]).map((value) => ({
  value,
  ...PRIORITY_CONFIG[value],
}));

const RECURRING_OPTIONS: { value: Recurring; label: string; emoji: string }[] = [
  { value: "daily",   label: "Codziennie", emoji: "📅" },
  { value: "weekly",  label: "Co tydzień", emoji: "📆" },
  { value: "monthly", label: "Co miesiąc", emoji: "🗓️" },
];

interface Props {
  onSave?: () => void;
}

export default function TaskInput({ onSave }: Props) {
  const addTask = useTaskStore((s) => s.addTask);
  const { categories } = useCategoryStore();

  const [text,       setText]       = useState("");
  const [date,       setDate]       = useState("");
  const [time,       setTime]       = useState("");
  const [priority,   setPriority]   = useState<Priority>("normal");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [recurring,  setRecurring]  = useState<Recurring | null>(null);

  const textRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => textRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  // NLP runs on every text change — pure function, fast
  const nlp = useMemo(() => parseTaskInput(text), [text]);

  // Effective values: NLP wins when it detects something, form otherwise
  const effectivePriority  = nlp.priority  ?? priority;
  const effectiveRecurring = nlp.recurring ?? recurring;

  const effectiveDeadline = (): string | null => {
    if (nlp.deadline) return nlp.deadline;
    if (!date) return null;
    return time ? `${date}T${time}:00` : `${date}T00:00:00`;
  };

  const handleAdd = () => {
    const taskText = nlp.tokens.length > 0 ? nlp.text : text.trim();
    if (!taskText) {
      textRef.current?.focus();
      return;
    }
    addTask(taskText, effectiveDeadline(), effectivePriority, categoryId, effectiveRecurring);
    setText("");
    setDate("");
    setTime("");
    setPriority("normal");
    setCategoryId(null);
    setRecurring(null);
    onSave?.();
  };

  const canAdd = text.trim().length > 0;
  const nlpControlsDate     = !!nlp.deadline;
  const nlpControlsPriority = nlp.priority !== null;
  const nlpControlsRec      = nlp.recurring !== null;

  return (
    <div className="task-input">

      <div className="task-input__section">
        <div className="task-input__label-row">
          <span className="task-input__section-label">Treść zadania</span>
          {nlp.tokens.length > 0 && (
            <span className="task-input__nlp-hint">✨ wykryto automatycznie</span>
          )}
        </div>
        <input
          ref={textRef}
          type="text"
          className={`task-input__text${nlp.tokens.length > 0 ? " task-input__text--nlp" : ""}`}
          placeholder={'np. \u201Espotkanie jutro o 14, pilne\u201C'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          aria-label="Wpisz treść zadania"
          autoComplete="off"
        />

        {/* NLP chips */}
        <AnimatePresence>
          {nlp.tokens.length > 0 && (
            <motion.div
              className="nlp-chips"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {nlp.tokens.map((token) => (
                <span key={token.type} className={`nlp-chip nlp-chip--${token.type}`}>
                  {token.label}
                </span>
              ))}
              {nlp.text && nlp.text !== text.trim() && (
                <span className="nlp-chip nlp-chip--text" title="Tekst zadania po oczyszczeniu">
                  📝 „{nlp.text}"
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="task-input__divider" />

      {/* Priority — hidden when NLP controls it */}
      <AnimatePresence initial={false}>
        {!nlpControlsPriority && (
          <motion.div
            key="priority-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="task-input__section">
              <span className="task-input__section-label">Priorytet</span>
              <div className="priority-select">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    className={`priority-btn ${priority === p.value ? "active" : ""}`}
                    style={{ "--priority-color": p.color } as React.CSSProperties}
                    onClick={() => setPriority(p.value)}
                    type="button"
                    title={p.label}
                  >
                    {p.emoji} <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="task-input__divider" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category */}
      <div className="task-input__section">
        <span className="task-input__section-label">Kategoria</span>
        <select
          className="category-select"
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
          aria-label="Wybierz kategorię"
        >
          <option value="">📁 Brak kategorii</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.emoji} {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="task-input__divider" />

      {/* Date/time — hidden when NLP controls it */}
      <AnimatePresence initial={false}>
        {!nlpControlsDate && (
          <motion.div
            key="date-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="task-input__section">
              <span className="task-input__section-label">Termin wykonania</span>
              <div className="datetime-inputs">
                <div className="datetime-field">
                  <span className="datetime-field__label">📅 Data</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    aria-label="Wybierz datę zadania"
                  />
                </div>
                <div className="datetime-field">
                  <span className="datetime-field__label">⏰ Godzina</span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    aria-label="Wybierz godzinę zadania"
                  />
                </div>
              </div>
            </div>
            <div className="task-input__divider" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recurring — hidden when NLP controls it */}
      <AnimatePresence initial={false}>
        {!nlpControlsRec && (
          <motion.div
            key="recurring-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="task-input__section">
              <span className="task-input__section-label">Powtarzanie</span>
              <div className="recurring-select">
                {RECURRING_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    className={`recurring-btn ${recurring === r.value ? "active" : ""}`}
                    onClick={() => setRecurring(recurring === r.value ? null : r.value)}
                    type="button"
                    title={r.label}
                  >
                    {r.emoji} {r.label}
                  </button>
                ))}
                {recurring && (
                  <button
                    className="recurring-btn recurring-btn--clear"
                    onClick={() => setRecurring(null)}
                    type="button"
                  >
                    ✕ Wyczyść
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="task-input__submit"
        onClick={handleAdd}
        disabled={!canAdd}
        whileTap={canAdd ? { scale: 0.97 } : {}}
        animate={canAdd ? { opacity: 1 } : { opacity: 0.5 }}
        transition={{ duration: 0.15 }}
        type="button"
      >
        Dodaj zadanie
      </motion.button>

    </div>
  );
}
