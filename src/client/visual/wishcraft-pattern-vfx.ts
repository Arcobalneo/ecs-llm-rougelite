import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";
import type { Point } from "../simulation/arena-math.js";
import {
  drawOutlinedPoly,
  drawOutlinedRect,
  drawPixelGlow,
} from "./pixel-primitives.js";
import {
  motifForTheme,
  type WishcraftThemeMotif,
} from "./wishcraft-theme-motifs.js";
import {
  paletteForWishcraftFeedback,
  themeIdForWishcraftFeedback,
  type WishcraftVfxPalette,
} from "./wishcraft-vfx-palette.js";
import { drawPatternMotif } from "./wishcraft/pattern/motif.js";
import {
  drawPatternThemeGlyph,
  patternThemeKitForTheme,
  type WishcraftPatternThemeKit,
} from "./wishcraft/pattern/theme-kits.js";
import {
  shouldCreateWishcraftPattern,
  wishcraftPatternOrigin,
  wishcraftPatternProfile,
  type WishcraftPatternProfile,
} from "./wishcraft/pattern/types.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface ActiveWishcraftPatternGraphic {
  bornAtSeconds: number;
  graphic: PixiGraphics;
  origin: Point;
  rotationSpeed: number;
  ttlSeconds: number;
}

export {
  shouldCreateWishcraftPattern,
  wishcraftPatternProfile,
} from "./wishcraft/pattern/types.js";

export function createWishcraftPatternGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
  loadout: readonly Wishcraft[],
): Omit<ActiveWishcraftPatternGraphic, "bornAtSeconds"> | undefined {
  const profile = wishcraftPatternProfile(event);
  const origin = wishcraftPatternOrigin(event);
  if (!profile || !origin || event.kind !== "wishcraft-hit") {
    return undefined;
  }
  const palette = paletteForWishcraftFeedback(event, loadout);
  const themeId = themeIdForWishcraftFeedback(event, loadout);
  const motif = motifForTheme(themeId);
  const themeKit = patternThemeKitForTheme(themeId);
  const graphic = new Graphics();
  drawWishcraftPattern(graphic, {
    direction: Math.atan2(event.position.y - event.origin.y, event.position.x - event.origin.x) + themeKit.angleOffset,
    motif,
    palette,
    profile,
    themeKit,
  });
  return {
    graphic,
    origin,
    rotationSpeed: rotationSpeedForPattern(profile.pattern),
    ttlSeconds: profile.ttlSeconds,
  };
}

export function wishcraftPatternProgress(options: {
  bornAtSeconds: number;
  nowSeconds: number;
  ttlSeconds: number;
}): number {
  const age = Math.max(0, options.nowSeconds - options.bornAtSeconds);
  return Math.min(1, age / options.ttlSeconds);
}

export function updateWishcraftPatternGraphic(
  pattern: ActiveWishcraftPatternGraphic,
  progress: number,
): void {
  pattern.graphic.position.set(pattern.origin.x, pattern.origin.y);
  pattern.graphic.rotation += pattern.rotationSpeed * (1 - progress * 0.42);
  pattern.graphic.alpha = 0.78 * (1 - progress * progress);
  pattern.graphic.scale.set(0.82 + progress * 0.72);
}

function drawWishcraftPattern(
  graphic: PixiGraphics,
  options: {
    direction: number;
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    profile: WishcraftPatternProfile;
    themeKit: WishcraftPatternThemeKit;
  },
): void {
  drawPixelGlow(graphic, 0, 0, options.profile.radius * 0.64, options.palette.color, 0.08);
  drawThemeKitIdentityMarks(graphic, options);
  switch (options.profile.pattern) {
    case "scatter-fan":
      drawScatterFanPattern(graphic, options);
      return;
    case "spiral-corkscrew":
      drawSpiralPattern(graphic, options);
      return;
    case "ricochet-node":
      drawRicochetPattern(graphic, options);
      return;
    case "missile-salvo":
      drawMissileSalvoPattern(graphic, options);
      return;
    case "beam-cap":
      drawBeamPrismPattern(graphic, options);
      return;
    case "area-nova":
      drawAreaNovaPattern(graphic, options);
      return;
    case "burst-array":
      drawBurstArrayPattern(graphic, options);
      return;
    case "summon-link":
      drawSummonLinkPattern(graphic, options);
      return;
    case "trigger-sigil":
      drawTriggerSigilPattern(graphic, options);
      return;
    default:
      drawBurstArrayPattern(graphic, options);
  }
}

