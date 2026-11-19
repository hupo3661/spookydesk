# Requirements — Today & Stats Feature

## Overview

The today-stats feature adds two views to SpookyDesk: **Today** and **Stats**.
The Today view is the daily hub: today's tasks, a focus-time goal with live
progress, a streak indicator, and a daily greeting. The Stats view presents a
7-day bar chart and lifetime counters. All data comes from the existing tasks
and sessions stores; the only new persistent store is the streak record.

---

## Functional requirements

### R-1 Today view — task list

**R-1.1** When the user opens the Today view, the system shall display every
task whose `dueDate` equals today's local date (YYYY-MM-DD) or whose
`createdAt` local date equals today and `dueDate` is null.

> **AC-1.1a** A task with `dueDate = <today>` appears in the Today list
> regardless of status.
>
> **AC-1.1b** A task with `dueDate = null` and `createdAt` local date equal
> to today appears in the Today list.
>
> **AC-1.1c** A task with `dueDate` set to any day other than today does not
> appear in the Today list.
>
> **AC-1.1d** A task with `dueDate = null` and `createdAt` local date before
> today does not appear in the Today list.

**R-1.2** When the Today list is empty, the system shall display an
empty-state message sourced from the copy pack (`today.emptyState`).

**R-1.3** The Today list shall reuse the same task-completion interaction
defined in the tasks spec (complete, delete, edit), producing identical
side-effects (status update, `monstersDefeated` increment, streak update,
sound).

**R-1.4** The Today list shall not duplicate task data in a separate store; it
reads directly from the tasks store.

---

### R-2 Today view — focus goal

**R-2.1** When the user views Today, the system shall show today's focus
progress as actual focused minutes (derived from `SessionRecord.actualSeconds`
for sessions whose `startedAt` local date is today and `completed` is true)
against a configurable daily focus goal.

> **AC-2.1a** Only sessions with `completed = true` and `startedAt` local date
> equal to today contribute to the progress total.
>
> **AC-2.1b** The displayed actual minutes equal `Math.floor(sum of
> actualSeconds / 60)` for the qualifying sessions.

**R-2.2** The focus goal shall default to 25 minutes and shall be stored in
the shared settings store as `focusGoal` (integer, 1–480).

**R-2.3** When the user edits the focus goal, the system shall persist the
new value immediately via `setSetting('focusGoal', value)` and reflect it in
the progress display without a page reload.

> **AC-2.3a** The input accepts only integers in the range 1–480.
>
> **AC-2.3b** Submitting an empty or out-of-range value resets the displayed
> value to the current persisted goal without saving.

**R-2.4** The progress shall be displayed as a visual bar or ring (using only
CSS and plain SVG/divs, no chart library) and a numeric label `actual /
goal min`, with all colors from CSS variables.

---

### R-3 Today view — streak

**R-3.1** The system shall maintain a streak count of consecutive calendar
days on which the user either completed at least one task or completed at
least one focus session. Local dates (browser timezone) determine calendar
day boundaries.

**R-3.2** The streak record shall be stored at `localStorage['spookydesk.streak']`
as a versioned JSON object with shape `StreakStore`:

```
{ schemaVersion: 1, lastActiveDate: string | null, currentStreak: number, longestStreak: number }
```

`lastActiveDate` is a local YYYY-MM-DD string or `null` on first use.

**R-3.3** When a task transitions to `status = 'done'`, the system shall call
the streak update function.

**R-3.4** When a focus session is recorded with `completed = true`, the system
shall call the streak update function.

**R-3.5** The streak update function shall apply the following rules, using
today's local date:

- If `lastActiveDate` equals today → no change.
- If `lastActiveDate` equals yesterday → `currentStreak += 1`; update
  `lastActiveDate` to today; update `longestStreak` if `currentStreak` exceeds
  it.
- Otherwise (gap of two or more days, or `lastActiveDate` is null) → reset
  `currentStreak = 1`; set `lastActiveDate = today`; update `longestStreak` if
  1 exceeds it.

