export type Priority  = "urgent" | "high" | "normal" | "low";
export type Recurring = "daily" | "weekly" | "monthly";

export interface Subtask {
  id: number;
  text: string;
  completed: boolean;
}

export interface Category {
  id: number;
  name: string;
  emoji: string;
  color: string;
}

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  deadline: string | null;
  priority?: Priority;
  categoryId?: number | null;
  subtasks?: Subtask[];
  notes?: string;
  alertPlayed?: boolean;
  completedAt?: string;
  recurring?: Recurring | null;
  order?: number;
  eisenhowerQuadrant?: "q1" | "q2" | "q3" | "q4" | null;
}

export type Filter = "all" | "active" | "completed";

export type Theme = "dark" | "light";

export interface Habit {
  id: number;
  name: string;
  emoji: string;
  color: string;
  frequency: "daily" | "weekly";
  createdAt: string;
  completions: string[]; // YYYY-MM-DD
}

export interface FocusSession {
  id: number;
  taskId: number | null;
  taskText: string | null;
  categoryId: number | null;
  startedAt: string;
  minutes: number;
  completed: boolean;
}
