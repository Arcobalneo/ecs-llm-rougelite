import { describe, expect, it } from "vitest";
import { bossStateBodyPartProfile } from "../../src/client/visual/sprites/boss/boss-state-body-parts.js";
import type { BossSpriteAnimationState } from "../../src/client/visual/combat-entity-animation.js";

describe("Boss state body parts", () => {
  it("adds entrance body panels during warning fade-in", () => {
    const visible = bossStateBodyPartProfile({
      animation: animation({ entranceAlpha: 0.45 }),
      healthProgress: 1,
      silhouette: "flying",
    });
    const settled = bossStateBodyPartProfile({
      animation: animation({ entranceAlpha: 1 }),
      healthProgress: 1,
      silhouette: "flying",
    });

    expect(visible.entrancePanels).toBeGreaterThan(settled.entrancePanels);
  });

  it("adds anatomy-tied weapon parts during telegraph", () => {
    const profile = bossStateBodyPartProfile({
      animation: animation({ telegraph: 0.72 }),
      healthProgress: 1,
      silhouette: "humanoid",
    });

    expect(profile.telegraphWeapons).toBeGreaterThanOrEqual(4);
    expect(profile.exposedCores).toBe(0);
  });

  it("turns low health into exposed cores and shatter plates", () => {
    const healthy = bossStateBodyPartProfile({
      animation: animation({}),
      healthProgress: 0.9,
      silhouette: "crawling",
    });
    const wounded = bossStateBodyPartProfile({
      animation: animation({}),
      healthProgress: 0.18,
      silhouette: "crawling",
    });

    expect(wounded.exposedCores).toBeGreaterThan(healthy.exposedCores);
    expect(wounded.shatterPlates).toBeGreaterThan(0);
  });

  it("keeps flying and humanoid silhouettes visually denser than crawling state trim", () => {
    const base = {
      animation: animation({ telegraph: 0.8, entranceAlpha: 0.5 }),
      healthProgress: 0.2,
    };
    const flying = bossStateBodyPartProfile({ ...base, silhouette: "flying" });
    const crawling = bossStateBodyPartProfile({ ...base, silhouette: "crawling" });
    const humanoid = bossStateBodyPartProfile({ ...base, silhouette: "humanoid" });

    expect(flying.telegraphWeapons).toBeGreaterThanOrEqual(crawling.telegraphWeapons);
    expect(humanoid.entrancePanels).toBeGreaterThanOrEqual(crawling.entrancePanels);
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
