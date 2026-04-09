import { motion, AnimatePresence } from "framer-motion";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export default function OfflineBanner() {
  const online = useOnlineStatus();

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          className="offline-banner"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{    y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
        >
          <span className="offline-banner__icon">📡</span>
          <span className="offline-banner__text">Brak połączenia — tryb offline</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
