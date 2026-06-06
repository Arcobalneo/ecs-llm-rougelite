import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { createServer } from "../../src/server/http.js";
import { createRunStore } from "../../src/server/run-store.js";
import { createBossEncounterPlan } from "../../src/shared/boss/boss-planning.js";
import { CONTENT_VERSION } from "../../src/shared/content-version.js";
import type { Wishcraft } from "../../src/shared/wishcraft/types.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";
import { validateWishcraftContract } from "../../src/shared/wishcraft/validation.js";

describe("Run creation API", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "infinite-starwish-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("creates an incomplete Run in SQLite and returns its runId with the contentVersion", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const server = createServer({ runStore: store });

    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    const db = new DatabaseSync(dbPath);
    try {
      const response = await fetch(`${listener.origin}/api/runs`, { method: "POST" });

      expect(response.status).toBe(201);
      const body = (await response.json()) as { runId: string; contentVersion: string };
      expect(body.runId).toMatch(/^run_[a-z0-9]+_[a-z0-9]+$/);
      expect(body.contentVersion).toBe(CONTENT_VERSION);

      const row = db
        .prepare(
          "select id, content_version, status, created_at, completed_at from runs where id = ?",
        )
        .get(body.runId) as
        | {
            id: string;
            content_version: string;
            status: string;
            created_at: string;
            completed_at: string | null;
          }
        | undefined;

      expect(row).toEqual({
        id: body.runId,
        content_version: CONTENT_VERSION,
        status: "started",
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        completed_at: null,
      });
    } finally {
      await listener.close();
      db.close();
      store.close();
    }
  });

  it("returns a controlled failure when the Run cannot be persisted", async () => {
    const server = createServer({
      runStore: {
        completeRun() {
          throw new Error("not used");
        },
        createRun() {
          throw new Error("database is unavailable");
        },
        getLeaderboard() {
          throw new Error("not used");
        },
        getLeaderboardDetails() {
          throw new Error("not used");
        },
        getRunAudit() {
          throw new Error("not used");
        },
        getRunStatus() {
          throw new Error("not used");
        },
        recordBossPlan() {
          throw new Error("not used");
        },
        recordWishFulfillment() {
          throw new Error("not used");
        },
        submitPlayerName() {
          throw new Error("not used");
        },
        close() {},
      },
    });
    const listener = await server.listen({ port: 0, host: "127.0.0.1" });

    try {
      const response = await fetch(`${listener.origin}/api/runs`, { method: "POST" });

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: "run_creation_failed" });
    } finally {
      await listener.close();
    }
  });

  it("fulfills a Wish through the server-side interpreter and records history plus trace", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const providerOutputs = [JSON.stringify(wishcraftCatalog.fixtures.gravityOrbiter)];
    const server = createServer({
      runStore: store,
      wishProvider: createFakeWishProvider(providerOutputs),
    });

    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    const db = new DatabaseSync(dbPath);
    try {
      const created = await fetch(`${listener.origin}/api/runs`, { method: "POST" });
      const run = (await created.json()) as { runId: string };

      const response = await fetch(`${listener.origin}/api/runs/${run.runId}/wish-fulfillments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language: "en",
          level: 2,
          loadoutSummary: "Empty Wishcraft Loadout",
          wish: "I want black hole orbiters",
        }),
      });

      expect(response.status).toBe(201);
      const body = (await response.json()) as {
        wishcraft: Wishcraft;
      };
      expect(validateWishcraftContract(wishcraftCatalog, body.wishcraft)).toEqual([]);
      expect(body.wishcraft).toEqual(wishcraftCatalog.fixtures.gravityOrbiter);

      const rows = db
        .prepare(
          "select run_id, awarded_level, source_wish, wishcraft_json, interpretation_trace_id from wishcraft_history where run_id = ? order by awarded_level",
        )
        .all(run.runId) as Array<{
        awarded_level: number;
        interpretation_trace_id: number;
        run_id: string;
        source_wish: string;
        wishcraft_json: string;
      }>;

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        awarded_level: 2,
        run_id: run.runId,
        source_wish: "I want black hole orbiters",
      });
      expect(JSON.parse(rows[0].wishcraft_json) as unknown).toEqual(
        wishcraftCatalog.fixtures.gravityOrbiter,
      );

      const trace = db
        .prepare(
          "select run_id, awarded_level, provider, model, original_wish, loadout_summary, trace_json, final_wishcraft_json from wish_interpretation_traces where id = ?",
        )
        .get(rows[0].interpretation_trace_id) as
        | {
            awarded_level: number;
            final_wishcraft_json: string;
            loadout_summary: string;
            model: string;
            original_wish: string;
            provider: string;
            run_id: string;
            trace_json: string;
          }
        | undefined;
      expect(trace).toMatchObject({
        awarded_level: 2,
        loadout_summary: "Empty Wishcraft Loadout",
        model: "fake-wish-provider",
        original_wish: "I want black hole orbiters",
        provider: "fake",
        run_id: run.runId,
      });
      expect(JSON.parse(trace!.final_wishcraft_json) as unknown).toEqual(
        wishcraftCatalog.fixtures.gravityOrbiter,
      );
      const traceJson = JSON.parse(trace!.trace_json) as {
        attempts: Array<{ phase: string; rawOutput: string }>;
        apiKey?: string;
        providerConfig: { apiKey?: string };
      };
      expect(traceJson.attempts).toEqual([
        expect.objectContaining({
          errors: [],
          phase: "initial",
          rawOutput: JSON.stringify(wishcraftCatalog.fixtures.gravityOrbiter),
          usage: {
            completionTokens: 12,
            promptTokens: 34,
            totalTokens: 46,
          },
        }),
      ]);
      expect(traceJson.apiKey).toBeUndefined();
      expect(traceJson.providerConfig.apiKey).toBeUndefined();
    } finally {
      await listener.close();
      db.close();
      store.close();
    }
  });

  it("records and returns a server fallback Wishcraft when the provider is unavailable", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const server = createServer({
      runStore: store,
      wishProvider: createThrowingWishProvider(),
    });
    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    const db = new DatabaseSync(dbPath);
    try {
      const created = await fetch(`${listener.origin}/api/runs`, { method: "POST" });
      const run = (await created.json()) as { runId: string };

      const response = await fetch(`${listener.origin}/api/runs/${run.runId}/wish-fulfillments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language: "en",
          level: 2,
          loadoutSummary: "Empty Wishcraft Loadout",
          wish: "I want black hole gravity orbiters",
        }),
      });

      expect(response.status).toBe(201);
      const body = (await response.json()) as { wishcraft: Wishcraft };
      expect(body.wishcraft.primaryThemeId).toBe("gravity");
      const stored = db
        .prepare("select wishcraft_json from wishcraft_history where run_id = ? and awarded_level = 2")
        .get(run.runId) as { wishcraft_json: string } | undefined;
      expect(JSON.parse(stored!.wishcraft_json) as Wishcraft).toEqual(body.wishcraft);
    } finally {
      await listener.close();
      db.close();
      store.close();
    }
  });

  it("keeps mock Wish Fulfillment one-per-level when the same request is repeated", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const server = createServer({ runStore: store });

    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    const db = new DatabaseSync(dbPath);
    try {
      const created = await fetch(`${listener.origin}/api/runs`, { method: "POST" });
      const run = (await created.json()) as { runId: string };
      const request = {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          level: 2,
          loadoutSummary: "Empty Wishcraft Loadout",
          wish: "I want a star lance",
        }),
      };

      const first = await fetch(
        `${listener.origin}/api/runs/${run.runId}/wish-fulfillments`,
        request,
      );
      const second = await fetch(
        `${listener.origin}/api/runs/${run.runId}/wish-fulfillments`,
        request,
      );

      expect(first.status).toBe(201);
      expect(second.status).toBe(201);
      expect(await second.json()).toEqual(await first.json());

      const count = db
        .prepare("select count(*) as count from wishcraft_history where run_id = ? and awarded_level = 2")
        .get(run.runId) as { count: number };
      expect(count.count).toBe(1);
    } finally {
      await listener.close();
      db.close();
      store.close();
    }
  });

  it("rejects mock Wish Fulfillment for an unknown Run", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const server = createServer({ runStore: store });

    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    try {
      const response = await fetch(
        `${listener.origin}/api/runs/run_missing/wish-fulfillments`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            level: 2,
            loadoutSummary: "Empty Wishcraft Loadout",
            wish: "I want a star lance",
          }),
        },
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "run_not_found" });
    } finally {
      await listener.close();
      store.close();
    }
  });

  it("records local Boss plans in SQLite without invoking the Wish Interpreter", () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const db = new DatabaseSync(dbPath);
    try {
      const run = store.createRun();
      const plan = createBossEncounterPlan({
        bossEncounterNumber: 1,
        loadout: [],
        plannedLevel: 5,
      });

      const record = store.recordBossPlan({
        encounterId: "encounter-run-1-level-5",
        plan,
        runId: run.runId,
      });
      const repeated = store.recordBossPlan({
        encounterId: "encounter-run-1-level-5",
        plan,
        runId: run.runId,
      });

      expect(repeated).toEqual(record);
      const row = db
        .prepare(
          "select run_id, encounter_id, planned_level, encounter_kind, boss_plan_json from boss_plan_history where run_id = ?",
        )
        .get(run.runId) as
        | {
            boss_plan_json: string;
            encounter_id: string;
            encounter_kind: string;
            planned_level: number;
            run_id: string;
          }
        | undefined;

      expect(row).toMatchObject({
        encounter_id: "encounter-run-1-level-5",
        encounter_kind: "single",
        planned_level: 5,
        run_id: run.runId,
      });
      expect(JSON.parse(row!.boss_plan_json)).toEqual(record);
    } finally {
      db.close();
      store.close();
    }
  });

  it("records defeated Boss plans through the API and only shows defeated Bosses in Leaderboard details", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const server = createServer({ runStore: store });
    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    try {
      const created = await fetch(`${listener.origin}/api/runs`, { method: "POST" });
      const run = (await created.json()) as { runId: string };
      const defeatedPlan = createBossEncounterPlan({
        bossEncounterNumber: 1,
        loadout: [],
        plannedLevel: 5,
      });
      const undefeatedPlan = createBossEncounterPlan({
        bossEncounterNumber: 2,
        loadout: [],
        plannedLevel: 10,
      });

      const defeated = await fetch(`${listener.origin}/api/runs/${run.runId}/boss-plans`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          defeated: false,
          encounterId: "boss-1",
          plan: defeatedPlan,
        }),
      });
      const defeatedUpdate = await fetch(`${listener.origin}/api/runs/${run.runId}/boss-plans`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          defeated: true,
          encounterId: "boss-1",
          plan: defeatedPlan,
        }),
      });
      const undefeated = await fetch(`${listener.origin}/api/runs/${run.runId}/boss-plans`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          defeated: false,
          encounterId: "boss-2",
          plan: undefeatedPlan,
        }),
      });
      expect(defeated.status).toBe(201);
      expect(defeatedUpdate.status).toBe(201);
      expect(undefeated.status).toBe(201);
      store.completeRun({
        activeCombatSeconds: 180,
        bossKills: defeatedPlan.bosses.length,
        contentVersion: CONTENT_VERSION,
        kills: 50,
        level: 5,
        runId: run.runId,
        score: 1880,
        warnings: [],
      });
      store.submitPlayerName({ playerName: "Boss Pilot", runId: run.runId });

      const details = await fetch(`${listener.origin}/api/leaderboard/Boss%20Pilot`);
      expect(details.status).toBe(200);
      const body = (await details.json()) as {
        details: { bossHistory: Array<{ name: string }> };
      };
      expect(body.details.bossHistory).toEqual(defeatedPlan.bosses.map((boss) => ({ name: boss.name })));
      expect(body.details.bossHistory).not.toEqual(
        expect.arrayContaining(undefeatedPlan.bosses.map((boss) => ({ name: boss.name }))),
      );
    } finally {
      await listener.close();
      store.close();
    }
  });

  it("rejects forged Boss plans and defeated updates for unplanned encounters", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const server = createServer({ runStore: store });
    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    try {
      const created = await fetch(`${listener.origin}/api/runs`, { method: "POST" });
      const run = (await created.json()) as { runId: string };
      const legalPlan = createBossEncounterPlan({
        bossEncounterNumber: 1,
        loadout: [],
        plannedLevel: 5,
      });
      const forgedPlan = {
        ...legalPlan,
        encounterKind: "single",
        bosses: [
          {
            ...legalPlan.bosses[0],
            name: "Forged Boss",
            rivalThemeId: "void",
          },
          {
            ...legalPlan.bosses[0],
            name: "Impossible Extra Boss",
          },
        ],
      };

      const forged = await fetch(`${listener.origin}/api/runs/${run.runId}/boss-plans`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          defeated: false,
          encounterId: "boss-1",
          plan: forgedPlan,
        }),
      });
      const defeatedWithoutWarning = await fetch(`${listener.origin}/api/runs/${run.runId}/boss-plans`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          defeated: true,
          encounterId: "boss-1",
          plan: legalPlan,
        }),
      });

      expect(forged.status).toBe(400);
      expect(await forged.json()).toEqual({ error: "invalid_boss_plan_request" });
      expect(defeatedWithoutWarning.status).toBe(409);
      expect(await defeatedWithoutWarning.json()).toEqual({ error: "boss_plan_recording_failed" });
    } finally {
      await listener.close();
      store.close();
    }
  });

  it("rejects future Boss encounter plans that skip the server-recorded sequence", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const server = createServer({ runStore: store });
    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    try {
      const created = await fetch(`${listener.origin}/api/runs`, { method: "POST" });
      const run = (await created.json()) as { runId: string };
      const futurePlan = createBossEncounterPlan({
        bossEncounterNumber: 3,
        loadout: [],
        plannedLevel: 5,
      });

      const response = await fetch(`${listener.origin}/api/runs/${run.runId}/boss-plans`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          defeated: false,
          encounterId: "boss-3-early",
          plan: futurePlan,
        }),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "invalid_boss_plan_request" });
    } finally {
      await listener.close();
      store.close();
    }
  });

  it("submits completed Run summaries, attributes Player Names, and reads global Leaderboard", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const server = createServer({ runStore: store });
    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    try {
      const created = await fetch(`${listener.origin}/api/runs`, { method: "POST" });
      const run = (await created.json()) as { runId: string };

      const completed = await fetch(`${listener.origin}/api/runs/${run.runId}/completion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activeCombatSeconds: 88,
          bossKills: 0,
          contentVersion: CONTENT_VERSION,
          kills: 20,
          level: 6,
          score: 538,
          warnings: [],
        }),
      });
      expect(completed.status).toBe(201);

      const named = await fetch(`${listener.origin}/api/runs/${run.runId}/player-name`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerName: "  Nova   Pilot " }),
      });
      expect(named.status).toBe(201);
      expect(await named.json()).toEqual({
        entry: expect.objectContaining({
          playerName: "Nova Pilot",
          score: 538,
        }),
      });

      const leaderboard = await fetch(`${listener.origin}/api/leaderboard`);
      expect(leaderboard.status).toBe(200);
      expect(await leaderboard.json()).toEqual({
        entries: [
          expect.objectContaining({
            playerName: "Nova Pilot",
            score: 538,
          }),
        ],
      });
    } finally {
      await listener.close();
      store.close();
    }
  });

  it("rejects completion summaries whose score or boss kills disagree with server records and keeps completion immutable", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const server = createServer({ runStore: store });
    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    try {
      const created = await fetch(`${listener.origin}/api/runs`, { method: "POST" });
      const run = (await created.json()) as { runId: string };
      const plan = createBossEncounterPlan({
        bossEncounterNumber: 1,
        loadout: [],
        plannedLevel: 5,
      });
      await fetch(`${listener.origin}/api/runs/${run.runId}/boss-plans`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ defeated: false, encounterId: "boss-1", plan }),
      });
      await fetch(`${listener.origin}/api/runs/${run.runId}/boss-plans`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ defeated: true, encounterId: "boss-1", plan }),
      });

      const inflated = await fetch(`${listener.origin}/api/runs/${run.runId}/completion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activeCombatSeconds: 100,
          bossKills: 1,
          contentVersion: CONTENT_VERSION,
          kills: 10,
          level: 5,
          score: 99_999,
          warnings: [],
        }),
      });
      expect(inflated.status).toBe(400);
      expect(await inflated.json()).toEqual({ error: "invalid_run_completion_request" });

      const first = await fetch(`${listener.origin}/api/runs/${run.runId}/completion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activeCombatSeconds: 100,
          bossKills: 1,
          contentVersion: CONTENT_VERSION,
          kills: 10,
          level: 5,
          score: 1400,
          warnings: [],
        }),
      });
      const mutate = await fetch(`${listener.origin}/api/runs/${run.runId}/completion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activeCombatSeconds: 900,
          bossKills: 1,
          contentVersion: CONTENT_VERSION,
          kills: 500,
          level: 20,
          score: 6_850,
          warnings: [],
        }),
      });
      expect(first.status).toBe(201);
      expect(mutate.status).toBe(409);
      expect(await mutate.json()).toEqual({ error: "run_already_completed" });

      const secondCreated = await fetch(`${listener.origin}/api/runs`, { method: "POST" });
      const secondRun = (await secondCreated.json()) as { runId: string };
      const wrongBossKills = await fetch(`${listener.origin}/api/runs/${secondRun.runId}/completion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activeCombatSeconds: 100,
          bossKills: 1,
          contentVersion: CONTENT_VERSION,
          kills: 10,
          level: 5,
          score: 1400,
          warnings: [],
        }),
      });
      expect(wrongBossKills.status).toBe(400);
      expect(await wrongBossKills.json()).toEqual({ error: "invalid_run_completion_request" });
    } finally {
      await listener.close();
      store.close();
    }
  });

  it("locks server Wishcraft and Boss history after Run completion", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const server = createServer({ runStore: store });
    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    try {
      const created = await fetch(`${listener.origin}/api/runs`, { method: "POST" });
      const run = (await created.json()) as { runId: string };

      const completed = await fetch(`${listener.origin}/api/runs/${run.runId}/completion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activeCombatSeconds: 40,
          bossKills: 0,
          contentVersion: CONTENT_VERSION,
          kills: 5,
          level: 1,
          score: 90,
          warnings: [],
        }),
      });
      expect(completed.status).toBe(201);

      const lateWish = await fetch(`${listener.origin}/api/runs/${run.runId}/wish-fulfillments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language: "en",
          level: 99,
          loadoutSummary: "completed",
          wish: "fake late wish",
        }),
      });
      const lateBoss = await fetch(`${listener.origin}/api/runs/${run.runId}/boss-plans`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          defeated: false,
          encounterId: "late-boss",
          plan: createBossEncounterPlan({
            bossEncounterNumber: 1,
            loadout: [],
            plannedLevel: 5,
          }),
        }),
      });

      expect(lateWish.status).toBe(409);
      expect(await lateWish.json()).toEqual({ error: "run_already_completed" });
      expect(lateBoss.status).toBe(409);
      expect(await lateBoss.json()).toEqual({ error: "run_already_completed" });
    } finally {
      await listener.close();
      store.close();
    }
  });

  it("rejects malformed or impossible completed Run summaries before Leaderboard attribution", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const server = createServer({ runStore: store });
    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    try {
      const created = await fetch(`${listener.origin}/api/runs`, { method: "POST" });
      const run = (await created.json()) as { runId: string };

      const response = await fetch(`${listener.origin}/api/runs/${run.runId}/completion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activeCombatSeconds: Number.NaN,
          bossKills: 0.5,
          contentVersion: "wrong-version",
          kills: -20,
          level: 0,
          score: -1888,
          warnings: ["ok"],
        }),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "invalid_run_completion_request" });
      expect(() => store.submitPlayerName({ playerName: "Bad Pilot", runId: run.runId })).toThrow("Run is not completed");
    } finally {
      await listener.close();
      store.close();
    }
  });

  it("rejects completion summaries that contradict server-recorded Wishcraft or Boss milestones", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const server = createServer({ runStore: store });
    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    try {
      const wishRun = store.createRun();
      store.recordWishFulfillment({
        level: 4,
        loadoutSummary: "Empty Wishcraft Loadout",
        runId: wishRun.runId,
        trace: createTraceFixture({
          finalWishcraft: wishcraftCatalog.fixtures.gravityOrbiter,
          level: 4,
          wish: "黑洞伴飞",
        }),
        wish: "黑洞伴飞",
        wishcraft: wishcraftCatalog.fixtures.gravityOrbiter,
      });

      const belowWishLevel = await fetch(`${listener.origin}/api/runs/${wishRun.runId}/completion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activeCombatSeconds: 40,
          bossKills: 0,
          contentVersion: CONTENT_VERSION,
          kills: 5,
          level: 3,
          score: 190,
          warnings: [],
        }),
      });
      expect(belowWishLevel.status).toBe(400);
      expect(await belowWishLevel.json()).toEqual({ error: "invalid_run_completion_request" });

      const bossRun = store.createRun();
      const plan = createBossEncounterPlan({
        bossEncounterNumber: 1,
        loadout: [],
        plannedLevel: 5,
      });
      store.recordBossPlan({ defeated: false, encounterId: "boss-1", plan, runId: bossRun.runId });
      store.recordBossPlan({ defeated: true, encounterId: "boss-1", plan, runId: bossRun.runId });

      const belowBossLevel = await fetch(`${listener.origin}/api/runs/${bossRun.runId}/completion`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activeCombatSeconds: 40,
          bossKills: 1,
          contentVersion: CONTENT_VERSION,
          kills: 5,
          level: 4,
          score: 1240,
          warnings: [],
        }),
      });
      expect(belowBossLevel.status).toBe(400);
      expect(await belowBossLevel.json()).toEqual({ error: "invalid_run_completion_request" });
    } finally {
      await listener.close();
      store.close();
    }
  });

  it("returns Leaderboard details from server-recorded Wishcraft and Boss history", async () => {
    const dbPath = join(tempDir, "runs.sqlite");
    const store = createRunStore({ databasePath: dbPath });
    const server = createServer({ runStore: store });
    const listener = await server.listen({ port: 0, host: "127.0.0.1" });
    try {
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
          finalWishcraft: wishcraftCatalog.fixtures.gravityOrbiter,
          language: "zh",
          legalizationChanges: [],
          level: 2,
          loadoutSummary: "Empty Wishcraft Loadout",
          originalWish: "黑洞伴飞",
          providerConfig: { model: "fake-wish-provider", provider: "fake", thinkingType: "disabled" },
          timingMs: 0,
          validationErrors: [],
        },
        wish: "黑洞伴飞",
        wishcraft: wishcraftCatalog.fixtures.gravityOrbiter,
      });
      const plan = createBossEncounterPlan({
        bossEncounterNumber: 1,
        loadout: [wishcraftCatalog.fixtures.gravityOrbiter],
        plannedLevel: 5,
      });
      store.recordBossPlan({ defeated: false, encounterId: "encounter-run-1-level-5", plan, runId: run.runId });
      store.recordBossPlan({ defeated: true, encounterId: "encounter-run-1-level-5", plan, runId: run.runId });
      store.completeRun({
        activeCombatSeconds: 118,
        bossKills: 1,
        contentVersion: CONTENT_VERSION,
        kills: 44,
        level: 5,
        runId: run.runId,
        score: 1758,
        warnings: [],
      });
      store.submitPlayerName({ playerName: "Archive Pilot", runId: run.runId });

      const response = await fetch(`${listener.origin}/api/leaderboard/Archive%20Pilot`);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        details: {
          bossHistory: plan.bosses.map((boss) => ({ name: boss.name })),
          entry: expect.objectContaining({
            bestRunId: run.runId,
            playerName: "Archive Pilot",
            score: 1758,
          }),
          wishcraftHistory: [
            {
              awardedLevel: 2,
              name: wishcraftCatalog.fixtures.gravityOrbiter.name,
            },
          ],
        },
      });
    } finally {
      await listener.close();
      store.close();
    }
  });
});

function createTraceFixture(options: {
  finalWishcraft: Wishcraft;
  level: number;
  wish: string;
}) {
  return {
    attempts: [],
    candidates: {
      contentVersion: CONTENT_VERSION,
      mechanicPieceIds: [],
      themeIds: [],
      visualPieceIds: [],
    },
    finalWishcraft: options.finalWishcraft,
    language: "zh" as const,
    legalizationChanges: [],
    level: options.level,
    loadoutSummary: "Empty Wishcraft Loadout",
    originalWish: options.wish,
    providerConfig: { model: "fake-wish-provider", provider: "fake", thinkingType: "disabled" as const },
    timingMs: 0,
    validationErrors: [],
  };
}

function createFakeWishProvider(outputs: string[]) {
  let callIndex = 0;
  return {
    config: {
      model: "fake-wish-provider",
      provider: "fake",
      thinkingType: "disabled" as const,
    },
    async generate() {
      const output = outputs[Math.min(callIndex, outputs.length - 1)];
      callIndex += 1;
      return {
        rawText: output,
        usage: { completionTokens: 12, promptTokens: 34, totalTokens: 46 },
      };
    },
  };
}

function createThrowingWishProvider() {
  return {
    config: {
      model: "throwing-wish-provider",
      provider: "fake",
      thinkingType: "disabled" as const,
    },
    async generate() {
      throw new Error("provider unavailable");
    },
  };
}
