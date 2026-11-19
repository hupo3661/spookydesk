# Requirements — Tasks Feature

EARS-style requirements (Easy Approach to Requirements Syntax).  
Each requirement is numbered `REQ-T-<n>` and followed by its acceptance
criteria (AC-T-<n>.<m>).

---

## REQ-T-1 — Create a task

**While** the task list is visible, **the system shall** allow the user to
create a new task by entering a title.

**AC-T-1.1** — Submitting the add-task form with a non-empty title creates
a task and appends it to the list immediately without a page reload.  
**AC-T-1.2** — The add-task input renders the copy-pack string
`tasks.addPlaceholder` as its placeholder; no hard-coded string appears.  
**AC-T-1.3** — Submitting a blank or whitespace-only title is rejected; an
inline error message is shown using `tasks.errorEmptyTitle` from the copy
pack.  
**AC-T-1.4** — After successful submission the input is cleared and focused
so the user can add another task without an extra click.  
**AC-T-1.5** — Each newly created task is assigned a stable `id` (UUID v4)
that never changes after creation.

---

## REQ-T-2 — Task fields

**When** a task is created or edited, **the system shall** persist a title,
priority, optional due date, and optional category.

**AC-T-2.1** — Priority has exactly three levels: `low`, `medium`, `high`.
The haunted costume maps these to monster ranks via `tasks.priority.low`,
`tasks.priority.medium`, `tasks.priority.high` in the copy pack.  
**AC-T-2.2** — The due-date field accepts a calendar date (year-month-day);
no time component is stored or displayed.  
**AC-T-2.3** — Category is a free-text string capped at 32 characters; it
may be empty.  
**AC-T-2.4** — All three optional fields are genuinely optional; a task with
only a title is valid and saveable.  
**AC-T-2.5** — Field labels (priority name, due-date label, category label)
come from the copy pack; no hard-coded label text appears in component code.

---

## REQ-T-3 — Edit a task

**When** the user activates the edit action on an existing task, **the
system shall** open an edit form pre-populated with the task's current
values.

**AC-T-3.1** — All four fields (title, priority, due date, category) are
editable in the edit form.  
**AC-T-3.2** — Saving valid edits updates the task in-place and persists the
change to localStorage immediately.  
**AC-T-3.3** — Cancelling discards all changes and leaves the stored task
unchanged.  
**AC-T-3.4** — The edit action is accessible via keyboard (Enter/Space on
the edit trigger) and not only via pointer.

---

## REQ-T-4 — Delete a task

**When** the user activates the delete action on a task, **the system
shall** remove the task permanently after a confirmation step.

**AC-T-4.1** — A confirmation step (inline or modal) using
`tasks.deleteConfirm` from the copy pack precedes deletion to prevent
accidental loss.  
**AC-T-4.2** — Confirmed deletion removes the task from the list and from
localStorage immediately.  
**AC-T-4.3** — Deleting a completed task does not decrement the
`stats.monstersDefeated` counter; defeated monsters stay defeated.

---

## REQ-T-5 — Complete a task

**When** the user marks a task as complete, **the system shall** mark it
done, trigger the completion animation hook, and increment the lifetime
monsters-defeated counter.

**AC-T-5.1** — Completing a task sets its `completedAt` timestamp (ISO
8601) and its `status` to `'done'`.  
**AC-T-5.2** — Immediately on completion, the component fires a CSS-class
animation hook (`data-completing="true"` on the task element, or equivalent)
so a CSS animation can play; the specific animation is defined per-costume in
CSS, not in component logic.  
**AC-T-5.3** — Completing a task plays the `task-complete` sound slot via
`play()`.  
**AC-T-5.4** — `stats.monstersDefeated` in localStorage is incremented by 1
each time a task is completed; it never decrements (un-completing a task does
not decrement it).  
**AC-T-5.5** — The complete action is accessible via keyboard and not only
via pointer.  
**AC-T-5.6** — A task that is already `'done'` does not fire the animation
or increment the counter a second time if its completion state is toggled
back and forth.  
**AC-T-5.7** — The complete-action label comes from `tasks.completeLabel` in
the copy pack.

---

## REQ-T-6 — Filter the task list

