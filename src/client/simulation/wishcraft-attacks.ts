import type { MechanicArchetype, MechanicPiece, Wishcraft } from "../../shared/wishcraft/types.js";
import type { Point } from "./arena-math.js";
import { chooseRangedTarget, shouldTriggerMelee } from "./combat.js";
import type {
  WishcraftRuntimeContext,
  WishcraftRuntimeEnemy,
} from "./wishcraft-runtime-types.js";
import {
  angleBetween,
  degreesToRadians,
  distanceBetween,
  normalize,
  numberParameter,
  projectileCount,
  shortestAngleDelta,
  triggerMatchesEvent,
  visualKindForMechanic,
} from "./wishcraft-runtime-utils.js";

export function applyMechanicAttack(options: {
  context: WishcraftRuntimeContext;
  mechanic: MechanicPiece;
  wishcraft: Wishcraft;
}): boolean {
  const archetype = options.mechanic.archetype;
  if (archetype === "melee") {
    return applyMelee(options);
  }
  if (archetype === "trigger") {
    return applyTrigger(options);
  }
  if (archetype === "area-burst") {
    return applyArea(options);
  }
  if (archetype === "summon" || archetype === "projectile" || archetype === "burst") {
    return applyProjectile(options);
  }
  return false;
}

export function cooldownSeconds(wishcraft: Wishcraft, mechanic: MechanicPiece): number {
  const baseCooldownByArchetype: Record<MechanicArchetype, number> = {
    "area-burst": 1.1,
    burst: 0.9,
    melee: 0.65,
    pickup: 1,
    projectile: 0.42,
    shield: 1,
    "stat-support": 1,
    summon: 0.7,
    trigger: 1.2,
  };
  return baseCooldownByArchetype[mechanic.archetype] / numberParameter(wishcraft, "fireRateScale", 1);
}

function applyProjectile(options: {
  context: WishcraftRuntimeContext;
  mechanic: MechanicPiece;
  wishcraft: Wishcraft;
}): boolean {
  const range = 520 * numberParameter(options.wishcraft, "rangeScale", 1);
  const target = chooseRangedTarget({
    player: options.context.player,
    enemies: options.context.enemies,
    range,
  }) as WishcraftRuntimeEnemy | undefined;
  if (!target) {
    return false;
  }

  if (options.mechanic.id.includes("scatter")) {
    return applyProjectileHits({
      ...options,
      targets: selectScatterTargets(options.context, options.wishcraft, target, range),
    });
  }
  if (options.mechanic.id.includes("pierce") || options.mechanic.id.includes("beam")) {
    return applyProjectileHits({
      ...options,
      targets: selectPierceTargets(options.context, options.wishcraft, target, range),
    });
  }
  if (options.mechanic.id.includes("missile")) {
    return applyProjectileHits({
      ...options,
      targets: selectSplashTargets(options.context, options.wishcraft, target),
    });
  }
  if (options.mechanic.id.includes("ricochet")) {
    return applyProjectileHits({
      ...options,
      targets: selectRicochetTargets(options.context, options.wishcraft, target),
    });
  }
  if (options.mechanic.id.includes("spiral")) {
    return applyProjectileHits({
      ...options,
      targets: selectRadialTargets(options.context, options.wishcraft, range),
    });
  }

  return applyProjectileHits({ ...options, targets: [target] });
}

