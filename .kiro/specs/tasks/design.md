# Design — Tasks Feature

## 1. Goals and constraints

- No backend. All data lives in `localStorage` under `spookydesk.tasks`.
- Every color and themed string comes from the costume engine; the tasks
  feature never owns theme tokens.
- The timer and stats features are separate; this design defines only the
  contracts they consume.
- Vite + React + TypeScript, mobile-first at 360 px.

---

## 2. Data model

### 2.1 Core types

```typescript
// src/features/tasks/types.ts

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus   = 'active' | 'done';

export interface Task {
  /** UUID v4, assigned at creation, never mutated. */
  id: string;
  title: string;
  priority: TaskPriority;
  /** ISO 8601 date string — YYYY-MM-DD only, no time component. */
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
```

### 2.2 Persisted store

```typescript
// src/features/tasks/storage.ts (types)

export interface TasksStore {
  schemaVersion: number;      // current: 1
  tasks: Task[];
  /** Lifetime count; never decremented. */
  monstersDefeated: number;
}
```

`TasksStore` is serialised to JSON and written to
`localStorage['spookydesk.tasks']`.

### 2.3 Filter type

```typescript
// src/features/tasks/types.ts

export type TaskFilter = 'today' | 'all' | 'completed';
```

The active filter is persisted inside the shared settings object at
`spookydesk.settings.tasksFilter: TaskFilter` (the costume-engine settings
module owns that object; the tasks feature calls the shared `getSetting` /
`setSetting` helpers to read and write this single key).

---

## 3. Storage and migration

### 3.1 Module API

```typescript
// src/features/tasks/storage.ts

/** Load and migrate store from localStorage; returns default if absent/corrupt. */
export function loadTasksStore(): TasksStore;

/** Persist the full store. Synchronous. */
export function saveTasksStore(store: TasksStore): void;

/** Convenience read of a single task by id. */
export function getTask(id: string): Task | undefined;

/** Create, replace, or delete a task; returns the updated store. */
export function putTask(task: Task): TasksStore;
export function removeTask(id: string): TasksStore;

/** Set/clear the focus-session link on a task. Called by the timer feature. */
export function linkSession(taskId: string, sessionId: string): void;
export function unlinkSession(taskId: string): void;

/** Read the lifetime counter. Called by the stats feature. */
export function getMonstersDefeated(): number;

/** Increment the counter by 1. Called only by task completion logic. */
export function incrementMonstersDefeated(): void;
```

### 3.2 Migration skeleton

```typescript
// src/features/tasks/migrations.ts

type Migration = (raw: TasksStore) => TasksStore;

const MIGRATIONS: Record<number, Migration> = {
  // version 1 → 2 example (not yet needed):
  // 2: (store) => ({ ...store, tasks: store.tasks.map(addNewField) }),
};

export const CURRENT_SCHEMA_VERSION = 1;

export function migrate(raw: TasksStore): TasksStore {
  let store = raw;
  for (let v = store.schemaVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    if (MIGRATIONS[v]) store = MIGRATIONS[v](store);
  }
  return { ...store, schemaVersion: CURRENT_SCHEMA_VERSION };
}
```

`loadTasksStore` calls `migrate` on every startup. Adding a migration means
adding an entry to `MIGRATIONS` and bumping `CURRENT_SCHEMA_VERSION`.

### 3.3 Failure handling

`loadTasksStore` wraps the full read-and-parse cycle in a `try/catch`. On
any error it logs a `console.warn` and returns an empty default store:

```typescript
const DEFAULT_STORE: TasksStore = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  tasks: [],
  monstersDefeated: 0,
};
```

---

## 4. State management

Tasks state lives in a React context so any component in the tree can read
the list and dispatch mutations without prop drilling.

```typescript
// src/features/tasks/TasksContext.tsx

interface TasksContextValue {
  tasks: Task[];
  monstersDefeated: number;
  addTask: (draft: NewTaskDraft) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  filter: TaskFilter;
  setFilter: (f: TaskFilter) => void;
  filteredTasks: Task[];
}

type NewTaskDraft = Pick<Task, 'title' | 'priority' | 'dueDate' | 'category'>;
```

