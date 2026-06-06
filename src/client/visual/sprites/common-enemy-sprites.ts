import type { CombatLoopEnemy } from "../../simulation/combat-loop.js";
import type { EnemyDriftVisualState } from "../arena-visual-state.js";
import type { EnemySpriteAnimationState } from "../combat-entity-animation.js";
import { drawCommonEnemyDriftSockets } from "./common-enemy-drift-sockets.js";
import { drawCommonEnemyFrameArt } from "./common-enemy-frame-art.js";
import { drawCommonEnemyHitFrameArt } from "./common-enemy-hit-frame-art.js";
import { drawCommonEnemyMotionArt } from "./common-enemy-motion-art.js";
import {
  commonEnemyVisualVariant,
  type CommonEnemyVisualVariant,
} from "../common-enemy-variants.js";
import {
  drawCableBundle,
  drawHeatSinkStack,
  drawPanelSeams,
  drawRivetCluster,
} from "../mech-detail-primitives.js";
import {
  drawArmorPanel,
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawOutlinedSegment,
  drawPixelGlow,
  drawPixelHighlights,
  drawPixelJoint,
  drawPixelStamp,
  drawSensorPair,
  drawThruster,
  type PixelPalette,
  type PixelStampRows,
} from "../pixel-primitives.js";
import { drawCompactAttachment } from "../runtime-attachments.js";
import { layoutRuntimeVisualAttachments, type RuntimeVisualAssembly } from "../visual-assembly.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

const fastFragileStamp: PixelStampRows = [
  ".....aa.....",
  "....aCCa....",
  "...tACCA...",
  "..ttACCAtt..",
  ".tAACCCCAAt.",
  "ttdAeeCCAdtt",
  ".ttAccccAtt.",
  "..dAAddAAd..",
  "...dAggAd...",
  "....tggt....",
  ".....gg.....",
];

const slowToughStamp: PixelStampRows = [
  "...tttttt...",
  "..tAAAAAAt..",
  ".tAAddddAAt.",
  "tAAdAeeeAdAt",
  "tAddACCCAddt",
  "tAddeeeeddAt",
  ".tAAddddAAt.",
  "..tAAAccAAt.",
  ".ttdd..ddtt.",
  "tgg......ggt",
];

const swarmFragileStamp: PixelStampRows = [
  "...t..t...",
  "..tAeeAt..",
  ".tAAccAAt.",
  "ttdACCCdtt",
  ".tdAeeAdt.",
  "ttdAAddtt",
  ".tAggAggt.",
  "g..gggg..g",
];

export function createCommonEnemyGraphic(options: {
  animation: EnemySpriteAnimationState;
  drift: EnemyDriftVisualState;
  enemy: CombatLoopEnemy;
  Graphics: PixiGraphicsCtor;
  visuals: RuntimeVisualAssembly;
}): PixiGraphics {
  const graphic = new options.Graphics();
  redrawCommonEnemyGraphic(graphic, options);
  return graphic;
}

