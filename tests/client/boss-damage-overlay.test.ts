import { describe, expect, it } from "vitest";
import {
  bossDamageCrackCount,
  bossDamageSeverity,
} from "../../src/client/visual/boss-damage-overlay.js";

describe("Boss damage overlay", () => {
  it("keeps fresh Bosses visually intact and reveals damage after meaningful health loss", () => {
    expect(bossDamageSeverity(1)).toBe(0);
    expect(bossDamageSeverity(0.9)).toBe(0);
    expect(bossDamageSeverity(0.55)).toBeGreaterThan(0);
  });

  it("increases exposed crack density as Boss health drops", () => {
    expect(bossDamageCrackCount(0.25)).toBeGreaterThan(bossDamageCrackCount(0.65));
    expect(bossDamageCrackCount(0.95)).toBe(0);
  });
});
