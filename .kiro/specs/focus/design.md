# Design — Focus Feature

## 1. Goals and constraints

- No backend. All state lives in memory (React) and `localStorage`.
- Timing correctness when the tab is backgrounded: remaining time is always
  derived from wall-clock timestamps, never from a decremented counter.
- Every color and themed string comes from the costume engine. The feature
  imports nothing from `src/costumes/` directly.
- Vite + React + TypeScript, mobile-first at 360 px.

---

## 2. Timer state machine

The timer has six states. Transitions are driven by user actions and by the
countdown reaching zero.

```
                    start()
      ┌─────────────────────────────────────────────────────┐
      │                                                     ▼
  [ IDLE ] ◄──── reset() ──── [ RUNNING ] ──── pause() ──► [ PAUSED ]
      ▲                           │                            │
      │                      (focus = 0)                  resume()
      │                           ▼                            │
      │             [ COMPLETED ] ◄────────────────────────────┘
      │                   │
      │              startBreak()
      │                   ▼
      │           [ BREAK_RUNNING ] ──── pause() ──► [ BREAK_PAUSED ]
      │                   │                                    │
      │              (break = 0)                           resume()
      │                   │                                    │
      └───────────────────┴────────────────────────────────────┘
                   (break ends → IDLE)
```

### 2.1 State definitions

| State | Description |
|---|---|
| `idle` | No session in progress. Timer displays configured duration. |
| `running` | Focus countdown active. Progress indicator filling. |
| `paused` | Focus countdown frozen. Timestamps preserve remaining time. |
| `completed` | Focus countdown hit zero. Session written as complete. |
| `break_running` | Break countdown active. Progress indicator not shown. |
| `break_paused` | Break countdown frozen. |

### 2.2 Transition table

| From state | Action / trigger | To state | Side-effects |
|---|---|---|---|
| `idle` | `start()` | `running` | Generate session id; record `startedAt = Date.now()`; call `linkSession` if task bound; call `play('session-start')` |
| `running` | `pause()` | `paused` | Record `pausedAt = Date.now()` |
| `running` | focus countdown = 0 | `completed` | Add `totalPausedMs` for final computation; write session record (`completed: true`); call `unlinkSession` if task bound; call `play('session-end')` |
| `running` | `reset()` | `idle` | Write session record (`completed: false`); call `unlinkSession` if task bound; clear timing fields |
| `paused` | `resume()` | `running` | Accumulate `totalPausedMs += Date.now() - pausedAt`; clear `pausedAt` |
| `paused` | `reset()` | `idle` | Write session record (`completed: false`); call `unlinkSession` if task bound; clear timing fields |
| `completed` | `startBreak()` | `break_running` | Record `breakStartedAt = Date.now()` |
| `break_running` | `pause()` | `break_paused` | Record `breakPausedAt = Date.now()` |
| `break_running` | break countdown = 0 | `idle` | Clear all timing fields |
| `break_running` | `reset()` | `idle` | Clear all timing fields |
| `break_paused` | `resume()` | `break_running` | Accumulate `breakTotalPausedMs`; clear `breakPausedAt` |
| `break_paused` | `reset()` | `idle` | Clear all timing fields |

---

## 3. Timestamp-based timing

### 3.1 In-memory timer record

```typescript
interface TimerRecord {
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
```

`TimerRecord` is kept only in React state (`useReducer`). It is never written
to `localStorage` — the timer does not survive a page reload (by design;
reloading resets to idle).

### 3.2 Deriving remaining time

```typescript
function getRemainingMs(record: TimerRecord): number {
  const now = record.pausedAt
    ? new Date(record.pausedAt).getTime()
    : Date.now();
  const elapsed = now - new Date(record.startedAt).getTime() - record.totalPausedMs;
  return Math.max(0, record.plannedMs - elapsed);
}
```

