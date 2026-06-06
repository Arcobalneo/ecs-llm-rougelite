import { wishcraftCatalog } from "../../../shared/wishcraft/catalog.js";
import type { Wishcraft } from "../../../shared/wishcraft/types.js";
import type { XpShard } from "../../simulation/progression-combat.js";
import { createWishcraftRuntimeState } from "../../simulation/wishcraft-mechanics.js";
import type { MovementVector } from "../../simulation/movement.js";
import {
  playerMechAnimationState,
  type PlayerMechAnimationState,
} from "../combat-entity-animation.js";
import { createVisualBudget, assembleRuntimeVisuals } from "../visual-assembly.js";
import {
  createPlayerMech,
  redrawPlayerMechGraphic,
} from "../combat-entity-sprites.js";
import {
  syncPlayerVisualAttachments,
  syncScreenEffects,
} from "../runtime-attachments.js";
import { drawPersistentWishcraftSourceVfx } from "../wishcraft-persistent-source-vfx.js";
import { createCombatRenderCache } from "../../rendering/render-cache.js";
import { VISUAL_POLISH_VERSION } from "../../rendering/combat-renderer.js";

type PixiApplicationCtor = typeof import("pixi.js").Application;
type PixiContainerCtor = typeof import("pixi.js").Container;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;
type PixiContainer = import("pixi.js").Container;
type PixiGraphics = import("pixi.js").Graphics;

export interface PlayerMechQaScenario {
  focus: "desktop" | "mobile";
  hitFlash: number;
  height: number;
  id: string;
  idleFrameOverride?: PlayerMechAnimationState["idleFrame"];
  label: string;
  loadout: readonly Wishcraft[];
  movement: MovementVector;
  nowSeconds: number;
  runtimeKind: "none" | "shield-summon-magnet";
  scale: number;
  width: number;
  wishInstallProgress: number;
}

const desktopLoadout = createPlayerQaLoadout([
  craft("qa-player-starfire", "starfire", "projectile-lance", ["aura", "projectile", "trail", "orbit"], {
    damageScale: 1.22,
    projectileCount: 3,
  }),
  craft("qa-player-gravity", "gravity", "summon-orbiter", ["summon", "core", "head", "arm"], {
    damageScale: 1.1,
    orbitRadius: 88,
    summonCount: 2,
  }),
  craft("qa-player-dragon", "dragon", "melee-saw", ["back", "weapon", "impact"], {
    damageScale: 1.26,
    rangeScale: 1.18,
  }),
  craft("qa-player-neon", "neon", "projectile-beam", ["head", "arm", "hip"], {
    damageScale: 1.16,
    rangeScale: 1.28,
  }),
  craft("qa-player-shield", "shield", "shield-capacity", ["shoulder", "back", "weapon"], {
    shieldCapacity: 56,
  }),
]);

const mobileLoadout = createPlayerQaLoadout([
  craft("qa-mobile-frost", "frost", "area-burst-nova", ["arm", "hip", "aura", "projectile"], {
    blastRadius: 148,
    damageScale: 1.18,
  }),
  craft("qa-mobile-clockwork", "clockwork", "trigger-on-kill", ["impact", "summon", "core"], {
    blastRadius: 126,
    damageScale: 1.14,
  }),
  craft("qa-mobile-crystal", "crystal", "projectile-pierce", ["orbit", "shoulder", "back", "weapon"], {
    damageScale: 1.17,
    pierceCount: 3,
  }),
]);

