import type { CombatFeedback } from "../../simulation/combat-loop.js";
import {
  baseKitFrameSignature,
  createBaseKitVfxGraphic,
  updateBaseKitVfxGraphic,
  type ActiveBaseKitGraphic,
} from "../base-kit-vfx.js";
import {
  resolveBaseKitEmitterSocket,
  withBaseKitEmitterOrigin,
} from "../base-kit-emitter-sockets.js";

type PixiApplicationCtor = typeof import("pixi.js").Application;
type PixiContainer = import("pixi.js").Container;
type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface BaseKitWeaponQaScenario {
  distance: number;
  id: string;
  label: string;
  progress: number;
  visualKind: "laser-sword" | "machine-gun";
}

const panelWidth = 320;
const panelHeight = 260;
const sheetColumns = 3;

export function createBaseKitWeaponQaScenarios(): BaseKitWeaponQaScenario[] {
  return [
    { distance: 270, id: "mg-windup", label: "MACHINE GUN / WINDUP", progress: 0.08, visualKind: "machine-gun" },
    { distance: 318, id: "mg-active", label: "MACHINE GUN / ACTIVE", progress: 0.44, visualKind: "machine-gun" },
    { distance: 244, id: "mg-fade", label: "MACHINE GUN / FADE", progress: 0.84, visualKind: "machine-gun" },
    { distance: 86, id: "sword-windup", label: "LASER SWORD / WINDUP", progress: 0.08, visualKind: "laser-sword" },
    { distance: 92, id: "sword-active", label: "LASER SWORD / ACTIVE", progress: 0.44, visualKind: "laser-sword" },
    { distance: 76, id: "sword-fade", label: "LASER SWORD / FADE", progress: 0.84, visualKind: "laser-sword" },
  ];
}

export function baseKitWeaponQaCoverageSummary(
  scenarios = createBaseKitWeaponQaScenarios(),
): {
  frameSignatureCount: number;
  scenarioCount: number;
  socketShiftedFrameCount: number;
  weaponCount: number;
} {
  return {
    frameSignatureCount: new Set(scenarios.map((scenario) => (
      baseKitFrameSignature(socketEventForScenario(scenario), scenario.progress)
    ))).size,
    scenarioCount: scenarios.length,
    socketShiftedFrameCount: scenarios.filter((scenario) => {
      const simulationEvent = eventForScenario(scenario);
      const socketEvent = socketEventForScenario(scenario);
      return socketEvent.kind === "impact" &&
        simulationEvent.origin !== undefined &&
        socketEvent.origin !== undefined &&
        (simulationEvent.origin.x !== socketEvent.origin.x || simulationEvent.origin.y !== socketEvent.origin.y);
    }).length,
    weaponCount: new Set(scenarios.map((scenario) => scenario.visualKind)).size,
  };
}

export async function bootBaseKitWeaponQaScene(options: {
  canvas: HTMLCanvasElement;
  root: HTMLElement;
}): Promise<void> {
  if (!isRealBrowserCanvas(options.canvas)) {
    options.root.dataset.pixiStatus = "skipped";
    return;
  }

  const { Application, Container, Graphics } = await import("pixi.js");
  const scenarios = createBaseKitWeaponQaScenarios();
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
  scenario: BaseKitWeaponQaScenario;
  sheet: PixiGraphics;
}): void {
  const x = (options.index % sheetColumns) * panelWidth;
  const y = Math.floor(options.index / sheetColumns) * panelHeight;
  const origin = {
    x: x + (options.scenario.visualKind === "machine-gun" ? 34 : panelWidth * 0.47),
    y: y + panelHeight * 0.58,
  };
  const simulationEvent = eventForScenario(options.scenario, origin);
  const socket = resolveBaseKitEmitterSocket({ event: simulationEvent });
  const event = withBaseKitEmitterOrigin(simulationEvent, socket);
  if (event.kind !== "impact") {
    return;
  }
  const effect = createBaseKitVfxGraphic(event, options.Graphics);
  if (!effect) {
    return;
  }

  drawPanelBackground(options.sheet, options.scenario, x, y);
  drawOriginAndTarget(options.sheet, {
    event,
    scenario: options.scenario,
    simulationOrigin: simulationEvent.origin,
  });
  const active: ActiveBaseKitGraphic = {
    ...effect,
    bornAtSeconds: 0,
  };
  updateBaseKitVfxGraphic(active, options.scenario.progress);

  const panel = new options.Container();
  panel.addChild(active.graphic);
  options.appStage.addChild(panel);
  drawPanelLabel(options.sheet, options.scenario, x, y);
}

