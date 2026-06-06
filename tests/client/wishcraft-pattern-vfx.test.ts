import { describe, expect, it } from "vitest";
import {
  shouldCreateWishcraftPattern,
  wishcraftPatternProfile,
  wishcraftPatternProgress,
} from "../../src/client/visual/wishcraft-pattern-vfx.js";
import type { CombatFeedback } from "../../src/client/simulation/combat-loop.js";

describe("Wishcraft pattern VFX", () => {
  it("creates evolved-weapon pattern layers for high-readability attack families", () => {
    for (const visualKind of ["area", "beam", "burst", "missile", "ricochet", "scatter", "summon", "trigger"]) {
      expect(shouldCreateWishcraftPattern(wishcraftHit(visualKind))).toBe(true);
    }

    expect(shouldCreateWishcraftPattern(wishcraftHit("lance"))).toBe(false);
    expect(shouldCreateWishcraftPattern({ kind: "impact", position: { x: 0, y: 0 } })).toBe(false);
  });

  it("creates spiral patterns from mechanic id even when visual kind is a lance-like projectile", () => {
    const profile = wishcraftPatternProfile(wishcraftHit("lance", "projectile-spiral"));

    expect(profile?.pattern).toBe("spiral-corkscrew");
    expect(profile?.spokeCount).toBeGreaterThanOrEqual(10);
  });

  it("budgets area, trigger, and scatter patterns as larger than simple ricochet markers", () => {
    const area = wishcraftPatternProfile(wishcraftHit("area"));
    const trigger = wishcraftPatternProfile(wishcraftHit("trigger"));
    const scatter = wishcraftPatternProfile(wishcraftHit("scatter"));
    const ricochet = wishcraftPatternProfile(wishcraftHit("ricochet"));

    expect(area?.radius).toBeGreaterThan(ricochet?.radius ?? 0);
    expect(trigger?.ttlSeconds).toBeGreaterThan(scatter?.ttlSeconds ?? 0);
    expect(scatter?.motifCount).toBeGreaterThan(ricochet?.motifCount ?? 99);
  });

  it("tracks pattern lifetime progress with clamping", () => {
    expect(wishcraftPatternProgress({ bornAtSeconds: 4, nowSeconds: 4, ttlSeconds: 0.8 })).toBe(0);
    expect(wishcraftPatternProgress({ bornAtSeconds: 4, nowSeconds: 4.4, ttlSeconds: 0.8 })).toBeCloseTo(0.5);
    expect(wishcraftPatternProgress({ bornAtSeconds: 4, nowSeconds: 5, ttlSeconds: 0.8 })).toBe(1);
  });
});

function wishcraftHit(visualKind: string, mechanicId = `${visualKind}-mechanic`): CombatFeedback {
  return {
    kind: "wishcraft-hit",
    mechanicId,
    origin: { x: 0, y: 0 },
    position: { x: 110, y: 24 },
    visualKind,
    wishcraftId: "test-craft",
  };
}
