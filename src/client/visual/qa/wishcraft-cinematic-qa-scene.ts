import { wishcraftCatalog } from "../../../shared/wishcraft/catalog.js";
import type { Wishcraft } from "../../../shared/wishcraft/types.js";
import type { CombatFeedback } from "../../simulation/combat-loop.js";
import type { Point } from "../../simulation/arena-math.js";
import {
  createWishcraftCinematicGraphic,
  updateWishcraftCinematicGraphic,
  type ActiveWishcraftCinematicGraphic,
} from "../wishcraft-cinematic-vfx.js";
import {
  createWishcraftPatternGraphic,
  updateWishcraftPatternGraphic,
  type ActiveWishcraftPatternGraphic,
} from "../wishcraft-pattern-vfx.js";
import {
  createWishcraftEvolvedGraphic,
  updateWishcraftEvolvedGraphic,
  type ActiveWishcraftEvolvedGraphic,
} from "../wishcraft-evolved-vfx.js";
import {
  createParticleCloudVfxGraphic,
  updateParticleCloudVfxGraphic,
  type ActiveParticleCloudGraphic,
} from "../wishcraft-particle-cloud-vfx.js";

type PixiApplicationCtor = typeof import("pixi.js").Application;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;
type PixiContainer = import("pixi.js").Container;
type PixiGraphics = import("pixi.js").Graphics;

export interface WishcraftCinematicQaScenario {
  id: string;
  label: string;
  mechanicId: string;
  themeId: string;
  visualKind: string;
}

const panelWidth = 360;
const panelHeight = 300;
const sheetColumns = 4;

export function createWishcraftCinematicQaScenarios(): WishcraftCinematicQaScenario[] {
  return [
    { id: "beam-plasma", label: "Plasma Beam Overdrive", mechanicId: "projectile-beam", themeId: "plasma", visualKind: "beam" },
    { id: "lance-starfire", label: "Starfire Lance Break", mechanicId: "projectile-lance", themeId: "starfire", visualKind: "lance" },
    { id: "scatter-neon", label: "Neon Scatter Barrage", mechanicId: "projectile-scatter", themeId: "neon", visualKind: "scatter" },
    { id: "spiral-quantum", label: "Quantum Spiral Helix", mechanicId: "projectile-spiral", themeId: "quantum", visualKind: "spiral" },
    { id: "ricochet-magnetic", label: "Magnetic Ricochet Nodes", mechanicId: "projectile-ricochet", themeId: "magnetic", visualKind: "ricochet" },
    { id: "missile-meteor", label: "Meteor Missile Bloom", mechanicId: "projectile-missile", themeId: "meteor", visualKind: "missile" },
    { id: "nova-frost", label: "Frost Nova Detonation", mechanicId: "area-burst-nova", themeId: "frost", visualKind: "area" },
    { id: "blade-dragon", label: "Dragon Blade Storm", mechanicId: "melee-saw", themeId: "dragon", visualKind: "melee" },
    { id: "summon-gravity", label: "Gravity Summon Salvo", mechanicId: "summon-orbiter", themeId: "gravity", visualKind: "summon" },
    { id: "shield-angel", label: "Angel Shield Prism", mechanicId: "shield-capacity", themeId: "angel", visualKind: "shield" },
    { id: "pickup-void", label: "Void Pickup Vortex", mechanicId: "pickup-magnet", themeId: "void", visualKind: "pickup" },
    { id: "trigger-clockwork", label: "Clockwork Trigger Rupture", mechanicId: "trigger-on-kill", themeId: "clockwork", visualKind: "trigger" },
  ];
}

export function wishcraftCinematicQaCoverageSummary(
  scenarios = createWishcraftCinematicQaScenarios(),
): {
  scenarioCount: number;
  themeCount: number;
  visualKindCount: number;
} {
  return {
    scenarioCount: scenarios.length,
    themeCount: new Set(scenarios.map((scenario) => scenario.themeId)).size,
    visualKindCount: new Set(scenarios.map((scenario) => scenario.visualKind)).size,
  };
}