function applyMelee(options: {
  context: WishcraftRuntimeContext;
  mechanic: MechanicPiece;
  wishcraft: Wishcraft;
}): boolean {
  const range = 82 * numberParameter(options.wishcraft, "rangeScale", 1);
  if (
    !shouldTriggerMelee({
      player: options.context.player,
      enemies: options.context.enemies,
      range,
    })
  ) {
    return false;
  }

  let hit = false;
  for (const enemy of options.context.enemies) {
    const distance = Math.hypot(
      enemy.position.x - options.context.player.x,
      enemy.position.y - options.context.player.y,
    );
    if (distance - enemy.radius <= range) {
      enemy.health -= damageFor(options.wishcraft, options.mechanic);
      hit = true;
      options.context.feedback.push({
        kind: "wishcraft-hit",
        mechanicId: options.mechanic.id,
        origin: options.context.player,
        position: enemy.position,
        targetRadius: enemy.radius,
        targetTemplateId: enemy.templateId,
        visualKind: "melee",
        wishcraftId: options.wishcraft.id,
      });
    }
  }
  return hit;
}

function applyArea(options: {
  context: WishcraftRuntimeContext;
  mechanic: MechanicPiece;
  wishcraft: Wishcraft;
}): boolean {
  return applyAreaAround({
    ...options,
    origin: options.context.player,
  });
}

function applyTrigger(options: {
  context: WishcraftRuntimeContext;
  mechanic: MechanicPiece;
  wishcraft: Wishcraft;
}): boolean {
  const event = options.context.events.find((candidate) =>
    triggerMatchesEvent(options.mechanic, candidate),
  );
  if (!event) {
    return false;
  }
  return applyAreaAround({
    ...options,
    origin: event.position,
  });
}

function applyAreaAround(options: {
  context: WishcraftRuntimeContext;
  mechanic: MechanicPiece;
  origin: Point;
  wishcraft: Wishcraft;
}): boolean {
  const radius = numberParameter(options.wishcraft, "blastRadius", 72);
  let hit = false;
  for (const enemy of options.context.enemies) {
    const distance = Math.hypot(
      enemy.position.x - options.origin.x,
      enemy.position.y - options.origin.y,
    );
    if (distance - enemy.radius <= radius) {
      enemy.health -= damageFor(options.wishcraft, options.mechanic);
      hit = true;
      options.context.feedback.push({
        kind: "wishcraft-hit",
        mechanicId: options.mechanic.id,
        origin: options.origin,
        position: enemy.position,
        targetRadius: enemy.radius,
        targetTemplateId: enemy.templateId,
        visualKind: visualKindForMechanic(options.mechanic),
        wishcraftId: options.wishcraft.id,
      });
    }
  }
  return hit;
}

function applyProjectileHits(options: {
  context: WishcraftRuntimeContext;
  mechanic: MechanicPiece;
  targets: readonly WishcraftRuntimeEnemy[];
  wishcraft: Wishcraft;
}): boolean {
  if (options.targets.length === 0) {
    return false;
  }
  const damage = damageFor(options.wishcraft, options.mechanic);
  for (const target of options.targets) {
    target.health -= damage;
    options.context.feedback.push({
      kind: "wishcraft-hit",
      mechanicId: options.mechanic.id,
      origin: options.context.player,
      position: target.position,
      targetRadius: target.radius,
      targetTemplateId: target.templateId,
      visualKind: visualKindForMechanic(options.mechanic),
      wishcraftId: options.wishcraft.id,
    });
  }
  return true;
}

function selectScatterTargets(
  context: WishcraftRuntimeContext,
  wishcraft: Wishcraft,
  target: WishcraftRuntimeEnemy,
  range: number,
): WishcraftRuntimeEnemy[] {
  const count = projectileCount(wishcraft);
  const spreadRadians = degreesToRadians(numberParameter(wishcraft, "spreadAngle", 35));
  const forward = angleBetween(context.player, target.position);
  return context.enemies
    .filter((enemy) => enemy.health > 0 && distanceBetween(context.player, enemy.position) - enemy.radius <= range)
    .map((enemy) => ({
      enemy,
      angleDelta: Math.abs(shortestAngleDelta(forward, angleBetween(context.player, enemy.position))),
      distance: distanceBetween(context.player, enemy.position),
    }))
    .filter((candidate) => candidate.angleDelta <= spreadRadians)
    .sort((left, right) => left.angleDelta - right.angleDelta || left.distance - right.distance)
    .slice(0, count)
    .map((candidate) => candidate.enemy);
}

