import { describe, expect, it } from "vitest";
import {
  bossStateAnatomyAnchorCount,
  bossStateEntranceIntensity,
  bossStateShatterReadiness,
  bossStateTelegraphIntensity,
} from "../../src/client/visual/boss-state-overlay.js";
import type { BossSpriteAnimationState } from "../../src/client/visual/combat-entity-animation.js";

describe("Boss state overlay", () => {
  it("derives entrance intensity from warning-phase fade-in", () => {
    expect(bossStateEntranceIntensity(animation({ entranceAlpha: 1 }))).toBe(0);
    expect(bossStateEntranceIntensity(animation({ entranceAlpha: 0.35 }))).toBeCloseTo(0.65);
  });

  it("uses telegraph value directly for anatomy-tied attack charge", () => {
    expect(bossStateTelegraphIntensity(animation({ telegraph: 0 }))).toBe(0);
    expect(bossStateTelegraphIntensity(animation({ telegraph: 0.72 }))).toBeCloseTo(0.72);
  });

  it("only prepares death shatter after severe health loss", () => {
    expect(bossStateShatterReadiness(0.7)).toBe(0);
    expect(bossStateShatterReadiness(0.25)).toBeGreaterThan(0);
    expect(bossStateShatterReadiness(0)).toBe(1);
  });

  it("keeps silhouette-specific anatomy anchor density", () => {
    expect(bossStateAnatomyAnchorCount("flying")).toBeGreaterThan(bossStateAnatomyAnchorCount("crawling"));
    expect(bossStateAnatomyAnchorCount("humanoid")).toBeGreaterThanOrEqual(9);
  });
});

function animation(overrides: Partial<BossSpriteAnimationState>): BossSpriteAnimationState {
  return {
    auraPulse: 1,
    entranceAlpha: 1,
    frame: 0,
    hitFlashAlpha: 0,
    jawOpen: 0,
    telegraph: 0,
    wingSpread: 1,
    ...overrides,
  };
}
