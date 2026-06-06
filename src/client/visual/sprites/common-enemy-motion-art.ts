import type { CommonEnemyTemplate } from "../../simulation/combat.js";
import type { EnemyAnimationFrame, EnemySpriteAnimationState } from "../combat-entity-animation.js";
import type { CommonEnemyVisualVariant } from "../common-enemy-variants.js";
import {
  drawOutlinedRect,
  drawOutlinedSegment,
  drawPixelJoint,
  type PixelPalette,
} from "../pixel-primitives.js";

type PixiGraphics = import("pixi.js").Graphics;

export interface CommonEnemyMotionArtProfile {
  afterimagePixels: number;
  engineStreaks: number;
  flutterArcs: number;
  frame: EnemyAnimationFrame;
  microNodes: number;
  scrapeMarks: number;
  templateId: CommonEnemyTemplate["id"];
  trailPixels: number;
  treadSparks: number;
  ventPuffs: number;
}

export function commonEnemyMotionArtProfile(options: {
  frame: EnemyAnimationFrame;
  templateId: CommonEnemyTemplate["id"];
}): CommonEnemyMotionArtProfile {
  const profile = motionProfileTable[options.templateId][options.frame];
  return {
    ...profile,
    frame: options.frame,
    templateId: options.templateId,
  };
}

export function commonEnemyMotionArtPartBudget(templateId: CommonEnemyTemplate["id"]): number {
  return [0, 1, 2, 3]
    .map((frame) => commonEnemyMotionArtProfile({ frame: frame as EnemyAnimationFrame, templateId }))
    .reduce((sum, profile) =>
      sum +
      profile.afterimagePixels +
      profile.engineStreaks +
      profile.flutterArcs +
      profile.microNodes +
      profile.scrapeMarks +
      profile.trailPixels +
      profile.treadSparks +
      profile.ventPuffs,
    0);
}

export function drawCommonEnemyMotionArt(
  graphic: PixiGraphics,
  options: {
    animation: EnemySpriteAnimationState;
    palette: PixelPalette;
    radius: number;
    templateId: CommonEnemyTemplate["id"];
    variant: CommonEnemyVisualVariant;
  },
): void {
  if (options.templateId === "fast-fragile") {
    drawFastFragileMotionArt(graphic, options);
    return;
  }
  if (options.templateId === "slow-tough") {
    drawSlowToughMotionArt(graphic, options);
    return;
  }
  drawSwarmFragileMotionArt(graphic, options);
}

function drawFastFragileMotionArt(
  graphic: PixiGraphics,
  options: MotionDrawOptions,
): void {
  const { animation, palette, radius, variant } = options;
  const profile = commonEnemyMotionArtProfile({ frame: animation.frame, templateId: "fast-fragile" });
  const wake = 8 + animation.thrust * 8 + variant.engineCount * 2;
  for (let streak = 0; streak < profile.engineStreaks; streak += 1) {
    const offset = (streak - (profile.engineStreaks - 1) / 2) * 5;
    const sway = frameDirection(animation.frame + streak) * (1 + variant.wingSpan);
    drawOutlinedSegment(
      graphic,
      { x: offset + sway, y: radius + 3 + (streak % 2) * 2 },
      { x: offset * 0.42 + sway, y: radius + wake + streak * 2 },
      streak % 2 === 0 ? 2 : 1,
      streak % 2 === 0 ? palette.accent : palette.glow,
      palette.dark,
      0.28 + animation.phase * 0.28,
    );
  }
  for (let pixel = 0; pixel < profile.afterimagePixels; pixel += 1) {
    const side = pixel % 2 === 0 ? -1 : 1;
    const x = side * (radius * (0.55 + (pixel % 4) * 0.18) + variant.asymmetry * 2);
    const y = radius * 0.34 + pixel * 3 + frameDirection(animation.frame + pixel) * 2;
    const size = 2 + (pixel % 3);
    graphic
      .rect(x - 1, y - 1, size + 2, size + 2)
      .fill({ color: palette.dark, alpha: 0.42 })
      .rect(x, y, size, size)
      .fill({ color: pixel % 3 === 0 ? palette.core : palette.accent, alpha: 0.22 + animation.phase * 0.18 });
  }
  for (let arc = 0; arc < profile.flutterArcs; arc += 1) {
    const side = arc % 2 === 0 ? -1 : 1;
    const spread = radius * (1.18 + variant.wingSpan * 0.36) + arc;
    graphic
      .arc(side * radius * 0.52, -radius * 0.08, spread, side < 0 ? 2.78 : 0.0, side < 0 ? 3.34 : 0.58)
      .stroke({ color: arc % 2 === 0 ? palette.accent : palette.trim, width: 1, alpha: 0.16 + animation.phase * 0.12 });
  }
  drawTrailPixels(graphic, {
    alpha: 0.22 + animation.phase * 0.12,
    count: profile.trailPixels,
    palette,
    radius,
    xScale: 0.46,
    yStart: radius + 12,
  });
}

