import {
  drawGearShard,
  drawOutlinedPoly,
  drawStarSpark,
} from "../../pixel-primitives.js";
import type { WishcraftThemeMotif } from "../../wishcraft-theme-motifs.js";
import type { WishcraftVfxPalette } from "../../wishcraft-vfx-palette.js";

type PixiGraphics = import("pixi.js").Graphics;

export function drawMechanicPellet(
  graphic: PixiGraphics,
  x: number,
  y: number,
  palette: WishcraftVfxPalette,
  motif: WishcraftThemeMotif,
  radius: number,
): void {
  graphic
    .circle(x, y, radius + 2)
    .fill({ color: 0x020612, alpha: 0.64 })
    .circle(x, y, radius)
    .fill({ color: palette.color, alpha: 0.54 });
  drawTinyMotif(graphic, motif, x, y, Math.max(3, radius), palette, 0.48);
}

export function drawMotifEdgeMarks(
  graphic: PixiGraphics,
  motif: WishcraftThemeMotif,
  palette: WishcraftVfxPalette,
  length: number,
  alpha: number,
): void {
  for (let index = 0; index < 6; index += 1) {
    const x = -length * 0.32 + index * length * 0.13;
    drawTinyMotif(graphic, motif, x, index % 2 === 0 ? -17 : 17, 5, palette, alpha);
  }
}

export function drawMotifRadial(
  graphic: PixiGraphics,
  motif: WishcraftThemeMotif,
  palette: WishcraftVfxPalette,
  radius: number,
  count: number,
  alpha: number,
): void {
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const distance = radius * (0.32 + (index % 4) * 0.13);
    drawTinyMotif(
      graphic,
      motif,
      Math.cos(angle) * distance,
      Math.sin(angle) * distance,
      5 + (index % 3),
      palette,
      alpha,
    );
  }
}

export function drawTinyMotif(
  graphic: PixiGraphics,
  motif: WishcraftThemeMotif,
  x: number,
  y: number,
  size: number,
  palette: WishcraftVfxPalette,
  alpha: number,
): void {
  if (motif === "clockwork") {
    drawGearShard(graphic, x, y, size, palette.accent, alpha);
    return;
  }
  if (motif === "celestial" || motif === "meteor") {
    drawStarSpark(graphic, x, y, palette.accent, alpha);
    return;
  }
  if (motif === "crystal-frost" || motif === "blade-metal") {
    drawOutlinedPoly(graphic, [x, y - size, x + size, y, x, y + size, x - size, y], palette.accent, 0x020612, alpha);
    return;
  }
  if (motif === "void-gravity" || motif === "ocean") {
    graphic
      .circle(x, y, size + 4)
      .stroke({ color: palette.color, width: 1, alpha: alpha * 0.72 })
      .circle(x, y, Math.max(2, size * 0.38))
      .fill({ color: 0x020612, alpha: alpha * 0.8 });
    return;
  }
  if (motif === "dragon-demon" || motif === "swarm-forest") {
    drawOutlinedPoly(graphic, [x - size, y - size * 0.5, x + size, y, x - size, y + size * 0.5], palette.color, 0x020612, alpha);
    return;
  }
  if (motif === "music-quantum" || motif === "neon") {
    graphic
      .rect(x - size, y - 2, size * 2, 4)
      .fill({ color: palette.accent, alpha })
      .rect(x - 2, y - size, 4, size * 2)
      .fill({ color: palette.color, alpha: alpha * 0.72 });
    return;
  }
  if (motif === "shield-angel") {
    graphic
      .circle(x, y, size + 2)
      .stroke({ color: palette.accent, width: 1, alpha })
      .rect(x - size * 0.55, y - size * 0.55, size * 1.1, size * 1.1)
      .stroke({ color: palette.color, width: 1, alpha: alpha * 0.62 });
    return;
  }
  graphic.circle(x, y, size).fill({ color: palette.accent, alpha });
}
