# Product Steering — SpookyDesk

## Product in one line

SpookyDesk is a productivity app (tasks + focus timer + daily planner) that
wears costumes: its whole look, copy and sound pack can be swapped with one
click. The default costume is a haunted Halloween desk.

## Product rules

- The app must be fully usable with zero sign-up and zero backend. All data
  lives in the browser (localStorage, versioned schema).
- Every visual element must go through the costume engine (CSS variables +
  copy pack + sound pack). No hard-coded colors or themed strings inside
  feature components.
- Core loop first: add task → focus on it → complete it → see progress.
  Stats and extras never block the core loop.
- English UI copy. Playful but never at the expense of clarity: a first-time
  user must understand every screen without instructions.
- Mobile-first responsive layout; the app must work well at 360 px width.

## Costumes at launch

| ID | Name | Character |
|---|---|---|
| `haunted` | Haunted Halloween (default) | Tasks are monsters to defeat; focus sessions brew potions; streaks light jack-o'-lanterns. |
| `classic` | Classic Clean | The same app in a calm, minimal office skin, proving the costume system works beyond Halloween. |

## Features and spec locations

| Feature | Spec folder | Description |
|---|---|---|
| Costume engine | `.kiro/specs/costume-engine` | CSS variable + copy + sound pack system; no dedicated view. |
| Tasks | `.kiro/specs/tasks` | Add, prioritize, schedule and complete tasks. |
| Focus timer | `.kiro/specs/focus` | Pomodoro-style countdown with pause/resume and break. |
| Today & Stats | `.kiro/specs/today-stats` | Daily planner, focus goal, streak, weekly chart. |

## Navigation views

The app has four named views, each mapped to a route:

| View | Page component | Route |
|---|---|---|
| Today | `TodayPage` | `/` |
| Tasks | `TasksPage` | `/tasks` |
| Focus | `TimerPage` | `/focus` |
| Stats | `StatsPage` | `/stats` |

## localStorage data contract

All persistence is in localStorage. These are the four store keys shared
across features. Each store is a JSON object with a `schemaVersion` field;
migrations run on load.

| Key | Owner feature | Shape |
|---|---|---|
| `spookydesk.settings` | Shared (settings.ts) | `{ schemaVersion, costumeId, tasksFilter, focusDuration, breakDuration, focusGoal }` |
| `spookydesk.tasks` | Tasks | `{ schemaVersion, tasks[], monstersDefeated }` |
| `spookydesk.sessions` | Focus | `{ schemaVersion, sessions[] }` |
| `spookydesk.streak` | Today-Stats | `{ schemaVersion, lastActiveDate, currentStreak, longestStreak }` |

Features read and write their own store only. Cross-feature reads (e.g. Stats
reading tasks) go through the owning feature's storage module, not by parsing
raw localStorage directly.
