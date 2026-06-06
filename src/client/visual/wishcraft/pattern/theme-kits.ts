import type { ThemeId } from "../../../../shared/wishcraft/types.js";
import {
  drawGearShard,
  drawOutlinedPoly,
  drawStarSpark,
} from "../../pixel-primitives.js";
import type { WishcraftVfxPalette } from "../../wishcraft-vfx-palette.js";

type PixiGraphics = import("pixi.js").Graphics;

export type PatternThemeGlyph =
  | "angel-wing"
  | "blade-slash"
  | "clock-gear"
  | "crystal-prism"
  | "demon-fang"
  | "dragon-scale"
  | "forest-leaf"
  | "frost-ice"
  | "gravity-lens"
  | "lunar-crescent"
  | "magnetic-rail"
  | "meteor-rock"
  | "music-note"
  | "neon-pixel"
  | "ocean-wave"
  | "plasma-bead"
  | "quantum-frame"
  | "shield-hex"
  | "solar-flare"
  | "star-spark"
  | "storm-gust"
  | "swarm-node"
  | "thunder-fork"
  | "void-rift";

export interface WishcraftPatternThemeKit {
  angleOffset: number;
  glyph: PatternThemeGlyph;
  laneSkew: number;
  motifScale: number;
  ringBias: number;
  secondaryAlpha: number;
  themeId: ThemeId;
}

const patternThemeKits: Record<ThemeId, WishcraftPatternThemeKit> = {
  angel: kit("angel", "angel-wing", 0.36, 1, 0.08, 1.08, 0.24),
  blade: kit("blade", "blade-slash", -0.24, 0, 0.18, 1.05, 0.22),
  clockwork: kit("clockwork", "clock-gear", 0.18, 2, -0.04, 0.96, 0.25),
  crystal: kit("crystal", "crystal-prism", 0.12, 1, 0.04, 1.12, 0.23),
  demon: kit("demon", "demon-fang", -0.42, 0, 0.14, 1.08, 0.27),
  dragon: kit("dragon", "dragon-scale", -0.12, 1, 0.1, 1.04, 0.28),
  forest: kit("forest", "forest-leaf", 0.5, 2, -0.08, 0.98, 0.2),
  frost: kit("frost", "frost-ice", -0.06, 2, 0.02, 1.16, 0.18),
  gravity: kit("gravity", "gravity-lens", 0.28, 3, -0.12, 1, 0.24),
  lunar: kit("lunar", "lunar-crescent", -0.3, 1, -0.1, 1.06, 0.2),
  magnetic: kit("magnetic", "magnetic-rail", 0.08, 0, 0.22, 0.94, 0.26),
  meteor: kit("meteor", "meteor-rock", -0.5, 1, 0.16, 1.1, 0.3),
  music: kit("music", "music-note", 0.44, 1, -0.06, 1, 0.25),
  neon: kit("neon", "neon-pixel", 0, 0, 0.12, 1, 0.28),
  ocean: kit("ocean", "ocean-wave", -0.18, 2, -0.16, 1.02, 0.21),
  plasma: kit("plasma", "plasma-bead", 0.22, 0, 0.2, 0.98, 0.29),
  quantum: kit("quantum", "quantum-frame", -0.38, 2, 0.06, 0.96, 0.27),
  shield: kit("shield", "shield-hex", 0.16, 3, -0.02, 1.04, 0.2),
  solar: kit("solar", "solar-flare", 0.04, 2, 0.14, 1.12, 0.26),
  starfire: kit("starfire", "star-spark", -0.08, 1, 0.12, 1.08, 0.3),
  storm: kit("storm", "storm-gust", 0.32, 0, 0.18, 1, 0.24),
  swarm: kit("swarm", "swarm-node", -0.46, 1, -0.18, 0.92, 0.28),
  thunder: kit("thunder", "thunder-fork", 0.26, 0, 0.24, 1.02, 0.32),
  void: kit("void", "void-rift", -0.2, 3, -0.14, 1.06, 0.28),
};

export function patternThemeKitForTheme(themeId: string | undefined): WishcraftPatternThemeKit {
  if (!themeId || !(themeId in patternThemeKits)) {
    return patternThemeKits.neon;
  }
  return patternThemeKits[themeId as ThemeId];
}

export function knownWishcraftPatternThemeKitCount(): number {
  return Object.keys(patternThemeKits).length;
}