`TasksProvider` holds `store` in `useState`, hydrated from `loadTasksStore()`
on mount. Every mutating action produces a new `TasksStore` object, calls
`saveTasksStore`, then calls the state setter. `filteredTasks` is derived
in-render (no additional memo needed at this list size).

`completeTask` specifically:
1. Guards against double-completion.
2. Sets `completedAt` and `status: 'done'`.
3. Calls `incrementMonstersDefeated()`.
4. Updates state.

The animation and sound side-effects happen in the `TaskItem` component
(described below), not in the context, to keep context logic pure.

---

## 5. Component breakdown

```
src/features/tasks/
  types.ts
  storage.ts
  migrations.ts
  TasksContext.tsx
  TasksPage.tsx          # route/page wrapper
  components/
    TaskList.tsx          # renders filteredTasks, owns the list container
    TaskItem.tsx          # single task row: complete, edit trigger, delete trigger
    AddTaskForm.tsx       # inline add form at top of list
    EditTaskModal.tsx     # modal/drawer for editing all four fields
    FilterTabs.tsx        # today / all / completed tab bar
    EmptyState.tsx        # empty-list message, costume-aware
    PriorityBadge.tsx     # pill/icon showing priority level
    LinkedSessionBadge.tsx # indicator when linkedSessionId is set
```

### 5.1 `TasksPage`

Wraps content in `TasksProvider`. Renders `FilterTabs`, `AddTaskForm`, and
`TaskList` in a single-column layout. Passes no props downward beyond what
React context provides.

### 5.2 `TaskList`

Consumes `filteredTasks` from context. Renders `TaskItem` per task or
`EmptyState` when the list is empty. No local state.

### 5.3 `TaskItem`

- Renders title, `PriorityBadge`, optional due-date chip, optional category
  chip, and `LinkedSessionBadge`.
- Complete button: on click, calls `completeTask(id)` from context, then
  sets `data-completing="true"` on its own root element (via a local state
  flag cleared after `animationend`), then calls `play('task-complete')`.
- Edit button: opens `EditTaskModal` with this task's data.
- Delete button: shows an inline confirmation (second click confirms); on
  confirm calls `deleteTask(id)`.
- Priority levels are shown as text label from the copy pack *and* a CSS
  class; color differentiation uses `var(--color-priority-<level>)` tokens.

### 5.4 `AddTaskForm`

- Controlled input for title; selects for priority (default `medium`) and
  category; date input for due date.
- On submit: validates title non-empty, calls `addTask(draft)`, clears and
  refocuses the title input.
- Plays `play('task-add')` on successful add.

### 5.5 `EditTaskModal`

- Modal dialog (`role="dialog"`, focus-trapped).
- Initialised from the task passed as prop.
- Save calls `updateTask(id, patch)` and closes.
- Cancel closes without saving.

### 5.6 `FilterTabs`

- Three buttons. Active tab indicated by `aria-current="true"` and a CSS
  class using `var(--color-primary)`.
- Labels via `t('tasks.filter.today')` etc.
- On click calls `setFilter(f)` from context.

### 5.7 `PriorityBadge`

- Accepts `priority: TaskPriority`.
- Renders copy-pack label (`t('tasks.priority.<level>')`) in a `<span>` with
  a CSS class. No inline color styles.

### 5.8 `EmptyState`

- Accepts current filter. Renders `t('tasks.emptyState.<filter>')`.

---

## 6. Costume engine interactions

### 6.1 CSS variables consumed

The tasks feature uses only tokens already declared in the costume engine
variable pack. The list below is informational (the engine owns the
definitions):

| Token | Usage |
|---|---|
| `--color-bg` | page background |
| `--color-surface` | task card background |
| `--color-text` | primary text |
| `--color-primary` | active filter tab, focus ring |
| `--color-accent` | complete button, done state tint |
| `--radius-card` | task card corners |
| `--shadow-card` | task card elevation |

Priority differentiation uses three tokens the costume engine must define:
`--color-priority-low`, `--color-priority-medium`, `--color-priority-high`.
These should be added to the engine's `CSS_VAR_KEYS` array and given values
in both `haunted` and `classic` packs before the tasks feature is built.

