# Tasks — Costume Engine

Each task is a self-contained unit of work. Tasks are ordered so that every
item depends only on previously completed items. Check a task off only when
its stated deliverable compiles cleanly and its acceptance criteria pass.

---

## Phase 1 — Type foundations

- [x] **1. Define canonical key arrays and pack types**
  - Create `src/costumes/types.ts`.
  - Export `CSS_VAR_KEYS`, `COPY_KEYS`, `SOUND_KEYS` as `as const` arrays
    containing every key the app will use (populate with the full sets defined
    in `design.md` §3 and §8).
  - Derive `CssVarPack`, `CopyPack`, `SoundPack` as `Record<…[number], …>`
    mapped types from those arrays.
  - Export `CostumePack` interface with `id`, `label`, `cssVars`, `copy`,
    `sounds` fields.
  - _Deliverable:_ `tsc --noEmit` passes on the new file.

- [x] **2. Define `CostumeId` and the registry shape**
  - Create `src/costumes/registry.ts`.
  - Export `CostumeId = 'haunted' | 'classic'`.
  - Export `DEFAULT_COSTUME_ID: CostumeId = 'haunted'`.
  - Export `COSTUME_REGISTRY` typed as `Readonly<Record<CostumeId, CostumePack>>`
    — leave the value as a stub `{}` cast for now (filled in Phase 2).
  - _Deliverable:_ file compiles; registry shape is locked.

---

## Phase 2 — Costume packs

- [x] **3. Build the `haunted` CSS variable pack**
  - Create `src/costumes/haunted/cssVars.ts`.
  - Export `hauntedCssVars: CssVarPack` with values for every key in
    `CSS_VAR_KEYS` (Halloween palette: dark purples, orange accent, spooky
    font).
  - _Deliverable:_ `tsc` rejects the file if any key is missing.