export function redrawCommonEnemyGraphic(
  graphic: PixiGraphics,
  options: {
    animation: EnemySpriteAnimationState;
    drift: EnemyDriftVisualState;
    enemy: CombatLoopEnemy;
    visuals: RuntimeVisualAssembly;
  },
): void {
  const templateColor =
    options.enemy.templateId === "slow-tough"
      ? 0xff4fd8
      : options.enemy.templateId === "fast-fragile"
        ? 0xfff06a
        : 0x75ff9a;
  const attachmentColor = options.visuals.attachments[0]?.palette[options.visuals.attachments[0].paletteRole];
  const baseColor = options.drift.dominantThemeId ? options.drift.tintColor : (attachmentColor ?? templateColor);
  const accent = options.drift.accentColor;
  const radius = options.enemy.radius;
  const palette = enemyPalette({ accent, baseColor, templateColor });
  const variant = commonEnemyVisualVariant({
    enemyId: options.enemy.id,
    templateId: options.enemy.templateId,
  });
  graphic.clear();
  drawPixelGlow(graphic, 0, 0, radius + 10, baseColor, 0.075);
  drawCommonEnemyMotionArt(graphic, {
    animation: options.animation,
    palette,
    radius,
    templateId: options.enemy.templateId,
    variant,
  });
  if (options.enemy.templateId === "fast-fragile") {
    drawFastFragileEnemy(graphic, radius, palette, options.animation, variant);
  } else if (options.enemy.templateId === "slow-tough") {
    drawSlowToughEnemy(graphic, radius, palette, options.animation, variant);
  } else {
    drawSwarmFragileEnemy(graphic, radius, palette, options.animation, variant);
  }
  drawCommonEnemyFrameArt(graphic, {
    animation: options.animation,
    palette,
    radius,
    templateId: options.enemy.templateId,
    variant,
  });
  drawCommonEnemyHitFrameArt(graphic, {
    animation: options.animation,
    palette,
    radius,
    templateId: options.enemy.templateId,
    variant,
  });
  drawCommonEnemyDriftSockets(graphic, {
    animation: options.animation,
    drift: options.drift,
    palette,
    radius,
    templateId: options.enemy.templateId,
    variant,
  });
  if (options.animation.hitFlashAlpha > 0) {
    graphic
      .circle(0, 0, radius + 8)
      .fill({ color: 0xe8fbff, alpha: options.animation.hitFlashAlpha * 0.08 })
      .stroke({ color: 0xe8fbff, width: 2, alpha: options.animation.hitFlashAlpha * 0.52 });
  }
  graphic
    .circle(0, 0, radius + 5)
    .stroke({ color: baseColor, width: 1, alpha: options.enemy.templateId === "slow-tough" ? 0.14 : 0.24 })
    .circle(0, 0, radius + 9)
    .stroke({ color: accent, width: 1, alpha: options.enemy.templateId === "slow-tough" ? 0.06 : 0.11 });
  for (const layout of layoutRuntimeVisualAttachments(options.visuals.attachments.slice(0, 3))) {
    drawCompactAttachment(graphic, layout.attachment, layout.slotIndex, options.enemy.radius);
  }
}

function drawFastFragileEnemy(
  graphic: PixiGraphics,
  radius: number,
  palette: PixelPalette,
  animation: EnemySpriteAnimationState,
  variant: CommonEnemyVisualVariant,
): void {
  const wingLift = 2 + animation.phase * 4;
  const frameShift = (animation.frame % 2 === 0 ? -1 : 1) * 2;
  const wingReach = variant.wingSpan;
  drawOutlinedPoly(
    graphic,
    [-radius - 20 * wingReach, -2 + frameShift, -radius - 5, -13 - wingLift, -radius + 4, 2, -radius - 13 * wingReach, 12 + frameShift],
    palette.trim,
    palette.dark,
    0.82,
  );
  drawOutlinedPoly(
    graphic,
    [radius + 20 * wingReach, -2 - frameShift, radius + 5, -13 - wingLift, radius - 4, 2, radius + 13 * wingReach, 12 - frameShift],
    palette.trim,
    palette.dark,
    0.82,
  );
  drawOutlinedSegment(graphic, { x: -radius - 7, y: 7 }, { x: -radius - 18, y: 17 }, 3, palette.accent, palette.dark, 0.72);
  drawOutlinedSegment(graphic, { x: radius + 7, y: 7 }, { x: radius + 18, y: 17 }, 3, palette.accent, palette.dark, 0.72);
  drawPixelStamp(graphic, fastFragileStamp, 4, palette, { y: -23 });
  drawArmorPanel(graphic, [-9, -21, 9, -21, 13, -10, 0, -4, -13, -10], palette, 0.72);
  drawPanelSeams(
    graphic,
    [
      { from: { x: -18, y: -7 }, to: { x: -4, y: 6 }, width: 1, alpha: 0.3 },
      { from: { x: 18, y: -7 }, to: { x: 4, y: 6 }, width: 1, alpha: 0.3 },
      { from: { x: -9, y: 12 }, to: { x: 9, y: 12 }, width: 1, alpha: 0.34 },
    ],
    palette,
  );
  drawRivetCluster(
    graphic,
    [
      { x: -17, y: -16, radius: 1.4 },
      { x: 17, y: -16, radius: 1.4 },
      { x: -12, y: 6, radius: 1.2, alpha: 0.44 },
      { x: 12, y: 6, radius: 1.2, alpha: 0.44 },
    ],
    palette,
  );
  drawSensorPair(graphic, -6, -15, 4, 3, palette);
  drawEmissiveSlit(graphic, -3, -radius - 10, 6, 13, palette.core, 0.84);
  drawEmissiveSlit(graphic, -2, 3, 4, radius * 0.88, palette.accent, 0.66);
  drawThruster(graphic, -4, radius + 1, 8, 11 + animation.thrust * 6, palette, "down");
  drawFastVariantDetails(graphic, radius, palette, animation, variant);
  for (const side of [-1, 1]) {
    drawPixelJoint(graphic, side * (radius + 1), 2, 3, palette, 0.74);
    drawEmissiveSlit(graphic, side * (radius + 3), 1, side * 5, 3, palette.accent, 0.72);
  }
}

