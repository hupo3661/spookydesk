import type { CopyPack } from '../types';

/**
 * Classic Clean copy. Voice: calm, direct, and professional. Labels say
 * exactly what the control does, with no wordplay.
 *
 * Unit strings are rendered right after a number ("3 completed",
 * "25 / 60 min focused"), so they are written to read well for any count.
 */
export const classicCopy: CopyPack = {
  // Tasks
  'tasks.addPlaceholder': 'Add a new task…',
  'tasks.completeLabel': 'Complete',
  'tasks.deleteLabel': 'Delete',
  'tasks.priority.low': 'Low',
  'tasks.priority.medium': 'Medium',
  'tasks.priority.high': 'High',
  'tasks.filter.today': 'Today',
  'tasks.filter.all': 'All tasks',
  'tasks.filter.completed': 'Completed',
  'tasks.emptyState.today': 'Nothing scheduled for today.',
  'tasks.emptyState.all': 'No tasks yet. Add one above to get started.',
  'tasks.emptyState.completed': 'No completed tasks yet.',

  // Focus
  'focus.heading': 'Focus',
  'focus.startLabel': 'Start session',
  'focus.pauseLabel': 'Pause',
  'focus.resumeLabel': 'Resume',
  'focus.resetLabel': 'Reset',
  'focus.startBreakLabel': 'Start break',
  'focus.completedMessage': 'Session complete. Take a short break.',
  'focus.sessionUnit': 'session',

  // Today
  'today.heading': 'Today',
  'today.greetings.count': '3',
  'today.greetings.0': 'Good to see you. Here is your day.',
  'today.greetings.1': 'What would you like to focus on today?',
  'today.greetings.2': 'One task at a time.',
  'today.goalUnit': 'min focused',
  'today.goalLabel': 'Daily focus goal',
  'today.emptyState': 'No tasks scheduled for today. Add one to begin.',

  // Stats
  'stats.heading': 'Statistics',
  'stats.weekHeading': 'This week',
  'stats.seriesTasksLabel': 'Tasks completed',
  'stats.seriesFocusLabel': 'Focus time (min)',
  'stats.tasksUnit': 'completed',
  'stats.focusUnit': 'min',
  'stats.monstersDefeated': 'Tasks Completed',
  'stats.lifetimeFocusMinutes': 'Total Focus Time (min)',

  // Streak
  'streak.unit': 'day streak',
  'streak.longestLabel': 'Longest streak',

  // Nav
  'nav.costumePicker': 'Change costume',
};
