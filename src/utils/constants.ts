import type { Priority } from "../types";

export const PRIORITY_CONFIG: Record<Priority, { color: string; label: string; emoji: string }> = {
  urgent: { color: "#f87171", label: "Pilne",    emoji: "🔴" },
  high:   { color: "#fbbf24", label: "Ważne",    emoji: "🟠" },
  normal: { color: "#818cf8", label: "Normalne", emoji: "🔵" },
  low:    { color: "#64748b", label: "Niskie",   emoji: "⚪" },
};
