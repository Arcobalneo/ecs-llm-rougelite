import type { BossMechSilhouette, BossPlanEntry } from "../../../shared/boss/boss-planning.js";
import type { ThemeId } from "../../../shared/wishcraft/types.js";
import type { BossSpriteAnimationState } from "../combat-entity-animation.js";
import { drawPixelGlow } from "../pixel-primitives.js";
import { createBossGraphic } from "../boss-entity-sprites.js";

type PixiApplicationCtor = typeof import("pixi.js").Application;
type PixiContainer = import("pixi.js").Container;
type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface BossActionPoseQaScenario {
  animation: BossSpriteAnimationState;
  healthProgress: number;
  id: string;
  label: string;
  scale: number;
  silhouette: BossMechSilhouette;
  themeId: ThemeId;
}

const panelWidth = 460;
const panelHeight = 360;
const sheetColumns = 3;

export function createBossActionPoseQaScenarios(): BossActionPoseQaScenario[] {
  return [
    scenario("flying-entrance", "FLYING / ENTRANCE", "flying", "frost", 1, animation({ entranceAlpha: 0.36, jawOpen: 0.5, telegraph: 0.68, wingSpread: 1.08 })),
    scenario("flying-attack", "FLYING / ATTACK", "flying", "frost", 0.74, animation({ jawOpen: 0.3, telegraph: 0.92, wingSpread: 1.22 })),
    scenario("flying-low", "FLYING / LOW HP", "flying", "frost", 0.16, animation({ hitFlashAlpha: 0.16, jawOpen: 0.26, telegraph: 0.42, wingSpread: 1.15 })),
    scenario("crawling-entrance", "CRAWLING / ENTRANCE", "crawling", "solar", 1, animation({ entranceAlpha: 0.34, jawOpen: 0.54, telegraph: 0.7 })),
    scenario("crawling-attack", "CRAWLING / ATTACK", "crawling", "solar", 0.7, animation({ frame: 1, jawOpen: 0.4, telegraph: 0.94, wingSpread: 1.08 })),
    scenario("crawling-low", "CRAWLING / LOW HP", "crawling", "solar", 0.14, animation({ frame: 2, hitFlashAlpha: 0.18, jawOpen: 0.24, telegraph: 0.38 })),
    scenario("humanoid-entrance", "HUMANOID / ENTRANCE", "humanoid", "crystal", 1, animation({ entranceAlpha: 0.38, jawOpen: 0.44, telegraph: 0.64 })),
    scenario("humanoid-attack", "HUMANOID / ATTACK", "humanoid", "crystal", 0.72, animation({ jawOpen: 0.28, telegraph: 0.92 })),
    scenario("humanoid-low", "HUMANOID / LOW HP", "humanoid", "crystal", 0.12, animation({ hitFlashAlpha: 0.18, jawOpen: 0.22, telegraph: 0.34 })),
  ];
}

export function bossActionPoseQaCoverageSummary(
  scenarios = createBossActionPoseQaScenarios(),
): {
  attackPanels: number;
  entrancePanels: number;
  lowHealthPanels: number;
  scenarioCount: number;
  silhouetteCount: number;
} {
  return {
    attackPanels: scenarios.filter((scenario) => scenario.id.endsWith("-attack")).length,
    entrancePanels: scenarios.filter((scenario) => scenario.id.endsWith("-entrance")).length,
    lowHealthPanels: scenarios.filter((scenario) => scenario.healthProgress < 0.25).length,
    scenarioCount: scenarios.length,
    silhouetteCount: new Set(scenarios.map((scenario) => scenario.silhouette)).size,
  };
}

export async function bootBossActionPoseQaScene(options: {
  canvas: HTMLCanvasElement;
  root: HTMLElement;
}): Promise<void> {
  if (!isRealBrowserCanvas(options.canvas)) {
    options.root.dataset.pixiStatus = "skipped";
    return;
  }

  const { Application, Container, Graphics } = await import("pixi.js");
  const scenarios = createBossActionPoseQaScenarios();
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
  for (const [index, qaScenario] of scenarios.entries()) {
    drawScenarioPanel({
      Container,
      Graphics,
      appStage: app.stage,
      index,
      scenario: qaScenario,
      sheet,
    });
  }
  options.root.dataset.pixiStatus = "ready";
  options.root.dataset.qaReady = "true";
}

function scenario(
  id: string,
  label: string,
  silhouette: BossMechSilhouette,
  themeId: ThemeId,
  healthProgress: number,
  animationState: BossSpriteAnimationState,
): BossActionPoseQaScenario {
  return {
    animation: animationState,
    healthProgress,
    id,
    label,
    scale: scaleForSilhouette(silhouette),
    silhouette,
    themeId,
  };
}

