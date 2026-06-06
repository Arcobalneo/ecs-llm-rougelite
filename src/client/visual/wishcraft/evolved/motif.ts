import {
  drawOutlinedPoly,
  drawOutlinedRect,
  drawPixelGlow,
} from "../../pixel-primitives.js";
import type { WishcraftVfxPalette } from "../../wishcraft-vfx-palette.js";
import {
  drawPatternThemeGlyph,
  type WishcraftPatternThemeKit,
} from "../pattern/theme-kits.js";
import { drawEvolvedWishcraftOrnaments } from "./ornament.js";
import type { WishcraftEvolvedProfile } from "./types.js";

type PixiGraphics = import("pixi.js").Graphics;

export function drawEvolvedWishcraftMotif(
  graphic: PixiGraphics,
  options: {
    direction: number;
    palette: WishcraftVfxPalette;
    profile: WishcraftEvolvedProfile;
    themeKit: WishcraftPatternThemeKit;
  },
): void {
  drawPixelGlow(graphic, 0, 0, options.profile.radius * 0.54, options.palette.color, 0.13 * options.profile.intensity);
  drawEvolvedRings(graphic, options);
  switch (options.profile.pattern) {
    case "spiral-corkscrew":
      drawEvolvedSpiral(graphic, options);
      break;
    case "ricochet-node":
      drawEvolvedRicochet(graphic, options);
      break;
    case "shield-guard":
      drawEvolvedShield(graphic, options);
      break;
    case "pickup-magnet":
      drawEvolvedPickup(graphic, options);
      break;
    case "beam-cap":
      drawEvolvedBeam(graphic, options);
      break;
    case "missile-salvo":
      drawEvolvedMissile(graphic, options);
      break;
    case "scatter-fan":
      drawEvolvedScatter(graphic, options);
      break;
    case "summon-link":
      drawEvolvedSummon(graphic, options);
      break;
    case "trigger-sigil":
      drawEvolvedTrigger(graphic, options);
      break;
    case "area-nova":
    case "burst-array":
      drawEvolvedNova(graphic, options);
      break;
    case "melee-blade":
      drawEvolvedMelee(graphic, options);
      break;
    default:
      drawEvolvedNova(graphic, options);
  }
  drawEvolvedWishcraftOrnaments(graphic, options);
}

function drawEvolvedRings(graphic: PixiGraphics, options: EvolvedDrawOptions): void {
  for (let ring = 0; ring < options.profile.ringCount; ring += 1) {
    const radius = options.profile.radius * (0.18 + ring * 0.105);
    graphic.circle(0, 0, radius).stroke({
      color: ring % 2 === 0 ? options.palette.color : options.palette.accent,
      width: ring === 0 ? 4 : 2,
      alpha: (0.3 - ring * 0.032) * options.profile.intensity,
    });
  }
  drawPatternThemeGlyph(graphic, {
    alpha: 0.95,
    kit: options.themeKit,
    palette: options.palette,
    rotation: options.direction,
    size: 18,
    x: 0,
    y: 0,
  });
}

function drawEvolvedSpiral(graphic: PixiGraphics, options: EvolvedDrawOptions): void {
  for (const side of [-1, 1] as const) {
    let previous: { x: number; y: number } | undefined;
    for (let index = 0; index < options.profile.motifCount; index += 1) {
      const t = index / Math.max(1, options.profile.motifCount - 1);
      const angle = options.direction + side * (t * Math.PI * 5.6 + options.themeKit.angleOffset);
      const distance = options.profile.radius * (0.1 + t * 0.72);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      if (previous) {
        graphic
          .moveTo(previous.x, previous.y)
          .lineTo(x, y)
          .stroke({ color: side < 0 ? options.palette.color : options.palette.accent, width: index % 3 === 0 ? 4 : 2, alpha: 0.28 });
      }
      drawPatternThemeGlyph(graphic, {
        alpha: 0.58,
        kit: options.themeKit,
        palette: options.palette,
        rotation: angle,
        size: 6 + (index % 4),
        x,
        y,
      });
      previous = { x, y };
    }
  }
}