export async function bootWishcraftCinematicQaScene(options: {
  canvas: HTMLCanvasElement;
  root: HTMLElement;
}): Promise<void> {
  if (!isRealBrowserCanvas(options.canvas)) {
    options.root.dataset.pixiStatus = "skipped";
    return;
  }

  const { Application, Graphics } = await import("pixi.js");
  const scenarios = createWishcraftCinematicQaScenarios();
  const rows = Math.ceil(scenarios.length / sheetColumns);
  options.canvas.width = panelWidth * sheetColumns;
  options.canvas.height = panelHeight * rows;

  const app = new Application();
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
      appStage: app.stage,
      Graphics,
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
  Graphics: PixiGraphicsCtor;
  index: number;
  scenario: WishcraftCinematicQaScenario;
  sheet: PixiGraphics;
}): void {
  const x = (options.index % sheetColumns) * panelWidth;
  const y = Math.floor(options.index / sheetColumns) * panelHeight;
  const center = { x: x + panelWidth * 0.5, y: y + panelHeight * 0.55 };
  const origin = { x: center.x - 118, y: center.y + 28 };
  const position = { x: center.x + 116, y: center.y - 18 };
  const craft = craftForScenario(options.scenario);
  const event = hitForScenario(options.scenario, craft, origin, position);

  drawPanelBackground(options.sheet, options.scenario, x, y);
  addPattern(options, event, craft);
  addEvolved(options, event, craft);
  addParticleCloud(options, event, craft);
  addCinematic(options, event, craft);
  drawEmitterAndTarget(options.sheet, origin, position, options.index);
}

function addEvolved(
  options: { appStage: PixiContainer; Graphics: PixiGraphicsCtor },
  event: CombatFeedback,
  craft: Wishcraft,
): void {
  const evolved = createWishcraftEvolvedGraphic(event, options.Graphics, [craft]);
  if (!evolved) {
    return;
  }
  const active: ActiveWishcraftEvolvedGraphic = {
    ...evolved,
    bornAtSeconds: 0,
  };
  updateWishcraftEvolvedGraphic(active, 0.24);
  active.graphic.alpha = Math.min(0.92, active.graphic.alpha + 0.16);
  options.appStage.addChild(active.graphic);
}

function addCinematic(
  options: { appStage: PixiContainer; Graphics: PixiGraphicsCtor },
  event: CombatFeedback,
  craft: Wishcraft,
): void {
  const cinematic = createWishcraftCinematicGraphic(event, options.Graphics, [craft]);
  if (!cinematic) {
    return;
  }
  const active: ActiveWishcraftCinematicGraphic = {
    ...cinematic,
    bornAtSeconds: 0,
  };
  updateWishcraftCinematicGraphic(active, 0.28);
  active.graphic.alpha = Math.min(1, active.graphic.alpha + 0.22);
  options.appStage.addChild(active.graphic);
}

function addPattern(
  options: { appStage: PixiContainer; Graphics: PixiGraphicsCtor },
  event: CombatFeedback,
  craft: Wishcraft,
): void {
  const pattern = createWishcraftPatternGraphic(event, options.Graphics, [craft]);
  if (!pattern) {
    return;
  }
  const active: ActiveWishcraftPatternGraphic = {
    ...pattern,
    bornAtSeconds: 0,
  };
  updateWishcraftPatternGraphic(active, 0.3);
  active.graphic.alpha = 0.7;
  options.appStage.addChild(active.graphic);
}

function addParticleCloud(
  options: { appStage: PixiContainer; Graphics: PixiGraphicsCtor },
  event: CombatFeedback,
  craft: Wishcraft,
): void {
  const cloud = createParticleCloudVfxGraphic(event, options.Graphics, [craft]);
  if (!cloud) {
    return;
  }
  const active: ActiveParticleCloudGraphic = {
    ...cloud,
    bornAtSeconds: 0,
  };
  updateParticleCloudVfxGraphic(active, 0.3);
  active.graphic.alpha = 0.82;
  options.appStage.addChild(active.graphic);
}

