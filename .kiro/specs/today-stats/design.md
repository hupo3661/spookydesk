# Design — Today & Stats Feature

## 1. Goals and constraints

- No backend. All aggregation runs in the browser against the existing tasks
  and sessions localStorage stores; nothing is duplicated.
- One new localStorage store: `spookydesk.streak` (versioned, schema v1).
- All colors via CSS variables; all copy via `t()` from the costume engine.
- Vite + React + TypeScript, mobile-first at 360 px.
- No third-party chart library; charts are plain divs or inline SVG.

---

## 2. File layout

```
src/
  features/
    today-stats/
      types.ts                  # StreakStore, DayStats, shared derivation types
      streakStorage.ts           # load/save StreakStore, updateStreak()
      streakMigrations.ts        # migrate() for schema bumps
      aggregations.ts            # pure functions: getTodayTasks, getTodayFocusMinutes,
                                 #   getWeekStats, getLifetimeStats
      dateUtils.ts               # toLocalDate(), localDateInt(), parseLocalDate()
      TodayPage.tsx              # Today route/page wrapper
      StatsPage.tsx              # Stats route/page wrapper
      components/
        TodayTaskList.tsx         # today's task list shell
        FocusGoalWidget.tsx       # progress bar + editable goal
        StreakDisplay.tsx         # haunted: jack-o'-lanterns; classic: badge
        DailyGreeting.tsx         # single greeting line
        WeekChart.tsx             # 7-day bar chart
        DayColumn.tsx             # one column in WeekChart
        LifetimeCounters.tsx      # monsters defeated + focus minutes
        TodayPage.module.css
        StatsPage.module.css
        FocusGoalWidget.module.css
        StreakDisplay.module.css
        WeekChart.module.css
        DayColumn.module.css
        LifetimeCounters.module.css
```

Feature components import nothing from `src/costumes/` directly. They use
`useCostume()` for `t()`, `costumeId`, and `play()`. CSS files reference
`var(--token)` only.

---

## 3. Data types

```typescript
// src/features/today-stats/types.ts

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
```

---

## 4. Date utilities

All date work in this feature uses local calendar dates. No UTC conversions
except when interpreting ISO 8601 strings from the existing stores (which
encode UTC instants).

```typescript
// src/features/today-stats/dateUtils.ts

/**
 * Returns the local YYYY-MM-DD string for a given Date (defaults to now).
 * Example: new Date('2026-11-19T16:00:00Z') in UTC+8 → "2026-11-20"
 */
export function toLocalDate(d: Date = new Date()): string;

/**
 * Returns today's local date as an integer YYYYMMDD.
 * Used for deterministic greeting index.
 */
export function localDateInt(d: Date = new Date()): number;

/**
 * Returns the local YYYY-MM-DD string for d offset by `days` calendar days.
 * offset = 0 → today, offset = -1 → yesterday, offset = -6 → 6 days ago.
 */
export function offsetLocalDate(d: Date, offsetDays: number): string;

/**
 * Returns true when two local date strings are consecutive calendar days
 * (a is exactly one day before b).
 */
export function isYesterday(a: string, b: string): boolean;
```

`toLocalDate` is implemented as:

```typescript
function toLocalDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

This uses local time fields (`getFullYear`, `getMonth`, `getDate`), which
correctly reflects the user's clock timezone without any UTC adjustment.

`isYesterday(a, b)` is implemented by parsing both strings with
`new Date(a + 'T00:00:00')` and comparing the difference to 86 400 000 ms.
Using the `T00:00:00` suffix (no Z) makes the Date constructor interpret the
value as local midnight, avoiding off-by-one errors at DST boundaries.

> **Timezone / date-boundary rule**: every date comparison in this feature
> derives the calendar date from `d.getFullYear/Month/Date()` (local fields).
> ISO 8601 strings from tasks (`dueDate`, `completedAt`, `createdAt`) and
> sessions (`startedAt`) are always parsed with `new Date(isoString)` to get
> a `Date` object, then converted with `toLocalDate()`. This means a session
> that starts at 23:55 local time and ends past midnight contributes to the
> day it *started* on.

---

## 5. Aggregation functions

All functions in `aggregations.ts` are pure; they take store data as
arguments and return derived values. They never read localStorage themselves —
callers load the stores and pass them in.

```typescript
// src/features/today-stats/aggregations.ts

