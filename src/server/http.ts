import { createServer as createNodeServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { InvalidBossPlanError, RunNotFoundError } from "./run-store.js";
import type { RunStore } from "./run-store.js";
import { createMockWishProvider, interpretWish, type WishProvider } from "./wish-interpreter.js";
import { bossTemplates, type BossEncounterPlan, type BossMechSilhouette } from "../shared/boss/boss-planning.js";
import { CONTENT_VERSION } from "../shared/content-version.js";
import { computeScore } from "../shared/scoring.js";
import { wishcraftCatalog } from "../shared/wishcraft/catalog.js";

export interface AppServerOptions {
  runStore: RunStore;
  wishProvider?: WishProvider;
}

export interface ListenOptions {
  port: number;
  host: string;
}

export interface AppListener {
  origin: string;
  close(): Promise<void>;
}

export interface AppServer {
  listen(options: ListenOptions): Promise<AppListener>;
}

export function createServer(options: AppServerOptions): AppServer {
  const wishProvider = options.wishProvider ?? createMockWishProvider();
  const server = createNodeServer((request, response) => {
    response.setHeader("access-control-allow-origin", "*");
    response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
    response.setHeader("access-control-allow-headers", "content-type");

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method === "POST" && request.url === "/api/runs") {
      try {
        const run = options.runStore.createRun();
        response.writeHead(201, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify(run));
      } catch (error) {
        console.error("Failed to create Run", error);
        response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "run_creation_failed" }));
      }
      return;
    }

    const fulfillmentMatch = request.url?.match(/^\/api\/runs\/([^/]+)\/wish-fulfillments$/);
    if (request.method === "POST" && fulfillmentMatch) {
      void readJson(request)
        .then(async (body) => {
          const payload = parseWishFulfillmentPayload(body);
          if (!payload) {
            response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "invalid_wish_fulfillment_request" }));
            return;
          }

          const interpretation = await interpretWish(wishProvider, {
            language: payload.language,
            level: payload.level,
            loadoutSummary: payload.loadoutSummary,
            wish: payload.wish.trim(),
          });
          const wishcraft = options.runStore.recordWishFulfillment({
            runId: fulfillmentMatch[1],
            level: payload.level,
            loadoutSummary: payload.loadoutSummary,
            trace: interpretation.trace,
            wishcraft: interpretation.finalWishcraft,
            wish: payload.wish.trim(),
          });
          response.writeHead(201, { "content-type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ wishcraft }));
        })
        .catch((error) => {
          if (error instanceof RunNotFoundError) {
            response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "run_not_found" }));
            return;
          }
          if (error instanceof Error && error.message === "Run is already completed") {
            response.writeHead(409, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "run_already_completed" }));
            return;
          }
          console.error("Failed to fulfill mock Wishcraft", error);
          response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ error: "wish_fulfillment_failed" }));
        });
      return;
    }

    const completionMatch = request.url?.match(/^\/api\/runs\/([^/]+)\/completion$/);
    if (request.method === "POST" && completionMatch) {
      void readJson(request)
        .then((body) => {
          const payload = parseRunCompletionPayload(body);
          if (!payload) {
            response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "invalid_run_completion_request" }));
            return;
          }
          const status = options.runStore.getRunStatus({ runId: completionMatch[1] });
          if (status.completed) {
            response.writeHead(409, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "run_already_completed" }));
            return;
          }
          const audit = options.runStore.getRunAudit({ runId: completionMatch[1] });
          if (
            payload.score !== computeScore(payload) ||
            payload.bossKills !== audit.defeatedBossCount ||
            payload.level < audit.highestWishcraftLevel ||
            payload.level < audit.highestDefeatedBossPlannedLevel
          ) {
            response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "invalid_run_completion_request" }));
            return;
          }
          const summary = options.runStore.completeRun({
            ...payload,
            runId: completionMatch[1],
          });
          response.writeHead(201, { "content-type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ summary }));
        })
        .catch((error) => {
          if (error instanceof RunNotFoundError) {
            response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "run_not_found" }));
            return;
          }
          if (error instanceof Error && error.message === "Run is already completed") {
            response.writeHead(409, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "run_already_completed" }));
            return;
          }
          console.error("Failed to complete Run", error);
          response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ error: "run_completion_failed" }));
        });
      return;
    }

    const bossPlanMatch = request.url?.match(/^\/api\/runs\/([^/]+)\/boss-plans$/);
    if (request.method === "POST" && bossPlanMatch) {
      void readJson(request)
        .then((body) => {
          const payload = parseBossPlanPayload(body);
          if (!payload) {
            response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "invalid_boss_plan_request" }));
            return;
          }
          const record = options.runStore.recordBossPlan({
            defeated: payload.defeated,
            encounterId: payload.encounterId,
            plan: payload.plan,
            runId: bossPlanMatch[1],
          });
          response.writeHead(201, { "content-type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ record }));
        })
        .catch((error) => {
          if (error instanceof RunNotFoundError) {
            response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "run_not_found" }));
            return;
          }
          if (error instanceof Error && error.message === "Run is already completed") {
            response.writeHead(409, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "run_already_completed" }));
            return;
          }
          if (error instanceof InvalidBossPlanError) {
            response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "invalid_boss_plan_request" }));
            return;
          }
          console.error("Failed to record Boss plan", error);
          response.writeHead(409, { "content-type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ error: "boss_plan_recording_failed" }));
        });
      return;
    }

    const playerNameMatch = request.url?.match(/^\/api\/runs\/([^/]+)\/player-name$/);
    if (request.method === "POST" && playerNameMatch) {
      void readJson(request)
        .then((body) => {
          const payload = parsePlayerNamePayload(body);
          if (!payload) {
            response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "invalid_player_name_request" }));
            return;
          }
          const entry = options.runStore.submitPlayerName({
            playerName: payload.playerName,
            runId: playerNameMatch[1],
          });
          response.writeHead(201, { "content-type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ entry }));
        })
        .catch((error) => {
          if (error instanceof RunNotFoundError) {
            response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
            response.end(JSON.stringify({ error: "run_not_found" }));
            return;
          }
          response.writeHead(409, { "content-type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ error: "player_name_submission_failed" }));
        });
      return;
    }

    if (request.method === "GET" && request.url === "/api/leaderboard") {
      const entries = options.runStore.getLeaderboard({ limit: 20 });
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ entries }));
      return;
    }

    const leaderboardDetailsMatch = request.url?.match(/^\/api\/leaderboard\/([^/]+)$/);
    if (request.method === "GET" && leaderboardDetailsMatch) {
      const playerName = decodeURIComponent(leaderboardDetailsMatch[1]);
      const details = options.runStore.getLeaderboardDetails({ playerName });
      if (!details) {
        response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "leaderboard_entry_not_found" }));
        return;
      }
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ details }));
      return;
    }

    if (request.method === "GET" && request.url === "/api/health") {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ok: true }));
      return;
    }

    response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "not_found" }));
  });

  return {
    listen(listenOptions) {
      return listen(server, listenOptions);
    },
  };
}