**The system shall** provide three filter views: today, all, and completed.

**AC-T-6.1** — The *today* filter shows tasks whose due date equals today's
local date, plus tasks with no due date that are not done.  
**AC-T-6.2** — The *all* filter shows every task that is not `'done'`.  
**AC-T-6.3** — The *completed* filter shows every task with `status ===
'done'`, in reverse-chronological order of `completedAt`.  
**AC-T-6.4** — Filter tab labels come from the copy pack
(`tasks.filter.today`, `tasks.filter.all`, `tasks.filter.completed`); no
hard-coded tab text appears.  
**AC-T-6.5** — The active filter is persisted in
`spookydesk.settings.tasksFilter` so it survives a page reload.  
**AC-T-6.6** — When the filtered list is empty, an empty-state message from
the copy pack (`tasks.emptyState.<filterKey>`) is displayed.

---

## REQ-T-7 — Persistence and schema versioning

**The system shall** store all task data in localStorage under the key
`spookydesk.tasks` using a versioned schema, and shall include a migration
skeleton that runs on startup.

**AC-T-7.1** — The persisted object has a top-level `schemaVersion: number`
field.  
**AC-T-7.2** — On startup, the storage module reads `schemaVersion` and runs
any registered migration functions for versions between the stored version
and the current version.  
**AC-T-7.3** — If the stored data is absent, corrupted, or unparseable, the
storage module returns an empty task list and logs a warning; it does not
throw.  
**AC-T-7.4** — Write operations are synchronous and use
`localStorage.setItem` directly; no debouncing is required at this scale.

---

## REQ-T-8 — Costume engine compliance

**The system shall** derive all colors and all themed strings from the
costume engine; no hard-coded hex values, `rgb()` literals, or themed copy
strings shall appear in task feature files.

**AC-T-8.1** — Every color-bearing CSS rule in task feature stylesheets uses
a `var(--<token>)` reference defined in the costume engine's CSS variable
pack.  
**AC-T-8.2** — Every user-visible string in task components is retrieved via
`t('<key>')` from `useCostume`; no string literals that vary between costumes
appear in JSX.  
**AC-T-8.3** — Switching the active costume while the task list is visible
updates all copy strings and colors without a page reload.  
**AC-T-8.4** — The tasks feature registers no new CSS variables of its own;
it consumes only tokens already defined in the costume engine variable pack.

---

## REQ-T-9 — Focus session linkage

**When** a focus session references a task, **the system shall** store that
reference on the task record and expose it for the timer feature to read.

**AC-T-9.1** — Each task has an optional `linkedSessionId: string | null`
field that the timer feature may write to.  
**AC-T-9.2** — The tasks storage module exposes a
`linkSession(taskId, sessionId)` function and an `unlinkSession(taskId)`
function for the timer feature to call; the tasks feature itself never
initiates a link.  
**AC-T-9.3** — The task list UI shows a visual indicator (using a CSS
variable token and copy-pack string `tasks.linkedIndicator`) when a task has
an active linked session, but does not display timer state or controls.

---

## REQ-T-10 — Stats counter surface

**The system shall** make the lifetime monsters-defeated count readable by
the Stats feature without coupling Stats to task internals.

**AC-T-10.1** — The tasks storage module exports a
`getMonstersDefeated(): number` function that returns the current counter
value from localStorage.  
**AC-T-10.2** — The counter is stored at a stable path
(`spookydesk.tasks.monstersDefeated`) that the Stats feature may read
directly as a fallback if the function is unavailable.

---

## REQ-T-11 — Accessibility and responsive layout

**The system shall** meet minimum accessibility and layout requirements.

**AC-T-11.1** — The task list is keyboard-navigable: add, complete, edit,
and delete are all reachable and operable without a pointer device.  
**AC-T-11.2** — All interactive controls have accessible labels (via
`aria-label` or visible text); icon-only buttons include `aria-label` from
the copy pack.  
**AC-T-11.3** — The task list layout is usable at 360px viewport width with
no horizontal scrollbar.  
**AC-T-11.4** — Priority levels are communicated by more than color alone
(text label or icon) so the distinction is perceivable without color vision.
