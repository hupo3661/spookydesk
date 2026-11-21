# Tasks — Focus Feature

Numbered checkbox list in dependency order. Complete each task before starting
the next unless noted as parallelisable (★).

---

## Group 1 — Foundation

- [x] 1. **Define `SessionRecord` and related types**
  - Create `src/features/focus/types.ts`.
  - Export `TimerState` union (`'idle' | 'running' | 'paused' | 'completed' | 'break_running' | 'break_paused'`).
  - Export `SessionRecord` interface (fields: `id`, `taskId`, `startedAt`, `plannedMinutes`, `actualSeconds`, `completed`).
  - Export `SessionsStore` interface (`schemaVersion: number`, `sessions: SessionRecord[]`).
  - Export `TimerRecord` interface (`phase`, `startedAt`, `pausedAt`, `totalPausedMs`, `plannedMs`).
  - _Depends on: nothing._

- [x] 2. **Implement session storage module**
  - Create `src/features/focus/storage.ts`.
  - Implement `loadSessionsStore(): SessionsStore` — parse `localStorage['spookydesk.sessions']`; on missing key return `{ schemaVersion: 1, sessions: [] }`; on corrupt JSON log `console.warn` and return the same empty store.
  - Implement `saveSessionsStore(store: SessionsStore): void` — serialize and write; swallow errors with `console.warn`.
  - Implement `appendSession(record: SessionRecord): void` — load, push, save.
  - Implement `getAllSessions(): SessionRecord[]` — load and return `.sessions`.
  - Implement `getSessionsForTask(taskId: string): SessionRecord[]` — filter by `taskId`.
  - _Depends on: task 1._

- [x] 3. **Implement schema migration skeleton**
  - Create `src/features/focus/migrations.ts`.
  - Export `CURRENT_SCHEMA_VERSION = 1`.
  - Export `migrate(raw: SessionsStore): SessionsStore` — iterates from `raw.schemaVersion + 1` to `CURRENT_SCHEMA_VERSION`, applying registered migrations; stamps final `schemaVersion`.
  - Wire `migrate` into `loadSessionsStore` so the result is always at the current schema before the caller sees it.
  - _Depends on: task 2._

- [x] 4. ★ **Add focus settings keys**
  - In the shared settings module (`src/settings/`), add `focusDuration: number` (default `25`) and `breakDuration: number` (default `5`) to the settings type and the defaults object.
  - Add both keys to any existing settings schema migration if `schemaVersion` must bump.
  - _Depends on: nothing (parallelisable with tasks 1–3)._

- [x] 5. ★ **Register copy-pack keys and sound slots**
  - Add all 13 `focus.*` keys from Design §8 to `COPY_KEYS` in the costume engine's types file.
  - Add the string values for both `haunted` and `classic` packs.
  - Confirm `session-start` and `session-end` sound slots are declared in `SOUND_KEYS`; add them if absent.
  - Add `--color-muted` to `CSS_VAR_KEYS` and both costume packs if not already present.
  - _Depends on: nothing (parallelisable with tasks 1–4)._

---

## Group 2 — Timer logic

- [x] 6. **Implement timestamp helpers**
  - In `src/features/focus/useTimer.ts` (module scope, not exported), implement:
    - `getRemainingMs(record: TimerRecord): number` — formula from Design §3.2.
    - `getFraction(record: TimerRecord): number` — formula from Design §3.3.
    - `computeActualSeconds(startedAt: string, totalPausedMs: number): number` — formula from Design §3.4.
  - _Depends on: task 1._

- [x] 7. **Implement timer reducer**
  - Still in `src/features/focus/useTimer.ts`, define the `TimerAction` discriminated union covering: `START`, `PAUSE`, `RESUME`, `RESET`, `START_BREAK`, `TICK`, `FOCUS_COMPLETE`, `BREAK_COMPLETE`.
  - Define `TimerReducerState` (wraps `TimerState`, active `TimerRecord | null`, `boundTaskId`, `sessionId | null`, `startedAt | null`, `totalPausedMs`, `plannedMinutes`).
  - Implement `timerReducer` applying the full state-machine transition table from Design §2.2 (all twelve rows).
    - On `START`: generate a UUID v4 session id; set `startedAt = new Date().toISOString()`; set `plannedMs` from settings.
    - On `PAUSE` / `RESUME`: record / accumulate timestamps.
    - On `FOCUS_COMPLETE`: write session record via `appendSession` with `completed: true`.
    - On `RESET`: write session record via `appendSession` with `completed: false` (only if a session was started).
    - On `BREAK_COMPLETE` / `RESET` from break states: return to `idle`, clear all timing fields.
  - _Depends on: tasks 2, 6._

