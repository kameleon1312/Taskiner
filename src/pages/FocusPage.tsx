import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FocusAtmosphere    from "../components/FocusAtmosphere";
import { useFocusAudio }  from "../hooks/useFocusAudio";
import { useTaskStore }   from "../stores/useTaskStore";
import { useHabitStore }  from "../stores/useHabitStore";
import { useUIStore }     from "../stores/useUIStore";
import { playTone }       from "../notifications/sound";
import { formatDeadline } from "../utils/deadline";
import type { SoundMode } from "../hooks/useFocusAudio";
import { useFocusTimerStore, FOCUS_MODES, getRemainingMs, todaysFocusCount, type FocusMode } from "../stores/useFocusTimerStore";

const CIRCUMFERENCE = 2 * Math.PI * 45;

const MODES = FOCUS_MODES;

type Mode = FocusMode;

const TIPS: Record<Mode, string> = {
  work:       "💡 Usuń rozpraszacze i skup się na jednym zadaniu.",
  shortBreak: "☕ Wstań, porusz się, odpocznij od ekranu.",
  longBreak:  "🌿 Zasłużony odpoczynek — naładuj baterie!",
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: "#f87171",
  high:   "#fbbf24",
  normal: "#818cf8",
  low:    "#64748b",
};

export default function FocusPage() {
  const tasks  = useTaskStore((s) => s.tasks);
  const habits = useHabitStore((s) => s.habits);

  // Timer lives in a persisted store → keeps running across pages, reloads and background
  const mode            = useFocusTimerStore((s) => s.mode);
  const endAt           = useFocusTimerStore((s) => s.endAt);
  const remainingMs     = useFocusTimerStore((s) => s.remainingMs);
  const selectedTaskId  = useFocusTimerStore((s) => s.selectedTaskId);
  const selectedHabitId = useFocusTimerStore((s) => s.selectedHabitId);
  const lastFinished    = useFocusTimerStore((s) => s.lastFinished);
  const sessions        = useFocusTimerStore(todaysFocusCount);
  const timer           = useFocusTimerStore.getState;
  const running         = endAt !== null;

  const [, forceTick]            = useState(0);
  const [atmosphereOpen, setAtmosphereOpen] = useState(false);
  const [soundMode,      setSoundMode]      = useState<SoundMode>("off");
  const [justDone,       setJustDone]       = useState(false);
  const [finishedMode,   setFinishedMode]   = useState<Mode>("work");
  const [pickerOpen,     setPickerOpen]     = useState(false);

  useFocusAudio(running ? soundMode : "off");

  const justDoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const atmHistRef       = useRef(false);
  const mountedAt        = useRef(Date.now());

  // Repaint 4×/s while running (display only — the time source is the wall clock)
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => forceTick((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [running]);

  const activeTasks   = tasks.filter((t) => !t.completed);
  const selectedTask  = selectedTaskId  ? tasks.find((t) => t.id === selectedTaskId)   : null;
  const selectedHabit = selectedHabitId ? habits.find((h) => h.id === selectedHabitId) : null;

  const selectTask  = (id: number) => { timer().select(id, null); setPickerOpen(false); };
  const selectHabit = (id: number) => { timer().select(null, id); setPickerOpen(false); };
  const clearSelection = () => timer().select(null, null);

  // ─── Atmosphere history ────────────────────────────────────────────────────

  const exitAtmosphere = useCallback(() => {
    setAtmosphereOpen(false);
    if (atmHistRef.current) {
      atmHistRef.current = false;
      history.back();
    }
  }, []);

  useEffect(() => {
    if (atmosphereOpen) {
      history.pushState({ ...(history.state ?? {}), focusAtm: true }, "");
      atmHistRef.current = true;
      document.body.classList.add("atmosphere-open");
    } else {
      document.body.classList.remove("atmosphere-open");
    }
    return () => document.body.classList.remove("atmosphere-open");
  }, [atmosphereOpen]);

  useEffect(() => {
    const handlePop = () => { atmHistRef.current = false; setAtmosphereOpen(false); };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  useEffect(() => () => { if (justDoneTimerRef.current) clearTimeout(justDoneTimerRef.current); }, []);

  // ─── Completion feedback (the engine in App calls finish()) ───────────────
  useEffect(() => {
    if (!lastFinished || lastFinished.at < mountedAt.current - 5_000) return;
    setFinishedMode(lastFinished.mode);
    exitAtmosphere();
    setJustDone(true);
    navigator.vibrate?.([100, 80, 100, 80, 200]);
    // Reminders off → still give an audible cue for the finished session
    const ui = useUIStore.getState();
    if (!ui.notificationsEnabled || !ui.focusAlerts) playTone(ui.soundId, ui.soundVolume);
    justDoneTimerRef.current = setTimeout(() => setJustDone(false), 3500);
  }, [lastFinished, exitAtmosphere]);

  // ─── Timer ────────────────────────────────────────────────────────────────

  const totalSeconds = MODES[mode].minutes * 60;
  const secondsLeft  = Math.ceil(getRemainingMs({ endAt, remainingMs }) / 1000);
  const progress     = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const dashOffset   = CIRCUMFERENCE * (1 - progress);

  const switchMode = (m: Mode) => {
    timer().switchMode(m);
    exitAtmosphere();
  };

  const reset = () => timer().reset();

  const handlePlayPause = () => {
    if (running) timer().pause();
    else { timer().start(); setAtmosphereOpen(true); }
    navigator.vibrate?.(running ? 4 : 8);
  };

  const mins    = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs    = String(secondsLeft % 60).padStart(2, "0");
  const timeStr = `${mins}:${secs}`;

  useEffect(() => {
    if (!running) return;
    const prev = document.title;
    document.title = `${timeStr} · ${MODES[mode].label} — Taskiner`;
    return () => { document.title = prev; };
  }, [running, timeStr, mode]);

  const dotsCount = sessions === 0 ? 0 : sessions % 4 === 0 ? 4 : sessions % 4;

  return (
    <>
      <AnimatePresence>
        {atmosphereOpen && (
          <FocusAtmosphere
            key="atmosphere"
            mode={mode}
            modeLabel={MODES[mode].label}
            timeStr={timeStr}
            progress={progress}
            running={running}
            sessions={sessions}
            soundMode={soundMode}
            taskName={selectedTask?.text ?? (selectedHabit ? `${selectedHabit.emoji} ${selectedHabit.name}` : null)}
            onToggle={handlePlayPause}
            onSoundChange={setSoundMode}
            onExit={exitAtmosphere}
          />
        )}
      </AnimatePresence>

      <div className="app">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="page-title">Focus</h1>

          {/* Mode tabs */}
          <div className="focus-modes">
            {(Object.keys(MODES) as Mode[]).map((m) => (
              <button
                key={m}
                className={`focus-mode-btn${mode === m ? " active" : ""}`}
                style={mode === m ? { "--focus-color": MODES[m].color } as React.CSSProperties : undefined}
                onClick={() => switchMode(m)}
              >
                {MODES[m].label}
              </button>
            ))}
          </div>

          {/* Task / habit picker — only in work mode */}
          {mode === "work" && (
            <div className="focus-task-picker">
              <button
                className={`focus-task-btn${(selectedTask || selectedHabit) ? " focus-task-btn--selected" : ""}`}
                onClick={() => !running && setPickerOpen((o) => !o)}
                disabled={running}
              >
                {selectedTask ? (
                  <>
                    <span className="focus-task-dot" style={{ background: PRIORITY_DOT[selectedTask.priority ?? "normal"] }} />
                    <span className="focus-task-name">{selectedTask.text}</span>
                    <button className="focus-task-clear" onClick={(e) => { e.stopPropagation(); clearSelection(); }} aria-label="Odznacz">✕</button>
                  </>
                ) : selectedHabit ? (
                  <>
                    <span className="focus-task-dot" style={{ background: selectedHabit.color }} />
                    <span className="focus-task-name">{selectedHabit.emoji} {selectedHabit.name}</span>
                    <button className="focus-task-clear" onClick={(e) => { e.stopPropagation(); clearSelection(); }} aria-label="Odznacz">✕</button>
                  </>
                ) : (
                  <>
                    <span className="focus-task-icon">🎯</span>
                    <span className="focus-task-placeholder">Nad czym pracujesz?</span>
                    <span className="focus-task-arrow">{pickerOpen ? "▲" : "▼"}</span>
                  </>
                )}
              </button>

              <AnimatePresence>
                {pickerOpen && !running && (
                  <motion.div
                    className="focus-task-list"
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    {/* Tasks section */}
                    {activeTasks.length > 0 && (
                      <>
                        <p className="focus-picker-section-label">Zadania</p>
                        {activeTasks
                          .sort((a, b) => {
                            const order = { urgent: 0, high: 1, normal: 2, low: 3 };
                            return (order[a.priority ?? "normal"] ?? 2) - (order[b.priority ?? "normal"] ?? 2);
                          })
                          .slice(0, 6)
                          .map((task) => (
                            <button
                              key={task.id}
                              className={`focus-task-item${selectedTaskId === task.id ? " focus-task-item--active" : ""}`}
                              onClick={() => selectTask(task.id)}
                            >
                              <span className="focus-task-dot" style={{ background: PRIORITY_DOT[task.priority ?? "normal"] }} />
                              <span className="focus-task-item-text">{task.text}</span>
                              {task.deadline && (
                                <span className="focus-task-item-date">
                                  {formatDeadline(task.deadline)}
                                </span>
                              )}
                            </button>
                          ))}
                      </>
                    )}

                    {/* Habits section */}
                    {habits.length > 0 && (
                      <>
                        <p className="focus-picker-section-label">Nawyki</p>
                        {habits.slice(0, 5).map((habit) => (
                          <button
                            key={habit.id}
                            className={`focus-task-item${selectedHabitId === habit.id ? " focus-task-item--active" : ""}`}
                            onClick={() => selectHabit(habit.id)}
                          >
                            <span className="focus-task-dot" style={{ background: habit.color }} />
                            <span className="focus-task-item-text">{habit.emoji} {habit.name}</span>
                            <span className="focus-task-item-date">nawyk</span>
                          </button>
                        ))}
                      </>
                    )}

                    {activeTasks.length === 0 && habits.length === 0 && (
                      <p className="focus-task-empty">Brak zadań i nawyków</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Ring */}
          <div className="focus-ring-wrap">
            <svg className="focus-ring" viewBox="0 0 100 100" aria-label={`Timer: ${timeStr}`}>
              <circle cx="50" cy="50" r="45" strokeWidth="5" fill="none" stroke="rgba(255,255,255,0.06)" />
              <motion.circle
                cx="50" cy="50" r="45"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                stroke={MODES[mode].color}
                strokeDasharray={CIRCUMFERENCE}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.8, ease: "linear" }}
                style={{
                  transformOrigin: "50% 50%",
                  rotate: "-90deg",
                  filter: `drop-shadow(0 0 8px ${MODES[mode].color}88)`,
                }}
              />
            </svg>

            <div className="focus-ring__center">
              <div
                className="focus-ring__time"
                style={{ color: running ? MODES[mode].color : "var(--fg)" }}
              >
                {timeStr}
              </div>
              <div className="focus-ring__label">{MODES[mode].label}</div>
            </div>
          </div>

          {/* Completion banner */}
          <AnimatePresence>
            {justDone && (
              <motion.div
                className="focus-done-banner"
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                {finishedMode === "work"
                  ? `🎯 Sesja ukończona!${selectedTask ? ` · ${selectedTask.text.slice(0, 28)}${selectedTask.text.length > 28 ? "…" : ""}` : ""}`
                  : "✅ Przerwa skończona!"}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="focus-controls">
            <motion.button
              className="focus-btn focus-btn--secondary"
              onClick={reset}
              whileTap={{ scale: 0.9 }}
              title="Resetuj"
            >
              ↺
            </motion.button>

            <motion.button
              className={`focus-btn focus-btn--primary${running ? " focus-btn--pause" : ""}`}
              style={{ "--focus-color": MODES[mode].color } as React.CSSProperties}
              onClick={handlePlayPause}
              whileTap={{ scale: 0.93 }}
              aria-label={running ? "Pauza" : "Start"}
            >
              <motion.span
                key={running ? "pause" : "play"}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
              >
                {running ? "⏸" : "▶"}
              </motion.span>
            </motion.button>

            <div className="focus-session-dots">
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.span
                  key={i}
                  className={`focus-dot${i < dotsCount ? " focus-dot--filled" : ""}`}
                  style={i < dotsCount ? { background: MODES[mode].color, boxShadow: `0 0 6px ${MODES[mode].color}88` } : undefined}
                  animate={i < dotsCount ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </div>

          <AnimatePresence>
            {running && !atmosphereOpen && (
              <motion.button
                className="focus-reenter-btn"
                style={{ "--focus-color": MODES[mode].color } as React.CSSProperties}
                onClick={() => setAtmosphereOpen(true)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                whileTap={{ scale: 0.95 }}
              >
                🌊 Wróć do trybu skupienia
              </motion.button>
            )}
          </AnimatePresence>

          {sessions > 0 && (
            <motion.p
              className="focus-sessions-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              🎯 Ukończone sesje: <strong>{sessions}</strong>
              {sessions >= 4 && " 🔥"}
            </motion.p>
          )}

          <div className="focus-tip">{TIPS[mode]}</div>
        </motion.div>
      </div>
    </>
  );
}
