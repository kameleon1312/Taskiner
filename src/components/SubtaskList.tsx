import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "../stores/useTaskStore";
import type { Subtask } from "../types";

interface Props {
  taskId: number;
  subtasks: Subtask[];
}

export default function SubtaskList({ taskId, subtasks }: Props) {
  const { addSubtask, toggleSubtask, deleteSubtask } = useTaskStore();
  const [newText, setNewText] = useState("");

  const handleAdd = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    addSubtask(taskId, trimmed);
    setNewText("");
  };

  const completedCount = subtasks.filter((s) => s.completed).length;

  return (
    <motion.div
      className="subtask-list"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
    >
      {subtasks.length > 0 && (
        <div className="subtask-progress">
          <div className="subtask-progress__bar">
            <motion.div
              className="subtask-progress__fill"
              animate={{
                width: `${(completedCount / subtasks.length) * 100}%`,
              }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="subtask-progress__label">
            {completedCount}/{subtasks.length}
          </span>
        </div>
      )}

      <AnimatePresence>
        {subtasks.map((sub) => (
          <motion.div
            key={sub.id}
            className={`subtask-item ${sub.completed ? "done" : ""}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            <button
              className="subtask-item__check"
              onClick={() => toggleSubtask(taskId, sub.id)}
              aria-pressed={sub.completed}
            >
              {sub.completed ? "✔" : ""}
            </button>
            <span className="subtask-item__text">{sub.text}</span>
            <button
              className="subtask-item__delete"
              onClick={() => deleteSubtask(taskId, sub.id)}
              aria-label="Usuń podzadanie"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="subtask-add">
        <input
          type="text"
          placeholder="Dodaj podzadanie..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="subtask-add__input"
        />
        <button
          className="subtask-add__btn"
          onClick={handleAdd}
          disabled={!newText.trim()}
          aria-label="Dodaj podzadanie"
        >
          +
        </button>
      </div>
    </motion.div>
  );
}
