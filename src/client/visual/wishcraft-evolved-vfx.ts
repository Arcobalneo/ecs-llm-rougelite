import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";
import type { Point } from "../simulation/arena-math.js";
import {
  paletteForWishcraftFeedback,
  themeIdForWishcraftFeedback,
} from "./wishcraft-vfx-palette.js";
import {
  patternThemeKitForTheme,
} from "./wishcraft/pattern/theme-kits.js";
import { drawEvolvedWishcraftMotif } from "./wishcraft/evolved/motif.js";
import {
  shouldCreateWishcraftEvolved,
  wishcraftEvolvedOrigin,
  wishcraftEvolvedProfile,
  wishcraftEvolvedProgress,
  type WishcraftEvolvedProfile,
} from "./wishcraft/evolved/types.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface ActiveWishcraftEvolvedGraphic {
  bornAtSeconds: number;
  graphic: PixiGraphics;
  origin: Point;
  profile: WishcraftEvolvedProfile;
  rotationSpeed: number;
  ttlSeconds: number;
}

export {
  shouldCreateWishcraftEvolved,
  wishcraftEvolvedProfile,
  wishcraftEvolvedProgress,
} from "./wishcraft/evolved/types.js";

export function createWishcraftEvolvedGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
  loadout: readonly Wishcraft[],
): Omit<ActiveWishcraftEvolvedGraphic, "bornAtSeconds"> | undefined {
  const profile = wishcraftEvolvedProfile(event);
  const origin = wishcraftEvolvedOrigin(event);
  if (!profile || !origin || event.kind !== "wishcraft-hit" || !shouldCreateWishcraftEvolved(event)) {
    return undefined;
  }
  const themeId = themeIdForWishcraftFeedback(event, loadout);
  const palette = paletteForWishcraftFeedback(event, loadout);
  const themeKit = patternThemeKitForTheme(themeId);
  const direction = Math.atan2(event.position.y - event.origin.y, event.position.x - event.origin.x);
  const graphic = new Graphics();
  drawEvolvedWishcraftMotif(graphic, {
    direction,
    palette,
    profile,
    themeKit,
  });
  return {
    graphic,
    origin,
    profile,
    rotationSpeed: rotationSpeedForEvolved(profile.pattern),
    ttlSeconds: profile.ttlSeconds,
  };
}

export function updateWishcraftEvolvedGraphic(
  evolved: ActiveWishcraftEvolvedGraphic,
  progress: number,
): void {
  evolved.graphic.position.set(evolved.origin.x, evolved.origin.y);
  evolved.graphic.rotation += evolved.rotationSpeed * (1 - progress * 0.35);
  evolved.graphic.alpha = 0.86 * (1 - progress * progress * 0.72);
  const scale = scaleForEvolved(evolved.profile.pattern, progress);
  evolved.graphic.scale.set(scale.x, scale.y);
}

function scaleForEvolved(pattern: string, progress: number): { x: number; y: number } {
  if (pattern === "beam-cap" || pattern === "ricochet-node" || pattern === "scatter-fan") {
    return { x: 0.72 + progress * 0.34, y: 0.86 + progress * 0.18 };
  }
  if (pattern === "spiral-corkscrew" || pattern === "pickup-magnet") {
    return { x: 0.8 + progress * 0.5, y: 0.8 + progress * 0.5 };
  }
  return { x: 0.68 + progress * 0.7, y: 0.68 + progress * 0.7 };
}

function rotationSpeedForEvolved(pattern: string): number {
  if (pattern === "spiral-corkscrew" || pattern === "pickup-magnet") {
    return 0.18;
  }
  if (pattern === "trigger-sigil") {
    return -0.14;
  }
  if (pattern === "shield-guard") {
    return 0.055;
  }
  return 0.035;
}
