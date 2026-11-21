import type { Task } from '../tasks/types';
import type { SessionRecord } from '../focus/types';
import { offsetLocalDate, toLocalDate } from './dateUtils';
import type { DayStats, WeekStats } from './types';

function completedSecondsOn(sessions: SessionRecord[], date: string): number {
  return sessions
    .filter((s) => s.completed && toLocalDate(new Date(s.startedAt)) === date)
    .reduce((acc, s) => acc + s.actualSeconds, 0);
}

/** Tasks due today, or undated tasks created today. */
export function getTodayTasks(tasks: Task[], today: string): Task[] {
  return tasks.filter((t) => {
    if (t.dueDate !== null) return t.dueDate === today;
    return toLocalDate(new Date(t.createdAt)) === today;
  });
}

/** Whole focused minutes from completed sessions started today. */
export function getTodayFocusMinutes(
  sessions: SessionRecord[],
  today: string,
): number {
  return Math.floor(completedSecondsOn(sessions, today) / 60);
}

/** Stats for the 7 days ending today; days[0] is oldest. */
export function getWeekStats(
  tasks: Task[],
  sessions: SessionRecord[],
  today: string,
): WeekStats {
  const base = new Date(today + 'T00:00:00');
  const days: DayStats[] = [];
  for (let offset = -6; offset <= 0; offset++) {
    const date = offsetLocalDate(base, offset);
    const tasksCompleted = tasks.filter(
      (t) => t.completedAt !== null && toLocalDate(new Date(t.completedAt)) === date,
    ).length;
    const focusMinutes = Math.floor(completedSecondsOn(sessions, date) / 60);
    days.push({ date, tasksCompleted, focusMinutes });
  }
  return {
    days,
    maxTasksCompleted: Math.max(1, ...days.map((d) => d.tasksCompleted)),
    maxFocusMinutes: Math.max(1, ...days.map((d) => d.focusMinutes)),
  };
}

/** Whole minutes of completed focus sessions across all time. */
export function getLifetimeFocusMinutes(sessions: SessionRecord[]): number {
  return Math.floor(
    sessions
      .filter((s) => s.completed)
      .reduce((acc, s) => acc + s.actualSeconds, 0) / 60,
  );
}