- [x] 8. **Implement `useTimer` hook**
  - Export `useTimer(focusDuration: number, breakDuration: number): UseTimerReturn` from `src/features/focus/useTimer.ts`.
  - Use `useReducer(timerReducer, initialState)` for state.
  - In a `useEffect`, start a 500 ms `setInterval` that dispatches `TICK` when `state` is `running` or `break_running`, and dispatches `FOCUS_COMPLETE` or `BREAK_COMPLETE` when `getRemainingMs` returns 0.
  - Clear the interval when `state` leaves a running state; clean up on unmount.
  - Expose `remainingMs` and `fraction` as derived values computed on every render from the reducer state (not stored separately).
  - Call `play('session-start')` via `useCostume` when transitioning into `running` from `idle`; call `play('session-end')` when dispatching `FOCUS_COMPLETE`.
  - Call `linkSession(taskId, sessionId)` from tasks storage on `START` if `boundTaskId` is set; call `unlinkSession(taskId)` on `FOCUS_COMPLETE` and `RESET` if `boundTaskId` was set.
  - Return the `UseTimerReturn` shape defined in Design §6.1.
  - _Depends on: tasks 4, 5, 7._

---

## Group 3 — Progress visuals

- [x] 9. **Implement `PotionProgress` component**
  - Create `src/features/focus/components/PotionProgress.tsx` and `PotionProgress.module.css`.
  - Props: `{ fraction: number }`.
  - Render an SVG (or CSS clip-path) potion bottle. The fill level is driven by `--fill-fraction` set as an inline style on the root element (the only permitted inline style in the feature). Fraction 0 = empty, 1 = full.
  - All colors reference `var(--token)` exclusively. Zero hex literals in the file.
  - _Depends on: task 5 (tokens available)._

- [x] 10. **Implement `RingProgress` component**
  - Create `src/features/focus/components/RingProgress.tsx` and `RingProgress.module.css`.
  - Props: `{ fraction: number }`.
  - Render an SVG circle. Control fill via `stroke-dashoffset` derived from `--fill-fraction` set as inline style. Fraction 0 = empty, 1 = complete ring.
  - All colors reference `var(--token)` exclusively. Zero hex literals.
  - _Depends on: task 5._

- [x] 11. **Implement `TimerDisplay` component**
  - Create `src/features/focus/components/TimerDisplay.tsx` and `TimerDisplay.module.css`.
  - Props: `{ fraction: number; remainingMs: number; state: TimerState }`.
  - Read `costumeId` and `t` from `useCostume()` inside the component.
  - Render the heading via `t('focus.heading')` (switch to `t('focus.breakHeading')` when `state` is a break state).
  - Render the MM:SS countdown in an element with `aria-live="polite"`.
  - Render `<PotionProgress>` when `costumeId === 'haunted'`; render `<RingProgress>` when `costumeId === 'classic'`. Show nothing when `state === 'idle'`.
  - Render the completed message via `t('focus.completedMessage')` when `state === 'completed'`.
  - _Depends on: tasks 9, 10._

---

## Group 4 — Controls and task binding

- [x] 12. **Implement `TimerControls` component**
  - Create `src/features/focus/components/TimerControls.tsx` and `TimerControls.module.css`.
  - Props: the full set of action callbacks and `state` from `UseTimerReturn`.
  - Render only the buttons valid for the current state (table in Design §6.6).
  - All button labels use `t()`. All buttons carry `aria-label` attributes.
  - All CSS uses `var(--token)` references only.
  - _Depends on: tasks 5, 8._

- [x] 13. **Implement `TaskBinder` component**
  - Create `src/features/focus/components/TaskBinder.tsx` and `TaskBinder.module.css`.
  - Props: `{ boundTaskId: string | null; bindTask: (id: string | null) => void; state: TimerState }`.
  - Render nothing when `state !== 'idle'`.
  - Import `TasksContext` from `src/features/tasks/TasksContext.tsx` (no other imports from the tasks feature).
  - Filter context tasks to `status === 'active'`. Render a `<select>` with a no-task option (`t('focus.taskBinderNone')`) and one `<option>` per active task.
  - Apply `aria-label={t('focus.taskBinderLabel')}` to the `<select>`.
  - On change call `bindTask(id)` or `bindTask(null)` for the no-task option.
  - _Depends on: tasks 5, 8._

---

## Group 5 — Page wiring and routing

