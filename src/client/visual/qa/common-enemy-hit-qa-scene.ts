import { wishcraftCatalog } from "../../../shared/wishcraft/catalog.js";
import type { ThemeId, Wishcraft } from "../../../shared/wishcraft/types.js";
import type { CommonEnemyTemplate } from "../../simulation/combat.js";
import type { CombatFeedback, CombatLoopEnemy } from "../../simulation/combat-loop.js";
import type { EnemyDriftVisualState } from "../arena-visual-state.js";
import { enemySpriteAnimationState } from "../combat-entity-animation.js";
import {
  commonEnemyHitVfxProfile,
  createCommonEnemyHitVfxGraphic,
} from "../common-enemy-hit-vfx.js";
import { createCommonEnemyGraphic } from "../sprites/common-enemy-sprites.js";
import { assembleRuntimeVisuals, createVisualBudget } from "../visual-assembly.js";

type PixiApplicationCtor = typeof import("pixi.js").Application;
type PixiContainer = import("pixi.js").Container;
type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface CommonEnemyHitQaScenario {
  id: string;
  label: string;
  loadout: readonly Wishcraft[];
  targetRadius: number;
  targetTemplateId: CommonEnemyTemplate["id"];
  visualKind: "laser-sword" | "machine-gun" | "wishcraft";
}

const panelWidth = 320;
const panelHeight = 260;
const sheetColumns = 3;

const qaWishcraft = {
  ...wishcraftCatalog.fixtures.starLance,
  id: "qa-enemy-hit-wishcraft",
  primaryThemeId: "plasma",
  visualPieceIds: ["projectile-plasma-0", "impact-plasma-1", "trail-plasma-2"],
} satisfies Wishcraft;

export function createCommonEnemyHitQaScenarios(): CommonEnemyHitQaScenario[] {
  return [
    { id: "fast-mg", label: "FAST / MACHINE GUN", loadout: qaEnemyLoadout.slice(0, 2), targetRadius: 13, targetTemplateId: "fast-fragile", visualKind: "machine-gun" },
    { id: "slow-mg", label: "SLOW / MACHINE GUN", loadout: qaEnemyLoadout.slice(1, 3), targetRadius: 18, targetTemplateId: "slow-tough", visualKind: "machine-gun" },
    { id: "swarm-mg", label: "SWARM / MACHINE GUN", loadout: qaEnemyLoadout.slice(2, 4), targetRadius: 11, targetTemplateId: "swarm-fragile", visualKind: "machine-gun" },
    { id: "fast-wish", label: "FAST / WISHCRAFT", loadout: qaEnemyLoadout.slice(0, 4), targetRadius: 13, targetTemplateId: "fast-fragile", visualKind: "wishcraft" },
    { id: "slow-sword", label: "SLOW / LASER SWORD", loadout: qaEnemyLoadout.slice(1, 5), targetRadius: 18, targetTemplateId: "slow-tough", visualKind: "laser-sword" },
    { id: "swarm-wish", label: "SWARM / WISHCRAFT", loadout: qaEnemyLoadout.slice(0, 5), targetRadius: 11, targetTemplateId: "swarm-fragile", visualKind: "wishcraft" },
  ];
}

export function commonEnemyHitQaCoverageSummary(
  scenarios = createCommonEnemyHitQaScenarios(),
): {
  familyCount: number;
  maxLoadoutSize: number;
  scenarioCount: number;
  templateCount: number;
  visualKindCount: number;
} {
  return {
    familyCount: new Set(scenarios.map((scenario) => commonEnemyHitVfxProfile(eventForScenario(scenario))?.family)).size,
    maxLoadoutSize: Math.max(...scenarios.map((scenario) => scenario.loadout.length)),
    scenarioCount: scenarios.length,
    templateCount: new Set(scenarios.map((scenario) => scenario.targetTemplateId)).size,
    visualKindCount: new Set(scenarios.map((scenario) => scenario.visualKind)).size,
  };
}

