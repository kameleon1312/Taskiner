import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import SplashScreen  from "./components/SplashScreen";
import Onboarding    from "./components/Onboarding";
import BottomNav     from "./components/layout/BottomNav";
import ErrorBoundary from "./components/ErrorBoundary";

const SPLASH_MS = 3000;

import TasksPage from "./pages/TasksPage";
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const FocusPage    = lazy(() => import("./pages/FocusPage"));
const StatsPage    = lazy(() => import("./pages/StatsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const HabitsPage   = lazy(() => import("./pages/HabitsPage"));
const ProfilePage  = lazy(() => import("./pages/ProfilePage"));
const PrivacyPage  = lazy(() => import("./pages/PrivacyPage"));

import OfflineBanner  from "./components/OfflineBanner";
import ReviewPrompt   from "./components/ReviewPrompt";
import UpdateBanner   from "./components/UpdateBanner";
import { useUIStore } from "./stores/useUIStore";
import { usePWA }     from "./hooks/usePWA";
import { useDeadlineNotifications, useStreakDangerNotification } from "./hooks/useNotifications";


function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-start" }}
        initial={{ opacity: 0, y: 10 }}
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


  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);


  useEffect(() => {
    const t = setTimeout(() => setLoading(false), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  const { canInstall, install } = usePWA();
  useDeadlineNotifications();
  useStreakDangerNotification();

  const handleOnboardingComplete = () => {
    localStorage.setItem("taskiner-onboarded", "true");
    setShowOnboarding(false);
  };

  return (
    <ErrorBoundary>
    <BrowserRouter>
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
