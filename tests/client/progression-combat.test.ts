import { describe, expect, it } from "vitest";
import {
  applyContactDamage,
  collectXp,
  computeScore,
  createLevelState,
  createPlayerVitals,
  mergeXpShards,
  moveXpShards,
  xpThresholdForLevel,
} from "../../src/client/simulation/progression-combat.js";

describe("Contact pressure, XP, Level Progression, and Score", () => {
  it("applies contact damage with invulnerability cooldown instead of per-frame damage", () => {
    const first = applyContactDamage({
      player: createPlayerVitals({ level: 1 }),
      nowSeconds: 10,
      contacts: [{ damage: 8 }],
    });
    expect(first.player.health).toBe(92);
    expect(first.damageTaken).toBe(8);

    const duringCooldown = applyContactDamage({
      player: first.player,
      nowSeconds: 10.4,
      contacts: [{ damage: 8 }],
    });
    expect(duringCooldown.player.health).toBe(92);
    expect(duringCooldown.damageTaken).toBe(0);
  });

  it("grows max health by level and restores a small amount on level-up", () => {
    const levelState = createLevelState();
    const player = { ...createPlayerVitals({ level: 1 }), health: 60 };
    const result = collectXp({
      levelState,
      player,
      xpValue: xpThresholdForLevel(1),
    });

    expect(result.levelUps).toBe(1);
    expect(result.levelState.level).toBe(2);
    expect(result.player.maxHealth).toBe(106);
    expect(result.player.health).toBe(72);
  });

  it("merges XP Shards without losing total value", () => {
    const merged = mergeXpShards([
      { id: "a", position: { x: 100, y: 100 }, value: 3, attracted: false },
      { id: "b", position: { x: 106, y: 102 }, value: 5, attracted: false },
      { id: "c", position: { x: 240, y: 240 }, value: 7, attracted: false },
    ]);

    expect(merged).toHaveLength(2);
    expect(merged.reduce((sum, shard) => sum + shard.value, 0)).toBe(15);
    expect(merged.find((shard) => shard.id === "a+b")?.value).toBe(8);
  });

  it("attracts XP Shards in pickup range toward the player while ignoring blockers", () => {
    const moved = moveXpShards({
      shards: [{ id: "xp", position: { x: 140, y: 100 }, value: 5, attracted: false }],
      player: { x: 100, y: 100 },
      deltaSeconds: 0.1,
      pickupRange: 80,
    });

    expect(moved[0].attracted).toBe(true);
    expect(moved[0].position.x).toBeLessThan(140);
    expect(moved[0].position.y).toBe(100);
  });

  it("computes score from active combat time, kills, level, and boss kill placeholders", () => {
    expect(
      computeScore({
        activeCombatSeconds: 123.4,
        kills: 37,
        level: 6,
        bossKills: 1,
      }),
    ).toBe(123 + 370 + 250 + 1000);
  });

  it("paces milestone Boss levels into an accelerating survivor run cadence", () => {
    expect(secondsToReachLevel(5)).toBeGreaterThanOrEqual(120);
    expect(secondsToReachLevel(5)).toBeLessThanOrEqual(180);
    expect(secondsToReachLevel(10)).toBeGreaterThanOrEqual(300);
    expect(secondsToReachLevel(10)).toBeLessThanOrEqual(420);
    expect(secondsToReachLevel(15)).toBeGreaterThanOrEqual(540);
    expect(secondsToReachLevel(15)).toBeLessThanOrEqual(720);
    expect(secondsToReachLevel(15) - secondsToReachLevel(10)).toBeLessThan(secondsToReachLevel(10) - secondsToReachLevel(5));
  });
});

function secondsToReachLevel(targetLevel: number): number {
  let totalXp = 0;
  for (let level = 1; level < targetLevel; level += 1) {
    totalXp += xpThresholdForLevel(level);
  }
  return totalXp / averageXpPerSecondForMilestone(targetLevel);
}

function averageXpPerSecondForMilestone(targetLevel: number): number {
  if (targetLevel <= 5) {
    return 2.6;
  }
  if (targetLevel <= 10) {
    return 3.5;
  }
  return 4.9;
}
