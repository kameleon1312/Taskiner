import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore, type SoundId } from "../stores/useUIStore";
import { useNotificationPermission, sendTestNotification } from "../hooks/useNotifications";
import { SOUND_OPTIONS, playTone } from "../notifications/sound";
import { swAvailable, registerBackgroundSync } from "../notifications/bridge";

const NOTIFY_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 5,    label: "5 min" },
  { minutes: 15,   label: "15 min" },
  { minutes: 30,   label: "30 min" },
  { minutes: 60,   label: "1 godz." },
  { minutes: 180,  label: "3 godz." },
  { minutes: 1440, label: "1 dzień" },
  { minutes: 2880, label: "2 dni" },
];

const SNOOZE_OPTIONS = [5, 10, 15, 30, 60];

const IS_ANDROID = /android/i.test(typeof navigator !== "undefined" ? navigator.userAgent : "");
const IS_STANDALONE = typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      className={`settings-switch ${on ? "on" : ""}`}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
    >
      <span className="settings-switch__thumb" />
    </button>
  );
}

function Row({ label, desc, children }: { label: string; desc?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="settings-row">
      <div className="settings-row__info">
        <span className="settings-row__label">{label}</span>
        {desc && <span className="settings-row__desc">{desc}</span>}
      </div>
      {children}
    </div>
  );
}