- [x] 14. **Implement `TimerPage`**
  - Create `src/features/focus/TimerPage.tsx` and `TimerPage.module.css`.
  - Read `focusDuration` and `breakDuration` via `getSetting` from `../../settings`.
  - Call `useTimer(focusDuration, breakDuration)` to obtain all state and actions.
  - Render `<TimerDisplay>`, `<TimerControls>`, and `<TaskBinder>` in a single-column layout.
  - Apply a mobile-first layout: at 360 px viewport width, no horizontal scroll, no clipped controls.
  - Apply `var(--color-bg)` to page background and `var(--color-surface)` to the timer card via CSS module.
  - `TimerPage` holds no logic beyond reading settings and composing child components.
  - _Depends on: tasks 11, 12, 13._

- [x] 15. **Wire `TimerPage` into app routing**
  - Add a route for `/focus` (or the equivalent path agreed in the app router) that renders `<TimerPage />`.
  - Add a navigation entry for the focus feature in the shared nav component (using `t()` for the label; key to be agreed with the costume engine).
  - Confirm `TimerPage` is code-split (lazy + Suspense) consistent with how other page routes are loaded.
  - _Depends on: task 14._

---

## Group 6 — Settings UI

- [x] 16. **Add focus duration controls to the Settings screen**
  - In the existing Settings component, add a numeric input for `focusDuration` (1–120, label `t('focus.settingsFocusLabel')`) and one for `breakDuration` (1–60, label `t('focus.settingsBreakLabel')`).
  - On blur / save, call `setSetting('focusDuration', value)` and `setSetting('breakDuration', value)`.
  - Changing values mid-session must not affect the running timer (the hook reads settings only at mount; verify this in the hook, not the settings UI).
  - _Depends on: tasks 4, 5, 15._

---

## Group 7 — Verification

- [x] 17. **Verify storage module behaviour**
  - Write `localStorage['spookydesk.sessions']` to `"corrupt"` in browser devtools, reload, and confirm no uncaught exception and the sessions array is empty (AC-5.2).
  - Complete three sessions and inspect `localStorage['spookydesk.sessions']`; confirm three records each conforming to the `SessionRecord` shape (AC-5.1).

- [x] 18. **Verify timestamp-based timing**
  - Start a 25-minute session and immediately pause; confirm display shows 24:59 or 25:00 (AC-2.1).
  - Pause for ≥ 60 seconds, resume, and confirm the countdown resumes from the same value (AC-2.2).
  - Start a 5-minute session, background the tab for 2 minutes, return, and confirm the remaining time is correct within 2 seconds (AC-2.3, AC-3.1).
  - Confirm no numeric countdown variable is decremented inside an interval callback by code review (AC-3.2).

- [x] 19. **Verify session records**
  - Reset a running session and confirm `localStorage` contains a record with `completed: false` (AC-2.4).
  - Run a session to completion and confirm `completed: true` and `actualSeconds` matches actual elapsed focus time (excluding pauses) within ±2 s (AC-2.5).

- [x] 20. **Verify task binding**
  - Select a task, start a session, and confirm `task.linkedSessionId` is set; complete or reset and confirm it is `null` again (AC-4.1).
  - Confirm the task selector is hidden once the session is running (AC-4.2).
  - Delete the linked task mid-session in devtools and confirm the session continues without crashing (AC-4.3).

- [x] 21. **Verify progress visualisation and costume switching**
  - At session start confirm the progress indicator is empty; at completion confirm it is full (AC-6.1).
  - Grep `src/features/focus/` for hex color literals; confirm zero matches (AC-7.2).
  - Switch from `haunted` to `classic` mid-session and confirm the timer state is unaffected and the correct component renders (AC-6.3).

- [x] 22. **Verify copy and sound**
  - Grep JSX in `src/features/focus/` for string literals used as button labels or headings; confirm zero matches (AC-7.3).
  - Switch to the `classic` costume, start a session, and confirm the classic sound pack's `session-start` plays (AC-7.1).

- [x] 23. **Verify settings integration**
  - Set focus duration to 45, reload, and confirm the timer initialises at 45:00 (AC-1.2).
  - Change duration mid-session and confirm the running countdown is not affected; the new value applies to the next session (AC-1.3).

- [x] 24. **Verify mobile layout**
  - Open the focus page at 360 px viewport width in browser devtools; confirm no horizontal scroll and no clipped controls (REQ-NF-02).
  - Confirm all interactive controls have accessible names via `aria-label` or visible text, and the countdown has `aria-live="polite"` (REQ-NF-03).

---

## Verification record (phase 3, 2026-11-21)

