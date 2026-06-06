import type { BossMechSilhouette } from "../../shared/boss/boss-planning.js";
import type { BossSpriteAnimationState } from "./combat-entity-animation.js";
import {
  drawGearShard,
  drawOutlinedPoly,
  drawPixelGlow,
  type PixelPalette,
} from "./pixel-primitives.js";

type PixiGraphics = import("pixi.js").Graphics;

export interface BossDamageOverlayOptions {
  animation: BossSpriteAnimationState;
  healthProgress: number;
  index: number;
  palette: PixelPalette;
  silhouette: BossMechSilhouette;
}

export function drawBossDamageOverlay(
  graphic: PixiGraphics,
  options: BossDamageOverlayOptions,
): void {
  const severity = bossDamageSeverity(options.healthProgress);
  if (severity <= 0) {
    return;
  }
  const pulse = 0.5 + Math.sin(options.index * 1.7 + options.animation.frame * 0.9) * 0.5;
  drawPixelGlow(graphic, 0, 0, 62 + severity * 44, options.palette.core, 0.06 * severity);
  drawExposedCore(graphic, options, severity, pulse);
  if (options.silhouette === "flying") {
    drawFlyingArmorBreak(graphic, options, severity);
  } else if (options.silhouette === "crawling") {
    drawCrawlingArmorBreak(graphic, options, severity);
  } else {
    drawHumanoidArmorBreak(graphic, options, severity);
  }
  drawFaultSparks(graphic, options, severity, pulse);
}

export function bossDamageSeverity(healthProgress: number): number {
  const wounded = 1 - Math.max(0, Math.min(1, healthProgress));
  if (wounded < 0.12) {
    return 0;
  }
  return Math.min(1, (wounded - 0.12) / 0.72);
}

export function bossDamageCrackCount(healthProgress: number): number {
  const severity = bossDamageSeverity(healthProgress);
  if (severity <= 0) {
    return 0;
  }
  return 4 + Math.ceil(severity * 10);
}

function drawExposedCore(
  graphic: PixiGraphics,
  options: BossDamageOverlayOptions,
  severity: number,
  pulse: number,
): void {
  const coreY = options.silhouette === "humanoid" ? -28 : options.silhouette === "crawling" ? -12 : -8;
  const width = 18 + severity * 26;
  const height = 16 + severity * 30;
  graphic
    .rect(-width * 0.5 - 4, coreY - height * 0.5 - 4, width + 8, height + 8)
    .fill({ color: options.palette.dark, alpha: 0.78 })
    .rect(-width * 0.5, coreY - height * 0.5, width, height)
    .fill({ color: options.palette.core, alpha: 0.22 + severity * 0.18 })
    .rect(-width * 0.16, coreY - height * 0.62, width * 0.32, height * 1.24)
    .fill({ color: options.palette.accent, alpha: 0.32 + pulse * severity * 0.22 });
  graphic
    .circle(0, coreY, 18 + severity * 24)
    .stroke({ color: options.palette.accent, width: 2, alpha: 0.18 + severity * 0.18 })
    .circle(0, coreY, 30 + severity * 30)
    .stroke({ color: options.palette.core, width: 1, alpha: 0.12 + severity * 0.12 });
}

function drawFlyingArmorBreak(
  graphic: PixiGraphics,
  options: BossDamageOverlayOptions,
  severity: number,
): void {
  for (const side of [-1, 1]) {
    drawMissingPlate(graphic, {
      color: options.palette.dark,
      points: [side * 42, -19, side * 82, -31, side * 68, -5, side * 37, 6],
      severity,
    });
    drawCrack(graphic, options.palette, [
      { x: side * 32, y: -17 },
      { x: side * 55, y: -7 },
      { x: side * 73, y: 13 },
      { x: side * 91, y: 8 },
    ], severity);
  }
}

function drawCrawlingArmorBreak(
  graphic: PixiGraphics,
  options: BossDamageOverlayOptions,
  severity: number,
): void {
  drawMissingPlate(graphic, {
    color: options.palette.dark,
    points: [-62, -24, -20, -34, -11, -9, -55, 2],
    severity,
  });
  drawMissingPlate(graphic, {
    color: options.palette.dark,
    points: [28, -24, 72, -18, 58, 9, 19, -2],
    severity,
  });
  for (const x of [-66, -28, 36, 78]) {
    drawCrack(graphic, options.palette, [
      { x, y: -20 },
      { x: x + 10, y: -5 },
      { x: x - 2, y: 10 },
      { x: x + 18, y: 22 },
    ], severity);
  }
}

function drawHumanoidArmorBreak(
  graphic: PixiGraphics,
  options: BossDamageOverlayOptions,
  severity: number,
): void {
  drawMissingPlate(graphic, {
    color: options.palette.dark,
    points: [-42, -50, -12, -58, -4, -18, -34, -8],
    severity,
  });
  drawMissingPlate(graphic, {
    color: options.palette.dark,
    points: [15, -43, 46, -50, 35, -6, 7, -18],
    severity,
  });
  for (const side of [-1, 1]) {
    drawCrack(graphic, options.palette, [
      { x: side * 26, y: -67 },
      { x: side * 44, y: -39 },
      { x: side * 35, y: -10 },
      { x: side * 53, y: 20 },
    ], severity);
  }
}

function drawMissingPlate(
  graphic: PixiGraphics,
  options: {
    color: number;
    points: readonly number[];
    severity: number;
  },
): void {
  drawOutlinedPoly(graphic, options.points, options.color, 0x020612, 0.42 + options.severity * 0.18);
}

function drawCrack(
  graphic: PixiGraphics,
  palette: PixelPalette,
  points: readonly { x: number; y: number }[],
  severity: number,
): void {
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    if (!from || !to) {
      continue;
    }
    graphic
      .moveTo(from.x, from.y)
      .lineTo(to.x, to.y)
      .stroke({ color: 0x020612, width: 5, alpha: 0.56 })
      .moveTo(from.x, from.y)
      .lineTo(to.x, to.y)
      .stroke({ color: index % 2 === 0 ? palette.accent : palette.core, width: 2, alpha: 0.24 + severity * 0.26 });
  }
}

function drawFaultSparks(
  graphic: PixiGraphics,
  options: BossDamageOverlayOptions,
  severity: number,
  pulse: number,
): void {
  const count = bossDamageCrackCount(options.healthProgress);
  for (let spark = 0; spark < count; spark += 1) {
    const angle = spark * 2.399 + options.index * 0.7;
    const radius = (options.silhouette === "humanoid" ? 72 : 88) * (0.42 + (spark % 4) * 0.16);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * (options.silhouette === "crawling" ? 0.48 : 0.7) - 8;
    if (spark % 5 === 0) {
      drawGearShard(graphic, x, y, 5 + (spark % 3), options.palette.accent, 0.22 + severity * 0.18);
      continue;
    }
    graphic
      .rect(x - 2, y - 2, 4 + (spark % 3), 4 + (spark % 2))
      .fill({ color: spark % 2 === 0 ? options.palette.core : options.palette.accent, alpha: (0.3 + pulse * 0.2) * severity })
      .moveTo(x * 0.82, y * 0.82)
      .lineTo(x * 1.18, y * 1.18)
      .stroke({ color: options.palette.accent, width: 1, alpha: 0.22 * severity });
  }
}
