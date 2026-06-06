import type { BossEncounterPlan } from "../../shared/boss/boss-planning.js";
import {
  applyMovement,
  calculateViewport,
} from "../simulation/arena-math.js";
import {
  createArenaRuntimeState,
  type ArenaRuntimeState,
} from "../simulation/arena-runtime.js";
import {
  createBossEncounterState,
  queueBossAfterManifestation,
  startBossWarning,
  stepBossEncounterRuntime,
  type BossEncounterState,
} from "../simulation/boss-encounter.js";
import {
  createCombatLoopState,
  stepCombatLoop,
  type CombatLoopState,
} from "../simulation/combat-loop.js";
import {
  createInitialEnemies,
  spawnReplacementEnemies,
} from "../simulation/enemy-spawning.js";
import { resolveMovementVector } from "../simulation/movement.js";
import {
  createWishBreakState,
  finishManifestation,
  receiveWishcraft,
  startWishBreak,
  submitWish,
  type WishBreakState,
} from "../simulation/wish-break.js";
import { bootPixiArena } from "../rendering/combat-renderer.js";
import {
  advanceArenaPhaseAfterBossCompletion,
  createArenaVisualState,
} from "../visual/arena-visual-state.js";
import {
  renderBossWarning,
  renderLeaderboard,
  renderSettlement,
  renderWishBreak,
  updateArenaVisualDataset,
  updateHud,
  updatePlayerOverlay,
} from "./hud-renderer.js";
import {
  bindJoystick,
  bindKeyboard,
  bindViewportRefresh,
} from "./input-bindings.js";
import type {
  ArenaClockState,
  ArenaRuntimeOptions,
  BossPlanRecordCoordinator,
  FetchLeaderboard,
  FetchLeaderboardDetails,
  FulfillWish,
  RecordBossPlan,
  SettlementDom,
  SettlementState,
  SubmitPlayerName,
  WishBreakDom,
} from "./types.js";

export function startArenaRuntime(options: ArenaRuntimeOptions): void {
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
    runId: options.run.runId,
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
    runId: options.run.runId,
    screen: options.screen,
    wishBreak: options.wishBreak,
    wishState,
  });
  processLevelUpFeedback(combatState, wishState);
  updateArenaVisualDataset(options.screen, arenaVisualState, combatState.wishcraftLoadout);
  updatePlayerOverlay(options.playerOverlay, state, combatState);
  updateHud(options.screen, combatState);
  renderWishBreak(options.screen, options.wishBreak, wishState);
  renderBossWarning(options.screen, options.bossWarning, bossState);
  processSettlement({
    combatState,
    completeRun: options.completeRun,
    contentVersion: options.run.contentVersion,
    runId: options.run.runId,
    screen: options.screen,
    settlement: options.settlement,
    settlementState,
  });
  void bootPixiArena({
    bossState,
    canvas: options.canvas,
    combatState,
    screen: options.screen,
    state,
    visualState: arenaVisualState,
  });

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
    updatePlayerOverlay(options.playerOverlay, state, combatState);
    updateHud(options.screen, combatState);
    renderWishBreak(options.screen, options.wishBreak, wishState);
    renderBossWarning(options.screen, options.bossWarning, bossState);
    processSettlement({
      combatState,
      completeRun: options.completeRun,
      contentVersion: options.run.contentVersion,
      runId: options.run.runId,
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
  bossWarning: { root: HTMLElement; name: HTMLElement; health: HTMLElement };
  bossPlanRecords: BossPlanRecordCoordinator;
  clockState: ArenaClockState;
  combatState: CombatLoopState;
  fulfillWish: FulfillWish;
  recordBossPlan: RecordBossPlan;
  runId: string;
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
        runId: options.runId,
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
  runId: string;
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
        runId: options.runId,
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
  completeRun: ArenaRuntimeOptions["completeRun"];
  contentVersion: string;
  runId: string;
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
    contentVersion: options.contentVersion,
    kills: options.combatState.kills,
    level: options.combatState.levelState.level,
    runId: options.runId,
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
  bossWarning: { root: HTMLElement; name: HTMLElement; health: HTMLElement };
  bossPlanRecords: BossPlanRecordCoordinator;
  combatState: CombatLoopState;
  recordBossPlan: RecordBossPlan;
  runId: string;
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
          encounterId: createBossEncounterId(options.runId, options.bossState.pendingPlan),
          plan: options.bossState.pendingPlan,
          runId: options.runId,
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

function createBossEncounterId(runId: string, plan: BossEncounterPlan): string {
  return `${runId}-boss-${plan.bossEncounterNumber}-level-${plan.plannedLevel}`;
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
