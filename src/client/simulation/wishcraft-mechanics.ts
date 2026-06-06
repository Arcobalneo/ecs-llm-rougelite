import { wishcraftCatalog } from "../../shared/wishcraft/catalog.js";
import type { MechanicArchetype, MechanicPiece, Wishcraft } from "../../shared/wishcraft/types.js";
import {
  forbiddenWishcraftParameterKeys,
  forbiddenWishcraftParameterKeySet,
} from "../../shared/wishcraft/validation.js";
import type { Point } from "./arena-math.js";
import { chooseRangedTarget, shouldTriggerMelee, type CombatEnemy } from "./combat.js";

export interface WishcraftRuntimeEnemy extends CombatEnemy {
  health: number;
}

export interface WishcraftRuntimeContext {
  deltaSeconds: number;
  enemies: WishcraftRuntimeEnemy[];
  events: readonly WishcraftRuntimeEvent[];
  feedback: { push(feedback: WishcraftRuntimeFeedback): number };
  nowSeconds: number;
  player: Point;
}

export interface WishcraftRuntimeState {
  nextFireAtSecondsByCraftId: Record<string, number>;
  summons: WishcraftSummon[];
  shield: {
    capacity: number;
    nextRegenAtSeconds: number;
    regenDelaySeconds: number;
    value: number;
  };
}

export interface WishcraftStatSupport {
  damageScale: number;
  fireRateScale: number;
  projectileSpeedScale: number;
}

export interface WishcraftSummon {
  craftId: string;
  id: string;
  orbitRadius: number;
  position: Point;
}

export type WishcraftRuntimeEvent =
  | { kind: "kill"; position: Point }
  | { kind: "low-shield"; position: Point }
  | { kind: "pickup"; position: Point };

export type WishcraftRuntimeFeedback =
  | {
      kind: "wishcraft-hit";
      mechanicId: string;
      position: Point;
      visualKind: WishcraftVisualKind;
      wishcraftId: string;
    }
  | {
      kind: "wishcraft-shield";
      capacity: number;
      position: Point;
      wishcraftId: string;
    }
  | {
      kind: "wishcraft-summon";
      position: Point;
      summonId: string;
      wishcraftId: string;
    };

export type WishcraftVisualKind =
  | "area"
  | "beam"
  | "burst"
  | "lance"
  | "melee"
  | "missile"
  | "pickup"
  | "ricochet"
  | "scatter"
  | "shield"
  | "summon"
  | "trigger";

export function createWishcraftRuntimeState(): WishcraftRuntimeState {
  return {
    nextFireAtSecondsByCraftId: {},
    shield: {
      capacity: 0,
      nextRegenAtSeconds: 0,
      regenDelaySeconds: 0,
      value: 0,
    },
    summons: [],
  };
}

export function stepWishcraftMechanics(options: {
  context: WishcraftRuntimeContext;
  loadout: readonly Wishcraft[];
  mode?: "all" | "triggers";
  runtime: WishcraftRuntimeState;
}): void {
  const mode = options.mode ?? "all";
  if (mode === "all") {
    syncShield(options.runtime, options.loadout, options.context);
    syncSummons(options.runtime, options.loadout, options.context);
  }

  for (const wishcraft of options.loadout) {
    const mechanic = mechanicById(wishcraft.primaryMechanicId);
    if (!mechanic || isForbiddenRuntimeMechanic(mechanic, wishcraft)) {
      continue;
    }
    if (mode === "triggers" && mechanic.archetype !== "trigger") {
      continue;
    }
    if (mechanic.archetype === "shield" || mechanic.archetype === "pickup" || mechanic.archetype === "stat-support") {
      continue;
    }
    if (!isReady(options.runtime, wishcraft, options.context.nowSeconds)) {
      continue;
    }
    const applied = applyMechanicAttack({
      context: options.context,
      mechanic,
      wishcraft,
    });
    if (applied) {
      options.runtime.nextFireAtSecondsByCraftId[wishcraft.id] =
        options.context.nowSeconds + cooldownSeconds(wishcraft, mechanic);
    }
  }
}

export function pickupRangeForWishcrafts(loadout: readonly Wishcraft[], baseRange: number): number {
  const scale = loadout.reduce((currentScale, wishcraft) => {
    if (isForbiddenWishcraftRuntime(wishcraft)) {
      return currentScale;
    }
    if (!wishcraft.mechanicPieceIds.some((id) => mechanicById(id)?.archetype === "pickup")) {
      return currentScale;
    }
    return Math.max(currentScale, numberParameter(wishcraft, "pickupRangeScale", 1));
  }, 1);
  return baseRange * scale;
}