export function createPlayerMechQaScenarios(): PlayerMechQaScenario[] {
  return [
    {
      focus: "desktop",
      hitFlash: 0,
      height: 300,
      id: "idle-fresh",
      idleFrameOverride: 0,
      label: "Fresh idle base, no Wishcraft",
      loadout: [],
      movement: { x: 0, y: 0, strength: 0 },
      nowSeconds: 4.2,
      runtimeKind: "none",
      scale: 2.65,
      width: 360,
      wishInstallProgress: 1,
    },
    {
      focus: "desktop",
      hitFlash: 0,
      height: 300,
      id: "movement-thrust",
      label: "Diagonal movement, frame-art thrust",
      loadout: desktopLoadout.slice(0, 2),
      movement: { x: 0.76, y: -0.48, strength: 0.9 },
      nowSeconds: 9.4,
      runtimeKind: "none",
      scale: 2.45,
      width: 360,
      wishInstallProgress: 1,
    },
    {
      focus: "desktop",
      hitFlash: 0,
      height: 300,
      id: "dense-loadout",
      label: "5 Wishcraft loadout, attachments + shield",
      loadout: desktopLoadout,
      movement: { x: -0.52, y: 0.32, strength: 0.7 },
      nowSeconds: 18.7,
      runtimeKind: "shield-summon-magnet",
      scale: 2.25,
      width: 360,
      wishInstallProgress: 1,
    },
    {
      focus: "desktop",
      hitFlash: 0.86,
      height: 300,
      id: "hit-flicker",
      idleFrameOverride: 3,
      label: "Armor hit flicker + shield sparks",
      loadout: desktopLoadout.slice(0, 3),
      movement: { x: 0.18, y: 0.1, strength: 0.18 },
      nowSeconds: 25.6,
      runtimeKind: "shield-summon-magnet",
      scale: 2.35,
      width: 360,
      wishInstallProgress: 1,
    },
    {
      focus: "desktop",
      hitFlash: 0,
      height: 300,
      id: "wish-install",
      idleFrameOverride: 2,
      label: "Wishcraft install snap-on moment",
      loadout: desktopLoadout,
      movement: { x: -0.08, y: -0.18, strength: 0.22 },
      nowSeconds: 30.2,
      runtimeKind: "shield-summon-magnet",
      scale: 2.3,
      width: 360,
      wishInstallProgress: 0.42,
    },
    {
      focus: "mobile",
      hitFlash: 0,
      height: 640,
      id: "mobile-portrait",
      label: "Mobile portrait crop, 3 Wishcraft",
      loadout: mobileLoadout,
      movement: { x: 0.18, y: -0.92, strength: 0.94 },
      nowSeconds: 22.4,
      runtimeKind: "shield-summon-magnet",
      scale: 2.15,
      width: 360,
      wishInstallProgress: 1,
    },
  ];
}

export function playerMechQaCoverageSummary(scenarios = createPlayerMechQaScenarios()): {
  desktopPanels: number;
  maxLoadoutSize: number;
  mobilePanels: number;
  scenarioCount: number;
} {
  return {
    desktopPanels: scenarios.filter((scenario) => scenario.focus === "desktop").length,
    maxLoadoutSize: Math.max(...scenarios.map((scenario) => scenario.loadout.length)),
    mobilePanels: scenarios.filter((scenario) => scenario.focus === "mobile").length,
    scenarioCount: scenarios.length,
  };
}

export async function bootPlayerMechQaScene(options: {
  canvas: HTMLCanvasElement;
  root: HTMLElement;
}): Promise<void> {
  if (!isRealBrowserCanvas(options.canvas)) {
    options.root.dataset.pixiStatus = "skipped";
    return;
  }

  const { Application, Container, Graphics } = await import("pixi.js");
  const scenarios = createPlayerMechQaScenarios();
  const size = sheetSizeForScenarios(scenarios);
  options.canvas.width = size.width;
  options.canvas.height = size.height;

  const app = new Application();
  await app.init({
    antialias: false,
    backgroundAlpha: 1,
    backgroundColor: 0x050712,
    canvas: options.canvas,
    height: size.height,
    preference: "webgl",
    width: size.width,
  });

  const sheet = new Graphics();
  app.stage.addChild(sheet);
  drawSheetBackground(sheet, scenarios);
  for (const [index, scenario] of scenarios.entries()) {
    drawScenarioPanel({
      Container,
      Graphics,
      appStage: app.stage,
      index,
      scenario,
      sheet,
    });
  }
  options.root.dataset.pixiStatus = "ready";
  options.root.dataset.qaReady = "true";
}

