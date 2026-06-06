import {
  drawGearShard,
  drawOutlinedPoly,
  drawStarSpark,
} from "../../pixel-primitives.js";
import type { WishcraftThemeMotif } from "../../wishcraft-theme-motifs.js";
import type { WishcraftVfxPalette } from "../../wishcraft-vfx-palette.js";

type PixiGraphics = import("pixi.js").Graphics;

export function drawSpectacleMotif(
  graphic: PixiGraphics,
  options: {
    alpha: number;
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    size: number;
    x: number;
    y: number;
  },
): void {
  if (options.motif === "clockwork") {
    drawGearShard(graphic, options.x, options.y, options.size * 0.8, options.palette.accent, options.alpha);
    return;
  }
  if (options.motif === "celestial" || options.motif === "meteor") {
    drawStarSpark(graphic, options.x, options.y, options.palette.accent, options.alpha);
    return;
  }
  if (options.motif === "crystal-frost" || options.motif === "blade-metal") {
    drawOutlinedPoly(
      graphic,
      [
        options.x,
        options.y - options.size,
        options.x + options.size,
        options.y,
        options.x,
        options.y + options.size,
        options.x - options.size,
        options.y,
      ],
      options.palette.accent,
      0x020612,
      options.alpha,
    );
    return;
  }
  if (options.motif === "dragon-demon" || options.motif === "swarm-forest") {
    drawOutlinedPoly(
      graphic,
      [
        options.x - options.size,
        options.y - options.size * 0.45,
        options.x + options.size * 1.15,
        options.y,
        options.x - options.size,
        options.y + options.size * 0.45,
      ],
      options.motif === "dragon-demon" ? options.palette.color : options.palette.accent,
      0x020612,
      options.alpha,
    );
    return;
  }
  if (options.motif === "void-gravity" || options.motif === "ocean") {
    graphic
      .circle(options.x, options.y, options.size + 4)
      .stroke({ color: options.palette.color, width: 1, alpha: options.alpha * 0.72 })
      .circle(options.x, options.y, Math.max(2, options.size * 0.34))
      .fill({ color: 0x020612, alpha: options.alpha * 0.84 });
    return;
  }
  if (options.motif === "music-quantum" || options.motif === "neon") {
    graphic
      .rect(options.x - options.size, options.y - 2, options.size * 2, 4)
      .fill({ color: options.palette.accent, alpha: options.alpha })
      .rect(options.x - 2, options.y - options.size, 4, options.size * 2)
      .fill({ color: options.palette.color, alpha: options.alpha * 0.68 });
    return;
  }
  if (options.motif === "shield-angel") {
    graphic
      .circle(options.x, options.y, options.size + 2)
      .stroke({ color: options.palette.accent, width: 1, alpha: options.alpha })
      .circle(options.x, options.y, options.size * 1.7)
      .stroke({ color: options.palette.color, width: 1, alpha: options.alpha * 0.34 });
    return;
  }
  graphic.circle(options.x, options.y, options.size).fill({ color: options.palette.accent, alpha: options.alpha });
}
