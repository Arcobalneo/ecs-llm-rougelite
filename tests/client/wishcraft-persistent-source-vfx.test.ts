import { describe, expect, it } from "vitest";
import {
  persistentShieldRingCount,
  persistentSummonLinkCount,
  persistentXpMagnetLaneCount,
} from "../../src/client/visual/wishcraft-persistent-source-vfx.js";
import type { XpShard } from "../../src/client/simulation/progression-combat.js";
import type { WishcraftRuntimeState } from "../../src/client/simulation/wishcraft-mechanics.js";

describe("Persistent Wishcraft source VFX", () => {
  it("draws shield shell rings only while shield has visible value", () => {
    expect(persistentShieldRingCount({ capacity: 0, value: 0, nextRegenAtSeconds: 0, regenDelaySeconds: 0 })).toBe(0);
    expect(persistentShieldRingCount({ capacity: 20, value: 0, nextRegenAtSeconds: 0, regenDelaySeconds: 4 })).toBe(0);
    expect(persistentShieldRingCount({ capacity: 20, value: 5, nextRegenAtSeconds: 0, regenDelaySeconds: 4 })).toBeGreaterThan(0);
    expect(persistentShieldRingCount({ capacity: 20, value: 20, nextRegenAtSeconds: 0, regenDelaySeconds: 4 })).toBeGreaterThan(
      persistentShieldRingCount({ capacity: 20, value: 5, nextRegenAtSeconds: 0, regenDelaySeconds: 4 }),
    );
  });

  it("budgets XP magnet lanes from attracted shards and clamps dense scenes", () => {
    expect(persistentXpMagnetLaneCount(shards(5, false))).toBe(0);
    expect(persistentXpMagnetLaneCount(shards(6, true))).toBe(6);
    expect(persistentXpMagnetLaneCount(shards(40, true))).toBe(18);
  });

  it("scales summon links with active followers while keeping a visual budget", () => {
    expect(persistentSummonLinkCount(runtimeWithSummons(0))).toBe(0);
    expect(persistentSummonLinkCount(runtimeWithSummons(2))).toBe(4);
    expect(persistentSummonLinkCount(runtimeWithSummons(8))).toBe(8);
  });
});

function shards(count: number, attracted: boolean): XpShard[] {
  return Array.from({ length: count }, (_, index) => ({
    attracted,
    id: `xp-${index}`,
    position: { x: index * 20, y: index * 12 },
    value: 3,
  }));
}

function runtimeWithSummons(count: number): WishcraftRuntimeState {
  return {
    nextFireAtSecondsByCraftId: {},
    shield: { capacity: 0, value: 0, nextRegenAtSeconds: 0, regenDelaySeconds: 0 },
    summons: Array.from({ length: count }, (_, index) => ({
      craftId: "summon-craft",
      id: `summon-${index}`,
      orbitRadius: 72,
      position: { x: index * 30, y: index * 24 },
    })),
  };
}
