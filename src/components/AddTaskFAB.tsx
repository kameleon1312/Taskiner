import { motion } from "framer-motion";

interface Props {
  isOpen: boolean;
  onClick: () => void;
}

export default function AddTaskFAB({ isOpen, onClick }: Props) {
  return (
    <motion.button
      className="fab"
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
      aria-label={isOpen ? "Zamknij" : "Dodaj nowe zadanie"}
      title={isOpen ? "Zamknij" : "Nowe zadanie"}
    >
      <motion.span
        className="fab__icon"
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        +
      </motion.span>
    </motion.button>
  );
}
