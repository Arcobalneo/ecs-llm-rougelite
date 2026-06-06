import { describe, expect, it } from "vitest";
import {
  shouldCreateWishcraftSpectacle,
  wishcraftSpectacleProfile,
  wishcraftSpectacleProgress,
} from "../../src/client/visual/wishcraft-spectacle-vfx.js";
import type { CombatFeedback } from "../../src/client/simulation/combat-loop.js";

describe("Wishcraft spectacle VFX", () => {
  it("creates high-spectacle VFX for weak-reading non-projectile families", () => {
    for (const visualKind of ["melee", "pickup", "shield", "summon", "trigger"]) {
      expect(shouldCreateWishcraftSpectacle(wishcraftHit(visualKind))).toBe(true);
    }

    expect(shouldCreateWishcraftSpectacle(wishcraftHit("lance"))).toBe(false);
    expect(shouldCreateWishcraftSpectacle({ kind: "impact", position: { x: 0, y: 0 } })).toBe(false);
  });

  it("gives trigger and shield effects richer budgets than summon fire", () => {
    const trigger = wishcraftSpectacleProfile(wishcraftHit("trigger"));
    const shield = wishcraftSpectacleProfile(wishcraftHit("shield"));
    const summon = wishcraftSpectacleProfile(wishcraftHit("summon"));

    expect(trigger?.spokeCount).toBeGreaterThan(summon?.spokeCount ?? 0);
    expect(trigger?.ttlSeconds).toBeGreaterThan(summon?.ttlSeconds ?? 0);
    expect(shield?.ringCount).toBeGreaterThan(summon?.ringCount ?? 0);
  });

  it("also supports runtime shield, summon, and XP feedback events", () => {
    expect(wishcraftSpectacleProfile({ kind: "wishcraft-shield", capacity: 20, position: { x: 4, y: 8 }, wishcraftId: "shield" })?.family).toBe("shield-shell");
    expect(wishcraftSpectacleProfile({ kind: "wishcraft-summon", position: { x: 4, y: 8 }, summonId: "s0", wishcraftId: "summon" })?.family).toBe("summon-fire");
    expect(wishcraftSpectacleProfile({ kind: "xp-collect", position: { x: 4, y: 8 }, value: 8 })?.family).toBe("pickup-magnet");
  });

  it("tracks spectacle lifetime progress with clamping", () => {
    expect(wishcraftSpectacleProgress({ bornAtSeconds: 2, nowSeconds: 2, ttlSeconds: 0.5 })).toBe(0);
    expect(wishcraftSpectacleProgress({ bornAtSeconds: 2, nowSeconds: 2.25, ttlSeconds: 0.5 })).toBeCloseTo(0.5);
    expect(wishcraftSpectacleProgress({ bornAtSeconds: 2, nowSeconds: 3, ttlSeconds: 0.5 })).toBe(1);
  });
});

function wishcraftHit(visualKind: string): CombatFeedback {
  return {
    kind: "wishcraft-hit",
    mechanicId: `${visualKind}-mechanic`,
    origin: { x: 0, y: 0 },
    position: { x: 80, y: 24 },
    visualKind,
    wishcraftId: "test-craft",
  };
}
