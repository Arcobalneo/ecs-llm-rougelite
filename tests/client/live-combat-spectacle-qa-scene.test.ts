import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  createLiveCombatSpectacleQaScenario,
  liveCombatSpectacleQaCoverageSummary,
} from "../../src/client/visual/qa/live-combat-spectacle-qa-scene.js";

describe("Live combat spectacle QA scene", () => {
  it("covers a late-run desktop combat frame with Bosses, horde, XP, summons, and Wishcraft effects", () => {
    const scenario = createLiveCombatSpectacleQaScenario();
    const summary = liveCombatSpectacleQaCoverageSummary(scenario);

    expect(scenario.width).toBeGreaterThanOrEqual(1280);
    expect(scenario.height).toBeGreaterThanOrEqual(720);
    expect(summary.enemyCount).toBeGreaterThanOrEqual(130);
    expect(summary.bossCount).toBe(2);
    expect(summary.xpShardCount).toBeGreaterThanOrEqual(36);
    expect(summary.summonCount).toBeGreaterThanOrEqual(3);
    expect(summary.loadoutSize).toBeGreaterThanOrEqual(12);
    expect(summary.themeCount).toBeGreaterThanOrEqual(12);
    expect(summary.wishcraftHitCount).toBeGreaterThanOrEqual(14);
    expect(summary.visualKindCount).toBeGreaterThanOrEqual(12);
  });

  it("keeps HUD and player-head level labels wired to the same QA level updater", async () => {
    const html = await readFile("artifacts/visual-polish/qa-live-combat-spectacle-scene.html", "utf8");

    expect(html).toContain("data-player-level data-spectacle-level");
    expect(html.match(/data-spectacle-level/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