function drawScatterFanPattern(
  graphic: PixiGraphics,
  options: PatternDrawOptions,
): void {
  const startAngle = options.direction - 0.52;
  for (let lane = 0; lane < options.profile.spokeCount; lane += 1) {
    const t = lane / Math.max(1, options.profile.spokeCount - 1);
    const angle = startAngle + t * (1.04 + options.themeKit.laneSkew * 0.42);
    const length = options.profile.radius * (0.72 + (lane % 3) * 0.08 + options.themeKit.ringBias * 0.018);
    graphic
      .moveTo(Math.cos(angle) * 20, Math.sin(angle) * 20)
      .lineTo(Math.cos(angle) * length, Math.sin(angle) * length)
      .stroke({ color: lane % 2 === 0 ? options.palette.color : options.palette.accent, width: lane % 3 === 0 ? 4 : 2, alpha: 0.24 });
    drawPatternMotif(graphic, {
      alpha: 0.5,
      motif: options.motif,
      palette: options.palette,
      rotation: angle,
      size: 7 + (lane % 3),
      x: Math.cos(angle) * length,
      y: Math.sin(angle) * length,
    });
    drawPatternThemeGlyph(graphic, {
      alpha: 0.48,
      kit: options.themeKit,
      palette: options.palette,
      rotation: angle,
      size: 7 + (lane % 3),
      x: Math.cos(angle) * length * 0.86,
      y: Math.sin(angle) * length * 0.86,
    });
  }
}

function drawSpiralPattern(
  graphic: PixiGraphics,
  options: PatternDrawOptions,
): void {
  for (let index = 0; index < options.profile.motifCount; index += 1) {
    const t = index / Math.max(1, options.profile.motifCount - 1);
    const angle = options.direction + t * Math.PI * (4.6 + options.themeKit.laneSkew);
    const distance = options.profile.radius * (0.18 + t * (0.68 + options.themeKit.ringBias * 0.012));
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    graphic
      .circle(x, y, 5 + (index % 3))
      .stroke({ color: index % 2 === 0 ? options.palette.color : options.palette.accent, width: 1, alpha: 0.26 });
    if (index > 0) {
      const prevT = (index - 1) / Math.max(1, options.profile.motifCount - 1);
      const prevAngle = options.direction + prevT * Math.PI * 4.6;
      const prevDistance = options.profile.radius * (0.18 + prevT * 0.7);
      graphic
        .moveTo(Math.cos(prevAngle) * prevDistance, Math.sin(prevAngle) * prevDistance)
        .lineTo(x, y)
        .stroke({ color: options.palette.color, width: 2, alpha: 0.18 });
    }
    drawPatternMotif(graphic, {
      alpha: 0.42,
      motif: options.motif,
      palette: options.palette,
      rotation: angle,
      size: 5 + (index % 4),
      x,
      y,
    });
    if (index % 2 === 0) {
      drawPatternThemeGlyph(graphic, {
        alpha: 0.38,
        kit: options.themeKit,
        palette: options.palette,
        rotation: angle,
        size: 5 + (index % 4),
        x: x * 0.92,
        y: y * 0.92,
      });
    }
  }
}

function drawRicochetPattern(
  graphic: PixiGraphics,
  options: PatternDrawOptions,
): void {
  const nodes = [
    { x: -options.profile.radius * 0.55, y: options.profile.radius * (0.16 + options.themeKit.laneSkew * 0.05) },
    { x: -options.profile.radius * 0.12, y: -options.profile.radius * (0.32 + options.themeKit.ringBias * 0.01) },
    { x: options.profile.radius * 0.33, y: options.profile.radius * (0.02 + options.themeKit.laneSkew * 0.04) },
    { x: options.profile.radius * 0.62, y: -options.profile.radius * (0.24 + options.themeKit.ringBias * 0.008) },
  ];
  for (let index = 1; index < nodes.length; index += 1) {
    graphic
      .moveTo(nodes[index - 1].x, nodes[index - 1].y)
      .lineTo(nodes[index].x, nodes[index].y)
      .stroke({ color: index % 2 === 0 ? options.palette.accent : options.palette.color, width: 4, alpha: 0.22 });
  }
  for (const [index, node] of nodes.entries()) {
    drawOutlinedRect(graphic, node.x - 8, node.y - 8, 16, 16, index % 2 === 0 ? options.palette.accent : options.palette.color, 0x020612, 0.48);
    drawPatternMotif(graphic, {
      alpha: 0.44,
      motif: options.motif,
      palette: options.palette,
      rotation: index,
      size: 6,
      x: node.x,
      y: node.y,
    });
    drawPatternThemeGlyph(graphic, {
      alpha: 0.5,
      kit: options.themeKit,
      palette: options.palette,
      rotation: index,
      size: 6,
      x: node.x + (index % 2 === 0 ? 14 : -14),
      y: node.y,
    });
  }
}

