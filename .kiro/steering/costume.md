# Costume Steering — SpookyDesk

## What a costume pack is

A costume pack is a TypeScript module that provides three complete data maps
for one visual identity: CSS variable values, UI copy strings, and sound
file paths. The engine applies them at startup and on every costume switch.

The canonical key sets are defined once in `src/costumes/types.ts` as
`const` arrays:

```typescript
export const CSS_VAR_KEYS  = ['color-bg', 'color-surface', ...] as const;
export const COPY_KEYS     = ['tasks.addPlaceholder', ...] as const;
export const SOUND_KEYS    = ['task-complete', 'task-add', ...] as const;
```

TypeScript derives the pack types from those arrays:

```typescript
export type CssVarPack = Record<typeof CSS_VAR_KEYS[number],  string>;
export type CopyPack   = Record<typeof COPY_KEYS[number],     string>;
export type SoundPack  = Record<typeof SOUND_KEYS[number],    string | null>;
```

A pack that omits any key is a **build error**, not a runtime surprise.

## The CostumePack interface

```typescript
export interface CostumePack {
  id:     CostumeId;   // machine-readable, used in localStorage + CSS class
  label:  string;      // display name in the costume picker
  cssVars: CssVarPack;
  copy:    CopyPack;
  sounds:  SoundPack;  // null means intentionally silent for that slot
}
```

## CSS variable contract

Every pack must supply a value for every key in `CSS_VAR_KEYS`. Values are
plain CSS strings written to `document.documentElement.style.setProperty`
at startup.

Required token groups (full list lives in `types.ts`):

| Group | Example keys |
|---|---|
| Colors | `color-bg`, `color-surface`, `color-text`, `color-primary`, `color-accent`, `color-muted` |
| Priority colors | `color-priority-low`, `color-priority-medium`, `color-priority-high` |
| Streak colors | `color-streak-lit`, `color-streak-unlit` |
| Chart colors | `color-bar-bg` (series colors reuse `color-primary` and `color-accent`) |
| Typography | `font-family-base` |
| Shape | `radius-card`, `shadow-card` |

## Copy pack contract

Every pack must supply a string value for every key in `COPY_KEYS`. Keys
follow the pattern `<feature>.<element>`. An incomplete key set is a build
error.

Required key groups (full list in `types.ts`):

| Group | Example keys |
|---|---|
| Tasks | `tasks.addPlaceholder`, `tasks.completeLabel`, `tasks.deleteLabel`, `tasks.priority.low/medium/high`, `tasks.filter.today/all/completed`, `tasks.emptyState.*` |
| Focus | `focus.heading`, `focus.startLabel`, `focus.pauseLabel`, `focus.resumeLabel`, `focus.resetLabel`, `focus.startBreakLabel`, `focus.completedMessage`, `focus.sessionUnit` |
| Today | `today.heading`, `today.greetings.count`, `today.greetings.0`…`N-1`, `today.goalUnit`, `today.goalLabel`, `today.emptyState` |
| Stats | `stats.heading`, `stats.weekHeading`, `stats.seriesTasksLabel`, `stats.seriesFocusLabel`, `stats.tasksUnit`, `stats.focusUnit`, `stats.monstersDefeated`, `stats.lifetimeFocusMinutes` |
| Streak | `streak.unit`, `streak.longestLabel` |
| Nav | `nav.costumePicker` |

## Sound pack contract

Every pack must supply an entry for every key in `SOUND_KEYS`. The value is a
path string (relative to `public/`) or `null` for intentional silence.

| Slot | Trigger |
|---|---|
| `task-complete` | user completes a task |
| `task-add` | user adds a task |
| `session-start` | focus session begins |
| `session-end` | focus session finishes naturally |
| `costume-change` | costume is switched |

A `null` value is valid and means no audio plays for that slot. The engine
calls `new Audio(path).play()` only when the value is non-null.

## Checklist: adding a new costume

1. **Add the ID** — extend `CostumeId` in `src/costumes/registry.ts`:
   ```typescript
   export type CostumeId = 'haunted' | 'classic' | 'your-new-id';
   ```

2. **Create the pack folder** — `src/costumes/your-new-id/` with four files:
   - `cssVars.ts` — exports `const cssVars: CssVarPack = { ... }` with every
     key from `CSS_VAR_KEYS`.
   - `copy.ts` — exports `const copy: CopyPack = { ... }` with every key from
     `COPY_KEYS`.
   - `sounds.ts` — exports `const sounds: SoundPack = { ... }` with every key
     from `SOUND_KEYS`; use `null` for any silent slot.
   - `index.ts` — assembles and exports the `CostumePack` object.

3. **Register the pack** — add the entry to `COSTUME_REGISTRY` in
   `src/costumes/registry.ts`.

4. **Add sound files** — place audio files referenced in `sounds.ts` under
   `public/sounds/your-new-id/`.

5. **Type-check** — run `tsc --noEmit`. Any missing key in any of the three
   pack maps surfaces as a compile error here. Fix all errors before
   continuing.

6. **Smoke-test** — switch to the new costume in-browser and verify: colors
   render correctly, copy strings are not `undefined`, sound slots work (or
   are silently skipped when `null`).

## Rules that must not be broken

- **Never** add a new CSS variable token, copy key, or sound slot to only one
  pack. Add it to `types.ts` first, then update every existing pack. `tsc`
  will tell you which packs are incomplete.
- **Never** put color hex values or themed strings in feature components.
  They belong in the pack files only.
- **Never** call `new Audio(...)` outside the costume engine. Sound
  triggering goes through `play(slot)` from `useCostume()`.