function drawSlowToughMotionArt(
  graphic: PixiGraphics,
  options: MotionDrawOptions,
): void {
  const { animation, palette, radius, variant } = options;
  const profile = commonEnemyMotionArtProfile({ frame: animation.frame, templateId: "slow-tough" });
  const compression = animation.frame === 1 || animation.frame === 2 ? 3 : -1;
  for (let scrape = 0; scrape < profile.scrapeMarks; scrape += 1) {
    const side = scrape % 2 === 0 ? -1 : 1;
    const x = side * (radius * (0.82 + (scrape % 3) * 0.16));
    const y = radius * 0.62 + scrape * 2.4 + compression;
    drawOutlinedSegment(
      graphic,
      { x: x - side * 14, y },
      { x: x + side * (10 + variant.armorBulk * 4), y: y + frameDirection(animation.frame + scrape) * 2 },
      2,
      scrape % 2 === 0 ? palette.trim : palette.accent,
      palette.dark,
      0.2 + animation.phase * 0.14,
    );
  }
  for (let spark = 0; spark < profile.treadSparks; spark += 1) {
    const side = spark % 2 === 0 ? -1 : 1;
    const x = side * (radius + 12 + (spark % 3) * 5);
    const y = radius * (0.18 + (spark % 4) * 0.14) + compression;
    graphic
      .moveTo(x - side * 5, y)
      .lineTo(x + side * (3 + spark % 2), y - 5 - (spark % 3))
      .stroke({ color: spark % 2 === 0 ? palette.core : palette.accent, width: 1, alpha: 0.28 + animation.phase * 0.24 });
  }
  for (let puff = 0; puff < profile.ventPuffs; puff += 1) {
    const side = puff % 2 === 0 ? -1 : 1;
    const x = side * (radius * (0.66 + variant.sidePodScale * 0.24));
    const y = -radius * 0.34 + puff * 5;
    graphic
      .circle(x + side * (puff % 3) * 4, y, 4 + (puff % 3) * 2)
      .fill({ color: puff % 2 === 0 ? palette.glow : palette.accent, alpha: 0.08 + animation.phase * 0.06 });
  }
  for (let engine = 0; engine < profile.engineStreaks; engine += 1) {
    const side = engine % 2 === 0 ? -1 : 1;
    drawOutlinedRect(
      graphic,
      side < 0 ? -radius - 31 - engine * 2 : radius + 22 + engine * 2,
      -radius * 0.32 + engine * 9,
      10 + animation.thrust * 4,
      3,
      engine % 2 === 0 ? palette.accent : palette.glow,
      palette.dark,
      0.2 + animation.phase * 0.14,
    );
  }
}

function drawSwarmFragileMotionArt(
  graphic: PixiGraphics,
  options: MotionDrawOptions,
): void {
  const { animation, palette, radius, variant } = options;
  const profile = commonEnemyMotionArtProfile({ frame: animation.frame, templateId: "swarm-fragile" });
  for (let node = 0; node < profile.microNodes; node += 1) {
    const angle = node * 2.399 + animation.frame * 0.5 + variant.id * 0.17;
    const jitter = frameDirection(animation.frame + node) * (1 + (node % 3));
    const distance = radius * (0.88 + (node % 4) * 0.13) * variant.sidePodScale;
    const x = Math.cos(angle) * distance + jitter + variant.asymmetry;
    const y = Math.sin(angle) * distance + animation.phase * 3;
    drawPixelJoint(
      graphic,
      x,
      y,
      node % 3 === 0 ? 2.2 : 1.5,
      { ...palette, accent: node % 2 === 0 ? palette.accent : palette.core },
      0.2 + animation.phase * 0.22,
    );
  }
  for (let arc = 0; arc < profile.flutterArcs; arc += 1) {
    const side = arc % 2 === 0 ? -1 : 1;
    const y = -radius * 0.36 + frameDirection(animation.frame + arc) * (2 + arc % 3);
    graphic
      .arc(side * radius * 0.26, y, radius * (0.82 + variant.wingSpan * 0.2 + arc * 0.035), side < 0 ? 2.7 : 0.08, side < 0 ? 3.35 : 0.68)
      .stroke({ color: arc % 2 === 0 ? palette.core : palette.accent, width: 1, alpha: 0.13 + animation.phase * 0.12 });
  }
  drawTrailPixels(graphic, {
    alpha: 0.2 + animation.phase * 0.16,
    count: profile.trailPixels,
    palette,
    radius,
    xScale: 0.62,
    yStart: radius * 0.72,
  });
  for (let engine = 0; engine < profile.engineStreaks; engine += 1) {
    const offset = (engine - (profile.engineStreaks - 1) / 2) * 4;
    drawOutlinedSegment(
      graphic,
      { x: offset, y: radius * 0.72 },
      { x: offset * 0.35, y: radius * (1.1 + animation.thrust * 0.35) + engine * 2 },
      1,
      palette.glow,
      palette.dark,
      0.2 + animation.phase * 0.18,
    );
  }
}

