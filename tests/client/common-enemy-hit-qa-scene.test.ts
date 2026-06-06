import { describe, expect, it } from "vitest";
import {
  commonEnemyHitQaCoverageSummary,
  createCommonEnemyHitQaScenarios,
} from "../../src/client/visual/qa/common-enemy-hit-qa-scene.js";

describe("Common enemy hit QA scene", () => {
  it("covers each common enemy family and multiple hit sources", () => {
    const scenarios = createCommonEnemyHitQaScenarios();
    const summary = commonEnemyHitQaCoverageSummary(scenarios);

    expect(summary.scenarioCount).toBe(6);
    expect(summary.templateCount).toBe(3);
    expect(summary.familyCount).toBe(3);
    expect(summary.visualKindCount).toBe(3);
    expect(summary.maxLoadoutSize).toBeGreaterThanOrEqual(5);
    expect(scenarios.map((scenario) => scenario.id)).toEqual([
      "fast-mg",
      "slow-mg",
      "swarm-mg",
      "fast-wish",
      "slow-sword",
      "swarm-wish",
    ]);
  });
});
