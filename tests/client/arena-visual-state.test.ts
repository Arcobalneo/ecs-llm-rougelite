import { describe, expect, it } from "vitest";
import {
  advanceArenaPhaseAfterBossCompletion,
  createArenaVisualState,
  enemyDriftFromLoadout,
  phaseTintFromLoadout,
} from "../../src/client/visual/arena-visual-state.js";
import { createCombatLoopState } from "../../src/client/simulation/combat-loop.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";

describe("Enemy Drift and Arena Phase visual state", () => {
  it("uses the latest Wishcraft as dominant Enemy Drift and a small recent window as secondary influence", () => {
    const drift = enemyDriftFromLoadout([
      wishcraftCatalog.fixtures.starLance,
      wishcraftCatalog.fixtures.gravityOrbiter,
      {
        ...wishcraftCatalog.fixtures.starLance,
        id: "wishcraft-drift-storm",
        primaryThemeId: "storm",
        visualPieceIds: ["impact-storm-0", "core-storm-2", "head-storm-3"],
      },
    ]);

    expect(drift.dominantThemeId).toBe("storm");
    expect(drift.secondaryThemeIds).toEqual(["gravity", "starfire"]);
    expect(drift.loadoutWindow).toBe(3);
  });

  it("keeps Enemy Drift visual-only and does not mutate combat templates or rules", () => {
    const combat = createCombatLoopState({
      player: { x: 100, y: 100 },
      enemies: [
        {
          id: "enemy-1",
          templateId: "fast-fragile",
          position: { x: 180, y: 100 },
          health: 8,
          radius: 10,
          nextContactAtSeconds: 0,
        },
      ],
      wishcraftLoadout: [wishcraftCatalog.fixtures.starLance],
    });
    const before = JSON.stringify(combat);

    const drift = enemyDriftFromLoadout(combat.wishcraftLoadout);

    expect(drift.dominantThemeId).toBe("starfire");
    expect(JSON.stringify(combat)).toBe(before);
    expect(combat.enemies[0]).toMatchObject({
      templateId: "fast-fragile",
      health: 8,
      radius: 10,
    });
  });

  it("advances Arena Phase only after double Boss completion events", () => {
    let visualState = createArenaVisualState();

    visualState = advanceArenaPhaseAfterBossCompletion(visualState, { doubleBoss: false });
    expect(visualState.phaseIndex).toBe(0);

    visualState = advanceArenaPhaseAfterBossCompletion(visualState, { doubleBoss: true });
    expect(visualState.phaseIndex).toBe(1);
    expect(visualState.phase.id).toBe("nebula-rift");
  });

  it("applies light Wishcraft tinting without changing Arena or combat rule values", () => {
    const combat = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
      wishcraftLoadout: [wishcraftCatalog.fixtures.gravityOrbiter],
    });
    const before = JSON.stringify(combat);
    const visualState = createArenaVisualState();

    const tint = phaseTintFromLoadout({
      loadout: combat.wishcraftLoadout,
      phase: visualState.phase,
    });

    expect(tint.themeId).toBe("gravity");
    expect(tint.alpha).toBeLessThanOrEqual(0.18);
    expect(JSON.stringify(combat)).toBe(before);
  });
});