interface WishFulfillmentPayload {
  language: "en" | "zh";
  level: number;
  loadoutSummary: string;
  wish: string;
}

interface RunCompletionPayload {
  activeCombatSeconds: number;
  bossKills: number;
  contentVersion: string;
  kills: number;
  level: number;
  score: number;
  warnings: string[];
}

interface BossPlanPayload {
  defeated: boolean;
  encounterId: string;
  plan: BossEncounterPlan;
}

interface PlayerNamePayload {
  playerName: string;
}

function parseWishFulfillmentPayload(body: unknown): WishFulfillmentPayload | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const candidate = body as Record<string, unknown>;
  if (
    typeof candidate.level !== "number" ||
    !Number.isInteger(candidate.level) ||
    candidate.level < 2 ||
    (candidate.language !== undefined &&
      candidate.language !== "en" &&
      candidate.language !== "zh") ||
    typeof candidate.loadoutSummary !== "string" ||
    typeof candidate.wish !== "string" ||
    candidate.wish.trim().length === 0
  ) {
    return undefined;
  }
  return {
    language: candidate.language === "en" ? "en" : "zh",
    level: candidate.level,
    loadoutSummary: candidate.loadoutSummary,
    wish: candidate.wish,
  };
}

function parseRunCompletionPayload(body: unknown): RunCompletionPayload | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const candidate = body as Record<string, unknown>;
  if (
    !isFiniteNumber(candidate.activeCombatSeconds) ||
    !isNonNegativeInteger(candidate.bossKills) ||
    candidate.contentVersion !== CONTENT_VERSION ||
    !isNonNegativeInteger(candidate.kills) ||
    !isPositiveInteger(candidate.level) ||
    !isNonNegativeInteger(candidate.score) ||
    !Array.isArray(candidate.warnings) ||
    !candidate.warnings.every((warning) => typeof warning === "string" && warning.length <= 200)
  ) {
    return undefined;
  }
  return {
    activeCombatSeconds: candidate.activeCombatSeconds,
    bossKills: candidate.bossKills,
    contentVersion: candidate.contentVersion,
    kills: candidate.kills,
    level: candidate.level,
    score: candidate.score,
    warnings: candidate.warnings,
  };
}

