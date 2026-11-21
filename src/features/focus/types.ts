export type TimerState =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'break_running'
  | 'break_paused';

export interface SessionRecord {
  /** UUID v4, generated at session start. */
  id: string;
  /** Task id from tasks feature, or null. */
  taskId: string | null;
  /** ISO 8601 datetime: when the focus phase began. */
  startedAt: string;
  /** Configured focus duration at session start. */
  plannedMinutes: number;
  /** Actual elapsed focus time in seconds (excluding pauses). */
  actualSeconds: number;
  /** True only when the focus countdown reached zero naturally. */
  completed: boolean;
}

export interface SessionsStore {
  schemaVersion: number;
  sessions: SessionRecord[];
}

export interface TimerRecord {
  phase: 'focus' | 'break';
  /** ISO 8601, set when phase begins (or resumes after pause). */
  startedAt: string;
  /** ISO 8601, set when pause begins; null when running. */
  pausedAt: string | null;
  /** Cumulative pause time in milliseconds for the current phase. */
  totalPausedMs: number;
  /** Planned duration of the current phase in milliseconds. */
  plannedMs: number;
}
