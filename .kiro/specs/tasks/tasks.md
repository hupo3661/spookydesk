# Implementation Tasks — Tasks Feature

Numbered checkbox list in dependency order. Each task is independently
implementable once its listed dependencies are done. All work is in
`src/features/tasks/` unless a path is stated explicitly.

---

## Prerequisite: costume engine tokens

- [ ] **0.1** Add `--color-priority-low`, `--color-priority-medium`, and
  `--color-priority-high` to `CSS_VAR_KEYS` in
  `src/costumes/types.ts` and supply values for both the `haunted` and
  `classic` packs.  
  *Depends on: nothing (costume engine already exists).*

- [ ] **0.2** Add all `tasks.*` copy-pack keys listed in design §6.2 to
  `COPY_KEYS` in `src/costumes/types.ts` and supply haunted/classic strings
  for both packs.  
  *Depends on: 0.1.*

---

## Layer 1: types and storage (no React)

- [ ] **1.1** Create `types.ts` — export `TaskPriority`, `TaskStatus`,
  `Task`, `TaskFilter`, `NewTaskDraft`.  
  *Depends on: nothing.*

- [ ] **1.2** Create `migrations.ts` — export `CURRENT_SCHEMA_VERSION = 1`
  and `migrate(raw: TasksStore): TasksStore` with the empty migrations map
  and version-loop logic.  
  *Depends on: 1.1.*

- [ ] **1.3** Create `storage.ts` — implement `loadTasksStore` (with
  try/catch fallback to `DEFAULT_STORE` and call to `migrate`),
  `saveTasksStore`, `getTask`, `putTask`, `removeTask`,
  `linkSession`, `unlinkSession`, `getMonstersDefeated`, and
  `incrementMonstersDefeated`.  
  *Depends on: 1.1, 1.2.*

---

## Layer 2: React context

- [ ] **2.1** Create `TasksContext.tsx` — implement `TasksContextValue`
  interface, `TasksProvider` (hydrates from `loadTasksStore` on mount, holds
  store in `useState`, derives `filteredTasks` inline), and `useTasksContext`
  hook that throws if used outside the provider.  
  Implement all mutations: `addTask` (generates UUID v4 and timestamps),
  `updateTask`, `deleteTask`, `completeTask` (guards double-completion, calls
  `incrementMonstersDefeated`).  
  Implement `filter` state initialised from `getSetting('tasksFilter')`
  defaulting to `'all'`; `setFilter` persists via `setSetting`.  
  *Depends on: 1.3.*

---

## Layer 3: leaf components (no context dependency)

- [ ] **3.1** Create `components/PriorityBadge.tsx` and style — renders
  `t('tasks.priority.<level>')` in a `<span>` with a CSS class; uses
  `var(--color-priority-<level>)` for the badge color; no color is
  communicated by color alone (text label is always visible).  
  *Depends on: 1.1, 0.1, 0.2.*

- [ ] **3.2** Create `components/LinkedSessionBadge.tsx` — renders
  `t('tasks.linkedIndicator')` in a small `<span>` when
  `linkedSessionId !== null`; invisible otherwise.  
  *Depends on: 0.2.*

- [ ] **3.3** Create `components/EmptyState.tsx` — accepts
  `filter: TaskFilter` and renders the matching `tasks.emptyState.<filter>`
  copy-pack string.  
  *Depends on: 1.1, 0.2.*

---

## Layer 4: form and modal components

- [ ] **4.1** Create `components/FilterTabs.tsx` and style — three buttons
  labelled via copy pack; active tab marked with `aria-current="true"` and a
  CSS class using `var(--color-primary)`; calls `setFilter` from context on
  click.  
  *Depends on: 2.1, 0.2.*

- [ ] **4.2** Create `components/AddTaskForm.tsx` and style — controlled
  title input (placeholder from copy pack), priority select (default
  `medium`), optional due-date input, optional category input (max 32 chars).
  On valid submit: calls `addTask(draft)`, clears and refocuses title input,
  calls `play('task-add')`. Shows inline error from `tasks.errorEmptyTitle`
  on empty submit.  
  *Depends on: 2.1, 0.2.*

- [ ] **4.3** Create `components/EditTaskModal.tsx` and style — `role="dialog"`
  with focus trap; initialises fields from the task prop; Save calls
  `updateTask(id, patch)` and closes; Cancel closes without saving; all
  labels from copy pack. Keyboard-accessible (Escape to cancel).  
  *Depends on: 2.1, 3.1, 0.2.*

---

## Layer 5: list and item components

- [ ] **5.1** Create `components/TaskItem.tsx` and style — renders title,
  `PriorityBadge`, optional due-date chip (label from `tasks.dueDateLabel`),
  optional category chip (label from `tasks.categoryLabel`), and
  `LinkedSessionBadge`. Complete button calls `completeTask(id)` then sets
  `data-completing="true"` on the root element via local state (cleared on
  `animationend`), then calls `play('task-complete')`. Edit button opens
  `EditTaskModal`. Delete button shows inline confirmation (second click
  confirms via local state), then calls `deleteTask(id)`. All buttons have
  `aria-label` from copy pack.  
  *Depends on: 2.1, 3.1, 3.2, 4.3, 0.2.*

- [ ] **5.2** Create `components/TaskList.tsx` — reads `filteredTasks` from
  context; renders `TaskItem` per task or `EmptyState` when empty; no local
  state.  
  *Depends on: 2.1, 3.3, 5.1.*

---

## Layer 6: page and routing

- [ ] **6.1** Create `TasksPage.tsx` — wraps content in `TasksProvider`;
  renders `FilterTabs`, `AddTaskForm`, and `TaskList` in a single-column
  layout; CSS ensures usability at 360 px with no horizontal overflow.  
  *Depends on: 2.1, 4.1, 4.2, 5.2.*

- [ ] **6.2** Register `TasksPage` in the app router/navigation so it is
  reachable from the main nav (exact route TBD by the app shell spec).  
  *Depends on: 6.1.*

---

## Layer 7: CSS — completion animation

- [ ] **7.1** Add a `@keyframes` animation for task completion in
  `TaskItem.module.css` that plays when `[data-completing="true"]` is set.
  The haunted costume animation should feel like defeating a monster (e.g.
  shake + fade); the classic costume uses a simple fade-out. Both are
  achieved with the same keyframes name; visual difference comes from CSS
  variable tokens (color, timing), not separate animation definitions.  
  *Depends on: 5.1, 0.1.*

---

## Layer 8: verification

- [ ] **8.1** Manually verify: add three tasks with different priorities,
  filter to Today (set one due today), complete one task, check
  `localStorage['spookydesk.tasks']` for correct `monstersDefeated`
  increment and `completedAt` timestamp.

- [ ] **8.2** Manually verify: switch costume while task list is visible and
  confirm all labels, priority names, and filter tabs update without reload.

- [ ] **8.3** Manually verify: keyboard-only walkthrough — add a task, complete
  it, edit it, delete it, change filter — all without touching the pointer.

- [ ] **8.4** Manually verify: resize browser to 360 px width; confirm no
  horizontal scrollbar appears and all controls remain usable.

- [ ] **8.5** Run `tsc --noEmit` and confirm zero type errors in the tasks
  feature files.
