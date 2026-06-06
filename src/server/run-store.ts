import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  bossEncounterPlansEqual,
  createBossEncounterPlan,
  createBossPlanRecord,
  type BossEncounterPlan,
  type BossPlanRecord,
} from "../shared/boss/boss-planning.js";
import { CONTENT_VERSION, type CreatedRunResponse } from "../shared/content-version.js";
import { computeScore } from "../shared/scoring.js";
import { wishcraftCatalog } from "../shared/wishcraft/catalog.js";
import type { Wishcraft } from "../shared/wishcraft/types.js";
import type { WishInterpretationTrace } from "./wish-interpreter.js";

export interface RunStoreOptions {
  databasePath: string;
}

export interface RunStore {
  completeRun(input: CompletedRunSummaryInput): CompletedRunSummary;
  createRun(): CreatedRunResponse;
  getLeaderboard(input: { limit: number }): LeaderboardEntry[];
  getLeaderboardDetails(input: { playerName: string }): LeaderboardDetails | undefined;
  getRunAudit(input: { runId: string }): RunAudit;
  getRunStatus(input: { runId: string }): RunStatus;
  recordBossPlan(input: BossPlanRecordInput): BossPlanRecord;
  recordWishFulfillment(input: WishFulfillmentRecordInput): Wishcraft;
  submitPlayerName(input: PlayerNameSubmissionInput): LeaderboardEntry;
  close(): void;
}

export interface CompletedRunSummaryInput {
  activeCombatSeconds: number;
  bossKills: number;
  contentVersion: string;
  kills: number;
  level: number;
  runId: string;
  score: number;
  warnings: string[];
}

export interface CompletedRunSummary extends CompletedRunSummaryInput {
  completedAt: string;
}

export interface PlayerNameSubmissionInput {
  playerName: string;
  runId: string;
}

export interface LeaderboardEntry {
  achievedAt: string;
  bestRunId: string;
  bossKills: number;
  kills: number;
  level: number;
  playerName: string;
  score: number;
}

export interface LeaderboardDetails {
  bossHistory: Array<{ name: string }>;
  entry: LeaderboardEntry;
  wishcraftHistory: Array<{ awardedLevel: number; name: Wishcraft["name"] }>;
}

export interface BossPlanRecordInput {
  defeated?: boolean;
  encounterId: string;
  plan: BossEncounterPlan;
  runId: string;
}

export interface RunAudit {
  defeatedBossCount: number;
  highestDefeatedBossPlannedLevel: number;
  highestWishcraftLevel: number;
  loadout: Wishcraft[];
}

export interface RunStatus {
  completed: boolean;
}

export interface WishFulfillmentRecordInput {
  level: number;
  loadoutSummary: string;
  runId: string;
  trace: WishInterpretationTrace;
  wishcraft: Wishcraft;
  wish: string;
}

export class RunNotFoundError extends Error {
  constructor(runId: string) {
    super(`Run not found: ${runId}`);
    this.name = "RunNotFoundError";
  }
}

export class InvalidBossPlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBossPlanError";
  }
}