function drawSlowToughEnemy(
  graphic: PixiGraphics,
  radius: number,
  palette: PixelPalette,
  animation: EnemySpriteAnimationState,
  variant: CommonEnemyVisualVariant,
): void {
  const phase = animation.phase;
  const tread = (animation.frame % 2 === 0 ? -1 : 1) * 2;
  const bulk = variant.armorBulk;
  drawOutlinedPoly(
    graphic,
    [
      -radius * (1.12 + bulk * 0.18),
      -radius * 0.42,
      -radius * (0.78 + bulk * 0.18),
      -radius * 0.82,
      radius * (0.78 + bulk * 0.18),
      -radius * 0.82,
      radius * (1.12 + bulk * 0.18),
      -radius * 0.42,
      radius * (1.24 + bulk * 0.16),
      radius * 0.42,
      radius * 0.72,
      radius * 0.86,
      -radius * 0.72,
      radius * 0.86,
      -radius * (1.24 + bulk * 0.16),
      radius * 0.42,
    ],
    palette.dark,
    palette.dark,
    0.58,
  );
  for (const side of [-1, 1]) {
    drawArmorPanel(
      graphic,
      side < 0
        ? [-radius - 20 * variant.sidePodScale, -10, -radius - 4, -17, -radius + 3, 5, -radius - 14 * variant.sidePodScale, 12]
        : [radius + 20 * variant.sidePodScale, -10, radius + 4, -17, radius - 3, 5, radius + 14 * variant.sidePodScale, 12],
      palette,
      0.78,
    );
    drawOutlinedRect(graphic, side < 0 ? -radius - 24 : radius + 6, -2 + tread, 18, 7, palette.trim, palette.dark, 0.58 + phase * 0.08);
    drawOutlinedRect(graphic, side < 0 ? -radius - 22 : radius + 7, 12 - tread, 17, 8, palette.accent, palette.dark, 0.46 + phase * 0.1);
    drawThruster(graphic, side < 0 ? -radius - 22 : radius + 15, -4, 7, 8 + animation.thrust * 6, palette, side < 0 ? "left" : "right");
  }
  drawPixelStamp(graphic, slowToughStamp, 5, palette, { y: -25 });
  drawOutlinedRect(graphic, -radius * 0.95, radius * 0.52, radius * 1.9, 7, palette.trim, palette.dark, 0.52);
  drawOutlinedRect(graphic, -radius * 0.78, -radius * 0.48, radius * 1.56, radius * 0.96, palette.dark, palette.dark, 0.22);
  drawHeatSinkStack(graphic, { count: 5, height: 2, palette, width: radius * 0.95, x: -radius * 0.48, y: -radius * 0.78 });
  drawPanelSeams(
    graphic,
    [
      { from: { x: -radius * 0.84, y: -radius * 0.12 }, to: { x: radius * 0.84, y: -radius * 0.12 }, width: 1, alpha: 0.32 },
      { from: { x: -radius * 0.56, y: radius * 0.26 }, to: { x: radius * 0.56, y: radius * 0.26 }, width: 1, alpha: 0.3 },
      { from: { x: -radius * 0.22, y: -radius * 0.47 }, to: { x: -radius * 0.22, y: radius * 0.44 }, width: 1, alpha: 0.28 },
      { from: { x: radius * 0.22, y: -radius * 0.47 }, to: { x: radius * 0.22, y: radius * 0.44 }, width: 1, alpha: 0.28 },
    ],
    palette,
  );
  drawEmissiveSlit(graphic, -radius * 0.42, -radius * 0.24, radius * 0.84, 5, palette.core, 0.86);
  drawEmissiveSlit(graphic, -radius * 0.25, radius * 0.13, radius * 0.5, 4, palette.accent, 0.66);
  drawSlowVariantDetails(graphic, radius, palette, animation, variant);
  drawPixelHighlights(graphic, [
    { x: -18, y: -11, width: 5, height: 14, color: palette.trim },
    { x: 13, y: -11, width: 5, height: 14, color: palette.trim },
    { x: -7, y: 9, width: 14, height: 3, color: palette.accent },
  ]);
  graphic
    .circle(0, 0, radius + 7)
    .stroke({ color: palette.accent, width: 2, alpha: 0.18 + phase * 0.1 });
}

