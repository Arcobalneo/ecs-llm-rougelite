import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRunStore, RunNotFoundError } from "../../src/server/run-store.js";
import { createBossEncounterPlan } from "../../src/shared/boss/boss-planning.js";
import { CONTENT_VERSION } from "../../src/shared/content-version.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";

describe("Run completion and global leaderboard store", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "infinite-starwish-leaderboard-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("persists completed Run summary separately from Player Name attribution", () => {
    const store = createRunStore({ databasePath: join(tempDir, "runs.sqlite") });
    const run = store.createRun();

    const summary = store.completeRun({
      activeCombatSeconds: 123,
      bossKills: 1,
      contentVersion: CONTENT_VERSION,
      kills: 42,
      level: 7,
      runId: run.runId,
      score: 1999,
      warnings: ["visual-budget-degraded"],
    });

    expect(summary).toMatchObject({
      bossKills: 1,
      contentVersion: CONTENT_VERSION,
      kills: 42,
      level: 7,
      score: 1843,
      warnings: ["visual-budget-degraded"],
    });
    expect(store.getLeaderboard({ limit: 20 })).toEqual([]);
    store.close();
  });

  it("normalizes Player Names and keeps only the highest scoring Run per name", () => {
    const store = createRunStore({ databasePath: join(tempDir, "runs.sqlite") });
    const low = completedRun(store, { score: 1000 });
    const high = completedRun(store, { score: 1400 });

    store.submitPlayerName({ playerName: "  Nova   Pilot ", runId: low.runId });
    store.submitPlayerName({ playerName: "nova pilot", runId: high.runId });

    const leaderboard = store.getLeaderboard({ limit: 20 });
    expect(leaderboard).toHaveLength(1);
    expect(leaderboard[0]).toMatchObject({
      bestRunId: high.runId,
      playerName: "Nova Pilot",
      score: 1400,
    });
    store.close();
  });

  it("keeps same-score ties in earliest achieved order and returns only top 20", () => {
    const store = createRunStore({ databasePath: join(tempDir, "runs.sqlite") });
    for (let index = 0; index < 22; index += 1) {
      const run = completedRun(store, { score: index === 0 || index === 1 ? 5000 : 1000 + index });
      store.submitPlayerName({ playerName: `Pilot ${index.toString().padStart(2, "0")}`, runId: run.runId });
    }

    const leaderboard = store.getLeaderboard({ limit: 20 });

    expect(leaderboard).toHaveLength(20);
    expect(leaderboard[0].playerName).toBe("Pilot 00");
    expect(leaderboard[1].playerName).toBe("Pilot 01");
    expect(leaderboard.map((entry) => entry.playerName)).not.toContain("Pilot 02");
    store.close();
  });

  it("leaderboard details read Wishcraft and Boss history from server records", () => {
    const store = createRunStore({ databasePath: join(tempDir, "runs.sqlite") });
    const run = store.createRun();
    store.recordWishFulfillment({
      level: 2,
      loadoutSummary: "Empty Wishcraft Loadout",
      runId: run.runId,
      trace: {
        attempts: [],
        candidates: {
          contentVersion: CONTENT_VERSION,
          mechanicPieceIds: [],
          themeIds: [],
          visualPieceIds: [],
        },
        finalWishcraft: wishcraftCatalog.fixtures.starLance,
        language: "zh",
        legalizationChanges: [],
        level: 2,
        loadoutSummary: "Empty Wishcraft Loadout",
        originalWish: "star lance",
        providerConfig: { model: "test", provider: "fake", thinkingType: "disabled" },
        timingMs: 0,
        validationErrors: [],
      },
      wish: "star lance",
      wishcraft: wishcraftCatalog.fixtures.starLance,
    });
    const plan = createBossEncounterPlan({
      bossEncounterNumber: 1,
      loadout: [wishcraftCatalog.fixtures.starLance],
      plannedLevel: 5,
    });
    store.recordBossPlan({ defeated: false, encounterId: "boss-1", plan, runId: run.runId });
    store.recordBossPlan({ defeated: true, encounterId: "boss-1", plan, runId: run.runId });
    store.completeRun({
      activeCombatSeconds: 60,
      bossKills: 1,
      contentVersion: CONTENT_VERSION,
      kills: 12,
      level: 5,
      runId: run.runId,
      score: 888,
      warnings: [],
    });
    store.submitPlayerName({ playerName: "Archive Pilot", runId: run.runId });

    const details = store.getLeaderboardDetails({ playerName: "archive pilot" });

    expect(details?.wishcraftHistory).toEqual([
      { awardedLevel: 2, name: wishcraftCatalog.fixtures.starLance.name },
    ]);
    expect(details?.bossHistory).toEqual(plan.bosses.map((boss) => ({ name: boss.name })));
    store.close();
  });

  it("migrates legacy Wishcraft history tables before recording interpretation traces", () => {
    const databasePath = join(tempDir, "runs.sqlite");
    const legacy = new DatabaseSync(databasePath);
    legacy.exec(`
      create table wishcraft_history (
        id integer primary key autoincrement,
        run_id text not null,
        awarded_level integer not null,
        source_wish text not null,
        loadout_summary text not null,
        wishcraft_json text not null,
        created_at text not null,
        unique (run_id, awarded_level)
      );
    `);
    legacy.close();
    const store = createRunStore({ databasePath });
    const run = store.createRun();

    const wishcraft = store.recordWishFulfillment({
      level: 2,
      loadoutSummary: "Empty Wishcraft Loadout",
      runId: run.runId,
      trace: {
        attempts: [],
        candidates: {
          contentVersion: CONTENT_VERSION,
          mechanicPieceIds: [],
          themeIds: [],
          visualPieceIds: [],
        },
        finalWishcraft: wishcraftCatalog.fixtures.starLance,
        language: "zh",
        legalizationChanges: [],
        level: 2,
        loadoutSummary: "Empty Wishcraft Loadout",
        originalWish: "star lance",
        providerConfig: { model: "test", provider: "fake", thinkingType: "disabled" },
        timingMs: 0,
        validationErrors: [],
      },
      wish: "star lance",
      wishcraft: wishcraftCatalog.fixtures.starLance,
    });

    expect(wishcraft.id).toBe(wishcraftCatalog.fixtures.starLance.id);
    store.close();
  });

  it("rejects Player Name attribution for nonexistent or incomplete Runs", () => {
    const store = createRunStore({ databasePath: join(tempDir, "runs.sqlite") });
    const run = store.createRun();

    expect(() => store.submitPlayerName({ playerName: "Pilot", runId: "run_missing" })).toThrow(RunNotFoundError);
    expect(() => store.submitPlayerName({ playerName: "Pilot", runId: run.runId })).toThrow("Run is not completed");
    store.close();
  });
});

function completedRun(store: ReturnType<typeof createRunStore>, options: { score: number }) {
  const run = store.createRun();
  store.completeRun({
    activeCombatSeconds: options.score - 100,
    bossKills: 0,
    contentVersion: CONTENT_VERSION,
    kills: 0,
    level: 3,
    runId: run.runId,
    score: options.score,
    warnings: [],
  });
  return run;
}