export function statSupportForWishcrafts(loadout: readonly Wishcraft[]): WishcraftStatSupport {
  return loadout.reduce<WishcraftStatSupport>(
    (support, wishcraft) => {
      const supportPieces = wishcraft.mechanicPieceIds
        .map((id) => mechanicById(id))
        .filter((piece): piece is MechanicPiece => piece?.archetype === "stat-support");
      if (
        supportPieces.length === 0 ||
        supportPieces.some((piece) => isForbiddenRuntimeMechanic(piece, wishcraft))
      ) {
        return support;
      }

      return {
        damageScale: support.damageScale + Math.max(0, numberParameter(wishcraft, "damageScale", 1) - 1),
        fireRateScale:
          support.fireRateScale + Math.max(0, numberParameter(wishcraft, "fireRateScale", 1) - 1),
        projectileSpeedScale:
          support.projectileSpeedScale +
          Math.max(0, numberParameter(wishcraft, "projectileSpeedScale", 1) - 1),
      };
    },
    {
      damageScale: 1,
      fireRateScale: 1,
      projectileSpeedScale: 1,
    },
  );
}

export function absorbDamageWithWishcraftShield(options: {
  damage: number;
  nowSeconds: number;
  runtime: WishcraftRuntimeState;
}): { healthDamage: number; shieldDamage: number } {
  if (options.damage <= 0 || options.runtime.shield.capacity <= 0 || options.runtime.shield.value <= 0) {
    return { healthDamage: Math.max(0, options.damage), shieldDamage: 0 };
  }

  const shieldDamage = Math.min(options.runtime.shield.value, options.damage);
  options.runtime.shield.value -= shieldDamage;
  options.runtime.shield.nextRegenAtSeconds =
    options.nowSeconds + options.runtime.shield.regenDelaySeconds;

  return {
    healthDamage: options.damage - shieldDamage,
    shieldDamage,
  };
}

