import { motion, AnimatePresence } from "framer-motion";

const MILESTONE_MESSAGES: Record<number, { emoji: string; text: string }> = {
  1:  { emoji: "⚡", text: "Pierwszy krok! Tak trzymaj!" },
  3:  { emoji: "🔥", text: "3 zadania dzisiaj! Jesteś w ogniu!" },
  5:  { emoji: "🚀", text: "5 zadań! Jesteś nie do zatrzymania!" },
  10: { emoji: "🏆", text: "10 zadań! Legendarny dzień!" },
  15: { emoji: "💎", text: "15 zadań! Absolutny mistrz!" },
  20: { emoji: "👑", text: "20 zadań! Nie ma Ci równych!" },
};

interface Props {
  count: number | null;
}

export default function MilestoneBanner({ count }: Props) {
  const msg = count ? MILESTONE_MESSAGES[count] : null;

  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          className="milestone-banner"
          initial={{ opacity: 0, y: -20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0,   scale: 1 }}
          exit={{    opacity: 0, y: -16, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <motion.span
            className="milestone-banner__emoji"
            animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {msg.emoji}
          </motion.span>
          <span className="milestone-banner__text">{msg.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
