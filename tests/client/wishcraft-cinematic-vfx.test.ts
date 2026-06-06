import { describe, expect, it } from "vitest";
import type { CombatFeedback } from "../../src/client/simulation/combat-loop.js";
import {
  shouldCreateWishcraftCinematic,
  wishcraftCinematicOrigin,
  wishcraftCinematicProfile,
  wishcraftCinematicProgress,
} from "../../src/client/visual/wishcraft/cinematic/types.js";

describe("Wishcraft cinematic VFX", () => {
  it("creates high-intensity animation profiles for core Wishcraft hit families", () => {
    for (const visualKind of ["area", "beam", "burst", "lance", "melee", "missile", "scatter", "summon", "trigger"]) {
      expect(shouldCreateWishcraftCinematic(wishcraftHit(visualKind))).toBe(true);
    }

    expect(shouldCreateWishcraftCinematic({ kind: "impact", position: { x: 0, y: 0 } })).toBe(false);
    expect(shouldCreateWishcraftCinematic({ kind: "xp-collect", position: { x: 0, y: 0 }, value: 8 })).toBe(false);
  });

  it("budgets trigger and area as larger cinematic events than lance shots", () => {
    const trigger = wishcraftCinematicProfile(wishcraftHit("trigger"));
    const area = wishcraftCinematicProfile(wishcraftHit("area"));
    const lance = wishcraftCinematicProfile(wishcraftHit("lance"));

    expect(trigger?.particleCount).toBeGreaterThan(lance?.particleCount ?? 0);
    expect(area?.ringCount).toBeGreaterThan(lance?.ringCount ?? 0);
    expect(trigger?.ttlSeconds).toBeGreaterThan(lance?.ttlSeconds ?? 0);
  });

  it("promotes spiral mechanics into scatter-barrage cinematic grammar", () => {
    const profile = wishcraftCinematicProfile(wishcraftHit("lance", "projectile-spiral"));

    expect(profile?.family).toBe("scatter-barrage");
    expect(profile?.afterimageCount).toBeGreaterThanOrEqual(14);
  });

  it("positions line-based cinematics at path midpoint and radial events at hit point", () => {
    expect(wishcraftCinematicOrigin(wishcraftHit("beam"))).toEqual({ x: 60, y: 20 });
    expect(wishcraftCinematicOrigin(wishcraftHit("area"))).toEqual({ x: 120, y: 40 });
  });

  it("tracks cinematic lifetime progress with clamping", () => {
    expect(wishcraftCinematicProgress({ bornAtSeconds: 3, nowSeconds: 3, ttlSeconds: 0.8 })).toBe(0);
    expect(wishcraftCinematicProgress({ bornAtSeconds: 3, nowSeconds: 3.4, ttlSeconds: 0.8 })).toBeCloseTo(0.5);
    expect(wishcraftCinematicProgress({ bornAtSeconds: 3, nowSeconds: 4, ttlSeconds: 0.8 })).toBe(1);
  });
});

function wishcraftHit(visualKind: string, mechanicId = `${visualKind}-mechanic`): CombatFeedback {
  return {
    kind: "wishcraft-hit",
    mechanicId,
    origin: { x: 0, y: 0 },
    position: { x: 120, y: 40 },
    visualKind,
    wishcraftId: "test-craft",
  };
}
