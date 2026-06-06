import type { BossSpriteAnimationState } from "../../combat-entity-animation.js";
import type { PixelPalette } from "../../pixel-primitives.js";

export type PixiGraphics = import("pixi.js").Graphics;
export type PixiGraphicsCtor = typeof import("pixi.js").Graphics;
export type PixiContainer = import("pixi.js").Container;

export interface BossSpriteRenderCache {
  bossIds: string;
  bosses: PixiGraphics[];
}

export interface BossSilhouetteDrawOptions {
  animation: BossSpriteAnimationState;
  graphic: PixiGraphics;
  healthProgress: number;
  palette: PixelPalette;
}