> **AC-3.5a** Completing a second task on the same day does not increment the
> streak again.
>
> **AC-3.5b** Completing a task the day after the last active day increments
> the streak by exactly 1.
>
> **AC-3.5c** A gap of two or more days resets `currentStreak` to 1 (not 0).
>
> **AC-3.5d** `longestStreak` never decreases.

**R-3.6** In the haunted costume, the system shall render the streak as a row
of jack-o'-lantern icons: up to `MAX_STREAK_DISPLAY` (10) icons, lit for
each day in the current streak (capped at `MAX_STREAK_DISPLAY`), unlit for
the remainder. When `currentStreak` exceeds `MAX_STREAK_DISPLAY`, the row
shows all 10 lit with a numeric overflow label (e.g., "+3").

**R-3.7** In the classic costume, the system shall render the streak as a
numeric badge showing `currentStreak` and the copy-pack unit string
(`streak.unit`).

**R-3.8** The streak display shall always show `longestStreak` as a secondary
label, sourced from the copy pack (`streak.longestLabel`).

---

### R-4 Today view — daily greeting

**R-4.1** The system shall display exactly one greeting line at the top of the
Today view, chosen deterministically from a list of greeting strings in the
copy pack (`today.greetings`) by computing `index = dateAsInteger % greetings.length`
where `dateAsInteger` is today's local date as `YYYYMMDD` parsed as an integer.

> **AC-4.1a** The same greeting is shown for the full calendar day regardless
> of when the page is first loaded or reloaded.
>
> **AC-4.1b** The greeting changes when the local date changes.
>
> **AC-4.1c** The greeting is a plain string rendered via `t()` from the copy
> pack; no greeting is hard-coded in a component.

---

### R-5 Stats view — 7-day bar chart

**R-5.1** When the user opens the Stats view, the system shall display a 7-day
bar chart covering the 7 calendar days ending with (and including) today in
the user's local timezone.

**R-5.2** The chart shall have two data series per day:

- **Tasks completed**: count of tasks with `completedAt` local date equal to
  that day.
- **Focus minutes**: `Math.floor(sum of actualSeconds / 60)` for sessions with
  `completed = true` and `startedAt` local date equal to that day.

**R-5.3** Days with zero values for both series shall still render as a
visible (zero-height) bar column so the 7-day grid is always full.

**R-5.4** The chart shall be implemented with plain `<div>` elements (height
as a percentage of the column's max value) or inline SVG. No third-party chart
library may be used.

**R-5.5** Each bar column shall display the day label (short weekday name from
the copy pack or `Intl.DateTimeFormat`) and, on hover/focus, a tooltip showing
exact numeric values for that day.

**R-5.6** Bar colors shall use CSS variables (`--color-primary` for tasks,
`--color-accent` for focus minutes); no hard-coded color values.

---

### R-6 Stats view — lifetime counters

**R-6.1** The system shall display the total lifetime count of completed tasks
read from `getMonstersDefeated()` in the tasks storage module.

**R-6.2** The system shall display the total lifetime focus minutes computed as
`Math.floor(sum of actualSeconds / 60)` across all sessions with `completed =
true` from `getAllSessions()`.

**R-6.3** Both counters shall use copy-pack labels (`stats.monstersDefeated`,
`stats.lifetimeFocusMinutes`) so the labels differ between costumes.

---

### R-7 Cross-cutting constraints

**R-7.1** All UI strings in the today-stats feature shall come from the copy
pack via `t(key)`. No string literals may appear in component JSX or CSS.

**R-7.2** All colors used in this feature shall reference CSS custom
properties. No hex literals, `rgb()`, or named colors may appear in component
CSS modules or inline styles (the sole exception: dynamic numeric values
such as bar heights set via `style={{ '--bar-height': '...' }}`).

**R-7.3** The feature shall work offline; it must not make any network
requests.

**R-7.4** The feature layout shall be functional at a minimum viewport width
of 360 px (mobile-first).

**R-7.5** No data from the tasks or sessions stores shall be duplicated into a
new storage key. The streak store (`spookydesk.streak`) is the only new
localStorage entry introduced by this feature.
