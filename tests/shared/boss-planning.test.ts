import { describe, expect, it } from "vitest";
import {
  createBossEncounterPlan,
  createBossPlanRecord,
} from "../../src/shared/boss/boss-planning.js";
import { CONTENT_VERSION } from "../../src/shared/content-version.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";

describe("Local Boss planning", () => {
  it("uses a single, single, double cadence by encounter count", () => {
    expect(
      createBossEncounterPlan({
        bossEncounterNumber: 1,
        loadout: [wishcraftCatalog.fixtures.starLance],
        plannedLevel: 5,
      }).bosses,
    ).toHaveLength(1);
    expect(
      createBossEncounterPlan({
        bossEncounterNumber: 2,
        loadout: [wishcraftCatalog.fixtures.starLance],
        plannedLevel: 10,
      }).bosses,
    ).toHaveLength(1);
    expect(
      createBossEncounterPlan({
        bossEncounterNumber: 3,
        loadout: [wishcraftCatalog.fixtures.starLance],
        plannedLevel: 15,
      }).bosses,
    ).toHaveLength(2);
  });

  it("selects local Rival Themes from the player's loadout for visual contrast only", () => {
    const plan = createBossEncounterPlan({
      bossEncounterNumber: 1,
      loadout: [wishcraftCatalog.fixtures.starLance],
      plannedLevel: 5,
    });

    expect(plan.bosses[0].rivalThemeId).toBe("frost");
    expect(JSON.stringify(plan.bosses[0])).not.toContain("mechanicalCounterThemeId");
    expect(plan.bosses[0].templateId).toBeTruthy();
  });

  it("respects template silhouette compatibility and prefers distinct silhouettes in double encounters", () => {
    const plan = createBossEncounterPlan({
      bossEncounterNumber: 3,
      loadout: [wishcraftCatalog.fixtures.starLance, wishcraftCatalog.fixtures.gravityOrbiter],
      plannedLevel: 15,
    });

    expect(plan.bosses).toHaveLength(2);
    expect(plan.bosses[0].compatibleSilhouettes).toContain(plan.bosses[0].silhouette);
    expect(plan.bosses[1].compatibleSilhouettes).toContain(plan.bosses[1].silhouette);
    expect(new Set(plan.bosses.map((boss) => boss.silhouette)).size).toBe(2);
  });

  it("records the full local Boss plan payload for server persistence", () => {
    const plan = createBossEncounterPlan({
      bossEncounterNumber: 1,
      loadout: [wishcraftCatalog.fixtures.gravityOrbiter],
      plannedLevel: 5,
    });

    const record = createBossPlanRecord({
      contentVersion: CONTENT_VERSION,
      encounterId: "boss-run-1-level-5",
      plan,
      runId: "run_test_123",
    });

    expect(record).toMatchObject({
      contentVersion: CONTENT_VERSION,
      encounterId: "boss-run-1-level-5",
      plannedLevel: 5,
      runId: "run_test_123",
    });
    expect(record.bosses[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        rivalThemeId: expect.any(String),
        silhouette: expect.any(String),
        templateId: expect.any(String),
        visualPieceIds: expect.any(Array),
      }),
    );
  });
});
