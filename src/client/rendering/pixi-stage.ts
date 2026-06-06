import { calculateCamera } from "../simulation/arena-math.js";
import type { ArenaRuntimeState } from "../simulation/arena-runtime.js";

export type PixiContainer = import("pixi.js").Container;
export type PixiGraphics = import("pixi.js").Graphics;
export type PixiContainerCtor = typeof import("pixi.js").Container;
export type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export const COMBAT_STAGE_LAYER_ORDER = [
  "horizon",
  "bossPresence",
  "bossEncounter",
  "lateRunField",
  "screenPulseLayer",
  "screenEffectLayer",
  "xpLayer",
  "enemyLayer",
  "summonLayer",
  "persistentSourceVfx",
  "trailResidueLayer",
  "projectileLayer",
  "launchLayer",
  "wishcraftPatternLayer",
  "playerAttachmentLayer",
  "playerReadabilityField",
  "player",
  "feedbackLayer",
] as const;

export type CombatStageLayerName = (typeof COMBAT_STAGE_LAYER_ORDER)[number];

export interface CombatStageLayers {
  bossEncounter: PixiGraphics;
  bossPresence: PixiGraphics;
  enemyLayer: PixiContainer;
  feedbackLayer: PixiContainer;
  horizon: PixiGraphics;
  lateRunField: PixiGraphics;
  launchLayer: PixiContainer;
  persistentSourceVfx: PixiGraphics;
  player: PixiGraphics;
  playerAttachmentLayer: PixiContainer;
  playerReadabilityField: PixiGraphics;
  projectileLayer: PixiContainer;
  screenEffectLayer: PixiContainer;
  screenPulseLayer: PixiContainer;
  stage: PixiContainer;
  summonLayer: PixiContainer;
  trailResidueLayer: PixiContainer;
  wishcraftPatternLayer: PixiContainer;
  xpLayer: PixiContainer;
}

export function createCombatStageLayers(options: {
  Container: PixiContainerCtor;
  Graphics: PixiGraphicsCtor;
  player: PixiGraphics;
}): CombatStageLayers {
  const layers: CombatStageLayers = {
    stage: new options.Container(),
    horizon: new options.Graphics(),
    bossPresence: new options.Graphics(),
    bossEncounter: new options.Graphics(),
    lateRunField: new options.Graphics(),
    screenPulseLayer: new options.Container(),
    screenEffectLayer: new options.Container(),
    xpLayer: new options.Container(),
    enemyLayer: new options.Container(),
    summonLayer: new options.Container(),
    persistentSourceVfx: new options.Graphics(),
    trailResidueLayer: new options.Container(),
    projectileLayer: new options.Container(),
    launchLayer: new options.Container(),
    wishcraftPatternLayer: new options.Container(),
    playerAttachmentLayer: new options.Container(),
    playerReadabilityField: new options.Graphics(),
    player: options.player,
    feedbackLayer: new options.Container(),
  };

  layers.stage.addChild(...COMBAT_STAGE_LAYER_ORDER.map((layerName) => layers[layerName]));
  return layers;
}

export function applyCombatCamera(stage: PixiContainer, state: ArenaRuntimeState): void {
  const camera = calculateCamera({ player: state.position, viewport: state.viewport });
  stage.position.set(-camera.x * state.viewport.scale, -camera.y * state.viewport.scale);
  stage.scale.set(state.viewport.scale);
}