function drawMissileSalvoPattern(
  graphic: PixiGraphics,
  options: PatternDrawOptions,
): void {
  const lanes = Math.max(5, options.profile.spokeCount);
  for (let lane = 0; lane < lanes; lane += 1) {
    const offset = (lane - (lanes - 1) / 2) * (18 + options.themeKit.ringBias);
    const curve = (lane % 2 === 0 ? -34 : 34) + options.themeKit.laneSkew * 28;
    graphic
      .moveTo(-options.profile.radius * 0.55, offset)
      .quadraticCurveTo(0, offset + curve, options.profile.radius * 0.55, offset * 0.3)
      .stroke({ color: lane % 2 === 0 ? options.palette.color : options.palette.accent, width: 2, alpha: 0.2 });
    drawOutlinedPoly(
      graphic,
      [
        options.profile.radius * 0.45,
        offset * 0.3 - 7,
        options.profile.radius * 0.63,
        offset * 0.3,
        options.profile.radius * 0.45,
        offset * 0.3 + 7,
      ],
      lane % 2 === 0 ? options.palette.color : options.palette.accent,
      0x020612,
      0.44,
    );
    drawPatternThemeGlyph(graphic, {
      alpha: 0.44,
      kit: options.themeKit,
      palette: options.palette,
      rotation: curve,
      size: 6,
      x: options.profile.radius * 0.34,
      y: offset * 0.26 + curve * 0.08,
    });
  }
}

function drawBeamPrismPattern(
  graphic: PixiGraphics,
  options: PatternDrawOptions,
): void {
  for (const y of [-36, -18, 0, 18, 36].map((lane) => lane + options.themeKit.laneSkew * 12)) {
    graphic
      .rect(-options.profile.radius * 0.72, y - 2, options.profile.radius * 1.44, 4)
      .fill({ color: y === 0 ? options.palette.accent : options.palette.color, alpha: y === 0 ? 0.34 : 0.16 });
  }
  for (let index = 0; index < options.profile.motifCount; index += 1) {
    const x = -options.profile.radius * 0.55 + (index / Math.max(1, options.profile.motifCount - 1)) * options.profile.radius * 1.1;
    drawPatternMotif(graphic, {
      alpha: 0.38,
      motif: options.motif,
      palette: options.palette,
      size: 5 + (index % 3),
      x,
      y: index % 2 === 0 ? -46 : 46,
    });
    drawPatternThemeGlyph(graphic, {
      alpha: 0.34,
      kit: options.themeKit,
      palette: options.palette,
      size: 5 + (index % 3),
      x,
      y: index % 2 === 0 ? -58 : 58,
    });
  }
}

function drawAreaNovaPattern(
  graphic: PixiGraphics,
  options: PatternDrawOptions,
): void {
  for (let ring = 0; ring < 5 + Math.min(2, options.themeKit.ringBias); ring += 1) {
    graphic.circle(0, 0, options.profile.radius * (0.22 + ring * (0.145 + options.themeKit.laneSkew * 0.01))).stroke({
      color: ring % 2 === 0 ? options.palette.color : options.palette.accent,
      width: ring === 0 ? 4 : 2,
      alpha: 0.22 - ring * 0.026,
    });
  }
  drawRadialMotifs(graphic, options, 0.78);
}

function drawBurstArrayPattern(
  graphic: PixiGraphics,
  options: PatternDrawOptions,
): void {
  for (let spoke = 0; spoke < options.profile.spokeCount; spoke += 1) {
    const angle = (spoke / options.profile.spokeCount) * Math.PI * 2 + options.direction + options.themeKit.laneSkew * 0.12;
    const inner = options.profile.radius * 0.18;
    const outer = options.profile.radius * (0.72 + (spoke % 3) * 0.08 + options.themeKit.ringBias * 0.014);
    graphic
      .moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      .lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
      .stroke({ color: spoke % 2 === 0 ? options.palette.color : options.palette.accent, width: spoke % 4 === 0 ? 4 : 2, alpha: 0.24 });
  }
  drawRadialMotifs(graphic, options, 0.66);
}

