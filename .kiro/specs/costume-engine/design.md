# Design — Costume Engine

## 1. Goals and constraints

- Zero backend. All costume data ships as TypeScript modules; no runtime
  fetches for pack data.
- Instant switching: CSS variable injection is synchronous; React context
  propagation updates copy and sound consumers without a reload.
- Type-safety: every costume pack is validated against shared interfaces at
  compile time, so a missing key is a build error, not a runtime surprise.
- Vite + React + TypeScript, localStorage for persistence.

---

## 2. File layout

```
src/
  costumes/
    types.ts            # CssVarPack, CopyPack, SoundPack, CostumePack interfaces
    registry.ts         # COSTUME_REGISTRY map + CostumeId union type
    haunted/
      index.ts          # assembles the haunted CostumePack
      cssVars.ts
      copy.ts
      sounds.ts
    classic/
      index.ts
      cssVars.ts
      copy.ts
      sounds.ts
  engine/
    CostumeContext.tsx  # React context + provider
    applyCostume.ts     # pure function: writes CSS vars to :root, persists id
    useCostume.ts       # hook: returns { costumeId, setCostume, t, play }
    storage.ts          # read/write costumeId from localStorage settings
```

Feature components live in `src/features/**` and import nothing from
`src/costumes/` directly — they go through the hook only.

---

## 3. Data model

### 3.1 CSS variable pack

```typescript
/**
 * Flat map of CSS custom-property names (without leading --) to values.
 * Every key must be present in every costume.
 */
export type CssVarPack = Readonly<Record<string, string>>;
```

Example entries:

| Key | haunted value | classic value |
|---|---|---|
| `color-bg` | `#1a0a2e` | `#f5f5f0` |
| `color-surface` | `#2d1b4e` | `#ffffff` |
| `color-primary` | `#ff6b35` | `#4a90d9` |
| `color-text` | `#f0e6ff` | `#1a1a1a` |
| `color-accent` | `#7fff6b` | `#e8a020` |
| `font-family-base` | `'Creepster', cursive` | `'Inter', sans-serif` |
| `radius-card` | `12px` | `4px` |
| `shadow-card` | `0 4px 24px #7b2fff55` | `0 1px 4px #0002` |

The full set of keys is defined once in `types.ts` as `CSS_VAR_KEYS` (a
`readonly string[]`), and `CssVarPack` is narrowed so that any key in that
array must be present (enforced via a mapped-type helper at build time).

### 3.2 Copy pack

```typescript
/**
 * Flat map of string IDs to human-readable UI strings.
 * Every key must be present in every costume.
 */
export type CopyPack = Readonly<Record<string, string>>;
```

String IDs follow the pattern `<feature>.<element>`, e.g.:

| ID | haunted value | classic value |
|---|---|---|
| `tasks.addPlaceholder` | `"Summon a new monster…"` | `"Add a task…"` |
| `tasks.completeLabel` | `"Defeat!"` | `"Done"` |
| `timer.startLabel` | `"Brew potion"` | `"Start focus"` |
| `timer.sessionUnit` | `"brew"` | `"session"` |
| `streak.unit` | `"jack-o'-lantern"` | `"day"` |
| `nav.costumePicker` | `"Change costume"` | `"Change costume"` |

### 3.3 Sound pack

```typescript
/**
 * Named sound slots. null means intentionally silent.
 */
export type SoundPack = Readonly<Record<string, string | null>>;
```

Defined sound slots:

| Slot | description |
|---|---|
| `task-complete` | user completes a task |
| `task-add` | user adds a task |
| `session-start` | focus session begins |
| `session-end` | focus session finishes |
| `costume-change` | costume is switched |

### 3.4 Costume pack

```typescript
export interface CostumePack {
  /** Machine-readable identifier, used as localStorage value and CSS class. */
  id: CostumeId;
  /** Display name shown in the costume picker. */
  label: string;
  cssVars: CssVarPack;
  copy: CopyPack;
  sounds: SoundPack;
}
```

### 3.5 Costume registry

```typescript
// registry.ts
export type CostumeId = 'haunted' | 'classic';  // extend here for new costumes

export const COSTUME_REGISTRY: Readonly<Record<CostumeId, CostumePack>> = {
  haunted: hauntedPack,
  classic: classicPack,
};

export const DEFAULT_COSTUME_ID: CostumeId = 'haunted';
```

