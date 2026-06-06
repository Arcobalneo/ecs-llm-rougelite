import { describe, expect, it } from "vitest";
import { playerMechFrameArtProfile } from "../../src/client/visual/sprites/player-mech-frame-art.js";
import type { PlayerMechAnimationState } from "../../src/client/visual/combat-entity-animation.js";

describe("Player mech frame art", () => {
  it("keeps a dense baseline body profile even when idle", () => {
    const profile = playerMechFrameArtProfile(animation({ movementStrength: 0 }));

    expect(profile.armorPanels).toBeGreaterThanOrEqual(10);
    expect(profile.asymmetrySockets).toBeGreaterThanOrEqual(5);
    expect(profile.backpackJets).toBeGreaterThanOrEqual(4);
    expect(profile.silhouetteCuts).toBeGreaterThanOrEqual(8);
  });

  it("adds more silhouette cuts and backpack jets while moving", () => {
    const idle = playerMechFrameArtProfile(animation({ movementStrength: 0, leanX: 0 }));
    const moving = playerMechFrameArtProfile(animation({ movementStrength: 1, leanX: 3.8 }));

    expect(moving.armorPanels).toBeGreaterThan(idle.armorPanels);
    expect(moving.backpackJets).toBeGreaterThan(idle.backpackJets);
    expect(moving.silhouetteCuts).toBeGreaterThan(idle.silhouetteCuts);
  });

  it("derives leg pose and thrust intensity from animation state without changing mechanics", () => {
    const profile = playerMechFrameArtProfile(animation({
      leanX: -3,
      leanY: 2,
      thrusterDown: 32,
      thrusterLeft: 18,
      thrusterRight: 11,
    }));

    expect(profile.legPoseOffset).not.toBe(0);
    expect(profile.thrusterIntensity).toBe(32);
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