function drawScenarioPanel(options: {
  appStage: PixiContainer;
  Container: PixiContainerCtor;
  Graphics: PixiGraphicsCtor;
  index: number;
  scenario: PlayerMechQaScenario;
  sheet: PixiGraphics;
}): void {
  const origin = panelOrigin(options.index);
  drawPanelFrame(options.sheet, options.scenario, origin.x, origin.y);

  const panel = new options.Container();
  panel.position.set(origin.x, origin.y);
  options.appStage.addChild(panel);

  const center = {
    x: options.scenario.width * 0.5,
    y: options.scenario.height * (options.scenario.focus === "mobile" ? 0.48 : 0.56),
  };
  const visuals = assembleRuntimeVisuals({
    budget: createVisualBudget("player"),
    catalog: wishcraftCatalog,
    entityRole: "player",
    loadout: options.scenario.loadout,
  });
  const cache = createCombatRenderCache();
  const screenEffects = new options.Container();
  const persistent = new options.Graphics();
  const attachments = new options.Container();
  const player = createPlayerMech(options.Graphics, animationForScenario(options.scenario));

  panel.addChild(screenEffects, persistent, attachments, player);

  syncScreenEffects({
    effectLayer: screenEffects,
    Graphics: options.Graphics,
    nowSeconds: options.scenario.nowSeconds,
    player: center,
    renderCache: cache,
    visualPolishVersion: VISUAL_POLISH_VERSION,
    visuals,
  });
  screenEffects.scale.set(options.scenario.scale);
  screenEffects.alpha = 0.7;
  drawPersistentWishcraftSourceVfx(persistent, {
    nowSeconds: options.scenario.nowSeconds,
    player: center,
    runtime: runtimeForScenario(options.scenario, center),
    xpShards: xpShardsForScenario(options.scenario, center),
  });
  persistent.scale.set(options.scenario.scale);
  persistent.position.set(center.x * (1 - options.scenario.scale), center.y * (1 - options.scenario.scale));
  syncPlayerVisualAttachments({
    attachmentLayer: attachments,
    Graphics: options.Graphics,
    nowSeconds: options.scenario.nowSeconds,
    player: center,
    renderCache: cache,
    visualPolishVersion: VISUAL_POLISH_VERSION,
    visuals,
  });
  attachments.scale.set(options.scenario.scale);

  redrawPlayerMechGraphic(player, animationForScenario(options.scenario));
  player.position.set(center.x, center.y);
  player.scale.set(options.scenario.scale);

  drawPanelLabel(options.sheet, options.scenario, origin.x, origin.y);
}

function drawSheetBackground(graphic: PixiGraphics, scenarios: readonly PlayerMechQaScenario[]): void {
  const size = sheetSizeForScenarios(scenarios);
  graphic.rect(0, 0, size.width, size.height).fill({ color: 0x050712, alpha: 1 });
  for (let y = 0; y <= size.height; y += 40) {
    graphic.moveTo(0, y).lineTo(size.width, y).stroke({ color: 0x12334b, width: 1, alpha: 0.16 });
  }
  for (let x = 0; x <= size.width; x += 40) {
    graphic.moveTo(x, 0).lineTo(x, size.height).stroke({ color: 0x12334b, width: 1, alpha: 0.12 });
  }
}

function drawPanelFrame(
  graphic: PixiGraphics,
  scenario: PlayerMechQaScenario,
  x: number,
  y: number,
): void {
  const accent = scenario.focus === "mobile" ? 0xff4fd8 : 0x44f5ff;
  graphic
    .rect(x + 1, y + 1, scenario.width - 2, scenario.height - 2)
    .fill({ color: scenario.focus === "mobile" ? 0x10081f : 0x071426, alpha: 0.7 })
    .rect(x + 1, y + 1, scenario.width - 2, scenario.height - 2)
    .stroke({ color: accent, width: 1, alpha: 0.38 })
    .circle(x + scenario.width * 0.5, y + scenario.height * 0.56, scenario.focus === "mobile" ? 138 : 116)
    .stroke({ color: accent, width: 1, alpha: 0.14 })
    .circle(x + scenario.width * 0.5, y + scenario.height * 0.56, scenario.focus === "mobile" ? 80 : 68)
    .stroke({ color: 0xe8fbff, width: 1, alpha: 0.11 });
}

