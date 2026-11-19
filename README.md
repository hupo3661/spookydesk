# SpookyDesk

**The productivity app that wears costumes.**
Tasks, a focus timer and a daily planner — dressed as a haunted Halloween
desk, with a one-click costume changer for the whole app.

Built with [Kiro](https://kiro.dev) for the **Kiroween 2026** hackathon
(Devpost), Costume Contest category.

> Status: scaffolding. Core build starts once the Kiro credits code arrives.

## What it does

- **Tasks** — add, prioritize, schedule and complete tasks. In the Haunted
  costume, every task is a little monster: finishing a task defeats it.
- **Focus timer** — Pomodoro-style sessions (25/5 by default, adjustable).
  In costume, each session brews a potion; finished sessions fill your flask.
- **Daily planner** — today's tasks, a focus goal and a streak that lights
  one jack-o'-lantern per active day.
- **Costume changer** — swap the entire skin (colors, illustrations, copy,
  sounds) in one click. Launch costumes: *Haunted Halloween* and
  *Classic Clean*.
- **Stats** — weekly view of tasks completed and minutes focused.

No sign-up, no backend, works offline. Data is stored locally in your
browser.

## Live demo

_TODO: add the public deployment URL (Vercel) once deployed._

## Tech stack

- Vite + React + TypeScript (single-page app)
- Costume engine: CSS variables + per-costume copy/sound packs
- Persistence: localStorage with a versioned schema
- Hosting: Vercel (free tier)

## How we used Kiro

_TODO: fill in during the build. Planned workflow:_

- _Steering files in `.kiro/steering/` define the product rules and the
  costume-engine conventions Kiro must follow in every session._
- _Each feature is built spec-first: `.kiro/specs/<feature>/` holds
  `requirements.md`, `design.md` and `tasks.md` generated and refined with
  Kiro before implementation._
- _Agent hooks for repetitive checks (typecheck/lint on save) — TODO: list
  the hooks actually enabled._
- _Session notes and before/after examples — TODO._

## Development

```bash
npm install
npm run dev
```

## License

MIT
