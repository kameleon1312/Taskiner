import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTaskStore } from "../stores/useTaskStore";
import { useHabitStore } from "../stores/useHabitStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import { useFocusStore } from "../stores/useFocusStore";
import { useActivityStore, type ActivityEntry } from "../stores/useActivityStore";
import { toast } from "../notifications/toastStore";
import { normalizeDeadline } from "../utils/deadline";
import { toDateKey } from "../utils/dateUtils";
import type { Task, Habit, Category, FocusSession } from "../types";

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
    deadline:  typeof r.deadline === "string" ? normalizeDeadline(r.deadline) : null,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : undefined,
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

interface Backup {
  app: "taskiner";
  version: number;
  exportedAt: string;
  tasks: unknown[];
  habits?: unknown[];
  categories?: unknown[];
  focusSessions?: unknown[];
  activity?: unknown[];
  completionLog?: unknown[];
}

export default function DataControls() {
  const tasks = useTaskStore((s) => s.tasks);
  const importTasks = useTaskStore((s) => s.importTasks);
  const [mode, setMode] = useState<"merge" | "replace">("merge");

  const handleExport = () => {
    try {
      const backup: Backup = {
        app: "taskiner",
        version: 3,
        exportedAt: new Date().toISOString(),
        tasks,
        habits:        useHabitStore.getState().habits,
        categories:    useCategoryStore.getState().categories,
        focusSessions: useFocusStore.getState().sessions,
        activity:      useActivityStore.getState().entries.map(({ snapshot, ...e }) => e),
        completionLog: useTaskStore.getState().completionLog,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `taskiner-backup-${toDateKey(new Date())}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ kind: "success", title: "Kopia zapasowa gotowa", body: `${tasks.length} zadań i cała historia`, ttl: 3500 });
    } catch {
      toast({ kind: "info", title: "Błąd eksportu", body: "Nie udało się utworzyć pliku.", ttl: 3500 });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        // Legacy files are a bare task array; v3 backups are objects
        const rawTasks: unknown[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.tasks) ? parsed.tasks : [];
        const sanitized = rawTasks.map(sanitizeTask).filter((t): t is Task => !!t);
        if (sanitized.length === 0 && !Array.isArray(parsed?.habits)) {
          toast({ kind: "info", title: "Brak danych do importu", body: "Plik nie zawiera prawidłowych zadań.", ttl: 4000 });
          return;
        }
        if (sanitized.length) importTasks(sanitized, mode);

        if (!Array.isArray(parsed)) {
          if (Array.isArray(parsed.habits) && (mode === "replace" || !useHabitStore.getState().habits.length)) {
            useHabitStore.setState({ habits: parsed.habits.filter((h: Habit) => h && typeof h.id === "number" && Array.isArray(h.completions)) });
          }
          if (Array.isArray(parsed.categories) && parsed.categories.length && mode === "replace") {
            useCategoryStore.setState({ categories: parsed.categories.filter((c: Category) => c && typeof c.id === "number" && typeof c.name === "string") });
          }
          if (Array.isArray(parsed.focusSessions) && mode === "replace") {
            useFocusStore.setState({ sessions: parsed.focusSessions.filter((x: FocusSession) => x && typeof x.minutes === "number") });
          }
          if (Array.isArray(parsed.activity)) {
            const current = useActivityStore.getState().entries;
            const ids = new Set(current.map((x) => x.id));
            const incoming = (parsed.activity as ActivityEntry[]).filter((x) => x && typeof x.at === "string" && typeof x.type === "string" && !ids.has(x.id));
            const merged = (mode === "replace" ? incoming : [...current, ...incoming]).sort((a, b) => a.at.localeCompare(b.at));
            useActivityStore.setState({ entries: merged });
          }
        }
        toast({ kind: "success", title: "Zaimportowano", body: `${sanitized.length} zadań · tryb: ${mode === "merge" ? "scalanie" : "zastąpienie"}`, ttl: 4000 });
      } catch {
        toast({ kind: "info", title: "Błąd importu", body: "Sprawdź, czy plik jest prawidłowym JSON-em.", ttl: 4000 });
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      className="data-controls-wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="data-controls">
        <button className="export-btn" onClick={handleExport}>📤 Eksportuj</button>
        <label className="import-label">
          📥 Importuj
          <input type="file" accept="application/json,.json" onChange={handleImport} />
        </label>
      </div>
      <div className="data-mode" role="radiogroup" aria-label="Tryb importu">
        <label><input type="radio" checked={mode === "merge"} onChange={() => setMode("merge")} /> Scal z obecnymi</label>
        <label><input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} /> Zastąp</label>
      </div>
    </motion.div>
  );
}
