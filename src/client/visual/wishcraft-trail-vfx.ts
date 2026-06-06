import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";
import type { Point } from "../simulation/arena-math.js";
import {
  drawGearShard,
  drawOutlinedPoly,
  drawStarSpark,
} from "./pixel-primitives.js";
import {
  paletteForWishcraftFeedback,
  themeIdForWishcraftFeedback,
  type WishcraftVfxPalette,
} from "./wishcraft-vfx-palette.js";
import {
  drawThemeTrailMotif,
  motifForTheme,
} from "./wishcraft-theme-motifs.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface ActiveTrailResidueGraphic {
  bornAtSeconds: number;
  graphic: PixiGraphics;
  origin: Point;
  rotation: number;
  ttlSeconds: number;
}

export function shouldCreateTrailResidueVfx(event: CombatFeedback): boolean {
  if (event.kind !== "wishcraft-hit") {
    return false;
  }
  if (["area", "burst", "melee", "pickup", "shield", "summon", "trigger"].includes(event.visualKind)) {
    return false;
  }
  return Math.hypot(event.position.x - event.origin.x, event.position.y - event.origin.y) >= 48;
}

export function createTrailResidueGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
  loadout: readonly Wishcraft[],
): Omit<ActiveTrailResidueGraphic, "bornAtSeconds"> | undefined {
  if (!shouldCreateTrailResidueVfx(event) || event.kind !== "wishcraft-hit") {
    return undefined;
  }
  const dx = event.position.x - event.origin.x;
  const dy = event.position.y - event.origin.y;
  const distance = Math.hypot(dx, dy);
  const palette = paletteForWishcraftFeedback(event, loadout);
  const themeId = themeIdForWishcraftFeedback(event, loadout);
  const graphic = new Graphics();
  drawTrailResidue(graphic, {
    distance,
    palette,
    themeId,
    visualKind: event.visualKind,
  });
  return {
    graphic,
    origin: {
      x: (event.origin.x + event.position.x) * 0.5,
      y: (event.origin.y + event.position.y) * 0.5,
    },
    rotation: Math.atan2(dy, dx),
    ttlSeconds: event.visualKind === "beam" ? 0.72 : 0.62,
  };
}

export function trailResidueProgress(options: {
  bornAtSeconds: number;
  nowSeconds: number;
  ttlSeconds: number;
}): number {
  const age = Math.max(0, options.nowSeconds - options.bornAtSeconds);
  return Math.min(1, age / options.ttlSeconds);
}

export function updateTrailResidueGraphic(
  trail: ActiveTrailResidueGraphic,
  progress: number,
): void {
  trail.graphic.position.set(trail.origin.x, trail.origin.y);
  trail.graphic.rotation = trail.rotation;
  trail.graphic.alpha = 0.68 * (1 - progress);
  const scaleY = 1 + progress * 0.18;
  trail.graphic.scale.set(1, scaleY);
}

function drawTrailResidue(
  graphic: PixiGraphics,
  options: {
    distance: number;
    palette: WishcraftVfxPalette;
    themeId: string | undefined;
    visualKind: string;
  },
): void {
  const length = Math.min(780, Math.max(70, options.distance));
  const segmentCount = options.visualKind === "beam" ? 18 : 11;
  graphic
    .rect(-length * 0.5, -8, length, 16)
    .fill({ color: options.palette.color, alpha: options.visualKind === "beam" ? 0.1 : 0.06 })
    .rect(-length * 0.5, -2, length, 4)
    .fill({ color: options.palette.accent, alpha: options.visualKind === "beam" ? 0.28 : 0.18 });

  for (let index = 0; index < segmentCount; index += 1) {
    const t = index / (segmentCount - 1);
    const x = -length * 0.48 + t * length * 0.96;
    const y = Math.sin(t * Math.PI * 2.5) * (options.visualKind === "beam" ? 7 : 13);
    const color = index % 2 === 0 ? options.palette.color : options.palette.accent;
    graphic
      .rect(x - 5, y - 2, 10 + (index % 3) * 4, 4)
      .fill({ color, alpha: 0.28 })
      .rect(x - 2, -y * 0.7 - 2, 5, 4)
      .fill({ color: index % 2 === 0 ? options.palette.accent : options.palette.color, alpha: 0.18 });
  }
  drawThemeTrailMotif(graphic, {
    length,
    motif: motifForTheme(options.themeId),
    palette: options.palette,
  });

  if (options.themeId === "thunder" || options.themeId === "storm") {
    graphic
      .moveTo(-length * 0.45, -4)
      .lineTo(-length * 0.2, 13)
      .lineTo(length * 0.03, -9)
      .lineTo(length * 0.28, 11)
      .lineTo(length * 0.45, -3)
      .stroke({ color: options.palette.accent, width: 2, alpha: 0.32 });
    return;
  }
  if (options.themeId === "gravity" || options.themeId === "void") {
    for (let index = 0; index < 4; index += 1) {
      const x = -length * 0.3 + index * length * 0.2;
      graphic
        .circle(x, 0, 16 + index * 3)
        .stroke({ color: index % 2 === 0 ? options.palette.accent : options.palette.color, width: 1, alpha: 0.2 });
    }
    return;
  }
  if (options.themeId === "clockwork") {
    for (let index = 0; index < 5; index += 1) {
      drawGearShard(graphic, -length * 0.38 + index * length * 0.19, index % 2 === 0 ? -11 : 11, 6, options.palette.accent, 0.22);
    }
    return;
  }
  if (options.themeId === "crystal" || options.themeId === "frost") {
    for (let index = 0; index < 6; index += 1) {
      const x = -length * 0.4 + index * length * 0.16;
      drawOutlinedPoly(graphic, [x, -7, x + 7, 0, x, 7, x - 7, 0], options.palette.accent, 0x020612, 0.22);
    }
    return;
  }
  if (options.themeId === "starfire" || options.themeId === "solar" || options.themeId === "meteor") {
    for (let index = 0; index < 7; index += 1) {
      drawStarSpark(graphic, -length * 0.42 + index * length * 0.14, index % 2 === 0 ? -13 : 13, options.palette.accent, 0.26);
    }
  }
}