function drawEvolvedRicochet(graphic: PixiGraphics, options: EvolvedDrawOptions): void {
  const nodes = Array.from({ length: options.profile.spokeCount }, (_, index) => {
    const t = index / Math.max(1, options.profile.spokeCount - 1);
    return {
      x: -options.profile.radius * 0.66 + t * options.profile.radius * 1.32,
      y: (index % 2 === 0 ? -1 : 1) * options.profile.radius * (0.22 + (index % 3) * 0.045),
    };
  });
  for (let index = 1; index < nodes.length; index += 1) {
    graphic
      .moveTo(nodes[index - 1].x, nodes[index - 1].y)
      .lineTo(nodes[index].x, nodes[index].y)
      .stroke({ color: index % 2 === 0 ? options.palette.accent : options.palette.color, width: 6, alpha: 0.32 })
      .moveTo(nodes[index - 1].x, nodes[index - 1].y)
      .lineTo(nodes[index].x, nodes[index].y)
      .stroke({ color: 0xe8fbff, width: 2, alpha: 0.24 });
  }
  for (const [index, node] of nodes.entries()) {
    drawOutlinedRect(graphic, node.x - 13, node.y - 13, 26, 26, index % 2 === 0 ? options.palette.accent : options.palette.color, 0x020612, 0.58);
    drawPatternThemeGlyph(graphic, {
      alpha: 0.62,
      kit: options.themeKit,
      palette: options.palette,
      rotation: index,
      size: 9,
      x: node.x,
      y: node.y,
    });
  }
}

