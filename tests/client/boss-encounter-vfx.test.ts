import { describe, expect, it } from "vitest";
import {
  bossEncounterPressure,
  bossEncounterThreatMarkCount,
  bossVictoryShatterProfile,
  bossVictoryShatterProgress,
} from "../../src/client/visual/boss-encounter-vfx.js";

describe("Boss encounter VFX", () => {
  it("adds more threat marks for warning and double-Boss encounters", () => {
    expect(bossEncounterThreatMarkCount({ bossCount: 1, phase: "warning" })).toBeGreaterThan(
      bossEncounterThreatMarkCount({ bossCount: 1, phase: "active" }),
    );
    expect(bossEncounterThreatMarkCount({ bossCount: 2, phase: "active" })).toBeGreaterThan(
      bossEncounterThreatMarkCount({ bossCount: 1, phase: "active" }),
    );
    expect(bossEncounterThreatMarkCount({ bossCount: 2, phase: "none" })).toBe(0);
  });

  it("scales encounter pressure with warning, low health, and Boss count", () => {
    const freshActive = bossEncounterPressure({ bossCount: 1, healthProgress: 1, phase: "active" });
    const woundedActive = bossEncounterPressure({ bossCount: 1, healthProgress: 0.25, phase: "active" });
    const doubleWarning = bossEncounterPressure({ bossCount: 2, healthProgress: 1, phase: "warning" });

    expect(woundedActive).toBeGreaterThan(freshActive);
    expect(doubleWarning).toBeGreaterThan(woundedActive);
    expect(bossEncounterPressure({ bossCount: 1, healthProgress: 1, phase: "victory" })).toBe(0);
  });

  it("budgets victory shatter as a dense visual-only Boss death burst", () => {
    const single = bossVictoryShatterProfile({ bossCount: 1, runtimeSeconds: 0.15 });
    const double = bossVictoryShatterProfile({ bossCount: 2, runtimeSeconds: 0.15 });

    expect(double.plateFragments).toBeGreaterThan(single.plateFragments);
    expect(double.shockSpokes).toBeGreaterThan(single.shockSpokes);
    expect(single.coreBursts).toBe(1);
    expect(double.coreBursts).toBe(2);
  });

  it("lets victory shatter fade without extending gameplay state", () => {
    const early = bossVictoryShatterProfile({ bossCount: 1, runtimeSeconds: 0 });
    const late = bossVictoryShatterProfile({ bossCount: 1, runtimeSeconds: 1.25 });

    expect(bossVictoryShatterProgress(0)).toBe(0);
    expect(bossVictoryShatterProgress(0.625)).toBeCloseTo(0.5);
    expect(bossVictoryShatterProgress(2)).toBe(1);
    expect(late.plateFragments).toBeLessThan(early.plateFragments);
    expect(late.residueRings).toBeLessThan(early.residueRings);
  });
});
