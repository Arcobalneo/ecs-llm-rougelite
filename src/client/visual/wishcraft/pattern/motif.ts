import {
  drawGearShard,
  drawOutlinedPoly,
  drawStarSpark,
} from "../../pixel-primitives.js";
import type { WishcraftThemeMotif } from "../../wishcraft-theme-motifs.js";
import type { WishcraftVfxPalette } from "../../wishcraft-vfx-palette.js";

type PixiGraphics = import("pixi.js").Graphics;

export function drawPatternMotif(
  graphic: PixiGraphics,
  options: {
    alpha: number;
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    rotation?: number;
    size: number;
    x: number;
    y: number;
  },
): void {
  if (options.motif === "celestial" || options.motif === "meteor") {
    drawStarSpark(graphic, options.x, options.y, options.palette.accent, options.alpha);
    return;
  }
  if (options.motif === "clockwork") {
    drawGearShard(graphic, options.x, options.y, options.size * 0.72, options.palette.accent, options.alpha);
    return;
  }
  if (options.motif === "crystal-frost" || options.motif === "dragon-demon" || options.motif === "blade-metal") {
    const skew = Math.cos(options.rotation ?? 0);
    drawOutlinedPoly(
      graphic,
      [
        options.x,
        options.y - options.size,
        options.x + options.size * (0.72 + skew * 0.18),
        options.y,
        options.x,
        options.y + options.size,
        options.x - options.size * (0.72 - skew * 0.18),
        options.y,
      ],
      options.motif === "dragon-demon" ? options.palette.color : options.palette.accent,
      0x020612,
      options.alpha,
    );
    return;
  }
  if (options.motif === "music-quantum") {
    graphic
      .moveTo(options.x - options.size, options.y)
      .lineTo(options.x - options.size * 0.35, options.y - options.size * 0.55)
      .lineTo(options.x + options.size * 0.3, options.y + options.size * 0.45)
      .lineTo(options.x + options.size, options.y)
      .stroke({ color: options.palette.accent, width: 1, alpha: options.alpha });
    return;
  }
  if (options.motif === "neon") {
    graphic
      .rect(options.x - options.size * 0.55, options.y - options.size * 0.55, options.size * 1.1, options.size * 1.1)
      .stroke({ color: options.palette.accent, width: 1, alpha: options.alpha })
      .rect(options.x - options.size * 0.25, options.y - options.size * 0.25, options.size * 0.5, options.size * 0.5)
      .fill({ color: options.palette.color, alpha: options.alpha * 0.5 });
    return;
  }
  if (options.motif === "void-gravity" || options.motif === "ocean") {
    graphic
      .circle(options.x, options.y, options.size)
      .stroke({ color: options.palette.color, width: 1, alpha: options.alpha })
      .circle(options.x, options.y, options.size * 0.38)
      .fill({ color: 0x020612, alpha: options.alpha * 0.75 });
    return;
  }
  graphic
    .circle(options.x, options.y, options.size * 0.58)
    .fill({ color: options.palette.accent, alpha: options.alpha * 0.5 })
    .circle(options.x, options.y, options.size)
    .stroke({ color: options.palette.color, width: 1, alpha: options.alpha });
}