function parseBossPlanPayload(body: unknown): BossPlanPayload | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const candidate = body as Record<string, unknown>;
  if (
    typeof candidate.defeated !== "boolean" ||
    typeof candidate.encounterId !== "string" ||
    candidate.encounterId.trim().length === 0 ||
    !isBossEncounterPlan(candidate.plan)
  ) {
    return undefined;
  }
  return {
    defeated: candidate.defeated,
    encounterId: candidate.encounterId.trim(),
    plan: candidate.plan,
  };
}

function parsePlayerNamePayload(body: unknown): PlayerNamePayload | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const candidate = body as Record<string, unknown>;
  if (typeof candidate.playerName !== "string" || candidate.playerName.trim().length === 0) {
    return undefined;
  }
  return { playerName: candidate.playerName };
}

function readJson(request: import("node:http").IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      raw += chunk;
      if (raw.length > 16_384) {
        request.destroy(new Error("request body too large"));
      }
    });
    request.on("error", reject);
    request.on("end", () => {
      try {
        resolve(raw.length === 0 ? {} : JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function isBossEncounterPlan(value: unknown): value is BossEncounterPlan {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (
    (candidate.encounterKind !== "single" && candidate.encounterKind !== "double") ||
    !isPositiveInteger(candidate.bossEncounterNumber) ||
    !isPositiveInteger(candidate.plannedLevel) ||
    !Array.isArray(candidate.bosses)
  ) {
    return false;
  }
  const expectedBossCount = candidate.encounterKind === "double" ? 2 : 1;
  return candidate.bosses.length === expectedBossCount && candidate.bosses.every(isBossPlanEntry);
}

function isBossPlanEntry(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const template = bossTemplates.find((bossTemplate) => bossTemplate.id === candidate.templateId);
  const theme = wishcraftCatalog.themeTags.find((themeTag) => themeTag.id === candidate.rivalThemeId);
  if (
    !template ||
    !theme ||
    typeof candidate.name !== "string" ||
    !isBossMechSilhouette(candidate.silhouette) ||
    !Array.isArray(candidate.compatibleSilhouettes) ||
    !Array.isArray(candidate.visualPieceIds) ||
    !candidate.compatibleSilhouettes.every(isBossMechSilhouette) ||
    !candidate.visualPieceIds.every((id) => typeof id === "string")
  ) {
    return false;
  }
  return template.compatibleSilhouettes.includes(candidate.silhouette);
}

function isBossMechSilhouette(value: unknown): value is BossMechSilhouette {
  return value === "crawling" || value === "flying" || value === "humanoid";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function listen(server: Server, options: ListenOptions): Promise<AppListener> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      const address = server.address() as AddressInfo;
      resolve({
        origin: `http://${address.address}:${address.port}`,
        close: () =>
          new Promise<void>((closeResolve, closeReject) => {
            server.close((error) => {
              if (error) {
                closeReject(error);
                return;
              }
              closeResolve();
            });
          }),
      });
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(options.port, options.host);
  });
}
