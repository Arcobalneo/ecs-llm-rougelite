import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";
import type { Point } from "../simulation/arena-math.js";
import {
  drawGearShard,
  drawOutlinedPoly,
  drawPixelGlow,
  drawStarSpark,
} from "./pixel-primitives.js";
import {
  paletteForWishcraftFeedback,
  themeIdForWishcraftFeedback,
  type WishcraftVfxPalette,
} from "./wishcraft-vfx-palette.js";
import {
  drawThemeLaunchMotif,
  motifForTheme,
} from "./wishcraft-theme-motifs.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface ActiveLaunchGraphic {
  bornAtSeconds: number;
  graphic: PixiGraphics;
  origin: Point;
  rotation: number;
  ttlSeconds: number;
}

export function shouldCreateLaunchVfx(event: CombatFeedback): boolean {
  if (event.kind !== "wishcraft-hit") {
    return false;
  }
  if (["pickup", "shield"].includes(event.visualKind)) {
    return false;
  }
  return Math.hypot(event.position.x - event.origin.x, event.position.y - event.origin.y) >= 10;
}

export function createLaunchVfxGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
  loadout: readonly Wishcraft[],
): Omit<ActiveLaunchGraphic, "bornAtSeconds"> | undefined {
  if (!shouldCreateLaunchVfx(event) || event.kind !== "wishcraft-hit") {
    return undefined;
  }
  const dx = event.position.x - event.origin.x;
  const dy = event.position.y - event.origin.y;
  const palette = paletteForWishcraftFeedback(event, loadout);
  const themeId = themeIdForWishcraftFeedback(event, loadout);
  const graphic = new Graphics();
  drawLaunchEmitter(graphic, {
    palette,
    themeId,
    visualKind: event.visualKind,
  });
  return {
    graphic,
    origin: { ...event.origin },
    rotation: Math.atan2(dy, dx),
    ttlSeconds: event.visualKind === "beam" ? 0.28 : 0.36,
  };
}

export function launchVfxProgress(options: {
  bornAtSeconds: number;
  nowSeconds: number;
  ttlSeconds: number;
}): number {
  const age = Math.max(0, options.nowSeconds - options.bornAtSeconds);
  return Math.min(1, age / options.ttlSeconds);
}

export function updateLaunchVfxGraphic(
  launch: ActiveLaunchGraphic,
  progress: number,
): void {
  launch.graphic.position.set(launch.origin.x, launch.origin.y);
  launch.graphic.rotation = launch.rotation;
  launch.graphic.alpha = 1 - progress * progress;
  const scale = 0.8 + progress * 1.2;
  launch.graphic.scale.set(scale);
}

function drawLaunchEmitter(
  graphic: PixiGraphics,
  options: {
    palette: WishcraftVfxPalette;
    themeId: string | undefined;
    visualKind: string;
  },
): void {
  const radius = options.visualKind === "beam" ? 34 : options.visualKind === "area" ? 42 : 27;
  drawPixelGlow(graphic, 0, 0, radius, options.palette.color, 0.18);
  graphic
    .circle(0, 0, radius * 0.64)
    .stroke({ color: options.palette.accent, width: 3, alpha: 0.48 })
    .rect(-4, -radius * 0.9, 8, radius * 1.8)
    .fill({ color: 0xe8fbff, alpha: 0.18 })
    .poly([0, 0, radius + 18, -9, radius + 34, 0, radius + 18, 9])
    .fill({ color: options.palette.color, alpha: 0.2 })
    .poly([0, -4, radius + 22, -4, radius + 34, 0, radius + 22, 4, 0, 4])
    .fill({ color: options.palette.accent, alpha: 0.38 });

  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2;
    const distance = radius * (0.48 + (index % 3) * 0.2);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    graphic
      .rect(x - 2, y - 2, 4 + (index % 2) * 2, 4)
      .fill({ color: index % 2 === 0 ? options.palette.accent : options.palette.color, alpha: 0.46 });
  }

  if (options.themeId === "clockwork") {
    for (let index = 0; index < 3; index += 1) {
      drawGearShard(graphic, -12 + index * 12, index % 2 === 0 ? -17 : 17, 7, options.palette.accent, 0.36);
    }
    return;
  }
  if (options.themeId === "crystal" || options.themeId === "frost") {
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2;
      const x = Math.cos(angle) * radius * 0.7;
      const y = Math.sin(angle) * radius * 0.7;
      drawOutlinedPoly(graphic, [x, y - 7, x + 7, y, x, y + 7, x - 7, y], options.palette.accent, 0x020612, 0.38);
    }
    return;
  }
  if (options.themeId === "starfire" || options.themeId === "solar" || options.themeId === "meteor") {
    for (let index = 0; index < 6; index += 1) {
      drawStarSpark(graphic, 4 + index * 8, (index % 2 === 0 ? -1 : 1) * (11 + index), options.palette.accent, 0.42);
    }
  }
  drawThemeLaunchMotif(graphic, {
    motif: motifForTheme(options.themeId),
    palette: options.palette,
    radius,
  });
}
