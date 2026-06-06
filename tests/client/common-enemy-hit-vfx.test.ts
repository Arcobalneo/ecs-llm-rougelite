import { describe, expect, it } from "vitest";
import type { CombatFeedback } from "../../src/client/simulation/combat-loop.js";
import {
  commonEnemyHitVfxProfile,
  shouldCreateCommonEnemyHitVfx,
  ttlForCommonEnemyHit,
} from "../../src/client/visual/common-enemy-hit-vfx.js";

describe("Common enemy hit VFX", () => {
  it("requires a common-enemy template hint so generic feedback stays generic", () => {
    expect(shouldCreateCommonEnemyHitVfx(hit("fast-fragile"))).toBe(true);
    expect(shouldCreateCommonEnemyHitVfx({
      kind: "impact",
      origin: { x: 0, y: 0 },
      position: { x: 20, y: 0 },
      visualKind: "machine-gun",
    })).toBe(false);
    expect(shouldCreateCommonEnemyHitVfx({
      kind: "wishcraft-hit",
      mechanicId: "projectile-lance",
      origin: { x: 0, y: 0 },
      position: { x: 20, y: 0 },
      visualKind: "lance",
      wishcraftId: "craft",
    })).toBe(false);
  });

  it("gives every common enemy family a distinct hit-frame profile", () => {
    const fast = commonEnemyHitVfxProfile(hit("fast-fragile"));
    const slow = commonEnemyHitVfxProfile(hit("slow-tough"));
    const swarm = commonEnemyHitVfxProfile(hit("swarm-fragile"));

    expect(fast?.family).toBe("harrier-wing-shear");
    expect(slow?.family).toBe("armor-plate-buckle");
    expect(swarm?.family).toBe("swarm-node-disrupt");
    expect(slow?.armorPlateCount).toBeGreaterThan(fast?.armorPlateCount ?? 0);
    expect(swarm?.nodeFlashCount).toBeGreaterThan(fast?.nodeFlashCount ?? 0);
    expect(fast?.wingShardCount).toBeGreaterThan(swarm?.wingShardCount ?? 0);
  });

  it("scales shard budget with hit radius while keeping family identity", () => {
    const small = commonEnemyHitVfxProfile(hit("slow-tough", 14));
    const large = commonEnemyHitVfxProfile(hit("slow-tough", 28));

    expect(large?.armorPlateCount).toBeGreaterThan(small?.armorPlateCount ?? 0);
    expect(large?.family).toBe(small?.family);
  });

  it("keeps slow-tough hit frames on screen longer than swarm hits", () => {
    expect(ttlForCommonEnemyHit("slow-tough")).toBeGreaterThan(ttlForCommonEnemyHit("swarm-fragile"));
  });
});

function hit(
  targetTemplateId: "fast-fragile" | "slow-tough" | "swarm-fragile",
  targetRadius = 16,
): CombatFeedback {
  return {
    kind: "impact",
    origin: { x: 0, y: 0 },
    position: { x: 120, y: 0 },
    targetRadius,
    targetTemplateId,
    visualKind: "machine-gun",
  };
}
