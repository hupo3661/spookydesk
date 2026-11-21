/** Persisted streak record. */
export interface StreakStore {
  schemaVersion: number;       // current: 1
  /** Local YYYY-MM-DD of the most recent active day, or null on first use. */
  lastActiveDate: string | null;
  currentStreak: number;
  longestStreak: number;
}

/** Aggregated stats for one calendar day. */
export interface DayStats {
  /** Local YYYY-MM-DD. */
  date: string;
  tasksCompleted: number;
  focusMinutes: number;
}

/** Props shape passed between aggregation layer and chart components. */
export interface WeekStats {
  days: DayStats[];            // always exactly 7 entries, oldest first
  maxTasksCompleted: number;   // max across the 7 days (used for bar scaling)
  maxFocusMinutes: number;     // max across the 7 days
}
