# AGENTS.md

## Project Memory

This project is an early TypeScript browser game prototype: a space pixel-art survivor-like / Brotato-like roguelite built to be friendly to AI-assisted coding.

Current high-level direction:

- The player moves, survives, auto-attacks, gains experience, and upgrades.
- Upgrades may involve player-written "wish" text interpreted into ability combinations.
- The exact gameplay loop, ability model, benchmark policy, and LLM integration details are still open for discussion.

## Initial Technical Direction

Likely stack:

- Vite for the web app and build flow.
- TypeScript with `strict: true`.
- PixiJS v8 for 2D rendering.
- bitECS 0.4 for data-oriented game simulation.
- Code-generated pixel assets.

Treat these as the starting direction, not final architecture. Do not replace the core stack or introduce a different main game framework without discussing it with the user.

## Architecture Notes

- Keep simulation data separate from Pixi rendering objects.
- Prefer lightweight ECS components and explicit system boundaries.
- Avoid coupling core game logic to DOM/UI framework state.
- Keep LLM-related logic bounded to gameplay content decisions; do not let model output become executable game code.

## Visual Direction

- Space pixel-art style with high-contrast neon accents, small sprites, starfields, plasma projectiles, trails, and shader/GPU particle effects.
- Core art assets should be generated from code so they are reviewable and diffable.
- Do not use AI-generated images or imported external images as core game assets unless the user explicitly changes that direction.
- Keep pixel sprites low resolution and scale with nearest-neighbor rendering.

## Coding Style

- Prefer small files and small functions.
- Use explicit types and avoid `any` unless the reason is documented.
- Prefer data-driven content where it keeps behavior easier to reason about.
- Do not add empty placeholder modules that do not solve a current problem.
- Add abstractions only when they remove real complexity or match an established project pattern.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues for `Arcobalneo/ecs-llm-rougelite`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five-label triage vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain docs layout. See `docs/agents/domain.md`.