function drawSummonLinkPattern(
  graphic: PixiGraphics,
  options: PatternDrawOptions,
): void {
  for (let satellite = 0; satellite < 5; satellite += 1) {
    const angle = satellite * Math.PI * (0.4 + options.themeKit.laneSkew * 0.02) + 0.25 + options.themeKit.angleOffset;
    const x = Math.cos(angle) * options.profile.radius * (0.5 + options.themeKit.ringBias * 0.01);
    const y = Math.sin(angle) * options.profile.radius * (0.5 + options.themeKit.ringBias * 0.01);
    graphic
      .circle(x, y, 18)
      .stroke({ color: options.palette.accent, width: 3, alpha: 0.26 })
      .moveTo(0, 0)
      .lineTo(x, y)
      .stroke({ color: options.palette.color, width: 2, alpha: 0.16 });
    drawPatternMotif(graphic, { alpha: 0.44, motif: options.motif, palette: options.palette, size: 7, x, y });
    drawPatternThemeGlyph(graphic, { alpha: 0.42, kit: options.themeKit, palette: options.palette, rotation: angle, size: 8, x: x * 1.12, y: y * 1.12 });
  }
}

function drawTriggerSigilPattern(
  graphic: PixiGraphics,
  options: PatternDrawOptions,
): void {
  for (let side = 0; side < 6; side += 1) {
    const a = side * Math.PI / 3 + options.themeKit.angleOffset;
    const b = a + Math.PI / 3;
    graphic
      .moveTo(Math.cos(a) * options.profile.radius * 0.34, Math.sin(a) * options.profile.radius * 0.34)
      .lineTo(Math.cos(b) * options.profile.radius * 0.72, Math.sin(b) * options.profile.radius * 0.72)
      .stroke({ color: side % 2 === 0 ? options.palette.accent : options.palette.color, width: 4, alpha: 0.24 });
  }
  drawAreaNovaPattern(graphic, options);
}

function drawRadialMotifs(
  graphic: PixiGraphics,
  options: PatternDrawOptions,
  radiusScale: number,
): void {
  for (let index = 0; index < options.profile.motifCount; index += 1) {
    const angle = index * 2.399 + options.direction + options.themeKit.angleOffset * 0.3;
    const distance = options.profile.radius * (0.24 + (index % 5) * 0.09 + options.themeKit.ringBias * 0.01) * radiusScale;
    drawPatternMotif(graphic, {
      alpha: 0.42,
      motif: options.motif,
      palette: options.palette,
      rotation: angle,
      size: 5 + (index % 4),
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    });
    if (index % 2 === 0) {
      drawPatternThemeGlyph(graphic, {
        alpha: 0.42,
        kit: options.themeKit,
        palette: options.palette,
        rotation: angle,
        size: 5 + (index % 4),
        x: Math.cos(angle) * distance * 1.08,
        y: Math.sin(angle) * distance * 1.08,
      });
    }
  }
}

function drawThemeKitIdentityMarks(
  graphic: PixiGraphics,
  options: PatternDrawOptions,
): void {
  const radius = options.profile.radius * (0.22 + options.themeKit.ringBias * 0.018);
  drawPatternThemeGlyph(graphic, {
    alpha: 0.88,
    kit: options.themeKit,
    palette: options.palette,
    rotation: options.direction,
    size: 13 + options.themeKit.ringBias * 1.5,
    x: 0,
    y: 0,
  });
  for (let mark = 0; mark < 4; mark += 1) {
    const angle = options.direction + options.themeKit.angleOffset + mark * Math.PI * 0.5;
    drawPatternThemeGlyph(graphic, {
      alpha: 0.5,
      kit: options.themeKit,
      palette: options.palette,
      rotation: angle,
      size: 7 + (mark % 2) * 2,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
}

function rotationSpeedForPattern(pattern: string): number {
  if (pattern === "spiral-corkscrew") {
    return 0.24;
  }
  if (pattern === "trigger-sigil") {
    return -0.16;
  }
  if (pattern === "area-nova" || pattern === "burst-array") {
    return 0.11;
  }
  return 0.04;
}

type PatternDrawOptions = {
  direction: number;
  motif: WishcraftThemeMotif;
  palette: WishcraftVfxPalette;
  profile: WishcraftPatternProfile;
  themeKit: WishcraftPatternThemeKit;
};
