import type { Point } from "./arena-math.js";
import {
  chooseRangedTarget,
  createBaseKit,
  getCommonEnemyTemplate,
  shouldTriggerMelee,
  type CommonEnemyTemplate,
} from "./combat.js";
import type { Wishcraft } from "../../shared/wishcraft/types.js";
import {
  applyContactDamage,
  collectXp,
  computeScore,
  createLevelState,
  createPlayerVitals,
  mergeXpShards,
  moveXpShards,
  type LevelState,
  type PlayerVitals,
  type XpShard,
} from "./progression-combat.js";
import {
  absorbDamageWithWishcraftShield,
  createWishcraftRuntimeState,
  pickupRangeForWishcrafts,
  statSupportForWishcrafts,
  stepWishcraftMechanics,
  type WishcraftRuntimeEvent,
  type WishcraftRuntimeState,
} from "./wishcraft-mechanics.js";

export interface CombatLoopEnemy {
  id: string;
  templateId: CommonEnemyTemplate["id"];
  position: Point;
  health: number;
  radius: number;
  nextContactAtSeconds: number;
}

export interface CombatLoopPlayer {
  position: Point;
  vitals: PlayerVitals;
}

export interface CombatLoopState {
  player: CombatLoopPlayer;
  enemies: CombatLoopEnemy[];
  xpShards: XpShard[];
  levelState: LevelState;
  activeCombatSeconds: number;
  kills: number;
  bossKills: number;
  score: number;
  nextMachineGunAtSeconds: number;
  nextLaserSwordAtSeconds: number;
  nextXpShardId: number;
  feedback: CombatFeedback[];
  wishcraftLoadout: Wishcraft[];
  wishcraftRuntime: WishcraftRuntimeState;
}

const ENEMY_CONTACT_COOLDOWN_SECONDS = 0.75;

export type CombatFeedback =
  | { kind: "impact"; position: Point }
  | {
      kind: "wishcraft-hit";
      mechanicId: string;
      position: Point;
      visualKind: string;
      wishcraftId: string;
    }
  | { kind: "wishcraft-shield"; capacity: number; position: Point; wishcraftId: string }
  | { kind: "wishcraft-summon"; position: Point; summonId: string; wishcraftId: string }
  | { kind: "enemy-death"; position: Point }
  | { kind: "xp-drop"; position: Point; value: number }
  | { kind: "player-hit"; position: Point; damage: number }
  | { kind: "xp-collect"; position: Point; value: number }
  | { kind: "level-up"; level: number };

export interface CreateCombatLoopStateOptions {
  player: Point;
  enemies?: CombatLoopEnemy[];
  wishcraftLoadout?: Wishcraft[];
}

export interface StepCombatLoopOptions {
  deltaSeconds: number;
  nowSeconds: number;
}

export function createCombatLoopState(options: CreateCombatLoopStateOptions): CombatLoopState {
  const levelState = createLevelState();
  const playerVitals = createPlayerVitals({ level: levelState.level });
  return {
    player: {
      position: options.player,
      vitals: playerVitals,
    },
    enemies: options.enemies ?? [],
    xpShards: [],
    levelState,
    activeCombatSeconds: 0,
    kills: 0,
    bossKills: 0,
    score: 0,
    nextMachineGunAtSeconds: 0,
    nextLaserSwordAtSeconds: 0,
    nextXpShardId: 1,
    feedback: [],
    wishcraftLoadout: options.wishcraftLoadout ?? [],
    wishcraftRuntime: createWishcraftRuntimeState(),
  };
}

export function stepCombatLoop(
  state: CombatLoopState,
  options: StepCombatLoopOptions,
): CombatLoopState {
  const next: CombatLoopState = {
    ...state,
    player: { ...state.player, vitals: { ...state.player.vitals } },
    enemies: state.enemies.map((enemy) => ({ ...enemy })),
    xpShards: state.xpShards.map((shard) => ({ ...shard, position: { ...shard.position } })),
    levelState: { ...state.levelState },
    wishcraftLoadout: state.wishcraftLoadout.map((wishcraft) => ({
      ...wishcraft,
      mechanicPieceIds: [...wishcraft.mechanicPieceIds],
      parameters: { ...wishcraft.parameters },
      visualPieceIds: [...wishcraft.visualPieceIds],
    })),
    wishcraftRuntime: {
      nextFireAtSecondsByCraftId: { ...state.wishcraftRuntime.nextFireAtSecondsByCraftId },
      shield: { ...state.wishcraftRuntime.shield },
      summons: state.wishcraftRuntime.summons.map((summon) => ({ ...summon })),
    },
    activeCombatSeconds: state.activeCombatSeconds + options.deltaSeconds,
    feedback: [],
  };

  moveEnemiesTowardPlayer(next, options.deltaSeconds);
  const baseKitEvents = applyBaseKitAttacks(next, options.nowSeconds);
  const wishcraftEvents = applyWishcraftAttacks(
    next,
    options.nowSeconds,
    options.deltaSeconds,
    baseKitEvents,
  );
  const contactEvents = applyEnemyContacts(next, options.nowSeconds);
  if (next.player.vitals.health <= 0) {
    updateScore(next);
    return next;
  }
  const pickupEvents = updateXp(next, options.deltaSeconds);
  applyWishcraftTriggers(next, options.nowSeconds, options.deltaSeconds, [
    ...wishcraftEvents,
    ...contactEvents,
    ...pickupEvents,
  ]);
  updateScore(next);

  return next;
}