import { Task } from '../tasks/types';
import { SessionRecord } from '../focus/types';
import { DayStats, WeekStats } from './types';

/**
 * Returns tasks that belong on the Today list.
 * A task belongs today if:
 *   dueDate === today  OR  (dueDate === null AND createdAt local date === today)
 */
export function getTodayTasks(tasks: Task[], today: string): Task[];

/**
 * Returns the total focused minutes for today.
 * Counts only completed sessions whose startedAt local date === today.
 */
export function getTodayFocusMinutes(
  sessions: SessionRecord[],
  today: string,
): number;

/**
 * Returns WeekStats for the 7 days ending on (and including) today.
 * days[0] = oldest (today - 6), days[6] = today.
 */
export function getWeekStats(
  tasks: Task[],
  sessions: SessionRecord[],
  today: string,
): WeekStats;

/**
 * Returns the sum of actualSeconds (completed sessions only) across all time,
 * converted to whole minutes.
 */
export function getLifetimeFocusMinutes(sessions: SessionRecord[]): number;
```

### Implementation notes

**`getTodayTasks`**

```typescript
tasks.filter(t => {
  if (t.dueDate !== null) return t.dueDate === today;
  return toLocalDate(new Date(t.createdAt)) === today;
});
```

**`getTodayFocusMinutes`**

```typescript
const seconds = sessions
  .filter(s => s.completed && toLocalDate(new Date(s.startedAt)) === today)
  .reduce((acc, s) => acc + s.actualSeconds, 0);
return Math.floor(seconds / 60);
```

**`getWeekStats`**

Build an array of 7 date strings with `offsetLocalDate`. For each date,
count tasks where `toLocalDate(new Date(t.completedAt!)) === date` (filtering
`completedAt !== null`), and sum session seconds for completed sessions on
that date. Set `maxTasksCompleted` and `maxFocusMinutes` to the maximum values
across all 7 days (minimum 1 each, to avoid division by zero in bar scaling).

**`getLifetimeFocusMinutes`**

```typescript
Math.floor(
  sessions
    .filter(s => s.completed)
    .reduce((acc, s) => acc + s.actualSeconds, 0) / 60
);
```

---

## 6. Streak store

### 6.1 Storage module

```typescript
// src/features/today-stats/streakStorage.ts

export const STREAK_KEY = 'spookydesk.streak';

export function loadStreakStore(): StreakStore;
export function saveStreakStore(store: StreakStore): void;

/**
 * Core streak update. Reads the current store, applies rules, saves.
 * today is a local YYYY-MM-DD string.
 * Returns the updated store.
 */
export function updateStreak(today: string): StreakStore;
```

`loadStreakStore` wraps parse in `try/catch`; on failure returns the default:

```typescript
const DEFAULT_STREAK: StreakStore = {
  schemaVersion: 1,
  lastActiveDate: null,
  currentStreak: 0,
  longestStreak: 0,
};
```

### 6.2 `updateStreak` logic

```typescript
function updateStreak(today: string): StreakStore {
  const store = loadStreakStore();
  const { lastActiveDate, currentStreak, longestStreak } = store;

  if (lastActiveDate === today) {
    return store;                                 // already active today
  }

  let next: number;
  if (lastActiveDate !== null && isYesterday(lastActiveDate, today)) {
    next = currentStreak + 1;                     // consecutive day
  } else {
    next = 1;                                     // gap or first use
  }

  const updated: StreakStore = {
    ...store,
    lastActiveDate: today,
    currentStreak: next,
    longestStreak: Math.max(longestStreak, next),
  };
  saveStreakStore(updated);
  return updated;
}
```

### 6.3 Callers

`updateStreak(toLocalDate())` must be called from two places:

1. `TasksContext.completeTask` — after `status` is set to `'done'` and
   `incrementMonstersDefeated()` is called.
2. `useTimer` — after the session record is written with `completed: true`
   (same point where `play('session-end')` fires).

Both callers obtain `today` via `toLocalDate()` at the moment of the event,
ensuring late-night completions attribute to the correct local calendar day.

### 6.4 Migrations

```typescript
// src/features/today-stats/streakMigrations.ts

