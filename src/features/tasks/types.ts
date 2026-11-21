export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'active' | 'done';

export interface Task {
  /** UUID v4, assigned at creation, never mutated. */
  id: string;
  title: string;
  priority: TaskPriority;
  /** ISO 8601 date string, YYYY-MM-DD only, no time component. */
  dueDate: string | null;
  /** Free text, max 32 chars, may be empty string. */
  category: string;
  status: TaskStatus;
  /** ISO 8601 datetime set when status transitions to 'done'. */
  completedAt: string | null;
  /** Set by the timer feature; null when no session is linked. */
  linkedSessionId: string | null;
  /** ISO 8601 datetime. */
  createdAt: string;
  /** ISO 8601 datetime, updated on every field change. */
  updatedAt: string;
}

export type TaskFilter = 'today' | 'all' | 'completed';

export type NewTaskDraft = Pick<
  Task,
  'title' | 'priority' | 'dueDate' | 'category'
>;