function updateScore(state: CombatLoopState): void {
  state.score = computeScore({
    activeCombatSeconds: state.activeCombatSeconds,
    kills: state.kills,
    level: state.levelState.level,
    bossKills: state.bossKills,
  });
}

function applyWishcraftAttacks(
  state: CombatLoopState,
  nowSeconds: number,
  deltaSeconds: number,
  events: readonly WishcraftRuntimeEvent[],
): WishcraftRuntimeEvent[] {
  stepWishcraftMechanics({
    context: {
      deltaSeconds,
      enemies: state.enemies,
      events,
      feedback: state.feedback,
      nowSeconds,
      player: state.player.position,
    },
    loadout: state.wishcraftLoadout,
    runtime: state.wishcraftRuntime,
  });
  return removeDefeatedEnemies(state);
}

function applyWishcraftTriggers(
  state: CombatLoopState,
  nowSeconds: number,
  deltaSeconds: number,
  events: readonly WishcraftRuntimeEvent[],
): WishcraftRuntimeEvent[] {
  if (events.length === 0) {
    return [];
  }
  stepWishcraftMechanics({
    context: {
      deltaSeconds,
      enemies: state.enemies,
      events,
      feedback: state.feedback,
      nowSeconds,
      player: state.player.position,
    },
    loadout: state.wishcraftLoadout,
    mode: "triggers",
    runtime: state.wishcraftRuntime,
  });
  return removeDefeatedEnemies(state);
}

function moveEnemiesTowardPlayer(state: CombatLoopState, deltaSeconds: number): void {
  for (const enemy of state.enemies) {
    const template = getEnemyTemplate(enemy.templateId);
    const dx = state.player.position.x - enemy.position.x;
    const dy = state.player.position.y - enemy.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) {
      continue;
    }
    const travel = Math.min(distance, template.speed * deltaSeconds);
    enemy.position = {
      x: enemy.position.x + (dx / distance) * travel,
      y: enemy.position.y + (dy / distance) * travel,
    };
  }
}

function applyBaseKitAttacks(
  state: CombatLoopState,
  nowSeconds: number,
): WishcraftRuntimeEvent[] {
  const baseKit = createBaseKit();
  const statSupport = statSupportForWishcrafts(state.wishcraftLoadout);
  if (nowSeconds >= state.nextMachineGunAtSeconds) {
    const target = chooseRangedTarget({
      player: state.player.position,
      enemies: state.enemies,
      range: baseKit.machineGun.range,
    });
    if (target) {
      target.health -= baseKit.machineGun.damage * statSupport.damageScale;
      state.nextMachineGunAtSeconds =
        nowSeconds + baseKit.machineGun.cooldownSeconds / statSupport.fireRateScale;
      state.feedback.push({ kind: "impact", position: target.position });
    }
  }

  if (
    nowSeconds >= state.nextLaserSwordAtSeconds &&
    shouldTriggerMelee({
      player: state.player.position,
      enemies: state.enemies,
      range: baseKit.laserSword.range,
    })
  ) {
    for (const enemy of state.enemies) {
      const distance = Math.hypot(
        enemy.position.x - state.player.position.x,
        enemy.position.y - state.player.position.y,
      );
      if (distance - enemy.radius <= baseKit.laserSword.range) {
        enemy.health -= baseKit.laserSword.damage * statSupport.damageScale;
        state.feedback.push({ kind: "impact", position: enemy.position });
      }
    }
    state.nextLaserSwordAtSeconds =
      nowSeconds + baseKit.laserSword.cooldownSeconds / statSupport.fireRateScale;
  }

  return removeDefeatedEnemies(state);
}

