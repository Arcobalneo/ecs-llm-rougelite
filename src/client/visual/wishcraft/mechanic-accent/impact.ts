import { drawOutlinedPoly, drawOutlinedRect } from "../../pixel-primitives.js";
import type { WishcraftThemeMotif } from "../../wishcraft-theme-motifs.js";
import type { WishcraftVfxPalette } from "../../wishcraft-vfx-palette.js";
import { drawMechanicPellet, drawMotifRadial, drawTinyMotif } from "./motif-stamps.js";
import { mechanicAccentPattern } from "./types.js";

type PixiGraphics = import("pixi.js").Graphics;

export function drawMechanicImpactAccent(
  graphic: PixiGraphics,
  options: {
    mechanicId: string;
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    radius: number;
    visualKind: string;
  },
): void {
  const pattern = mechanicAccentPattern(options);
  switch (pattern) {
    case "beam-cap":
      drawImpactBeamCap(graphic, options.radius, options.palette, options.motif);
      return;
    case "scatter-fan":
      drawImpactScatter(graphic, options.radius, options.palette, options.motif);
      return;
    case "missile-salvo":
      drawImpactMissile(graphic, options.radius, options.palette, options.motif);
      return;
    case "ricochet-node":
      drawImpactRicochet(graphic, options.radius, options.palette, options.motif);
      return;
    case "spiral-corkscrew":
      drawImpactSpiral(graphic, options.radius, options.palette, options.motif);
      return;
    case "melee-blade":
      drawImpactMelee(graphic, options.radius, options.palette, options.motif);
      return;
    case "area-nova":
      drawImpactNova(graphic, options.radius, options.palette, options.motif);
      return;
    case "burst-array":
      drawImpactBurstArray(graphic, options.radius, options.palette, options.motif);
      return;
    case "summon-link":
      drawImpactSummonLink(graphic, options.radius, options.palette, options.motif);
      return;
    case "shield-guard":
      drawImpactShieldGuard(graphic, options.radius, options.palette, options.motif);
      return;
    case "pickup-magnet":
      drawImpactPickupMagnet(graphic, options.radius, options.palette, options.motif);
      return;
    case "trigger-sigil":
      drawImpactTriggerSigil(graphic, options.radius, options.palette, options.motif);
      return;
    case "stat-tuning":
      drawImpactStatTuning(graphic, options.radius, options.palette, options.motif);
      return;
    case "lance-spear":
      drawImpactLance(graphic, options.radius, options.palette, options.motif);
      return;
  }
}

function drawImpactBeamCap(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  graphic
    .rect(-radius, -7, radius * 2, 14)
    .stroke({ color: palette.color, width: 2, alpha: 0.38 })
    .rect(-radius * 0.72, -3, radius * 1.44, 6)
    .fill({ color: palette.accent, alpha: 0.24 });
  drawMotifRadial(graphic, motif, palette, radius, 7, 0.34);
}

function drawImpactScatter(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  for (let index = 0; index < 10; index += 1) {
    const angle = -1.1 + index * 0.24;
    const distance = radius * (0.28 + (index % 3) * 0.16);
    drawMechanicPellet(graphic, Math.cos(angle) * distance, Math.sin(angle) * distance, palette, motif, 3 + (index % 3));
  }
}

function drawImpactMissile(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  graphic
    .circle(0, 0, radius * 0.86)
    .stroke({ color: palette.color, width: 3, alpha: 0.28 })
    .circle(0, 0, radius * 0.44)
    .fill({ color: palette.accent, alpha: 0.16 });
  drawMotifRadial(graphic, motif, palette, radius, 12, 0.42);
}

function drawImpactRicochet(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  const nodes = [
    { x: -radius * 0.62, y: radius * 0.32 },
    { x: -radius * 0.16, y: -radius * 0.42 },
    { x: radius * 0.4, y: radius * 0.12 },
  ];
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const start = nodes[index];
    const end = nodes[index + 1];
    if (!start || !end) {
      continue;
    }
    graphic
      .moveTo(start.x, start.y)
      .lineTo(end.x, end.y)
      .stroke({ color: palette.color, width: 3, alpha: 0.52 });
  }
  for (const node of nodes) {
    drawOutlinedRect(graphic, node.x - 5, node.y - 5, 10, 10, palette.accent, 0x020612, 0.68);
  }
  drawTinyMotif(graphic, motif, radius * 0.58, -radius * 0.2, 5, palette, 0.42);
}

function drawImpactSpiral(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  for (let index = 0; index < 12; index += 1) {
    const angle = index * 0.62;
    const distance = radius * (0.16 + index * 0.045);
    graphic
      .circle(Math.cos(angle) * distance, Math.sin(angle) * distance, 4 + (index % 2))
      .stroke({ color: index % 2 === 0 ? palette.color : palette.accent, width: 2, alpha: 0.42 });
  }
  drawTinyMotif(graphic, motif, 0, 0, 7, palette, 0.52);
}