All 24 tasks complete. Manual browser checks 17–24 were executed as an
equivalent scripted jsdom smoke suite against the real component tree
(47/47 checks passed) using a deterministic fake clock (patched `Date`
+ manually fired 500 ms intervals), which makes the timestamp-timing
checks exact rather than approximate: corrupt sessions store -> empty
store, no throw (17/AC-5.2); schema migration stamps v1 (17); settings
45 -> idle 45:00 (23/AC-1.2); pause-immediately shows 25:00, 90 s paused
wall-clock leaves the display unchanged, resume + 30 s -> 24:30
(18/AC-2.1, AC-2.2); 2 min backgrounded with no ticks -> remaining
exactly 3:00 on return (18/AC-2.3, AC-3.1); reset writes
`completed: false` with actualSeconds 10 (19/AC-2.4); three 1-minute
sessions complete with `completed: true`, actualSeconds 60 each, all
records conforming to the `SessionRecord` shape (17/19, AC-5.1, AC-2.5);
progress fraction 0 at start, 0.5 mid-session, 1 at completion
(21/AC-6.1); task binding sets/clears `linkedSessionId`, binder hides
while running, deleting the linked task mid-session (via localStorage)
does not crash and the session completes (20/AC-4.1–4.3); costume
switch mid-session swaps potion -> ring and all labels, countdown
unaffected (21/AC-6.3); full break flow (heading, freeze on pause,
return to idle, no extra session record) also covered. Sound (22/AC-7.1)
was verified by temporarily injecting a path into the classic pack and
stubbing `Audio`: `play('session-start')` reaches `Audio` with the
classic path on session start. Mid-session settings change leaves the
running countdown untouched and applies to the next session (23/AC-1.3).
Static audits: zero hex literals in `src/features/focus/` (21/AC-7.2);
zero hardcoded label/heading literals in focus JSX (22/AC-7.3); no
decrement operator anywhere in `useTimer.ts` — remaining time is always
derived from timestamps (18/AC-3.2); 360 px layout verified by static
CSS audit (24/REQ-NF-02: widths are 100% or rem-sized components, max
12 rem) and accessible names / `aria-live="polite"` asserted in the
smoke DOM (24/REQ-NF-03). `tsc --noEmit` clean; `npm run build`
succeeds with separate lazy chunks for `/focus` and `/settings`.

Cross-spec fixes applied this phase (noted for the record):
- Copy packs vs focus design §8: 5 missing `focus.*` keys added
  (breakHeading, taskBinderLabel, taskBinderNone, settingsFocusLabel,
  settingsBreakLabel); 3 pre-seeded values aligned to §8 (classic
  `focus.heading` "Focus Session", classic `focus.startLabel`
  "Start focus", both `focus.completedMessage` values). `nav.focus`
  and `nav.settings` keys added — the packs had no labels for the new
  nav entries (tasks 15/16).
- Settings module location: focus spec says `src/settings/` /
  `../../settings`; the shared helpers actually live in
  `src/engine/storage.ts` (tasks-phase precedent). Followed the
  codebase. Likewise there is no typed Settings object, defaults
  object or settings schemaVersion in the shipped engine — the
  settings store is a free-form object — so `focusDuration` /
  `breakDuration` are consumed via `getSetting` with range-checked
  defaults (25 / 5) at the read sites, the same pattern as
  `tasksFilter` (task 4).
- No Settings screen existed anywhere in the app, though task 16 (and
  the today-stats spec) assumes one. Created a minimal, real
  `SettingsPage` at `/settings` with the two duration controls
  (task 16); invalid/out-of-range input is rejected on blur and never
  written.
- `TasksProvider` was mounted only inside `TasksPage`, which left
  `TaskBinder` on `/focus` without a `TasksContext` — binding would
  have been dead in the real app. The provider is now mounted once at
  the App root and the inner one removed. `TasksContext` is exported
  (was module-private) so the binder can `useContext` and render
  nothing outside a provider, per design §6.7.
- Task 7 lists `startedAt` / `totalPausedMs` on `TimerReducerState`;
  design §3.1 puts them on `TimerRecord`. Followed the design (no
  duplication). Durations reach the reducer as a third `config`
  argument; the hook deliberately does not freeze it — a running
  session derives everything from `record.plannedMs`, so mid-session
  settings changes cannot affect it, and the next START picks up the
  new value.
- `TICK` returns a shallow copy of the state: returning the identical
  reference would let React bail out of re-rendering and freeze the
  countdown display.
- Progress visual is hidden during break states (design §2.1) as well
  as idle. The countdown rounds up (ceil) so `00:00` only appears at
  true zero.
- Sound packs are all-null project-wide (no audio assets exist yet —
  a phase-1 condition, slots declared and intentionally silent per
  costume-engine design §3.3). AC-7.1 is therefore verified at the
  wiring level as described above; adding real audio files remains a
  project-wide gap, not a focus defect.
