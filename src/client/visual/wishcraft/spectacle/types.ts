import type { CombatFeedback } from "../../../simulation/combat-loop.js";

export type WishcraftSpectacleFamily =
  | "melee-super"
  | "pickup-magnet"
  | "shield-shell"
  | "summon-fire"
  | "trigger-break";

export interface WishcraftSpectacleProfile {
  family: WishcraftSpectacleFamily;
  intensity: number;
  ringCount: number;
  spokeCount: number;
  ttlSeconds: number;
}

export function shouldCreateWishcraftSpectacle(event: CombatFeedback): boolean {
  if (event.kind === "wishcraft-shield" || event.kind === "wishcraft-summon" || event.kind === "xp-collect") {
    return true;
  }
  if (event.kind !== "wishcraft-hit") {
    return false;
  }
  return ["melee", "pickup", "shield", "summon", "trigger"].includes(event.visualKind);
}

export function wishcraftSpectacleProfile(event: CombatFeedback): WishcraftSpectacleProfile | undefined {
  if (event.kind === "wishcraft-shield") {
    return { family: "shield-shell", intensity: 0.9, ringCount: 4, spokeCount: 12, ttlSeconds: 0.72 };
  }
  if (event.kind === "wishcraft-summon") {
    return { family: "summon-fire", intensity: 0.72, ringCount: 3, spokeCount: 8, ttlSeconds: 0.62 };
  }
  if (event.kind === "xp-collect") {
    return { family: "pickup-magnet", intensity: 0.58, ringCount: 3, spokeCount: 7, ttlSeconds: 0.52 };
  }
  if (event.kind !== "wishcraft-hit") {
    return undefined;
  }
  const byVisualKind: Record<string, WishcraftSpectacleProfile> = {
    melee: { family: "melee-super", intensity: 0.88, ringCount: 3, spokeCount: 10, ttlSeconds: 0.54 },
    pickup: { family: "pickup-magnet", intensity: 0.74, ringCount: 4, spokeCount: 9, ttlSeconds: 0.62 },
    shield: { family: "shield-shell", intensity: 0.82, ringCount: 4, spokeCount: 12, ttlSeconds: 0.7 },
    summon: { family: "summon-fire", intensity: 0.78, ringCount: 3, spokeCount: 9, ttlSeconds: 0.66 },
    trigger: { family: "trigger-break", intensity: 0.94, ringCount: 5, spokeCount: 16, ttlSeconds: 0.82 },
  };
  return byVisualKind[event.visualKind];
}

export function wishcraftSpectacleOrigin(event: CombatFeedback): { x: number; y: number } | undefined {
  if ("position" in event) {
    return { ...event.position };
  }
  return undefined;
}