function eventForScenario(
  scenario: BaseKitWeaponQaScenario,
  origin = { x: 0, y: 0 },
): Extract<CombatFeedback, { kind: "impact" }> {
  const angle = scenario.visualKind === "machine-gun" ? -0.12 : 0.34;
  return {
    kind: "impact",
    origin,
    position: {
      x: origin.x + Math.cos(angle) * scenario.distance,
      y: origin.y + Math.sin(angle) * scenario.distance,
    },
    visualKind: scenario.visualKind,
  };
}

function socketEventForScenario(scenario: BaseKitWeaponQaScenario): Extract<CombatFeedback, { kind: "impact" }> {
  const event = eventForScenario(scenario);
  const socketEvent = withBaseKitEmitterOrigin(
    event,
    resolveBaseKitEmitterSocket({ event }),
  );
  if (socketEvent.kind !== "impact") {
    return event;
  }
  return socketEvent;
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
  scenario: BaseKitWeaponQaScenario,
  x: number,
  y: number,
): void {
  const color = scenario.visualKind === "machine-gun" ? 0x44f5ff : 0xff4fd8;
  const accent = scenario.visualKind === "machine-gun" ? 0xe8fbff : 0x44f5ff;
  graphic
    .rect(x + 1, y + 1, panelWidth - 2, panelHeight - 2)
    .fill({ color, alpha: 0.035 })
    .circle(x + panelWidth * 0.5, y + panelHeight * 0.58, 88)
    .stroke({ color, width: 1, alpha: 0.16 })
    .circle(x + panelWidth * 0.5, y + panelHeight * 0.58, 48)
    .stroke({ color: accent, width: 1, alpha: 0.12 });
}

function drawOriginAndTarget(
  graphic: PixiGraphics,
  options: {
    event: Extract<CombatFeedback, { kind: "impact" }>;
    scenario: BaseKitWeaponQaScenario;
    simulationOrigin: { x: number; y: number } | undefined;
  },
): void {
  const color = options.scenario.visualKind === "machine-gun" ? 0x44f5ff : 0xff4fd8;
  const simulationOrigin = options.simulationOrigin ?? options.event.origin ?? { x: 0, y: 0 };
  graphic
    .circle(simulationOrigin.x, simulationOrigin.y, 8)
    .stroke({ color: 0xe8fbff, width: 1, alpha: 0.16 })
    .circle(options.event.origin?.x ?? 0, options.event.origin?.y ?? 0, 7)
    .fill({ color: 0xe8fbff, alpha: 0.24 })
    .circle(options.event.position.x, options.event.position.y, 9)
    .stroke({ color, width: 2, alpha: 0.36 });
}

function drawPanelLabel(
  graphic: PixiGraphics,
  scenario: BaseKitWeaponQaScenario,
  x: number,
  y: number,
): void {
  const color = scenario.visualKind === "machine-gun" ? 0x44f5ff : 0xff4fd8;
  graphic
    .rect(x + 14, y + 16, 132, 3)
    .fill({ color, alpha: 0.74 })
    .rect(x + 14, y + 26, 92, 2)
    .fill({ color: 0xe8fbff, alpha: 0.38 });
}

function isRealBrowserCanvas(canvas: HTMLCanvasElement): boolean {
  const userAgent = canvas.ownerDocument.defaultView?.navigator.userAgent ?? "";
  return typeof canvas.getContext === "function" && !userAgent.includes("jsdom");
}
