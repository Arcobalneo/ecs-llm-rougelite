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
- Keep the engineering directory structure explicit and modular. Rendering, visual assets, QA scenes, simulation, UI, and tests should live in clearly named modules with narrow responsibilities.
- Do not let single files become large asset or behavior buckets. When a file starts mixing orchestration, drawing details, data tables, and tests, split it before adding more behavior.

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

## Operational Guardrails

- Clean up browser automation aggressively. After using `agent-browser`, Playwright, Chrome for Testing, or any headless browser for visual QA, close the named session or run `agent-browser close --all` when the sessions are no longer needed.
- Before ending a browser-heavy turn, verify cleanup with `agent-browser session list` and `pgrep -afil 'agent-browser|Google Chrome for Testing|Chromium|Chrome for Testing'`. Stale headless renderers can consume hundreds of percent CPU for hours.
- If a Codex turn is interrupted or resumed after browser QA, treat browser cleanup as mandatory before continuing feature work.
- Stop temporary dev servers and screenshot processes once evidence has been captured. Do not leave Vite, test browsers, or one-off screenshot commands running in the background.
- Commit and push stageable progress proactively. After each coherent visual, gameplay, architecture, or documentation milestone, run the relevant checks, stage only the intended files, commit with a clear scope, and push the branch.
- Never bundle unrelated dirty work into a milestone commit. If the worktree contains previous user or agent changes, inspect status carefully and stage only the files that belong to the current milestone.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues for `Arcobalneo/ecs-llm-rougelite`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five-label triage vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain docs layout. See `docs/agents/domain.md`.