- [x] **4. Build the `haunted` copy pack**
  - Create `src/costumes/haunted/copy.ts`.
  - Export `hauntedCopy: CopyPack` with values for every key in `COPY_KEYS`
    (monster/potion/jack-o'-lantern flavour text).
  - _Deliverable:_ `tsc` rejects if any copy key is missing.

- [x] **5. Build the `haunted` sound pack**
  - Create `src/costumes/haunted/sounds.ts`.
  - Export `hauntedSounds: SoundPack` mapping every key in `SOUND_KEYS` to
    either a path string under `public/sounds/haunted/` or `null`.
  - _Deliverable:_ `tsc` rejects if any sound key is missing.

- [x] **6. Assemble the `haunted` pack**
  - Create `src/costumes/haunted/index.ts`.
  - Export `hauntedPack: CostumePack = { id: 'haunted', label: 'Haunted Halloween', cssVars: hauntedCssVars, copy: hauntedCopy, sounds: hauntedSounds }`.
  - _Deliverable:_ file compiles cleanly.

- [x] **7. Build the `classic` CSS variable pack**
  - Create `src/costumes/classic/cssVars.ts`.
  - Export `classicCssVars: CssVarPack` with values for every key in
    `CSS_VAR_KEYS` (calm, minimal palette: near-white bg, muted blue accent,
    system font stack).
  - _Deliverable:_ same key set as `hauntedCssVars`; `tsc` rejects mismatches.

- [x] **8. Build the `classic` copy pack**
  - Create `src/costumes/classic/copy.ts`.
  - Export `classicCopy: CopyPack` with plain productivity-app copy for every
    key in `COPY_KEYS`.
  - _Deliverable:_ same key set as `hauntedCopy`.

- [x] **9. Build the `classic` sound pack**
  - Create `src/costumes/classic/sounds.ts`.
  - Export `classicSounds: SoundPack`; it is acceptable for all slots to be
    `null` (the classic costume is intentionally quiet).
  - _Deliverable:_ same key set as `hauntedSounds`.

- [x] **10. Assemble the `classic` pack**
  - Create `src/costumes/classic/index.ts`.
  - Export `classicPack: CostumePack = { id: 'classic', label: 'Classic Clean', … }`.
  - _Deliverable:_ file compiles cleanly.

- [x] **11. Register both packs**
  - Update `src/costumes/registry.ts`: import `hauntedPack` and `classicPack`,
    assign them to `COSTUME_REGISTRY`.
  - _Deliverable:_ `tsc` passes; registry is complete with two entries.

---

## Phase 3 — Engine core

- [x] **12. Implement `storage.ts`**
  - Create `src/engine/storage.ts`.
  - Export `getCostumeId(): CostumeId` — reads `spookydesk.settings` from
    `localStorage`, parses JSON, validates that `costumeId` is a key of
    `COSTUME_REGISTRY`, returns it or `DEFAULT_COSTUME_ID` on any failure.
  - Export `setCostumeId(id: CostumeId): void` — reads the existing settings
    object (or starts with `{}`), sets `costumeId`, writes back.
  - _Deliverable:_ unit-testable pure-ish functions; no React imports.

- [x] **13. Implement `applyCostume.ts`**
  - Create `src/engine/applyCostume.ts`.
  - Export `applyCostume(pack: CostumePack): void`:
    1. Iterate `CSS_VAR_KEYS`; for each key call
       `document.documentElement.style.setProperty('--' + key, pack.cssVars[key])`.
    2. Call `setCostumeId(pack.id)`.
  - _Deliverable:_ function applies all variables and persists in one call;
    no React dependency.

- [x] **14. Implement `CostumeContext.tsx`**
  - Create `src/engine/CostumeContext.tsx`.
  - Define `CostumeContextValue` interface (§5 of design).
  - Create the React context with a `null` default.
  - Export `CostumeProvider`: takes `initialId: CostumeId` as a prop, holds
    `pack` in `useState` initialised from `COSTUME_REGISTRY[initialId]`.
    Exposes `setCostume` which calls `applyCostume` then updates state.
  - _Deliverable:_ provider renders children; context value is fully typed.

- [x] **15. Implement `useCostume.ts`**
  - Create `src/engine/useCostume.ts`.
  - Export `useCostume()` hook:
    - Reads context (throws if used outside provider).
    - Returns `{ costumeId, setCostume, t, play }`.
    - `t(id: string): string` — returns `pack.copy[id]`, falls back to `id`
      with a `console.warn` in `import.meta.env.DEV`.
    - `play(slot: string): void` — resolves `pack.sounds[slot]`; if `null`,
      returns. Otherwise `new Audio(path).play().catch(e => console.warn(e))`.
    - Memoize `t` and `play` with `useCallback` on `pack`.
  - _Deliverable:_ hook compiles; `t` and `play` have correct return types.

---

## Phase 4 — Wiring and startup

- [x] **16. Apply costume before first render in `main.tsx`**
  - In `src/main.tsx` (or equivalent entry point):
    1. `import { getCostumeId } from './engine/storage'`.
    2. `import { applyCostume } from './engine/applyCostume'`.
    3. `import { COSTUME_REGISTRY } from './costumes/registry'`.
    4. Before `ReactDOM.createRoot(…).render(…)`:
       ```ts
       const id = getCostumeId();
       applyCostume(COSTUME_REGISTRY[id]);
       ```
    5. Wrap `<App />` in `<CostumeProvider initialId={id}>`.
  - _Deliverable:_ opening the app in the browser shows the correct costume
    before any interaction; no FOUC on cold load.

- [x] **17. Add CSS custom property references to the global stylesheet**
  - In `src/index.css` (or the app's root stylesheet), define fallback values
    for every variable in `CSS_VAR_KEYS` using `var(--key, <fallback>)` on
    the `:root` selector as documentation (the engine writes the real values
    at runtime; these serve as a reference and prevent missing-variable
    breakage during development).
  - _Deliverable:_ the app renders with reasonable styles even if
    `applyCostume` has not yet run (e.g. in Storybook or isolated tests).

---

## Phase 5 — Verification

- [x] **18. Verify no hard-coded colors or themed strings in features**
  - Run `grep -rE '#[0-9a-fA-F]{3,8}|rgb\(' src/features/` — expect zero
    matches.
  - Run `grep -rE '"[A-Z][a-z]|"[a-z]' src/features/` and manually confirm
    any string literals are non-themed (IDs, enum values, aria labels that do
    not change between costumes).
  - _Deliverable:_ AC-6.1 and AC-6.2 pass.

- [x] **19. Manual smoke test: costume switching**
  - Open the app; confirm `haunted` costume is active.
  - Switch to `classic`; confirm CSS variables update instantly, all copy
    changes, no reload.
  - Close and reopen the tab; confirm `classic` persists.
  - Corrupt `spookydesk.settings` in DevTools (`localStorage.setItem(…,
    'bad json')`); reload; confirm `haunted` loads without an error.
  - _Deliverable:_ AC-2.1, AC-2.2, AC-2.3, AC-3.1, AC-3.2 pass.

- [x] **20. Manual smoke test: sounds and missing-key safety**
  - Trigger each sound slot in `haunted` costume; confirm audio plays or is
    silently skipped (`null` slots).
  - Temporarily break an audio path; confirm only a console warning appears.
  - Call `t('nonexistent.key')` from the browser console; confirm the key
    string is returned and a warning is logged.
  - _Deliverable:_ AC-4.3, AC-5.2, AC-5.3 pass.

- [x] **21. Extensibility proof**
  - Add a stub third costume (any id, e.g. `'retro'`) by creating
    `src/costumes/retro/` with the three pack files and registering it.
  - Confirm: no component file is modified; `tsc` passes; the costume is
    selectable in the UI.
  - Remove the stub after the check (or keep it as a development fixture).
  - _Deliverable:_ AC-8.1 and AC-8.2 pass.
