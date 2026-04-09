import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import FilterBar           from "../components/FilterBar";
import DailyWidget         from "../components/DailyWidget";
import TaskList            from "../components/TaskList";
import SearchBar           from "../components/SearchBar";
import AddTaskFAB          from "../components/AddTaskFAB";
import TaskInput           from "../components/TaskInput";
import MilestoneBanner     from "../components/MilestoneBanner";
import PullToRefresh       from "../components/PullToRefresh";
import CelebrationScreen   from "../components/CelebrationScreen";
import MorningRitual       from "../components/MorningRitual";
import TaskDetailSheet     from "../components/TaskDetailSheet";
import EisenhowerMatrix    from "../components/EisenhowerMatrix";
import WeeklyReview        from "../components/WeeklyReview";
import { useStats }        from "../hooks/useStats";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { useAndroidBack }  from "../hooks/useAndroidBack";
import { useTaskStore }    from "../stores/useTaskStore";
import { useUIStore }      from "../stores/useUIStore";

const MILESTONES = [1, 3, 5, 10, 15, 20];

const headerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const headerItemVariant = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "Dzień dobry";
  if (h >= 12 && h < 18) return "Cześć";
  if (h >= 18 && h < 22) return "Dobry wieczór";
  return "Dobranoc";
}

export default function TasksPage() {
  const [searchOpen,      setSearchOpen]      = useState(false);
  const [addOpen,         setAddOpen]         = useState(false);
  const [milestone,       setMilestone]       = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [matrixView,      setMatrixView]      = useState(false);

  const [showMorning, setShowMorning] = useState(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return localStorage.getItem("taskiner-morning-shown") !== todayKey;
  });

  const [showWeekly, setShowWeekly] = useState(() => {
    const now  = new Date();
    const week = `${now.getFullYear()}-W${String(Math.ceil((now.getDate() - now.getDay() + 7) / 7)).padStart(2, "0")}`;
    const day  = now.getDay();
    const hour = now.getHours();
    const inWindow = (day === 0 && hour >= 10) || (day === 1 && hour < 12);
    return inWindow && localStorage.getItem("taskiner-weekly-review") !== week;
  });
  const handleWeeklyClose = () => {
    const now  = new Date();
    const week = `${now.getFullYear()}-W${String(Math.ceil((now.getDate() - now.getDay() + 7) / 7)).padStart(2, "0")}`;
    localStorage.setItem("taskiner-weekly-review", week);
    setShowWeekly(false);
  };
  const handleMorningClose = () => {
    localStorage.setItem("taskiner-morning-shown", new Date().toISOString().slice(0, 10));
    setShowMorning(false);
  };

  const { distance, phase, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh();
  const selectedTaskId    = useUIStore((s) => s.selectedTaskId);
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId);

  useAndroidBack(() => setSelectedTaskId(null), selectedTaskId !== null);
  useAndroidBack(() => setAddOpen(false),        addOpen);
  useAndroidBack(() => setSearchOpen(false),     searchOpen);
  const userName          = useUIStore((s) => s.userName);
  const userAvatar        = useUIStore((s) => s.userAvatar);

  const { streak, completedToday } = useStats();

  const tasks          = useTaskStore((s) => s.tasks);
  const clearCompleted = useTaskStore((s) => s.clearCompleted);
  const allDone        = tasks.length > 0 && tasks.every((t) => t.completed);
  const prevAllDone = useRef(false);
  useEffect(() => {
    if (allDone && !prevAllDone.current) setShowCelebration(true);
    prevAllDone.current = allDone;
  }, [allDone]);

  const prevCountRef = useRef(completedToday);
  useEffect(() => {
    const prev = prevCountRef.current;
    if (completedToday > prev && MILESTONES.includes(completedToday)) {
      setMilestone(completedToday);
      const t = setTimeout(() => setMilestone(null), 4000);
      prevCountRef.current = completedToday;
      return () => clearTimeout(t);
    }
    prevCountRef.current = completedToday;
  }, [completedToday]);

  const greeting = getGreeting();
  const greetingText = userName ? `${greeting}, ${userName}!` : `${greeting}`;
  const dateStr  = new Date().toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <>
      <AnimatePresence>
        {showCelebration && (
          <CelebrationScreen
            key="celebration"
            onClose={() => { setShowCelebration(false); clearCompleted(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMorning && <MorningRitual key="morning" onClose={handleMorningClose} />}
      </AnimatePresence>

      <AnimatePresence>
        {showWeekly && <WeeklyReview key="weekly" onClose={handleWeeklyClose} />}
      </AnimatePresence>

      <PullToRefresh distance={distance} phase={phase} />

      <div
        className="app"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait" initial={false}>

          {!addOpen && (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.22 }}
            >
              <motion.header
                className="app-header"
                variants={headerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="app-header__left" variants={headerItemVariant}>
                  <Link to="/profile" className="app-header__avatar-link">
                    <div className="app-header__avatar">
                      {userAvatar?.startsWith("data:") ? (
                        <img src={userAvatar} alt="Avatar" className="app-header__avatar-photo" />
                      ) : (
                        userAvatar || "🙂"
                      )}
                    </div>
                  </Link>
                  <div className="app-header__info">
                    <p className="app-header__greeting">{greetingText} 👋</p>
                    <p className="app-header__date">{dateStr}</p>
                  </div>
                </motion.div>

                <motion.div className="app-header__actions" variants={headerItemVariant}>
                  {streak > 0 && (
                    <motion.div
                      className="streak-pill"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      title={`${streak} ${streak === 1 ? "dzień" : "dni"} z rzędu`}
                    >
                      🔥 {streak}
                    </motion.div>
                  )}
                  <motion.button
                    className={`view-toggle-btn${matrixView ? " active" : ""}`}
                    onClick={() => setMatrixView((v) => !v)}
                    whileTap={{ scale: 0.88 }}
                    aria-label={matrixView ? "Widok listy" : "Matryca Eisenhowera"}
                    title={matrixView ? "Widok listy" : "Matryca Eisenhowera"}
                  >
                    {matrixView ? "☰" : "⊞"}
                  </motion.button>
                  <motion.button
                    className="header-icon-btn"
                    onClick={() => setSearchOpen((v) => !v)}
                    whileTap={{ scale: 0.88 }}
                    aria-label="Szukaj"
                  >
                    🔍
                  </motion.button>
                  <Link to="/settings" tabIndex={-1}>
                    <motion.button
                      className="header-icon-btn"
                      whileTap={{ scale: 0.88 }}
                      aria-label="Ustawienia"
                    >
                      ⚙️
                    </motion.button>
                  </Link>
                </motion.div>
              </motion.header>

              <MilestoneBanner count={milestone} />

              <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
              {matrixView ? (
                <EisenhowerMatrix />
              ) : (
                <>
                  <FilterBar />
                  <DailyWidget />
                  <TaskList />
                </>
              )}
            </motion.div>
          )}

          {addOpen && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
            >
              <div className="add-panel__header">
                <h2 className="add-panel__title">Nowe zadanie</h2>
                <motion.button
                  className="add-panel__close"
                  onClick={() => setAddOpen(false)}
                  whileTap={{ scale: 0.88 }}
                  aria-label="Zamknij"
                >
                  ✕
                </motion.button>
              </div>

              <TaskInput onSave={() => setAddOpen(false)} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {!addOpen && (
        <AddTaskFAB isOpen={false} onClick={() => setAddOpen(true)} />
      )}

      <AnimatePresence>
        {selectedTaskId !== null && (
          <TaskDetailSheet
            key={selectedTaskId}
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
