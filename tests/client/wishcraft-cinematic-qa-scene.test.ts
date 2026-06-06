import { describe, expect, it } from "vitest";
import {
  createWishcraftCinematicQaScenarios,
  wishcraftCinematicQaCoverageSummary,
} from "../../src/client/visual/qa/wishcraft-cinematic-qa-scene.js";

describe("Wishcraft cinematic QA scene", () => {
  it("covers the major high-spectacle skill families and multiple themes", () => {
    const scenarios = createWishcraftCinematicQaScenarios();
    const summary = wishcraftCinematicQaCoverageSummary(scenarios);

    expect(summary.scenarioCount).toBe(12);
    expect(summary.visualKindCount).toBe(12);
    expect(summary.themeCount).toBeGreaterThanOrEqual(12);
    expect(scenarios.map((scenario) => scenario.visualKind)).toEqual([
      "beam",
      "lance",
      "scatter",
      "spiral",
      "ricochet",
      "missile",
      "area",
      "melee",
      "summon",
      "shield",
      "pickup",
      "trigger",
    ]);
  });
});
