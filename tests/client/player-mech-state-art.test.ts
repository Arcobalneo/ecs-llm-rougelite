import { describe, expect, it } from "vitest";
import type { PlayerMechAnimationState } from "../../src/client/visual/combat-entity-animation.js";
import {
  playerMechStateArtProfile,
} from "../../src/client/visual/sprites/player-mech-state-art.js";

describe("Player mech state art", () => {
  it("uses authored idle frames instead of only transform bobbing", () => {
    const frames = Array.from({ length: 6 }, (_, idleFrame) =>
      playerMechStateArtProfile(animation({ idleFrame: idleFrame as PlayerMechAnimationState["idleFrame"] })),
    );

    expect(new Set(frames.map((frame) => frame.frameSignature)).size).toBeGreaterThanOrEqual(4);
    expect(Math.min(...frames.map((frame) => frame.microPanelCount))).toBeGreaterThanOrEqual(8);
    expect(Math.min(...frames.map((frame) => frame.reactorPulseCount))).toBeGreaterThanOrEqual(5);
  });

  it("adds hit-flicker armor energy without changing collision or movement data", () => {
    const idle = playerMechStateArtProfile(animation({ hitFlash: 0 }));
    const hit = playerMechStateArtProfile(animation({ hitFlash: 0.85 }));

    expect(hit.hitFlickerBands).toBeGreaterThan(idle.hitFlickerBands);
    expect(hit.shieldSparkCount).toBeGreaterThan(idle.shieldSparkCount);
  });

  it("adds Wishcraft install snap-on parts as a visual state", () => {
    const fresh = playerMechStateArtProfile(animation({ wishInstallProgress: 1 }));
    const installing = playerMechStateArtProfile(animation({ wishInstallProgress: 0.42 }));

    expect(installing.installRailCount).toBeGreaterThan(fresh.installRailCount);
    expect(installing.snapOnPlateCount).toBeGreaterThan(fresh.snapOnPlateCount);
    expect(installing.installProgress).toBeCloseTo(0.42);
  });
});

function animation(overrides: Partial<PlayerMechAnimationState>): PlayerMechAnimationState {
  return {
    bob: 0,
    hitFlash: 0,
    idleFrame: 0,
    leanX: 0,
    leanY: 0,
    movementStrength: 0,
    thrusterBack: 12,
    thrusterDown: 14,
    thrusterLeft: 8,
    thrusterRight: 8,
    wishInstallProgress: 1,
    ...overrides,
  };
}
