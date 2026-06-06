import type { BossMechSilhouette } from "../../../../shared/boss/boss-planning.js";
import type { BossSpriteAnimationState } from "../../combat-entity-animation.js";
import {
  drawArmorPanel,
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawOutlinedSegment,
  drawPixelJoint,
  type PixelPalette,
} from "../../pixel-primitives.js";
import type { PixiGraphics } from "./boss-sprite-types.js";

export interface BossStateBodyPartProfile {
  entrancePanels: number;
  exposedCores: number;
  shatterPlates: number;
  telegraphWeapons: number;
}

export function bossStateBodyPartProfile(options: {
  animation: BossSpriteAnimationState;
  healthProgress: number;
  silhouette: BossMechSilhouette;
}): BossStateBodyPartProfile {
  const entrance = Math.max(0, 1 - options.animation.entranceAlpha);
  const telegraph = Math.max(0, options.animation.telegraph);
  const wounded = 1 - Math.max(0, Math.min(1, options.healthProgress));
  const shatter = wounded > 0.58 ? Math.min(1, (wounded - 0.58) / 0.36) : 0;
  const silhouetteWeight = options.silhouette === "flying" ? 1.2 : options.silhouette === "humanoid" ? 1.1 : 1;

  return {
    entrancePanels: Math.ceil(entrance * 4 * silhouetteWeight),
    exposedCores: wounded > 0.42 ? Math.ceil((wounded - 0.42) * 7 * silhouetteWeight) : 0,
    shatterPlates: Math.ceil(shatter * 7 * silhouetteWeight),
    telegraphWeapons: Math.ceil(telegraph * 5 * silhouetteWeight),
  };
}

export function drawFlyingBossStateBodyParts(options: {
  animation: BossSpriteAnimationState;
  graphic: PixiGraphics;
  healthProgress: number;
  palette: PixelPalette;
}): void {
  const profile = bossStateBodyPartProfile({
    animation: options.animation,
    healthProgress: options.healthProgress,
    silhouette: "flying",
  });
  const intensity = Math.max(options.animation.telegraph, profile.exposedCores / 5, profile.entrancePanels / 5);
  if (intensity <= 0) {
    return;
  }
  for (const side of [-1, 1] as const) {
    if (profile.telegraphWeapons > 0) {
      drawOutlinedSegment(options.graphic, { x: side * 18, y: -26 }, { x: side * 142, y: -62 }, 5, options.palette.core, options.palette.dark, 0.34 + intensity * 0.28);
      drawOutlinedSegment(options.graphic, { x: side * 22, y: 8 }, { x: side * 128, y: 42 }, 4, options.palette.accent, options.palette.dark, 0.28 + intensity * 0.24);
      drawWingBladeArray(options.graphic, options.palette, side, profile.telegraphWeapons);
    }
    if (profile.entrancePanels > 0) {
      drawArmorPanel(options.graphic, [side * 71, -49, side * 118, -70, side * 99, -31, side * 62, -20], options.palette, 0.22 + profile.entrancePanels * 0.08);
    }
  }
  drawExposedCoreArray(options.graphic, options.palette, [
    { x: -22, y: -7 },
    { x: 22, y: -7 },
    { x: 0, y: -28 },
    { x: -48, y: 14 },
    { x: 48, y: 14 },
  ], profile.exposedCores);
  drawShatterPlateArray(options.graphic, options.palette, [
    { x: -96, y: -38 },
    { x: 96, y: -38 },
    { x: -76, y: 24 },
    { x: 76, y: 24 },
    { x: 0, y: 42 },
    { x: -24, y: -54 },
    { x: 24, y: -54 },
  ], profile.shatterPlates);
}

export function drawCrawlingBossStateBodyParts(options: {
  animation: BossSpriteAnimationState;
  graphic: PixiGraphics;
  healthProgress: number;
  palette: PixelPalette;
}): void {
  const profile = bossStateBodyPartProfile({
    animation: options.animation,
    healthProgress: options.healthProgress,
    silhouette: "crawling",
  });
  const intensity = Math.max(options.animation.telegraph, profile.exposedCores / 5, profile.entrancePanels / 5);
  if (intensity <= 0) {
    return;
  }
  if (profile.telegraphWeapons > 0) {
    for (const x of [-78, -42, 3, 44, 88]) {
      drawOutlinedPoly(options.graphic, [x - 9, 23, x + 13, 28, x - 14, 41], options.palette.core, options.palette.dark, 0.3 + intensity * 0.3);
      drawOutlinedSegment(options.graphic, { x: x - 4, y: 21 }, { x: x + 19, y: 47 }, 3, options.palette.accent, options.palette.dark, 0.24 + intensity * 0.2);
    }
    drawOutlinedSegment(options.graphic, { x: 45, y: -34 }, { x: 136, y: -53 }, 5, options.palette.core, options.palette.dark, 0.28 + intensity * 0.22);
  }
  if (profile.entrancePanels > 0) {
    for (let index = 0; index < profile.entrancePanels; index += 1) {
      const x = -80 + index * 34;
      drawArmorPanel(options.graphic, [x, -38, x + 22, -47, x + 33, -24, x + 5, -17], options.palette, 0.28 + index * 0.04);
    }
  }
  drawExposedCoreArray(options.graphic, options.palette, [
    { x: -56, y: -14 },
    { x: -22, y: -17 },
    { x: 14, y: -11 },
    { x: 50, y: -7 },
    { x: 84, y: -19 },
  ], profile.exposedCores);
  drawShatterPlateArray(options.graphic, options.palette, [
    { x: -88, y: 8 },
    { x: -56, y: -33 },
    { x: -12, y: 14 },
    { x: 30, y: -29 },
    { x: 72, y: 11 },
    { x: 102, y: -12 },
  ], profile.shatterPlates);
}