function applyMechanicAttack(options: {
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
        position: enemy.position,
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
        position: enemy.position,
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
      position: target.position,
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

function syncShield(
  runtime: WishcraftRuntimeState,
  loadout: readonly Wishcraft[],
  context: WishcraftRuntimeContext,
): void {
  const shieldWishcrafts = loadout.filter((wishcraft) =>
    !isForbiddenWishcraftRuntime(wishcraft) &&
    wishcraft.mechanicPieceIds.some((id) => mechanicById(id)?.archetype === "shield"),
  );
  const capacity = shieldWishcrafts.reduce(
    (sum, wishcraft) => sum + numberParameter(wishcraft, "shieldCapacity", 0),
    0,
  );
  const regenDelaySeconds =
    shieldWishcrafts.length === 0
      ? 0
      : Math.min(
          ...shieldWishcrafts.map((wishcraft) =>
            numberParameter(wishcraft, "shieldRegenDelay", 4),
          ),
        );
  const previousCapacity = runtime.shield.capacity;
  runtime.shield.regenDelaySeconds = regenDelaySeconds;

  if (capacity === 0) {
    runtime.shield = {
      capacity: 0,
      nextRegenAtSeconds: 0,
      regenDelaySeconds: 0,
      value: 0,
    };
    return;
  }

  if (capacity !== previousCapacity) {
    const addedCapacity = Math.max(0, capacity - previousCapacity);
    runtime.shield = {
      capacity,
      nextRegenAtSeconds: runtime.shield.nextRegenAtSeconds,
      regenDelaySeconds,
      value: Math.min(capacity, runtime.shield.value + addedCapacity),
    };
    context.feedback.push({
      kind: "wishcraft-shield",
      capacity,
      position: context.player,
      wishcraftId: "shield-loadout",
    });
  }

  if (
    runtime.shield.value < runtime.shield.capacity &&
    context.nowSeconds >= runtime.shield.nextRegenAtSeconds
  ) {
    const regenPerSecond = Math.max(4, runtime.shield.capacity / regenDelaySeconds);
    runtime.shield.value = Math.min(
      runtime.shield.capacity,
      runtime.shield.value + regenPerSecond * context.deltaSeconds,
    );
  }
}

function syncSummons(
  runtime: WishcraftRuntimeState,
  loadout: readonly Wishcraft[],
  context: WishcraftRuntimeContext,
): void {
  const summons = loadout.flatMap((wishcraft) => {
    if (
      isForbiddenWishcraftRuntime(wishcraft) ||
      !wishcraft.mechanicPieceIds.some((id) => mechanicById(id)?.archetype === "summon")
    ) {
      return [];
    }
    const count = Math.min(5, Math.max(1, Math.floor(numberParameter(wishcraft, "summonCount", 1))));
    return Array.from({ length: count }, (_, index) => ({
      craftId: wishcraft.id,
      id: `${wishcraft.id}-summon-${index}`,
      orbitRadius: numberParameter(wishcraft, "orbitRadius", 72),
      position: orbitPosition({
        center: context.player,
        index,
        count,
        nowSeconds: context.nowSeconds,
        radius: numberParameter(wishcraft, "orbitRadius", 72),
      }),
    }));
  });
  if (sameSummons(runtime.summons, summons)) {
    runtime.summons = runtime.summons.map((summon, index) => ({
      ...summon,
      position: summons[index]?.position ?? summon.position,
    }));
    return;
  }
  runtime.summons = summons;
  for (const summon of summons) {
    context.feedback.push({
      kind: "wishcraft-summon",
      position: context.player,
      summonId: summon.id,
      wishcraftId: summon.craftId,
    });
  }
}

function isReady(runtime: WishcraftRuntimeState, wishcraft: Wishcraft, nowSeconds: number): boolean {
  return nowSeconds >= (runtime.nextFireAtSecondsByCraftId[wishcraft.id] ?? 0);
}

function cooldownSeconds(wishcraft: Wishcraft, mechanic: MechanicPiece): number {
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

function visualKindForMechanic(mechanic: MechanicPiece): WishcraftVisualKind {
  if (mechanic.id.includes("beam") || mechanic.id.includes("pierce")) {
    return "beam";
  }
  if (mechanic.id.includes("missile")) {
    return "missile";
  }
  if (mechanic.id.includes("scatter")) {
    return "scatter";
  }
  if (mechanic.id.includes("ricochet")) {
    return "ricochet";
  }
  if (mechanic.archetype === "area-burst") {
    return "area";
  }
  if (mechanic.archetype === "burst") {
    return "burst";
  }
  if (mechanic.archetype === "trigger") {
    return "trigger";
  }
  if (mechanic.archetype === "summon") {
    return "summon";
  }
  if (mechanic.archetype === "shield") {
    return "shield";
  }
  if (mechanic.archetype === "pickup") {
    return "pickup";
  }
  return "lance";
}

function numberParameter(wishcraft: Wishcraft, key: string, fallback: number): number {
  const value = wishcraft.parameters[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function mechanicById(id: string): MechanicPiece | undefined {
  return wishcraftCatalog.mechanicPieces.find((piece) => piece.id === id);
}

function isForbiddenRuntimeMechanic(mechanic: MechanicPiece, wishcraft: Wishcraft): boolean {
  if (isForbiddenWishcraftRuntime(wishcraft)) {
    return true;
  }
  return (
    forbiddenWishcraftParameterKeys.some((key) =>
      Object.prototype.hasOwnProperty.call(wishcraft.parameters, key),
    ) ||
    mechanic.forbiddenFlags?.some((flag) => forbiddenWishcraftParameterKeySet.has(flag)) === true
  );
}

function isForbiddenWishcraftRuntime(wishcraft: Wishcraft): boolean {
  return forbiddenWishcraftParameterKeys.some((key) =>
    Object.prototype.hasOwnProperty.call(wishcraft.parameters, key),
  );
}

function sameSummons(left: readonly WishcraftSummon[], right: readonly WishcraftSummon[]): boolean {
  return (
    left.length === right.length &&
    left.every((summon, index) => summon.id === right[index]?.id && summon.orbitRadius === right[index]?.orbitRadius)
  );
}

function triggerMatchesEvent(mechanic: MechanicPiece, event: WishcraftRuntimeEvent): boolean {
  if (mechanic.id.includes("on-kill")) {
    return event.kind === "kill";
  }
  if (mechanic.id.includes("on-pickup")) {
    return event.kind === "pickup";
  }
  if (mechanic.id.includes("low-shield")) {
    return event.kind === "low-shield";
  }
  return event.kind === "kill" || event.kind === "pickup" || event.kind === "low-shield";
}

function orbitPosition(options: {
  center: Point;
  count: number;
  index: number;
  nowSeconds: number;
  radius: number;
}): Point {
  const angle = options.nowSeconds * 1.8 + (options.index / Math.max(1, options.count)) * Math.PI * 2;
  return {
    x: options.center.x + Math.cos(angle) * options.radius,
    y: options.center.y + Math.sin(angle) * options.radius,
  };
}

function projectileCount(wishcraft: Wishcraft): number {
  return Math.min(8, Math.max(1, Math.floor(numberParameter(wishcraft, "projectileCount", 1))));
}

function angleBetween(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function shortestAngleDelta(left: number, right: number): number {
  return Math.atan2(Math.sin(right - left), Math.cos(right - left));
}

function degreesToRadians(degrees: number): number {
  return (degrees / 180) * Math.PI;
}

function distanceBetween(left: Point, right: Point): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function normalize(vector: Point): Point {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) {
    return { x: 1, y: 0 };
  }
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}