export async function bootCommonEnemyHitQaScene(options: {
  canvas: HTMLCanvasElement;
  root: HTMLElement;
}): Promise<void> {
  if (!isRealBrowserCanvas(options.canvas)) {
    options.root.dataset.pixiStatus = "skipped";
    return;
  }

  const { Application, Container, Graphics } = await import("pixi.js");
  const scenarios = createCommonEnemyHitQaScenarios();
  const rows = Math.ceil(scenarios.length / sheetColumns);
  options.canvas.width = panelWidth * sheetColumns;
  options.canvas.height = panelHeight * rows;

  const app = new Application() as InstanceType<PixiApplicationCtor>;
  await app.init({
    antialias: false,
    backgroundAlpha: 1,
    backgroundColor: 0x050712,
    canvas: options.canvas,
    height: options.canvas.height,
    preference: "webgl",
    width: options.canvas.width,
  });

  const sheet = new Graphics();
  app.stage.addChild(sheet);
  drawSheetFrame(sheet, rows);
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
  Container: typeof import("pixi.js").Container;
  Graphics: PixiGraphicsCtor;
  index: number;
  scenario: CommonEnemyHitQaScenario;
  sheet: PixiGraphics;
}): void {
  const x = (options.index % sheetColumns) * panelWidth;
  const y = Math.floor(options.index / sheetColumns) * panelHeight;
  const center = { x: x + panelWidth * 0.5, y: y + panelHeight * 0.56 };
  const event = eventForScenario(options.scenario, center);
  const effect = createCommonEnemyHitVfxGraphic(event, options.Graphics, [qaWishcraft]);
  if (!effect) {
    return;
  }
  const enemy = createCommonEnemyGraphic({
    Graphics: options.Graphics,
    animation: enemyAnimationForScenario(options.scenario),
    drift: enemyDriftForScenario(options.scenario),
    enemy: enemyForScenario(options.scenario),
    visuals: assembleRuntimeVisuals({
      budget: createVisualBudget("common-enemy"),
      catalog: wishcraftCatalog,
      entityRole: "common-enemy",
      loadout: options.scenario.loadout,
    }),
  });

  drawPanelBackground(options.sheet, options.scenario, x, y);
  const panel = new options.Container();
  enemy.position.set(center.x, center.y);
  enemy.scale.set(options.scenario.targetTemplateId === "slow-tough" ? 2.1 : 2.35);
  panel.addChild(enemy);
  panel.addChild(effect.graphic);
  options.appStage.addChild(panel);
  drawPanelLabel(options.sheet, options.scenario, x, y);
}

function eventForScenario(
  scenario: CommonEnemyHitQaScenario,
  position = { x: 0, y: 0 },
): Extract<CombatFeedback, { kind: "impact" | "wishcraft-hit" }> {
  if (scenario.visualKind === "wishcraft") {
    return {
      kind: "wishcraft-hit",
      mechanicId: "projectile-lance",
      origin: { x: position.x - 120, y: position.y },
      position,
      targetRadius: scenario.targetRadius,
      targetTemplateId: scenario.targetTemplateId,
      visualKind: "lance",
      wishcraftId: qaWishcraft.id,
    };
  }

  return {
    kind: "impact",
    origin: { x: position.x - 120, y: position.y },
    position,
    targetRadius: scenario.targetRadius,
    targetTemplateId: scenario.targetTemplateId,
    visualKind: scenario.visualKind,
  };
}

function drawSheetFrame(graphic: PixiGraphics, rows: number): void {
  graphic.rect(0, 0, panelWidth * sheetColumns, panelHeight * rows).fill({ color: 0x050712, alpha: 1 });
  for (let col = 0; col <= sheetColumns; col += 1) {
    const x = col * panelWidth;
    graphic.moveTo(x, 0).lineTo(x, panelHeight * rows).stroke({ color: 0x12334b, width: 1, alpha: 0.5 });
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = row * panelHeight;
    graphic.moveTo(0, y).lineTo(panelWidth * sheetColumns, y).stroke({ color: 0x12334b, width: 1, alpha: 0.5 });
  }
}

