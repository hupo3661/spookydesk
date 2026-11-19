# Requirements — Costume Engine

## Overview

The costume engine is the theming layer that lets SpookyDesk swap its entire
look, copy and sounds in one click. All visual and copy decisions inside
feature components must route through this layer. No feature component may
hard-code a color, a themed string, or a sound file path.

---

## Functional Requirements

### REQ-1 — Costume pack structure

**WHEN** the application is built, **THE SYSTEM SHALL** define a costume pack
as a single unit composed of exactly three sub-packs:

- a **CSS variable pack** — a flat map of CSS custom-property names to string
  values covering every color, font-family, font-size scale token, border-
  radius, spacing token, and shadow used across the app;
- a **copy pack** — a flat map of string IDs to human-readable UI strings
  covering every piece of text that differs between costumes;
- a **sound pack** — a flat map of named sound-slot identifiers to audio file
  paths (or `null` when a slot is intentionally silent in a costume).

**Acceptance criteria:**

- AC-1.1: A TypeScript interface check at build time rejects any costume pack
  that is missing a key present in the other packs' maps (all packs for all
  costumes share the same key sets).
- AC-1.2: Adding a CSS variable, copy string, or sound slot anywhere in the
  app requires updating every costume pack before the TypeScript build
  succeeds.

---

### REQ-2 — Applying a costume

**WHEN** the user selects a costume, **THE SYSTEM SHALL** apply the CSS
variable pack by writing all custom properties onto the `:root` element of the
document within the same event loop tick, so the visual transition requires no
page reload and no React re-render of individual styled elements.

**Acceptance criteria:**

- AC-2.1: Switching costumes produces no full-page reload and no visible flash
  of unstyled content.
- AC-2.2: All CSS custom properties from the outgoing costume are replaced (not
  merged) by those of the incoming costume.
- AC-2.3: The active costume ID is written to `localStorage` under the key
  `spookydesk.settings` immediately after the CSS variables are applied.

---

### REQ-3 — Persisting the costume selection

**WHEN** the application loads, **THE SYSTEM SHALL** read the persisted costume
ID from `localStorage` (`spookydesk.settings`) and apply that costume before
the first render. **IF** no value is stored or the stored value is not a
recognised costume ID, **THE SYSTEM SHALL** apply the `haunted` costume.

**Acceptance criteria:**

- AC-3.1: A user who selects `classic`, closes the tab, and reopens the app
  sees the `classic` costume without any additional action.
- AC-3.2: Corrupted or missing `spookydesk.settings` data causes the engine to
  silently fall back to `haunted` without throwing an unhandled error.

---

### REQ-4 — Copy pack consumption

**WHEN** a feature component needs to display a themed string, **THE SYSTEM
SHALL** provide a lookup function (or hook) that accepts a string ID and
returns the value from the currently active copy pack.

**IF** the requested string ID does not exist in the active copy pack, **THE
SYSTEM SHALL** return the string ID itself as a fallback and log a warning to
the console (development builds only).

**Acceptance criteria:**

- AC-4.1: No JSX in any feature component contains a hard-coded themed string
  literal; all such strings come from copy-pack lookups.
- AC-4.2: Switching costumes updates all copy-pack consumers without a page
  reload.
- AC-4.3: A missing string ID never causes a render error; the ID string is
  rendered instead.

---

### REQ-5 — Sound pack consumption

**WHEN** a feature triggers a named sound event (e.g. `task-complete`,
`session-start`), **THE SYSTEM SHALL** resolve the audio file path from the
active sound pack and play it. **IF** the slot value is `null`, **THE SYSTEM
SHALL** skip playback silently.

**IF** the browser cannot play the resolved audio file, **THE SYSTEM SHALL**
catch the error and emit a console warning without propagating the exception.

**Acceptance criteria:**

- AC-5.1: Playing a sound requires only the sound-slot name; the caller has no
  knowledge of the file path.
- AC-5.2: Setting a slot to `null` in a costume produces no audio and no error.
- AC-5.3: A broken audio path causes a console warning only, not an unhandled
  exception.

---

### REQ-6 — No hard-coded visuals or themed strings in feature components

**WHEN** a feature component is rendered, **THE SYSTEM SHALL** source every
color from a CSS custom property and every themed UI string from the copy-pack
lookup. No inline `style` values and no string literals that differ between
costumes shall appear in feature component source files.

**Acceptance criteria:**

- AC-6.1: A grep for hex color literals (`#[0-9a-fA-F]{3,8}`) and `rgb(`
  inside `src/features/**` returns zero matches.
- AC-6.2: Every themed string visible in the UI can be changed by editing a
  costume pack alone, with no changes to any component file.

---

### REQ-7 — Launch costumes

**WHEN** the application is first opened, **THE SYSTEM SHALL** include two
complete costume packs:

- `haunted` — Haunted Halloween (default);
- `classic` — Classic Clean.

Both packs **SHALL** define exactly the same set of CSS variable keys, copy
string IDs, and sound slot names.

**Acceptance criteria:**

- AC-7.1: The TypeScript compiler accepts both packs without type errors.
- AC-7.2: Every CSS variable key, copy key, and sound key present in `haunted`
  is also present in `classic`, and vice versa.

---

### REQ-8 — Extensibility: adding a third costume

**WHEN** a developer adds a new costume, **THE SYSTEM SHALL** require only the
addition of a new pack object (implementing the costume-pack interfaces) and
its registration in the costume registry. No changes to any feature component,
hook, or CSS file shall be required.

**Acceptance criteria:**

- AC-8.1: A pull request that adds a third costume touches only files inside
  `src/costumes/` and the costume registry; no component or feature file is
  modified.
- AC-8.2: The new costume is selectable via the costume-changer UI immediately
  after registration, with no additional wiring.
