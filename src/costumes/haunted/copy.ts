import type { CopyPack } from '../types';

/**
 * Haunted Halloween copy. Voice: a cheerfully macabre desk familiar.
 * Tasks are monsters, focus sessions are potion brews, streaks are
 * jack-o'-lanterns. Wordplay stays secondary to clarity: every label still
 * says what the button does.
 *
 * Unit strings are rendered right after a number ("3 defeated",
 * "25 / 60 min brewed"), so they are written to read well for any count.
 */
export const hauntedCopy: CopyPack = {
  // Tasks
  'tasks.addPlaceholder': 'Summon a new monster…',
  'tasks.addLabel': "Summon",
  'tasks.completeLabel': 'Defeat!',
  'tasks.deleteLabel': 'Banish',
  'tasks.priority.low': 'Minion',
  'tasks.priority.medium': 'Ghoul',
  'tasks.priority.high': 'Boss',
  'tasks.filter.today': "Today's Hunt",
  'tasks.filter.all': 'All Monsters',
  'tasks.filter.completed': 'Defeated',
  'tasks.emptyState.today': 'No monsters lurk today. Enjoy the eerie calm.',
  'tasks.emptyState.all': 'Your desk is hauntingly clear. Summon a monster above.',
  'tasks.emptyState.completed': 'No monsters defeated yet. They are getting cocky.',
  'tasks.errorEmptyTitle': "Every monster needs a name.",
  'tasks.deleteConfirm': "Banish forever?",
  'tasks.editLabel': "Inspect",
  'tasks.linkedIndicator': "Brewing…",
  'tasks.dueDateLabel': "Haunts on",
  'tasks.categoryLabel': "Coven",
  'tasks.saveLabel': "Save",
  'tasks.cancelLabel': "Retreat",

  // Focus
  'focus.heading': 'Brew a Potion',
  'focus.startLabel': 'Brew potion',
  'focus.pauseLabel': 'Pause brew',
  'focus.resumeLabel': 'Resume brew',
  'focus.resetLabel': 'Discard brew',
  'focus.startBreakLabel': 'Take a haunted rest',
  'focus.completedMessage': 'Potion complete! 🧪',
  'focus.breakHeading': 'Rest in peace…',
  'focus.taskBinderLabel': 'Brew for monster',
  'focus.taskBinderNone': 'No monster',
  'focus.settingsFocusLabel': 'Brew time (min)',
  'focus.settingsBreakLabel': 'Rest time (min)',
  'focus.sessionUnit': 'brew',

  // Today
  'today.heading': "Today's Hunt",
  'today.greetings.count': '5',
  'today.greetings.0': 'The spirits await your tasks…',
  'today.greetings.1': "What lurks on today's list?",
  'today.greetings.2': 'Brew potions. Defeat evil. Repeat.',
  'today.greetings.3': 'The haunted desk is ready.',
  'today.greetings.4': 'Another day to defeat monsters.',
  'today.goalUnit': 'min brewed',
  'today.goalLabel': 'Daily potion goal',
  'today.emptyState': 'No monsters lurk today. Add one, if you dare.',

  // Stats
  'stats.heading': 'The Haunted Ledger',
  'stats.weekHeading': "This week's carnage",
  'stats.seriesTasksLabel': 'Monsters defeated',
  'stats.seriesFocusLabel': 'Potions brewed (min)',
  'stats.tasksUnit': 'defeated',
  'stats.focusUnit': 'min',
  'stats.monstersDefeated': 'Monsters Defeated',
  'stats.lifetimeFocusMinutes': 'Potions Brewed (min)',

  // Streak
  'streak.unit': '🎃',
  'streak.longestLabel': 'Best haunt',

  // App
  'app.title': 'SpookyDesk',

  // Nav
  'nav.costumePicker': 'Change costume',
  'nav.tasks': 'Monsters',
  'nav.focus': 'Brew',
  'nav.settings': 'Settings',
};