const Collapse = ({ open, children }: { open: boolean; children: React.ReactNode }) => (
  <AnimatePresence initial={false}>
    {open && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.22 }}
        style={{ overflow: "hidden" }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export default function NotificationSettings() {
  const p = useUIStore();
  const set = p.setPrefs;
  const { permission, request } = useNotificationPermission();
  const [testStatus, setTestStatus] = useState<"idle" | "system" | "in-app">("idle");
  const [helpOpen, setHelpOpen] = useState(false);
  const [bg, setBg] = useState<{ sw: boolean; periodic: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const sw = await swAvailable();
      const periodic = sw && permission === "granted" ? await registerBackgroundSync() : false;
      if (alive) setBg({ sw, periodic });
    })();
    return () => { alive = false; };
  }, [permission]);

  const granted = permission === "granted";
  const active  = p.notificationsEnabled;

  const handleMaster = async (v: boolean) => {
    if (v && permission === "default") await request();
    set({ notificationsEnabled: v });
  };

  const toggleOffset = (m: number) => {
    const next = p.notifyOffsets.includes(m) ? p.notifyOffsets.filter((x) => x !== m) : [...p.notifyOffsets, m];
    p.setNotifyOffsets(next);
  };

  const test = async () => {
    const how = await sendTestNotification();
    setTestStatus(how);
    setTimeout(() => setTestStatus("idle"), 3000);
  };

  const statusText =
    !active ? "Wyłączone"
    : permission === "unsupported" ? "Tylko w aplikacji — przeglądarka nie obsługuje powiadomień"
    : permission === "denied" ? "Tylko w aplikacji — systemowe zablokowane"
    : permission === "default" ? "Tylko w aplikacji — dotknij, by zezwolić na systemowe"
    : "Aktywne — także gdy aplikacja jest w tle";

  return (
    <section className="settings-section">
      <h3 className="settings-section__title">Powiadomienia</h3>

      <Row label="Przypomnienia" desc={statusText}>
        <Switch on={active} onChange={handleMaster} label="Przełącz powiadomienia" />
      </Row>

      {active && permission === "default" && (
        <button className="notif-grant-btn" onClick={request}>🔔 Zezwól na powiadomienia systemowe</button>
      )}

      {/* Background capability card */}
      <Collapse open={active && granted && !!bg}>
        <div className={`bg-status ${bg?.sw ? "bg-status--ok" : "bg-status--warn"}`}>
          <span className="bg-status__dot" />
          <div>
            <p className="bg-status__title">
              {bg?.sw ? "Praca w tle aktywna" : "Praca w tle ograniczona"}
            </p>
            <p className="bg-status__desc">
              {bg?.sw
                ? bg.periodic
                  ? "Service Worker i okresowa synchronizacja w tle są włączone — przypomnienia dotrą nawet przy zamkniętej aplikacji."
                  : IS_STANDALONE
                    ? "Service Worker pilnuje harmonogramu. System może go usypiać — dla pewności nie wyłączaj aplikacji z pamięci."
                    : "Zainstaluj Taskiner na ekranie głównym, aby przypomnienia działały pewniej przy zamkniętej karcie."
                : "Service Worker nie jest aktywny (np. tryb deweloperski). Przypomnienia działają, gdy aplikacja jest otwarta."}
            </p>
          </div>
        </div>
      </Collapse>

      {/* Blocked help */}
      <Collapse open={permission === "denied"}>
        <div className="notif-denied-card">
          <div className="notif-denied-card__header" onClick={() => setHelpOpen((o) => !o)}>
            <span className="notif-denied-card__icon">🔔</span>
            <div className="notif-denied-card__info">
              <p className="notif-denied-card__title">Jak odblokować powiadomienia systemowe?</p>
              <p className="notif-denied-card__sub">Do tego czasu przypomnienia pokażą się w aplikacji</p>
            </div>
            <span className="notif-denied-card__chevron">{helpOpen ? "▲" : "▼"}</span>
          </div>
          <Collapse open={helpOpen}>
            <ol className="notif-denied-card__steps">
              {IS_ANDROID ? (
                <>
                  <li>Otwórz <strong>Ustawienia</strong> telefonu</li>
                  <li>Przejdź do <strong>Aplikacje → Chrome</strong> (lub Taskiner)</li>
                  <li>Wybierz <strong>Powiadomienia</strong> i zezwól dla witryny</li>
                </>
              ) : (
                <>
                  <li>Kliknij ikonę 🔒 obok paska adresu</li>
                  <li>Zmień <strong>Powiadomienia</strong> na <strong>Zezwól</strong></li>
                  <li>Odśwież stronę</li>
                </>
              )}
            </ol>
          </Collapse>
        </div>
      </Collapse>

      <Collapse open={active}>
        {/* When */}
        <p className="settings-section__desc settings-sub">Przed terminem (zawsze także w chwili terminu)</p>
        <div className="notif-timing-row">
          {NOTIFY_OPTIONS.map(({ minutes, label }) => {
            const on = p.notifyOffsets.includes(minutes);
            return (
              <button key={minutes} className={`notif-timing-chip${on ? " active" : ""}`} onClick={() => toggleOffset(minutes)} aria-pressed={on}>
                {label}
              </button>
            );
          })}
        </div>

        <Row label="Zadania całodniowe" desc="Bez godziny — przypomnienie rano w dniu terminu">
          <input type="time" className="settings-time" value={p.allDayTime} onChange={(e) => e.target.value && set({ allDayTime: e.target.value })} />
        </Row>

        {/* Sound */}
        <p className="settings-section__desc settings-sub">Sygnał dźwiękowy</p>
        <Row label="Dźwięk przypomnień" desc={p.soundEnabled ? SOUND_OPTIONS.find((s) => s.id === p.soundId)?.label : "Wyciszone"}>
          <Switch on={p.soundEnabled} onChange={(v) => set({ soundEnabled: v })} label="Dźwięk" />
        </Row>
        <Collapse open={p.soundEnabled}>
          <div className="sound-grid">
            {SOUND_OPTIONS.map((s) => (
              <button
                key={s.id}
                className={`sound-chip${p.soundId === s.id ? " active" : ""}`}
                onClick={() => { set({ soundId: s.id as SoundId }); playTone(s.id, p.soundVolume); }}
                aria-pressed={p.soundId === s.id}
              >
                <span className="sound-chip__emoji">{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
          <div className="volume-row">
            <span aria-hidden>🔈</span>
            <input
              type="range"
              min={0.05} max={1} step={0.05}
              value={p.soundVolume}
              onChange={(e) => set({ soundVolume: Number(e.target.value) })}
              onPointerUp={() => playTone(p.soundId, p.soundVolume)}
              onKeyUp={() => playTone(p.soundId, p.soundVolume)}
              aria-label="Głośność"
              style={{ "--val": `${p.soundVolume * 100}%` } as React.CSSProperties}
            />
            <span aria-hidden>🔊</span>
          </div>
        </Collapse>
        <Row label="Wibracje">
          <Switch on={p.vibrate} onChange={(v) => set({ vibrate: v })} label="Wibracje" />
        </Row>

        {/* Quiet hours */}
        <Row label="Cisza nocna" desc={p.quietHours.enabled ? `${p.quietHours.start}–${p.quietHours.end} · bez dźwięku i wibracji` : "Wyłączona"}>
          <Switch on={p.quietHours.enabled} onChange={(v) => set({ quietHours: { ...p.quietHours, enabled: v } })} label="Cisza nocna" />
        </Row>
        <Collapse open={p.quietHours.enabled}>
          <div className="settings-time-pair">
            <label>od <input type="time" className="settings-time" value={p.quietHours.start} onChange={(e) => e.target.value && set({ quietHours: { ...p.quietHours, start: e.target.value } })} /></label>
            <label>do <input type="time" className="settings-time" value={p.quietHours.end} onChange={(e) => e.target.value && set({ quietHours: { ...p.quietHours, end: e.target.value } })} /></label>
          </div>
        </Collapse>

        <Row label="Odkładanie" desc="Przycisk „Za X min” w powiadomieniu">
          <select className="settings-select" value={p.snoozeMinutes} onChange={(e) => set({ snoozeMinutes: Number(e.target.value) })}>
            {SNOOZE_OPTIONS.map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </Row>

        {/* Smart reminders */}
        <p className="settings-section__desc settings-sub">Inteligentne przypomnienia</p>
        <Row label="Plan dnia" desc="Poranne podsumowanie zadań na dziś">
          <div className="settings-inline">
            {p.dailyBrief && <input type="time" className="settings-time" value={p.dailyBriefTime} onChange={(e) => e.target.value && set({ dailyBriefTime: e.target.value })} />}
            <Switch on={p.dailyBrief} onChange={(v) => set({ dailyBrief: v })} label="Plan dnia" />
          </div>
        </Row>
        <Row label="Nawyki" desc="Gdy dzienne nawyki nie są odhaczone">
          <div className="settings-inline">
            {p.habitReminder && <input type="time" className="settings-time" value={p.habitReminderTime} onChange={(e) => e.target.value && set({ habitReminderTime: e.target.value })} />}
            <Switch on={p.habitReminder} onChange={(v) => set({ habitReminder: v })} label="Nawyki" />
          </div>
        </Row>
        <Row label="Ochrona serii" desc="O 20:00, jeśli dziś nic nie ukończono">
          <Switch on={p.streakReminder} onChange={(v) => set({ streakReminder: v })} label="Ochrona serii" />
        </Row>
        <Row label="Koniec sesji Focus" desc="Sygnał po zakończeniu skupienia lub przerwy">
          <Switch on={p.focusAlerts} onChange={(v) => set({ focusAlerts: v })} label="Focus" />
        </Row>
        <Row label="Licznik na ikonie" desc="Zadania na dziś i zaległe">
          <Switch on={p.appBadge} onChange={(v) => set({ appBadge: v })} label="Licznik na ikonie" />
        </Row>
        <Row label="Baner w aplikacji" desc="Gdy aplikacja jest otwarta, zamiast systemowego">
          <Switch on={p.inAppWhenFocused} onChange={(v) => set({ inAppWhenFocused: v })} label="Baner w aplikacji" />
        </Row>

        <button className="notif-test-btn" onClick={test} disabled={testStatus !== "idle"}>
          {testStatus === "system" ? "✅ Wysłano powiadomienie systemowe"
            : testStatus === "in-app" ? "✅ Pokazano w aplikacji"
            : "🔔 Wyślij powiadomienie testowe"}
        </button>
      </Collapse>
    </section>
  );
}
