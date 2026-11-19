# Requirements — Focus Feature

## 1. Overview

The focus feature is a Pomodoro-style timer built into SpookyDesk. It lets
users run timed focus sessions and short breaks, optionally bound to a task,
and records every completed session for the stats feature to aggregate. All
copy, color and sound come through the costume engine; no themed strings or
hex values appear in feature code.

---

## 2. Functional requirements

### 2.1 Configurable durations

**REQ-F-01** — When the user opens Settings, the system shall expose a focus
duration control (whole minutes, 1–120, default 25) and a break duration
control (whole minutes, 1–60, default 5).

**REQ-F-02** — When the user saves a duration change, the system shall
persist both values in the shared `spookydesk.settings` object under the
keys `focusDuration` and `breakDuration`, and apply them to the next session
that starts (not the one currently running).

**Acceptance criteria — REQ-F-01/02**
- AC-1.1: On first load with no stored settings, the timer uses 25 min focus
  and 5 min break.
- AC-1.2: After the user sets focus duration to 45 and reloads, the timer
  initialises at 45:00.
- AC-1.3: Changing duration mid-session does not alter the running countdown;
  the new value takes effect only when the user starts the next session.

---

### 2.2 Timer controls

**REQ-F-03** — While the timer is idle, the system shall display a Start
control. Activating it transitions the timer to the running state and begins
counting down from the configured focus duration.

**REQ-F-04** — While the timer is running or break is running, the system
shall display a Pause control. Activating it freezes the remaining time and
transitions the timer to the paused or break-paused state respectively.

**REQ-F-05** — While the timer is paused or break-paused, the system shall
display a Resume control. Activating it resumes counting down from where it
stopped.

**REQ-F-06** — At any state other than idle, the system shall display a
Reset control. Activating it cancels the session, records it as incomplete,
and returns the timer to the idle state.

**REQ-F-07** — When the focus countdown reaches zero, the system shall
automatically transition to the completed state, record the session as
complete, and present a Start Break control.

**REQ-F-08** — When the user activates Start Break, the system shall
transition to the break-running state and count down from the configured
break duration.

**REQ-F-09** — When the break countdown reaches zero, the system shall
transition to the idle state and present the Start control for a new session.

**Acceptance criteria — REQ-F-03–09**
- AC-2.1: Starting a 25-minute session and immediately pausing leaves the
  display showing 24:59 or 25:00 (within one-second tolerance).
- AC-2.2: Pausing for 60 seconds then resuming continues the countdown from
  the same value as when paused, not from 60 seconds less.
- AC-2.3: With the tab backgrounded for 2 minutes during a 5-minute session,
  the remaining time on foreground is correct (timestamp-derived, not
  interval-counted).
- AC-2.4: Resetting a running session records a session document with
  `completed: false`.
- AC-2.5: A session that runs to zero records a session document with
  `completed: true` and `actualSeconds` equal to the actual elapsed focus
  time (excluding pause time).

---

### 2.3 Timestamp-based timing

**REQ-F-10** — The system shall derive remaining time exclusively from stored
timestamps (`startedAt`, `pausedAt`, `totalPausedMs`) and `Date.now()`, not
by decrementing a counter in an interval callback.

**REQ-F-11** — The system shall update the displayed countdown at most once
per second using `requestAnimationFrame` or a 500 ms `setInterval` poll.
Excessive polling (interval < 200 ms) is not permitted.

**Acceptance criteria — REQ-F-10/11**
- AC-3.1: Suspending and resuming a device (or aggressively throttled tab)
  does not cause the displayed time to drift more than 2 seconds from wall
  time elapsed.
- AC-3.2: The timer component holds no numeric countdown in component state
  that is decremented inside an interval callback.

---

### 2.4 Task binding

**REQ-F-12** — While the timer is idle, the system shall display a task
selector that lists active (non-completed) tasks from the tasks feature.

**REQ-F-13** — When the user selects a task and starts a session, the system
shall call `linkSession(taskId, sessionId)` from the tasks storage module,
associating the running session with that task.

**REQ-F-14** — When a session ends (completed or reset), the system shall
call `unlinkSession(taskId)` on the previously linked task, if any.

**REQ-F-15** — Task binding is optional. Starting a session with no task
selected is valid; the session record stores `taskId: null`.

**Acceptance criteria — REQ-F-12–15**
- AC-4.1: Selecting task T and starting a session sets `T.linkedSessionId`
  to the new session's id; completing or resetting clears it back to `null`.
