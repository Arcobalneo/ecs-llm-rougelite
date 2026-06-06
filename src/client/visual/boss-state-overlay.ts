import type { BossMechSilhouette } from "../../shared/boss/boss-planning.js";
import type { BossSpriteAnimationState } from "./combat-entity-animation.js";
import {
  drawGearShard,
  drawOutlinedPoly,
  drawPixelGlow,
  type PixelPalette,
} from "./pixel-primitives.js";

type PixiGraphics = import("pixi.js").Graphics;

export interface BossStateOverlayOptions {
  animation: BossSpriteAnimationState;
  healthProgress: number;
  index: number;
  palette: PixelPalette;
  silhouette: BossMechSilhouette;
}

export function bossStateEntranceIntensity(animation: BossSpriteAnimationState): number {
  return Math.max(0, Math.min(1, 1 - animation.entranceAlpha));
}

export function bossStateTelegraphIntensity(animation: BossSpriteAnimationState): number {
  return Math.max(0, Math.min(1, animation.telegraph));
}

export function bossStateShatterReadiness(healthProgress: number): number {
  const wounded = 1 - Math.max(0, Math.min(1, healthProgress));
  if (wounded < 0.58) {
    return 0;
  }
  return Math.min(1, (wounded - 0.58) / 0.36);
}

export function bossStateAnatomyAnchorCount(silhouette: BossMechSilhouette): number {
  const counts: Record<BossMechSilhouette, number> = {
    crawling: 8,
    flying: 10,
    humanoid: 9,
  };
  return counts[silhouette];
}

export function drawBossStateOverlay(
  graphic: PixiGraphics,
  options: BossStateOverlayOptions,
): void {
  const entrance = bossStateEntranceIntensity(options.animation);
  const telegraph = bossStateTelegraphIntensity(options.animation);
  const shatter = bossStateShatterReadiness(options.healthProgress);
  if (entrance <= 0 && telegraph <= 0 && shatter <= 0) {
    return;
  }
  if (entrance > 0) {
    drawEntranceAnatomy(graphic, options, entrance);
  }
  if (telegraph > 0) {
    drawTelegraphAnatomy(graphic, options, telegraph);
  }
  if (shatter > 0) {
    drawShatterReadiness(graphic, options, shatter);
  }
}

function drawEntranceAnatomy(
  graphic: PixiGraphics,
  options: BossStateOverlayOptions,
  intensity: number,
): void {
  const anchors = anatomyAnchors(options.silhouette);
  drawPixelGlow(graphic, 0, -8, 96 + intensity * 54, options.palette.armor, 0.06 * intensity);
  for (const [index, anchor] of anchors.entries()) {
    const phase = (index / anchors.length) * Math.PI * 2 + options.index;
    const reach = 18 + (index % 3) * 8 + intensity * 18;
    graphic
      .moveTo(anchor.x - Math.cos(phase) * reach, anchor.y - Math.sin(phase) * reach)
      .lineTo(anchor.x + Math.cos(phase) * reach, anchor.y + Math.sin(phase) * reach)
      .stroke({ color: 0x020612, width: 6, alpha: 0.22 * intensity })
      .moveTo(anchor.x - Math.cos(phase) * reach, anchor.y - Math.sin(phase) * reach)
      .lineTo(anchor.x + Math.cos(phase) * reach, anchor.y + Math.sin(phase) * reach)
      .stroke({ color: index % 2 === 0 ? options.palette.accent : options.palette.core, width: 2, alpha: 0.38 * intensity });
  }
}

function drawTelegraphAnatomy(
  graphic: PixiGraphics,
  options: BossStateOverlayOptions,
  intensity: number,
): void {
  if (options.silhouette === "flying") {
    for (const side of [-1, 1]) {
      drawWingCharge(graphic, options.palette, side as -1 | 1, intensity);
    }
    drawCoreCharge(graphic, options.palette, 0, -16, 42, intensity);
    return;
  }
  if (options.silhouette === "crawling") {
    for (const x of [-72, -36, 12, 58]) {
      drawClawCharge(graphic, options.palette, x, 35 + (x % 2) * 3, intensity);
    }
    drawCoreCharge(graphic, options.palette, 34, -15, 36, intensity);
    return;
  }
  for (const side of [-1, 1]) {
    drawArmCannonCharge(graphic, options.palette, side as -1 | 1, intensity);
  }
  drawCoreCharge(graphic, options.palette, 0, -31, 48, intensity);
}

