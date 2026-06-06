import { describe, expect, it } from "vitest";
import {
  bossActionPoseProfile,
  bossActionPoseSignature,
} from "../../src/client/visual/sprites/boss/boss-action-pose.js";
import type { BossSpriteAnimationState } from "../../src/client/visual/combat-entity-animation.js";

describe("Boss action pose", () => {
  it("adds entrance materialization parts during warning fade-in", () => {
    const warning = bossActionPoseProfile({
      animation: animation({ entranceAlpha: 0.42, telegraph: 0.6 }),
      healthProgress: 1,
      silhouette: "flying",
    });
    const settled = bossActionPoseProfile({
      animation: animation({ entranceAlpha: 1, telegraph: 0 }),
      healthProgress: 1,
      silhouette: "flying",
    });

    expect(warning.entranceFrames).toBeGreaterThan(settled.entranceFrames);
    expect(warning.posePanels).toBeGreaterThan(settled.posePanels);
  });

  it("gives active attacks silhouette-specific weapon pose budgets", () => {
    const base = {
      animation: animation({ entranceAlpha: 1, telegraph: 0.82 }),
      healthProgress: 0.72,
    };
    const flying = bossActionPoseProfile({ ...base, silhouette: "flying" });
    const crawling = bossActionPoseProfile({ ...base, silhouette: "crawling" });
    const humanoid = bossActionPoseProfile({ ...base, silhouette: "humanoid" });

    expect(flying.wingPoseBlades).toBeGreaterThan(0);
    expect(crawling.clawPoseStrikes).toBeGreaterThan(0);
    expect(humanoid.armCannonPoses).toBeGreaterThan(0);
  });

  it("keeps peak attack poses above the minimum boss-spectacle budget", () => {
    const base = {
      animation: animation({ entranceAlpha: 1, telegraph: 0.92 }),
      healthProgress: 0.7,
    };

    expect(bossActionPoseProfile({ ...base, silhouette: "flying" }).wingPoseBlades).toBeGreaterThanOrEqual(9);
    expect(bossActionPoseProfile({ ...base, silhouette: "crawling" }).clawPoseStrikes).toBeGreaterThanOrEqual(8);
    expect(bossActionPoseProfile({ ...base, silhouette: "humanoid" }).armCannonPoses).toBeGreaterThanOrEqual(6);
  });

  it("adds stagger and exposed pose parts at low health", () => {
    const healthy = bossActionPoseProfile({
      animation: animation({ telegraph: 0.2 }),
      healthProgress: 0.9,
      silhouette: "crawling",
    });
    const wounded = bossActionPoseProfile({
      animation: animation({ telegraph: 0.2 }),
      healthProgress: 0.18,
      silhouette: "crawling",
    });

    expect(wounded.staggerPlates).toBeGreaterThan(healthy.staggerPlates);
    expect(wounded.exposedPoseCores).toBeGreaterThan(0);
  });

  it("changes pose signatures across warning, active, and low-health states", () => {
    const warning = bossActionPoseSignature({
      animation: animation({ entranceAlpha: 0.45, telegraph: 0.7 }),
      healthProgress: 1,
      silhouette: "humanoid",
    });
    const active = bossActionPoseSignature({
      animation: animation({ entranceAlpha: 1, telegraph: 0.74 }),
      healthProgress: 0.72,
      silhouette: "humanoid",
    });
    const low = bossActionPoseSignature({
      animation: animation({ entranceAlpha: 1, telegraph: 0.3 }),
      healthProgress: 0.16,
      silhouette: "humanoid",
    });

    expect(warning).not.toBe(active);
    expect(active).not.toBe(low);
    expect(warning).toContain("entrance");
    expect(active).toContain("attack");
    expect(low).toContain("stagger");
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
