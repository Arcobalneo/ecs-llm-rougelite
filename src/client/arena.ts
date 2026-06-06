import { createArenaDom } from "./arena/dom.js";
import {
  requestBossPlanRecord,
  requestLeaderboard,
  requestLeaderboardDetails,
  requestPlayerNameSubmission,
  requestRunCompletion,
  requestWishFulfillment,
} from "./arena/api-client.js";
import { startArenaRuntime } from "./arena/runtime.js";
import type { ArenaMountOptions } from "./arena/types.js";

export type {
  ArenaMountOptions,
  CompletedRunSummary,
  CompleteRun,
  FetchLeaderboard,
  FetchLeaderboardDetails,
  FulfillWish,
  LeaderboardDetails,
  LeaderboardEntry,
  RecordBossPlan,
  SubmitPlayerName,
  UiLanguage,
} from "./arena/types.js";

export {
  INITIAL_ENEMY_COUNT,
  desiredEnemyCountForBossKills,
} from "./simulation/enemy-spawning.js";
export {
  MAX_FEEDBACK_GRAPHICS_PER_FRAME,
  VISUAL_POLISH_VERSION,
  selectBudgetedFeedback,
  visualCacheKeyForEntity,
} from "./rendering/combat-renderer.js";

export function mountArena(options: ArenaMountOptions): void {
  const ownerDocument = options.root.ownerDocument;
  const ownerWindow = ownerDocument.defaultView;
  options.root.replaceChildren();

  const dom = createArenaDom(ownerDocument, options.language, options.run.contentVersion);
  options.root.append(dom.screen);

  startArenaRuntime({
    bossWarning: dom.bossWarning,
    canvas: dom.canvas,
    completeRun: options.completeRun ?? requestRunCompletion,
    fetchLeaderboard: options.fetchLeaderboard ?? requestLeaderboard,
    fetchLeaderboardDetails: options.fetchLeaderboardDetails ?? requestLeaderboardDetails,
    fulfillWish: options.fulfillWish ?? requestWishFulfillment,
    initialCombatState: options.initialCombatState,
    joystick: dom.joystick,
    playerOverlay: dom.playerOverlay,
    recordBossPlan: options.recordBossPlan ?? requestBossPlanRecord,
    run: options.run,
    screen: dom.screen,
    settlement: dom.settlement,
    submitPlayerName: options.submitPlayerName ?? requestPlayerNameSubmission,
    wishBreak: dom.wishBreak,
    ownerWindow,
  });
}
