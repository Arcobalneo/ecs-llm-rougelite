import { describe, expect, it } from "vitest";
import {
  completeBossEncounter,
  createBossEncounterState,
  queueBossAfterManifestation,
  startBossWarning,
  stepBossEncounterRuntime,
} from "../../src/client/simulation/boss-encounter.js";
import { createCombatLoopState } from "../../src/client/simulation/combat-loop.js";
import { createWishcraftRuntimeState } from "../../src/client/simulation/wishcraft-mechanics.js";
import { createBossEncounterPlan } from "../../src/shared/boss/boss-planning.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";

describe("Boss Encounter lifecycle", () => {
  it("queues milestone Boss only after the milestone Manifestation completes", () => {
    const bossState = createBossEncounterState();
    const beforeManifestation = queueBossAfterManifestation(bossState, {
      currentLevel: 5,
      manifestationFinished: false,
      loadout: [wishcraftCatalog.fixtures.starLance],
    });
    expect(beforeManifestation.phase).toBe("none");

    const queued = queueBossAfterManifestation(bossState, {
      currentLevel: 5,
      manifestationFinished: true,
      loadout: [wishcraftCatalog.fixtures.starLance],
    });
    expect(queued.phase).toBe("queued-warning");
    expect(queued.pendingPlan?.plannedLevel).toBe(5);
  });

  it("treats Boss warning as a paused non-combat presentation moment", () => {
    const plan = createBossEncounterPlan({
      bossEncounterNumber: 1,
      loadout: [wishcraftCatalog.fixtures.starLance],
      plannedLevel: 5,
    });

    const warning = startBossWarning(createBossEncounterState(), plan);

    expect(warning.phase).toBe("warning");
    expect(warning.combatPaused).toBe(true);
    expect(warning.activeCombatSeconds).toBe(0);
  });

  it("pauses new level-up Wish Breaks while Boss is active and preserves queued levels", () => {
    const plan = createBossEncounterPlan({
      bossEncounterNumber: 1,
      loadout: [wishcraftCatalog.fixtures.starLance],
      plannedLevel: 5,
    });
    const active = { ...startBossWarning(createBossEncounterState(), plan), phase: "active" as const };

    const queued = queueBossAfterManifestation(active, {
      currentLevel: 6,
      manifestationFinished: true,
      loadout: [wishcraftCatalog.fixtures.starLance],
    });

    expect(queued.phase).toBe("active");
    expect(queued.queuedLevelUps).toEqual([6]);
  });

  it("rewards Boss victory with XP burst and full health without changing shields", () => {
    const combat = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
      wishcraftLoadout: [wishcraftCatalog.fixtures.starLance],
    });
    combat.player.vitals.health = 35;
    combat.wishcraftRuntime = {
      ...createWishcraftRuntimeState(),
      shield: {
        capacity: 40,
        value: 12,
        nextRegenAtSeconds: 100,
        regenDelaySeconds: 4,
      },
    };
    const plan = createBossEncounterPlan({
      bossEncounterNumber: 3,
      loadout: combat.wishcraftLoadout,
      plannedLevel: 15,
    });
    const bossState = {
      ...startBossWarning(createBossEncounterState(), plan),
      bosses: plan.bosses.map((boss) => ({ id: boss.name, health: 0, maxHealth: 100 })),
      phase: "active" as const,
    };

    const result = completeBossEncounter({
      bossState,
      combat,
      playerPosition: combat.player.position,
    });

    expect(result.combat.bossKills).toBe(2);
    expect(result.combat.xpShards.reduce((sum, shard) => sum + shard.value, 0)).toBeGreaterThanOrEqual(180);
    expect(result.combat.player.vitals.health).toBe(result.combat.player.vitals.maxHealth);
    expect(result.combat.wishcraftRuntime.shield).toMatchObject({
      capacity: 40,
      value: 12,
    });
    expect(result.bossState.phase).toBe("victory");
    expect(result.bossState.advanceArenaPhase).toBe(true);
  });

  it("advances Boss warning to active combat and only rewards victory after Boss health reaches zero", () => {
    const combat = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
      wishcraftLoadout: [wishcraftCatalog.fixtures.starLance],
    });
    combat.player.vitals.health = 40;
    const plan = createBossEncounterPlan({
      bossEncounterNumber: 1,
      loadout: combat.wishcraftLoadout,
      plannedLevel: 5,
    });
    const warning = startBossWarning(createBossEncounterState(), plan);

    const active = stepBossEncounterRuntime({
      bossState: warning,
      combat,
      deltaSeconds: 1.25,
      playerPosition: combat.player.position,
    });
    expect(active.bossState.phase).toBe("active");
    expect(active.bossState.combatPaused).toBe(false);
    expect(active.combat.bossKills).toBe(0);
    expect(active.bossState.healthProgress).toBe(1);

    const stillActive = stepBossEncounterRuntime({
      bossState: active.bossState,
      combat: active.combat,
      deltaSeconds: 16,
      playerPosition: combat.player.position,
    });
    expect(stillActive.bossState.phase).toBe("active");
    expect(stillActive.combat.bossKills).toBe(0);

    const victory = stepBossEncounterRuntime({
      bossState: {
        ...stillActive.bossState,
        bosses: stillActive.bossState.bosses.map((boss) => ({ ...boss, health: 0 })),
      },
      combat: stillActive.combat,
      deltaSeconds: 0.1,
      playerPosition: combat.player.position,
    });
    expect(victory.bossState.phase).toBe("victory");
    expect(victory.bossState.combatPaused).toBe(false);
    expect(victory.combat.bossKills).toBe(1);
    expect(victory.combat.player.vitals.health).toBe(victory.combat.player.vitals.maxHealth);
    expect(victory.combat.xpShards.reduce((sum, shard) => sum + shard.value, 0)).toBeGreaterThanOrEqual(100);
    expect(victory.bossState.pendingPlan).toBeUndefined();
  });

  it("does not let Boss victory healing overwrite player death in the same frame", () => {
    const combat = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
      wishcraftLoadout: [wishcraftCatalog.fixtures.starLance],
    });
    combat.player.vitals.health = 0;
    const plan = createBossEncounterPlan({
      bossEncounterNumber: 1,
      loadout: combat.wishcraftLoadout,
      plannedLevel: 5,
    });
    const active = {
      ...startBossWarning(createBossEncounterState(), plan),
      phase: "active" as const,
      bosses: [{ id: "boss", health: 0, maxHealth: 100 }],
      runtimeSeconds: 13.9,
    };

    const result = stepBossEncounterRuntime({
      bossState: active,
      combat,
      deltaSeconds: 1,
      playerPosition: combat.player.position,
    });

    expect(result.bossState.phase).toBe("active");
    expect(result.combat.bossKills).toBe(0);
    expect(result.combat.player.vitals.health).toBe(0);
  });
});
