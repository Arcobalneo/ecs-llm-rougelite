import { describe, expect, it } from "vitest";
import {
  bossActionPoseQaCoverageSummary,
  createBossActionPoseQaScenarios,
} from "../../src/client/visual/qa/boss-action-pose-qa-scene.js";

describe("Boss action-pose QA scene", () => {
  it("covers all Boss silhouettes across entrance, attack, and low-health panels", () => {
    const scenarios = createBossActionPoseQaScenarios();
    const summary = bossActionPoseQaCoverageSummary(scenarios);

    expect(summary.scenarioCount).toBe(9);
    expect(summary.silhouetteCount).toBe(3);
    expect(summary.entrancePanels).toBe(3);
    expect(summary.attackPanels).toBe(3);
    expect(summary.lowHealthPanels).toBe(3);
  });

  it("uses strong telegraph values for attack inspection panels", () => {
    const attackScenarios = createBossActionPoseQaScenarios().filter((scenario) => scenario.id.endsWith("-attack"));

    expect(attackScenarios).toHaveLength(3);
    expect(attackScenarios.every((scenario) => scenario.animation.telegraph >= 0.9)).toBe(true);
    expect(new Set(attackScenarios.map((scenario) => scenario.silhouette)).size).toBe(3);
  });

  it("uses inspection scales that preserve complete Boss silhouettes", () => {
    const scenarios = createBossActionPoseQaScenarios();

    expect(scenarios.every((scenario) => scenario.scale > 0.78 && scenario.scale < 0.9)).toBe(true);
    expect(scenarios.find((scenario) => scenario.silhouette === "flying")?.scale).toBeGreaterThan(
      scenarios.find((scenario) => scenario.silhouette === "humanoid")?.scale ?? 1,
    );
  });
});