function drawImpactMelee(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  for (let index = 0; index < 4; index += 1) {
    graphic
      .arc(0, 0, radius * (0.62 + index * 0.13), -1.05 + index * 0.08, 1.08)
      .stroke({ color: index % 2 === 0 ? palette.color : palette.accent, width: Math.max(1, 4 - index), alpha: 0.36 - index * 0.04 });
  }
  drawTinyMotif(graphic, motif, radius * 0.64, -radius * 0.08, 7, palette, 0.46);
}

function drawImpactNova(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  for (let ring = 0; ring < 3; ring += 1) {
    graphic
      .circle(0, 0, radius * (0.42 + ring * 0.22))
      .stroke({ color: ring % 2 === 0 ? palette.color : palette.accent, width: ring === 0 ? 3 : 1, alpha: 0.34 - ring * 0.06 });
  }
  drawMotifRadial(graphic, motif, palette, radius, 12, 0.38);
}

function drawImpactBurstArray(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  for (let index = 0; index < 9; index += 1) {
    const angle = (index / 9) * Math.PI * 2;
    graphic
      .moveTo(Math.cos(angle) * radius * 0.2, Math.sin(angle) * radius * 0.2)
      .lineTo(Math.cos(angle) * radius * 0.78, Math.sin(angle) * radius * 0.78)
      .stroke({ color: index % 2 === 0 ? palette.color : palette.accent, width: 2, alpha: 0.42 });
    drawTinyMotif(graphic, motif, Math.cos(angle) * radius * 0.82, Math.sin(angle) * radius * 0.82, 5, palette, 0.38);
  }
}

function drawImpactSummonLink(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  for (let index = 0; index < 4; index += 1) {
    const angle = index * Math.PI * 0.5 + 0.35;
    graphic
      .circle(Math.cos(angle) * radius * 0.44, Math.sin(angle) * radius * 0.44, 8)
      .stroke({ color: palette.accent, width: 2, alpha: 0.42 })
      .moveTo(0, 0)
      .lineTo(Math.cos(angle) * radius * 0.44, Math.sin(angle) * radius * 0.44)
      .stroke({ color: palette.color, width: 1, alpha: 0.28 });
    drawTinyMotif(graphic, motif, Math.cos(angle) * radius * 0.64, Math.sin(angle) * radius * 0.64, 4, palette, 0.34);
  }
}

function drawImpactShieldGuard(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const x = Math.cos(angle) * radius * 0.6;
    const y = Math.sin(angle) * radius * 0.6;
    drawOutlinedPoly(graphic, [x, y - 7, x + 7, y, x, y + 7, x - 7, y], palette.accent, 0x020612, 0.42);
  }
  if (motif === "shield-angel") {
    graphic.circle(0, 0, radius * 0.8).stroke({ color: palette.color, width: 2, alpha: 0.24 });
  }
}

function drawImpactPickupMagnet(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  for (let index = 0; index < 6; index += 1) {
    const angle = index * 1.047;
    const start = radius * 0.82;
    const end = radius * 0.32;
    graphic
      .moveTo(Math.cos(angle) * start, Math.sin(angle) * start)
      .quadraticCurveTo(0, 0, Math.cos(angle + 0.42) * end, Math.sin(angle + 0.42) * end)
      .stroke({ color: index % 2 === 0 ? palette.color : palette.accent, width: 2, alpha: 0.32 });
    drawTinyMotif(graphic, motif, Math.cos(angle) * start, Math.sin(angle) * start, 4, palette, 0.34);
  }
}

function drawImpactTriggerSigil(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  graphic
    .circle(0, 0, radius * 0.72)
    .stroke({ color: palette.color, width: 2, alpha: 0.34 })
    .circle(0, 0, radius * 0.48)
    .stroke({ color: palette.accent, width: 1, alpha: 0.34 });
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    drawTinyMotif(graphic, motif, Math.cos(angle) * radius * 0.55, Math.sin(angle) * radius * 0.55, 5, palette, 0.4);
  }
}

function drawImpactStatTuning(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  for (let index = 0; index < 5; index += 1) {
    const y = -radius * 0.32 + index * radius * 0.16;
    graphic
      .rect(-radius * 0.42, y, radius * (0.5 + index * 0.08), 3)
      .fill({ color: index % 2 === 0 ? palette.color : palette.accent, alpha: 0.32 });
  }
  drawTinyMotif(graphic, motif, radius * 0.26, -radius * 0.18, 6, palette, 0.42);
}

function drawImpactLance(
  graphic: PixiGraphics,
  radius: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  drawOutlinedPoly(graphic, [-radius * 0.62, -7, radius * 0.72, 0, -radius * 0.62, 7], palette.accent, 0x020612, 0.42);
  graphic
    .moveTo(-radius * 0.4, 0)
    .lineTo(radius * 0.62, 0)
    .stroke({ color: 0xe8fbff, width: 1, alpha: 0.5 });
  drawTinyMotif(graphic, motif, radius * 0.76, 0, 6, palette, 0.46);
}