export function createRunStore(options: RunStoreOptions): RunStore {
  mkdirSync(dirname(options.databasePath), { recursive: true });
  const database = new DatabaseSync(options.databasePath);
  database.exec(`
    create table if not exists runs (
      id text primary key,
      content_version text not null,
      status text not null,
      created_at text not null,
      completed_at text
    );

    create table if not exists wishcraft_history (
      id integer primary key autoincrement,
      run_id text not null,
      awarded_level integer not null,
      source_wish text not null,
      loadout_summary text not null,
      wishcraft_json text not null,
      interpretation_trace_id integer,
      created_at text not null,
      unique (run_id, awarded_level),
      foreign key (run_id) references runs(id),
      foreign key (interpretation_trace_id) references wish_interpretation_traces(id)
    );

    create table if not exists wish_interpretation_traces (
      id integer primary key autoincrement,
      run_id text not null,
      awarded_level integer not null,
      provider text not null,
      model text not null,
      original_wish text not null,
      loadout_summary text not null,
      trace_json text not null,
      final_wishcraft_json text not null,
      created_at text not null,
      foreign key (run_id) references runs(id)
    );

    create table if not exists boss_plan_history (
      id integer primary key autoincrement,
      run_id text not null,
      encounter_id text not null,
      planned_level integer not null,
      encounter_kind text not null,
      boss_plan_json text not null,
      defeated integer not null default 0,
      created_at text not null,
      unique (run_id, encounter_id),
      foreign key (run_id) references runs(id)
    );

    create table if not exists run_summaries (
      run_id text primary key,
      active_combat_seconds real not null,
      score integer not null,
      level integer not null,
      kills integer not null,
      boss_kills integer not null,
      content_version text not null,
      warnings_json text not null,
      completed_at text not null,
      foreign key (run_id) references runs(id)
    );

    create table if not exists leaderboard_entries (
      normalized_player_name text primary key,
      player_name text not null,
      best_run_id text not null,
      score integer not null,
      achieved_at text not null,
      foreign key (best_run_id) references run_summaries(run_id)
    );
  `);
  addColumnIfMissing(database, "wishcraft_history", "interpretation_trace_id", "integer");
  addColumnIfMissing(database, "boss_plan_history", "defeated", "integer not null default 0");

  return {
    completeRun(input) {
      assertRunExists(database, input.runId);
      const existing = database
        .prepare("select completed_at from run_summaries where run_id = ?")
        .get(input.runId) as { completed_at: string } | undefined;
      if (existing) {
        throw new Error("Run is already completed");
      }
      const completedAt = new Date().toISOString();
      const score = computeScore(input);
      database
        .prepare(
          `
            insert into run_summaries (
              run_id,
              active_combat_seconds,
              score,
              level,
              kills,
              boss_kills,
              content_version,
              warnings_json,
              completed_at
            )
            values (?, ?, ?, ?, ?, ?, ?, ?, ?)
            on conflict(run_id) do update set
              active_combat_seconds = excluded.active_combat_seconds,
              score = excluded.score,
              level = excluded.level,
              kills = excluded.kills,
              boss_kills = excluded.boss_kills,
              content_version = excluded.content_version,
              warnings_json = excluded.warnings_json
          `,
        )
        .run(
          input.runId,
          input.activeCombatSeconds,
          score,
          input.level,
          input.kills,
          input.bossKills,
          input.contentVersion,
          JSON.stringify(input.warnings),
          completedAt,
        );
      database
        .prepare("update runs set status = 'completed', completed_at = ? where id = ?")
        .run(completedAt, input.runId);
      return { ...input, completedAt, score };
    },

    createRun() {
      const runId = createRunId();
      database
        .prepare(
          `
            insert into runs (id, content_version, status, created_at, completed_at)
            values (?, ?, 'started', ?, null)
          `,
        )
        .run(runId, CONTENT_VERSION, new Date().toISOString());

      return { runId, contentVersion: CONTENT_VERSION };
    },

    getLeaderboard(input) {
      const limit = Math.max(1, Math.min(20, Math.floor(input.limit)));
      return database
        .prepare(
          `
            select
              leaderboard_entries.player_name,
              leaderboard_entries.best_run_id,
              leaderboard_entries.score,
              leaderboard_entries.achieved_at,
              run_summaries.level,
              run_summaries.kills,
              run_summaries.boss_kills
            from leaderboard_entries
            join run_summaries on run_summaries.run_id = leaderboard_entries.best_run_id
            order by leaderboard_entries.score desc, leaderboard_entries.achieved_at asc
            limit ?
          `,
        )
        .all(limit)
        .map(rowToLeaderboardEntry);
    },

    getLeaderboardDetails(input) {
      const normalized = normalizePlayerName(input.playerName).normalized;
      const row = database
        .prepare(
          `
            select
              leaderboard_entries.player_name,
              leaderboard_entries.best_run_id,
              leaderboard_entries.score,
              leaderboard_entries.achieved_at,
              run_summaries.level,
              run_summaries.kills,
              run_summaries.boss_kills
            from leaderboard_entries
            join run_summaries on run_summaries.run_id = leaderboard_entries.best_run_id
            where leaderboard_entries.normalized_player_name = ?
          `,
        )
        .get(normalized);
      if (!row) {
        return undefined;
      }
      const entry = rowToLeaderboardEntry(row);
      const wishcraftRows = database
        .prepare(
          "select awarded_level, wishcraft_json from wishcraft_history where run_id = ? order by awarded_level asc",
        )
        .all(entry.bestRunId) as Array<{ awarded_level: number; wishcraft_json: string }>;
      const bossRows = database
        .prepare("select boss_plan_json from boss_plan_history where run_id = ? and defeated = 1 order by planned_level asc")
        .all(entry.bestRunId) as Array<{ boss_plan_json: string }>;
      return {
        bossHistory: bossRows.flatMap((row) =>
          (JSON.parse(row.boss_plan_json) as BossPlanRecord).bosses.map((boss) => ({ name: boss.name })),
        ),
        entry,
        wishcraftHistory: wishcraftRows.map((row) => ({
          awardedLevel: row.awarded_level,
          name: (JSON.parse(row.wishcraft_json) as Wishcraft).name,
        })),
      };
    },

    getRunAudit(input) {
      assertRunExists(database, input.runId);
      const wishcraftRows = database
        .prepare("select awarded_level, wishcraft_json from wishcraft_history where run_id = ? order by awarded_level asc")
        .all(input.runId) as Array<{ awarded_level: number; wishcraft_json: string }>;
      const bossRows = database
        .prepare("select planned_level, boss_plan_json from boss_plan_history where run_id = ? and defeated = 1")
        .all(input.runId) as Array<{ boss_plan_json: string; planned_level: number }>;
      return {
        defeatedBossCount: bossRows.reduce(
          (sum, row) => sum + (JSON.parse(row.boss_plan_json) as BossPlanRecord).bosses.length,
          0,
        ),
        highestDefeatedBossPlannedLevel: bossRows.reduce(
          (highest, row) => Math.max(highest, row.planned_level),
          0,
        ),
        highestWishcraftLevel: wishcraftRows.reduce(
          (highest, row) => Math.max(highest, row.awarded_level),
          1,
        ),
        loadout: wishcraftRows.map((row) => JSON.parse(row.wishcraft_json) as Wishcraft),
      };
    },

    getRunStatus(input) {
      assertRunExists(database, input.runId);
      const existing = database
        .prepare("select completed_at from run_summaries where run_id = ?")
        .get(input.runId) as { completed_at: string } | undefined;
      return { completed: Boolean(existing) };
    },

    recordBossPlan(input) {
      const run = database.prepare("select id, completed_at from runs where id = ?").get(input.runId) as
        | { completed_at: string | null; id: string }
        | undefined;
      if (!run) {
        throw new RunNotFoundError(input.runId);
      }
      if (run.completed_at) {
        throw new Error("Run is already completed");
      }

      const existing = database
        .prepare(
          "select boss_plan_json from boss_plan_history where run_id = ? and encounter_id = ?",
        )
        .get(input.runId, input.encounterId) as { boss_plan_json: string } | undefined;
      if (existing) {
        if (input.defeated) {
          database
            .prepare("update boss_plan_history set defeated = 1 where run_id = ? and encounter_id = ?")
            .run(input.runId, input.encounterId);
        }
        return JSON.parse(existing.boss_plan_json) as BossPlanRecord;
      }
      if (input.defeated) {
        throw new Error("Cannot mark an unplanned Boss encounter defeated");
      }

      const audit = this.getRunAudit({ runId: input.runId });
      const sequence = nextBossSequence(database, input.runId);
      if (
        input.plan.bossEncounterNumber !== sequence.bossEncounterNumber ||
        input.plan.plannedLevel !== sequence.plannedLevel
      ) {
        throw new InvalidBossPlanError("Boss plan is out of sequence");
      }
      const expectedPlan = createBossEncounterPlan({
        bossEncounterNumber: sequence.bossEncounterNumber,
        loadout: audit.loadout,
        plannedLevel: sequence.plannedLevel,
      });
      if (!bossEncounterPlansEqual(input.plan, expectedPlan)) {
        throw new InvalidBossPlanError("Boss plan does not match server content configuration");
      }

      const record = createBossPlanRecord({
        contentVersion: CONTENT_VERSION,
        encounterId: input.encounterId,
        plan: input.plan,
        runId: input.runId,
      });
      database
        .prepare(
          `
            insert into boss_plan_history (
              run_id,
              encounter_id,
              planned_level,
            encounter_kind,
            boss_plan_json,
            defeated,
            created_at
          )
            values (?, ?, ?, ?, ?, ?, ?)
          `,
        )
        .run(
          input.runId,
          input.encounterId,
          record.plannedLevel,
          record.encounterKind,
          JSON.stringify(record),
          input.defeated ? 1 : 0,
          new Date().toISOString(),
        );

      return record;
    },

    recordWishFulfillment(input) {
      const run = database.prepare("select id, completed_at from runs where id = ?").get(input.runId) as
        | { completed_at: string | null; id: string }
        | undefined;
      if (!run) {
        throw new RunNotFoundError(input.runId);
      }
      if (run.completed_at) {
        throw new Error("Run is already completed");
      }

      const existing = database
        .prepare(
          "select wishcraft_json from wishcraft_history where run_id = ? and awarded_level = ?",
        )
        .get(input.runId, input.level) as { wishcraft_json: string } | undefined;
      if (existing) {
        return JSON.parse(existing.wishcraft_json) as Wishcraft;
      }

      const traceResult = database
        .prepare(
          `
            insert into wish_interpretation_traces (
              run_id,
              awarded_level,
              provider,
              model,
              original_wish,
              loadout_summary,
              trace_json,
              final_wishcraft_json,
              created_at
            )
            values (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
        )
        .run(
          input.runId,
          input.level,
          input.trace.providerConfig.provider,
          input.trace.providerConfig.model,
          input.wish,
          input.loadoutSummary,
          JSON.stringify(input.trace),
          JSON.stringify(input.wishcraft),
          new Date().toISOString(),
        );
      database
        .prepare(
          `
            insert into wishcraft_history (
              run_id,
              awarded_level,
              source_wish,
              loadout_summary,
              wishcraft_json,
              interpretation_trace_id,
              created_at
            )
            values (?, ?, ?, ?, ?, ?, ?)
          `,
        )
        .run(
          input.runId,
          input.level,
          input.wish,
          input.loadoutSummary,
          JSON.stringify(input.wishcraft),
          Number(traceResult.lastInsertRowid),
          new Date().toISOString(),
        );

      return input.wishcraft;
    },

    submitPlayerName(input) {
      const run = database.prepare("select id from runs where id = ?").get(input.runId);
      if (!run) {
        throw new RunNotFoundError(input.runId);
      }
      const summary = database
        .prepare("select run_id, score, level, kills, boss_kills, completed_at from run_summaries where run_id = ?")
        .get(input.runId) as
        | {
            boss_kills: number;
            completed_at: string;
            kills: number;
            level: number;
            run_id: string;
            score: number;
          }
        | undefined;
      if (!summary) {
        throw new Error("Run is not completed");
      }

      const normalized = normalizePlayerName(input.playerName);
      const existing = database
        .prepare("select best_run_id, score, achieved_at from leaderboard_entries where normalized_player_name = ?")
        .get(normalized.normalized) as
        | { achieved_at: string; best_run_id: string; score: number }
        | undefined;
      const shouldReplace =
        !existing ||
        summary.score > existing.score ||
        (summary.score === existing.score && summary.completed_at < existing.achieved_at);
      const displayName = existing ? undefined : normalized.displayName;
      if (shouldReplace) {
        database
          .prepare(
            `
              insert into leaderboard_entries (
                normalized_player_name,
                player_name,
                best_run_id,
                score,
                achieved_at
              )
              values (?, ?, ?, ?, ?)
              on conflict(normalized_player_name) do update set
                player_name = coalesce(leaderboard_entries.player_name, excluded.player_name),
                best_run_id = excluded.best_run_id,
                score = excluded.score,
                achieved_at = excluded.achieved_at
            `,
          )
          .run(
            normalized.normalized,
            displayName ?? normalized.displayName,
            summary.run_id,
            summary.score,
            summary.completed_at,
          );
      }
      const entry = database
        .prepare(
          `
            select
              leaderboard_entries.player_name,
              leaderboard_entries.best_run_id,
              leaderboard_entries.score,
              leaderboard_entries.achieved_at,
              run_summaries.level,
              run_summaries.kills,
              run_summaries.boss_kills
            from leaderboard_entries
            join run_summaries on run_summaries.run_id = leaderboard_entries.best_run_id
            where leaderboard_entries.normalized_player_name = ?
          `,
        )
        .get(normalized.normalized);
      return rowToLeaderboardEntry(entry);
    },

    close() {
      database.close();
    },
  };
}

function createRunId(): string {
  const timePart = Date.now().toString(36);
  const randomPart = randomBytes(6).toString("hex");
  return `run_${timePart}_${randomPart}`;
}

function assertRunExists(database: DatabaseSync, runId: string): void {
  const run = database.prepare("select id from runs where id = ?").get(runId);
  if (!run) {
    throw new RunNotFoundError(runId);
  }
}

function addColumnIfMissing(
  database: DatabaseSync,
  tableName: string,
  columnName: string,
  definition: string,
): void {
  const columns = database.prepare(`pragma table_info(${tableName})`).all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === columnName)) {
    database.exec(`alter table ${tableName} add column ${columnName} ${definition}`);
  }
}

function nextBossSequence(database: DatabaseSync, runId: string): {
  bossEncounterNumber: number;
  plannedLevel: number;
} {
  const row = database
    .prepare(
      `
        select count(*) as count
        from boss_plan_history
        where run_id = ?
      `,
    )
    .get(runId) as { count: number };
  const bossEncounterNumber = row.count + 1;
  return {
    bossEncounterNumber,
    plannedLevel: bossEncounterNumber * 5,
  };
}

function normalizePlayerName(playerName: string): {
  displayName: string;
  normalized: string;
} {
  const displayName = playerName.trim().replace(/\s+/g, " ").slice(0, 24);
  return {
    displayName,
    normalized: displayName.toLocaleLowerCase("en-US"),
  };
}

function rowToLeaderboardEntry(row: unknown): LeaderboardEntry {
  const typed = row as {
    achieved_at: string;
    best_run_id: string;
    boss_kills: number;
    kills: number;
    level: number;
    player_name: string;
    score: number;
  };
  return {
    achievedAt: typed.achieved_at,
    bestRunId: typed.best_run_id,
    bossKills: typed.boss_kills,
    kills: typed.kills,
    level: typed.level,
    playerName: typed.player_name,
    score: typed.score,
  };
}
