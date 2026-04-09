import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Slide {
  icon:      string;
  iconText:  boolean;
  bg:        string;
  glow:      string;
  tag:       string;
  title:     string;
  desc:      string;
  features:  string[];
  ctaBg:     string;
}

const SLIDES: Slide[] = [
  {
    icon:     "T",
    iconText: true,
    bg:       "linear-gradient(145deg, #818cf8 0%, #34d399 100%)",
    glow:     "rgba(129, 140, 248, 0.35)",
    tag:      "Produktywność",
    title:    "Witaj w Taskiner™",
    desc:     "Twój osobisty asystent produktywności. Proste, szybkie i zawsze pod ręką.",
    features: [
      "Zadania z priorytetami i kategoriami",
      "Drag & drop oraz swipe‑to‑complete",
      "Focus Mode z timerem Pomodoro",
    ],
    ctaBg: "linear-gradient(135deg, #818cf8, #34d399)",
  },
  {
    icon:     "⏱",
    iconText: false,
    bg:       "linear-gradient(145deg, #34d399 0%, #22d3ee 100%)",
    glow:     "rgba(52, 211, 153, 0.35)",
    tag:      "Skupienie",
    title:    "Skup się.\nOsiągaj więcej.",
    desc:     "Metoda Pomodoro i inteligentne priorytety — pracuj mądrzej, nie ciężej.",
    features: [
      "Timer Pomodoro z automatycznym resetem",
      "Subzadania z wizualnym paskiem postępu",
      "Powiadomienia o deadline'ach",
    ],
    ctaBg: "linear-gradient(135deg, #34d399, #22d3ee)",
  },
  {
    icon:     "🔥",
    iconText: false,
    bg:       "linear-gradient(145deg, #fbbf24 0%, #f87171 100%)",
    glow:     "rgba(251, 191, 36, 0.35)",
    tag:      "Nawyki",
    title:    "Buduj nawyki.\nKażdego dnia.",
    desc:     "Streak, heatmapa i statystyki — bądź lepszą wersją siebie, dzień po dniu.",
    features: [
      "Streak liczony każdego dnia",
      "Heatmapa i wykresy tygodniowe",
      "Milestone celebrations przy postępach",
    ],
    ctaBg: "linear-gradient(135deg, #fbbf24, #f87171)",
  },
];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "60%" : "-60%",
    opacity: 0,
    scale: 0.94,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? "-60%" : "60%",
    opacity: 0,
    scale: 0.94,
  }),
};

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [current,   setCurrent]   = useState(0);
  const [direction, setDirection] = useState(1);

  const slide  = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const goTo = (i: number) => {
    setDirection(i > current ? 1 : -1);
    setCurrent(i);
  };
  const goNext = () => (isLast ? onComplete() : goTo(current + 1));

  return (
    <motion.div
      className="onboarding"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="onboarding__glow"
        animate={{ background: `radial-gradient(circle at 50% 35%, ${slide.glow}, transparent 60%)` }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      />

      {/* Skip */}
      {!isLast && (
        <motion.button
          className="onboarding__skip"
          onClick={onComplete}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Pomiń
        </motion.button>
      )}

      {/* Slide content */}
      <div className="onboarding__content">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={current}
            className="onboarding__slide"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            {/* Tag pill */}
            <motion.span
              className="onboarding__tag"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.3 }}
            >
              {slide.tag}
            </motion.span>

            {/* Visual — gradient circle */}
            <motion.div
              className={`onboarding__visual ${slide.iconText ? "onboarding__visual--text" : ""}`}
              style={{ background: slide.bg }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 22 }}
            >
              <span
                className="onboarding__visual-icon"
                style={{ filter: `drop-shadow(0 4px 16px rgba(0,0,0,0.25))` }}
              >
                {slide.icon}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="onboarding__title"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.38 }}
            >
              {slide.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              className="onboarding__desc"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.35 }}
            >
              {slide.desc}
            </motion.p>

            {/* Feature list */}
            <motion.ul
              className="onboarding__features"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.35 }}
            >
              {slide.features.map((f, i) => (
                <li key={i} className="onboarding__feature">
                  <span className="onboarding__feature-check">✓</span>
                  {f}
                </li>
              ))}
            </motion.ul>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom — dots + CTA */}
      <div className="onboarding__bottom">
        <div className="onboarding__dots">
          {SLIDES.map((_, i) => (
            <motion.button
              key={i}
              className={`onboarding__dot ${i === current ? "active" : ""}`}
              animate={{
                width:      i === current ? 28 : 7,
                opacity:    i === current ? 1  : 0.3,
                background: i === current ? "#fff" : "rgba(255,255,255,0.5)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={() => goTo(i)}
              aria-label={`Slajd ${i + 1}`}
            />
          ))}
        </div>

        <motion.button
          className="onboarding__cta"
          style={{ background: slide.ctaBg } as React.CSSProperties}
          onClick={goNext}
          whileTap={{ scale: 0.97 }}
          whileHover={{ filter: "brightness(1.08)" }}
          layout
        >
          {isLast ? "Zaczynamy 🚀" : "Dalej →"}
        </motion.button>
      </div>
    </motion.div>
  );
}
