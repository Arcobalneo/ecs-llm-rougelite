import {
  drawGearShard,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawStarSpark,
} from "../../pixel-primitives.js";
import type { WishcraftThemeMotif } from "../../wishcraft-theme-motifs.js";
import type { WishcraftVfxPalette } from "../../wishcraft-vfx-palette.js";
import { drawMechanicPellet, drawMotifEdgeMarks, drawTinyMotif } from "./motif-stamps.js";
import { mechanicAccentPattern } from "./types.js";

type PixiGraphics = import("pixi.js").Graphics;

export function drawMechanicProjectileAccent(
  graphic: PixiGraphics,
  options: {
    length: number;
    mechanicId: string;
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    visualKind: string;
  },
): void {
  const pattern = mechanicAccentPattern(options);
  switch (pattern) {
    case "beam-cap":
      drawBeamAccent(graphic, options.length, options.palette, options.motif);
      return;
    case "scatter-fan":
      drawScatterAccent(graphic, options.length, options.palette, options.motif);
      return;
    case "missile-salvo":
      drawMissileAccent(graphic, options.length, options.palette, options.motif);
      return;
    case "ricochet-node":
      drawRicochetAccent(graphic, options.length, options.palette, options.motif);
      return;
    case "spiral-corkscrew":
      drawSpiralAccent(graphic, options.length, options.palette, options.motif);
      return;
    case "burst-array":
      drawBurstProjectileAccent(graphic, options.length, options.palette, options.motif);
      return;
    default:
      drawLanceAccent(graphic, options.length, options.palette, options.motif);
  }
}

function drawBeamAccent(
  graphic: PixiGraphics,
  length: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  for (const x of [-length * 0.42, 0, length * 0.42]) {
    graphic
      .rect(x - 7, -18, 14, 36)
      .stroke({ color: palette.accent, width: 2, alpha: 0.34 })
      .rect(x - 3, -22, 6, 44)
      .fill({ color: 0xe8fbff, alpha: 0.16 });
  }
  drawMotifEdgeMarks(graphic, motif, palette, length, 0.32);
}

function drawScatterAccent(
  graphic: PixiGraphics,
  length: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  const offsets = [-24, -15, -6, 6, 15, 24];
  for (let index = 0; index < offsets.length; index += 1) {
    const y = offsets[index] ?? 0;
    const x = length * (0.03 + index * 0.045);
    drawMechanicPellet(graphic, x, y * 0.36, palette, motif, 4 + (index % 2));
  }
}

function drawMissileAccent(
  graphic: PixiGraphics,
  length: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  for (let index = 0; index < 5; index += 1) {
    const x = -length * 0.28 + index * length * 0.11;
    const y = index % 2 === 0 ? -17 : 17;
    graphic
      .poly([x - 9, y - 5, x + 8, y - 7, x + 17, y, x + 8, y + 7, x - 9, y + 5])
      .fill({ color: 0x020612, alpha: 0.68 })
      .poly([x - 5, y - 3, x + 8, y - 4, x + 13, y, x + 8, y + 4, x - 5, y + 3])
      .fill({ color: index % 2 === 0 ? palette.color : palette.accent, alpha: 0.52 });
  }
  if (motif === "meteor" || motif === "celestial" || motif === "dragon-demon") {
    for (let index = 0; index < 4; index += 1) {
      drawStarSpark(graphic, -length * 0.32 - index * 8, index % 2 === 0 ? -18 : 18, palette.accent, 0.34);
    }
  }
}

function drawRicochetAccent(
  graphic: PixiGraphics,
  length: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  const nodes = [
    { x: -length * 0.28, y: 14 },
    { x: -length * 0.06, y: -18 },
    { x: length * 0.18, y: 11 },
    { x: length * 0.38, y: -6 },
  ];
  for (const node of nodes) {
    drawOutlinedRect(graphic, node.x - 5, node.y - 5, 10, 10, palette.accent, 0x020612, 0.62);
    if (motif === "clockwork") {
      drawGearShard(graphic, node.x, node.y, 8, palette.color, 0.3);
    }
  }
}

function drawSpiralAccent(
  graphic: PixiGraphics,
  length: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  for (let index = 0; index < 10; index += 1) {
    const t = index / 9;
    const x = -length * 0.42 + t * length * 0.84;
    const y = Math.sin(t * Math.PI * 4.2) * 22;
    graphic
      .circle(x, y, 6)
      .stroke({ color: index % 2 === 0 ? palette.color : palette.accent, width: 2, alpha: 0.42 });
    drawTinyMotif(graphic, motif, x, -y * 0.62, 4, palette, 0.34);
  }
}

function drawBurstProjectileAccent(
  graphic: PixiGraphics,
  length: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  for (let index = 0; index < 9; index += 1) {
    const angle = -0.65 + index * 0.16;
    const x = length * (0.02 + (index % 3) * 0.1);
    const y = Math.sin(angle) * 28;
    graphic
      .moveTo(-length * 0.16, 0)
      .lineTo(x, y)
      .stroke({ color: index % 2 === 0 ? palette.color : palette.accent, width: 1, alpha: 0.24 });
    drawTinyMotif(graphic, motif, x, y, 5, palette, 0.42);
  }
}

function drawLanceAccent(
  graphic: PixiGraphics,
  length: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
): void {
  drawOutlinedPoly(
    graphic,
    [length * 0.12, -11, length * 0.52, 0, length * 0.12, 11, length * 0.2, 0],
    palette.accent,
    0x020612,
    0.46,
  );
  for (const y of [-12, 0, 12]) {
    graphic
      .moveTo(-length * 0.34, y * 0.4)
      .lineTo(length * 0.18, y * 0.16)
      .stroke({ color: y === 0 ? palette.accent : palette.color, width: y === 0 ? 2 : 1, alpha: y === 0 ? 0.54 : 0.28 });
  }
  drawTinyMotif(graphic, motif, length * 0.46, 0, 7, palette, 0.54);
}
