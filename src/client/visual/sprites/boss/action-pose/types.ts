import type { BossMechSilhouette } from "../../../../../shared/boss/boss-planning.js";
import type { BossSpriteAnimationState } from "../../../combat-entity-animation.js";
import type { PixelPalette } from "../../../pixel-primitives.js";
import type { PixiGraphics } from "../boss-sprite-types.js";

export interface BossActionPoseOptions {
  animation: BossSpriteAnimationState;
  graphic: PixiGraphics;
  healthProgress: number;
  palette: PixelPalette;
  silhouette: BossMechSilhouette;
}

export interface BossPoseAnchor {
  x: number;
  y: number;
}
