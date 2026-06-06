import type { Point } from "./arena-math.js";
export { computeScore } from "../../shared/scoring.js";
import { computeScore } from "../../shared/scoring.js";

export interface PlayerVitals {
  level: number;
  health: number;
  maxHealth: number;
  invulnerableUntilSeconds: number;
}

export interface LevelState {
  level: number;
  xp: number;
  nextLevelXp: number;
}

export interface XpShard {
  id: string;
  position: Point;
  value: number;
  attracted: boolean;
}

export const CONTACT_INVULNERABILITY_SECONDS = 0.75;
export const LEVEL_HEALTH_STEP = 6;
export const LEVEL_UP_HEAL = 12;
export const XP_ATTRACTION_SPEED = 360;
export const XP_MERGE_RADIUS = 14;

export function createPlayerVitals(options: { level: number }): PlayerVitals {
  return {
    level: options.level,
    maxHealth: maxHealthForLevel(options.level),
    health: maxHealthForLevel(options.level),
    invulnerableUntilSeconds: 0,
  };
}

export function createLevelState(): LevelState {
  return {
    level: 1,
    xp: 0,
    nextLevelXp: xpThresholdForLevel(1),
  };
}

export function applyContactDamage(options: {
  player: PlayerVitals;
  nowSeconds: number;
  contacts: readonly { damage: number }[];
}): { player: PlayerVitals; damageTaken: number } {
  const highestDamage = Math.max(0, ...options.contacts.map((contact) => contact.damage));
  if (highestDamage === 0 || options.nowSeconds < options.player.invulnerableUntilSeconds) {
    return { player: options.player, damageTaken: 0 };
  }

  return {
    player: {
      ...options.player,
      health: Math.max(0, options.player.health - highestDamage),
      invulnerableUntilSeconds: options.nowSeconds + CONTACT_INVULNERABILITY_SECONDS,
    },
    damageTaken: highestDamage,
  };
}

export function collectXp(options: {
  levelState: LevelState;
  player: PlayerVitals;
  xpValue: number;
}): { levelState: LevelState; player: PlayerVitals; levelUps: number } {
  let level = options.levelState.level;
  let xp = options.levelState.xp + options.xpValue;
  let nextLevelXp = options.levelState.nextLevelXp;
  let levelUps = 0;
  let player = options.player;

  while (xp >= nextLevelXp) {
    xp -= nextLevelXp;
    level += 1;
    levelUps += 1;
    const maxHealth = maxHealthForLevel(level);
    player = {
      ...player,
      level,
      maxHealth,
      health: Math.min(maxHealth, player.health + LEVEL_UP_HEAL),
    };
    nextLevelXp = xpThresholdForLevel(level);
  }

  return {
    levelState: { level, xp, nextLevelXp },
    player,
    levelUps,
  };
}

export function mergeXpShards(shards: readonly XpShard[]): XpShard[] {
  const merged: XpShard[] = [];
  const used = new Set<number>();

  for (let index = 0; index < shards.length; index += 1) {
    if (used.has(index)) {
      continue;
    }
    const group = [shards[index]];
    used.add(index);

    for (let otherIndex = index + 1; otherIndex < shards.length; otherIndex += 1) {
      if (used.has(otherIndex)) {
        continue;
      }
      if (distanceBetween(shards[index].position, shards[otherIndex].position) <= XP_MERGE_RADIUS) {
        group.push(shards[otherIndex]);
        used.add(otherIndex);
      }
    }

    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }

    const value = group.reduce((sum, shard) => sum + shard.value, 0);
    merged.push({
      id: group.map((shard) => shard.id).join("+"),
      value,
      attracted: group.some((shard) => shard.attracted),
      position: {
        x: group.reduce((sum, shard) => sum + shard.position.x * shard.value, 0) / value,
        y: group.reduce((sum, shard) => sum + shard.position.y * shard.value, 0) / value,
      },
    });
  }

  return merged;
}

export function moveXpShards(options: {
  shards: readonly XpShard[];
  player: Point;
  deltaSeconds: number;
  pickupRange: number;
}): XpShard[] {
  return options.shards.map((shard) => {
    const distance = distanceBetween(shard.position, options.player);
    const attracted = shard.attracted || distance <= options.pickupRange;
    if (!attracted || distance === 0) {
      return { ...shard, attracted };
    }

    const travel = Math.min(distance, XP_ATTRACTION_SPEED * options.deltaSeconds);
    const ratio = travel / distance;
    return {
      ...shard,
      attracted,
      position: {
        x: shard.position.x + (options.player.x - shard.position.x) * ratio,
        y: shard.position.y + (options.player.y - shard.position.y) * ratio,
      },
    };
  });
}

export function xpThresholdForLevel(level: number): number {
  return 60 + (level - 1) * 25;
}

export function maxHealthForLevel(level: number): number {
  return 100 + (level - 1) * LEVEL_HEALTH_STEP;
}

function distanceBetween(left: Point, right: Point): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}
