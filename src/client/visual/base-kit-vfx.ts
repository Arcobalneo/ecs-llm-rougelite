import type { CombatFeedback } from "../simulation/combat-loop.js";
import {
  drawLaserSwordVfxFrame,
} from "./base-kit/laser-sword.js";
import {
  drawMachineGunVfxFrame,
} from "./base-kit/machine-gun.js";
import {
  baseKitFrameSignature,
  createBaseKitVfxProfile,
  distanceForEvent,
  isBaseKitImpactEvent,
  type BaseKitVfxKind,
  type BaseKitVfxProfile,
} from "./base-kit/types.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface ActiveBaseKitGraphic {
  bornAtSeconds: number;
  distance: number;
  graphic: PixiGraphics;
  origin: { x: number; y: number };
  profile: BaseKitVfxProfile;
  rotation: number;
  ttlSeconds: number;
  visualKind: BaseKitVfxKind;
}

export function shouldCreateBaseKitVfx(event: CombatFeedback): boolean {
  return isBaseKitImpactEvent(event);
}

export function createBaseKitVfxGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
): Omit<ActiveBaseKitGraphic, "bornAtSeconds"> | undefined {
  if (!isBaseKitImpactEvent(event)) {
    return undefined;
  }

  const dx = event.position.x - event.origin.x;
  const dy = event.position.y - event.origin.y;
  const distance = distanceForEvent(event);
  const profile = createBaseKitVfxProfile(event);
  if (!profile) {
    return undefined;
  }

  const graphic = new Graphics();
  drawBaseKitFrame(graphic, profile, {
    distance,
    progress: 0,
  });

  return {
    distance,
    graphic,
    origin: { ...event.origin },
    profile,
    rotation: Math.atan2(dy, dx),
    ttlSeconds: profile.ttlSeconds,
    visualKind: event.visualKind,
  };
}

export function baseKitVfxProgress(options: {
  bornAtSeconds: number;
  nowSeconds: number;
  ttlSeconds: number;
}): number {
  const age = Math.max(0, options.nowSeconds - options.bornAtSeconds);
  return Math.min(1, age / options.ttlSeconds);
}

export function updateBaseKitVfxGraphic(effect: ActiveBaseKitGraphic, progress: number): void {
  effect.graphic.clear();
  drawBaseKitFrame(effect.graphic, effect.profile, {
    distance: effect.distance,
    progress,
  });
  effect.graphic.position.set(effect.origin.x, effect.origin.y);
  effect.graphic.rotation = effect.rotation;
  effect.graphic.alpha = 1 - progress * progress * 0.64;
  const squash = effect.visualKind === "machine-gun" ? 1 + progress * 0.06 : 1 + progress * 0.18;
  effect.graphic.scale.set(squash, effect.visualKind === "machine-gun" ? 1 : 1 + progress * 0.08);
}

export { baseKitFrameSignature, createBaseKitVfxProfile };

function drawBaseKitFrame(
  graphic: PixiGraphics,
  profile: BaseKitVfxProfile,
  options: {
    distance: number;
    progress: number;
  },
): void {
  if (profile.kind === "machine-gun") {
    drawMachineGunVfxFrame(graphic, profile, options);
    return;
  }

  drawLaserSwordVfxFrame(graphic, profile, { progress: options.progress });
}
