import type { BossEncounterPlan } from "../../shared/boss/boss-planning.js";
import type { CreatedRunResponse } from "../../shared/content-version.js";
import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatLoopState } from "../simulation/combat-loop.js";

export type UiLanguage = "zh" | "en";

export interface ArenaMountOptions {
  completeRun?: CompleteRun;
  fetchLeaderboard?: FetchLeaderboard;
  fetchLeaderboardDetails?: FetchLeaderboardDetails;
  fulfillWish?: FulfillWish;
  initialCombatState?: CombatLoopState;
  recordBossPlan?: RecordBossPlan;
  root: Element;
  run: CreatedRunResponse;
  language: UiLanguage;
  submitPlayerName?: SubmitPlayerName;
}

export type FulfillWish = (input: {
  language: UiLanguage;
  level: number;
  loadoutSummary: string;
  runId: string;
  wish: string;
}) => Promise<Wishcraft>;

export interface CompletedRunSummary {
  activeCombatSeconds: number;
  bossKills: number;
  contentVersion: string;
  kills: number;
  level: number;
  runId: string;
  score: number;
  warnings: string[];
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

export type CompleteRun = (
  summary: CompletedRunSummary,
) => Promise<CompletedRunSummary & { completedAt: string }>;
export type FetchLeaderboard = () => Promise<LeaderboardEntry[]>;
export type FetchLeaderboardDetails = (playerName: string) => Promise<LeaderboardDetails>;
export type RecordBossPlan = (input: {
  defeated: boolean;
  encounterId: string;
  plan: BossEncounterPlan;
  runId: string;
}) => Promise<void>;
export type SubmitPlayerName = (input: {
  playerName: string;
  runId: string;
}) => Promise<LeaderboardEntry>;

export interface JoystickDom {
  root: HTMLElement;
  knob: HTMLElement;
}

export interface WishBreakDom {
  input: HTMLInputElement;
  language: UiLanguage;
  loadoutSummary: HTMLElement;
  manifestation: HTMLElement;
  message: HTMLElement;
  resultName: HTMLElement;
  root: HTMLElement;
  submit: HTMLButtonElement;
}

export interface BossWarningDom {
  health: HTMLElement;
  name: HTMLElement;
  root: HTMLElement;
}

export interface SettlementDom {
  input: HTMLInputElement;
  leaderboard: HTMLElement;
  root: HTMLElement;
  submit: HTMLButtonElement;
}

export interface ArenaDom {
  bossWarning: BossWarningDom;
  canvas: HTMLCanvasElement;
  joystick: JoystickDom;
  playerOverlay: HTMLElement;
  screen: HTMLElement;
  settlement: SettlementDom;
  wishBreak: WishBreakDom;
}

export interface ArenaRuntimeOptions {
  bossWarning: BossWarningDom;
  canvas: HTMLCanvasElement;
  completeRun: CompleteRun;
  fetchLeaderboard: FetchLeaderboard;
  fetchLeaderboardDetails: FetchLeaderboardDetails;
  fulfillWish: FulfillWish;
  initialCombatState?: CombatLoopState;
  joystick: JoystickDom;
  playerOverlay: HTMLElement;
  recordBossPlan: RecordBossPlan;
  run: CreatedRunResponse;
  screen: HTMLElement;
  settlement: SettlementDom;
  submitPlayerName: SubmitPlayerName;
  wishBreak: WishBreakDom;
  ownerWindow: Window | null;
}

export interface ArenaClockState {
  combatClockSeconds: number;
}

export interface BossPlanRecordCoordinator {
  byEncounterId: Map<string, Promise<boolean>>;
}

export interface SettlementState {
  completed: boolean;
  phase: "combat" | "leaderboard" | "name-entry" | "submitting" | "summary-failed" | "summary-submitting";
}
