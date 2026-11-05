import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "../stores/useUIStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import { useTaskStore } from "../stores/useTaskStore";
import DataControls from "../components/DataControls";
import NotificationSettings from "../components/NotificationSettings";
import CalendarSync from "../components/CalendarSync";

const PRESET_COLORS = [
  "#4d9fff", "#37d67a", "#e15fff", "#ffd166",
  "#ff8a4c", "#2edcff", "#ff4d4d", "#9ba3b0",
];

const PRESET_EMOJIS = [
  "💼", "🏠", "🎯", "📚", "🏋️", "🎮", "🌿", "✈️",
  "💡", "🎵", "🛒", "❤️", "💊", "🔧", "📷", "⭐",
];

export default function SettingsPage() {
  const theme        = useUIStore((s) => s.theme);
  const toggleTheme  = useUIStore((s) => s.toggleTheme);
  const reduceMotion = useUIStore((s) => s.reduceMotion);
  const setPrefs     = useUIStore((s) => s.setPrefs);

  const { categories, addCategory, deleteCategory } = useCategoryStore();
  const [resetConfirm, setResetConfirm] = useState(false);

  const [newName, setNewName]   = useState("");
  const [newEmoji, setNewEmoji] = useState("⭐");
  const [newColor, setNewColor] = useState("#4d9fff");
  const [showForm, setShowForm] = useState(false);

  const handleAddCategory = () => {
    if (!newName.trim()) return;
    addCategory(newName.trim(), newEmoji, newColor);
    setNewName("");
    setNewEmoji("⭐");
    setNewColor("#4d9fff");
    setShowForm(false);
  };

  return (
    <div className="app">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="page-title">Ustawienia</h1>

        {/* Wygląd */}
        <section className="settings-section">
          <h3 className="settings-section__title">Wygląd</h3>
          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Motyw</span>
              <span className="settings-row__desc">
                {theme === "dark" ? "Ciemny" : "Jasny"}
              </span>
            </div>
            <button
              className="settings-toggle-btn"
              onClick={toggleTheme}
              aria-label="Zmień motyw"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
          </div>
          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Ogranicz animacje</span>
              <span className="settings-row__desc">Spokojniejszy interfejs, mniej ruchu</span>
            </div>
            <button
              className={`settings-switch ${reduceMotion ? "on" : ""}`}
              onClick={() => setPrefs({ reduceMotion: !reduceMotion })}
              role="switch"
              aria-checked={reduceMotion}
              aria-label="Ogranicz animacje"
            >
              <span className="settings-switch__thumb" />
            </button>
          </div>
        </section>

        <NotificationSettings />

        {/* Kalendarz */}
        <section className="settings-section">
          <h3 className="settings-section__title">Kalendarz</h3>
          <CalendarSync compact />
          <div className="settings-row">
            <span className="settings-row__label">Dziennik aktywności</span>
            <Link to="/activity" className="settings-row__link">Otwórz →</Link>
          </div>
        </section>

        {/* Kategorie */}
        <section className="settings-section">
          <h3 className="settings-section__title">Kategorie</h3>

          <div className="category-list">
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                className="category-list__item"
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
              >
                <span
                  className="category-list__chip"
                  style={{
                    background: `${cat.color}22`,
                    color: cat.color,
                    border: `1px solid ${cat.color}55`,
                  }}
                >
                  {cat.emoji} {cat.name}
                </span>
                <button
                  className="category-list__delete"
                  onClick={() => {
                    deleteCategory(cat.id);
                    const ts = useTaskStore.getState();
                    if (ts.activeCategoryId === cat.id) ts.setActiveCategoryId(null);
                    useTaskStore.setState({
                      tasks: ts.tasks.map((t) => (t.categoryId === cat.id ? { ...t, categoryId: null } : t)),
                    });
                  }}
                  title="Usuń kategorię"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div
                className="category-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <input
                  type="text"
                  placeholder="Nazwa kategorii..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  className="category-form__input"
                  autoFocus
                />

                <div className="category-form__emojis">
                  {PRESET_EMOJIS.map((e) => (
                    <button
                      key={e}
                      className={`emoji-btn ${newEmoji === e ? "active" : ""}`}
                      onClick={() => setNewEmoji(e)}
                      type="button"
                    >
                      {e}
                    </button>
                  ))}
                </div>

                <div className="category-form__colors">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      className={`color-btn ${newColor === c ? "active" : ""}`}
                      style={{ background: c }}
                      onClick={() => setNewColor(c)}
                      type="button"
                      aria-label={`Kolor: ${c}`}
                      aria-pressed={newColor === c}
                    />
                  ))}
                </div>

                <div className="category-form__actions">
                  <button className="btn-secondary" onClick={() => setShowForm(false)}>
                    Anuluj
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleAddCategory}
                    disabled={!newName.trim()}
                  >
                    Dodaj
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showForm && (
            <button className="add-category-btn" onClick={() => setShowForm(true)}>
              + Dodaj kategorię
            </button>
          )}
        </section>

        {/* Dane */}
        <section className="settings-section">
          <h3 className="settings-section__title">Dane</h3>
          <p className="settings-section__desc">
            Pełna kopia zapasowa: zadania, nawyki, kategorie, sesje i dziennik (JSON).
          </p>
          <DataControls />

          <div className="settings-reset-wrap">
            {!resetConfirm ? (
              <button
                className="settings-reset-btn"
                onClick={() => setResetConfirm(true)}
              >
                🗑️ Usuń wszystkie dane
              </button>
            ) : (
              <motion.div
                className="settings-reset-confirm"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
              >
                <p className="settings-reset-confirm__text">
                  To trwale usunie wszystkie zadania, nawyki, sesje i ustawienia. Czy na pewno?
                </p>
                <div className="settings-reset-confirm__actions">
                  <button
                    className="settings-reset-confirm__cancel"
                    onClick={() => setResetConfirm(false)}
                  >
                    Anuluj
                  </button>
                  <button
                    className="settings-reset-confirm__go"
                    onClick={() => {
                      [
                        "taskiner-tasks",
                        "taskiner-ui",
                        "taskiner-categories",
                        "taskiner-focus-sessions",
                        "taskiner-habits",
                        "taskiner-activity",
                        "taskiner-focus-timer",
                        "taskiner-delivered",
                        "taskiner-activity-backfilled",
                      ].forEach((k) => localStorage.removeItem(k));
                      try { indexedDB.deleteDatabase("taskiner-sw"); } catch { /* */ }
                      window.location.reload();
                    }}
                  >
                    Usuń i zresetuj
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* O aplikacji */}
        <section className="settings-section">
          <h3 className="settings-section__title">O aplikacji</h3>
          <div className="settings-row">
            <span className="settings-row__label">Wersja</span>
            <span className="settings-row__value">3.0.0</span>
          </div>
          <div className="settings-row">
            <span className="settings-row__label">Autor</span>
            <span className="settings-row__value">Szymon Pochopień</span>
          </div>
          <div className="settings-row">
            <span className="settings-row__label">Prywatność</span>
            <Link to="/privacy" className="settings-row__link">
              Polityka prywatności →
            </Link>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
