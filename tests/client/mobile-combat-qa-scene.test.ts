import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  createMobileCombatQaScenario,
  mobileCombatQaCoverageSummary,
} from "../../src/client/visual/qa/mobile-combat-qa-scene.js";

describe("Mobile combat QA scene", () => {
  it("uses a real portrait viewport with dense combat pressure", () => {
    const scenario = createMobileCombatQaScenario();
    const summary = mobileCombatQaCoverageSummary(scenario);

    expect(scenario.height).toBeGreaterThan(scenario.width * 2);
    expect(summary.aspectRatio).toBeGreaterThan(2);
    expect(summary.enemyCount).toBeGreaterThanOrEqual(70);
    expect(summary.loadoutSize).toBeGreaterThanOrEqual(7);
    expect(summary.themeCount).toBeGreaterThanOrEqual(7);
  });

  it("keeps HUD and player-head level labels wired to the same QA level updater", async () => {
    const html = await readFile("artifacts/visual-polish/qa-mobile-combat-scene.html", "utf8");

    expect(html).toContain("data-player-level data-mobile-qa-level");
    expect(html.match(/data-mobile-qa-level/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
