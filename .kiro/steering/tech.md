# Tech Steering — SpookyDesk

## Stack

- **Vite + React + TypeScript** — single-page app, no SSR.
- **No backend** — zero API calls at runtime; all data is localStorage.
- **No chart library** — charts are plain `<div>` bars or inline SVG.
- **CSS Modules** — component-scoped styles; all color/spacing via CSS custom
  properties, never hard-coded values.
- **Hosting** — Vercel free tier (static export).

## Project layout

```
src/
  costumes/           # Costume pack data (types, registry, per-costume folders)
    types.ts          # CSS_VAR_KEYS, COPY_KEYS, SOUND_KEYS + derived types
    registry.ts       # COSTUME_REGISTRY map, CostumeId union, DEFAULT_COSTUME_ID
    haunted/          # haunted pack: index.ts, cssVars.ts, copy.ts, sounds.ts
    classic/          # classic pack: same structure
  engine/             # Costume runtime (no pack data)
    CostumeContext.tsx
    applyCostume.ts
    useCostume.ts
    storage.ts
  features/
    tasks/            # TasksPage + TasksContext + storage + migrations + components
    focus/            # TimerPage + useTimer + storage + migrations + components
    today-stats/      # TodayPage + StatsPage + streakStorage + aggregations + dateUtils
  settings.ts         # Shared getSetting / setSetting helpers for spookydesk.settings
  main.tsx            # Entry point: apply costume → render CostumeProvider → App
```

Feature components live under `src/features/**`. They never import from
`src/costumes/` directly — they go through `useCostume()` only.

## Coding conventions

### Colors and theming

- Component CSS files must reference `var(--token-name)` only. No hex
  literals, no `rgb()`, no named colors.
- Inline `style` props in components are forbidden for color values. The only
  permitted use of inline style is to set a **dynamic numeric CSS custom
  property** (e.g. `style={{ '--fill-fraction': fraction }}`), never a color.

### Copy strings

- All user-visible text goes through `t(key)` from `useCostume()`.
- Never embed literal UI strings in JSX. Keys follow the pattern
  `<feature>.<element>` (e.g. `tasks.completeLabel`).

### Sounds

- All audio triggers go through `play(slot)` from `useCostume()`.
- Never construct `new Audio(...)` outside the costume engine.

### Storage

- Each feature has its own versioned store module (`storage.ts` +
  `migrations.ts`). All localStorage reads and writes go through that module.
- The shared settings object at `spookydesk.settings` is accessed only via
  `getSetting` / `setSetting` from `src/settings.ts`.
- No feature parses a sibling feature's raw localStorage key directly.
  Cross-feature reads go through the owning feature's exported storage
  functions.
- Every store module wraps its `JSON.parse` in `try/catch` and returns a
  safe default on failure.

### Timing

- Timer remaining-time is always derived from wall-clock timestamps, not from
  a decremented counter. Use `Date.now() - startedAt - totalPausedMs` against
  `plannedMs`.
- Never use `setInterval` as a source of truth for elapsed time; use it only
  to trigger a re-read of the timestamp-derived value.

### Date handling

- All calendar-date comparisons (streaks, today filtering, week chart) use
  local date fields via `getFullYear()`, `getMonth()`, `getDate()`.
- Convert ISO 8601 strings from stores to local date strings with
  `toLocalDate(new Date(isoString))` from
  `src/features/today-stats/dateUtils.ts`.
- Never use `toISOString().slice(0, 10)` for local dates — that returns a UTC
  date and will be wrong for users east of UTC after 4 pm or west of UTC
  before midnight.

### Cross-feature imports

- Focus may import `linkSession` / `unlinkSession` from `src/features/tasks/storage.ts`.
- Today-Stats may import `loadTasksStore` / `getMonstersDefeated` from
  `src/features/tasks/storage.ts` and `getAllSessions` from
  `src/features/focus/storage.ts`.
- Tasks and Focus import `updateStreak` / `toLocalDate` from
  `src/features/today-stats/`.
- No other cross-feature imports are permitted.

## Verification before commit

1. **Type-check** — `tsc --noEmit` must pass with zero errors.
2. **Color grep** — no component file under `src/features/` or `src/engine/`
   may contain a hard-coded color literal. Run:
   ```
   grep -rn --include="*.tsx" --include="*.ts" --include="*.css" \
     -E "(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\()" \
     src/features/ src/engine/
   ```
   Any match is a bug. Color values belong in `src/costumes/*/cssVars.ts`
   only.
3. **Copy grep** — no component file may contain user-visible string literals
   in JSX (quoted strings that would render as UI text). Confirm all copy
   goes through `t()`.