function drawPanelBackground(
  graphic: PixiGraphics,
  scenario: CommonEnemyHitQaScenario,
  x: number,
  y: number,
): void {
  const color = scenario.targetTemplateId === "slow-tough"
    ? 0x62ff9d
    : scenario.targetTemplateId === "swarm-fragile"
      ? 0xff4fd8
      : 0x44f5ff;
  graphic
    .rect(x + 1, y + 1, panelWidth - 2, panelHeight - 2)
    .fill({ color, alpha: 0.035 })
    .circle(x + panelWidth * 0.5, y + panelHeight * 0.56, 78)
    .stroke({ color, width: 1, alpha: 0.16 })
    .circle(x + panelWidth * 0.5, y + panelHeight * 0.56, 36)
    .stroke({ color: 0xe8fbff, width: 1, alpha: 0.1 });
}

function drawPanelLabel(
  graphic: PixiGraphics,
  scenario: CommonEnemyHitQaScenario,
  x: number,
  y: number,
): void {
  const color = scenario.visualKind === "laser-sword"
    ? 0xff4fd8
    : scenario.visualKind === "wishcraft"
      ? 0x9b7dff
      : 0x44f5ff;
  graphic
    .rect(x + 14, y + 16, 128, 3)
    .fill({ color, alpha: 0.74 })
    .rect(x + 14, y + 26, 88, 2)
    .fill({ color: 0xe8fbff, alpha: 0.38 });
}

function isRealBrowserCanvas(canvas: HTMLCanvasElement): boolean {
  const userAgent = canvas.ownerDocument.defaultView?.navigator.userAgent ?? "";
  return typeof canvas.getContext === "function" && !userAgent.includes("jsdom");
}

function enemyForScenario(scenario: CommonEnemyHitQaScenario): CombatLoopEnemy {
  return {
    health: 1,
    id: `qa-hit-${scenario.id}`,
    nextContactAtSeconds: Number.POSITIVE_INFINITY,
    position: { x: 0, y: 0 },
    radius: scenario.targetRadius,
    templateId: scenario.targetTemplateId,
  };
}

function enemyAnimationForScenario(scenario: CommonEnemyHitQaScenario) {
  return {
    ...enemySpriteAnimationState({
      damaged: true,
      id: `qa-hit-${scenario.id}`,
      nowSeconds: scenario.visualKind === "laser-sword" ? 7.4 : 4.2,
      templateId: scenario.targetTemplateId,
    }),
    hitFlashAlpha: scenario.visualKind === "wishcraft" ? 0.82 : 0.68,
  };
}

function enemyDriftForScenario(scenario: CommonEnemyHitQaScenario): EnemyDriftVisualState {
  const themeIds = scenario.loadout
    .map((wishcraft) => wishcraft.primaryThemeId)
    .filter(isThemeId);
  return {
    accentColor: scenario.visualKind === "laser-sword" ? 0xffd6ff : 0xe8fbff,
    dominantThemeId: themeIds.at(-1),
    loadoutWindow: 3,
    secondaryThemeIds: themeIds.slice(-3, -1),
    tintColor: scenario.visualKind === "wishcraft" ? 0x9b7dff : scenario.targetTemplateId === "slow-tough" ? 0x62ff9d : 0x44f5ff,
  };
}

const qaEnemyLoadout = [
  craft("qa-hit-starfire", "starfire", "projectile-lance", ["aura", "projectile", "trail"]),
  craft("qa-hit-plasma", "plasma", "projectile-beam", ["weapon", "impact", "back"]),
  craft("qa-hit-dragon", "dragon", "melee-saw", ["arm", "weapon", "impact"]),
  craft("qa-hit-neon", "neon", "trigger-on-kill", ["head", "aura", "orbit"]),
  craft("qa-hit-crystal", "crystal", "area-burst-nova", ["core", "shoulder", "summon"]),
] satisfies Wishcraft[];

function craft(
  id: string,
  primaryThemeId: ThemeId,
  primaryMechanicId: string,
  slots: readonly string[],
): Wishcraft {
  return {
    id,
    mechanicPieceIds: [primaryMechanicId],
    name: { cn: id, en: id },
    parameters: {},
    primaryMechanicId,
    primaryThemeId,
    sourceWish: "common enemy hit qa",
    visualPieceIds: slots.map((slot, index) => `${slot}-${primaryThemeId}-${index}`),
  };
}

function isThemeId(themeId: string): themeId is ThemeId {
  return wishcraftCatalog.themeTags.some((theme) => theme.id === themeId);
}
