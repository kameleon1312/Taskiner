import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "../stores/useTaskStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchBar({ isOpen, onClose }: Props) {
  const { searchQuery, setSearchQuery } = useTaskStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
    }
  }, [isOpen, setSearchQuery]);

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  const handleConfirm = () => {
    inputRef.current?.blur(); // dismiss keyboard on mobile
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="search-bar"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <span className="search-bar__icon">🔍</span>
          <input
            ref={inputRef}
            type="search"
            placeholder="Szukaj zadań, notatek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
              if (e.key === "Escape") handleClose();
            }}
            className="search-bar__input"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {searchQuery ? (
            <button
              className="search-bar__clear"
              onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }}
              aria-label="Wyczyść"
            >
              ✕
            </button>
          ) : null}
          <button
            className="search-bar__close"
            onClick={handleClose}
            aria-label="Zamknij wyszukiwanie"
          >
            Anuluj
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
