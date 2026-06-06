import type { CreatedRunResponse } from "../shared/content-version.js";
import type { BossEncounterPlan } from "../shared/boss/boss-planning.js";
import { wishcraftCatalog } from "../shared/wishcraft/catalog.js";
import type { AttachmentSlot, ThemeId } from "../shared/wishcraft/types.js";
import {
  ARENA_BOUNDS,
  PLAYER_COLLISION_RADIUS,
  applyMovement,
  calculateCamera,
  calculateViewport,
  type Point,
} from "./simulation/arena-math.js";
import {
  createCombatLoopState,
  stepCombatLoop,
  type CombatFeedback,
  type CombatLoopEnemy,
  type CombatLoopState,
} from "./simulation/combat-loop.js";
import { getCommonEnemyTemplate } from "./simulation/combat.js";
import {
  normalizeMovement,
  resolveMovementVector,
} from "./simulation/movement.js";
import {
  clearKeyboardState,
  createArenaRuntimeState,
  refreshViewport,
  updateJoystickState,
  updateKeyboardState,
  type ArenaRuntimeState,
} from "./simulation/arena-runtime.js";
import {
  createBossEncounterState,
  queueBossAfterManifestation,
  startBossWarning,
  stepBossEncounterRuntime,
  type BossEncounterState,
} from "./simulation/boss-encounter.js";
import {
  createWishBreakState,
  finishManifestation,
  receiveWishcraft,
  startWishBreak,
  submitWish,
  type WishBreakState,
} from "./simulation/wish-break.js";
import type { Wishcraft } from "../shared/wishcraft/types.js";
import {
  assembleRuntimeVisuals,
  createVisualBudget,
  layoutRuntimeVisualAttachments,
  type RuntimeVisualAssembly,
  type RuntimeVisualAttachment,
  type VisualEntityRole,
} from "./visual/visual-assembly.js";
import {
  advanceArenaPhaseAfterBossCompletion,
  createArenaVisualState,
  enemyDriftFromLoadout,
  phaseTintFromLoadout,
  type ArenaVisualState,
} from "./visual/arena-visual-state.js";

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

export type CompleteRun = (summary: CompletedRunSummary) => Promise<CompletedRunSummary & { completedAt: string }>;
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

type PixiContainer = import("pixi.js").Container;
type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export const MAX_FEEDBACK_GRAPHICS_PER_FRAME = 80;
export const INITIAL_ENEMY_COUNT = 36;

interface CombatRenderCache {
  bossIds: string;
  bosses: PixiGraphics[];
  enemies: Map<string, PixiGraphics>;
  playerAttachmentIds: string;
  playerAttachments: PixiGraphics[];
  screenEffectIds: string;
  screenEffects: PixiGraphics[];
  summons: Map<string, PixiGraphics>;
  xpShards: Map<string, PixiGraphics>;
  feedback: PixiGraphics[];
}

export function mountArena(options: ArenaMountOptions): void {
  const ownerDocument = options.root.ownerDocument;
  const ownerWindow = ownerDocument.defaultView;
  options.root.replaceChildren();

  const screen = ownerDocument.createElement("section");
  screen.dataset.screen = "arena";
  screen.className = "arena-screen";

  const canvas = ownerDocument.createElement("canvas");
  canvas.dataset.combatCanvas = "true";
  canvas.dataset.runContentVersion = options.run.contentVersion;
  canvas.width = 960;
  canvas.height = 540;
  canvas.className = "combat-canvas";

  const hud = ownerDocument.createElement("div");
  hud.dataset.domHud = "true";
  hud.className = "arena-hud";
  hud.innerHTML = `
    <div class="xp-bar" aria-label="${options.language === "zh" ? "经验" : "XP"}">
      <span class="xp-fill"></span>
    </div>
    <div class="run-chip" data-hud-level>Lv.001</div>
    <div class="run-chip" data-score>Score 0</div>
  `;

  const playerOverlay = ownerDocument.createElement("div");
  playerOverlay.dataset.playerMech = "true";
  playerOverlay.className = "player-mech-overlay";

  const levelLabel = ownerDocument.createElement("div");
  levelLabel.dataset.playerLevel = "true";
  levelLabel.className = "player-level";
  levelLabel.textContent = "Lv.001";

  const healthBar = ownerDocument.createElement("div");
  healthBar.dataset.playerHealth = "true";
  healthBar.className = "player-health";
  healthBar.innerHTML = "<span></span>";

  playerOverlay.append(levelLabel, healthBar);

  const joystick = createJoystick(ownerDocument);
  const wishBreak = createWishBreakDom(ownerDocument, options.language);
  const bossWarning = createBossWarningDom(ownerDocument);
  const settlement = createSettlementDom(ownerDocument, options.language);

  screen.append(canvas, hud, playerOverlay, joystick.root, wishBreak.root, wishBreak.manifestation, bossWarning.root, settlement.root);
  options.root.append(screen);
  startArenaRuntime({
    bossWarning,
    canvas,
    completeRun: options.completeRun ?? requestRunCompletion,
    fetchLeaderboard: options.fetchLeaderboard ?? requestLeaderboard,
    fetchLeaderboardDetails: options.fetchLeaderboardDetails ?? requestLeaderboardDetails,
    fulfillWish: options.fulfillWish ?? requestMockWishFulfillment,
    initialCombatState: options.initialCombatState,
    joystick,
    playerOverlay,
    recordBossPlan: options.recordBossPlan ?? requestBossPlanRecord,
    run: options.run,
    screen,
    settlement,
    submitPlayerName: options.submitPlayerName ?? requestPlayerNameSubmission,
    wishBreak,
    ownerWindow,
  });
}

interface JoystickDom {
  root: HTMLElement;
  knob: HTMLElement;
}

interface WishBreakDom {
  input: HTMLInputElement;
  language: UiLanguage;
  loadoutSummary: HTMLElement;
  manifestation: HTMLElement;
  message: HTMLElement;
  resultName: HTMLElement;
  root: HTMLElement;
  submit: HTMLButtonElement;
}

interface BossWarningDom {
  health: HTMLElement;
  name: HTMLElement;
  root: HTMLElement;
}

interface SettlementDom {
  input: HTMLInputElement;
  leaderboard: HTMLElement;
  root: HTMLElement;
  submit: HTMLButtonElement;
}

