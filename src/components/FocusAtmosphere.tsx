import { motion } from "framer-motion";
import type { SoundMode } from "../hooks/useFocusAudio";

type Mode = "work" | "shortBreak" | "longBreak";

const CIRCUMFERENCE = 2 * Math.PI * 45;

const ATM: Record<Mode, { c1: string; c2: string; c3: string; accent: string; glow: string }> = {
  work: {
    c1: "#818cf8", c2: "#a78bfa", c3: "#6366f1",
    accent: "#818cf8",
    glow:   "rgba(129,140,248,0.55)",
  },
  shortBreak: {
    c1: "#34d399", c2: "#6ee7b7", c3: "#10b981",
    accent: "#34d399",
    glow:   "rgba(52,211,153,0.55)",
  },
  longBreak: {
    c1: "#c084fc", c2: "#a78bfa", c3: "#9333ea",
    accent: "#c084fc",
    glow:   "rgba(192,132,252,0.55)",
  },
};

const SOUND_OPTS: Array<{ id: SoundMode; icon: string; label: string }> = [
  { id: "off",      icon: "🔇", label: "Cisza"    },
  { id: "brown",    icon: "🌊", label: "Ocean"    },
  { id: "rain",     icon: "🌧", label: "Deszcz"   },
  { id: "binaural", icon: "🎵", label: "Binaural" },
];

interface Props {
  mode: Mode;
  modeLabel: string;
  timeStr: string;
  progress: number;    // 1 = full, 0 = empty
  running: boolean;
  sessions: number;
  soundMode: SoundMode;
  taskName?: string | null;
  onToggle: () => void;
  onSoundChange: (s: SoundMode) => void;
  onExit: () => void;
}

export default function FocusAtmosphere({
  mode, modeLabel, timeStr, progress, running, sessions,
  soundMode, taskName, onToggle, onSoundChange, onExit,
}: Props) {
  const col       = ATM[mode];
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const dotsCount  = sessions === 0 ? 0 : sessions % 4 === 0 ? 4 : sessions % 4;

  return (
    <motion.div
      className="focus-atm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="focus-atm__bg" aria-hidden="true">
        <motion.div
          className="focus-atm__blob"
          animate={{
            x: ["-5%", "12%", "-8%", "5%", "-5%"],
            y: ["-8%",  "6%", "18%", "-4%", "-8%"],
            scale: [1, 1.14, 0.93, 1.07, 1],
          }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: "65vw", height: "65vw",
            top: "-15%", left: "-12%",
            background: `radial-gradient(circle, ${col.c1}26, transparent 68%)`,
          }}
        />
        <motion.div
          className="focus-atm__blob"
          animate={{
            x: ["4%", "-10%", "14%", "-2%", "4%"],
            y: ["5%",  "22%", "-6%", "14%", "5%"],
            scale: [1, 0.91, 1.12, 0.96, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          style={{
            width: "60vw", height: "60vw",
            bottom: "8%", right: "-8%",
            background: `radial-gradient(circle, ${col.c2}1e, transparent 68%)`,
          }}
        />
        <motion.div
          className="focus-atm__blob"
          animate={{ scale: [1, 1.09, 0.96, 1.05, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut", delay: 10 }}
          style={{
            width: "90vw", height: "90vw",
            top: "5%", left: "5%",
            background: `radial-gradient(circle, ${col.c3}0d, transparent 70%)`,
          }}
        />
      </div>

      <div className="focus-atm__top">
        <div className="focus-atm__top-left">
          <span className="focus-atm__mode-pill">{modeLabel}</span>
          {taskName && (
            <span className="focus-atm__task-name">{taskName}</span>
          )}
        </div>
        <motion.button
          className="focus-atm__exit"
          onClick={onExit}
          whileTap={{ scale: 0.85 }}
          aria-label="Zamknij atmosferę"
        >
          ✕
        </motion.button>
      </div>

      <div className="focus-atm__ring-wrap">
        {/* Breathing halo */}
        <motion.div
          className="focus-atm__halo"
          animate={
            running
              ? { scale: [1, 1.07, 1], opacity: [0.15, 0.28, 0.15] }
              : { scale: 1, opacity: 0.08 }
          }
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: `radial-gradient(circle, ${col.accent}50, transparent 62%)` }}
        />

        <svg className="focus-atm__ring" viewBox="0 0 100 100" aria-label={`Timer: ${timeStr}`}>
          {/* Track */}
          <circle cx="50" cy="50" r="45" fill="none" strokeWidth="3.5" stroke="rgba(255,255,255,0.07)" />
          {/* Progress */}
          <motion.circle
            cx="50" cy="50" r="45"
            fill="none"
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke={col.accent}
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.85, ease: "linear" }}
            style={{
              transformOrigin: "50% 50%",
              rotate: "-90deg",
              filter: `drop-shadow(0 0 10px ${col.glow}) drop-shadow(0 0 3px ${col.glow})`,
            }}
          />
        </svg>

        {/* Center */}
        <div className="focus-atm__center">
          <div className="focus-atm__time" style={{ color: col.accent }}>
            {timeStr}
          </div>
          {sessions > 0 && (
            <div className="focus-atm__sessions-note">
              {sessions} {sessions === 1 ? "sesja" : sessions < 5 ? "sesje" : "sesji"}
            </div>
          )}
        </div>
      </div>

      <div className="focus-atm__dots">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.span
            key={i}
            className="focus-atm__dot"
            animate={i < dotsCount ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.35 }}
            style={
              i < dotsCount
                ? { background: col.accent, boxShadow: `0 0 10px ${col.glow}` }
                : undefined
            }
          />
        ))}
      </div>

      <motion.button
        className="focus-atm__play"
        onClick={() => {
          navigator.vibrate?.(running ? 4 : 8);
          onToggle();
        }}
        whileTap={{ scale: 0.9 }}
        style={{
          background: `linear-gradient(135deg, ${col.c1}, ${col.c2})`,
          boxShadow: `0 10px 32px ${col.glow}, 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)`,
        }}
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

      <div className="focus-atm__sound-bar">
        <p className="focus-atm__sound-label">Dźwięk otoczenia</p>
        <div className="focus-atm__sound-opts">
          {SOUND_OPTS.map((opt) => {
            const active = soundMode === opt.id;
            return (
              <motion.button
                key={opt.id}
                className={`focus-atm__sound-btn${active ? " focus-atm__sound-btn--on" : ""}`}
                onClick={() => onSoundChange(opt.id)}
                whileTap={{ scale: 0.9 }}
                style={active ? { borderColor: col.accent, color: col.accent, background: `${col.accent}16` } : undefined}
              >
                <span className="focus-atm__sound-icon">{opt.icon}</span>
                <span className="focus-atm__sound-name">{opt.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