function drawSheetFrame(graphic: PixiGraphics, rows: number): void {
  graphic.rect(0, 0, panelWidth * sheetColumns, panelHeight * rows).fill({ color: 0x050712, alpha: 1 });
  for (let col = 0; col <= sheetColumns; col += 1) {
    const x = col * panelWidth;
    graphic.moveTo(x, 0).lineTo(x, panelHeight * rows).stroke({ color: 0x12334b, width: 1, alpha: 0.48 });
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = row * panelHeight;
    graphic.moveTo(0, y).lineTo(panelWidth * sheetColumns, y).stroke({ color: 0x12334b, width: 1, alpha: 0.48 });
  }
}

function drawPanelBackground(
  graphic: PixiGraphics,
  scenario: WishcraftCinematicQaScenario,
  x: number,
  y: number,
): void {
  const theme = wishcraftCatalog.themeTags.find((candidate) => candidate.id === scenario.themeId);
  const color = Number.parseInt((theme?.palette.primary ?? "#44f5ff").replace("#", ""), 16);
  const accent = Number.parseInt((theme?.palette.accent ?? "#e8fbff").replace("#", ""), 16);
  graphic
    .rect(x + 1, y + 1, panelWidth - 2, panelHeight - 2)
    .fill({ color, alpha: 0.04 })
    .circle(x + panelWidth * 0.5, y + panelHeight * 0.55, 108)
    .stroke({ color, width: 1, alpha: 0.18 })
    .circle(x + panelWidth * 0.5, y + panelHeight * 0.55, 64)
    .stroke({ color: accent, width: 1, alpha: 0.14 })
    .rect(x + 12, y + 12, 140, 3)
    .fill({ color: accent, alpha: 0.72 })
    .rect(x + 12, y + 22, 94, 2)
    .fill({ color, alpha: 0.48 });
}

function drawEmitterAndTarget(
  graphic: PixiGraphics,
  origin: { x: number; y: number },
  position: { x: number; y: number },
  index: number,
): void {
  graphic
    .circle(origin.x, origin.y, 8)
    .fill({ color: 0xe8fbff, alpha: 0.28 })
    .circle(position.x, position.y, 9)
    .stroke({ color: index % 2 === 0 ? 0xff4fd8 : 0x44f5ff, width: 2, alpha: 0.48 })
    .moveTo(origin.x, origin.y)
    .lineTo(position.x, position.y)
    .stroke({ color: 0xe8fbff, width: 1, alpha: 0.16 });
}

function craftForScenario(scenario: WishcraftCinematicQaScenario): Wishcraft {
  const visualPieceIds = wishcraftCatalog.visualPieces
    .filter((piece) => piece.themeId === scenario.themeId)
    .slice(0, 4)
    .map((piece) => piece.id);
  return {
    id: `qa-cinematic-${scenario.id}`,
    mechanicPieceIds: [scenario.mechanicId],
    name: { cn: scenario.label, en: scenario.label },
    parameters: {
      blastRadius: 150,
      damageScale: 1.25,
      projectileCount: 6,
    },
    primaryMechanicId: scenario.mechanicId,
    primaryThemeId: scenario.themeId,
    sourceWish: "cinematic vfx qa",
    visualPieceIds,
  };
}

function hitForScenario(
  scenario: WishcraftCinematicQaScenario,
  craft: Wishcraft,
  origin: Point,
  position: Point,
): CombatFeedback {
  return {
    kind: "wishcraft-hit",
    mechanicId: scenario.mechanicId,
    origin,
    position,
    visualKind: scenario.visualKind,
    wishcraftId: craft.id,
  };
}

function isRealBrowserCanvas(canvas: HTMLCanvasElement): boolean {
  const userAgent = canvas.ownerDocument.defaultView?.navigator.userAgent ?? "";
  return typeof canvas.getContext === "function" && !userAgent.includes("jsdom");
}
