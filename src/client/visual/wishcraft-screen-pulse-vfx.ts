import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";
import type { Point } from "../simulation/arena-math.js";
import {
  drawGearShard,
  drawOutlinedPoly,
  drawStarSpark,
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

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface ActiveScreenPulseGraphic {
  bornAtSeconds: number;
  center: Point;
  graphic: PixiGraphics;
  rotationSpeed: number;
  ttlSeconds: number;
}

export function shouldCreateScreenPulseVfx(event: CombatFeedback): boolean {
  if (event.kind !== "wishcraft-hit") {
    return false;
  }
  return ["area", "beam", "burst", "missile", "trigger"].includes(event.visualKind);
}

export function screenPulseIntensity(event: CombatFeedback): number {
  if (event.kind !== "wishcraft-hit") {
    return 0;
  }
  const baseByKind: Record<string, number> = {
    area: 1,
    beam: 0.86,
    burst: 0.82,
    missile: 0.74,
    trigger: 0.9,
  };
  return baseByKind[event.visualKind] ?? 0;
}

export function createScreenPulseVfxGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
  loadout: readonly Wishcraft[],
): Omit<ActiveScreenPulseGraphic, "bornAtSeconds"> | undefined {
  if (!shouldCreateScreenPulseVfx(event) || event.kind !== "wishcraft-hit") {
    return undefined;
  }
  const palette = paletteForWishcraftFeedback(event, loadout);
  const motif = motifForTheme(themeIdForWishcraftFeedback(event, loadout));
  const intensity = screenPulseIntensity(event);
  const graphic = new Graphics();
  drawScreenPulse(graphic, {
    intensity,
    motif,
    palette,
    visualKind: event.visualKind,
  });
  return {
    center: {
      x: (event.origin.x + event.position.x) * 0.5,
      y: (event.origin.y + event.position.y) * 0.5,
    },
    graphic,
    rotationSpeed: event.visualKind === "beam" ? 0.08 : event.visualKind === "trigger" ? -0.18 : 0.13,
    ttlSeconds: event.visualKind === "area" || event.visualKind === "trigger" ? 0.92 : 0.74,
  };
}

export function screenPulseProgress(options: {
  bornAtSeconds: number;
  nowSeconds: number;
  ttlSeconds: number;
}): number {
  const age = Math.max(0, options.nowSeconds - options.bornAtSeconds);
  return Math.min(1, age / options.ttlSeconds);
}

export function updateScreenPulseVfxGraphic(
  pulse: ActiveScreenPulseGraphic,
  progress: number,
): void {
  pulse.graphic.position.set(pulse.center.x, pulse.center.y);
  pulse.graphic.rotation += pulse.rotationSpeed * (1 - progress * 0.4);
  pulse.graphic.alpha = 0.58 * (1 - progress * progress);
  pulse.graphic.scale.set(0.72 + progress * 1.4);
}

function drawScreenPulse(
  graphic: PixiGraphics,
  options: {
    intensity: number;
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    visualKind: string;
  },
): void {
  const radius = options.visualKind === "area" ? 250 : options.visualKind === "beam" ? 220 : 190;
  graphic
    .circle(0, 0, radius * 0.52)
    .fill({ color: options.palette.color, alpha: 0.035 * options.intensity })
    .circle(0, 0, radius * 0.72)
    .stroke({ color: options.palette.color, width: 3, alpha: 0.18 * options.intensity })
    .circle(0, 0, radius)
    .stroke({ color: options.palette.accent, width: 1, alpha: 0.15 * options.intensity });

  for (let spoke = 0; spoke < 18; spoke += 1) {
    const angle = (spoke / 18) * Math.PI * 2;
    const inner = radius * (0.22 + (spoke % 3) * 0.035);
    const outer = radius * (0.78 + (spoke % 4) * 0.045);
    graphic
      .moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      .lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
      .stroke({
        color: spoke % 2 === 0 ? options.palette.accent : options.palette.color,
        width: spoke % 5 === 0 ? 3 : 1,
        alpha: 0.12 * options.intensity,
      });
  }

  for (let index = 0; index < 16; index += 1) {
    const angle = index * 2.399;
    const distance = radius * (0.34 + (index % 5) * 0.09);
    drawPulseMotif(graphic, {
      alpha: 0.18 * options.intensity,
      motif: options.motif,
      palette: options.palette,
      size: 7 + (index % 4) * 2,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    });
  }

  if (options.visualKind === "beam") {
    for (const y of [-54, -28, 28, 54]) {
      graphic
        .rect(-radius * 0.72, y, radius * 1.44, 3)
        .fill({ color: options.palette.accent, alpha: 0.08 * options.intensity });
    }
  }
}

function drawPulseMotif(
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
  if (options.motif === "celestial" || options.motif === "meteor") {
    drawStarSpark(graphic, options.x, options.y, options.palette.accent, options.alpha);
    return;
  }
  if (options.motif === "clockwork") {
    drawGearShard(graphic, options.x, options.y, options.size * 0.65, options.palette.accent, options.alpha);
    return;
  }
  if (options.motif === "crystal-frost" || options.motif === "dragon-demon" || options.motif === "blade-metal") {
    drawOutlinedPoly(
      graphic,
      [options.x, options.y - options.size, options.x + options.size, options.y, options.x, options.y + options.size, options.x - options.size, options.y],
      options.motif === "dragon-demon" ? options.palette.color : options.palette.accent,
      0x020612,
      options.alpha,
    );
    return;
  }
  if (options.motif === "neon" || options.motif === "music-quantum" || options.motif === "shield-angel") {
    graphic
      .rect(options.x - options.size * 0.5, options.y - options.size * 0.5, options.size, options.size)
      .stroke({ color: options.palette.accent, width: 1, alpha: options.alpha });
    return;
  }
  graphic
    .circle(options.x, options.y, options.size * 0.58)
    .stroke({ color: options.palette.accent, width: 1, alpha: options.alpha });
}
