import type { CombatFeedback } from "../../../simulation/combat-loop.js";
import {
  mechanicAccentLaneCount,
  mechanicAccentPattern,
  type WishcraftMechanicAccentPattern,
} from "../mechanic-accent/types.js";

export interface WishcraftPatternProfile {
  pattern: WishcraftMechanicAccentPattern;
  motifCount: number;
  radius: number;
  spokeCount: number;
  ttlSeconds: number;
}

export function shouldCreateWishcraftPattern(event: CombatFeedback): boolean {
  if (event.kind !== "wishcraft-hit") {
    return false;
  }
  return [
    "area",
    "beam",
    "burst",
    "missile",
    "ricochet",
    "scatter",
    "summon",
    "trigger",
  ].includes(event.visualKind) || event.mechanicId.includes("spiral");
}

export function wishcraftPatternProfile(event: CombatFeedback): WishcraftPatternProfile | undefined {
  if (event.kind !== "wishcraft-hit" || !shouldCreateWishcraftPattern(event)) {
    return undefined;
  }
  const pattern = mechanicAccentPattern({
    mechanicId: event.mechanicId,
    visualKind: event.visualKind,
  });
  const lanes = mechanicAccentLaneCount(pattern);
  const radiusByPattern: Record<WishcraftMechanicAccentPattern, number> = {
    "area-nova": 230,
    "beam-cap": 190,
    "burst-array": 210,
    "lance-spear": 150,
    "melee-blade": 170,
    "missile-salvo": 195,
    "pickup-magnet": 180,
    "ricochet-node": 185,
    "scatter-fan": 205,
    "shield-guard": 190,
    "spiral-corkscrew": 220,
    "stat-tuning": 160,
    "summon-link": 180,
    "trigger-sigil": 225,
  };
  const ttlByPattern: Record<WishcraftMechanicAccentPattern, number> = {
    "area-nova": 0.88,
    "beam-cap": 0.68,
    "burst-array": 0.74,
    "lance-spear": 0.56,
    "melee-blade": 0.58,
    "missile-salvo": 0.82,
    "pickup-magnet": 0.64,
    "ricochet-node": 0.78,
    "scatter-fan": 0.72,
    "shield-guard": 0.74,
    "spiral-corkscrew": 0.86,
    "stat-tuning": 0.58,
    "summon-link": 0.72,
    "trigger-sigil": 0.92,
  };

  return {
    pattern,
    motifCount: Math.max(6, Math.ceil(lanes * 1.5)),
    radius: radiusByPattern[pattern],
    spokeCount: lanes,
    ttlSeconds: ttlByPattern[pattern],
  };
}

export function wishcraftPatternOrigin(event: CombatFeedback): { x: number; y: number } | undefined {
  if (event.kind !== "wishcraft-hit") {
    return undefined;
  }
  if (event.visualKind === "beam" || event.visualKind === "scatter" || event.visualKind === "missile") {
    return {
      x: (event.origin.x + event.position.x) * 0.5,
      y: (event.origin.y + event.position.y) * 0.5,
    };
  }
  return { ...event.position };
}