function drawEvolvedShield(graphic: PixiGraphics, options: EvolvedDrawOptions): void {
  for (let layer = 0; layer < 4; layer += 1) {
    const radius = options.profile.radius * (0.28 + layer * 0.12);
    const points: number[] = [];
    for (let side = 0; side < 6; side += 1) {
      const angle = options.direction + side * Math.PI / 3 + layer * 0.1;
      points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    graphic.poly(points).stroke({
      color: layer % 2 === 0 ? options.palette.accent : options.palette.color,
      width: layer === 0 ? 4 : 2,
      alpha: 0.34 - layer * 0.045,
    });
  }
  for (let guard = 0; guard < options.profile.spokeCount; guard += 1) {
    const angle = guard * 2.399 + options.themeKit.angleOffset;
    const x = Math.cos(angle) * options.profile.radius * 0.54;
    const y = Math.sin(angle) * options.profile.radius * 0.54;
    drawOutlinedPoly(graphic, [x, y - 13, x + 12, y, x, y + 13, x - 12, y], guard % 2 === 0 ? options.palette.color : options.palette.accent, 0x020612, 0.52);
  }
}

function drawEvolvedPickup(graphic: PixiGraphics, options: EvolvedDrawOptions): void {
  for (let lane = 0; lane < options.profile.spokeCount; lane += 1) {
    const angle = (lane / options.profile.spokeCount) * Math.PI * 2 + options.themeKit.angleOffset;
    const start = options.profile.radius * (0.68 + (lane % 3) * 0.08);
    graphic
      .moveTo(Math.cos(angle) * start, Math.sin(angle) * start)
      .quadraticCurveTo(
        Math.cos(angle + 0.75) * options.profile.radius * 0.38,
        Math.sin(angle + 0.75) * options.profile.radius * 0.38,
        Math.cos(angle + 1.42) * options.profile.radius * 0.12,
        Math.sin(angle + 1.42) * options.profile.radius * 0.12,
      )
      .stroke({ color: lane % 2 === 0 ? options.palette.color : options.palette.accent, width: lane % 3 === 0 ? 5 : 3, alpha: 0.32 });
    drawPatternThemeGlyph(graphic, { alpha: 0.54, kit: options.themeKit, palette: options.palette, rotation: angle, size: 7 + (lane % 4), x: Math.cos(angle) * start, y: Math.sin(angle) * start });
  }
}

function drawEvolvedBeam(graphic: PixiGraphics, options: EvolvedDrawOptions): void {
  for (let lane = 0; lane < 7; lane += 1) {
    const y = (lane - 3) * 18;
    graphic
      .rect(-options.profile.radius * 0.76, y - 3, options.profile.radius * 1.52, 6)
      .fill({ color: lane === 3 ? 0xe8fbff : lane % 2 === 0 ? options.palette.color : options.palette.accent, alpha: lane === 3 ? 0.38 : 0.18 });
  }
  for (const side of [-1, 1] as const) {
    drawOutlinedPoly(
      graphic,
      [side * options.profile.radius * 0.88, 0, side * options.profile.radius * 0.66, -32, side * options.profile.radius * 0.5, 0, side * options.profile.radius * 0.66, 32],
      side < 0 ? options.palette.accent : options.palette.color,
      0x020612,
      0.52,
    );
  }
}

function drawEvolvedMissile(graphic: PixiGraphics, options: EvolvedDrawOptions): void {
  for (let missile = 0; missile < options.profile.spokeCount; missile += 1) {
    const angle = options.direction - 0.95 + missile * (1.9 / Math.max(1, options.profile.spokeCount - 1));
    const start = options.profile.radius * 0.14;
    const end = options.profile.radius * (0.64 + (missile % 3) * 0.08);
    graphic
      .moveTo(Math.cos(angle) * start, Math.sin(angle) * start)
      .quadraticCurveTo(Math.cos(angle + 0.3) * end * 0.55, Math.sin(angle + 0.3) * end * 0.55, Math.cos(angle) * end, Math.sin(angle) * end)
      .stroke({ color: missile % 2 === 0 ? options.palette.color : options.palette.accent, width: 3, alpha: 0.3 });
    drawOutlinedPoly(graphic, [Math.cos(angle) * end - 9, Math.sin(angle) * end - 6, Math.cos(angle) * end + 14, Math.sin(angle) * end, Math.cos(angle) * end - 9, Math.sin(angle) * end + 6], options.palette.color, 0x020612, 0.48);
  }
}

function drawEvolvedScatter(graphic: PixiGraphics, options: EvolvedDrawOptions): void {
  const start = options.direction - 0.82;
  for (let lane = 0; lane < options.profile.spokeCount; lane += 1) {
    const t = lane / Math.max(1, options.profile.spokeCount - 1);
    const angle = start + t * 1.64;
    const length = options.profile.radius * (0.42 + (lane % 4) * 0.06);
    graphic
      .moveTo(Math.cos(angle) * 24, Math.sin(angle) * 24)
      .lineTo(Math.cos(angle) * length, Math.sin(angle) * length)
      .stroke({ color: lane % 2 === 0 ? options.palette.accent : options.palette.color, width: lane % 3 === 0 ? 5 : 3, alpha: 0.3 });
    drawPatternThemeGlyph(graphic, { alpha: 0.55, kit: options.themeKit, palette: options.palette, rotation: angle, size: 7, x: Math.cos(angle) * length, y: Math.sin(angle) * length });
  }
}

function drawEvolvedSummon(graphic: PixiGraphics, options: EvolvedDrawOptions): void {
  for (let satellite = 0; satellite < 6; satellite += 1) {
    const angle = satellite * Math.PI / 3 + options.themeKit.angleOffset;
    const x = Math.cos(angle) * options.profile.radius * 0.42;
    const y = Math.sin(angle) * options.profile.radius * 0.42;
    graphic
      .circle(x, y, 19)
      .stroke({ color: options.palette.accent, width: 3, alpha: 0.36 })
      .moveTo(x * 0.18, y * 0.18)
      .lineTo(x * 1.2, y * 1.2)
      .stroke({ color: options.palette.color, width: 3, alpha: 0.26 });
    drawPatternThemeGlyph(graphic, { alpha: 0.6, kit: options.themeKit, palette: options.palette, rotation: angle, size: 8, x, y });
  }
}

function drawEvolvedTrigger(graphic: PixiGraphics, options: EvolvedDrawOptions): void {
  for (let square = 0; square < options.profile.ringCount; square += 1) {
    const radius = options.profile.radius * (0.18 + square * 0.105);
    graphic
      .rect(-radius, -radius, radius * 2, radius * 2)
      .stroke({ color: square % 2 === 0 ? options.palette.accent : options.palette.color, width: square % 3 === 0 ? 4 : 2, alpha: 0.3 - square * 0.032 });
  }
  drawEvolvedNova(graphic, options);
}

function drawEvolvedNova(graphic: PixiGraphics, options: EvolvedDrawOptions): void {
  for (let spoke = 0; spoke < options.profile.spokeCount; spoke += 1) {
    const angle = (spoke / options.profile.spokeCount) * Math.PI * 2 + options.direction + options.themeKit.angleOffset;
    const inner = options.profile.radius * 0.12;
    const outer = options.profile.radius * (0.62 + (spoke % 4) * 0.06);
    graphic
      .moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      .lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
      .stroke({ color: spoke % 2 === 0 ? options.palette.color : options.palette.accent, width: spoke % 4 === 0 ? 6 : 3, alpha: 0.31 });
    if (spoke % 2 === 0) {
      drawPatternThemeGlyph(graphic, { alpha: 0.52, kit: options.themeKit, palette: options.palette, rotation: angle, size: 7 + (spoke % 3), x: Math.cos(angle) * outer, y: Math.sin(angle) * outer });
    }
  }
}

function drawEvolvedMelee(graphic: PixiGraphics, options: EvolvedDrawOptions): void {
  for (let arc = 0; arc < options.profile.spokeCount; arc += 1) {
    const angle = -1.2 + arc * (2.4 / Math.max(1, options.profile.spokeCount - 1));
    graphic
      .arc(0, 0, options.profile.radius * (0.28 + (arc % 5) * 0.055), angle, angle + 0.72)
      .stroke({ color: arc % 2 === 0 ? options.palette.accent : options.palette.color, width: arc % 3 === 0 ? 7 : 4, alpha: 0.34 });
  }
}

type EvolvedDrawOptions = {
  direction: number;
  palette: WishcraftVfxPalette;
  profile: WishcraftEvolvedProfile;
  themeKit: WishcraftPatternThemeKit;
};
