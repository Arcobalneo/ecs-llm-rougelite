import type { CombatFeedback } from "../../../simulation/combat-loop.js";
import type { Point } from "../../../simulation/arena-math.js";

export type WishcraftCinematicFamily =
  | "beam-overdrive"
  | "blade-storm"
  | "lance-break"
  | "missile-bloom"
  | "nova-detonation"
  | "scatter-barrage"
  | "summon-salvo"
  | "trigger-rupture";

export interface WishcraftCinematicProfile {
  afterimageCount: number;
  family: WishcraftCinematicFamily;
  intensity: number;
  particleCount: number;
  ringCount: number;
  ttlSeconds: number;
  width: number;
}

export function shouldCreateWishcraftCinematic(event: CombatFeedback): boolean {
  if (event.kind !== "wishcraft-hit") {
    return false;
  }
  return wishcraftCinematicProfile(event) !== undefined;
}

export function wishcraftCinematicProfile(event: CombatFeedback): WishcraftCinematicProfile | undefined {
  if (event.kind !== "wishcraft-hit") {
    return undefined;
  }
  const distance = distanceForEvent(event);
  if (event.mechanicId.includes("spiral")) {
    return profile("scatter-barrage", 0.9, 14, 30, 4, 0.82, 116);
  }
  const byVisualKind: Record<string, WishcraftCinematicProfile> = {
    area: profile("nova-detonation", 1, 10, 42, 6, 0.92, 164),
    beam: profile("beam-overdrive", 0.92, 9, 34, 4, 0.76, Math.min(260, Math.max(150, distance * 0.48))),
    burst: profile("nova-detonation", 0.95, 11, 38, 5, 0.84, 142),
    lance: profile("lance-break", 0.76, 7, 22, 3, 0.58, Math.min(210, Math.max(112, distance * 0.34))),
    melee: profile("blade-storm", 0.88, 12, 30, 4, 0.68, 126),
    missile: profile("missile-bloom", 0.94, 10, 36, 5, 0.86, 146),
    ricochet: profile("scatter-barrage", 0.78, 8, 24, 3, 0.64, 118),
    scatter: profile("scatter-barrage", 0.86, 12, 32, 4, 0.74, 132),
    summon: profile("summon-salvo", 0.78, 8, 24, 3, 0.66, 120),
    trigger: profile("trigger-rupture", 1, 12, 44, 6, 0.94, 168),
  };
  return byVisualKind[event.visualKind];
}

export function wishcraftCinematicOrigin(event: CombatFeedback): Point | undefined {
  if (event.kind !== "wishcraft-hit") {
    return undefined;
  }
  if (event.visualKind === "beam" || event.visualKind === "lance" || event.visualKind === "scatter" || event.visualKind === "ricochet") {
    return {
      x: (event.origin.x + event.position.x) * 0.5,
      y: (event.origin.y + event.position.y) * 0.5,
    };
  }
  return { ...event.position };
}

export function wishcraftCinematicProgress(options: {
  bornAtSeconds: number;
  nowSeconds: number;
  ttlSeconds: number;
}): number {
  const age = Math.max(0, options.nowSeconds - options.bornAtSeconds);
  return Math.min(1, age / options.ttlSeconds);
}

function profile(
  family: WishcraftCinematicFamily,
  intensity: number,
  afterimageCount: number,
  particleCount: number,
  ringCount: number,
  ttlSeconds: number,
  width: number,
): WishcraftCinematicProfile {
  return {
    afterimageCount,
    family,
    intensity,
    particleCount,
    ringCount,
    ttlSeconds,
    width,
  };
}

function distanceForEvent(event: Extract<CombatFeedback, { kind: "wishcraft-hit" }>): number {
  return Math.hypot(event.position.x - event.origin.x, event.position.y - event.origin.y);
}