export function drawHumanoidBossStateBodyParts(options: {
  animation: BossSpriteAnimationState;
  graphic: PixiGraphics;
  healthProgress: number;
  palette: PixelPalette;
}): void {
  const profile = bossStateBodyPartProfile({
    animation: options.animation,
    healthProgress: options.healthProgress,
    silhouette: "humanoid",
  });
  const intensity = Math.max(options.animation.telegraph, profile.exposedCores / 5, profile.entrancePanels / 5);
  if (intensity <= 0) {
    return;
  }
  for (const side of [-1, 1] as const) {
    if (profile.telegraphWeapons > 0) {
      const y = 9 - options.animation.telegraph * 18;
      drawOutlinedRect(options.graphic, side < 0 ? -136 : 88, y - 12, 48, 24, options.palette.dark, options.palette.dark, 0.42 + intensity * 0.2);
      drawEmissiveSlit(options.graphic, side < 0 ? -135 : 99, y - 4, 36, 8, options.palette.core, 0.34 + intensity * 0.3);
      drawPixelJoint(options.graphic, side * 88, y, 9, options.palette, 0.5 + intensity * 0.24);
    }
    if (profile.entrancePanels > 0) {
      drawArmorPanel(options.graphic, [side * 31, -96, side * 58, -126, side * 72, -90, side * 37, -72], options.palette, 0.28 + profile.entrancePanels * 0.06);
    }
  }
  drawExposedCoreArray(options.graphic, options.palette, [
    { x: 0, y: -26 },
    { x: -28, y: -39 },
    { x: 28, y: -39 },
    { x: -20, y: 14 },
    { x: 20, y: 14 },
  ], profile.exposedCores);
  drawShatterPlateArray(options.graphic, options.palette, [
    { x: -61, y: -52 },
    { x: 61, y: -52 },
    { x: -40, y: 31 },
    { x: 40, y: 31 },
    { x: -20, y: -104 },
    { x: 20, y: -104 },
    { x: 0, y: 52 },
  ], profile.shatterPlates);
}

function drawWingBladeArray(
  graphic: PixiGraphics,
  palette: PixelPalette,
  side: -1 | 1,
  count: number,
): void {
  for (let index = 0; index < Math.min(5, count); index += 1) {
    const x = side * (75 + index * 11);
    const y = -48 + index * 17;
    drawOutlinedPoly(graphic, [x, y, x + side * 32, y - 12, x + side * 18, y + 12], index % 2 === 0 ? palette.accent : palette.core, palette.dark, 0.46);
  }
}

function drawExposedCoreArray(
  graphic: PixiGraphics,
  palette: PixelPalette,
  anchors: readonly { x: number; y: number }[],
  count: number,
): void {
  for (let index = 0; index < Math.min(anchors.length, count); index += 1) {
    const anchor = anchors[index];
    drawEmissiveSlit(graphic, anchor.x - 5, anchor.y - 4, 10, 8, index % 2 === 0 ? palette.core : palette.accent, 0.66);
    graphic.circle(anchor.x, anchor.y, 9 + index).stroke({ color: palette.core, width: 1, alpha: 0.24 });
  }
}

function drawShatterPlateArray(
  graphic: PixiGraphics,
  palette: PixelPalette,
  anchors: readonly { x: number; y: number }[],
  count: number,
): void {
  for (let index = 0; index < Math.min(anchors.length, count); index += 1) {
    const anchor = anchors[index];
    const skew = index % 2 === 0 ? 1 : -1;
    drawOutlinedPoly(
      graphic,
      [anchor.x - 7, anchor.y - 5, anchor.x + 9 * skew, anchor.y - 12, anchor.x + 11, anchor.y + 7, anchor.x - 5 * skew, anchor.y + 10],
      index % 2 === 0 ? palette.dark : palette.trim,
      palette.dark,
      0.44,
    );
  }
}