export const CURRENT_STREAK_SCHEMA_VERSION = 1;

type Migration = (raw: StreakStore) => StreakStore;
const MIGRATIONS: Record<number, Migration> = {};

export function migrateStreakStore(raw: StreakStore): StreakStore {
  let store = raw;
  for (let v = store.schemaVersion + 1; v <= CURRENT_STREAK_SCHEMA_VERSION; v++) {
    if (MIGRATIONS[v]) store = MIGRATIONS[v](store);
  }
  return { ...store, schemaVersion: CURRENT_STREAK_SCHEMA_VERSION };
}
```

`loadStreakStore` calls `migrateStreakStore` after parsing.

---

## 7. Settings integration

The today-stats feature adds one key to the shared settings store:

| Key | Type | Default | Validation |
|---|---|---|---|
| `focusGoal` | `number` (integer) | `25` | 1–480 (minutes) |

It reads and writes this key via `getSetting('focusGoal')` and
`setSetting('focusGoal', value)` from `src/settings.ts`, the same helpers
used by the costume engine and focus features. No new settings schema version
is required unless the settings spec mandates a version bump for new keys —
the settings module's existing migration skeleton handles that.

---

## 8. Component breakdown

### 8.1 `TodayPage`

Route wrapper for the Today view. On mount it loads the tasks store and
sessions store, derives today's data, and renders:

```
<DailyGreeting />
<StreakDisplay />
<FocusGoalWidget />
<TodayTaskList />
```

It subscribes to `TasksContext` for the task list (so completed tasks update
live) and re-reads sessions from `getAllSessions()` on render (sessions are
append-only; a render triggered by task completion always has the latest
session data).

```typescript
// Props / state used internally
const today = toLocalDate();
const allTasks = /* from TasksContext */;
const todayTasks = getTodayTasks(allTasks, today);
const sessions = getAllSessions();
const focusMinutes = getTodayFocusMinutes(sessions, today);
const streak = loadStreakStore();
```

`TodayPage` does not introduce its own context; it passes derived values down
as props.

### 8.2 `DailyGreeting`

```typescript
interface DailyGreetingProps {
  today: string; // YYYY-MM-DD
}
```

Reads the greeting list length from the copy pack via a `t('today.greetings.count')`
key (an integer-as-string), computes `index = localDateInt(new Date(today)) %
count`, then renders `t('today.greetings.' + index)`.

> **Copy-pack design**: greeting strings are stored as `today.greetings.0`,
> `today.greetings.1`, … `today.greetings.N-1`, plus `today.greetings.count`
> as a numeric string. This keeps them inside the flat `CopyPack` type without
> requiring a nested structure.

### 8.3 `FocusGoalWidget`

```typescript
interface FocusGoalWidgetProps {
  focusMinutes: number;   // actual today
  goal: number;           // from settings
  onGoalChange: (newGoal: number) => void;
}
```

Renders:
- A progress bar: a fixed-height outer `<div>` with a filled inner `<div>`
  whose width is `Math.min(100, (focusMinutes / goal) * 100)%`. Both divs use
  CSS variable colors only.
- A label: `{focusMinutes} / {goal} {t('today.goalUnit')}`.
- An inline `<input type="number">` for editing the goal, pre-filled with the
  current goal. On `blur` or `Enter`, validates (1–480 integer) and calls
  `onGoalChange`. On invalid input, resets the displayed value to `goal`
  without calling `onGoalChange`.

The inner bar width is set via a CSS custom property injected as an inline
style: `style={{ '--progress': `${pct}%` }}`. The CSS module uses
`width: var(--progress)`. This is the only permitted use of inline style in
this component.

### 8.4 `StreakDisplay`

```typescript
interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}
```

Reads `costumeId` from `useCostume()`.

**haunted costume:**

Renders a row of `MAX_STREAK_DISPLAY` (10) icon elements. The first
`Math.min(currentStreak, MAX_STREAK_DISPLAY)` icons receive the CSS class
`lit`; the rest receive `unlit`. Icon visuals are CSS-only (background image
or SVG data URI defined in the CSS module; not referenced from copy pack). If
`currentStreak > MAX_STREAK_DISPLAY`, renders a sibling `<span>` with
`+{currentStreak - MAX_STREAK_DISPLAY}`.

**classic costume:**

Renders `{currentStreak} {t('streak.unit')}` as a plain numeric badge styled
with `var(--color-primary)`.

Both variants render `{t('streak.longestLabel')}: {longestStreak}` as a
secondary label beneath.

### 8.5 `TodayTaskList`

```typescript
interface TodayTaskListProps {
  tasks: Task[];
}
```

Renders `TaskItem` for each task in `tasks` (imported from the tasks feature's
component folder), or `<EmptyState />` with `filter="today"` when empty.
No sorting logic — tasks appear in the order returned by `getTodayTasks`
(which preserves store order).

This is a thin wrapper; the full task interaction (complete, edit, delete)
remains inside `TaskItem` and `TasksContext` exactly as defined in the tasks
spec. `TodayPage` must mount inside `TasksProvider` so `TasksContext` is
available.

### 8.6 `StatsPage`

Route wrapper for the Stats view. On render it loads both stores and
computes:

```typescript
const today = toLocalDate();
const tasks = loadTasksStore().tasks;
const sessions = getAllSessions();
const weekStats = getWeekStats(tasks, sessions, today);
const lifetimeFocusMinutes = getLifetimeFocusMinutes(sessions);
const monstersDefeated = getMonstersDefeated();
```

Renders:

```
<WeekChart weekStats={weekStats} />
<LifetimeCounters monstersDefeated={monstersDefeated} lifetimeFocusMinutes={lifetimeFocusMinutes} />
```

`StatsPage` does not need `TasksContext` because it reads the store directly
(stats are a snapshot; real-time reactivity is not required on this view).

### 8.7 `WeekChart`

```typescript
interface WeekChartProps {
  weekStats: WeekStats;
}
```

Renders a row of 7 `<DayColumn>` components. The chart container is a flex
row with `align-items: flex-end` so bars grow upward. The chart is `width:
100%`, `min-width: 0`, mobile-friendly.

Also renders a legend strip below the chart showing the two series colors
(squares + labels `t('stats.seriesTasksLabel')` and
`t('stats.seriesFocusLabel')`).

### 8.8 `DayColumn`

```typescript
interface DayColumnProps {
  stats: DayStats;
  maxTasks: number;
  maxFocus: number;
}
```

Renders two vertical bar `<div>`s side by side:
- Tasks bar: height `(tasksCompleted / maxTasks) * 100%` of the column max
  height. Color `var(--color-primary)`.
- Focus bar: height `(focusMinutes / maxFocus) * 100%`. Color
  `var(--color-accent)`.

Heights are set via inline CSS custom properties (`--tasks-h`, `--focus-h`) on
the bar `<div>` elements; the CSS module maps `height: var(--tasks-h)`. This
is the only permitted use of inline style in this component.

Day label below the bars: short weekday from
`new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(stats.date + 'T00:00:00'))`.

Tooltip on `title` attribute (or `aria-label`) shows:
`{weekday}: {tasksCompleted} {t('stats.tasksUnit')}, {focusMinutes} {t('stats.focusUnit')}`.

### 8.9 `LifetimeCounters`

```typescript
interface LifetimeCountersProps {
  monstersDefeated: number;
  lifetimeFocusMinutes: number;
}
```

Renders two stat blocks, each with a large numeric value and a copy-pack
label. Layout: flex row on wide screens, stacked on narrow (via CSS
`flex-wrap`). No CSS variables needed beyond base tokens.

---

## 9. Integration with tasks and focus features

### 9.1 `updateStreak` call sites

The today-stats feature exports `updateStreak` from `streakStorage.ts`. The
tasks and focus features call it as follows:

**Tasks** (`src/features/tasks/TasksContext.tsx`):

```typescript
import { updateStreak } from '../today-stats/streakStorage';
import { toLocalDate } from '../today-stats/dateUtils';