interface ArenaRuntimeOptions {
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

interface ArenaClockState {
  combatClockSeconds: number;
}

interface BossPlanRecordCoordinator {
  byEncounterId: Map<string, Promise<boolean>>;
}

interface SettlementState {
  completed: boolean;
  phase: "combat" | "leaderboard" | "name-entry" | "submitting" | "summary-failed" | "summary-submitting";
}

function createJoystick(ownerDocument: Document): JoystickDom {
  const root = ownerDocument.createElement("div");
  root.dataset.joystick = "true";
  root.className = "movement-joystick";
  root.setAttribute("role", "presentation");

  const knob = ownerDocument.createElement("div");
  knob.dataset.joystickKnob = "true";
  knob.className = "movement-joystick-knob";
  root.append(knob);

  return { root, knob };
}

function createWishBreakDom(ownerDocument: Document, language: UiLanguage): WishBreakDom {
  const root = ownerDocument.createElement("section");
  root.dataset.wishBreak = "true";
  root.dataset.phase = "hidden";
  root.className = "wish-break";
  root.hidden = true;

  const title = ownerDocument.createElement("h2");
  title.textContent = language === "zh" ? "银河魔装机神" : "Galactic Arsenal Deity";

  const message = ownerDocument.createElement("p");
  message.dataset.wishMessage = "true";

  const input = ownerDocument.createElement("input");
  input.dataset.wishInput = "true";
  input.autocomplete = "off";
  input.maxLength = 160;
  input.placeholder =
    language === "zh"
      ? "例如：龙息环绕我，黑洞伴飞，霓虹音浪"
      : "Try: dragon breath, black-hole orbiters, neon soundwaves";

  const submit = ownerDocument.createElement("button");
  submit.dataset.wishSubmit = "true";
  submit.type = "button";
  submit.disabled = true;
  submit.textContent = language === "zh" ? "许愿" : "Wish";

  const resultName = ownerDocument.createElement("p");
  resultName.dataset.wishResultName = "true";
  resultName.className = "wish-result-name";

  const loadoutSummary = ownerDocument.createElement("p");
  loadoutSummary.dataset.loadoutSummary = "true";
  loadoutSummary.className = "loadout-summary";

  const manifestation = ownerDocument.createElement("div");
  manifestation.dataset.wishManifestation = "true";
  manifestation.className = "wish-manifestation";
  manifestation.hidden = true;

  root.append(title, message, input, submit, resultName, loadoutSummary);
  return { input, language, loadoutSummary, manifestation, message, resultName, root, submit };
}

function createBossWarningDom(ownerDocument: Document): BossWarningDom {
  const root = ownerDocument.createElement("section");
  root.dataset.bossWarning = "true";
  root.dataset.phase = "hidden";
  root.className = "boss-warning";
  root.hidden = true;

  const name = ownerDocument.createElement("h2");
  name.dataset.bossName = "true";

  const health = ownerDocument.createElement("div");
  health.dataset.bossHealth = "true";
  health.className = "boss-health";
  health.innerHTML = "<span></span>";

  root.append(name, health);
  return { health, name, root };
}

function createSettlementDom(ownerDocument: Document, language: UiLanguage): SettlementDom {
  const root = ownerDocument.createElement("section");
  root.dataset.settlement = "true";
  root.dataset.phase = "combat";
  root.className = "settlement";
  root.hidden = true;

  const input = ownerDocument.createElement("input");
  input.dataset.playerNameInput = "true";
  input.maxLength = 24;
  input.placeholder = language === "zh" ? "输入你的名字" : "Enter your name";

  const submit = ownerDocument.createElement("button");
  submit.dataset.playerNameSubmit = "true";
  submit.type = "button";
  submit.disabled = true;
  submit.textContent = language === "zh" ? "提交排名" : "Submit";

  const leaderboard = ownerDocument.createElement("div");
  leaderboard.dataset.leaderboard = "true";

  root.append(input, submit, leaderboard);
  return { input, leaderboard, root, submit };
}

function startArenaRuntime(options: ArenaRuntimeOptions): void {
  const state = createArenaRuntimeState({
    now: 0,
    viewport: calculateViewport({
      width: options.screen.clientWidth || options.canvas.width,
      height: options.screen.clientHeight || options.canvas.height,
    }),
  });
  const combatState =
    options.initialCombatState ??
    createCombatLoopState({
      player: state.position,
      enemies: createInitialEnemies(state.position),
    });
  const wishState = createWishBreakState();
  const bossState = createBossEncounterState();
  const arenaVisualState = createArenaVisualState();
  const settlementState: SettlementState = { completed: false, phase: "combat" };
  const clockState: ArenaClockState = { combatClockSeconds: combatState.activeCombatSeconds };
  const bossPlanRecords: BossPlanRecordCoordinator = { byEncounterId: new Map() };

  bindKeyboard(options.ownerWindow, state);
  bindViewportRefresh(options, state);
  bindJoystick(options, state);
  bindSettlement({
    fetchLeaderboard: options.fetchLeaderboard,
    fetchLeaderboardDetails: options.fetchLeaderboardDetails,
    run: options.run,
    settlement: options.settlement,
    settlementState,
    submitPlayerName: options.submitPlayerName,
  });
  bindWishBreak({
    clockState,
    combatState,
    fulfillWish: options.fulfillWish,
    bossState,
    bossWarning: options.bossWarning,
    bossPlanRecords,
    recordBossPlan: options.recordBossPlan,
    run: options.run,
    screen: options.screen,
    wishBreak: options.wishBreak,
    wishState,
  });
  processLevelUpFeedback(combatState, wishState);
  updateArenaVisualDataset(options.screen, arenaVisualState, combatState.wishcraftLoadout);
  updateOverlayPosition(options.playerOverlay, state, combatState);
  updateHud(options.screen, combatState);
  renderWishBreak(options.screen, options.wishBreak, wishState);
  renderBossWarning(options.screen, options.bossWarning, bossState);
  processSettlement({
    combatState,
    completeRun: options.completeRun,
    run: options.run,
    screen: options.screen,
    settlement: options.settlement,
    settlementState,
  });
  void bootPixiArena(options.canvas, options.screen, state, combatState, bossState, arenaVisualState);

  if (typeof options.ownerWindow?.requestAnimationFrame !== "function") {
    return;
  }

  const tick = (timestamp: number) => {
    const deltaSeconds =
      state.lastTimestamp === 0 ? 0 : Math.min(0.05, (timestamp - state.lastTimestamp) / 1000);
    state.lastTimestamp = timestamp;
    const runEnded = settlementState.completed;
    if (!runEnded && !wishState.combatPaused && !bossState.combatPaused) {
      stepArena(state, deltaSeconds);
      combatState.player.position = state.position;
      clockState.combatClockSeconds += deltaSeconds;
      const steppedCombat = stepCombatLoop(combatState, {
        deltaSeconds,
        nowSeconds: clockState.combatClockSeconds,
      });
      Object.assign(combatState, steppedCombat);
      spawnReplacementEnemies(combatState, state.position);
      processLevelUpFeedback(combatState, wishState, bossState);
    }
    if (!runEnded) {
      const previousBossPhase = bossState.phase;
      const steppedBoss = stepBossEncounterRuntime({
        bossState,
        combat: combatState,
        deltaSeconds,
        playerPosition: state.position,
      });
      Object.assign(bossState, steppedBoss.bossState);
      Object.assign(combatState, steppedBoss.combat);
      if (previousBossPhase !== "victory" && bossState.phase === "victory" && bossState.completedPlan) {
        queueBossPlanRecord(bossPlanRecords, options.recordBossPlan, {
          defeated: true,
          encounterId: createBossEncounterId(options.run.runId, bossState.completedPlan),
          plan: bossState.completedPlan,
          runId: options.run.runId,
        });
        const queuedLevelUps = bossState.queuedLevelUps.splice(0);
        for (const queuedLevel of queuedLevelUps) {
          Object.assign(wishState, startWishBreak(wishState, { level: queuedLevel }));
        }
      }
      if (bossState.phase === "victory" && bossState.advanceArenaPhase) {
        Object.assign(arenaVisualState, advanceArenaPhaseAfterBossCompletion(arenaVisualState, { doubleBoss: true }));
        bossState.advanceArenaPhase = false;
      }
    }
    updateArenaVisualDataset(options.screen, arenaVisualState, combatState.wishcraftLoadout);
    updateOverlayPosition(options.playerOverlay, state, combatState);
    updateHud(options.screen, combatState);
    renderWishBreak(options.screen, options.wishBreak, wishState);
    renderBossWarning(options.screen, options.bossWarning, bossState);
    processSettlement({
      combatState,
      completeRun: options.completeRun,
      run: options.run,
      screen: options.screen,
      settlement: options.settlement,
      settlementState,
    });
    options.ownerWindow?.requestAnimationFrame(tick);
  };

  options.ownerWindow.requestAnimationFrame(tick);
}

function bindWishBreak(options: {
  bossState: BossEncounterState;
  bossWarning: BossWarningDom;
  bossPlanRecords: BossPlanRecordCoordinator;
  clockState: ArenaClockState;
  combatState: CombatLoopState;
  fulfillWish: FulfillWish;
  recordBossPlan: RecordBossPlan;
  run: CreatedRunResponse;
  screen: HTMLElement;
  wishBreak: WishBreakDom;
  wishState: WishBreakState;
}): void {
  options.wishBreak.input.addEventListener("input", () => {
    options.wishBreak.submit.disabled =
      options.wishState.phase !== "wish-break" || options.wishBreak.input.value.trim().length === 0;
  });
  options.wishBreak.submit.addEventListener("click", () => {
    const submitted = submitWish(options.wishState, options.wishBreak.input.value);
    Object.assign(options.wishState, submitted.state);
    renderWishBreak(options.screen, options.wishBreak, options.wishState);
    if (!submitted.accepted || options.wishState.currentLevel === undefined) {
      return;
    }

    void options
      .fulfillWish({
        level: options.wishState.currentLevel,
        language: options.wishBreak.language,
        loadoutSummary: options.wishState.loadoutSummary,
        runId: options.run.runId,
        wish: options.wishState.inFlightWish ?? "",
      })
      .then((wishcraft) => {
        const previousLoadoutIds = new Set(options.combatState.wishcraftLoadout.map((craft) => craft.id));
        Object.assign(options.wishState, receiveWishcraft(options.wishState, wishcraft));
        options.combatState.wishcraftLoadout = [...options.wishState.loadout];
        delayNewWishcraftFirstFire(options.combatState, previousLoadoutIds, options.clockState);
        renderWishBreak(options.screen, options.wishBreak, options.wishState);
        scheduleManifestationFinish(options);
      })
      .catch((error) => {
        console.error("Wish Fulfillment request failed before the server could record a Wishcraft", error);
        Object.assign(options.wishState, {
          ...options.wishState,
          combatPaused: true,
          inFlightWish: undefined,
          phase: "wish-break" as const,
        });
        renderWishBreak(options.screen, options.wishBreak, options.wishState);
      });
  });
}

function bindSettlement(options: {
  fetchLeaderboard: FetchLeaderboard;
  fetchLeaderboardDetails: FetchLeaderboardDetails;
  run: CreatedRunResponse;
  settlement: SettlementDom;
  settlementState: SettlementState;
  submitPlayerName: SubmitPlayerName;
}): void {
  options.settlement.input.addEventListener("input", () => {
    options.settlement.submit.disabled =
      options.settlementState.phase !== "name-entry" ||
      options.settlement.input.value.trim().length === 0;
  });
  options.settlement.submit.addEventListener("click", () => {
    if (options.settlementState.phase !== "name-entry") {
      return;
    }
    options.settlementState.phase = "submitting";
    renderSettlement(options.settlement, options.settlementState);
    void options
      .submitPlayerName({
        playerName: options.settlement.input.value,
        runId: options.run.runId,
      })
      .then(async () => {
        const entries = await options.fetchLeaderboard();
        options.settlementState.phase = "leaderboard";
        renderLeaderboard(options.settlement, entries, options.fetchLeaderboardDetails);
        renderSettlement(options.settlement, options.settlementState);
      });
  });
}

function processSettlement(options: {
  combatState: CombatLoopState;
  completeRun: CompleteRun;
  run: CreatedRunResponse;
  screen: HTMLElement;
  settlement: SettlementDom;
  settlementState: SettlementState;
}): void {
  if (options.settlementState.completed) {
    if (options.settlementState.phase !== "combat") {
      options.screen.dataset.combatPaused = "true";
    }
    return;
  }
  if (options.combatState.player.vitals.health > 0) {
    return;
  }
  options.settlementState.completed = true;
  options.settlementState.phase = "summary-submitting";
  options.screen.dataset.combatPaused = "true";
  renderSettlement(options.settlement, options.settlementState);
  void options.completeRun({
    activeCombatSeconds: options.combatState.activeCombatSeconds,
    bossKills: options.combatState.bossKills,
    contentVersion: options.run.contentVersion,
    kills: options.combatState.kills,
    level: options.combatState.levelState.level,
    runId: options.run.runId,
    score: options.combatState.score,
    warnings: [],
  })
    .then(() => {
      if (options.settlementState.phase !== "summary-submitting") {
        return;
      }
      options.settlementState.phase = "name-entry";
      renderSettlement(options.settlement, options.settlementState);
    })
    .catch((error) => {
      console.error("Failed to complete Run before Player Name attribution", error);
      options.settlementState.phase = "summary-failed";
      renderSettlement(options.settlement, options.settlementState);
    });
}

function renderSettlement(dom: SettlementDom, state: SettlementState): void {
  dom.root.hidden = state.phase === "combat";
  dom.root.dataset.phase = state.phase;
  dom.input.disabled = state.phase !== "name-entry";
  dom.submit.disabled = state.phase !== "name-entry" || dom.input.value.trim().length === 0;
}

function renderLeaderboard(
  dom: SettlementDom,
  entries: readonly LeaderboardEntry[],
  fetchDetails: FetchLeaderboardDetails,
): void {
  dom.leaderboard.replaceChildren();
  const list = dom.root.ownerDocument.createElement("ol");
  for (const entry of entries.slice(0, 20)) {
    const item = dom.root.ownerDocument.createElement("li");
    const button = dom.root.ownerDocument.createElement("button");
    button.type = "button";
    button.dataset.leaderboardDetail = "true";
    button.textContent = `${entry.playerName} ${entry.score}`;
    button.addEventListener("click", () => {
      renderLeaderboardDetails(dom, { phase: "loading", playerName: entry.playerName });
      void fetchDetails(entry.playerName)
        .then((details) => {
          renderLeaderboardDetails(dom, { details, phase: "loaded" });
        })
        .catch(() => {
          renderLeaderboardDetails(dom, { phase: "failed", playerName: entry.playerName });
        });
    });
    item.append(button);
    list.append(item);
  }
  dom.leaderboard.append(list);
}

type LeaderboardDetailsRenderState =
  | { phase: "failed"; playerName: string }
  | { phase: "loaded"; details: LeaderboardDetails }
  | { phase: "loading"; playerName: string };

function renderLeaderboardDetails(dom: SettlementDom, state: LeaderboardDetailsRenderState): void {
  let detailRoot = dom.leaderboard.querySelector<HTMLElement>("[data-leaderboard-details]");
  if (!detailRoot) {
    detailRoot = dom.root.ownerDocument.createElement("section");
    detailRoot.dataset.leaderboardDetails = "true";
    detailRoot.className = "leaderboard-details";
    dom.leaderboard.append(detailRoot);
  }
  detailRoot.replaceChildren();
  if (state.phase === "loading") {
    detailRoot.textContent = state.playerName;
    return;
  }
  if (state.phase === "failed") {
    detailRoot.textContent = state.playerName;
    return;
  }

  const craftList = dom.root.ownerDocument.createElement("ol");
  craftList.dataset.leaderboardCrafts = "true";
  for (const craft of state.details.wishcraftHistory) {
    const item = dom.root.ownerDocument.createElement("li");
    item.textContent = `Lv.${craft.awardedLevel.toString().padStart(3, "0")} ${craft.name.cn} / ${craft.name.en}`;
    craftList.append(item);
  }

  const bossList = dom.root.ownerDocument.createElement("ol");
  bossList.dataset.leaderboardBosses = "true";
  for (const boss of state.details.bossHistory) {
    const item = dom.root.ownerDocument.createElement("li");
    item.textContent = boss.name;
    bossList.append(item);
  }

  detailRoot.append(craftList, bossList);
}

function delayNewWishcraftFirstFire(
  combatState: CombatLoopState,
  previousLoadoutIds: ReadonlySet<string>,
  clockState: ArenaClockState,
): void {
  for (const wishcraft of combatState.wishcraftLoadout) {
    if (previousLoadoutIds.has(wishcraft.id)) {
      continue;
    }
    combatState.wishcraftRuntime.nextFireAtSecondsByCraftId[wishcraft.id] =
      clockState.combatClockSeconds + 0.25;
  }
}

function scheduleManifestationFinish(options: {
  bossState: BossEncounterState;
  bossWarning: BossWarningDom;
  bossPlanRecords: BossPlanRecordCoordinator;
  combatState: CombatLoopState;
  recordBossPlan: RecordBossPlan;
  run: CreatedRunResponse;
  screen: HTMLElement;
  wishBreak: WishBreakDom;
  wishState: WishBreakState;
}): void {
  options.screen.ownerDocument.defaultView?.setTimeout(() => {
    if (options.wishState.phase !== "manifestation") {
      return;
    }
    const manifestedLevel = options.wishState.currentLevel;
    Object.assign(options.wishState, finishManifestation(options.wishState));
    if (manifestedLevel !== undefined) {
      Object.assign(
        options.bossState,
        queueBossAfterManifestation(options.bossState, {
          currentLevel: manifestedLevel,
          manifestationFinished: true,
          loadout: options.combatState.wishcraftLoadout,
        }),
      );
      if (options.bossState.phase === "queued-warning" && options.bossState.pendingPlan) {
        Object.assign(options.bossState, startBossWarning(options.bossState, options.bossState.pendingPlan));
        queueBossPlanRecord(options.bossPlanRecords, options.recordBossPlan, {
          defeated: false,
          encounterId: createBossEncounterId(options.run.runId, options.bossState.pendingPlan),
          plan: options.bossState.pendingPlan,
          runId: options.run.runId,
        });
      }
    }
    options.wishBreak.input.value = "";
    renderBossWarning(options.screen, options.bossWarning, options.bossState);
    renderWishBreak(options.screen, options.wishBreak, options.wishState);
  }, 800);
}

function queueBossPlanRecord(
  coordinator: BossPlanRecordCoordinator,
  recordBossPlan: RecordBossPlan,
  input: Parameters<RecordBossPlan>[0],
): void {
  const previous = coordinator.byEncounterId.get(input.encounterId) ?? Promise.resolve(true);
  const next = previous.then(async (previousSucceeded) => {
    if (!previousSucceeded) {
      return false;
    }
    try {
      await recordBossPlan(input);
      return true;
    } catch (error) {
      console.error("Boss plan record failed", error);
      return false;
    }
  });
  coordinator.byEncounterId.set(input.encounterId, next);
}

function processLevelUpFeedback(
  combatState: CombatLoopState,
  wishState: WishBreakState,
  bossState?: BossEncounterState,
): void {
  const levelUps = combatState.feedback.filter((event) => event.kind === "level-up");
  for (const event of levelUps) {
    if (event.kind === "level-up") {
      if (bossState?.phase === "active") {
        if (!bossState.queuedLevelUps.includes(event.level)) {
          bossState.queuedLevelUps.push(event.level);
        }
        continue;
      }
      Object.assign(wishState, startWishBreak(wishState, { level: event.level }));
    }
  }
}

function renderWishBreak(
  screen: HTMLElement,
  dom: WishBreakDom,
  state: WishBreakState,
): void {
  screen.dataset.combatPaused = String(state.combatPaused);
  dom.root.hidden = state.phase === "combat";
  dom.root.dataset.phase = state.phase;
  dom.loadoutSummary.textContent = state.loadoutSummary;
  dom.input.disabled = state.phase !== "wish-break";
  dom.submit.disabled = state.phase !== "wish-break" || dom.input.value.trim().length === 0;
  const latest = state.loadout.at(-1);
  dom.manifestation.hidden = state.phase !== "manifestation";
  dom.manifestation.dataset.themeId =
    state.phase === "manifestation" && latest ? latest.primaryThemeId : "";
  dom.manifestation.dataset.wishcraftId =
    state.phase === "manifestation" && latest ? latest.id : "";

  if (state.phase === "wish-break") {
    dom.message.textContent =
      dom.language === "zh" ? "你想要什么能力？" : "What power do you want?";
    dom.resultName.textContent = "";
    return;
  }
  if (state.phase === "wish-fulfillment") {
    dom.message.textContent = dom.language === "zh" ? "愿望兑现中" : "Wish being fulfilled";
    dom.resultName.textContent = "";
    return;
  }
  if (state.phase === "manifestation") {
    dom.message.textContent =
      dom.language === "zh" ? "Wishcraft 显现" : "Wishcraft Manifestation";
    dom.resultName.textContent = latest ? `${latest.name.cn} / ${latest.name.en}` : "";
    return;
  }
  dom.message.textContent = "";
  dom.resultName.textContent = "";
}

function renderBossWarning(
  screen: HTMLElement,
  dom: BossWarningDom,
  state: BossEncounterState,
): void {
  const plan = state.pendingPlan;
  dom.root.hidden = state.phase !== "warning" && state.phase !== "active";
  dom.root.dataset.phase = state.phase;
  dom.root.classList.toggle("boss-active-hud", state.phase === "active");
  dom.name.textContent = plan?.bosses.map((boss) => boss.name).join(" / ") ?? "";
  const healthPercent = `${Math.round((state.phase === "warning" ? 1 : state.healthProgress) * 100)}%`;
  dom.health.style.setProperty("--boss-health", healthPercent);
  dom.health.querySelector("span")?.setAttribute("style", `width: ${healthPercent}`);
  if (state.combatPaused) {
    screen.dataset.combatPaused = "true";
  }
}

async function requestMockWishFulfillment(input: {
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

async function requestRunCompletion(summary: CompletedRunSummary): Promise<CompletedRunSummary & { completedAt: string }> {
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

async function requestPlayerNameSubmission(input: {
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

async function requestLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await fetch("/api/leaderboard");
  if (!response.ok) {
    throw new Error(`Leaderboard request failed with ${response.status}`);
  }
  const body = (await response.json()) as { entries: LeaderboardEntry[] };
  return body.entries;
}

async function requestLeaderboardDetails(playerName: string): Promise<LeaderboardDetails> {
  const response = await fetch(`/api/leaderboard/${encodeURIComponent(playerName)}`);
  if (!response.ok) {
    throw new Error(`Leaderboard details request failed with ${response.status}`);
  }
  const body = (await response.json()) as { details: LeaderboardDetails };
  return body.details;
}

async function requestBossPlanRecord(input: {
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

function createBossEncounterId(runId: string, plan: BossEncounterPlan): string {
  return `${runId}-boss-${plan.bossEncounterNumber}-level-${plan.plannedLevel}`;
}

function bindKeyboard(ownerWindow: Window | null, state: ArenaRuntimeState): void {
  ownerWindow?.addEventListener("keydown", (event) => {
    if (!isMovementKey(event.code)) {
      return;
    }
    event.preventDefault();
    updateKeyboardState(state, {
      code: event.code,
      isDown: true,
      repeat: event.repeat,
      now: performance.now(),
    });
  });
  ownerWindow?.addEventListener("keyup", (event) => {
    if (!isMovementKey(event.code)) {
      return;
    }
    event.preventDefault();
    updateKeyboardState(state, {
      code: event.code,
      isDown: false,
      repeat: false,
      now: performance.now(),
    });
  });
  ownerWindow?.addEventListener("blur", () => {
    clearKeyboardState(state, performance.now());
  });
}

function bindViewportRefresh(options: ArenaRuntimeOptions, state: ArenaRuntimeState): void {
  const resizeWindow = options.ownerWindow as
    | (Window & { ResizeObserver?: typeof ResizeObserver })
    | null;
  const refresh = () => {
    refreshViewport(state, {
      width: options.screen.clientWidth || options.canvas.width,
      height: options.screen.clientHeight || options.canvas.height,
    });
    updateOverlayPosition(options.playerOverlay, state);
  };
  options.ownerWindow?.addEventListener("resize", refresh);
  options.ownerWindow?.visualViewport?.addEventListener("resize", refresh);
  if (typeof resizeWindow?.ResizeObserver === "function") {
    const resizeObserver = new resizeWindow.ResizeObserver(refresh);
    resizeObserver.observe(options.screen);
  }
  options.ownerWindow?.document.addEventListener("visibilitychange", () => {
    if (options.ownerWindow?.document.visibilityState === "hidden") {
      clearKeyboardState(state, performance.now());
    }
  });
}

function bindJoystick(options: ArenaRuntimeOptions, state: ArenaRuntimeState): void {
  let pointerId: number | undefined;
  const joystickRadius = 54;

  options.joystick.root.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    options.joystick.root.setPointerCapture(event.pointerId);
    updateJoystickFromPointer(event);
  });
  options.joystick.root.addEventListener("pointermove", (event) => {
    if (pointerId === event.pointerId) {
      updateJoystickFromPointer(event);
    }
  });
  options.joystick.root.addEventListener("pointerup", releaseJoystick);
  options.joystick.root.addEventListener("pointercancel", releaseJoystick);

  function updateJoystickFromPointer(event: PointerEvent): void {
    const rect = options.joystick.root.getBoundingClientRect();
    const raw = {
      x: event.clientX - (rect.left + rect.width / 2),
      y: event.clientY - (rect.top + rect.height / 2),
    };
    const length = Math.hypot(raw.x, raw.y);
    const capped = length > joystickRadius ? joystickRadius / length : 1;
    const visual = { x: raw.x * capped, y: raw.y * capped };
    options.joystick.knob.style.transform = `translate(${visual.x}px, ${visual.y}px)`;
    updateJoystickState(state, {
      now: performance.now(),
      vector: normalizeMovement(raw.x / joystickRadius, raw.y / joystickRadius),
    });
  }

  function releaseJoystick(event: PointerEvent): void {
    if (pointerId !== event.pointerId) {
      return;
    }
    pointerId = undefined;
    options.joystick.knob.style.transform = "translate(0, 0)";
    updateJoystickState(state, { now: performance.now(), vector: normalizeMovement(0, 0) });
  }
}

function isMovementKey(code: string): boolean {
  return [
    "KeyA",
    "KeyD",
    "KeyS",
    "KeyW",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
  ].includes(code);
}

function stepArena(state: ArenaRuntimeState, deltaSeconds: number): void {
  const movement = resolveMovementVector(state.input);
  const result = applyMovement({
    position: state.position,
    movement,
    deltaSeconds,
  });
  state.position = result.position;
}

function updateOverlayPosition(
  playerOverlay: HTMLElement,
  state: ArenaRuntimeState,
  combatState?: CombatLoopState,
): void {
  const camera = calculateCamera({ player: state.position, viewport: state.viewport });
  const screenX = (state.position.x - camera.x) * state.viewport.scale;
  const screenY = (state.position.y - camera.y) * state.viewport.scale;
  playerOverlay.dataset.playerWorldX = state.position.x.toFixed(2);
  playerOverlay.dataset.playerWorldY = state.position.y.toFixed(2);
  playerOverlay.dataset.cameraX = camera.x.toFixed(2);
  playerOverlay.dataset.cameraY = camera.y.toFixed(2);
  playerOverlay.dataset.viewportWidth = state.viewport.visibleWorldWidth.toFixed(2);
  playerOverlay.dataset.viewportHeight = state.viewport.visibleWorldHeight.toFixed(2);
  if (combatState) {
    const healthPercent = Math.max(
      0,
      Math.min(100, (combatState.player.vitals.health / combatState.player.vitals.maxHealth) * 100),
    );
    playerOverlay.style.setProperty("--player-health", `${healthPercent}%`);
    playerOverlay.dataset.health = combatState.player.vitals.health.toFixed(0);
    playerOverlay.dataset.maxHealth = combatState.player.vitals.maxHealth.toFixed(0);
    const levelLabel = playerOverlay.querySelector("[data-player-level]");
    if (levelLabel) {
      levelLabel.textContent = `Lv.${combatState.levelState.level.toString().padStart(3, "0")}`;
    }
    const visuals = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "player",
      loadout: combatState.wishcraftLoadout,
      budget: createVisualBudget("player"),
    });
    playerOverlay.dataset.visualAttachments = visuals.attachments
      .map((attachment) => attachment.visualPieceId)
      .join(",");
    playerOverlay.dataset.visualWarnings = visuals.warnings
      .map((warning) => warning.code)
      .join(",");
    playerOverlay.dataset.visualWarningReport = JSON.stringify(visuals.warnings);
  }
  playerOverlay.style.transform = `translate(${screenX}px, ${screenY}px)`;
}

async function bootPixiArena(
  canvas: HTMLCanvasElement,
  screen: HTMLElement,
  state: ArenaRuntimeState,
  combatState: CombatLoopState,
  bossState: BossEncounterState,
  visualState: ArenaVisualState,
): Promise<void> {
  if (!isRealBrowserCanvas(canvas)) {
    screen.dataset.pixiStatus = "skipped";
    return;
  }

  try {
    const { Application, Container, Graphics } = await import("pixi.js");
    const app = new Application();
    await app.init({
      canvas,
      resizeTo: screen,
      backgroundAlpha: 0,
      antialias: false,
      preference: "webgl",
    });

    const stage = new Container();
    const horizon = new Graphics();
    const player = createPlayerMech(Graphics);
    const screenEffectLayer = new Container();
    const xpLayer = new Container();
    const enemyLayer = new Container();
    const summonLayer = new Container();
    const playerAttachmentLayer = new Container();
    const feedbackLayer = new Container();
    const renderCache: CombatRenderCache = {
      enemies: new Map(),
      bossIds: "",
      bosses: [],
      playerAttachmentIds: "",
      playerAttachments: [],
      screenEffectIds: "",
      screenEffects: [],
      summons: new Map(),
      xpShards: new Map(),
      feedback: [],
    };
    stage.addChild(
      horizon,
      screenEffectLayer,
      xpLayer,
      enemyLayer,
      summonLayer,
      playerAttachmentLayer,
      player,
      feedbackLayer,
    );
    app.stage.addChild(stage);
    screen.dataset.pixiStatus = "ready";
    app.ticker.add(() => {
      const camera = calculateCamera({ player: state.position, viewport: state.viewport });
      stage.position.set(-camera.x * state.viewport.scale, -camera.y * state.viewport.scale);
      stage.scale.set(state.viewport.scale);
      player.position.set(state.position.x, state.position.y);
      renderCombatGraphics({
        bossState,
        combatState,
        enemyLayer,
        feedbackLayer,
        Graphics,
        horizon,
        playerAttachmentLayer,
        renderCache,
        screen,
        screenEffectLayer,
        summonLayer,
        visualState,
        xpLayer,
      });
    });
  } catch (error) {
    screen.dataset.pixiStatus = "failed";
    console.error("Failed to initialize Pixi Arena", error);
  }
}

function isRealBrowserCanvas(canvas: HTMLCanvasElement): boolean {
  const userAgent = canvas.ownerDocument.defaultView?.navigator.userAgent ?? "";
  return typeof canvas.getContext === "function" && !userAgent.includes("jsdom");
}

function createInitialEnemies(player: Point): CombatLoopEnemy[] {
  return Array.from({ length: INITIAL_ENEMY_COUNT }, (_, index) =>
    createEnemy(`enemy-initial-${index}`, enemyTemplateForSpawnIndex(index), enemySpawnPosition(player, index, 280)),
  );
}

function spawnReplacementEnemies(combatState: CombatLoopState, player: Point): void {
  const desiredEnemyCount = desiredEnemyCountForBossKills(combatState.bossKills, combatState.activeCombatSeconds);
  while (combatState.enemies.length < desiredEnemyCount) {
    const index = combatState.kills + combatState.enemies.length;
    combatState.enemies.push(
      createEnemy(`enemy-${index}`, enemyTemplateForSpawnIndex(index), enemySpawnPosition(player, index, 430)),
    );
  }
}

export function desiredEnemyCountForBossKills(bossKills: number, activeCombatSeconds = 0): number {
  const bossPressure = Math.max(0, Math.floor(bossKills)) * 14;
  const timePressure = Math.min(64, Math.floor(Math.max(0, activeCombatSeconds) / 45) * 7);
  return INITIAL_ENEMY_COUNT + bossPressure + timePressure;
}

function enemyTemplateForSpawnIndex(index: number): CombatLoopEnemy["templateId"] {
  return index % 3 === 0 ? "fast-fragile" : index % 3 === 1 ? "slow-tough" : "swarm-fragile";
}

function enemySpawnPosition(player: Point, index: number, baseDistance: number): Point {
  const angle = index * 2.399963229728653;
  const distance = baseDistance + (index % 6) * 46;
  return {
    x: clamp(player.x + Math.cos(angle) * distance, 40, ARENA_BOUNDS.width - 40),
    y: clamp(player.y + Math.sin(angle) * distance, 40, ARENA_BOUNDS.height - 40),
  };
}

function createEnemy(
  id: string,
  templateId: CombatLoopEnemy["templateId"],
  position: Point,
): CombatLoopEnemy {
  const template = getCommonEnemyTemplate(templateId);
  return {
    id,
    templateId,
    position,
    health: template.maxHealth,
    radius: template.radius,
    nextContactAtSeconds: 0,
  };
}

function drawArenaHorizon(
  horizon: PixiGraphics,
  visualState: ArenaVisualState,
  tintColor: number,
): void {
  const phase = visualState.phase;
  horizon.clear();
  horizon
    .rect(0, 0, ARENA_BOUNDS.width, ARENA_BOUNDS.height)
    .fill({ color: phase.backgroundColor })
    .rect(0, 0, ARENA_BOUNDS.width, ARENA_BOUNDS.height)
    .fill({ color: tintColor, alpha: 0.08 })
    .rect(0, 0, ARENA_BOUNDS.width, ARENA_BOUNDS.height)
    .stroke({ color: phase.gridColor, width: 6, alpha: 0.78 });

  for (let index = 0; index < 180; index += 1) {
    const x = (index * 389) % ARENA_BOUNDS.width;
    const y = (index * 233) % ARENA_BOUNDS.height;
    const radius = (1 + (index % 3) * 0.8) * phase.intensity;
    const alpha = 0.2 + (index % 5) * 0.08;
    const color = index % 4 === 0 ? phase.accentColor : index % 4 === 1 ? tintColor : phase.starColor;
    horizon.circle(x, y, radius).fill({ color, alpha });
  }

  for (let index = 0; index < 14; index += 1) {
    const x = ((index * 571) % ARENA_BOUNDS.width) + 80;
    const y = ((index * 347) % ARENA_BOUNDS.height) + 60;
    const radius = 110 + (index % 4) * 42;
    const color = index % 3 === 0 ? phase.accentColor : index % 3 === 1 ? tintColor : phase.gridColor;
    horizon.circle(x, y, radius).fill({ color, alpha: 0.024 * phase.intensity });
    horizon.circle(x + 34, y - 18, radius * 0.55).stroke({ color, width: 2, alpha: 0.06 });
    horizon.circle(x - 52, y + 28, radius * 0.28).fill({ color: phase.starColor, alpha: 0.028 });
  }

  for (let index = 0; index < 18; index += 1) {
    const angle = index * 0.83;
    const radius = 190 + (index % 6) * 56;
    const x = ARENA_BOUNDS.width / 2 + Math.cos(angle) * radius;
    const y = ARENA_BOUNDS.height / 2 + Math.sin(angle) * radius * 0.48;
    horizon
      .circle(x, y, 16 + (index % 4) * 5)
      .stroke({ color: index % 2 === 0 ? tintColor : phase.accentColor, width: 1, alpha: 0.12 });
  }

  for (let x = 0; x <= ARENA_BOUNDS.width; x += 240) {
    horizon.moveTo(x, 0).lineTo(x, ARENA_BOUNDS.height).stroke({
      color: phase.gridColor,
      width: 1,
      alpha: 0.14 * phase.intensity,
    });
  }
  for (let y = 0; y <= ARENA_BOUNDS.height; y += 240) {
    horizon.moveTo(0, y).lineTo(ARENA_BOUNDS.width, y).stroke({
      color: phase.gridColor,
      width: 1,
      alpha: 0.14 * phase.intensity,
    });
  }

  horizon
    .circle(ARENA_BOUNDS.width / 2, ARENA_BOUNDS.height / 2, 72)
    .stroke({ color: tintColor, width: 2, alpha: 0.55 })
    .circle(ARENA_BOUNDS.width / 2, ARENA_BOUNDS.height / 2, 138)
    .stroke({ color: phase.accentColor, width: 1, alpha: 0.18 });
}

function createPlayerMech(Graphics: PixiGraphicsCtor): PixiGraphics {
  return new Graphics()
    .rect(-7, -24, 14, 9)
    .fill({ color: 0xe8fbff, alpha: 0.98 })
    .rect(-10, -15, 20, 29)
    .fill({ color: 0xb8f4ff, alpha: 0.96 })
    .rect(-4, -12, 8, 24)
    .fill({ color: 0x44f5ff, alpha: 0.9 })
    .rect(-24, -8, 13, 8)
    .fill({ color: 0x7ddfff, alpha: 0.92 })
    .rect(11, -8, 13, 8)
    .fill({ color: 0x7ddfff, alpha: 0.92 })
    .rect(-15, 13, 8, 17)
    .fill({ color: 0xe8fbff, alpha: 0.9 })
    .rect(7, 13, 8, 17)
    .fill({ color: 0xe8fbff, alpha: 0.9 })
    .rect(-27, -4, 10, 4)
    .fill({ color: 0xff4fd8, alpha: 0.9 })
    .rect(17, -4, 10, 4)
    .fill({ color: 0xff4fd8, alpha: 0.9 })
    .circle(0, -4, PLAYER_COLLISION_RADIUS)
    .stroke({ color: 0xff4fd8, width: 2, alpha: 0.68 })
    .circle(0, -4, 30)
    .stroke({ color: 0x44f5ff, width: 1, alpha: 0.38 });
}

function updateHud(screen: HTMLElement, combatState: CombatLoopState): void {
  const hudLevel = screen.querySelector<HTMLElement>("[data-hud-level]");
  if (hudLevel) {
    hudLevel.textContent = `Lv.${combatState.levelState.level.toString().padStart(3, "0")}`;
  }
  const xpFill = screen.querySelector<HTMLElement>(".xp-fill");
  if (xpFill) {
    xpFill.style.width = `${Math.min(
      100,
      (combatState.levelState.xp / combatState.levelState.nextLevelXp) * 100,
    )}%`;
  }
  const score = screen.querySelector<HTMLElement>("[data-score]");
  if (score) {
    score.textContent = `Score ${combatState.score}`;
  }
}

function updateArenaVisualDataset(
  screen: HTMLElement,
  visualState: ArenaVisualState,
  loadout: readonly Wishcraft[],
): void {
  const tint = phaseTintFromLoadout({
    loadout,
    phase: visualState.phase,
  });
  screen.dataset.arenaPhase = visualState.phase.id;
  screen.dataset.arenaTintTheme = tint.themeId ?? "";
}

function renderCombatGraphics(options: {
  bossState: BossEncounterState;
  combatState: CombatLoopState;
  enemyLayer: PixiContainer;
  feedbackLayer: PixiContainer;
  Graphics: PixiGraphicsCtor;
  horizon: PixiGraphics;
  playerAttachmentLayer: PixiContainer;
  renderCache: CombatRenderCache;
  screen: HTMLElement;
  screenEffectLayer: PixiContainer;
  summonLayer: PixiContainer;
  visualState: ArenaVisualState;
  xpLayer: PixiContainer;
}): void {
  const phaseTint = phaseTintFromLoadout({
    loadout: options.combatState.wishcraftLoadout,
    phase: options.visualState.phase,
  });
  updateArenaVisualDataset(options.screen, options.visualState, options.combatState.wishcraftLoadout);
  drawArenaHorizon(options.horizon, options.visualState, phaseTint.color);
  syncBossGraphics({
    bossState: options.bossState,
    Graphics: options.Graphics,
    layer: options.enemyLayer,
    player: options.combatState.player.position,
    renderCache: options.renderCache,
  });
  const playerVisuals = assembleRuntimeVisuals({
    catalog: wishcraftCatalog,
    entityRole: "player",
    loadout: options.combatState.wishcraftLoadout,
    budget: createVisualBudget("player"),
  });
  syncPlayerVisualAttachments({
    attachmentLayer: options.playerAttachmentLayer,
    Graphics: options.Graphics,
    player: options.combatState.player.position,
    renderCache: options.renderCache,
    visuals: playerVisuals,
  });
  syncScreenEffects({
    effectLayer: options.screenEffectLayer,
    Graphics: options.Graphics,
    player: options.combatState.player.position,
    renderCache: options.renderCache,
    visuals: playerVisuals,
  });

  syncGraphicsMap({
    Graphics: options.Graphics,
    items: options.combatState.xpShards,
    layer: options.xpLayer,
    cache: options.renderCache.xpShards,
    create: (Graphics) => {
      const graphic = new Graphics()
        .rect(-5, -5, 10, 10)
        .fill({ color: 0x44f5ff })
        .stroke({ color: 0xe8fbff, width: 1, alpha: 0.8 });
      graphic.rotation = Math.PI / 4;
      return graphic;
    },
    update: (graphic, shard) => {
      graphic.position.set(shard.position.x, shard.position.y);
    },
  });

  syncGraphicsMap({
    Graphics: options.Graphics,
    items: options.combatState.enemies,
    layer: options.enemyLayer,
    cache: options.renderCache.enemies,
    cacheKey: (enemy) => {
      const visuals = assembleRuntimeVisuals({
        catalog: wishcraftCatalog,
        entityRole: "common-enemy",
        loadout: options.combatState.wishcraftLoadout.slice(-2),
        budget: createVisualBudget("common-enemy"),
      });
      const drift = enemyDriftFromLoadout(options.combatState.wishcraftLoadout);
      return `${visualCacheKeyForEntity(enemy.id, "common-enemy", visuals)}:${drift.dominantThemeId ?? "base"}:${drift.secondaryThemeIds.join(",")}`;
    },
    create: (Graphics, enemy) => {
      const driftVisuals = assembleRuntimeVisuals({
        catalog: wishcraftCatalog,
        entityRole: "common-enemy",
        loadout: options.combatState.wishcraftLoadout.slice(-2),
        budget: createVisualBudget("common-enemy"),
      });
      return createCommonEnemyGraphic({
        drift: enemyDriftFromLoadout(options.combatState.wishcraftLoadout),
        enemy,
        Graphics,
        visuals: driftVisuals,
      });
    },
    update: (graphic, enemy) => {
      graphic.position.set(enemy.position.x, enemy.position.y);
    },
  });

  syncGraphicsMap({
    Graphics: options.Graphics,
    items: options.combatState.wishcraftRuntime.summons,
    layer: options.summonLayer,
    cache: options.renderCache.summons,
    cacheKey: (summon) => {
      const visuals = assembleRuntimeVisuals({
        catalog: wishcraftCatalog,
        entityRole: "summon",
        loadout: options.combatState.wishcraftLoadout.filter((craft) => craft.id === summon.craftId),
        budget: createVisualBudget("summon"),
      });
      return visualCacheKeyForEntity(summon.id, "summon", visuals);
    },
    create: (Graphics, summon) => {
      const summonVisuals = assembleRuntimeVisuals({
        catalog: wishcraftCatalog,
        entityRole: "summon",
        loadout: options.combatState.wishcraftLoadout.filter((craft) => craft.id === summon.craftId),
        budget: createVisualBudget("summon"),
      });
      return createSummonGraphic({
        Graphics,
        orbitRadius: summon.orbitRadius,
        visuals: summonVisuals,
      });
    },
    update: (graphic, summon) => {
      graphic.position.set(summon.position.x, summon.position.y);
    },
  });

  for (const graphic of options.renderCache.feedback) {
    graphic.destroy();
  }
  options.renderCache.feedback = [];
  options.feedbackLayer.removeChildren();

  for (const event of selectBudgetedFeedback(options.combatState.feedback)) {
    const graphic = createFeedbackGraphic(event, options.Graphics);
    if (graphic) {
      options.feedbackLayer.addChild(graphic);
      options.renderCache.feedback.push(graphic);
    }
  }
}

export function selectBudgetedFeedback<TFeedback>(feedback: readonly TFeedback[]): TFeedback[] {
  return feedback.slice(0, MAX_FEEDBACK_GRAPHICS_PER_FRAME);
}

export function visualCacheKeyForEntity(
  entityId: string,
  role: VisualEntityRole,
  visuals: RuntimeVisualAssembly,
): string {
  const attachmentIds = visuals.attachments.map((attachment) => attachment.visualPieceId).join(",");
  return `${entityId}:${role}:${attachmentIds}`;
}

function createCommonEnemyGraphic(options: {
  drift: ReturnType<typeof enemyDriftFromLoadout>;
  enemy: CombatLoopEnemy;
  Graphics: PixiGraphicsCtor;
  visuals: RuntimeVisualAssembly;
}): PixiGraphics {
  const templateColor =
    options.enemy.templateId === "slow-tough"
      ? 0xff4fd8
      : options.enemy.templateId === "fast-fragile"
        ? 0xfff06a
        : 0x75ff9a;
  const attachmentColor = options.visuals.attachments[0]?.palette[options.visuals.attachments[0].paletteRole];
  const baseColor = options.drift.dominantThemeId ? options.drift.tintColor : (attachmentColor ?? templateColor);
  const graphic = new options.Graphics()
    .circle(0, 0, options.enemy.radius)
    .fill({ color: baseColor, alpha: 0.88 })
    .rect(-options.enemy.radius * 0.52, -options.enemy.radius * 1.18, options.enemy.radius * 1.04, 4)
    .fill({ color: 0xe8fbff, alpha: 0.44 })
    .rect(-3, options.enemy.radius * 0.65, 6, 8)
    .fill({ color: options.drift.accentColor, alpha: 0.42 })
    .circle(0, 0, options.enemy.radius + 5)
    .stroke({ color: baseColor, width: 1, alpha: 0.34 })
    .stroke({ color: options.drift.accentColor, width: 1, alpha: 0.55 });
  for (const layout of layoutRuntimeVisualAttachments(options.visuals.attachments.slice(0, 3))) {
    drawCompactAttachment(graphic, layout.attachment, layout.slotIndex, options.enemy.radius);
  }
  return graphic;
}

function createSummonGraphic(options: {
  Graphics: PixiGraphicsCtor;
  orbitRadius: number;
  visuals: RuntimeVisualAssembly;
}): PixiGraphics {
  const attachment = options.visuals.attachments[0];
  const color = attachment?.palette[attachment.paletteRole] ?? 0xfff6d6;
  const graphic = new options.Graphics()
    .circle(0, 0, 7)
    .fill({ color, alpha: 0.92 })
    .rect(-3, -12, 6, 24)
    .fill({ color: 0xe8fbff, alpha: 0.72 })
    .circle(0, 0, 16)
    .stroke({ color: 0x7ddfff, width: 2, alpha: 0.74 })
    .circle(0, 0, Math.min(34, Math.max(18, options.orbitRadius * 0.34)))
    .stroke({ color, width: 1, alpha: 0.26 });
  for (const layout of layoutRuntimeVisualAttachments(options.visuals.attachments.slice(0, 4))) {
    drawCompactAttachment(graphic, layout.attachment, layout.slotIndex, 10);
  }
  return graphic;
}

function syncBossGraphics(options: {
  bossState: BossEncounterState;
  Graphics: PixiGraphicsCtor;
  layer: PixiContainer;
  player: Point;
  renderCache: CombatRenderCache;
}): void {
  const bosses = options.bossState.pendingPlan?.bosses ?? [];
  const ids = options.bossState.phase === "warning" || options.bossState.phase === "active"
    ? bosses.map((boss) => `${boss.templateId}:${boss.rivalThemeId}:${boss.silhouette}`).join("|")
    : "";
  if (ids !== options.renderCache.bossIds) {
    for (const graphic of options.renderCache.bosses) {
      graphic.destroy();
    }
    options.renderCache.bosses = [];
    if (ids.length > 0) {
      options.renderCache.bosses = bosses.map((boss, index) =>
        createBossGraphic({
          boss,
          Graphics: options.Graphics,
          index,
        }),
      );
      for (const graphic of options.renderCache.bosses) {
        options.layer.addChild(graphic);
      }
    }
    options.renderCache.bossIds = ids;
  }

  for (const [index, graphic] of options.renderCache.bosses.entries()) {
    const side = index === 0 ? -1 : 1;
    graphic.position.set(options.player.x + side * (220 + index * 90), options.player.y - 120 + index * 120);
  }
}

function createBossGraphic(options: {
  boss: NonNullable<BossEncounterState["pendingPlan"]>["bosses"][number];
  Graphics: PixiGraphicsCtor;
  index: number;
}): PixiGraphics {
  const bossWishcraft: Wishcraft = {
    id: `boss-visual-${options.boss.templateId}-${options.index}`,
    mechanicPieceIds: [],
    name: { cn: options.boss.name, en: options.boss.name },
    parameters: {},
    primaryMechanicId: "boss-visual",
    primaryThemeId: options.boss.rivalThemeId,
    sourceWish: "local boss visual plan",
    visualPieceIds: options.boss.visualPieceIds,
  };
  const visuals = assembleRuntimeVisuals({
    bossSilhouette: options.boss.silhouette,
    catalog: wishcraftCatalog,
    entityRole: "boss-placeholder",
    loadout: [bossWishcraft],
    budget: createVisualBudget("boss-placeholder"),
  });
  const color = visuals.attachments[0]?.palette[visuals.attachments[0].paletteRole] ?? 0xff4fd8;
  const accent = visuals.attachments[0]?.palette.accent ?? 0xe8fbff;
  const graphic = new options.Graphics();
  if (options.boss.silhouette === "flying") {
    graphic
      .poly([-70, 0, -18, -42, 0, -18, 18, -42, 70, 0, 24, 22, -24, 22])
      .fill({ color, alpha: 0.82 })
      .circle(0, -6, 26)
      .stroke({ color: accent, width: 3, alpha: 0.7 });
  } else if (options.boss.silhouette === "crawling") {
    graphic
      .rect(-58, -22, 116, 44)
      .fill({ color, alpha: 0.78 })
      .rect(-82, 12, 34, 14)
      .rect(48, 12, 34, 14)
      .fill({ color: accent, alpha: 0.62 })
      .circle(0, 0, 68)
      .stroke({ color: accent, width: 2, alpha: 0.34 });
  } else {
    graphic
      .rect(-28, -70, 56, 42)
      .fill({ color: accent, alpha: 0.78 })
      .rect(-44, -28, 88, 92)
      .fill({ color, alpha: 0.82 })
      .rect(-78, -10, 34, 86)
      .rect(44, -10, 34, 86)
      .fill({ color: accent, alpha: 0.56 });
  }
  for (const layout of layoutRuntimeVisualAttachments(visuals.attachments.slice(0, 8))) {
    drawCompactAttachment(graphic, layout.attachment, layout.slotIndex, 54);
  }
  return graphic;
}

function drawCompactAttachment(
  graphic: PixiGraphics,
  attachment: RuntimeVisualAttachment,
  slotIndex: number,
  radius: number,
): void {
  const color = attachment.palette[attachment.paletteRole];
  const accent = attachment.palette.accent;
  const angle = slotIndex * 1.9 + slotPriorityAngle(attachment.slot);
  const distance = radius + 4 + slotIndex * 3;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  if (attachment.slot === "aura" || attachment.slot === "orbit") {
    graphic.circle(0, 0, radius + 8 + slotIndex * 4).stroke({ color, width: 1, alpha: 0.32 });
    return;
  }
  if (attachment.slot === "trail") {
    graphic
      .poly([-4, radius + 4, 0, radius + 16 + slotIndex * 3, 4, radius + 4])
      .fill({ color, alpha: 0.28 });
    return;
  }
  graphic
    .circle(x, y, 10)
    .stroke({ color, width: 1, alpha: 0.16 })
    .circle(x, y, 3 + Math.min(3, attachment.scale * 2))
    .fill({ color, alpha: 0.76 })
    .circle(x, y, 6)
    .stroke({ color: accent, width: 1, alpha: 0.36 });
}

function slotPriorityAngle(slot: RuntimeVisualAttachment["slot"]): number {
  const angles: Record<RuntimeVisualAttachment["slot"], number> = {
    aura: 0,
    back: 3.9,
    core: 4.7,
    head: 4.7,
    hip: 1.6,
    impact: 0.7,
    orbit: 0,
    projectile: 5.8,
    shoulder: 3.7,
    summon: 2.4,
    trail: 1.57,
    weapon: 5.8,
    arm: 5.6,
  };
  return angles[slot];
}

/*
  syncGraphicsMap follows the supplied cacheKey, so visuals can rebuild when
  recent Wishcraft changes even if the entity id remains stable.
*/
function syncGraphicsMap<TItem extends { id: string }>(options: {
  Graphics: PixiGraphicsCtor;
  cache: Map<string, PixiGraphics>;
  cacheKey?: (item: TItem) => string;
  create: (Graphics: PixiGraphicsCtor, item: TItem) => PixiGraphics;
  items: readonly TItem[];
  layer: PixiContainer;
  update: (graphic: PixiGraphics, item: TItem) => void;
}): void {
  const cacheKeyFor = options.cacheKey ?? ((item: TItem) => item.id);
  const liveIds = new Set(options.items.map((item) => cacheKeyFor(item)));
  for (const [id, graphic] of options.cache) {
    if (!liveIds.has(id)) {
      options.cache.delete(id);
      graphic.destroy();
    }
  }

  for (const item of options.items) {
    const cacheKey = cacheKeyFor(item);
    let graphic = options.cache.get(cacheKey);
    if (!graphic) {
      graphic = options.create(options.Graphics, item);
      options.cache.set(cacheKey, graphic);
      options.layer.addChild(graphic);
    }
    options.update(graphic, item);
  }
}

function syncPlayerVisualAttachments(options: {
  attachmentLayer: PixiContainer;
  Graphics: PixiGraphicsCtor;
  player: Point;
  renderCache: CombatRenderCache;
  visuals: RuntimeVisualAssembly;
}): void {
  const ids = options.visuals.attachments.map((attachment) => attachment.visualPieceId).join("|");
  if (ids !== options.renderCache.playerAttachmentIds) {
    for (const graphic of options.renderCache.playerAttachments) {
      graphic.destroy();
    }
    options.attachmentLayer.removeChildren();
    options.renderCache.playerAttachments = layoutRuntimeVisualAttachments(options.visuals.attachments).map((layout) =>
      createAttachmentGraphic(layout.attachment, options.Graphics, layout.slotIndex),
    );
    for (const graphic of options.renderCache.playerAttachments) {
      options.attachmentLayer.addChild(graphic);
    }
    options.renderCache.playerAttachmentIds = ids;
  }

  options.attachmentLayer.position.set(options.player.x, options.player.y);
  options.attachmentLayer.rotation = 0;
}

function syncScreenEffects(options: {
  effectLayer: PixiContainer;
  Graphics: PixiGraphicsCtor;
  player: Point;
  renderCache: CombatRenderCache;
  visuals: RuntimeVisualAssembly;
}): void {
  const ids = options.visuals.screenEffects.map((effect) => effect.sourceAttachmentId).join("|");
  if (ids !== options.renderCache.screenEffectIds) {
    for (const graphic of options.renderCache.screenEffects) {
      graphic.destroy();
    }
    options.effectLayer.removeChildren();
    options.renderCache.screenEffects = options.visuals.screenEffects.map((effect, index) =>
      new options.Graphics()
        .circle(0, 0, 112 + index * 36)
        .stroke({ color: effect.color, width: 2, alpha: effect.intensity })
        .circle(0, 0, 180 + index * 52)
        .stroke({ color: effect.color, width: 1, alpha: effect.intensity * 0.55 }),
    );
    for (const graphic of options.renderCache.screenEffects) {
      options.effectLayer.addChild(graphic);
    }
    options.renderCache.screenEffectIds = ids;
  }

  options.effectLayer.position.set(options.player.x, options.player.y);
}

function createAttachmentGraphic(
  attachment: RuntimeVisualAttachment,
  Graphics: PixiGraphicsCtor,
  index: number,
): PixiGraphics {
  const color = attachment.palette[attachment.paletteRole];
  const accent = attachment.palette.accent;
  const scale = attachment.scale;
  const graphic = new Graphics();
  const offset = slotOffset(attachment.slot, index, scale);

  if (attachment.slot === "aura") {
    graphic
      .circle(0, 0, 34 * scale + index * 5)
      .stroke({ color, width: 2, alpha: 0.4 })
      .circle(0, 0, 48 * scale + index * 7)
      .stroke({ color: accent, width: 1, alpha: 0.18 });
  } else if (attachment.slot === "orbit") {
    graphic
      .circle(0, 0, 48 * scale + index * 4)
      .stroke({ color, width: 2, alpha: 0.34 })
      .circle(34 * scale, 0, 7 * scale)
      .fill({ color, alpha: 0.84 })
      .circle(-34 * scale, 0, 5 * scale)
      .fill({ color: accent, alpha: 0.78 });
  } else if (attachment.slot === "trail") {
    graphic
      .poly([-8, 22, 0, 54 + index * 7, 8, 22])
      .fill({ color, alpha: 0.22 })
      .rect(-3, 14, 6, 28)
      .fill({ color: accent, alpha: 0.38 });
  } else if (attachment.slot === "projectile" || attachment.slot === "weapon") {
    graphic
      .rect(-30 * scale, -4 * scale, 60 * scale, 8 * scale)
      .fill({ color, alpha: 0.7 })
      .rect(18 * scale, -2 * scale, 18 * scale, 4 * scale)
      .fill({ color: accent, alpha: 0.9 });
  } else if (attachment.slot === "shoulder" || attachment.slot === "arm") {
    graphic
      .rect(-10 * scale, -8 * scale, 20 * scale, 16 * scale)
      .fill({ color, alpha: 0.82 })
      .rect(-5 * scale, -12 * scale, 10 * scale, 24 * scale)
      .stroke({ color: accent, width: 2, alpha: 0.62 });
  } else if (attachment.slot === "back") {
    graphic
      .poly([-22 * scale, 2, -8 * scale, -22 * scale, -4 * scale, 20 * scale])
      .fill({ color, alpha: 0.62 })
      .poly([22 * scale, 2, 8 * scale, -22 * scale, 4 * scale, 20 * scale])
      .fill({ color: accent, alpha: 0.5 });
  } else if (attachment.slot === "summon") {
    graphic
      .circle(0, 0, 10 * scale)
      .fill({ color, alpha: 0.76 })
      .circle(0, 0, 19 * scale)
      .stroke({ color: accent, width: 2, alpha: 0.46 });
  } else {
    graphic
      .circle(0, 0, 18 * scale)
      .stroke({ color, width: 1, alpha: 0.18 })
      .rect(-8 * scale, -8 * scale, 16 * scale, 16 * scale)
      .fill({ color, alpha: 0.68 })
      .stroke({ color: accent, width: 1, alpha: 0.54 });
  }

  graphic.position.set(offset.x, offset.y);
  return graphic;
}

function slotOffset(slot: AttachmentSlot, index: number, scale: number): Point {
  const alternating = index % 2 === 0 ? -1 : 1;
  const offsets: Record<AttachmentSlot, Point> = {
    aura: { x: 0, y: 0 },
    projectile: { x: alternating * 22 * scale, y: -4 * scale },
    trail: { x: 0, y: 10 * scale },
    orbit: { x: 0, y: 0 },
    shoulder: { x: alternating * 19 * scale, y: -10 * scale },
    back: { x: 0, y: -2 * scale },
    weapon: { x: alternating * 24 * scale, y: 0 },
    impact: { x: 0, y: 0 },
    summon: { x: alternating * 42 * scale, y: -20 * scale },
    core: { x: 0, y: -4 * scale },
    head: { x: 0, y: -25 * scale },
    arm: { x: alternating * 25 * scale, y: 1 * scale },
    hip: { x: alternating * 13 * scale, y: 17 * scale },
  };
  return offsets[slot];
}

function createFeedbackGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
): PixiGraphics | undefined {
  if (event.kind === "impact") {
    const graphic = new Graphics().circle(0, 0, 16).stroke({
      color: 0x44f5ff,
      width: 2,
      alpha: 0.65,
    });
    graphic.position.set(event.position.x, event.position.y);
    return graphic;
  }
  if (event.kind === "wishcraft-hit") {
    const color = colorForWishcraftVisual(event.visualKind);
    const graphic = new Graphics();
    if (event.visualKind === "beam") {
      graphic.rect(-26, -3, 52, 6).fill({ color, alpha: 0.72 });
    } else if (event.visualKind === "missile") {
      graphic.poly([-18, 0, 12, -8, 22, 0, 12, 8]).fill({ color, alpha: 0.78 });
    } else if (event.visualKind === "scatter") {
      graphic.circle(-10, -5, 4).circle(0, 0, 5).circle(11, 6, 4).fill({ color, alpha: 0.78 });
    } else if (event.visualKind === "ricochet") {
      graphic.moveTo(-18, 12).lineTo(0, -10).lineTo(18, 10).stroke({ color, width: 3, alpha: 0.8 });
    } else if (event.visualKind === "burst" || event.visualKind === "area") {
      graphic.circle(0, 0, 24).stroke({ color, width: 4, alpha: 0.78 });
    } else if (event.visualKind === "melee") {
      graphic.arc(0, 0, 26, -0.7, 0.9).stroke({ color, width: 5, alpha: 0.78 });
    } else if (event.visualKind === "summon") {
      graphic.circle(0, 0, 12).stroke({ color, width: 3, alpha: 0.74 });
    } else {
      graphic.moveTo(-18, 0).lineTo(18, 0).stroke({ color, width: 4, alpha: 0.76 });
    }
    graphic.position.set(event.position.x, event.position.y);
    return graphic;
  }
  if (event.kind === "wishcraft-shield") {
    const graphic = new Graphics().circle(0, 0, 42).stroke({
      color: 0x62ff9d,
      width: 3,
      alpha: 0.58,
    });
    graphic.position.set(event.position.x, event.position.y);
    return graphic;
  }
  if (event.kind === "wishcraft-summon") {
    const graphic = new Graphics()
      .circle(0, 0, 10)
      .fill({ color: 0xfff6d6, alpha: 0.8 })
      .circle(0, 0, 18)
      .stroke({ color: 0x7ddfff, width: 2, alpha: 0.55 });
    graphic.position.set(event.position.x, event.position.y);
    return graphic;
  }
  if (event.kind === "enemy-death") {
    const graphic = new Graphics().circle(0, 0, 28).stroke({
      color: 0xff4fd8,
      width: 3,
      alpha: 0.72,
    });
    graphic.position.set(event.position.x, event.position.y);
    return graphic;
  }
  if (event.kind === "xp-collect") {
    const graphic = new Graphics().circle(0, 0, 12).stroke({
      color: 0xe8fbff,
      width: 2,
      alpha: 0.58,
    });
    graphic.position.set(event.position.x, event.position.y);
    return graphic;
  }
  if (event.kind === "player-hit") {
    const graphic = new Graphics().circle(0, 0, 26).stroke({
      color: 0xff4f6a,
      width: 3,
      alpha: 0.62,
    });
    graphic.position.set(event.position.x, event.position.y);
    return graphic;
  }
  return undefined;
}

function colorForWishcraftVisual(visualKind: string): number {
  const colors: Record<string, number> = {
    area: 0xff4fd8,
    beam: 0x44f5ff,
    burst: 0xffcc4d,
    lance: 0xfff2a8,
    melee: 0xe8fbff,
    missile: 0xff7a3d,
    pickup: 0x8cffd2,
    ricochet: 0x7affb2,
    scatter: 0xff6bd6,
    shield: 0x62ff9d,
    summon: 0xfff6d6,
    trigger: 0x7df9ff,
  };
  return colors[visualKind] ?? 0x44f5ff;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
