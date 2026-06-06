import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  createMobileSpectacleQaScenario,
  mobileSpectacleQaCoverageSummary,
} from "../../src/client/visual/qa/mobile-spectacle-qa-scene.js";

describe("Mobile spectacle QA scene", () => {
  it("covers late-run portrait combat with the full spectacle stack", () => {
    const scenario = createMobileSpectacleQaScenario();
    const summary = mobileSpectacleQaCoverageSummary(scenario);

    expect(scenario.width).toBe(390);
    expect(scenario.height).toBe(844);
    expect(summary.aspectRatio).toBeGreaterThan(2);
    expect(summary.enemyCount).toBeGreaterThanOrEqual(105);
    expect(summary.bossCount).toBe(2);
    expect(summary.xpShardCount).toBeGreaterThanOrEqual(34);
    expect(summary.summonCount).toBeGreaterThanOrEqual(4);
    expect(summary.loadoutSize).toBeGreaterThanOrEqual(12);
    expect(summary.themeCount).toBeGreaterThanOrEqual(12);
    expect(summary.wishcraftHitCount).toBeGreaterThanOrEqual(12);
    expect(summary.visualKindCount).toBeGreaterThanOrEqual(10);
  });

  it("keeps portrait HUD, player labels, and bottom joystick wired for screenshot evidence", async () => {
    const html = await readFile("artifacts/visual-polish/qa-mobile-spectacle-scene.html", "utf8");

    expect(html).toContain("data-player-level data-mobile-spectacle-level");
    expect(html.match(/data-mobile-spectacle-level/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain("movement-joystick");
    expect(html).toContain("data-mobile-spectacle-boss-name");
  });
});