This function is called from a 500 ms `setInterval` (or `requestAnimationFrame`
at the implementer's discretion). The result drives the displayed MM:SS and
the progress fraction.

### 3.3 Progress fraction

```typescript
function getFraction(record: TimerRecord): number {
  const elapsed = record.plannedMs - getRemainingMs(record);
  return Math.min(1, Math.max(0, elapsed / record.plannedMs));
}
```

`fraction` (0.0–1.0) is the single prop passed to both `PotionProgress` and
`RingProgress`.

### 3.4 Actual seconds for session record

When recording a completed or reset session:

```typescript
const actualSeconds = Math.round(
  (Date.now() - new Date(startedAt).getTime() - totalPausedMs) / 1000
);
```

---

## 4. Session data model

### 4.1 `SessionRecord`

```typescript
// src/features/focus/types.ts

export interface SessionRecord {
  /** UUID v4, generated at session start. */
  id: string;
  /** Task id from tasks feature, or null. */
  taskId: string | null;
  /** ISO 8601 datetime — when the focus phase began. */
  startedAt: string;
  /** Configured focus duration at session start. */
  plannedMinutes: number;
  /** Actual elapsed focus time in seconds (excluding pauses). */
  actualSeconds: number;
  /** True only when the focus countdown reached zero naturally. */
  completed: boolean;
}
```

### 4.2 `SessionsStore`

```typescript
// src/features/focus/storage.ts (types)

export interface SessionsStore {
  schemaVersion: number;   // current: 1
  sessions: SessionRecord[];
}
```

Serialised to `localStorage['spookydesk.sessions']`.

### 4.3 Storage module API

```typescript
// src/features/focus/storage.ts

export function loadSessionsStore(): SessionsStore;
export function saveSessionsStore(store: SessionsStore): void;
export function appendSession(record: SessionRecord): void;

/** Called by the stats feature to aggregate data. */
export function getAllSessions(): SessionRecord[];
export function getSessionsForTask(taskId: string): SessionRecord[];
```

`loadSessionsStore` wraps parse in `try/catch`; on failure returns
`{ schemaVersion: 1, sessions: [] }` and logs a `console.warn`.

### 4.4 Migration skeleton

```typescript
// src/features/focus/migrations.ts

export const CURRENT_SCHEMA_VERSION = 1;

type Migration = (raw: SessionsStore) => SessionsStore;
const MIGRATIONS: Record<number, Migration> = {};

export function migrate(raw: SessionsStore): SessionsStore {
  let store = raw;
  for (let v = store.schemaVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    if (MIGRATIONS[v]) store = MIGRATIONS[v](store);
  }
  return { ...store, schemaVersion: CURRENT_SCHEMA_VERSION };
}
```

---

## 5. Settings integration

The focus feature reads and writes two keys in the shared settings object at
`spookydesk.settings`. It calls the shared `getSetting` / `setSetting`
helpers (same pattern used by tasks for `tasksFilter`).

| Key | Type | Default |
|---|---|---|
| `focusDuration` | `number` (minutes, 1–120) | `25` |
| `breakDuration` | `number` (minutes, 1–60) | `5` |

Both keys must be added to the settings module's type definition and to any
settings migration that bumps `schemaVersion`.

---

## 6. Component breakdown

```
src/features/focus/
  types.ts
  storage.ts
  migrations.ts
  useTimer.ts              # reducer + tick logic (no JSX)
  TimerPage.tsx            # route/page wrapper
  components/
    TimerDisplay.tsx        # chooses PotionProgress vs RingProgress
    PotionProgress.tsx      # haunted: SVG bottle filling
    RingProgress.tsx        # classic: SVG circle stroke-dashoffset
    TimerControls.tsx       # Start / Pause / Resume / Reset / Start Break buttons
    TaskBinder.tsx          # task selector, visible only when idle
    TimerPage.module.css
    TimerDisplay.module.css
    PotionProgress.module.css
    RingProgress.module.css
    TimerControls.module.css
    TaskBinder.module.css
```

### 6.1 `useTimer` hook

The core logic hook. Returns:

```typescript
interface UseTimerReturn {
  state: TimerState;         // 'idle' | 'running' | 'paused' | 'completed' | 'break_running' | 'break_paused'
  remainingMs: number;
  fraction: number;          // 0..1 for progress visualisation
  boundTaskId: string | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  startBreak: () => void;
  bindTask: (id: string | null) => void;
}
```

Internally uses `useReducer` for state transitions and a `useEffect` for the
500 ms tick that recomputes `remainingMs` and `fraction` from `getRemainingMs`.
The `useEffect` also checks if remaining reaches zero and auto-dispatches the
completion transition.

`useTimer` is the only place that calls `play()` for session-start and
session-end sounds, and the only place that calls `linkSession` /
`unlinkSession` from `src/features/tasks/storage.ts`.

### 6.2 `TimerPage`

Page wrapper. Reads `focusDuration` and `breakDuration` from settings and
passes them to `useTimer`. Renders `TimerDisplay`, `TimerControls`, and
`TaskBinder` in a single-column layout. Applies no logic of its own.

### 6.3 `TimerDisplay`

Receives `fraction`, `remainingMs`, `state`, and `costumeId`. Renders:

- The MM:SS countdown as an `aria-live="polite"` region, updated at most once
  per second.
- Either `<PotionProgress fraction={fraction} />` or
  `<RingProgress fraction={fraction} />` based on `costumeId`.
- A heading via `t('focus.heading')`.

`costumeId` is read from `useCostume()` inside `TimerDisplay`; it is not
threaded down from `TimerPage`.

### 6.4 `PotionProgress`

Props: `{ fraction: number }`.

An SVG (or CSS clip-path) representation of a potion bottle. The fill level
is controlled by a CSS custom property `--fill-fraction` set as an inline
style (the only permitted use of inline style in this feature, since it carries
a dynamic numeric value, not a color). All colors use `var(--token)` in the
CSS module.

### 6.5 `RingProgress`

Props: `{ fraction: number }`.

An SVG circle with `stroke-dashoffset` controlled by `--fill-fraction`. Same
inline-style rule applies as for `PotionProgress`.

### 6.6 `TimerControls`

Receives `state`, `start`, `pause`, `resume`, `reset`, `startBreak` from
`useTimer` (via props or context). Renders only the buttons relevant to the
current state:

| State | Buttons shown |
|---|---|
| `idle` | Start |
| `running` | Pause, Reset |
| `paused` | Resume, Reset |
| `completed` | Start Break, Reset |
| `break_running` | Pause, Reset |
| `break_paused` | Resume, Reset |

Button labels come from `t()`. All buttons have `aria-label` attributes for
screen readers.

### 6.7 `TaskBinder`

Visible only when `state === 'idle'`. Reads `tasks` from `TasksContext`
(imported from the tasks feature's context). Filters to `status === 'active'`
tasks. Renders a `<select>` with an empty-option ("no task") plus one option
per active task. On change calls `bindTask(id)` from `useTimer`.

`TaskBinder` imports `TasksContext` from
`src/features/tasks/TasksContext.tsx`. This is the only permitted import the
focus feature takes from the tasks feature; it imports no storage or types
beyond what the context value exposes.

---

## 7. Integration points

### 7.1 Tasks feature

The focus feature calls two functions from `src/features/tasks/storage.ts`:

```typescript
import { linkSession, unlinkSession } from '../tasks/storage';
```

- `linkSession(taskId, sessionId)` — called in `useTimer` when transitioning
  from `idle` to `running` with a bound task.
- `unlinkSession(taskId)` — called on session completion or reset if a task
  was bound.

The tasks feature never imports from the focus feature.

### 7.2 Stats feature (future)

Stats calls `getAllSessions()` or reads `localStorage['spookydesk.sessions']`
directly. The contract is the `SessionRecord` interface in
`src/features/focus/types.ts`. Stats never writes to this store.

### 7.3 Costume engine

```typescript
const { costumeId, t, play } = useCostume();
```

- `t(key)` — all copy strings.
- `play(slot)` — `'session-start'` and `'session-end'` sound slots.
- `costumeId` — switches the progress visualisation component in
  `TimerDisplay`.

The focus feature imports nothing from `src/costumes/` directly.

### 7.4 Shared settings

```typescript
import { getSetting, setSetting } from '../../settings';
```

Reads `focusDuration` and `breakDuration` on mount. Writes on user change in
the settings UI (which lives outside this feature; the focus feature only
reads these values).

---

## 8. Copy-pack keys

All keys below must be added to `COPY_KEYS` in the costume engine's `types.ts`
and given values in both `haunted` and `classic` packs.

| Key | haunted | classic |
|---|---|---|
| `focus.heading` | `"Brew a Potion"` | `"Focus Session"` |
| `focus.startLabel` | `"Brew potion"` | `"Start focus"` |
| `focus.pauseLabel` | `"Pause brew"` | `"Pause"` |
| `focus.resumeLabel` | `"Resume brew"` | `"Resume"` |
| `focus.resetLabel` | `"Discard brew"` | `"Reset"` |
| `focus.startBreakLabel` | `"Take a haunted rest"` | `"Start break"` |
| `focus.completedMessage` | `"Potion complete! 🧪"` | `"Session complete!"` |
| `focus.breakHeading` | `"Rest in peace…"` | `"Break"` |
| `focus.taskBinderLabel` | `"Brew for monster"` | `"Focus on task"` |
| `focus.taskBinderNone` | `"No monster"` | `"No task"` |
| `focus.settingsFocusLabel` | `"Brew time (min)"` | `"Focus duration (min)"` |
| `focus.settingsBreakLabel` | `"Rest time (min)"` | `"Break duration (min)"` |
| `focus.sessionUnit` | `"brew"` | `"session"` |

---

## 9. Sound slots

Both slots are already declared in the costume engine's `SOUND_KEYS`. The
focus feature calls `play(slot)` only; it does not register slots itself.

| Slot | Trigger |
|---|---|
| `session-start` | `useTimer` transitions from `idle` to `running` |
| `session-end` | `useTimer` transitions from `running` to `completed` |

---

## 10. CSS tokens consumed

The focus feature uses only tokens defined in the costume engine's
`CSS_VAR_KEYS`. No new tokens are required beyond the base set already
consumed by the tasks feature, with one addition:

| Token | Usage |
|---|---|
| `--color-bg` | page background |
| `--color-surface` | timer card background |
| `--color-text` | countdown digits, labels |
| `--color-primary` | active/running ring or bottle fill |
| `--color-accent` | completed state highlight |
| `--color-muted` | paused state tint |
| `--radius-card` | timer card corners |
| `--shadow-card` | timer card elevation |

`--color-muted` must be added to `CSS_VAR_KEYS` and to both costume packs if
it is not already present.

---

## 11. File layout

```
src/
  features/
    focus/
      types.ts
      storage.ts
      migrations.ts
      useTimer.ts
      TimerPage.tsx
      components/
        TimerDisplay.tsx
        TimerDisplay.module.css
        PotionProgress.tsx
        PotionProgress.module.css
        RingProgress.tsx
        RingProgress.module.css
        TimerControls.tsx
        TimerControls.module.css
        TaskBinder.tsx
        TaskBinder.module.css
      TimerPage.module.css
```

---

## 12. Out of scope

- Timer state surviving a page reload (not persisted; reload resets to idle).
- Browser notifications on session completion.
- Multiple concurrent timers.
- Long-break logic (after N sessions).
- Editing or deleting session records from the focus UI.
- Any server-side persistence or sync.
