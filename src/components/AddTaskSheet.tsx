import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TaskInput from "./TaskInput";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTaskSheet({ isOpen, onClose }: Props) {
  // Blokuj scroll tła gdy sheet jest otwarty
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          >
            {/* Handle */}
            <div className="sheet__handle" />

            {/* Header */}
            <div className="sheet__header">
              <h3 className="sheet__title">Nowe zadanie</h3>
              <button
                className="sheet__close"
                onClick={onClose}
                aria-label="Zamknij"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <TaskInput onSave={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
