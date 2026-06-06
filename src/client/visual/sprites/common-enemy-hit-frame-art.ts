import type { CommonEnemyTemplate } from "../../simulation/combat.js";
import type { EnemySpriteAnimationState } from "../combat-entity-animation.js";
import type { CommonEnemyVisualVariant } from "../common-enemy-variants.js";
import {
  drawArmorPanel,
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawOutlinedSegment,
  drawPixelJoint,
  type PixelPalette,
} from "../pixel-primitives.js";

type PixiGraphics = import("pixi.js").Graphics;

export interface CommonEnemyHitFrameSignature {
  crackedCores: number;
  displacedPanels: number;
  family: CommonEnemyTemplate["id"];
  fractureLines: number;
  hitIntensity: number;
  shearedLimbs: number;
}

export function commonEnemyHitFrameSignature(options: {
  hitFlashAlpha: number;
  templateId: CommonEnemyTemplate["id"];
}): CommonEnemyHitFrameSignature {
  const hitIntensity = hitFrameIntensity(options.hitFlashAlpha);
  const base = hitIntensity > 0 ? 1 : 0;
  if (options.templateId === "fast-fragile") {
    return {
      crackedCores: base,
      displacedPanels: Math.ceil(hitIntensity * 4),
      family: options.templateId,
      fractureLines: Math.ceil(hitIntensity * 5),
      hitIntensity,
      shearedLimbs: Math.ceil(hitIntensity * 6),
    };
  }
  if (options.templateId === "slow-tough") {
    return {
      crackedCores: base,
      displacedPanels: Math.ceil(hitIntensity * 7),
      family: options.templateId,
      fractureLines: Math.ceil(hitIntensity * 8),
      hitIntensity,
      shearedLimbs: Math.ceil(hitIntensity * 3),
    };
  }
  return {
    crackedCores: base,
    displacedPanels: Math.ceil(hitIntensity * 3),
    family: options.templateId,
    fractureLines: Math.ceil(hitIntensity * 4),
    hitIntensity,
    shearedLimbs: Math.ceil(hitIntensity * 8),
  };
}

export function commonEnemyHitFramePartBudget(templateId: CommonEnemyTemplate["id"]): number {
  const signature = commonEnemyHitFrameSignature({
    hitFlashAlpha: 0.82,
    templateId,
  });
  return signature.crackedCores + signature.displacedPanels + signature.fractureLines + signature.shearedLimbs;
}

export function drawCommonEnemyHitFrameArt(
  graphic: PixiGraphics,
  options: {
    animation: EnemySpriteAnimationState;
    palette: PixelPalette;
    radius: number;
    templateId: CommonEnemyTemplate["id"];
    variant: CommonEnemyVisualVariant;
  },
): void {
  const intensity = hitFrameIntensity(options.animation.hitFlashAlpha);
  if (intensity <= 0) {
    return;
  }
  if (options.templateId === "fast-fragile") {
    drawFastHitFrame(graphic, { ...options, intensity });
    return;
  }
  if (options.templateId === "slow-tough") {
    drawSlowHitFrame(graphic, { ...options, intensity });
    return;
  }
  drawSwarmHitFrame(graphic, { ...options, intensity });
}

function drawFastHitFrame(
  graphic: PixiGraphics,
  options: HitDrawOptions,
): void {
  const { animation, intensity, palette, radius, variant } = options;
  const shear = 6 + intensity * 10;
  for (const side of [-1, 1]) {
    const s = side as -1 | 1;
    drawOutlinedPoly(
      graphic,
      [
        s * (radius * 0.8),
        -radius * 0.62,
        s * (radius * (1.44 + variant.wingSpan * 0.25)),
        -radius * (0.78 + intensity * 0.18),
        s * (radius * (1.1 + variant.wingSpan * 0.18)),
        -radius * 0.12 + shear * 0.25,
      ],
      palette.core,
      palette.dark,
      0.38 + intensity * 0.42,
    );
    drawOutlinedSegment(
      graphic,
      { x: s * radius * 0.44, y: radius * 0.12 },
      { x: s * (radius * 1.28 + shear), y: radius * 0.52 + animation.recoilY },
      4,
      palette.accent,
      palette.dark,
      0.44 + intensity * 0.34,
    );
    drawOutlinedSegment(
      graphic,
      { x: s * radius * 0.08, y: -radius * 0.48 },
      { x: s * (radius * 0.74 + shear * 0.5), y: -radius * 0.18 + animation.recoilY },
      2,
      0xe8fbff,
      palette.dark,
      0.4 + intensity * 0.34,
    );
  }
  drawCrackedCore(graphic, radius, palette, intensity, { width: radius * 0.46, y: -radius * 0.04 });
}