- AC-4.2: The task selector is hidden once the session is running (the
  binding is locked for the life of the session).
- AC-4.3: If the linked task is deleted mid-session, the session continues
  unaffected and records `taskId` as the now-orphaned id (no crash, no
  forced reset).

---

### 2.5 Session persistence

**REQ-F-16** — The system shall store session records in `localStorage` under
the key `spookydesk.sessions` as a versioned JSON document
(`schemaVersion: 1`).

**REQ-F-17** — Each session record shall contain: `id` (UUID v4), `taskId`
(string or null), `startedAt` (ISO 8601 datetime), `plannedMinutes` (number),
`actualSeconds` (number), `completed` (boolean).

**REQ-F-18** — When `localStorage` is unavailable or the stored data is
corrupt, the system shall log a warning to the console, discard the corrupt
data, and start with an empty sessions list. It shall not throw an uncaught
exception.

**Acceptance criteria — REQ-F-16–18**
- AC-5.1: After completing three sessions, `localStorage['spookydesk.sessions']`
  contains a JSON document with `.sessions` array of length 3, each record
  conforming to the shape in REQ-F-17.
- AC-5.2: Writing `"corrupt"` to `localStorage['spookydesk.sessions']` and
  reloading does not crash the app; the sessions list is empty.

---

### 2.6 Progress visualisation

**REQ-F-19** — While the timer is running or paused, the system shall display
a progress indicator driven by the fraction `elapsed / planned` (0.0 to 1.0).

**REQ-F-20** — When the active costume is `haunted`, the system shall render
the progress indicator as a potion bottle filling from bottom to top.

**REQ-F-21** — When the active costume is `classic`, the system shall render
the progress indicator as a circular progress ring.

**REQ-F-22** — Switching costume while the timer is running shall immediately
swap the visualisation without resetting or pausing the timer.

**Acceptance criteria — REQ-F-19–22**
- AC-6.1: At session start the progress indicator is empty (fraction = 0).
  At session completion the indicator is full (fraction = 1).
- AC-6.2: Both `PotionProgress` and `RingProgress` accept a single `fraction`
  prop (number 0–1) and render entirely with `var(--token)` CSS references;
  no hex literals appear in those components or their CSS modules.
- AC-6.3: Switching from `haunted` to `classic` mid-session preserves the
  fraction value and swaps the component without touching timer state.

---

### 2.7 Sounds and copy

**REQ-F-23** — When a focus session starts, the system shall call
`play('session-start')` via `useCostume`.

**REQ-F-24** — When a focus session completes (countdown reaches zero), the
system shall call `play('session-end')` via `useCostume`.

**REQ-F-25** — All user-visible strings in the focus feature shall be sourced
from `t(key)` via `useCostume`. No string literals may appear in JSX or
returned from render functions in feature components.

**REQ-F-26** — All CSS in focus feature components shall use
`var(--<token>)` references only. No hex literals, `rgb()`, named colours, or
inline `style` props with colour values.

**Acceptance criteria — REQ-F-23–26**
- AC-7.1: Switching to the `classic` costume and starting a session plays the
  classic sound pack's `session-start` audio (or silently skips if the slot
  is `null`), not the haunted pack's.
- AC-7.2: Grep for hex colour literals (`/#[0-9a-fA-F]{3,6}/`) inside
  `src/features/focus/` returns zero matches.
- AC-7.3: Grep for string literals used as button labels or headings inside
  JSX in `src/features/focus/` returns zero matches (all copy comes through
  `t()`).

---

## 3. Non-functional requirements

**REQ-NF-01 — Offline-first**: The focus feature shall work with no network
connection. No fetches, no service-worker dependency beyond what the base app
provides.

**REQ-NF-02 — Mobile layout**: The timer page shall be fully usable at 360 px
viewport width with no horizontal scroll and no clipped controls.

**REQ-NF-03 — Accessibility**: Interactive controls (Start, Pause, Resume,
Reset, Start Break, task selector) shall have accessible names via
`aria-label` or visible text. The countdown display shall be a live region
(`aria-live="polite"` updated at most once per second).

**REQ-NF-04 — No backend**: The feature introduces no server calls, no
WebSocket connections, and no browser APIs that require permissions beyond
`localStorage`.

---

## 4. Out of scope

- Push or browser notifications when the timer completes.
- Multiple concurrent timers.
- Custom Pomodoro interval sequences (e.g. long break after four sessions).
- Syncing sessions across devices.
- Editing or deleting past session records from within the focus UI.
