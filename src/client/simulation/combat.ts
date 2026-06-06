import type { Point } from "./arena-math.js";

export interface CombatEnemy {
  id: string;
  position: Point;
  radius: number;
  health: number;
}

export interface CommonEnemyTemplate {
  id: "fast-fragile" | "slow-tough" | "swarm-fragile";
  attackKind: "contact";
  maxHealth: number;
  speed: number;
  radius: number;
  contactDamage: number;
  xpValue: number;
}

export interface BaseKit {
  machineGun: {
    range: number;
    damage: number;
    cooldownSeconds: number;
    projectileSpeed: number;
  };
  laserSword: {
    range: number;
    damage: number;
    cooldownSeconds: number;
  };
}

export const COMMON_ENEMY_TEMPLATES: readonly CommonEnemyTemplate[] = Object.freeze([
  {
    id: "fast-fragile",
    attackKind: "contact",
    maxHealth: 9,
    speed: 95,
    radius: 13,
    contactDamage: 6,
    xpValue: 4,
  },
  {
    id: "slow-tough",
    attackKind: "contact",
    maxHealth: 24,
    speed: 48,
    radius: 18,
    contactDamage: 10,
    xpValue: 7,
  },
  {
    id: "swarm-fragile",
    attackKind: "contact",
    maxHealth: 6,
    speed: 76,
    radius: 11,
    contactDamage: 4,
    xpValue: 3,
  },
]);

export function createBaseKit(): BaseKit {
  return {
    machineGun: {
      range: 520,
      damage: 7,
      cooldownSeconds: 0.22,
      projectileSpeed: 760,
    },
    laserSword: {
      range: 74,
      damage: 14,
      cooldownSeconds: 0.55,
    },
  };
}

export function getCommonEnemyTemplate(id: CommonEnemyTemplate["id"]): CommonEnemyTemplate {
  const template = COMMON_ENEMY_TEMPLATES.find((candidate) => candidate.id === id);
  if (!template) {
    throw new Error(`Unknown Common Enemy template: ${id}`);
  }
  return template;
}

export function chooseRangedTarget(options: {
  player: Point;
  enemies: readonly CombatEnemy[];
  range: number;
}): CombatEnemy | undefined {
  let closest: CombatEnemy | undefined;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (const enemy of options.enemies) {
    if (enemy.health <= 0) {
      continue;
    }
    const distance = distanceBetween(options.player, enemy.position) - enemy.radius;
    if (distance <= options.range && distance < closestDistance) {
      closest = enemy;
      closestDistance = distance;
    }
  }
  return closest;
}

export function shouldTriggerMelee(options: {
  player: Point;
  enemies: readonly CombatEnemy[];
  range: number;
}): boolean {
  return options.enemies.some(
    (enemy) =>
      enemy.health > 0 && distanceBetween(options.player, enemy.position) - enemy.radius <= options.range,
  );
}

function distanceBetween(left: Point, right: Point): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}