Adding a third costume means: add its ID to `CostumeId`, add its pack to
`COSTUME_REGISTRY`. Nothing else changes.

---

## 4. Apply / persist flow

### 4.1 `applyCostume(pack: CostumePack): void`

Pure function (no React dependency). Called at startup and on every switch.

```
1. For each [key, value] in pack.cssVars:
     document.documentElement.style.setProperty(`--${key}`, value)
2. Write pack.id to localStorage via storage.ts
```

Complexity: O(n) where n is the number of CSS variables. Synchronous,
completes before the browser paints.

### 4.2 Startup sequence

```
main.tsx
  │
  ├─ read costumeId from localStorage (storage.ts)
  │    └─ if missing/invalid → DEFAULT_COSTUME_ID ('haunted')
  │
  ├─ applyCostume(COSTUME_REGISTRY[costumeId])
  │    └─ CSS vars on :root before React mounts
  │
  └─ <CostumeProvider initialId={costumeId}>
         <App />
     </CostumeProvider>
```

Applying CSS vars before React mounts means the first painted frame already
has the correct variables — no FOUC.

### 4.3 `setCostume(id: CostumeId): void`

Exposed by `useCostume`. Called by the costume-changer component.

```
1. Look up pack = COSTUME_REGISTRY[id]
2. applyCostume(pack)          ← sync: CSS vars + localStorage
3. dispatch React context update with new pack
   └─ consumers of t() and play() re-render with new pack data
```

---

## 5. React context design

```typescript
interface CostumeContextValue {
  costumeId: CostumeId;
  pack: CostumePack;
  setCostume: (id: CostumeId) => void;
}
```

`CostumeProvider` holds `pack` in `useState`. When `setCostume` is called it
calls `applyCostume` then calls the state setter. Children re-render once per
switch — acceptable given the infrequency of costume changes.

---

## 6. Component consumption

### 6.1 Colors via CSS variables

Components use CSS custom properties in their stylesheets:

```css
/* feature component CSS module */
.card {
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}
```

No hex literals, no `rgb()`, no inline `style` props with color values.

### 6.2 Copy strings via `t()`

```typescript
const { t } = useCostume();
// ...
<button>{t('tasks.completeLabel')}</button>
```

`t` is a stable function reference when the costume has not changed (memoised
with `useCallback`). It returns `pack.copy[id] ?? id` and logs a warning in
development when the key is absent.

### 6.3 Sounds via `play()`

```typescript
const { play } = useCostume();
// ...
play('task-complete');
```

`play` resolves `pack.sounds[slot]`, returns early if `null`, otherwise calls
`new Audio(path).play()` wrapped in a `.catch()` that logs a warning.

---

## 7. localStorage schema

The costume engine reads and writes one field inside the shared settings
object stored at key `spookydesk.settings` (versioned by the settings module):

```typescript
interface PersistedSettings {
  schemaVersion: number;   // bumped on breaking schema changes
  costumeId?: CostumeId;
  // ... other settings added by other features
}
```

The costume engine never owns the full settings object — it calls the
settings module's `get` / `set` helpers to read and write `costumeId` only.

---

## 8. Type-safety enforcement strategy

A mapped-type helper in `types.ts` ensures every pack has the same keys:

```typescript
// Define the canonical key sets once
export const CSS_VAR_KEYS = ['color-bg', 'color-surface', /* ... */] as const;
export const COPY_KEYS = ['tasks.addPlaceholder', /* ... */] as const;
export const SOUND_KEYS = ['task-complete', 'task-add', /* ... */] as const;

export type CssVarPack  = Record<typeof CSS_VAR_KEYS[number],  string>;
export type CopyPack    = Record<typeof COPY_KEYS[number],     string>;
export type SoundPack   = Record<typeof SOUND_KEYS[number],    string | null>;
```

A costume pack that omits any key fails `tsc` with a clear missing-property
error. Adding a new key to a key array immediately produces build errors in
every pack that hasn't been updated — the compiler acts as the enforcement
mechanism called out in AC-1.2.

---

## 9. Out of scope

- Server-side rendering (the app is a client-only SPA).
- Dynamic/user-uploaded costumes (future work).
- CSS transitions between costumes (optional UX enhancement, not part of this
  spec; the engine provides the hook point but does not define transition
  behaviour).
- Icon sets or illustration assets (managed per-feature; paths may be
  referenced in copy-pack strings if needed but are not a first-class pack
  concept).