function selectPierceTargets(
  context: WishcraftRuntimeContext,
  wishcraft: Wishcraft,
  target: WishcraftRuntimeEnemy,
  range: number,
): WishcraftRuntimeEnemy[] {
  const maxHits = 1 + Math.max(0, Math.floor(numberParameter(wishcraft, "pierceCount", 0)));
  const direction = normalize({
    x: target.position.x - context.player.x,
    y: target.position.y - context.player.y,
  });
  const beamWidth = 34;
  return context.enemies
    .filter((enemy) => enemy.health > 0)
    .map((enemy) => {
      const relative = {
        x: enemy.position.x - context.player.x,
        y: enemy.position.y - context.player.y,
      };
      const projection = relative.x * direction.x + relative.y * direction.y;
      const closest = {
        x: context.player.x + direction.x * projection,
        y: context.player.y + direction.y * projection,
      };
      return {
        enemy,
        projection,
        sideDistance: Math.max(0, distanceBetween(enemy.position, closest) - enemy.radius),
      };
    })
    .filter((candidate) => candidate.projection >= 0 && candidate.projection <= range && candidate.sideDistance <= beamWidth)
    .sort((left, right) => left.projection - right.projection)
    .slice(0, maxHits)
    .map((candidate) => candidate.enemy);
}

function selectSplashTargets(
  context: WishcraftRuntimeContext,
  wishcraft: Wishcraft,
  target: WishcraftRuntimeEnemy,
): WishcraftRuntimeEnemy[] {
  const radius = numberParameter(wishcraft, "blastRadius", 72);
  return context.enemies.filter(
    (enemy) => enemy.health > 0 && distanceBetween(target.position, enemy.position) - enemy.radius <= radius,
  );
}

function selectRicochetTargets(
  context: WishcraftRuntimeContext,
  wishcraft: Wishcraft,
  target: WishcraftRuntimeEnemy,
): WishcraftRuntimeEnemy[] {
  const maxHits = 1 + Math.max(0, Math.floor(numberParameter(wishcraft, "bounceCount", 0)));
  const bounceRange = 96 * numberParameter(wishcraft, "projectileSpeedScale", 1);
  const selected: WishcraftRuntimeEnemy[] = [target];
  let current = target;
  while (selected.length < maxHits) {
    const next = context.enemies
      .filter((enemy) => enemy.health > 0 && !selected.includes(enemy))
      .map((enemy) => ({
        enemy,
        distance: distanceBetween(current.position, enemy.position) - enemy.radius,
      }))
      .filter((candidate) => candidate.distance <= bounceRange)
      .sort((left, right) => left.distance - right.distance)[0]?.enemy;
    if (!next) {
      break;
    }
    selected.push(next);
    current = next;
  }
  return selected;
}

function selectRadialTargets(
  context: WishcraftRuntimeContext,
  wishcraft: Wishcraft,
  range: number,
): WishcraftRuntimeEnemy[] {
  return context.enemies
    .filter((enemy) => enemy.health > 0 && distanceBetween(context.player, enemy.position) - enemy.radius <= range)
    .sort(
      (left, right) =>
        distanceBetween(context.player, left.position) - distanceBetween(context.player, right.position),
    )
    .slice(0, projectileCount(wishcraft));
}

function damageFor(wishcraft: Wishcraft, mechanic: MechanicPiece): number {
  const baseDamageByArchetype: Record<MechanicArchetype, number> = {
    "area-burst": 10,
    burst: 9,
    melee: 12,
    pickup: 0,
    projectile: 8,
    shield: 0,
    "stat-support": 0,
    summon: 7,
    trigger: 8,
  };
  return baseDamageByArchetype[mechanic.archetype] * numberParameter(wishcraft, "damageScale", 1);
}
