import type { BossEncounterPlan } from "../../shared/boss/boss-planning.js";
import { createBossEncounterPlan } from "../../shared/boss/boss-planning.js";
import type { Point } from "./arena-math.js";
import type { CombatLoopState } from "./combat-loop.js";

export type BossEncounterPhase = "active" | "none" | "queued-warning" | "victory" | "warning";

export interface BossEncounterState {
  activeCombatSeconds: number;
  advanceArenaPhase: boolean;
  bosses: BossRuntimeState[];
  bossEncounterNumber: number;
  combatPaused: boolean;
  completedPlan?: BossEncounterPlan;
  healthProgress: number;
  pendingPlan?: BossEncounterPlan;
  phase: BossEncounterPhase;
  queuedLevelUps: number[];
  runtimeSeconds: number;
}

export interface BossRuntimeState {
  health: number;
  id: string;
  maxHealth: number;
}

export function createBossEncounterState(): BossEncounterState {
  return {
    activeCombatSeconds: 0,
    advanceArenaPhase: false,
    bosses: [],
    bossEncounterNumber: 0,
    healthProgress: 0,
    combatPaused: false,
    phase: "none",
    queuedLevelUps: [],
    runtimeSeconds: 0,
  };
}

export function queueBossAfterManifestation(
  state: BossEncounterState,
  options: {
    currentLevel: number;
    manifestationFinished: boolean;
    loadout: CombatLoopState["wishcraftLoadout"];
  },
): BossEncounterState {
  if (state.phase === "active") {
    return {
      ...state,
      queuedLevelUps: [...state.queuedLevelUps, options.currentLevel],
    };
  }
  if (!options.manifestationFinished || options.currentLevel % 5 !== 0) {
    return state;
  }
  const bossEncounterNumber = state.bossEncounterNumber + 1;
  return {
    ...state,
    bossEncounterNumber,
    bosses: createBossRuntimeState({
      bossEncounterNumber,
      bossCount: 0,
    }),
    combatPaused: true,
    completedPlan: undefined,
    healthProgress: 1,
    pendingPlan: createBossEncounterPlan({
      bossEncounterNumber,
      loadout: options.loadout,
      plannedLevel: options.currentLevel,
    }),
    phase: "queued-warning",
    runtimeSeconds: 0,
  };
}

export function startBossWarning(
  state: BossEncounterState,
  plan: BossEncounterPlan,
): BossEncounterState {
  return {
    ...state,
    activeCombatSeconds: state.activeCombatSeconds,
    bossEncounterNumber: Math.max(state.bossEncounterNumber, plan.bossEncounterNumber),
    bosses: createBossRuntimeState({
      bossEncounterNumber: plan.bossEncounterNumber,
      bossCount: plan.bosses.length,
    }),
    combatPaused: true,
    completedPlan: undefined,
    healthProgress: 1,
    pendingPlan: plan,
    phase: "warning",
    runtimeSeconds: 0,
  };
}

export function stepBossEncounterRuntime(options: {
  bossState: BossEncounterState;
  combat: CombatLoopState;
  deltaSeconds: number;
  playerPosition: Point;
}): { bossState: BossEncounterState; combat: CombatLoopState } {
  if (options.combat.player.vitals.health <= 0) {
    return options;
  }

  if (options.bossState.phase === "warning") {
    const runtimeSeconds = options.bossState.runtimeSeconds + options.deltaSeconds;
    if (runtimeSeconds < BOSS_WARNING_SECONDS) {
      return {
        bossState: { ...options.bossState, combatPaused: true, runtimeSeconds },
        combat: options.combat,
      };
    }
    return {
      bossState: {
        ...options.bossState,
        combatPaused: false,
        healthProgress: healthProgress(options.bossState.bosses),
        phase: "active",
        runtimeSeconds: 0,
      },
      combat: options.combat,
    };
  }

  if (options.bossState.phase === "active") {
    const runtimeSeconds = options.bossState.runtimeSeconds + options.deltaSeconds;
    const bosses = damageBosses({
      bosses: options.bossState.bosses,
      combat: options.combat,
      deltaSeconds: options.deltaSeconds,
    });
    if (bosses.some((boss) => boss.health > 0)) {
      return {
        bossState: {
          ...options.bossState,
          bosses,
          combatPaused: false,
          healthProgress: healthProgress(bosses),
          runtimeSeconds,
        },
        combat: options.combat,
      };
    }
    return completeBossEncounter({
      bossState: { ...options.bossState, bosses, healthProgress: 0, runtimeSeconds },
      combat: options.combat,
      playerPosition: options.playerPosition,
    });
  }

  return options;
}

