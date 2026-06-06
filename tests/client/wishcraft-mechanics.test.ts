import { describe, expect, it } from "vitest";
import {
  createCombatLoopState,
  stepCombatLoop,
  type CombatLoopEnemy,
} from "../../src/client/simulation/combat-loop.js";
import type { Wishcraft } from "../../src/shared/wishcraft/types.js";

describe("Wishcraft Mechanic runtime", () => {
  it("applies a projectile Wishcraft as automatic direct damage with readable feedback", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "projectile-lance",
          mechanicPieceIds: ["projectile-lance"],
          parameters: {
            damageScale: 1.2,
            projectileCount: 1,
            projectileSpeedScale: 1,
          },
        }),
      ],
      enemies: [
        {
          id: "target",
          templateId: "slow-tough",
          position: { x: 280, y: 100 },
          health: 20,
          radius: 18,
          nextContactAtSeconds: 0,
        },
      ],
    });
    state.nextMachineGunAtSeconds = 999;
    state.nextLaserSwordAtSeconds = 999;

    const stepped = stepCombatLoop(state, { deltaSeconds: 0.25, nowSeconds: 0.25 });

    expect(stepped.enemies[0].health).toBeLessThan(20);
    expect(stepped.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "wishcraft-hit",
          mechanicId: "projectile-lance",
          targetRadius: 18,
          targetTemplateId: "slow-tough",
          visualKind: "lance",
        }),
      ]),
    );
  });

  it("triggers melee Wishcrafts only when a nearby threat exists", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "melee-arc",
          mechanicPieceIds: ["melee-arc"],
          parameters: { damageScale: 1, arcDegrees: 90, rangeScale: 1 },
        }),
      ],
      enemies: [
        {
          id: "far",
          templateId: "slow-tough",
          position: { x: 280, y: 100 },
          health: 20,
          radius: 18,
          nextContactAtSeconds: 0,
        },
      ],
    });
    state.nextMachineGunAtSeconds = 999;
    state.nextLaserSwordAtSeconds = 999;

    const farStep = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });
    expect(farStep.enemies[0].health).toBe(20);
    expect(farStep.feedback.map((event) => event.kind)).not.toContain("wishcraft-hit");

    const nearStep = stepCombatLoop(
      {
        ...farStep,
        enemies: [{ ...farStep.enemies[0], position: { x: 140, y: 100 } }],
      },
      { deltaSeconds: 0.8, nowSeconds: 0.9 },
    );

    expect(nearStep.enemies[0].health).toBeLessThan(20);
    expect(nearStep.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "wishcraft-hit", visualKind: "melee" }),
      ]),
    );
  });

  it("applies area burst archetypes as direct area damage without enemy status effects", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "area-burst-ring",
          mechanicPieceIds: ["area-burst-ring"],
          parameters: { damageScale: 1, blastRadius: 100, fireRateScale: 1 },
        }),
      ],
      enemies: [
        {
          id: "inside",
          templateId: "slow-tough",
          position: { x: 160, y: 100 },
          health: 30,
          radius: 18,
          nextContactAtSeconds: 0,
        },
        {
          id: "outside",
          templateId: "slow-tough",
          position: { x: 320, y: 100 },
          health: 30,
          radius: 18,
          nextContactAtSeconds: 0,
        },
      ],
    });
    state.nextMachineGunAtSeconds = 999;
    state.nextLaserSwordAtSeconds = 999;

    const stepped = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });

    expect(stepped.enemies.find((enemy) => enemy.id === "inside")?.health).toBeLessThan(30);
    expect(stepped.enemies.find((enemy) => enemy.id === "outside")?.health).toBe(30);
    expect(JSON.stringify(stepped.enemies)).not.toContain("status");
    expect(JSON.stringify(stepped.enemies)).not.toContain("dot");
  });

  it("fires on-kill triggers from actual kill events instead of unconditional pulses", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "trigger-on-kill",
          mechanicPieceIds: ["trigger-on-kill"],
          parameters: { damageScale: 1, blastRadius: 70 },
        }),
      ],
      enemies: [
        {
          id: "victim",
          templateId: "swarm-fragile",
          position: { x: 170, y: 100 },
          health: 6,
          radius: 11,
          nextContactAtSeconds: 0,
        },
        {
          id: "near-death",
          templateId: "slow-tough",
          position: { x: 215, y: 100 },
          health: 24,
          radius: 18,
          nextContactAtSeconds: 0,
        },
        {
          id: "far",
          templateId: "slow-tough",
          position: { x: 360, y: 100 },
          health: 24,
          radius: 18,
          nextContactAtSeconds: 0,
        },
      ],
    });
    state.nextLaserSwordAtSeconds = 999;

    const stepped = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });

    expect(stepped.enemies.some((enemy) => enemy.id === "victim")).toBe(false);
    expect(stepped.enemies.find((enemy) => enemy.id === "near-death")?.health).toBeLessThan(24);
    expect(stepped.enemies.find((enemy) => enemy.id === "far")?.health).toBe(24);
    expect(stepped.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "wishcraft-hit", visualKind: "trigger" }),
      ]),
    );
  });

  it("fires on-pickup triggers only from collected XP shards", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "trigger-on-pickup",
          mechanicPieceIds: ["trigger-on-pickup"],
          parameters: { damageScale: 1, blastRadius: 80 },
        }),
      ],
      enemies: [
        {
          id: "near-pickup",
          templateId: "slow-tough",
          position: { x: 150, y: 100 },
          health: 24,
          radius: 18,
          nextContactAtSeconds: 0,
        },
      ],
    });
    state.nextMachineGunAtSeconds = 999;
    state.nextLaserSwordAtSeconds = 999;
    state.xpShards.push({
      id: "xp-at-player",
      attracted: true,
      position: { x: 102, y: 100 },
      value: 5,
    });

    const stepped = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });

    expect(stepped.xpShards).toHaveLength(0);
    expect(stepped.enemies[0].health).toBeLessThan(24);
    expect(stepped.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "wishcraft-hit", visualKind: "trigger" }),
      ]),
    );
  });

  it("fires low-shield triggers from shield damage without changing health recovery rules", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "shield-capacity",
          mechanicPieceIds: ["shield-capacity"],
          parameters: { shieldCapacity: 12, shieldRegenDelay: 4 },
        }),
        createWishcraft({
          primaryMechanicId: "trigger-low-shield",
          mechanicPieceIds: ["trigger-low-shield"],
          parameters: { shieldCapacity: 12, blastRadius: 70 },
        }),
      ],
      enemies: [
        {
          id: "shield-contact",
          templateId: "slow-tough",
          position: { x: 110, y: 100 },
          health: 30,
          radius: 18,
          nextContactAtSeconds: 0,
        },
      ],
    });
    state.player.vitals.health = 75;
    state.nextMachineGunAtSeconds = 999;
    state.nextLaserSwordAtSeconds = 999;

    const stepped = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });

    expect(stepped.player.vitals.health).toBe(75);
    expect(stepped.wishcraftRuntime.shield.value).toBeLessThanOrEqual(12 * 0.35);
    expect(stepped.enemies[0].health).toBeLessThan(30);
    expect(stepped.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "wishcraft-hit", visualKind: "trigger" }),
      ]),
    );
  });

  it("creates player-following summons with a runtime quantity limit", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "summon-orbiter",
          mechanicPieceIds: ["summon-orbiter"],
          parameters: { summonCount: 12, damageScale: 1, orbitRadius: 72 },
        }),
      ],
      enemies: [],
    });

    const stepped = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });

    expect(stepped.wishcraftRuntime.summons).toHaveLength(5);
    expect(stepped.wishcraftRuntime.summons.every((summon) => summon.craftId === "test-summon-orbiter")).toBe(true);
    expect(
      stepped.wishcraftRuntime.summons.every((summon) =>
        Math.hypot(summon.position.x - 100, summon.position.y - 100) <= summon.orbitRadius + 0.01,
      ),
    ).toBe(true);
    expect(stepped.feedback.filter((event) => event.kind === "wishcraft-summon")).toHaveLength(5);
  });

  it("adds shield capacity without changing max health or healing the player", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "shield-capacity",
          mechanicPieceIds: ["shield-capacity"],
          parameters: { shieldCapacity: 40, shieldRegenDelay: 4 },
        }),
      ],
      enemies: [],
    });
    state.player.vitals.health = 50;
    const beforeMaxHealth = state.player.vitals.maxHealth;

    const stepped = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });

    expect(stepped.wishcraftRuntime.shield).toMatchObject({ capacity: 40, value: 40 });
    expect(stepped.player.vitals.maxHealth).toBe(beforeMaxHealth);
    expect(stepped.player.vitals.health).toBe(50);
  });

  it("uses shield capacity before health damage and regenerates only from equipped shield Wishcrafts", () => {
    const withoutShield = stepCombatLoop(
      createCombatLoopState({
        player: { x: 100, y: 100 },
        enemies: [],
      }),
      { deltaSeconds: 4, nowSeconds: 4 },
    );
    expect(withoutShield.wishcraftRuntime.shield).toMatchObject({ capacity: 0, value: 0 });

    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "shield-capacity",
          mechanicPieceIds: ["shield-capacity"],
          parameters: { shieldCapacity: 20, shieldRegenDelay: 1.5 },
        }),
      ],
      enemies: [
        {
          id: "contact",
          templateId: "slow-tough",
          position: { x: 110, y: 100 },
          health: 30,
          radius: 18,
          nextContactAtSeconds: 0,
        },
      ],
    });
    state.nextMachineGunAtSeconds = 999;
    state.nextLaserSwordAtSeconds = 999;
    state.player.vitals.health = 75;

    const shieldHit = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });

    expect(shieldHit.player.vitals.health).toBe(75);
    expect(shieldHit.wishcraftRuntime.shield).toMatchObject({ capacity: 20, value: 10 });

    const beforeDelay = stepCombatLoop(
      { ...shieldHit, enemies: [] },
      { deltaSeconds: 0.9, nowSeconds: 1 },
    );
    expect(beforeDelay.wishcraftRuntime.shield.value).toBe(10);

    const regenerated = stepCombatLoop(beforeDelay, { deltaSeconds: 1, nowSeconds: 2 });
    expect(regenerated.player.vitals.health).toBe(75);
    expect(regenerated.wishcraftRuntime.shield.value).toBeGreaterThan(10);
    expect(regenerated.wishcraftRuntime.shield.value).toBeLessThanOrEqual(20);
  });

  it("lets pickup Wishcrafts expand XP attraction range without changing XP value", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "pickup-magnet",
          mechanicPieceIds: ["pickup-magnet"],
          parameters: { pickupRangeScale: 2 },
        }),
      ],
      enemies: [],
    });
    state.xpShards.push({
      id: "xp-far",
      attracted: false,
      position: { x: 250, y: 100 },
      value: 9,
    });

    const stepped = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });

    expect(stepped.xpShards[0].attracted).toBe(true);
    expect(stepped.xpShards[0].position.x).toBeLessThan(250);
    expect(stepped.xpShards[0].value).toBe(9);
  });

  it("maps varied projectile family pieces to distinct short-lifecycle feedback", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "projectile-beam",
          mechanicPieceIds: ["projectile-beam"],
          parameters: { damageScale: 1, rangeScale: 1, fireRateScale: 1 },
        }),
        createWishcraft({
          primaryMechanicId: "projectile-missile",
          mechanicPieceIds: ["projectile-missile"],
          parameters: { damageScale: 1, projectileCount: 1, blastRadius: 70 },
        }),
        createWishcraft({
          primaryMechanicId: "projectile-scatter",
          mechanicPieceIds: ["projectile-scatter"],
          parameters: { damageScale: 1, projectileCount: 1, spreadAngle: 35 },
        }),
        createWishcraft({
          primaryMechanicId: "projectile-ricochet",
          mechanicPieceIds: ["projectile-ricochet"],
          parameters: { damageScale: 1, bounceCount: 2, projectileSpeedScale: 1 },
        }),
        createWishcraft({
          primaryMechanicId: "burst-front",
          mechanicPieceIds: ["burst-front"],
          parameters: { damageScale: 1, projectileCount: 1, spreadAngle: 35 },
        }),
      ],
      enemies: [
        {
          id: "target",
          templateId: "slow-tough",
          position: { x: 220, y: 100 },
          health: 200,
          radius: 18,
          nextContactAtSeconds: 0,
        },
      ],
    });
    state.nextMachineGunAtSeconds = 999;
    state.nextLaserSwordAtSeconds = 999;

    const stepped = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });
    const visualKinds = stepped.feedback
      .filter((event) => event.kind === "wishcraft-hit")
      .map((event) => event.visualKind);

    expect(visualKinds).toEqual(
      expect.arrayContaining(["beam", "missile", "scatter", "ricochet", "burst"]),
    );
  });

  it("makes projectile fantasies mechanically distinct while staying direct-damage only", () => {
    const scatterState = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "projectile-scatter",
          mechanicPieceIds: ["projectile-scatter"],
          parameters: { damageScale: 1, projectileCount: 3, spreadAngle: 35 },
        }),
      ],
      enemies: [
        createEnemy("scatter-a", 240, 74),
        createEnemy("scatter-b", 248, 100),
        createEnemy("scatter-c", 240, 126),
        createEnemy("scatter-outside", 240, 220),
      ],
    });
    scatterState.nextMachineGunAtSeconds = 999;
    scatterState.nextLaserSwordAtSeconds = 999;

    const scatter = stepCombatLoop(scatterState, { deltaSeconds: 0.1, nowSeconds: 0.1 });
    expect(damagedEnemyIds(scatter.enemies)).toEqual(["scatter-a", "scatter-b", "scatter-c"]);
    expect(hitKinds(scatter)).toEqual(["scatter", "scatter", "scatter"]);

    const pierceState = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "projectile-pierce",
          mechanicPieceIds: ["projectile-pierce"],
          parameters: { damageScale: 1, pierceCount: 2, projectileSpeedScale: 1 },
        }),
      ],
      enemies: [
        createEnemy("pierce-first", 210, 100),
        createEnemy("pierce-second", 290, 104),
        createEnemy("pierce-third", 370, 96),
        createEnemy("pierce-wide", 280, 170),
      ],
    });
    pierceState.nextMachineGunAtSeconds = 999;
    pierceState.nextLaserSwordAtSeconds = 999;

    const pierce = stepCombatLoop(pierceState, { deltaSeconds: 0.1, nowSeconds: 0.1 });
    expect(damagedEnemyIds(pierce.enemies)).toEqual(["pierce-first", "pierce-second", "pierce-third"]);
    expect(hitKinds(pierce)).toEqual(["beam", "beam", "beam"]);

    const missileState = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "projectile-missile",
          mechanicPieceIds: ["projectile-missile"],
          parameters: { damageScale: 1, projectileCount: 1, blastRadius: 72 },
        }),
      ],
      enemies: [
        createEnemy("missile-center", 260, 100),
        createEnemy("missile-splash", 314, 102),
        createEnemy("missile-outside", 372, 100),
      ],
    });
    missileState.nextMachineGunAtSeconds = 999;
    missileState.nextLaserSwordAtSeconds = 999;

    const missile = stepCombatLoop(missileState, { deltaSeconds: 0.1, nowSeconds: 0.1 });
    expect(damagedEnemyIds(missile.enemies)).toEqual(["missile-center", "missile-splash"]);
    expect(hitKinds(missile)).toEqual(["missile", "missile"]);

    const ricochetState = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "projectile-ricochet",
          mechanicPieceIds: ["projectile-ricochet"],
          parameters: { damageScale: 1, bounceCount: 2, projectileSpeedScale: 1 },
        }),
      ],
      enemies: [
        createEnemy("ricochet-first", 220, 100),
        createEnemy("ricochet-second", 272, 128),
        createEnemy("ricochet-third", 326, 92),
        createEnemy("ricochet-too-far", 520, 100),
      ],
    });
    ricochetState.nextMachineGunAtSeconds = 999;
    ricochetState.nextLaserSwordAtSeconds = 999;

    const ricochet = stepCombatLoop(ricochetState, { deltaSeconds: 0.1, nowSeconds: 0.1 });
    expect(damagedEnemyIds(ricochet.enemies)).toEqual(["ricochet-first", "ricochet-second", "ricochet-third"]);
    expect(hitKinds(ricochet)).toEqual(["ricochet", "ricochet", "ricochet"]);
    expect(JSON.stringify([...scatter.enemies, ...pierce.enemies, ...missile.enemies, ...ricochet.enemies])).not.toContain(
      "status",
    );
  });

  it("applies stat support to direct attacks without changing movement, max health, or healing", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "projectile-lance",
          mechanicPieceIds: ["projectile-lance", "damage-tuning", "attack-rate-pulse"],
          parameters: {
            damageScale: 1.3,
            fireRateScale: 1.4,
            projectileCount: 1,
            projectileSpeedScale: 1,
          },
        }),
      ],
      enemies: [
        {
          id: "target",
          templateId: "slow-tough",
          position: { x: 220, y: 100 },
          health: 40,
          radius: 18,
          nextContactAtSeconds: 0,
        },
      ],
    });
    state.player.vitals.health = 40;
    state.nextMachineGunAtSeconds = 999;
    state.nextLaserSwordAtSeconds = 999;

    const stepped = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });

    expect(stepped.enemies[0].health).toBeLessThan(40 - 8);
    expect(stepped.wishcraftRuntime.nextFireAtSecondsByCraftId["test-projectile-lance"]).toBeLessThan(0.42);
    expect(stepped.player.position).toEqual({ x: 100, y: 100 });
    expect(stepped.player.vitals.health).toBe(40);
    expect(stepped.player.vitals.maxHealth).toBe(100);
  });

  it("lets primary stat-support Wishcrafts amplify existing direct weapons without becoming movement or healing mods", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "damage-tuning",
          mechanicPieceIds: ["damage-tuning"],
          parameters: { damageScale: 1.3, fireRateScale: 1.2 },
        }),
      ],
      enemies: [
        {
          id: "base-target",
          templateId: "slow-tough",
          position: { x: 220, y: 100 },
          health: 30,
          radius: 18,
          nextContactAtSeconds: 0,
        },
      ],
    });
    state.player.vitals.health = 40;
    state.nextLaserSwordAtSeconds = 999;

    const stepped = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });

    expect(stepped.enemies[0].health).toBeLessThan(22);
    expect(stepped.nextMachineGunAtSeconds).toBeLessThan(0.32);
    expect(stepped.player.position).toEqual({ x: 100, y: 100 });
    expect(stepped.player.vitals.health).toBe(40);
    expect(stepped.player.vitals.maxHealth).toBe(100);
  });


  it("ignores forbidden runtime fields instead of adding hidden RPG mechanics", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "projectile-lance",
          mechanicPieceIds: ["projectile-lance"],
          parameters: {
            damageScale: 1,
            projectileCount: 1,
            projectileSpeedScale: 1,
            enemyStatus: "freeze",
            dot: true,
            turret: true,
            movementSpeed: 2,
            maxHealth: 999,
            healsPlayer: true,
          },
        }),
      ],
      enemies: [
        {
          id: "target",
          templateId: "slow-tough",
          position: { x: 220, y: 100 },
          health: 20,
          radius: 18,
          nextContactAtSeconds: 0,
        },
      ],
    });
    state.player.vitals.health = 40;
    state.nextMachineGunAtSeconds = 999;
    state.nextLaserSwordAtSeconds = 999;

    const stepped = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });

    expect(stepped.enemies[0].health).toBe(20);
    expect(stepped.feedback.map((event) => event.kind)).not.toContain("wishcraft-hit");
    expect(stepped.player.vitals.health).toBe(40);
    expect(stepped.player.vitals.maxHealth).toBe(100);
  });

  it("applies forbidden runtime guards to shield, summon, and pickup paths too", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      wishcraftLoadout: [
        createWishcraft({
          primaryMechanicId: "shield-capacity",
          mechanicPieceIds: ["shield-capacity"],
          parameters: { shieldCapacity: 40, dash: true },
        }),
        createWishcraft({
          primaryMechanicId: "summon-orbiter",
          mechanicPieceIds: ["summon-orbiter"],
          parameters: { summonCount: 3, turret: true },
        }),
        createWishcraft({
          primaryMechanicId: "pickup-magnet",
          mechanicPieceIds: ["pickup-magnet"],
          parameters: { pickupRangeScale: 2.5, critChance: 0.5 },
        }),
      ],
      enemies: [],
    });
    state.xpShards.push({
      id: "xp-forbidden-magnet",
      attracted: false,
      position: { x: 250, y: 100 },
      value: 7,
    });

    const stepped = stepCombatLoop(state, { deltaSeconds: 0.1, nowSeconds: 0.1 });

    expect(stepped.wishcraftRuntime.shield).toMatchObject({ capacity: 0, value: 0 });
    expect(stepped.wishcraftRuntime.summons).toHaveLength(0);
    expect(stepped.xpShards[0]).toMatchObject({
      attracted: false,
      position: { x: 250, y: 100 },
      value: 7,
    });
    expect(stepped.feedback.map((event) => event.kind)).not.toContain("wishcraft-shield");
    expect(stepped.feedback.map((event) => event.kind)).not.toContain("wishcraft-summon");
  });
});

function createWishcraft(options: {
  mechanicPieceIds: string[];
  parameters: Record<string, unknown>;
  primaryMechanicId: string;
}): Wishcraft {
  return {
    id: `test-${options.primaryMechanicId}`,
    sourceWish: "test wish",
    name: { cn: "测试星愿", en: "Test Wish" },
    primaryThemeId: "starfire",
    primaryMechanicId: options.primaryMechanicId,
    mechanicPieceIds: options.mechanicPieceIds,
    visualPieceIds: ["aura-starfire-0"],
    parameters: options.parameters,
  };
}

function createEnemy(id: string, x: number, y: number): CombatLoopEnemy {
  return {
    id,
    templateId: "slow-tough",
    position: { x, y },
    health: 40,
    radius: 18,
    nextContactAtSeconds: 0,
  };
}

function damagedEnemyIds(enemies: readonly { health: number; id: string }[]): string[] {
  return enemies.filter((enemy) => enemy.health < 40).map((enemy) => enemy.id);
}

function hitKinds(state: ReturnType<typeof stepCombatLoop>): string[] {
  return state.feedback
    .filter((event) => event.kind === "wishcraft-hit")
    .map((event) => event.visualKind);
}