function drawShatterReadiness(
  graphic: PixiGraphics,
  options: BossStateOverlayOptions,
  intensity: number,
): void {
  const anchors = anatomyAnchors(options.silhouette);
  for (const [index, anchor] of anchors.entries()) {
    const angle = index * 2.399 + options.index * 0.4;
    const distance = 12 + (index % 4) * 6;
    drawOutlinedPoly(
      graphic,
      [
        anchor.x - 5,
        anchor.y - 4,
        anchor.x + Math.cos(angle) * distance,
        anchor.y + Math.sin(angle) * distance,
        anchor.x + 5,
        anchor.y + 4,
      ],
      index % 2 === 0 ? options.palette.dark : options.palette.accent,
      0x020612,
      0.34 + intensity * 0.24,
    );
    if (index % 3 === 0) {
      drawGearShard(graphic, anchor.x, anchor.y, 5 + (index % 4), options.palette.accent, 0.22 + intensity * 0.2);
    }
  }
  graphic
    .circle(0, options.silhouette === "humanoid" ? -28 : -8, 52 + intensity * 42)
    .stroke({ color: options.palette.core, width: 2, alpha: 0.16 + intensity * 0.22 });
}

function drawWingCharge(
  graphic: PixiGraphics,
  palette: PixelPalette,
  side: -1 | 1,
  intensity: number,
): void {
  for (let lane = 0; lane < 4; lane += 1) {
    const root = { x: side * (18 + lane * 9), y: -24 + lane * 9 };
    const tip = { x: side * (72 + lane * 18), y: -46 + lane * 22 };
    graphic
      .moveTo(root.x, root.y)
      .lineTo(tip.x, tip.y)
      .stroke({ color: lane % 2 === 0 ? palette.accent : palette.core, width: lane === 0 ? 4 : 2, alpha: 0.18 + intensity * 0.24 });
  }
}

function drawClawCharge(
  graphic: PixiGraphics,
  palette: PixelPalette,
  x: number,
  y: number,
  intensity: number,
): void {
  drawOutlinedPoly(graphic, [x - 8, y - 5, x + 18, y, x - 8, y + 7], palette.accent, palette.dark, 0.42 + intensity * 0.22);
  graphic
    .moveTo(x - 4, y)
    .lineTo(x + 29, y + 2)
    .stroke({ color: palette.core, width: 2, alpha: 0.22 + intensity * 0.26 });
}

function drawArmCannonCharge(
  graphic: PixiGraphics,
  palette: PixelPalette,
  side: -1 | 1,
  intensity: number,
): void {
  const x = side * 92;
  const y = 2;
  graphic
    .rect(x - 18, y - 11, 36, 22)
    .stroke({ color: palette.accent, width: 3, alpha: 0.22 + intensity * 0.22 })
    .rect(x + side * 5, y - 4, side * 39, 8)
    .fill({ color: palette.core, alpha: 0.18 + intensity * 0.24 });
}

function drawCoreCharge(
  graphic: PixiGraphics,
  palette: PixelPalette,
  x: number,
  y: number,
  radius: number,
  intensity: number,
): void {
  drawPixelGlow(graphic, x, y, radius, palette.core, 0.1 + intensity * 0.1);
  graphic
    .circle(x, y, radius * 0.58)
    .stroke({ color: palette.accent, width: 3, alpha: 0.24 + intensity * 0.24 })
    .circle(x, y, radius)
    .stroke({ color: palette.core, width: 1, alpha: 0.18 + intensity * 0.16 });
}

function anatomyAnchors(silhouette: BossMechSilhouette): readonly { x: number; y: number }[] {
  if (silhouette === "flying") {
    return [
      { x: -112, y: -12 },
      { x: -78, y: -43 },
      { x: -58, y: 22 },
      { x: -30, y: -12 },
      { x: 0, y: -50 },
      { x: 30, y: -12 },
      { x: 58, y: 22 },
      { x: 78, y: -43 },
      { x: 112, y: -12 },
      { x: 0, y: 32 },
    ];
  }
  if (silhouette === "crawling") {
    return [
      { x: -86, y: -16 },
      { x: -58, y: 22 },
      { x: -25, y: -28 },
      { x: -8, y: 28 },
      { x: 28, y: -18 },
      { x: 58, y: 24 },
      { x: 86, y: -20 },
      { x: 112, y: 12 },
    ];
  }
  return [
    { x: -84, y: 4 },
    { x: -52, y: -52 },
    { x: -34, y: 42 },
    { x: -18, y: -92 },
    { x: 0, y: -26 },
    { x: 18, y: -92 },
    { x: 34, y: 42 },
    { x: 52, y: -52 },
    { x: 84, y: 4 },
  ];
}