function drawSlowHitFrame(
  graphic: PixiGraphics,
  options: HitDrawOptions,
): void {
  const { animation, intensity, palette, radius, variant } = options;
  const buckle = 5 + intensity * 10;
  for (const side of [-1, 1]) {
    const s = side as -1 | 1;
    for (let panel = 0; panel < 3; panel += 1) {
      const y = -radius * 0.52 + panel * radius * 0.32;
      drawArmorPanel(
        graphic,
        [
          s * radius * (0.16 + panel * 0.14),
          y - 3,
          s * radius * (0.72 + variant.armorBulk * 0.12),
          y - 8 + animation.recoilY,
          s * radius * (0.64 + variant.armorBulk * 0.1),
          y + 12,
          s * radius * (0.08 + panel * 0.1),
          y + 9,
        ],
        palette,
      0.36 + intensity * 0.34,
      );
    }
    drawOutlinedRect(
      graphic,
      s < 0 ? -radius - 25 - buckle : radius + 7 + buckle * 0.2,
      -radius * 0.18,
      18 + buckle,
      8,
      palette.core,
      palette.dark,
      0.42 + intensity * 0.32,
    );
  }
  drawCrackedCore(graphic, radius, palette, intensity, { width: radius * 0.82, y: -radius * 0.12 });
  for (let crack = 0; crack < 5; crack += 1) {
    const x = -radius * 0.54 + crack * radius * 0.27;
    drawOutlinedSegment(
      graphic,
      { x, y: -radius * 0.54 + (crack % 2) * 5 },
      { x: x + 7 + intensity * 4, y: radius * 0.46 - (crack % 3) * 3 },
      2,
      crack % 2 === 0 ? palette.accent : 0xe8fbff,
      palette.dark,
      0.34 + intensity * 0.28,
    );
  }
}

function drawSwarmHitFrame(
  graphic: PixiGraphics,
  options: HitDrawOptions,
): void {
  const { animation, intensity, palette, radius, variant } = options;
  const scatter = 5 + intensity * 12;
  for (let node = 0; node < 7; node += 1) {
    const angle = node * 2.399 + animation.frame * 0.24;
    const distance = radius * (0.48 + (node % 3) * 0.18) + scatter;
    const x = Math.cos(angle) * distance + variant.asymmetry;
    const y = Math.sin(angle) * distance;
    drawPixelJoint(
      graphic,
      x,
      y,
      2.6 + (node % 2),
      { ...palette, accent: node % 2 === 0 ? palette.core : palette.accent },
      0.46 + intensity * 0.32,
    );
    graphic
      .moveTo(x * 0.42, y * 0.42)
      .lineTo(x, y)
      .stroke({ color: node % 2 === 0 ? palette.accent : 0xe8fbff, width: 1, alpha: 0.34 + intensity * 0.28 });
  }
  drawCrackedCore(graphic, radius, palette, intensity, { width: radius * 0.42, y: -radius * 0.02 });
}

function drawCrackedCore(
  graphic: PixiGraphics,
  radius: number,
  palette: PixelPalette,
  intensity: number,
  options: { width: number; y: number },
): void {
  drawEmissiveSlit(graphic, -options.width * 0.5, options.y, options.width, 4 + intensity * 3, palette.core, 0.5 + intensity * 0.34);
  graphic
    .moveTo(-options.width * 0.4, options.y - radius * 0.18)
    .lineTo(-options.width * 0.08, options.y + radius * 0.18)
    .lineTo(options.width * 0.18, options.y - radius * 0.06)
    .lineTo(options.width * 0.46, options.y + radius * 0.22)
    .stroke({ color: 0xe8fbff, width: 1, alpha: 0.24 + intensity * 0.36 });
}

function hitFrameIntensity(hitFlashAlpha: number): number {
  return Math.max(0, Math.min(1, hitFlashAlpha / 0.82));
}

interface HitDrawOptions {
  animation: EnemySpriteAnimationState;
  intensity: number;
  palette: PixelPalette;
  radius: number;
  templateId: CommonEnemyTemplate["id"];
  variant: CommonEnemyVisualVariant;
}
