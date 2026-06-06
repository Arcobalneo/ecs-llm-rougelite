import { describe, expect, it } from "vitest";
import {
  createCombatLoopState,
  stepCombatLoop,
} from "../../src/client/simulation/combat-loop.js";
import { xpThresholdForLevel } from "../../src/client/simulation/progression-combat.js";

describe("Combat loop tracer bullet", () => {
  it("keeps contact pressure on a cooldown instead of damaging every frame", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      enemies: [
        {
          id: "enemy-contact",
          templateId: "slow-tough",
          position: { x: 112, y: 100 },
          health: 100,
          radius: 18,
          nextContactAtSeconds: 0,
        },
      ],
    });

    const first = stepCombatLoop(state, { deltaSeconds: 0, nowSeconds: 1 });
    const duringCooldown = stepCombatLoop(first, { deltaSeconds: 0, nowSeconds: 1.2 });
    const afterCooldown = stepCombatLoop(duringCooldown, { deltaSeconds: 0, nowSeconds: 1.8 });

    expect(first.player.vitals.health).toBe(90);
    expect(duringCooldown.player.vitals.health).toBe(90);
    expect(afterCooldown.player.vitals.health).toBe(80);
    expect(afterCooldown.enemies[0].nextContactAtSeconds).toBeGreaterThan(1.8);
  });

  it("auto-fights enemies, drops XP Shards, collects XP, and updates score without damage numbers", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      enemies: [
        {
          id: "enemy-1",
          templateId: "swarm-fragile",
          position: { x: 240, y: 100 },
          health: 6,
          radius: 11,
          nextContactAtSeconds: 0,
        },
      ],
    });

    const afterAttack = stepCombatLoop(state, { deltaSeconds: 0.25, nowSeconds: 0.25 });

    expect(afterAttack.kills).toBe(1);
    expect(afterAttack.xpShards).toHaveLength(1);
    const feedbackKinds = afterAttack.feedback.map((event) => event.kind);
    expect(feedbackKinds).not.toContain("damage-number");
    expect(feedbackKinds).toContain("enemy-death");
    expect(feedbackKinds).toContain("xp-drop");
    expect(afterAttack.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "impact",
          targetRadius: 11,
          targetTemplateId: "swarm-fragile",
          visualKind: "machine-gun",
        }),
      ]),
    );
    expect(afterAttack.feedback).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "enemy-death",
          radius: 11,
          templateId: "swarm-fragile",
        }),
      ]),
    );

    const nearShardState = {
      ...afterAttack,
      xpShards: afterAttack.xpShards.map((shard) => ({
        ...shard,
        position: { x: afterAttack.player.position.x + 4, y: afterAttack.player.position.y },
      })),
    };
    const afterCollect = stepCombatLoop(nearShardState, {
      deltaSeconds: 0.05,
      nowSeconds: 0.3,
    });

    expect(afterCollect.xpShards).toHaveLength(0);
    expect(afterCollect.levelState.xp).toBeGreaterThan(0);
    expect(afterCollect.score).toBeGreaterThan(0);
  });

  it("emits one level-up feedback event for every crossed level threshold", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      enemies: [],
    });
    state.xpShards.push({
      id: "xp-large",
      position: { x: 104, y: 100 },
      value: xpThresholdForLevel(1) + xpThresholdForLevel(2),
      attracted: true,
    });

    const afterCollect = stepCombatLoop(state, { deltaSeconds: 0, nowSeconds: 1 });
    const levelUps = afterCollect.feedback.filter((event) => event.kind === "level-up");

    expect(afterCollect.levelState.level).toBe(3);
    expect(levelUps).toEqual([
      { kind: "level-up", level: 2 },
      { kind: "level-up", level: 3 },
    ]);
  });

  it("does not let same-frame XP collection undo lethal contact damage", () => {
    const state = createCombatLoopState({
      player: { x: 100, y: 100 },
      enemies: [
        {
          id: "lethal-contact",
          templateId: "slow-tough",
          position: { x: 110, y: 100 },
          health: 100,
          radius: 18,
          nextContactAtSeconds: 0,
        },
      ],
    });
    state.player.vitals.health = 5;
    state.xpShards.push({
      id: "xp-at-player",
      position: { x: 102, y: 100 },
      value: xpThresholdForLevel(1),
      attracted: true,
    });

    const afterStep = stepCombatLoop(state, { deltaSeconds: 0, nowSeconds: 1 });

    expect(afterStep.player.vitals.health).toBe(0);
    expect(afterStep.levelState.level).toBe(1);
    expect(afterStep.xpShards).toHaveLength(1);
    expect(afterStep.feedback.map((event) => event.kind)).toContain("player-hit");
    expect(afterStep.feedback.map((event) => event.kind)).not.toContain("xp-collect");
    expect(afterStep.feedback.map((event) => event.kind)).not.toContain("level-up");
  });
});
