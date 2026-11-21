# Tasks — Today & Stats Feature

Numbered checkbox list in dependency order. Complete tasks in sequence within
each group; tasks in different groups that share no dependency may be done in
parallel.

---

## Group A — Foundation (types, date utilities, migrations)

- [x] **1.** Create `src/features/today-stats/types.ts` — define and export
  `StreakStore`, `DayStats`, and `WeekStats` interfaces exactly as specified in
  design §3.

- [x] **2.** Create `src/features/today-stats/dateUtils.ts` — implement and
  export `toLocalDate`, `localDateInt`, `offsetLocalDate`, and `isYesterday`
  as specified in design §4. All four functions must use local-time fields
  (`getFullYear/Month/Date`); no UTC conversions.

- [x] **3.** Create `src/features/today-stats/streakMigrations.ts` — implement
  `CURRENT_STREAK_SCHEMA_VERSION = 1` and `migrateStreakStore(raw)` as
  specified in design §6.4. The `MIGRATIONS` map is empty at schema v1 and is
  ready to accept future entries.

---

## Group B — Streak store module (depends on A)

- [x] **4.** Create `src/features/today-stats/streakStorage.ts` — implement
  `STREAK_KEY`, `loadStreakStore`, `saveStreakStore`, and `updateStreak` as
  specified in design §6.1–6.2. `loadStreakStore` must call `migrateStreakStore`
  after parsing and return the `DEFAULT_STREAK` on any parse failure.
  `updateStreak` must implement all three branch rules from R-3.5 exactly:
  same day (no-op), yesterday (increment), gap or first use (reset to 1).

---

## Group C — Aggregation utilities (depends on A)

- [x] **5.** Create `src/features/today-stats/aggregations.ts` — implement the
  four pure functions:
  - `getTodayTasks(tasks, today)` — R-1.1 filter logic (dueDate match or null
    + createdAt match).
  - `getTodayFocusMinutes(sessions, today)` — completed sessions on today,
    `Math.floor(seconds / 60)`.
  - `getWeekStats(tasks, sessions, today)` — 7-day window via
    `offsetLocalDate`, `maxTasksCompleted` and `maxFocusMinutes` both clamped
    to minimum 1 (design §5).
  - `getLifetimeFocusMinutes(sessions)` — all completed sessions, all time.

  None of these functions may read localStorage themselves.

---

## Group D — Costume engine additions (depends on A)

- [x] **6.** Add the three new CSS variable tokens (`--color-streak-lit`,
  `--color-streak-unlit`, `--color-bar-bg`) to `CSS_VAR_KEYS` in
  `src/costumes/types.ts` and to both costume packs (`haunted` and `classic`)
  with the values listed in design §10.1.

- [x] **7.** Add all new copy-pack keys to `COPY_KEYS` in
  `src/costumes/types.ts` and to both costume packs with the values listed in
  design §10.2:
  - `streak.unit`, `streak.longestLabel`
  - `today.greetings.count`, `today.greetings.0` through `today.greetings.4`
  - `today.goalUnit`, `today.goalLabel`
  - `today.heading`, `today.emptyState`
  - `stats.heading`, `stats.weekHeading`, `stats.seriesTasksLabel`,
    `stats.seriesFocusLabel`, `stats.tasksUnit`, `stats.focusUnit`
  - `stats.monstersDefeated`, `stats.lifetimeFocusMinutes`

---

## Group E — Integration hooks (depends on B)

- [x] **8.** Edit `src/features/tasks/TasksContext.tsx` — in `completeTask`,
  after `incrementMonstersDefeated()` is called, import `updateStreak` from
  `../today-stats/streakStorage` and `toLocalDate` from
  `../today-stats/dateUtils`, then call `updateStreak(toLocalDate())`.
  No other logic in this file changes.

- [x] **9.** Edit `src/features/focus/useTimer.ts` — in the session-completion
  side-effect (the same point where `play('session-end')` fires and
  `appendSession({ completed: true })` is called), import and call
  `updateStreak(toLocalDate())`. No other logic in this file changes.

---

## Group F — Today view components (depends on C, D)

- [ ] **10.** Create `src/features/today-stats/components/DailyGreeting.tsx`
  and `DailyGreeting.module.css`. The component receives `today: string`
  (YYYY-MM-DD), reads `t('today.greetings.count')` for the list length, and
  renders `t('today.greetings.' + index)` where
  `index = localDateInt(new Date(today)) % count`. No greeting string may be
  hard-coded in JSX (R-7.1).

- [ ] **11.** Create `src/features/today-stats/components/FocusGoalWidget.tsx`
  and `FocusGoalWidget.module.css`. Props: `focusMinutes`, `goal`,
  `onGoalChange`. Render a progress bar (`--progress` CSS custom property set
  via inline style on the inner div), a `{actual} / {goal} {t('today.goalUnit')}`
  label, and a `<input type="number">` that validates 1–480 on blur/Enter and
  resets on invalid input (R-2.4, AC-2.3a–b, design §8.3). No hex or named
  colors in the CSS module.

- [ ] **12.** Create `src/features/today-stats/components/StreakDisplay.tsx`
  and `StreakDisplay.module.css`. Props: `currentStreak`, `longestStreak`.
  Reads `costumeId` from `useCostume()`.
  - **haunted**: row of 10 icon elements, first
    `Math.min(currentStreak, 10)` get class `lit`, rest get `unlit`; overflow
    `<span>` shown when `currentStreak > 10` (R-3.6).
  - **classic**: numeric badge with `{currentStreak} {t('streak.unit')}` (R-3.7).
  - Both: secondary label `{t('streak.longestLabel')}: {longestStreak}` (R-3.8).
  - Icon visuals must be CSS-only (no image imports); icon SVG data URI in
    the CSS module.