// inside completeTask, after incrementMonstersDefeated():
updateStreak(toLocalDate());
```

**Focus** (`src/features/focus/useTimer.ts`):

```typescript
import { updateStreak } from '../today-stats/streakStorage';
import { toLocalDate } from '../today-stats/dateUtils';

// inside the completion side-effect, after appendSession({ completed: true }):
updateStreak(toLocalDate());
```

The today-stats feature does not import from tasks or focus features beyond
their public storage functions (`loadTasksStore`, `getAllSessions`,
`getMonstersDefeated`).

### 9.2 `TodayPage` and `TasksProvider`

`TodayPage` must be mounted inside `TasksProvider` (defined in the tasks
spec). The app router is responsible for ensuring this nesting; `TodayPage`
does not create its own provider. This allows `TodayTaskList` to use
`TaskItem` unchanged, with full access to `TasksContext`.

### 9.3 Shared settings

`FocusGoalWidget` reads `getSetting('focusGoal') ?? 25` on mount and writes
`setSetting('focusGoal', newValue)` on change. It imports from `src/settings.ts`
only.

---

## 10. Costume engine additions

### 10.1 New CSS variable tokens

Add to `CSS_VAR_KEYS` in `src/costumes/types.ts` and to both costume packs:

| Token | haunted | classic |
|---|---|---|
| `--color-streak-lit` | `#ff6b35` (orange flame) | `#4a90d9` (blue) |
| `--color-streak-unlit` | `#2d1b4e` (dark purple) | `#e0e0e0` (grey) |
| `--color-bar-bg` | `#2d1b4e` | `#f0f0f0` |

