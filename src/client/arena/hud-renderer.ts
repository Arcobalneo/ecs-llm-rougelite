import { wishcraftCatalog } from "../../shared/wishcraft/catalog.js";
import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { ArenaVisualState } from "../visual/arena-visual-state.js";
import { phaseTintFromLoadout } from "../visual/arena-visual-state.js";
import { assembleRuntimeVisuals, createVisualBudget } from "../visual/visual-assembly.js";
import { calculateCamera } from "../simulation/arena-math.js";
import type { ArenaRuntimeState } from "../simulation/arena-runtime.js";
import type { BossEncounterState } from "../simulation/boss-encounter.js";
import type { CombatLoopState } from "../simulation/combat-loop.js";
import type {
  BossWarningDom,
  FetchLeaderboardDetails,
  LeaderboardDetails,
  LeaderboardEntry,
  SettlementDom,
  SettlementState,
  WishBreakDom,
} from "./types.js";
import type { WishBreakState } from "../simulation/wish-break.js";

export function updatePlayerOverlay(
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
      levelLabel.textContent = formatLevel(combatState.levelState.level);
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

export function updateHud(screen: HTMLElement, combatState: CombatLoopState): void {
  const hudLevel = screen.querySelector<HTMLElement>("[data-hud-level]");
  if (hudLevel) {
    hudLevel.textContent = formatLevel(combatState.levelState.level);
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

export function updateArenaVisualDataset(
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

export function renderWishBreak(screen: HTMLElement, dom: WishBreakDom, state: WishBreakState): void {
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

export function renderBossWarning(screen: HTMLElement, dom: BossWarningDom, state: BossEncounterState): void {
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

export function renderSettlement(dom: SettlementDom, state: SettlementState): void {
  dom.root.hidden = state.phase === "combat";
  dom.root.dataset.phase = state.phase;
  dom.input.disabled = state.phase !== "name-entry";
  dom.submit.disabled = state.phase !== "name-entry" || dom.input.value.trim().length === 0;
}

export function renderLeaderboard(
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
    item.textContent = `${formatLevel(craft.awardedLevel)} ${craft.name.cn} / ${craft.name.en}`;
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

function formatLevel(level: number): string {
  return `Lv.${level.toString().padStart(3, "0")}`;
}
