import { describe, expect, it } from "vitest";
import {
  COMBAT_STAGE_LAYER_ORDER,
} from "../../src/client/rendering/pixi-stage.js";
import {
  playerReadabilityVfxProfile,
} from "../../src/client/visual/player-readability-vfx.js";

describe("Player readability VFX", () => {
  it("places the focus field above dense combat effects but below the player sprite", () => {
    expect(COMBAT_STAGE_LAYER_ORDER.indexOf("playerReadabilityField")).toBeGreaterThan(
      COMBAT_STAGE_LAYER_ORDER.indexOf("playerAttachmentLayer"),
    );
    expect(COMBAT_STAGE_LAYER_ORDER.indexOf("playerReadabilityField")).toBeLessThan(
      COMBAT_STAGE_LAYER_ORDER.indexOf("player"),
    );
  });

  it("scales focus density with late-run pressure without becoming a gameplay rule", () => {
    const early = playerReadabilityVfxProfile({
      activeBossCount: 0,
      enemyCount: 18,
      feedbackCount: 2,
      level: 3,
      loadoutSize: 1,
    });
    const late = playerReadabilityVfxProfile({
      activeBossCount: 2,
      enemyCount: 144,
      feedbackCount: 44,
      level: 42,
      loadoutSize: 12,
    });

    expect(late.focusRings).toBeGreaterThan(early.focusRings);
    expect(late.contrastPlates).toBeGreaterThan(early.contrastPlates);
    expect(late.reticleTicks).toBeGreaterThan(early.reticleTicks);
    expect(late.shieldGlints).toBeGreaterThan(early.shieldGlints);
    expect(late.intensity).toBeGreaterThan(early.intensity);
    expect(late.intensity).toBeLessThanOrEqual(1);
  });

  it("keeps a minimum player outline anchor even in low-density combat", () => {
    const profile = playerReadabilityVfxProfile({
      activeBossCount: 0,
      enemyCount: 0,
      feedbackCount: 0,
      level: 1,
      loadoutSize: 0,
    });

    expect(profile.focusRings).toBeGreaterThanOrEqual(1);
    expect(profile.reticleTicks).toBeGreaterThanOrEqual(4);
  });
});