function drawTrailPixels(
  graphic: PixiGraphics,
  options: {
    alpha: number;
    count: number;
    palette: PixelPalette;
    radius: number;
    xScale: number;
    yStart: number;
  },
): void {
  for (let pixel = 0; pixel < options.count; pixel += 1) {
    const side = pixel % 2 === 0 ? -1 : 1;
    const x = side * options.radius * options.xScale * ((pixel % 4) / 3);
    const y = options.yStart + pixel * 3.2;
    const width = 2 + (pixel % 2);
    graphic
      .rect(x - 1, y - 1, width + 2, 3)
      .fill({ color: options.palette.dark, alpha: 0.28 })
      .rect(x, y, width, 2)
      .fill({ color: pixel % 3 === 0 ? options.palette.core : options.palette.accent, alpha: options.alpha });
  }
}

function frameDirection(frame: number): -1 | 1 {
  return frame % 2 === 0 ? -1 : 1;
}

type MotionDrawOptions = {
  animation: EnemySpriteAnimationState;
  palette: PixelPalette;
  radius: number;
  variant: CommonEnemyVisualVariant;
};

const motionProfileTable: Record<
  CommonEnemyTemplate["id"],
  readonly Omit<CommonEnemyMotionArtProfile, "frame" | "templateId">[]
> = {
  "fast-fragile": [
    { afterimagePixels: 8, engineStreaks: 5, flutterArcs: 4, microNodes: 2, scrapeMarks: 0, trailPixels: 5, treadSparks: 0, ventPuffs: 1 },
    { afterimagePixels: 10, engineStreaks: 6, flutterArcs: 5, microNodes: 2, scrapeMarks: 0, trailPixels: 6, treadSparks: 0, ventPuffs: 1 },
    { afterimagePixels: 9, engineStreaks: 7, flutterArcs: 4, microNodes: 3, scrapeMarks: 0, trailPixels: 5, treadSparks: 0, ventPuffs: 1 },
    { afterimagePixels: 12, engineStreaks: 6, flutterArcs: 6, microNodes: 2, scrapeMarks: 0, trailPixels: 7, treadSparks: 0, ventPuffs: 1 },
  ],
  "slow-tough": [
    { afterimagePixels: 1, engineStreaks: 2, flutterArcs: 0, microNodes: 1, scrapeMarks: 6, trailPixels: 1, treadSparks: 7, ventPuffs: 4 },
    { afterimagePixels: 1, engineStreaks: 2, flutterArcs: 0, microNodes: 1, scrapeMarks: 8, trailPixels: 1, treadSparks: 9, ventPuffs: 5 },
    { afterimagePixels: 1, engineStreaks: 3, flutterArcs: 0, microNodes: 1, scrapeMarks: 7, trailPixels: 2, treadSparks: 8, ventPuffs: 6 },
    { afterimagePixels: 1, engineStreaks: 2, flutterArcs: 0, microNodes: 1, scrapeMarks: 9, trailPixels: 1, treadSparks: 10, ventPuffs: 5 },
  ],
  "swarm-fragile": [
    { afterimagePixels: 3, engineStreaks: 2, flutterArcs: 7, microNodes: 12, scrapeMarks: 0, trailPixels: 9, treadSparks: 0, ventPuffs: 0 },
    { afterimagePixels: 3, engineStreaks: 2, flutterArcs: 8, microNodes: 14, scrapeMarks: 0, trailPixels: 10, treadSparks: 0, ventPuffs: 0 },
    { afterimagePixels: 4, engineStreaks: 3, flutterArcs: 9, microNodes: 16, scrapeMarks: 0, trailPixels: 12, treadSparks: 0, ventPuffs: 0 },
    { afterimagePixels: 3, engineStreaks: 2, flutterArcs: 8, microNodes: 15, scrapeMarks: 0, trailPixels: 11, treadSparks: 0, ventPuffs: 0 },
  ],
};