export function completeBossEncounter(options: {
  bossState: BossEncounterState;
  combat: CombatLoopState;
  playerPosition: Point;
}): { bossState: BossEncounterState; combat: CombatLoopState } {
  const plan = options.bossState.pendingPlan;
  const bossCount = plan?.bosses.length ?? 1;
  const nextCombat: CombatLoopState = {
    ...options.combat,
    bossKills: options.combat.bossKills + bossCount,
    feedback: [...options.combat.feedback],
    player: {
      ...options.combat.player,
      vitals: {
        ...options.combat.player.vitals,
        health: options.combat.player.vitals.maxHealth,
      },
    },
    wishcraftRuntime: {
      ...options.combat.wishcraftRuntime,
      nextFireAtSecondsByCraftId: { ...options.combat.wishcraftRuntime.nextFireAtSecondsByCraftId },
      shield: { ...options.combat.wishcraftRuntime.shield },
      summons: options.combat.wishcraftRuntime.summons.map((summon) => ({ ...summon })),
    },
    xpShards: [
      ...options.combat.xpShards.map((shard) => ({ ...shard, position: { ...shard.position } })),
      ...createBossXpBurst({
        bossCount,
        nextXpShardId: options.combat.nextXpShardId,
        position: options.playerPosition,
      }),
    ],
    nextXpShardId: options.combat.nextXpShardId + bossCount * 6,
  };

  return {
    bossState: {
      ...options.bossState,
      advanceArenaPhase: plan?.encounterKind === "double",
      bosses: [],
      combatPaused: false,
      completedPlan: plan,
      healthProgress: 0,
      pendingPlan: undefined,
      phase: "victory",
      runtimeSeconds: 0,
    },
    combat: nextCombat,
  };
}

const BOSS_WARNING_SECONDS = 1.2;

function createBossRuntimeState(options: {
  bossCount: number;
  bossEncounterNumber: number;
}): BossRuntimeState[] {
  const bossCount = Math.max(1, options.bossCount);
  const maxHealth = 820 + options.bossEncounterNumber * 90 + (bossCount - 1) * 160;
  return Array.from({ length: bossCount }, (_, index) => ({
    health: maxHealth,
    id: `boss-runtime-${options.bossEncounterNumber}-${index + 1}`,
    maxHealth,
  }));
}

function damageBosses(options: {
  bosses: readonly BossRuntimeState[];
  combat: CombatLoopState;
  deltaSeconds: number;
}): BossRuntimeState[] {
  const liveBosses = options.bosses.filter((boss) => boss.health > 0);
  if (liveBosses.length === 0) {
    return options.bosses.map((boss) => ({ ...boss, health: 0 }));
  }
  const damage = bossDamagePerSecond(options.combat) * options.deltaSeconds;
  return options.bosses.map((boss) => {
    if (boss.health <= 0) {
      return boss;
    }
    return {
      ...boss,
      health: Math.max(0, boss.health - damage),
    };
  });
}

function bossDamagePerSecond(combat: CombatLoopState): number {
  const loadoutPressure = combat.wishcraftLoadout.reduce((sum, wishcraft) => {
    const pieceCount = Math.max(1, wishcraft.mechanicPieceIds.length);
    const visualCount = Math.max(1, wishcraft.visualPieceIds.length);
    const damageScale = typeof wishcraft.parameters.damageScale === "number" ? wishcraft.parameters.damageScale : 1;
    return sum + 18 * pieceCount * Math.max(1, damageScale) + visualCount * 2;
  }, 0);
  return 24 + loadoutPressure * 0.55;
}

function healthProgress(bosses: readonly BossRuntimeState[]): number {
  const maxHealth = bosses.reduce((sum, boss) => sum + boss.maxHealth, 0);
  if (maxHealth <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, bosses.reduce((sum, boss) => sum + boss.health, 0) / maxHealth));
}

function createBossXpBurst(options: {
  bossCount: number;
  nextXpShardId: number;
  position: Point;
}): CombatLoopState["xpShards"] {
  const shardCount = options.bossCount * 6;
  return Array.from({ length: shardCount }, (_, index) => {
    const angle = (index / shardCount) * Math.PI * 2;
    const radius = 28 + (index % 3) * 18;
    return {
      attracted: false,
      id: `boss-xp-${options.nextXpShardId + index}`,
      position: {
        x: options.position.x + Math.cos(angle) * radius,
        y: options.position.y + Math.sin(angle) * radius,
      },
      value: 18,
    };
  });
}
