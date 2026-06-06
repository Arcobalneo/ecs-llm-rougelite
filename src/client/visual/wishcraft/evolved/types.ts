import type { CombatFeedback } from "../../../simulation/combat-loop.js";
import type { Point } from "../../../simulation/arena-math.js";
import {
  mechanicAccentPattern,
  type WishcraftMechanicAccentPattern,
} from "../mechanic-accent/types.js";

export interface WishcraftEvolvedProfile {
  intensity: number;
  motifCount: number;
  pattern: WishcraftMechanicAccentPattern;
  radius: number;
  ringCount: number;
  spokeCount: number;
  ttlSeconds: number;
}

export function shouldCreateWishcraftEvolved(event: CombatFeedback): boolean {
  if (event.kind !== "wishcraft-hit") {
    return false;
  }
  return [
    "area",
    "beam",
    "burst",
    "missile",
    "pickup",
    "ricochet",
    "scatter",
    "shield",
    "spiral",
    "summon",
    "trigger",
  ].includes(event.visualKind) || event.mechanicId.includes("spiral") || event.mechanicId.includes("pickup") || event.mechanicId.includes("shield");
}

export function wishcraftEvolvedProfile(event: CombatFeedback): WishcraftEvolvedProfile | undefined {
  if (event.kind !== "wishcraft-hit" || !shouldCreateWishcraftEvolved(event)) {
    return undefined;
  }
  const pattern = mechanicAccentPattern({
    mechanicId: event.mechanicId,
    visualKind: event.visualKind,
  });
  return {
    intensity: intensityForPattern(pattern),
    motifCount: motifCountForPattern(pattern),
    pattern,
    radius: radiusForPattern(pattern),
    ringCount: ringCountForPattern(pattern),
    spokeCount: spokeCountForPattern(pattern),
    ttlSeconds: ttlForPattern(pattern),
  };
}

export function wishcraftEvolvedOrigin(event: CombatFeedback): Point | undefined {
  if (event.kind !== "wishcraft-hit") {
    return undefined;
  }
  if (["beam", "lance", "missile", "ricochet", "scatter"].includes(event.visualKind) || event.mechanicId.includes("spiral")) {
    return {
      x: (event.origin.x + event.position.x) * 0.5,
      y: (event.origin.y + event.position.y) * 0.5,
    };
  }
  return { ...event.position };
}

export function wishcraftEvolvedProgress(options: {
  bornAtSeconds: number;
  nowSeconds: number;
  ttlSeconds: number;
}): number {
  const age = Math.max(0, options.nowSeconds - options.bornAtSeconds);
  return Math.min(1, age / options.ttlSeconds);
}

function radiusForPattern(pattern: WishcraftMechanicAccentPattern): number {
  const radii: Record<WishcraftMechanicAccentPattern, number> = {
    "area-nova": 280,
    "beam-cap": 240,
    "burst-array": 245,
    "lance-spear": 190,
    "melee-blade": 210,
    "missile-salvo": 230,
    "pickup-magnet": 245,
    "ricochet-node": 250,
    "scatter-fan": 238,
    "shield-guard": 260,
    "spiral-corkscrew": 270,
    "stat-tuning": 175,
    "summon-link": 220,
    "trigger-sigil": 285,
  };
  return radii[pattern];
}

function spokeCountForPattern(pattern: WishcraftMechanicAccentPattern): number {
  const counts: Record<WishcraftMechanicAccentPattern, number> = {
    "area-nova": 18,
    "beam-cap": 9,
    "burst-array": 16,
    "lance-spear": 7,
    "melee-blade": 12,
    "missile-salvo": 12,
    "pickup-magnet": 12,
    "ricochet-node": 7,
    "scatter-fan": 12,
    "shield-guard": 12,
    "spiral-corkscrew": 18,
    "stat-tuning": 8,
    "summon-link": 8,
    "trigger-sigil": 14,
  };
  return counts[pattern];
}

function motifCountForPattern(pattern: WishcraftMechanicAccentPattern): number {
  return Math.ceil(spokeCountForPattern(pattern) * (pattern === "spiral-corkscrew" ? 1.8 : 1.35));
}

function ringCountForPattern(pattern: WishcraftMechanicAccentPattern): number {
  if (pattern === "shield-guard" || pattern === "trigger-sigil" || pattern === "area-nova") {
    return 6;
  }
  if (pattern === "pickup-magnet" || pattern === "spiral-corkscrew") {
    return 5;
  }
  return 3;
}

function intensityForPattern(pattern: WishcraftMechanicAccentPattern): number {
  if (pattern === "trigger-sigil" || pattern === "area-nova" || pattern === "shield-guard") {
    return 1;
  }
  if (pattern === "spiral-corkscrew" || pattern === "pickup-magnet" || pattern === "ricochet-node") {
    return 0.92;
  }
  return 0.84;
}

function ttlForPattern(pattern: WishcraftMechanicAccentPattern): number {
  if (pattern === "trigger-sigil" || pattern === "area-nova") {
    return 1.12;
  }
  if (pattern === "spiral-corkscrew" || pattern === "pickup-magnet" || pattern === "shield-guard") {
    return 0.98;
  }
  return 0.84;
}
