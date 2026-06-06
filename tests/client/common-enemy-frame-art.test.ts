import { describe, expect, it } from "vitest";
import {
  commonEnemyFrameArtPartBudget,
  commonEnemyFrameSignature,
} from "../../src/client/visual/sprites/common-enemy-frame-art.js";
import {
  commonEnemyHitFramePartBudget,
  commonEnemyHitFrameSignature,
} from "../../src/client/visual/sprites/common-enemy-hit-frame-art.js";
import {
  commonEnemyDriftSocketSummary,
} from "../../src/client/visual/sprites/common-enemy-drift-sockets.js";
import type { CommonEnemyTemplate } from "../../src/client/simulation/combat.js";
import type { EnemyDriftVisualState } from "../../src/client/visual/arena-visual-state.js";

const templates: CommonEnemyTemplate["id"][] = ["fast-fragile", "slow-tough", "swarm-fragile"];

describe("Common enemy authored frame art", () => {
  it("defines four distinct living frame signatures for each common enemy family", () => {
    for (const templateId of templates) {
      const signatures = new Set(
        [0, 1, 2, 3].map((frame) =>
          JSON.stringify(commonEnemyFrameSignature({ frame: frame as 0 | 1 | 2 | 3, templateId })),
        ),
      );

      expect(signatures.size).toBe(4);
    }
  });

  it("keeps the slow tough family visually heavier than fragile enemies", () => {
    expect(commonEnemyFrameArtPartBudget("slow-tough")).toBeGreaterThan(
      commonEnemyFrameArtPartBudget("fast-fragile"),
    );
    expect(commonEnemyFrameArtPartBudget("slow-tough")).toBeGreaterThan(
      commonEnemyFrameArtPartBudget("swarm-fragile"),
    );
  });

  it("gives every family silhouette-changing frame cuts, not only color detail", () => {
    for (const templateId of templates) {
      const cuts = [0, 1, 2, 3].map((frame) =>
        commonEnemyFrameSignature({ frame: frame as 0 | 1 | 2 | 3, templateId }).silhouetteCuts,
      );

      expect(Math.max(...cuts)).toBeGreaterThan(Math.min(...cuts));
    }
  });

  it("adds body-mounted drift sockets only after the player has recent Wishcraft themes", () => {
    const emptyDrift: EnemyDriftVisualState = {
      loadoutWindow: 3,
      secondaryThemeIds: [],
      tintColor: 0x75ff9a,
      accentColor: 0xe8fbff,
    };
    const activeDrift: EnemyDriftVisualState = {
      dominantThemeId: "starfire",
      loadoutWindow: 3,
      secondaryThemeIds: ["gravity", "neon"],
      tintColor: 0xffcc4d,
      accentColor: 0x9cf2ff,
    };

    expect(commonEnemyDriftSocketSummary({ drift: emptyDrift, templateId: "fast-fragile" }).bodySockets).toBe(0);
    expect(commonEnemyDriftSocketSummary({ drift: activeDrift, templateId: "fast-fragile" }).bodySockets).toBeGreaterThan(0);
    expect(commonEnemyDriftSocketSummary({ drift: activeDrift, templateId: "swarm-fragile" }).bodySockets).toBeGreaterThan(
      commonEnemyDriftSocketSummary({ drift: activeDrift, templateId: "fast-fragile" }).bodySockets,
    );
  });

  it("adds family-specific living hit-frame redraw budgets", () => {
    const fast = commonEnemyHitFrameSignature({ hitFlashAlpha: 0.82, templateId: "fast-fragile" });
    const slow = commonEnemyHitFrameSignature({ hitFlashAlpha: 0.82, templateId: "slow-tough" });
    const swarm = commonEnemyHitFrameSignature({ hitFlashAlpha: 0.82, templateId: "swarm-fragile" });

    expect(fast.shearedLimbs).toBeGreaterThan(fast.displacedPanels);
    expect(slow.displacedPanels).toBeGreaterThan(fast.displacedPanels);
    expect(swarm.shearedLimbs).toBeGreaterThan(slow.shearedLimbs);
    expect(commonEnemyHitFramePartBudget("slow-tough")).toBeGreaterThan(commonEnemyHitFramePartBudget("fast-fragile"));
  });

  it("does not draw hit-frame parts when there is no active hit flash", () => {
    for (const templateId of templates) {
      const signature = commonEnemyHitFrameSignature({ hitFlashAlpha: 0, templateId });

      expect(signature.hitIntensity).toBe(0);
      expect(signature.displacedPanels + signature.fractureLines + signature.shearedLimbs).toBe(0);
    }
  });
});
