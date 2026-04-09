import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "../stores/useUIStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import DataControls from "../components/DataControls";
import { useNotificationPermission, sendTestNotification } from "../hooks/useNotifications";

const PRESET_COLORS = [
  "#4d9fff", "#37d67a", "#e15fff", "#ffd166",
  "#ff8a4c", "#2edcff", "#ff4d4d", "#9ba3b0",
];

const PRESET_EMOJIS = [
  "💼", "🏠", "🎯", "📚", "🏋️", "🎮", "🌿", "✈️",
  "💡", "🎵", "🛒", "❤️", "💊", "🔧", "📷", "⭐",
];

const NOTIFY_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 10,   label: "10 min przed" },
  { minutes: 15,   label: "15 min przed" },
  { minutes: 30,   label: "30 min przed" },
  { minutes: 60,   label: "1 godz. przed" },
  { minutes: 120,  label: "2 godz. przed" },
  { minutes: 1440, label: "1 dzień przed" },
];

const IS_ANDROID = /android/i.test(
  typeof navigator !== "undefined" ? navigator.userAgent : ""
);

export default function SettingsPage() {
  const {
    theme, toggleTheme,
    notificationsEnabled, setNotificationsEnabled,
    notifyOffsets, setNotifyOffsets,
  } = useUIStore();

  const { categories, addCategory, deleteCategory } = useCategoryStore();
  const { permission: notifPermission, request: requestNotif } = useNotificationPermission();

  const [testStatus,   setTestStatus]   = useState<"idle" | "sent" | "fail">("idle");
  const [helpOpen,     setHelpOpen]     = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleNotifToggle = async () => {
    if (notifPermission === "denied") return;
    if (notifPermission === "default") {
      await requestNotif();
      // Stan permission zaktualizuje się przez hook
      const current = Notification.permission;
      if (current === "granted") setNotificationsEnabled(true);
      return;
    }
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleToggleOffset = (minutes: number) => {
    if (notifyOffsets.includes(minutes)) {
      setNotifyOffsets(notifyOffsets.filter((m) => m !== minutes));
    } else {
      setNotifyOffsets([...notifyOffsets, minutes].sort((a, b) => a - b));
    }
  };

  const handleTestNotif = async () => {
    const ok = await sendTestNotification();
    setTestStatus(ok ? "sent" : "fail");
    setTimeout(() => setTestStatus("idle"), 3000);
  };

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

  const notifActive = notifPermission === "granted" && notificationsEnabled;

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
        </section>

        {/* Powiadomienia */}
        <section className="settings-section">
          <h3 className="settings-section__title">Powiadomienia</h3>

          {/* Główny przełącznik */}
          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Przypomnienia o terminach</span>
              <span className="settings-row__desc">
                {notifPermission === "denied"
                  ? "Zablokowane w ustawieniach"
                  : notifActive
                  ? "Aktywne – działają w tle"
                  : notifPermission === "granted"
                  ? "Wyłączone"
                  : "Dotknij aby poprosić o zgodę"}
              </span>
            </div>
            {notifPermission === "denied" ? (
              <span className="settings-badge settings-badge--off">OFF</span>
            ) : (
              <button
                className={`settings-switch ${notifActive ? "on" : ""}`}
                onClick={handleNotifToggle}
                aria-label="Przełącz powiadomienia"
                role="switch"
                aria-checked={notifActive}
              >
                <span className="settings-switch__thumb" />
              </button>
            )}
          </div>

          {/* Help card — shown only when browser has blocked notifications */}
          <AnimatePresence>
            {notifPermission === "denied" && (
              <motion.div
                className="notif-denied-card"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
              >
                <div className="notif-denied-card__header" onClick={() => setHelpOpen((o) => !o)}>
                  <span className="notif-denied-card__icon">🔔</span>
                  <div className="notif-denied-card__info">
                    <p className="notif-denied-card__title">Jak odblokować powiadomienia?</p>
                    <p className="notif-denied-card__sub">Krok po kroku</p>
                  </div>
                  <span className="notif-denied-card__chevron">{helpOpen ? "▲" : "▼"}</span>
                </div>

                <AnimatePresence>
                  {helpOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      style={{ overflow: "hidden" }}
                    >
                      <ol className="notif-denied-card__steps">
                        {IS_ANDROID ? (
                          <>
                            <li>Otwórz <strong>Ustawienia</strong> telefonu</li>
                            <li>Przejdź do <strong>Aplikacje → Chrome</strong></li>
                            <li>Wybierz <strong>Uprawnienia → Powiadomienia</strong></li>
                            <li>Znajdź <strong>taskiner.vercel.app</strong> i zmień na <strong>Zezwól</strong></li>
                          </>
                        ) : (
                          <>
                            <li>Kliknij ikonę 🔒 lub ℹ️ obok paska adresu</li>
                            <li>Wybierz <strong>Uprawnienia witryny</strong></li>
                            <li>Zmień <strong>Powiadomienia</strong> na <strong>Zezwól</strong></li>
                            <li>Odśwież stronę</li>
                          </>
                        )}
                      </ol>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  className="notif-denied-card__recheck"
                  onClick={() => {
                    if (typeof Notification !== "undefined") {
                      window.dispatchEvent(new Event("notification-permission-changed"));
                    }
                  }}
                >
                  ↺ Sprawdź ponownie
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Kiedy przypominać — pokazuj tylko gdy aktywne */}
          <AnimatePresence>
            {notifActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
              >
                <p className="settings-section__desc" style={{ marginTop: 14 }}>
                  Kiedy powiadamiać przed terminem:
                </p>
                <div className="notif-timing-row">
                  {NOTIFY_OPTIONS.map(({ minutes, label }) => {
                    const active = notifyOffsets.includes(minutes);
                    return (
                      <button
                        key={minutes}
                        className={`notif-timing-chip${active ? " active" : ""}`}
                        onClick={() => handleToggleOffset(minutes)}
                      >
                        {active ? "✓ " : ""}{label}
                      </button>
                    );
                  })}
                </div>

                {/* Przycisk testowy */}
                <button
                  className="notif-test-btn"
                  onClick={handleTestNotif}
                  disabled={testStatus !== "idle"}
                >
                  {testStatus === "sent"
                    ? "✅ Powiadomienie wysłane!"
                    : testStatus === "fail"
                    ? "❌ Błąd – sprawdź uprawnienia"
                    : "🔔 Wyślij powiadomienie testowe"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
                  onClick={() => deleteCategory(cat.id)}
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
            Eksportuj lub importuj swoje zadania jako plik JSON.
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
                      ].forEach((k) => localStorage.removeItem(k));
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
            <span className="settings-row__value">2.1.0</span>
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