- [ ] **13.** Create `src/features/today-stats/components/TodayTaskList.tsx`.
  Props: `tasks: Task[]`. Renders `<TaskItem>` for each task from the tasks
  feature, or `<EmptyState filter="today" />` (with copy from
  `t('today.emptyState')`) when empty. No sorting. The component must be
  mounted inside `TasksProvider` (guaranteed by the router, not by this
  component). No task data is duplicated (R-1.4).

- [ ] **14.** Create `src/features/today-stats/TodayPage.tsx` and
  `components/TodayPage.module.css`. The page wrapper:
  - Derives `today = toLocalDate()`.
  - Reads `allTasks` from `TasksContext`, derives `todayTasks` via
    `getTodayTasks`.
  - Reads `getAllSessions()` and derives `focusMinutes` via
    `getTodayFocusMinutes`.
  - Reads `loadStreakStore()` for streak values.
  - Reads `getSetting('focusGoal') ?? 25` for the goal; calls
    `setSetting('focusGoal', v)` from `onGoalChange`.
  - Renders in order: `<DailyGreeting>`, `<StreakDisplay>`,
    `<FocusGoalWidget>`, `<TodayTaskList>`.
  - Layout is mobile-first, functional at 360 px (R-7.4). All colors via CSS
    variables (R-7.2).

---

## Group G — Stats view components (depends on C, D)

- [ ] **15.** Create `src/features/today-stats/components/DayColumn.tsx` and
  `DayColumn.module.css`. Props: `stats: DayStats`, `maxTasks: number`,
  `maxFocus: number`. Renders two vertical bar divs with heights set via
  `--tasks-h` and `--focus-h` custom properties (inline style, design §8.8).
  Colors `var(--color-primary)` and `var(--color-accent)`. Day label from
  `Intl.DateTimeFormat`. Tooltip via `title` attribute (R-5.5).

- [ ] **16.** Create `src/features/today-stats/components/WeekChart.tsx` and
  `WeekChart.module.css`. Props: `weekStats: WeekStats`. Renders a flex-row
  of 7 `<DayColumn>` components with `align-items: flex-end`. Renders a
  legend strip below with `t('stats.seriesTasksLabel')` and
  `t('stats.seriesFocusLabel')` (R-5.3–5.6). Zero-value days must render a
  visible column (R-5.3).

- [ ] **17.** Create `src/features/today-stats/components/LifetimeCounters.tsx`
  and `LifetimeCounters.module.css`. Props: `monstersDefeated: number`,
  `lifetimeFocusMinutes: number`. Renders two stat blocks with copy-pack
  labels `t('stats.monstersDefeated')` and `t('stats.lifetimeFocusMinutes')`
  (R-6.3). Flex row on wide viewports, stacked on narrow via CSS `flex-wrap`.

- [ ] **18.** Create `src/features/today-stats/StatsPage.tsx` and
  `components/StatsPage.module.css`. The page wrapper reads stores directly
  (not via context — design §8.6), derives `weekStats`,
  `lifetimeFocusMinutes`, and `monstersDefeated`, and renders `<WeekChart>`
  then `<LifetimeCounters>`. No real-time reactivity required on this view.
  Mobile-first layout, 360 px minimum.

---

## Group H — Router integration (depends on F, G)

- [ ] **19.** Register `TodayPage` and `StatsPage` as routes in the app
  router. Ensure `TodayPage` is nested inside `TasksProvider`. Ensure the
  navigation bar or tab strip links to both views using
  `t('today.heading')` and `t('stats.heading')` as link labels.

---

## Group I — Verification (depends on all above)

- [ ] **20.** Unit-test `dateUtils.ts` — verify `toLocalDate`, `localDateInt`,
  `offsetLocalDate`, and `isYesterday` with controlled `Date` inputs,
  including a DST-boundary date if applicable.

- [ ] **21.** Unit-test `streakStorage.ts` — cover all five `updateStreak`
  branches: (a) same day no-op, (b) consecutive day increment, (c) gap reset,
  (d) first use (`lastActiveDate = null`), (e) `longestStreak` never
  decreases.

- [ ] **22.** Unit-test `aggregations.ts` — cover `getTodayTasks` with the
  four AC-1.1 cases; cover `getTodayFocusMinutes` with completed and
  incomplete sessions; cover `getWeekStats` for a 7-day window including days
  with zero values; verify `maxTasksCompleted` and `maxFocusMinutes` are never
  below 1.

- [ ] **23.** Manual smoke test — Today view: confirm that completing a task
  today increments `currentStreak` by exactly 1 (open DevTools → Application
  → localStorage → `spookydesk.streak`); confirm completing a second task the
  same day does not increment again (AC-3.5a).

- [ ] **24.** Manual smoke test — Stats view: confirm the 7-day chart shows
  all 7 columns including zero-height bars; hover each column and verify the
  tooltip shows the correct numeric values; confirm `LifetimeCounters` reflects
  the same total as the raw task count in localStorage.

- [ ] **25.** Manual smoke test — costume swap: toggle from `haunted` to
  `classic` and back on both Today and Stats views. Confirm: jack-o'-lantern
  icons ↔ numeric badge on `StreakDisplay`; themed copy-pack labels swap in
  all headings, the focus goal unit, and the stats series labels; no hex
  literals or hard-coded strings remain visible in the DOM style attribute
  (beyond `--progress`, `--tasks-h`, `--focus-h`).

- [ ] **26.** Responsive check — load both views at 360 px viewport width
  (browser DevTools device toolbar). Confirm: no horizontal scroll, focus goal
  widget is fully usable, the 7-day chart columns are legible, and lifetime
  counters stack vertically.
