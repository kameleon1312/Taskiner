import React from "react";
import { motion } from "framer-motion";
import { useTaskStore } from "../stores/useTaskStore";
import { useCategoryStore } from "../stores/useCategoryStore";
import type { Filter } from "../types";

const STATUS_FILTERS: { type: Filter; label: string }[] = [
  { type: "all",       label: "Wszystkie" },
  { type: "active",    label: "Aktywne"   },
  { type: "completed", label: "Ukończone" },
];

export default function FilterBar() {
  const filter              = useTaskStore((s) => s.filter);
  const setFilter           = useTaskStore((s) => s.setFilter);
  const activeCategoryId    = useTaskStore((s) => s.activeCategoryId);
  const setActiveCategoryId = useTaskStore((s) => s.setActiveCategoryId);
  const { categories }      = useCategoryStore();

  return (
    <motion.div
      className="filter-bar"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Segmented control — status */}
      <div className="filter-segments">
        {STATUS_FILTERS.map(({ type, label }) => (
          <button
            key={type}
            className={filter === type ? "active" : ""}
            onClick={() => setFilter(type)}
            aria-pressed={filter === type}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Category chips — horizontal scroll */}
      {categories.length > 0 && (
        <div className="filter-categories">
          <button
            className={`cat-chip ${activeCategoryId === null ? "active" : ""}`}
            onClick={() => setActiveCategoryId(null)}
          >
            Wszystkie
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-chip ${activeCategoryId === cat.id ? "active" : ""}`}
              style={{ "--cat-color": cat.color } as React.CSSProperties}
              onClick={() =>
                setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)
              }
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
