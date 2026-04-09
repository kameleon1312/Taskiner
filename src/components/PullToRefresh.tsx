import { motion, AnimatePresence } from "framer-motion";
import type { PTRPhase } from "../hooks/usePullToRefresh";

const THRESHOLD = 68;

interface Props {
  distance: number;
  phase:    PTRPhase;
}

export default function PullToRefresh({ distance, phase }: Props) {
  const visible   = phase !== "idle";
  const progress  = Math.min(distance / THRESHOLD, 1);
  const isReady   = phase === "ready";
  const isSpin    = phase === "refreshing";
  const isDone    = phase === "done";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="ptr"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ height: isDone ? 56 : Math.max(distance, 0) }}
        >
          <motion.div
            className={[
              "ptr__bubble",
              isReady || isSpin ? "ptr__bubble--ready" : "",
              isDone            ? "ptr__bubble--done"  : "",
            ].join(" ").trim()}
            animate={{
              scale:  isDone ? 1.15 : 0.52 + progress * 0.48,
              rotate: isSpin ? 360  : progress * 200,
              opacity: progress > 0.15 ? 1 : 0,
            }}
            transition={
              isSpin
                ? { rotate: { repeat: Infinity, duration: 0.72, ease: "linear" }, scale: { duration: 0.18 } }
                : { type: "spring", stiffness: 280, damping: 26 }
            }
          >
            <span className="ptr__icon-char">
              {isDone ? "✓" : isSpin ? "↻" : "↓"}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
