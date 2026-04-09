import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "../stores/useTaskStore";

const STORAGE_KEY   = "taskiner-review-asked";
const FIRST_RUN_KEY = "taskiner-first-run";
const MIN_DAYS      = 5;
const MIN_COMPLETED = 10;
// Google Play URL – update when published
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.taskiner.app";

function hasPassedDays(since: string, days: number): boolean {
  return (Date.now() - new Date(since).getTime()) / 86400000 >= days;
}

export default function ReviewPrompt() {
  const [visible, setVisible] = useState(false);
  const completionLog = useTaskStore((s) => s.completionLog);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Record first run date
    if (!localStorage.getItem(FIRST_RUN_KEY)) {
      localStorage.setItem(FIRST_RUN_KEY, new Date().toISOString());
      return;
    }

    const firstRun = localStorage.getItem(FIRST_RUN_KEY)!;
    if (!hasPassedDays(firstRun, MIN_DAYS)) return;
    if (completionLog.length < MIN_COMPLETED) return;

    // Show after a brief delay so it doesn't appear instantly
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [completionLog.length]);

  const handleRate = () => {
    localStorage.setItem(STORAGE_KEY, "rated");
    setVisible(false);
    window.open(PLAY_URL, "_blank", "noopener");
  };

  const handleLater = () => {
    localStorage.setItem(STORAGE_KEY, "later");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            className="review-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleLater}
          />
          <motion.div
            className="review-card"
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            exit={{    scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          >
            <div className="review-card__stars">⭐⭐⭐⭐⭐</div>
            <h3 className="review-card__title">Podoba Ci się Taskiner?</h3>
            <p className="review-card__desc">
              Twoja ocena pomaga nam dotrzeć do kolejnych użytkowników i rozwijać aplikację!
            </p>
            <button className="review-card__rate-btn" onClick={handleRate} aria-label="Oceń aplikację w sklepie Google Play">
              Oceń nas w sklepie 🌟
            </button>
            <button className="review-card__later-btn" onClick={handleLater}>
              Może później
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