function removeDefeatedEnemies(state: CombatLoopState): WishcraftRuntimeEvent[] {
  const events: WishcraftRuntimeEvent[] = [];
  const survivors: CombatLoopEnemy[] = [];
  for (const enemy of state.enemies) {
    if (enemy.health > 0) {
      survivors.push(enemy);
      continue;
    }

    const template = getEnemyTemplate(enemy.templateId);
    state.kills += 1;
    events.push({ kind: "kill", position: enemy.position });
    state.feedback.push({ kind: "enemy-death", position: enemy.position });
    state.feedback.push({ kind: "xp-drop", position: enemy.position, value: template.xpValue });
    state.xpShards.push({
      id: `xp-${state.nextXpShardId}`,
      position: { ...enemy.position },
      value: template.xpValue,
      attracted: false,
    });
    state.nextXpShardId += 1;
  }
  state.enemies = survivors;
  return events;
}

function applyEnemyContacts(
  state: CombatLoopState,
  nowSeconds: number,
): WishcraftRuntimeEvent[] {
  const events: WishcraftRuntimeEvent[] = [];
  const touchingEnemies = state.enemies.filter((enemy) => {
    const distance = Math.hypot(
      enemy.position.x - state.player.position.x,
      enemy.position.y - state.player.position.y,
    );
    return distance <= enemy.radius + 18 && nowSeconds >= enemy.nextContactAtSeconds;
  });
  const contacts = touchingEnemies.map((enemy) => ({
    damage: getEnemyTemplate(enemy.templateId).contactDamage,
  }));
  const highestContactDamage = Math.max(0, ...contacts.map((contact) => contact.damage));
  const canTakeDamage = nowSeconds >= state.player.vitals.invulnerableUntilSeconds;
  const shieldResult =
    canTakeDamage && highestContactDamage > 0
      ? absorbDamageWithWishcraftShield({
          damage: highestContactDamage,
          nowSeconds,
          runtime: state.wishcraftRuntime,
        })
      : { healthDamage: highestContactDamage, shieldDamage: 0 };

  const result = applyContactDamage({
    player: state.player.vitals,
    nowSeconds,
    contacts: shieldResult.healthDamage > 0 ? [{ damage: shieldResult.healthDamage }] : [],
  });
  state.player.vitals = result.player;
  if (result.damageTaken > 0 || shieldResult.shieldDamage > 0) {
    for (const enemy of touchingEnemies) {
      enemy.nextContactAtSeconds = nowSeconds + ENEMY_CONTACT_COOLDOWN_SECONDS;
    }
    if (shieldResult.shieldDamage > 0) {
      if (
        state.wishcraftRuntime.shield.capacity > 0 &&
        state.wishcraftRuntime.shield.value <= state.wishcraftRuntime.shield.capacity * 0.35
      ) {
        events.push({ kind: "low-shield", position: state.player.position });
      }
      state.feedback.push({
        kind: "wishcraft-shield",
        capacity: state.wishcraftRuntime.shield.capacity,
        position: state.player.position,
        wishcraftId: "shield-hit",
      });
    }
    if (result.damageTaken > 0) {
      state.feedback.push({
        kind: "player-hit",
        position: state.player.position,
        damage: result.damageTaken,
      });
    }
  }
  return events;
}

function updateXp(state: CombatLoopState, deltaSeconds: number): WishcraftRuntimeEvent[] {
  const events: WishcraftRuntimeEvent[] = [];
  const moved = mergeXpShards(
    moveXpShards({
      shards: state.xpShards,
      player: state.player.position,
      deltaSeconds,
      pickupRange: pickupRangeForWishcrafts(state.wishcraftLoadout, 90),
    }),
  );
  const remaining: XpShard[] = [];

  for (const shard of moved) {
    const distance = Math.hypot(
      shard.position.x - state.player.position.x,
      shard.position.y - state.player.position.y,
    );
    if (distance <= 10) {
      const beforeLevel = state.levelState.level;
      const result = collectXp({
        levelState: state.levelState,
        player: state.player.vitals,
        xpValue: shard.value,
      });
      state.levelState = result.levelState;
      state.player.vitals = result.player;
      events.push({ kind: "pickup", position: shard.position });
      state.feedback.push({ kind: "xp-collect", position: shard.position, value: shard.value });
      if (result.levelState.level > beforeLevel) {
        for (let level = beforeLevel + 1; level <= result.levelState.level; level += 1) {
          state.feedback.push({ kind: "level-up", level });
        }
      }
    } else {
      remaining.push(shard);
    }
  }

  state.xpShards = remaining;
  return events;
}

function getEnemyTemplate(id: CommonEnemyTemplate["id"]): CommonEnemyTemplate {
  return getCommonEnemyTemplate(id);
}
