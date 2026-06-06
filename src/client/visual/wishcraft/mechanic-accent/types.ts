export type WishcraftMechanicAccentPattern =
  | "area-nova"
  | "beam-cap"
  | "burst-array"
  | "lance-spear"
  | "melee-blade"
  | "missile-salvo"
  | "pickup-magnet"
  | "ricochet-node"
  | "scatter-fan"
  | "shield-guard"
  | "spiral-corkscrew"
  | "stat-tuning"
  | "summon-link"
  | "trigger-sigil";

export function mechanicAccentPattern(options: {
  mechanicId: string;
  visualKind: string;
}): WishcraftMechanicAccentPattern {
  const mechanicId = options.mechanicId;
  const visualKind = options.visualKind;
  if (visualKind === "beam" || mechanicId.includes("beam") || mechanicId.includes("pierce")) {
    return "beam-cap";
  }
  if (visualKind === "scatter" || mechanicId.includes("scatter")) {
    return "scatter-fan";
  }
  if (visualKind === "missile" || mechanicId.includes("missile")) {
    return "missile-salvo";
  }
  if (visualKind === "ricochet" || mechanicId.includes("ricochet")) {
    return "ricochet-node";
  }
  if (mechanicId.includes("spiral")) {
    return "spiral-corkscrew";
  }
  if (visualKind === "melee" || mechanicId.startsWith("melee-")) {
    return "melee-blade";
  }
  if (visualKind === "area" || mechanicId.startsWith("area-burst-")) {
    return "area-nova";
  }
  if (visualKind === "burst" || mechanicId.startsWith("burst-")) {
    return "burst-array";
  }
  if (visualKind === "summon" || mechanicId.startsWith("summon-")) {
    return "summon-link";
  }
  if (visualKind === "shield" || mechanicId.startsWith("shield-")) {
    return "shield-guard";
  }
  if (visualKind === "pickup" || mechanicId.startsWith("pickup-")) {
    return "pickup-magnet";
  }
  if (visualKind === "trigger" || mechanicId.startsWith("trigger-")) {
    return "trigger-sigil";
  }
  if (mechanicId.includes("tuning") || mechanicId.includes("rate-pulse")) {
    return "stat-tuning";
  }
  return "lance-spear";
}

export function mechanicAccentLaneCount(pattern: WishcraftMechanicAccentPattern): number {
  const laneCounts: Record<WishcraftMechanicAccentPattern, number> = {
    "area-nova": 12,
    "beam-cap": 7,
    "burst-array": 9,
    "lance-spear": 3,
    "melee-blade": 5,
    "missile-salvo": 5,
    "pickup-magnet": 6,
    "ricochet-node": 4,
    "scatter-fan": 6,
    "shield-guard": 8,
    "spiral-corkscrew": 10,
    "stat-tuning": 5,
    "summon-link": 4,
    "trigger-sigil": 8,
  };
  return laneCounts[pattern];
}
