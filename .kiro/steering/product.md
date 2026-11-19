# Product Steering — SpookyDesk

> Placeholder steering file. It will be refined before the main build sprint.
> Kiro reads files in `.kiro/steering/` to learn the product's conventions and
> applies them to every spec and coding session in this repo.

## Product in one line

SpookyDesk is a productivity app (tasks + focus timer + daily planner) that
wears costumes: its whole look, copy and sound pack can be swapped with one
click. The default costume is a haunted Halloween desk.

## Product rules

- The app must be fully usable with zero sign-up and zero backend. All data
  lives in the browser (localStorage, versioned schema).
- Every visual element must go through the costume/theme engine (CSS
  variables + copy pack + sound pack). No hard-coded colors or themed strings
  inside feature components.
- Core loop first: add task -> focus on it -> complete it -> see progress.
  Stats and extras never block the core loop.
- English UI copy. Playful but never at the expense of clarity: a first-time
  user must understand every screen without instructions.
- Mobile-first responsive layout; the app must work well at 360px width.

## Costumes at launch

1. `haunted` — Haunted Halloween (default): tasks are little monsters to
   defeat, a focus session brews a potion, streaks light jack-o'-lanterns.
2. `classic` — Classic Clean: the same app in a calm, minimal office skin,
   proving the costume system is real and not just a Halloween paint job.