function drawSwarmFragileEnemy(
  graphic: PixiGraphics,
  radius: number,
  palette: PixelPalette,
  animation: EnemySpriteAnimationState,
  variant: CommonEnemyVisualVariant,
): void {
  const phase = animation.phase;
  const flap = 1 + phase * 3;
  const split = animation.frame % 2 === 0 ? 1.5 : -1.5;
  const wingSpan = variant.wingSpan;
  drawOutlinedRect(graphic, -radius - 7 * wingSpan, -radius * 0.58 - flap, radius * 0.78 * wingSpan, radius * 0.7, palette.trim, palette.dark, 0.78);
  drawOutlinedRect(graphic, radius * 0.3, -radius * 0.58 - flap, radius * 0.78 * wingSpan, radius * 0.7, palette.trim, palette.dark, 0.78);
  drawOutlinedRect(graphic, -radius - 5 * wingSpan - split, radius * 0.16 + flap, radius * 0.68 * wingSpan, radius * 0.58, palette.trim, palette.dark, 0.68);
  drawOutlinedRect(graphic, radius * 0.38 + split, radius * 0.16 + flap, radius * 0.68 * wingSpan, radius * 0.58, palette.trim, palette.dark, 0.68);
  drawPixelStamp(graphic, swarmFragileStamp, 4, palette, { y: -17 });
  drawCableBundle(graphic, {
    count: 2,
    from: { x: -radius * 0.58, y: -radius * 0.15 },
    palette,
    sag: 3,
    to: { x: radius * 0.58, y: -radius * 0.15 },
  });
  drawRivetCluster(
    graphic,
    [
      { x: -radius * 0.58, y: -radius * 0.48, radius: 1.1, alpha: 0.4 },
      { x: radius * 0.58, y: -radius * 0.48, radius: 1.1, alpha: 0.4 },
      { x: -radius * 0.42, y: radius * 0.35, radius: 1.1, alpha: 0.36 },
      { x: radius * 0.42, y: radius * 0.35, radius: 1.1, alpha: 0.36 },
    ],
    palette,
  );
  drawSensorPair(graphic, -5, -12, 3, 3, palette);
  drawEmissiveSlit(graphic, -3, -radius - 8, 6, 7, palette.core, 0.82);
  drawEmissiveSlit(graphic, -2, -2, 4, radius * 0.9, palette.accent, 0.64);
  drawThruster(graphic, -4, radius + 1, 8, 8 + animation.thrust * 6, palette, "down");
  drawSwarmVariantDetails(graphic, radius, palette, animation, variant);
  for (const side of [-1, 1]) {
    drawPixelJoint(graphic, side * (radius + 1), -radius * 0.1, 2.5, palette, 0.72);
    graphic
      .moveTo(side * (radius + 2), -radius * 0.2)
      .lineTo(side * (radius + 10), -radius * 0.45 - flap)
      .stroke({ color: palette.accent, width: 2, alpha: 0.42 })
      .moveTo(side * (radius + 1), radius * 0.32)
      .lineTo(side * (radius + 8), radius * 0.54 + flap)
      .stroke({ color: palette.accent, width: 2, alpha: 0.34 });
  }
}

