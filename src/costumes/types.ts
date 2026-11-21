// Canonical key sets for costume packs. Add new keys here first, then update
// every pack; `tsc --noEmit` reports any pack that is missing a key.

export const CSS_VAR_KEYS = [
  // Colors
  'color-bg',
  'color-surface',
  'color-text',
  'color-primary',
  'color-accent',
  'color-muted',
  // Priority colors
  'color-priority-low',
  'color-priority-medium',
  'color-priority-high',
  // Streak colors
  'color-streak-lit',
  'color-streak-unlit',
  // Chart colors
  'color-bar-bg',
  // Typography
  'font-family-base',
  // Shape
  'radius-card',
  'shadow-card',
] as const;

export const COPY_KEYS = [
  // Tasks
  'tasks.addPlaceholder',
  'tasks.completeLabel',
  'tasks.deleteLabel',
  'tasks.priority.low',
  'tasks.priority.medium',
  'tasks.priority.high',
  'tasks.filter.today',
  'tasks.filter.all',
  'tasks.filter.completed',
  'tasks.emptyState.today',
  'tasks.emptyState.all',
  'tasks.emptyState.completed',
  // Focus
  'focus.heading',
  'focus.startLabel',
  'focus.pauseLabel',
  'focus.resumeLabel',
  'focus.resetLabel',
  'focus.startBreakLabel',
  'focus.completedMessage',
  'focus.sessionUnit',
  // Today
  'today.heading',
  'today.greetings.count',
  'today.greetings.0',
  'today.greetings.1',
  'today.greetings.2',
  'today.goalUnit',
  'today.goalLabel',
  'today.emptyState',
  // Stats
  'stats.heading',
  'stats.weekHeading',
  'stats.seriesTasksLabel',
  'stats.seriesFocusLabel',
  'stats.tasksUnit',
  'stats.focusUnit',
  'stats.monstersDefeated',
  'stats.lifetimeFocusMinutes',
  // Streak
  'streak.unit',
  'streak.longestLabel',
  // Nav
  'nav.costumePicker',
] as const;

export const SOUND_KEYS = [
  'task-complete',
  'task-add',
  'session-start',
  'session-end',
  'costume-change',
] as const;

export type CssVarKey = (typeof CSS_VAR_KEYS)[number];
export type CopyKey = (typeof COPY_KEYS)[number];
export type SoundKey = (typeof SOUND_KEYS)[number];

export type CssVarPack = Record<CssVarKey, string>;
export type CopyPack = Record<CopyKey, string>;
/** A null value means intentionally silent for that slot. */
export type SoundPack = Record<SoundKey, string | null>;

export interface CostumePack {
  /** Machine-readable id, used in localStorage and as a CSS class. */
  id: string;
  /** Display name in the costume picker. */
  label: string;
  cssVars: CssVarPack;
  copy: CopyPack;
  sounds: SoundPack;
}
