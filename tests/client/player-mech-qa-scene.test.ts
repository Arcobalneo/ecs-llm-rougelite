import { describe, expect, it } from "vitest";
import {
  createPlayerMechQaScenarios,
  playerMechQaCoverageSummary,
} from "../../src/client/visual/qa/player-mech-qa-scene.js";
import { assembleRuntimeVisuals, createVisualBudget } from "../../src/client/visual/visual-assembly.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";

describe("Player mech visual QA scene", () => {
  it("covers fresh, moving, dense loadout, and mobile portrait player states", () => {
    const scenarios = createPlayerMechQaScenarios();
    const summary = playerMechQaCoverageSummary(scenarios);

    expect(summary.scenarioCount).toBeGreaterThanOrEqual(6);
    expect(summary.desktopPanels).toBeGreaterThanOrEqual(5);
    expect(summary.mobilePanels).toBeGreaterThanOrEqual(1);
    expect(summary.maxLoadoutSize).toBeGreaterThanOrEqual(5);
    expect(scenarios.some((scenario) => scenario.loadout.length === 0)).toBe(true);
    expect(scenarios.some((scenario) => scenario.movement.strength > 0.85)).toBe(true);
  });

  it("covers player hit flicker and Wishcraft install snap-on states", () => {
    const scenarios = createPlayerMechQaScenarios();

    expect(scenarios.some((scenario) => scenario.hitFlash > 0.8)).toBe(true);
    expect(scenarios.some((scenario) => scenario.wishInstallProgress > 0.25 && scenario.wishInstallProgress < 0.75)).toBe(true);
    expect(new Set(scenarios.map((scenario) => scenario.id))).toEqual(new Set([
      "idle-fresh",
      "movement-thrust",
      "dense-loadout",
      "hit-flicker",
      "wish-install",
      "mobile-portrait",
    ]));
  });

  it("uses legal catalog visual pieces and produces enough player attachments for dense inspection", () => {
    const dense = createPlayerMechQaScenarios().find((scenario) => scenario.id === "dense-loadout");
    expect(dense).toBeDefined();

    const visuals = assembleRuntimeVisuals({
      budget: createVisualBudget("player"),
      catalog: wishcraftCatalog,
      entityRole: "player",
      loadout: dense?.loadout ?? [],
    });

    expect(visuals.warnings).toEqual([]);
    expect(visuals.attachments.length).toBeGreaterThanOrEqual(15);
    expect(new Set(visuals.attachments.map((attachment) => attachment.slot)).size).toBeGreaterThanOrEqual(9);
  });

  it("keeps mobile portrait QA as a tall crop instead of another desktop panel", () => {
    const mobile = createPlayerMechQaScenarios().find((scenario) => scenario.focus === "mobile");

    expect(mobile).toBeDefined();
    expect(mobile?.height).toBeGreaterThan(mobile?.width ?? 0);
    expect(mobile?.loadout.length).toBeGreaterThanOrEqual(3);
  });
});