export function patternThemeKitSignature(themeId: string | undefined): string {
  const kit = patternThemeKitForTheme(themeId);
  return [
    kit.themeId,
    kit.glyph,
    kit.angleOffset.toFixed(2),
    kit.ringBias,
    kit.laneSkew.toFixed(2),
    kit.motifScale.toFixed(2),
  ].join(":");
}

export function drawPatternThemeGlyph(
  graphic: PixiGraphics,
  options: {
    alpha: number;
    kit: WishcraftPatternThemeKit;
    palette: WishcraftVfxPalette;
    rotation?: number;
    size: number;
    x: number;
    y: number;
  },
): void {
  const alpha = options.alpha * options.kit.secondaryAlpha;
  const size = options.size * options.kit.motifScale;
  switch (options.kit.glyph) {
    case "angel-wing":
      drawWingGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "blade-slash":
      drawSlashGlyph(graphic, options.x, options.y, size, options.palette, alpha, options.rotation ?? 0);
      return;
    case "clock-gear":
      drawGearShard(graphic, options.x, options.y, size * 0.78, options.palette.accent, alpha);
      return;
    case "crystal-prism":
      drawPrismGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "demon-fang":
      drawFangGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "dragon-scale":
      drawScaleGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "forest-leaf":
      drawLeafGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "frost-ice":
      drawIceGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "gravity-lens":
      drawLensGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "lunar-crescent":
      drawCrescentGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "magnetic-rail":
      drawRailGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "meteor-rock":
      drawRockGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "music-note":
      drawNoteGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "neon-pixel":
      drawPixelGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "ocean-wave":
      drawWaveGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "plasma-bead":
      drawBeadGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "quantum-frame":
      drawFrameGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "shield-hex":
      drawHexGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "solar-flare":
      drawFlareGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "star-spark":
      drawStarSpark(graphic, options.x, options.y, options.palette.accent, alpha);
      return;
    case "storm-gust":
      drawGustGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "swarm-node":
      drawSwarmGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "thunder-fork":
      drawThunderGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
    case "void-rift":
      drawRiftGlyph(graphic, options.x, options.y, size, options.palette, alpha);
      return;
  }
}

function kit(
  themeId: ThemeId,
  glyph: PatternThemeGlyph,
  angleOffset: number,
  ringBias: number,
  laneSkew: number,
  motifScale: number,
  secondaryAlpha: number,
): WishcraftPatternThemeKit {
  return { angleOffset, glyph, laneSkew, motifScale, ringBias, secondaryAlpha, themeId };
}

function drawWingGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  drawOutlinedPoly(graphic, [x - size, y, x, y - size * 0.8, x + size, y, x, y + size * 0.3], palette.accent, 0x020612, alpha);
}

function drawSlashGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number, rotation: number): void {
  graphic
    .moveTo(x - Math.cos(rotation) * size, y - Math.sin(rotation) * size)
    .lineTo(x + Math.cos(rotation) * size, y + Math.sin(rotation) * size)
    .stroke({ color: palette.accent, width: 2, alpha });
}

function drawPrismGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  drawOutlinedPoly(graphic, [x, y - size, x + size * 0.72, y, x, y + size, x - size * 0.72, y], palette.accent, 0x020612, alpha);
}

function drawFangGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  drawOutlinedPoly(graphic, [x - size * 0.5, y - size, x + size * 0.85, y, x - size * 0.2, y + size], palette.color, 0x020612, alpha);
}

function drawScaleGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  drawOutlinedPoly(graphic, [x, y - size, x + size, y - size * 0.1, x + size * 0.45, y + size, x - size * 0.45, y + size, x - size, y - size * 0.1], palette.color, 0x020612, alpha);
}

function drawLeafGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  graphic
    .ellipse(x, y, size * 0.55, size)
    .stroke({ color: palette.accent, width: 1, alpha })
    .moveTo(x, y + size)
    .lineTo(x, y - size)
    .stroke({ color: palette.color, width: 1, alpha: alpha * 0.75 });
}

function drawIceGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  drawOutlinedPoly(graphic, [x, y - size * 1.25, x + size * 0.42, y, x, y + size * 1.25, x - size * 0.42, y], palette.accent, 0x020612, alpha);
}

function drawLensGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  graphic
    .circle(x, y, size)
    .stroke({ color: palette.color, width: 1, alpha })
    .circle(x, y, size * 0.35)
    .fill({ color: 0x020612, alpha: alpha * 0.75 });
}

function drawCrescentGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  graphic
    .arc(x, y, size, -1.35, 1.35)
    .stroke({ color: palette.accent, width: 3, alpha })
    .arc(x + size * 0.32, y, size * 0.72, -1.25, 1.25)
    .stroke({ color: palette.color, width: 1, alpha: alpha * 0.5 });
}

function drawRailGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  graphic
    .rect(x - size, y - size * 0.3, size * 2, size * 0.22)
    .fill({ color: palette.color, alpha })
    .rect(x - size, y + size * 0.18, size * 2, size * 0.22)
    .fill({ color: palette.accent, alpha: alpha * 0.8 });
}

function drawRockGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  drawOutlinedPoly(graphic, [x - size, y - size * 0.35, x - size * 0.2, y - size, x + size, y - size * 0.2, x + size * 0.4, y + size, x - size * 0.8, y + size * 0.55], palette.color, 0x020612, alpha);
}

function drawNoteGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  graphic
    .circle(x - size * 0.3, y + size * 0.4, size * 0.28)
    .fill({ color: palette.accent, alpha })
    .moveTo(x, y + size * 0.35)
    .lineTo(x, y - size)
    .stroke({ color: palette.color, width: 2, alpha });
}

function drawPixelGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  graphic
    .rect(x - size * 0.5, y - size * 0.5, size, size)
    .stroke({ color: palette.accent, width: 1, alpha })
    .rect(x - size * 0.18, y - size * 0.18, size * 0.36, size * 0.36)
    .fill({ color: palette.color, alpha: alpha * 0.7 });
}

function drawWaveGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  graphic
    .moveTo(x - size, y)
    .quadraticCurveTo(x - size * 0.35, y - size, x + size * 0.25, y)
    .quadraticCurveTo(x + size * 0.55, y + size * 0.48, x + size, y)
    .stroke({ color: palette.accent, width: 2, alpha });
}

function drawBeadGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  graphic
    .circle(x, y, size * 0.62)
    .fill({ color: palette.color, alpha })
    .circle(x, y, size)
    .stroke({ color: palette.accent, width: 1, alpha: alpha * 0.8 });
}

function drawFrameGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  graphic
    .rect(x - size, y - size, size * 2, size * 2)
    .stroke({ color: palette.accent, width: 1, alpha })
    .rect(x - size * 0.45, y - size * 0.45, size * 0.9, size * 0.9)
    .stroke({ color: palette.color, width: 1, alpha: alpha * 0.65 });
}

function drawHexGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  const points: number[] = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = Math.PI / 6 + index * Math.PI / 3;
    points.push(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
  }
  drawOutlinedPoly(graphic, points, palette.accent, 0x020612, alpha);
}

function drawFlareGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  drawStarSpark(graphic, x, y, palette.accent, alpha);
  graphic.circle(x, y, size * 0.75).stroke({ color: palette.color, width: 1, alpha: alpha * 0.6 });
}

function drawGustGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  graphic
    .arc(x, y, size, -0.2, Math.PI * 1.15)
    .stroke({ color: palette.accent, width: 2, alpha })
    .arc(x + size * 0.25, y - size * 0.12, size * 0.55, 0.2, Math.PI * 1.05)
    .stroke({ color: palette.color, width: 1, alpha: alpha * 0.65 });
}

function drawSwarmGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  for (const offset of [-0.6, 0, 0.6]) {
    graphic.circle(x + offset * size, y + Math.abs(offset) * size * 0.45, size * 0.24).fill({ color: palette.accent, alpha });
  }
}

function drawThunderGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  graphic
    .moveTo(x - size * 0.35, y - size)
    .lineTo(x + size * 0.2, y - size * 0.15)
    .lineTo(x - size * 0.08, y - size * 0.15)
    .lineTo(x + size * 0.38, y + size)
    .stroke({ color: palette.accent, width: 2, alpha });
}

function drawRiftGlyph(graphic: PixiGraphics, x: number, y: number, size: number, palette: WishcraftVfxPalette, alpha: number): void {
  drawOutlinedPoly(graphic, [x - size * 0.35, y - size, x + size * 0.8, y - size * 0.2, x + size * 0.25, y + size, x - size * 0.75, y + size * 0.2], 0x020612, palette.accent, alpha);
}