### 6.2 Copy-pack keys consumed

All keys below must be added to `COPY_KEYS` in the engine's `types.ts` and
given values in both costume packs.

| Key | haunted | classic |
|---|---|---|
| `tasks.addPlaceholder` | `"Summon a new monster…"` | `"Add a task…"` |
| `tasks.errorEmptyTitle` | `"Every monster needs a name."` | `"Title is required."` |
| `tasks.completeLabel` | `"Defeat!"` | `"Done"` |
| `tasks.deleteLabel` | `"Banish"` | `"Delete"` |
| `tasks.deleteConfirm` | `"Banish forever?"` | `"Delete for ever?"` |
| `tasks.editLabel` | `"Inspect"` | `"Edit"` |
| `tasks.priority.low` | `"Minion"` | `"Low"` |
| `tasks.priority.medium` | `"Ghoul"` | `"Medium"` |
| `tasks.priority.high` | `"Boss"` | `"High"` |
| `tasks.filter.today` | `"Today's Hunt"` | `"Today"` |
| `tasks.filter.all` | `"All Monsters"` | `"All"` |
| `tasks.filter.completed` | `"Defeated"` | `"Done"` |
| `tasks.emptyState.today` | `"No monsters lurk today."` | `"Nothing due today."` |
| `tasks.emptyState.all` | `"Your desk is hauntingly clear."` | `"No tasks yet."` |
| `tasks.emptyState.completed` | `"No monsters have been defeated yet."` | `"Nothing completed yet."` |
| `tasks.linkedIndicator` | `"Brewing…"` | `"In focus"` |
| `tasks.dueDateLabel` | `"Haunts on"` | `"Due"` |
| `tasks.categoryLabel` | `"Coven"` | `"Category"` |
| `tasks.saveLabel` | `"Save"` | `"Save"` |
| `tasks.cancelLabel` | `"Retreat"` | `"Cancel"` |

### 6.3 Sound slots consumed

| Slot | trigger |
|---|---|
| `task-complete` | user completes a task |
| `task-add` | user creates a task |

Both slots are already declared in the engine's `SOUND_KEYS`. The tasks
feature calls `play(slot)` via `useCostume()`.

---

## 7. Cross-feature contracts

### 7.1 Timer feature (future)

The timer feature may call `linkSession(taskId, sessionId)` and
`unlinkSession(taskId)` from `src/features/tasks/storage.ts`. It never reads
the full `TasksStore`; it only sets and clears the foreign-key field.

The tasks feature never imports from the timer feature.

### 7.2 Stats feature (future)

Stats calls `getMonstersDefeated()` from `src/features/tasks/storage.ts`, or
reads `localStorage['spookydesk.tasks']` and parses `.monstersDefeated`
directly as a fallback. No other task internals are exposed to Stats.

### 7.3 Daily planner feature (future)

The planner may read `filteredTasks` from the shared `TasksContext` (if it
mounts inside `TasksProvider`) or call `loadTasksStore().tasks` directly and
filter by `dueDate`. The contract is the `Task` interface in
`src/features/tasks/types.ts`.

---

## 8. File layout

```
src/
  features/
    tasks/
      types.ts
      storage.ts
      migrations.ts
      TasksContext.tsx
      TasksPage.tsx
      components/
        TaskList.tsx
        TaskItem.tsx
        TaskItem.module.css
        AddTaskForm.tsx
        AddTaskForm.module.css
        EditTaskModal.tsx
        EditTaskModal.module.css
        FilterTabs.tsx
        FilterTabs.module.css
        EmptyState.tsx
        PriorityBadge.tsx
        LinkedSessionBadge.tsx
```

CSS Modules are used for component-scoped styles. All CSS files use
`var(--<token>)` references only.

---

## 9. Out of scope

- Drag-to-reorder tasks (future enhancement).
- Subtasks or task dependencies.
- Recurring tasks.
- Notifications or reminders.
- Any server-side sync.
- The focus timer UI and session management (timer feature owns those).
- Weekly stats charts (stats feature owns those).