function animation(overrides: Partial<BossSpriteAnimationState>): BossSpriteAnimationState {
  return {
    auraPulse: 1.06,
    entranceAlpha: 1,
    frame: 0,
    hitFlashAlpha: 0,
    jawOpen: 0,
    telegraph: 0,
    wingSpread: 1,
    ...overrides,
  };
}

function drawScenarioPanel(options: {
  appStage: PixiContainer;
  Container: typeof import("pixi.js").Container;
  Graphics: PixiGraphicsCtor;
  index: number;
  scenario: BossActionPoseQaScenario;
  sheet: PixiGraphics;
}): void {
  const x = (options.index % sheetColumns) * panelWidth;
  const y = Math.floor(options.index / sheetColumns) * panelHeight;
  const center = { x: x + panelWidth * 0.5, y: y + panelHeight * 0.58 };
  const boss = createBossGraphic({
    Graphics: options.Graphics,
    animation: options.scenario.animation,
    boss: bossPlanForScenario(options.scenario),
    index: options.index,
  });

  drawPanelBackground(options.sheet, options.scenario, x, y);
  boss.position.set(center.x, center.y);
  boss.scale.set(options.scenario.scale);
  const panel = new options.Container();
  panel.addChild(boss);
  options.appStage.addChild(panel);
  drawPanelLabel(options.sheet, options.scenario, x, y);
}

function bossPlanForScenario(scenario: BossActionPoseQaScenario): BossPlanEntry {
  return {
    compatibleSilhouettes: [scenario.silhouette],
    name: scenario.label,
    rivalThemeId: scenario.themeId,
    silhouette: scenario.silhouette,
    templateId: `qa-${scenario.silhouette}`,
    visualPieceIds: [
      `core-${scenario.themeId}-0`,
      `head-${scenario.themeId}-1`,
      `arm-${scenario.themeId}-2`,
      `back-${scenario.themeId}-3`,
    ],
  };
}

function scaleForSilhouette(silhouette: BossMechSilhouette): number {
  if (silhouette === "flying") {
    return 0.86;
  }
  if (silhouette === "crawling") {
    return 0.84;
  }
  return 0.82;
}

function drawSheetFrame(graphic: PixiGraphics, rows: number): void {
  graphic.rect(0, 0, panelWidth * sheetColumns, panelHeight * rows).fill({ color: 0x050712, alpha: 1 });
  for (let col = 0; col <= sheetColumns; col += 1) {
    const x = col * panelWidth;
    graphic.moveTo(x, 0).lineTo(x, panelHeight * rows).stroke({ color: 0x12334b, width: 1, alpha: 0.52 });
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = row * panelHeight;
    graphic.moveTo(0, y).lineTo(panelWidth * sheetColumns, y).stroke({ color: 0x12334b, width: 1, alpha: 0.52 });
  }
}

function drawPanelBackground(
  graphic: PixiGraphics,
  scenario: BossActionPoseQaScenario,
  x: number,
  y: number,
): void {
  const color = scenario.silhouette === "flying"
    ? 0x44f5ff
    : scenario.silhouette === "crawling"
      ? 0xffd166
      : 0xff4fd8;
  graphic
    .rect(x + 1, y + 1, panelWidth - 2, panelHeight - 2)
    .fill({ color, alpha: 0.035 })
    .rect(x + 1, y + 1, panelWidth - 2, panelHeight - 2)
    .stroke({ color, width: 1, alpha: 0.24 });
  drawPixelGlow(graphic, x + panelWidth * 0.5, y + panelHeight * 0.57, 112, color, 0.06);
  graphic
    .circle(x + panelWidth * 0.5, y + panelHeight * 0.57, 124)
    .stroke({ color, width: 1, alpha: 0.14 })
    .circle(x + panelWidth * 0.5, y + panelHeight * 0.57, 72)
    .stroke({ color: 0xe8fbff, width: 1, alpha: 0.1 });
}

function drawPanelLabel(
  graphic: PixiGraphics,
  scenario: BossActionPoseQaScenario,
  x: number,
  y: number,
): void {
  const color = scenario.silhouette === "flying"
    ? 0x44f5ff
    : scenario.silhouette === "crawling"
      ? 0xffd166
      : 0xff4fd8;
  graphic
    .rect(x + 14, y + 16, 136, 3)
    .fill({ color, alpha: 0.74 })
    .rect(x + 14, y + 26, 72 + scenario.animation.telegraph * 72, 2)
    .fill({ color: 0xe8fbff, alpha: 0.38 });
}

function isRealBrowserCanvas(canvas: HTMLCanvasElement): boolean {
  const userAgent = canvas.ownerDocument.defaultView?.navigator.userAgent ?? "";
  return typeof canvas.getContext === "function" && !userAgent.includes("jsdom");
}
