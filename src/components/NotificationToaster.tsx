import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore, type Toast } from "../notifications/toastStore";
import { useTaskStore } from "../stores/useTaskStore";
import { useUIStore } from "../stores/useUIStore";
import { postToSW } from "../notifications/bridge";

const ACCENT: Record<string, string> = {
  deadline: "var(--error)",
  allday:   "var(--accent)",
  snooze:   "var(--warning)",
  streak:   "var(--warning)",
  habit:    "var(--success)",
  brief:    "var(--accent)",
  focus:    "var(--accent)",
  success:  "var(--success)",
  test:     "var(--accent)",
  info:     "var(--muted)",
};

function ToastCard({ t }: { t: Toast }) {
  const dismiss      = useToastStore((s) => s.dismiss);
  const completeTask = useTaskStore((s) => s.completeTask);
  const task         = useTaskStore((s) => (t.taskId ? s.tasks.find((x) => x.id === t.taskId) : undefined));
  const snoozeMin    = useUIStore((s) => s.snoozeMinutes);
  const navigate     = useNavigate();

  useEffect(() => {
    const ms = t.ttl ?? (t.taskId ? 12_000 : 6_000);
    const timer = setTimeout(() => dismiss(t.id), ms);
    return () => clearTimeout(timer);
  }, [t, dismiss]);

  const open = () => {
    if (t.url) navigate(t.url);
    dismiss(t.id);
  };

  return (
    <motion.div
      layout
      className="toast"
      style={{ "--toast-accent": ACCENT[t.kind] ?? "var(--accent)" } as React.CSSProperties}
      initial={{ opacity: 0, y: -24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 90) dismiss(t.id); }}
      role="status"
      aria-live="polite"
    >
      <span className="toast__glow" aria-hidden />
      <button className="toast__main" onClick={open} type="button">
        <span className="toast__title">{t.title}</span>
        {t.body && <span className="toast__body">{t.body}</span>}
      </button>

      {(task && !task.completed) || t.undo ? (
        <div className="toast__actions">
          {t.undo && (
            <button className="toast__btn" onClick={() => { t.undo!(); dismiss(t.id); }}>Cofnij</button>
          )}
          {task && !task.completed && (
            <>
              <button
                className="toast__btn"
                onClick={() => {
                  postToSW({ type: "SNOOZE", taskId: task.id, key: t.id, url: t.url, minutes: snoozeMin });
                  dismiss(t.id);
                }}
              >
                Za {snoozeMin} min
              </button>
              <button
                className="toast__btn toast__btn--primary"
                onClick={() => { completeTask(task.id); dismiss(t.id); }}
              >
                ✔ Ukończ
              </button>
            </>
          )}
        </div>
      ) : null}

      <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Zamknij">✕</button>
    </motion.div>
  );
}

export default function NotificationToaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="toast-stack" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => <ToastCard key={t.id} t={t} />)}
      </AnimatePresence>
    </div>
  );
}
