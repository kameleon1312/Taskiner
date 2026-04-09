import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

interface Props {
  onClose: () => void;
}

export default function CelebrationScreen({ onClose }: Props) {
  useEffect(() => {
    confetti({
      particleCount: 160,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#818cf8", "#34d399", "#fbbf24", "#ffffff", "#a78bfa"],
    });
    navigator.vibrate?.([50, 30, 80]);
    const t = setTimeout(onClose, 3800);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      className="celebration"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onClose}
    >
      <motion.div
        className="celebration__card"
        initial={{ scale: 0.78, opacity: 0, y: 32 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="celebration__emoji"
          animate={{ rotate: [0, -14, 14, -8, 8, 0], scale: [1, 1.22, 1] }}
          transition={{ duration: 0.85, delay: 0.2 }}
        >
          🎉
        </motion.div>

        <h2 className="celebration__title">Wszystko gotowe!</h2>
        <p className="celebration__sub">Ukończyłeś wszystkie zadania na dziś. Niesamowita robota!</p>

        <motion.button
          className="celebration__btn"
          onClick={onClose}
          whileTap={{ scale: 0.94 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          Świetnie! 🚀
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
