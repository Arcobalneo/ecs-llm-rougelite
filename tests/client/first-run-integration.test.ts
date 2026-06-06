import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { mountArena } from "../../src/client/arena.js";
import { createCombatLoopState } from "../../src/client/simulation/combat-loop.js";
import { CONTENT_VERSION } from "../../src/shared/content-version.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";

describe("First complete Run integration smoke", () => {
  it("connects Wishcraft Manifestation, milestone Boss warning, death settlement, and Leaderboard", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    const combat = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
    });
    combat.feedback.push({ kind: "level-up", level: 5 });
    const completedRuns: unknown[] = [];

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_integration", contentVersion: CONTENT_VERSION },
      initialCombatState: combat,
      fulfillWish: async () => wishcraftCatalog.fixtures.starLance,
      recordBossPlan: async () => undefined,
      completeRun: async (summary) => {
        completedRuns.push(summary);
        return { ...summary, completedAt: "2026-06-06T00:00:00.000Z" };
      },
      submitPlayerName: async ({ runId }) => ({
        achievedAt: "2026-06-06T00:00:00.000Z",
        bestRunId: runId,
        bossKills: 0,
        kills: 0,
        level: 5,
        playerName: "Integration Pilot",
        score: 500,
      }),
      fetchLeaderboard: async () => [
        {
          achievedAt: "2026-06-06T00:00:00.000Z",
          bestRunId: "run_integration",
          bossKills: 0,
          kills: 0,
          level: 5,
          playerName: "Integration Pilot",
          score: 500,
        },
      ],
      fetchLeaderboardDetails: async () => ({
        bossHistory: [{ name: "霜镜天穹-1" }],
        entry: {
          achievedAt: "2026-06-06T00:00:00.000Z",
          bestRunId: "run_integration",
          bossKills: 0,
          kills: 0,
          level: 5,
          playerName: "Integration Pilot",
          score: 500,
        },
        wishcraftHistory: [
          {
            awardedLevel: 2,
            name: wishcraftCatalog.fixtures.starLance.name,
          },
        ],
      }),
    });

    const wishInput = dom.window.document.querySelector<HTMLInputElement>("[data-wish-input]")!;
    wishInput.value = "星火长枪";
    wishInput.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    dom.window.document.querySelector<HTMLButtonElement>("[data-wish-submit]")!.click();
    await waitForMicrotasks(dom.window);
    await waitForMicrotasks(dom.window);
    vi.advanceTimersByTime(900);
    await waitForMicrotasks(dom.window);

    expect(dom.window.document.querySelector("[data-boss-warning]")?.getAttribute("data-phase")).toBe("warning");

    combat.player.vitals.health = 0;
    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_integration", contentVersion: CONTENT_VERSION },
      initialCombatState: combat,
      recordBossPlan: async () => undefined,
      completeRun: async (summary) => {
        completedRuns.push(summary);
        return { ...summary, completedAt: "2026-06-06T00:00:00.000Z" };
      },
      submitPlayerName: async ({ runId }) => ({
        achievedAt: "2026-06-06T00:00:00.000Z",
        bestRunId: runId,
        bossKills: 0,
        kills: 0,
        level: 5,
        playerName: "Integration Pilot",
        score: 500,
      }),
      fetchLeaderboard: async () => [
        {
          achievedAt: "2026-06-06T00:00:00.000Z",
          bestRunId: "run_integration",
          bossKills: 0,
          kills: 0,
          level: 5,
          playerName: "Integration Pilot",
          score: 500,
        },
      ],
      fetchLeaderboardDetails: async () => ({
        bossHistory: [{ name: "霜镜天穹-1" }],
        entry: {
          achievedAt: "2026-06-06T00:00:00.000Z",
          bestRunId: "run_integration",
          bossKills: 0,
          kills: 0,
          level: 5,
          playerName: "Integration Pilot",
          score: 500,
        },
        wishcraftHistory: [
          {
            awardedLevel: 2,
            name: wishcraftCatalog.fixtures.starLance.name,
          },
        ],
      }),
    });
    await waitForMicrotasks(dom.window);
    expect(completedRuns).not.toHaveLength(0);
    expect(dom.window.document.querySelector("[data-settlement]")?.getAttribute("data-phase")).toBe("name-entry");

    const nameInput = dom.window.document.querySelector<HTMLInputElement>("[data-player-name-input]")!;
    nameInput.value = "Integration Pilot";
    nameInput.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    dom.window.document.querySelector<HTMLButtonElement>("[data-player-name-submit]")!.click();
    await waitForMicrotasks(dom.window);
    await waitForMicrotasks(dom.window);

    const detailButton = dom.window.document.querySelector<HTMLButtonElement>("[data-leaderboard-detail]");
    expect(detailButton).not.toBeNull();
    detailButton!.click();
    await waitForMicrotasks(dom.window);
    await waitForMicrotasks(dom.window);

    expect(dom.window.document.querySelector("[data-leaderboard-details]")?.textContent).toContain("星矛回响");
    expect(dom.window.document.querySelector("[data-leaderboard-details]")?.textContent).toContain("霜镜天穹-1");
  });
});

function waitForMicrotasks(window: { queueMicrotask(callback: VoidFunction): void }): Promise<void> {
  return new Promise((resolve) => {
    window.queueMicrotask(() => resolve());
  });
}