function drawPanelLabel(
  graphic: PixiGraphics,
  scenario: PlayerMechQaScenario,
  x: number,
  y: number,
): void {
  const stripColor = scenario.focus === "mobile" ? 0xff4fd8 : 0x44f5ff;
  graphic
    .rect(x + 10, y + 10, Math.min(scenario.width - 20, 232), 20)
    .fill({ color: 0x020612, alpha: 0.78 })
    .rect(x + 13, y + 15, 40 + scenario.loadout.length * 10, 2)
    .fill({ color: stripColor, alpha: 0.62 })
    .rect(x + 13, y + 21, 90 + scenario.movement.strength * 80, 2)
    .fill({ color: 0xe8fbff, alpha: 0.38 });
}

function animationForScenario(scenario: PlayerMechQaScenario): PlayerMechAnimationState {
  const animation = playerMechAnimationState({
    movement: scenario.movement,
    nowSeconds: scenario.nowSeconds,
  });
  return {
    ...animation,
    hitFlash: scenario.hitFlash,
    idleFrame: scenario.idleFrameOverride ?? animation.idleFrame,
    wishInstallProgress: scenario.wishInstallProgress,
  };
}

function runtimeForScenario(scenario: PlayerMechQaScenario, center: { x: number; y: number }) {
  const runtime = createWishcraftRuntimeState();
  if (scenario.runtimeKind !== "shield-summon-magnet") {
    return runtime;
  }

  runtime.shield = {
    capacity: 56,
    nextRegenAtSeconds: 0,
    regenDelaySeconds: 4,
    value: 38,
  };
  runtime.summons = [
    { craftId: "qa-player-gravity", id: `${scenario.id}-summon-0`, orbitRadius: 72, position: { x: center.x + 84, y: center.y - 42 } },
    { craftId: "qa-player-gravity", id: `${scenario.id}-summon-1`, orbitRadius: 84, position: { x: center.x - 78, y: center.y + 54 } },
  ];
  return runtime;
}

function xpShardsForScenario(scenario: PlayerMechQaScenario, center: { x: number; y: number }): XpShard[] {
  if (scenario.runtimeKind !== "shield-summon-magnet") {
    return [];
  }
  return Array.from({ length: scenario.focus === "mobile" ? 11 : 8 }, (_, index) => {
    const angle = index * 0.72;
    const radius = 102 + (index % 4) * 18;
    return {
      attracted: true,
      id: `${scenario.id}-xp-${index}`,
      position: {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      },
      value: 4 + (index % 3) * 2,
    };
  });
}

function panelOrigin(index: number): { x: number; y: number } {
  const gap = 16;
  if (index < 3) {
    return { x: gap + index * (360 + gap), y: gap };
  }
  return { x: gap + index * (360 + gap), y: gap };
}

function sheetSizeForScenarios(scenarios: readonly PlayerMechQaScenario[]): { width: number; height: number } {
  const gap = 16;
  const width = scenarios.reduce((sum, scenario) => sum + scenario.width, 0) + gap * (scenarios.length + 1);
  const height = Math.max(...scenarios.map((scenario) => scenario.height)) + gap * 2;
  return { width, height };
}

function createPlayerQaLoadout(wishcrafts: readonly Wishcraft[]): Wishcraft[] {
  return wishcrafts.map((wishcraft) => ({
    ...wishcraft,
    mechanicPieceIds: [...wishcraft.mechanicPieceIds],
    parameters: { ...wishcraft.parameters },
    visualPieceIds: [...wishcraft.visualPieceIds],
  }));
}

function craft(
  id: string,
  primaryThemeId: string,
  primaryMechanicId: string,
  slots: readonly string[],
  parameters: Record<string, unknown>,
): Wishcraft {
  const visualPieceIds = slots.map((slot) => {
    const piece = wishcraftCatalog.visualPieces.find(
      (candidate) => candidate.themeId === primaryThemeId && candidate.slot === slot,
    );
    return piece?.id ?? "";
  }).filter((visualPieceId) => visualPieceId.length > 0);
  return {
    id,
    mechanicPieceIds: [primaryMechanicId],
    name: { cn: id, en: id },
    parameters,
    primaryMechanicId,
    primaryThemeId,
    sourceWish: "player mech visual QA",
    visualPieceIds,
  };
}

function isRealBrowserCanvas(canvas: HTMLCanvasElement): boolean {
  const userAgent = canvas.ownerDocument.defaultView?.navigator.userAgent ?? "";
  return typeof canvas.getContext === "function" && !userAgent.includes("jsdom");
}
