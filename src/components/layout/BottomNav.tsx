import React from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "../../stores/useTaskStore";

const navItems = [
  { to: "/tasks",    icon: "📋", label: "Zadania",    showBadge: true },
  { to: "/calendar", icon: "📅", label: "Kalendarz",  showBadge: false },
  { to: "/focus",    icon: "⏱",  label: "Focus",      showBadge: false },
  { to: "/habits",   icon: "🌱", label: "Nawyki",     showBadge: false },
  { to: "/stats",    icon: "📊", label: "Statystyki", showBadge: false },
  { to: "/settings", icon: "⚙️", label: "Ustawienia", showBadge: false },
];

export default function BottomNav() {
  const tasks = useTaskStore((s) => s.tasks);
  const activeTasks = tasks.filter((t) => !t.completed).length;

  return (
    <nav className="bottom-nav">
      {navItems.map(({ to, icon, label, showBadge }) => {
        const badgeCount = showBadge && activeTasks > 0 ? activeTasks : 0;

        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item${isActive ? " nav-item--active" : ""}`
            }
          >
            {({ isActive }) => (
              <motion.div
                className="nav-item__inner"
                whileTap={{ scale: 0.84 }}
                transition={{ duration: 0.12 }}
              >
                {isActive && (
                  <motion.div
                    className="nav-item__indicator"
                    layoutId="nav-indicator"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}

                {/* Icon with optional badge */}
                <div className="nav-item__icon-wrap">
                  <span className="nav-item__icon">{icon}</span>
                  <AnimatePresence>
                    {badgeCount > 0 && (
                      <motion.span
                        className="nav-item__badge"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <span className="nav-item__label">{label}</span>
              </motion.div>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
