import React from "react";
import { motion } from "framer-motion";
import { useTaskStore } from "../stores/useTaskStore";
import type { Task } from "../types";

const VALID_PRIORITIES = new Set(["urgent", "high", "normal", "low"]);
const VALID_RECURRING  = new Set(["daily", "weekly", "monthly"]);

function sanitizeTask(raw: unknown): Task | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  if (typeof r.id !== "number")        return null;
  if (typeof r.text !== "string" || !r.text.trim()) return null;
  if (typeof r.completed !== "boolean") return null;

  return {
    id:        r.id,
    text:      String(r.text).slice(0, 500),
    completed: Boolean(r.completed),
    deadline:  typeof r.deadline === "string" && !isNaN(new Date(r.deadline).getTime()) ? r.deadline : null,
    priority:  VALID_PRIORITIES.has(String(r.priority)) ? r.priority as Task["priority"] : "normal",
    categoryId: typeof r.categoryId === "number" ? r.categoryId : null,
    subtasks:  Array.isArray(r.subtasks)
      ? (r.subtasks as unknown[]).filter(
          (s): s is { id: number; text: string; completed: boolean } =>
            typeof s === "object" && s !== null &&
            typeof (s as Record<string, unknown>).id === "number" &&
            typeof (s as Record<string, unknown>).text === "string" &&
            typeof (s as Record<string, unknown>).completed === "boolean"
        )
      : [],
    notes:       typeof r.notes === "string"      ? r.notes.slice(0, 5000) : undefined,
    completedAt: typeof r.completedAt === "string" && !isNaN(new Date(r.completedAt).getTime()) ? r.completedAt : undefined,
    recurring:   VALID_RECURRING.has(String(r.recurring))
      ? r.recurring as Task["recurring"]
      : null,
    order:              typeof r.order === "number" ? r.order : undefined,
    eisenhowerQuadrant: ["q1","q2","q3","q4"].includes(String(r.eisenhowerQuadrant))
      ? r.eisenhowerQuadrant as Task["eisenhowerQuadrant"]
      : null,
  };
}

export default function DataControls() {
  const { tasks, importTasks } = useTaskStore();

  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify(tasks, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "taskiner-tasks.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      alert("❌ Błąd podczas eksportowania danych!");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) {
          alert("⚠️ Nieprawidłowy format pliku — oczekiwano tablicy zadań.");
          return;
        }
        const sanitized: Task[] = [];
        for (const raw of parsed) {
          const task = sanitizeTask(raw);
          if (task) sanitized.push(task);
        }
        if (sanitized.length === 0) {
          alert("⚠️ Plik nie zawiera żadnych prawidłowych zadań.");
          return;
        }
        importTasks(sanitized);
      } catch {
        alert("❌ Błąd przy wczytywaniu pliku. Sprawdź czy plik jest prawidłowym JSON-em.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      className="data-controls"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <button className="export-btn" onClick={handleExport}>
        📤 Eksportuj
      </button>

      <label className="import-label">
        📥 Importuj
        <input
          type="file"
          accept="application/json"
          onChange={handleImport}
        />
      </label>
    </motion.div>
  );
}
