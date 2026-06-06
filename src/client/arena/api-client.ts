import type { BossEncounterPlan } from "../../shared/boss/boss-planning.js";
import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type {
  CompletedRunSummary,
  LeaderboardDetails,
  LeaderboardEntry,
  UiLanguage,
} from "./types.js";

export async function requestWishFulfillment(input: {
  language: UiLanguage;
  level: number;
  loadoutSummary: string;
  runId: string;
  wish: string;
}): Promise<Wishcraft> {
  const response = await fetch(`/api/runs/${input.runId}/wish-fulfillments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      language: input.language,
      level: input.level,
      loadoutSummary: input.loadoutSummary,
      wish: input.wish,
    }),
  });
  if (!response.ok) {
    throw new Error(`Wish Fulfillment failed with ${response.status}`);
  }
  const body = (await response.json()) as { wishcraft: Wishcraft };
  return body.wishcraft;
}

export async function requestRunCompletion(
  summary: CompletedRunSummary,
): Promise<CompletedRunSummary & { completedAt: string }> {
  const response = await fetch(`/api/runs/${summary.runId}/completion`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      activeCombatSeconds: summary.activeCombatSeconds,
      bossKills: summary.bossKills,
      contentVersion: summary.contentVersion,
      kills: summary.kills,
      level: summary.level,
      score: summary.score,
      warnings: summary.warnings,
    }),
  });
  if (!response.ok) {
    throw new Error(`Run completion failed with ${response.status}`);
  }
  const body = (await response.json()) as { summary: CompletedRunSummary & { completedAt: string } };
  return body.summary;
}

export async function requestPlayerNameSubmission(input: {
  playerName: string;
  runId: string;
}): Promise<LeaderboardEntry> {
  const response = await fetch(`/api/runs/${input.runId}/player-name`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ playerName: input.playerName }),
  });
  if (!response.ok) {
    throw new Error(`Player Name submission failed with ${response.status}`);
  }
  const body = (await response.json()) as { entry: LeaderboardEntry };
  return body.entry;
}

export async function requestLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await fetch("/api/leaderboard");
  if (!response.ok) {
    throw new Error(`Leaderboard request failed with ${response.status}`);
  }
  const body = (await response.json()) as { entries: LeaderboardEntry[] };
  return body.entries;
}

export async function requestLeaderboardDetails(playerName: string): Promise<LeaderboardDetails> {
  const response = await fetch(`/api/leaderboard/${encodeURIComponent(playerName)}`);
  if (!response.ok) {
    throw new Error(`Leaderboard details request failed with ${response.status}`);
  }
  const body = (await response.json()) as { details: LeaderboardDetails };
  return body.details;
}

export async function requestBossPlanRecord(input: {
  defeated: boolean;
  encounterId: string;
  plan: BossEncounterPlan;
  runId: string;
}): Promise<void> {
  const response = await fetch(`/api/runs/${input.runId}/boss-plans`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      defeated: input.defeated,
      encounterId: input.encounterId,
      plan: input.plan,
    }),
  });
  if (!response.ok) {
    throw new Error(`Boss plan record failed with ${response.status}`);
  }
}
