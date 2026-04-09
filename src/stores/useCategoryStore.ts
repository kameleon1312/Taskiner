import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category } from "../types";
import { generateId } from "../utils/generateId";

interface CategoryStore {
  categories: Category[];
  addCategory: (name: string, emoji: string, color: string) => void;
  deleteCategory: (id: number) => void;
  updateCategory: (id: number, data: Partial<Omit<Category, "id">>) => void;
}

const defaultCategories: Category[] = [
  { id: 1, name: "Praca",     emoji: "💼", color: "#4d9fff" },
  { id: 2, name: "Dom",       emoji: "🏠", color: "#37d67a" },
  { id: 3, name: "Osobiste",  emoji: "🎯", color: "#e15fff" },
  { id: 4, name: "Nauka",     emoji: "📚", color: "#ffd166" },
];

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set) => ({
      categories: defaultCategories,

      addCategory: (name, emoji, color) =>
        set((state) => ({
          categories: [
            ...state.categories,
            { id: generateId(), name, emoji, color },
          ],
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      updateCategory: (id, data) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),
    }),
    { name: "taskiner-categories" }
  )
);