function drawFastVariantDetails(
  graphic: PixiGraphics,
  radius: number,
  palette: PixelPalette,
  animation: EnemySpriteAnimationState,
  variant: CommonEnemyVisualVariant,
): void {
  const asymmetry = variant.asymmetry;
  const noseY = -radius - 10 - variant.hornLength * 0.45;
  drawOutlinedPoly(
    graphic,
    [-5, -radius - 8, 0, noseY, 5, -radius - 8, asymmetry * 3, -radius - 3],
    variant.id % 2 === 0 ? palette.accent : palette.trim,
    palette.dark,
    0.58,
  );
  for (let index = 0; index < variant.antennaCount; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const offset = Math.ceil(index / 2) * 4;
    graphic
      .moveTo(side * (7 + offset), -radius - 3)
      .lineTo(side * (12 + offset), -radius - variant.hornLength - animation.phase * 2)
      .stroke({ color: palette.accent, width: 1, alpha: 0.42 });
  }
  for (let engine = 0; engine < variant.engineCount; engine += 1) {
    const offset = (engine - (variant.engineCount - 1) / 2) * 7;
    drawThruster(graphic, -3 + offset, radius + 5, 6, 7 + animation.thrust * 4, palette, "down");
  }
}

function drawSlowVariantDetails(
  graphic: PixiGraphics,
  radius: number,
  palette: PixelPalette,
  animation: EnemySpriteAnimationState,
  variant: CommonEnemyVisualVariant,
): void {
  const bulk = variant.armorBulk;
  drawArmorPanel(
    graphic,
    [-radius * 0.54 * bulk, -radius - 4, -8, -radius - 14 - variant.hornLength, 0, -radius - 7, 8, -radius - 14 - variant.hornLength, radius * 0.54 * bulk, -radius - 4],
    palette,
    0.42,
  );
  for (let index = 0; index < variant.engineCount; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    drawThruster(
      graphic,
      side < 0 ? -radius - 20 - row * 3 : radius + 13 + row * 3,
      -13 + row * 11,
      7,
      7 + animation.thrust * 4,
      palette,
      side < 0 ? "left" : "right",
    );
  }
  for (let antenna = 0; antenna < variant.antennaCount; antenna += 1) {
    const side = antenna % 2 === 0 ? -1 : 1;
    graphic
      .moveTo(side * (radius * 0.38 + antenna * 3), -radius * 0.78)
      .lineTo(side * (radius * 0.62 + antenna * 5), -radius * 1.18 - animation.phase * 3)
      .stroke({ color: palette.accent, width: 1, alpha: 0.38 });
  }
  drawEmissiveSlit(graphic, -radius * 0.28 + variant.sensorOffset, -radius * 0.02, radius * 0.56, 3, palette.core, 0.54);
}

function drawSwarmVariantDetails(
  graphic: PixiGraphics,
  radius: number,
  palette: PixelPalette,
  animation: EnemySpriteAnimationState,
  variant: CommonEnemyVisualVariant,
): void {
  for (let node = 0; node < variant.engineCount + 2; node += 1) {
    const angle = node * 2.399 + variant.id * 0.4;
    const distance = radius * (0.72 + (node % 3) * 0.18) * variant.sidePodScale;
    const x = Math.cos(angle) * distance + variant.asymmetry * 1.5;
    const y = Math.sin(angle) * distance + animation.phase * 2;
    graphic
      .circle(x, y, 3 + (node % 2))
      .fill({ color: node % 2 === 0 ? palette.accent : palette.trim, alpha: 0.52 })
      .circle(x, y, 6 + (node % 3))
      .stroke({ color: palette.core, width: 1, alpha: 0.22 });
  }
  for (let antenna = 0; antenna < variant.antennaCount; antenna += 1) {
    const side = antenna % 2 === 0 ? -1 : 1;
    const offset = Math.floor(antenna / 2) * 4;
    graphic
      .moveTo(side * (4 + offset), -radius - 3)
      .lineTo(side * (8 + offset), -radius - variant.hornLength - animation.phase * 2)
      .stroke({ color: palette.accent, width: 1, alpha: 0.36 });
  }
}

function enemyPalette(options: {
  accent: number;
  baseColor: number;
  templateColor: number;
}): PixelPalette {
  return {
    accent: options.accent,
    armor: options.baseColor,
    core: 0xe8fbff,
    dark: 0x020612,
    glow: options.templateColor,
    trim: 0x8295a8,
  };
}