The two chart colors (`--color-primary`, `--color-accent`) are already in the
existing token set.

### 10.2 New copy-pack keys

Add to `COPY_KEYS` in `src/costumes/types.ts` and to both costume packs. Keys
below are grouped by component; all values are examples.

**StreakDisplay**

| Key | haunted | classic |
|---|---|---|
| `streak.unit` | `"night"` | `"day"` |
| `streak.longestLabel` | `"Best haunt"` | `"Longest streak"` |

**DailyGreeting** (5 greetings; expand as needed)

| Key | haunted | classic |
|---|---|---|
| `today.greetings.count` | `"5"` | `"5"` |
| `today.greetings.0` | `"The spirits await your tasks…"` | `"Good morning! Let's get things done."` |
| `today.greetings.1` | `"Another day to defeat monsters."` | `"Ready to focus today?"` |
| `today.greetings.2` | `"Brew potions. Defeat evil. Repeat."` | `"Small steps make big progress."` |
| `today.greetings.3` | `"The haunted desk is ready."` | `"Your tasks are waiting."` |
| `today.greetings.4` | `"What lurks on today's list?"` | `"Make today count."` |

**FocusGoalWidget**

| Key | haunted | classic |
|---|---|---|
| `today.goalUnit` | `"min brewed"` | `"min focused"` |
| `today.goalLabel` | `"Daily potion goal"` | `"Daily focus goal"` |

**TodayTaskList / TodayPage**

| Key | haunted | classic |
|---|---|---|
| `today.heading` | `"Today's Hunt"` | `"Today"` |
| `today.emptyState` | `"No monsters lurk today."` | `"Nothing due today."` |

**WeekChart / StatsPage**

| Key | haunted | classic |
|---|---|---|
| `stats.heading` | `"The Haunted Ledger"` | `"Stats"` |
| `stats.weekHeading` | `"This week's carnage"` | `"This week"` |
| `stats.seriesTasksLabel` | `"Monsters defeated"` | `"Tasks completed"` |
| `stats.seriesFocusLabel` | `"Potions brewed (min)"` | `"Focus minutes"` |
| `stats.tasksUnit` | `"defeated"` | `"completed"` |
| `stats.focusUnit` | `"min"` | `"min"` |

**LifetimeCounters**

| Key | haunted | classic |
|---|---|---|
| `stats.monstersDefeated` | `"Monsters Defeated"` | `"Tasks Completed"` |
| `stats.lifetimeFocusMinutes` | `"Potions Brewed (min)"` | `"Focus Minutes"` |

### 10.3 Sound slots

No new sound slots. The today-stats feature produces no sounds of its own;
streak updates and task completion sounds are already handled by the tasks
and focus features.

---

## 11. Out of scope

- Streaks surviving a device/browser change (localStorage is per-browser).
- Push notifications or badge counts.
- Editing or deleting historical session records from this feature.
- Filtering the Stats chart by task category.
- Exporting stats data.
- Animated transitions on streak icons.
- Server-side aggregation or sync of any kind.
