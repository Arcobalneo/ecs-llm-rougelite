import { ARENA_BOUNDS } from "../simulation/arena-math.js";
import type { ArenaVisualState } from "./arena-visual-state.js";

type PixiGraphics = import("pixi.js").Graphics;

export function drawArenaHorizon(
  horizon: PixiGraphics,
  visualState: ArenaVisualState,
  tintColor: number,
  nowSeconds = 0,
): void {
  const phase = visualState.phase;
  horizon.clear();
  horizon
    .rect(0, 0, ARENA_BOUNDS.width, ARENA_BOUNDS.height)
    .fill({ color: phase.backgroundColor })
    .rect(0, 0, ARENA_BOUNDS.width, ARENA_BOUNDS.height)
    .fill({ color: tintColor, alpha: 0.08 })
    .rect(0, 0, ARENA_BOUNDS.width, ARENA_BOUNDS.height)
    .stroke({ color: phase.gridColor, width: 6, alpha: 0.78 });

  for (let index = 0; index < 260; index += 1) {
    const x = (index * 389) % ARENA_BOUNDS.width;
    const y = (index * 233) % ARENA_BOUNDS.height;
    const shimmer = 0.75 + Math.sin(nowSeconds * 1.6 + index * 0.73) * 0.25;
    const radius = (0.9 + (index % 4) * 0.72) * phase.intensity * shimmer;
    const alpha = 0.16 + (index % 6) * 0.055;
    const color = index % 4 === 0 ? phase.accentColor : index % 4 === 1 ? tintColor : phase.starColor;
    horizon.circle(x, y, radius).fill({ color, alpha });
  }

  for (let index = 0; index < 22; index += 1) {
    const x = ((index * 571) % ARENA_BOUNDS.width) + 80;
    const y = ((index * 347) % ARENA_BOUNDS.height) + 60;
    const radius = 110 + (index % 4) * 42;
    const color = index % 3 === 0 ? phase.accentColor : index % 3 === 1 ? tintColor : phase.gridColor;
    horizon.circle(x, y, radius).fill({ color, alpha: 0.024 * phase.intensity });
    horizon.circle(x + 34, y - 18, radius * 0.55).stroke({ color, width: 2, alpha: 0.06 });
    horizon.circle(x - 52, y + 28, radius * 0.28).fill({ color: phase.starColor, alpha: 0.028 });
  }

  for (let index = 0; index < 18; index += 1) {
    const angle = index * 0.83;
    const radius = 190 + (index % 6) * 56;
    const x = ARENA_BOUNDS.width / 2 + Math.cos(angle) * radius;
    const y = ARENA_BOUNDS.height / 2 + Math.sin(angle) * radius * 0.48;
    horizon
      .circle(x, y, 16 + (index % 4) * 5)
      .stroke({ color: index % 2 === 0 ? tintColor : phase.accentColor, width: 1, alpha: 0.12 });
  }

  for (let index = 0; index < 12; index += 1) {
    const y = ((index * 421) % ARENA_BOUNDS.height) + Math.sin(nowSeconds * 0.35 + index) * 24;
    const x = (index * 709 + nowSeconds * (18 + index)) % ARENA_BOUNDS.width;
    const length = 150 + (index % 5) * 32;
    horizon
      .moveTo(x - length * 0.5, y)
      .lineTo(x + length * 0.5, y + 18)
      .stroke({
        color: index % 2 === 0 ? tintColor : phase.accentColor,
        width: 2,
        alpha: 0.045 + (index % 3) * 0.018,
      });
  }

  for (let x = 0; x <= ARENA_BOUNDS.width; x += 240) {
    horizon.moveTo(x, 0).lineTo(x, ARENA_BOUNDS.height).stroke({
      color: phase.gridColor,
      width: 1,
      alpha: 0.14 * phase.intensity,
    });
  }
  for (let y = 0; y <= ARENA_BOUNDS.height; y += 240) {
    horizon.moveTo(0, y).lineTo(ARENA_BOUNDS.width, y).stroke({
      color: phase.gridColor,
      width: 1,
      alpha: 0.14 * phase.intensity,
    });
  }

  horizon
    .circle(ARENA_BOUNDS.width / 2, ARENA_BOUNDS.height / 2, 72)
    .stroke({ color: tintColor, width: 2, alpha: 0.55 })
    .circle(ARENA_BOUNDS.width / 2, ARENA_BOUNDS.height / 2, 138)
    .stroke({ color: phase.accentColor, width: 1, alpha: 0.18 });
}
