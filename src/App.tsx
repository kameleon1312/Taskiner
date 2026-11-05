import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import SplashScreen  from "./components/SplashScreen";
import Onboarding    from "./components/Onboarding";
import BottomNav     from "./components/layout/BottomNav";
import ErrorBoundary from "./components/ErrorBoundary";
import TaskDetailSheet from "./components/TaskDetailSheet";
import { useAndroidBack } from "./hooks/useAndroidBack";
import { backfillActivity } from "./stores/backfillActivity";

// Full splash only on a cold start; returning within the session (or opening
// from a notification) goes straight to the content.
const SPLASH_MS = (() => {
  try {
    if (sessionStorage.getItem("taskiner-splash-seen") || /[?&](task|date)=/.test(location.search)) return 0;
    sessionStorage.setItem("taskiner-splash-seen", "1");
  } catch { /* ignore */ }
  return 1800;
})();

import TasksPage from "./pages/TasksPage";
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const FocusPage    = lazy(() => import("./pages/FocusPage"));
const StatsPage    = lazy(() => import("./pages/StatsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const HabitsPage   = lazy(() => import("./pages/HabitsPage"));
const ProfilePage  = lazy(() => import("./pages/ProfilePage"));
const PrivacyPage  = lazy(() => import("./pages/PrivacyPage"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));

import OfflineBanner  from "./components/OfflineBanner";
import ReviewPrompt   from "./components/ReviewPrompt";
import UpdateBanner   from "./components/UpdateBanner";
import { useUIStore } from "./stores/useUIStore";
import { usePWA }     from "./hooks/usePWA";
import { useNotificationEngine } from "./notifications/useNotificationEngine";
import NotificationToaster from "./components/NotificationToaster";


/** Background services: reminders, sounds, focus timer, app badge. */
function AppRuntime() {
  useNotificationEngine();
  return <NotificationToaster />;
}

/** Task details are available from every screen (list, calendar, journal, notifications). */
function GlobalTaskSheet() {
  const selectedTaskId    = useUIStore((s) => s.selectedTaskId);
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId);
  const [params, setParams] = useSearchParams();

  // Deep link from a notification: /tasks?task=123
  useEffect(() => {
    const id = Number(params.get("task"));
    if (id) {
      setSelectedTaskId(id);
      const next = new URLSearchParams(params);
      next.delete("task");
      setParams(next, { replace: true });
    }
  }, [params, setParams, setSelectedTaskId]);

  useAndroidBack(() => setSelectedTaskId(null), selectedTaskId !== null);

  return (
    <AnimatePresence>
      {selectedTaskId !== null && (
        <TaskDetailSheet key={selectedTaskId} taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}
    </AnimatePresence>
  );
}

function AppRoutes() {
  const location = useLocation();
  const reduceMotion = useUIStore((s) => s.reduceMotion);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-start" }}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Suspense fallback={<div className="page-skeleton" />}>
          <Routes location={location}>
            <Route path="/"          element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks"     element={<TasksPage />} />
            <Route path="/calendar"  element={<CalendarPage />} />
            <Route path="/focus"     element={<FocusPage />} />
            <Route path="/stats"     element={<StatsPage />} />
            <Route path="/habits"    element={<HabitsPage />} />
            <Route path="/profile"   element={<ProfilePage />} />
            <Route path="/settings"  element={<SettingsPage />} />
            <Route path="/privacy"   element={<PrivacyPage />} />
            <Route path="/activity"  element={<ActivityPage />} />
            <Route path="*"          element={<Navigate to="/tasks" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const { loading, setLoading, theme } = useUIStore();

  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("taskiner-onboarded")
  );


  const reduceMotion = useUIStore((s) => s.reduceMotion);

  useEffect(() => { backfillActivity(); }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#07090f" : "#f3f4fa");
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle("reduce-motion", reduceMotion);
  }, [reduceMotion]);

  // Time-of-day ambience: subtle hue shift of the background aura
  useEffect(() => {
    const apply = () => {
      const h = new Date().getHours();
      const phase = h >= 5 && h < 11 ? "dawn" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "dusk" : "night";
      document.body.setAttribute("data-daypart", phase);
    };
    apply();
    const t = setInterval(apply, 10 * 60_000);
    return () => clearInterval(t);
  }, []);


  useEffect(() => {
    const t = setTimeout(() => setLoading(false), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  const { canInstall, install } = usePWA();

  const handleOnboardingComplete = () => {
    localStorage.setItem("taskiner-onboarded", "true");
    setShowOnboarding(false);
  };

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AppRuntime />
      <AnimatePresence mode="wait">
        {loading && <SplashScreen key="splash" />}
      </AnimatePresence>


      <AnimatePresence>
        {!loading && showOnboarding && (
          <Onboarding key="onboarding" onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>


      {!loading && !showOnboarding && (
        <>
          <OfflineBanner />
          <div className="app-shell">
            <main className="app-content">
              <AppRoutes />
            </main>
            <BottomNav />
          </div>
          <GlobalTaskSheet />
          <ReviewPrompt />
          <UpdateBanner />
          {canInstall && (
            <button className="install-btn" onClick={install}>
              📲 Zainstaluj Taskiner
            </button>
          )}
        </>
      )}
    </BrowserRouter>
    </ErrorBoundary>
  );
}
