import { describe, expect, it } from "vitest";
import {
  mechanicAccentLaneCount,
  mechanicAccentPattern,
  type WishcraftMechanicAccentPattern,
} from "../../src/client/visual/wishcraft/mechanic-accent-vfx.js";

describe("Wishcraft mechanic accent VFX", () => {
  it("maps legal mechanic families to distinct visual accent patterns", () => {
    const cases: Array<{
      expected: WishcraftMechanicAccentPattern;
      mechanicId: string;
      visualKind: string;
    }> = [
      { expected: "lance-spear", mechanicId: "projectile-lance", visualKind: "lance" },
      { expected: "scatter-fan", mechanicId: "projectile-scatter", visualKind: "scatter" },
      { expected: "beam-cap", mechanicId: "projectile-pierce", visualKind: "beam" },
      { expected: "spiral-corkscrew", mechanicId: "projectile-spiral", visualKind: "lance" },
      { expected: "ricochet-node", mechanicId: "projectile-ricochet", visualKind: "ricochet" },
      { expected: "missile-salvo", mechanicId: "projectile-missile", visualKind: "missile" },
      { expected: "melee-blade", mechanicId: "melee-saw", visualKind: "melee" },
      { expected: "area-nova", mechanicId: "area-burst-nova", visualKind: "area" },
      { expected: "burst-array", mechanicId: "burst-radial", visualKind: "burst" },
      { expected: "summon-link", mechanicId: "summon-wingman", visualKind: "summon" },
      { expected: "shield-guard", mechanicId: "shield-capacity", visualKind: "shield" },
      { expected: "pickup-magnet", mechanicId: "pickup-magnet", visualKind: "pickup" },
      { expected: "trigger-sigil", mechanicId: "trigger-on-kill", visualKind: "trigger" },
      { expected: "stat-tuning", mechanicId: "attack-rate-pulse", visualKind: "lance" },
    ];

    for (const testCase of cases) {
      expect(
        mechanicAccentPattern({
          mechanicId: testCase.mechanicId,
          visualKind: testCase.visualKind,
        }),
      ).toBe(testCase.expected);
    }
  });

  it("budgets loud mechanic families more richly than simple lance accents", () => {
    expect(mechanicAccentLaneCount("spiral-corkscrew")).toBeGreaterThan(
      mechanicAccentLaneCount("lance-spear"),
    );
    expect(mechanicAccentLaneCount("area-nova")).toBeGreaterThan(
      mechanicAccentLaneCount("ricochet-node"),
    );
    expect(mechanicAccentLaneCount("shield-guard")).toBeGreaterThanOrEqual(
      mechanicAccentLaneCount("summon-link"),
    );
  });
});
