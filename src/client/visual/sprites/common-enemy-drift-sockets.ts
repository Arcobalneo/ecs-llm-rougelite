import type { CommonEnemyTemplate } from "../../simulation/combat.js";
import type { EnemyDriftVisualState } from "../arena-visual-state.js";
import type { EnemySpriteAnimationState } from "../combat-entity-animation.js";
import type { CommonEnemyVisualVariant } from "../common-enemy-variants.js";
import {
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawPixelJoint,
  type PixelPalette,
} from "../pixel-primitives.js";

type PixiGraphics = import("pixi.js").Graphics;

export interface CommonEnemyDriftSocketSummary {
  bodySockets: number;
  hasDominantTheme: boolean;
  ringSockets: number;
  trailSockets: number;
}

export function commonEnemyDriftSocketSummary(options: {
  drift: EnemyDriftVisualState;
  templateId: CommonEnemyTemplate["id"];
}): CommonEnemyDriftSocketSummary {
  const themeCount = options.drift.dominantThemeId ? 1 + options.drift.secondaryThemeIds.length : 0;
  const baseBodySockets: Record<CommonEnemyTemplate["id"], number> = {
    "fast-fragile": 3,
    "slow-tough": 4,
    "swarm-fragile": 5,
  };
  return {
    bodySockets: themeCount === 0 ? 0 : baseBodySockets[options.templateId],
    hasDominantTheme: options.drift.dominantThemeId !== undefined,
    ringSockets: themeCount > 1 ? Math.min(3, themeCount) : 0,
    trailSockets: themeCount > 0 ? (options.templateId === "slow-tough" ? 1 : 2) : 0,
  };
}

export function drawCommonEnemyDriftSockets(
  graphic: PixiGraphics,
  options: {
    animation: EnemySpriteAnimationState;
    drift: EnemyDriftVisualState;
    palette: PixelPalette;
    radius: number;
    templateId: CommonEnemyTemplate["id"];
    variant: CommonEnemyVisualVariant;
  },
): void {
  if (!options.drift.dominantThemeId) {
    return;
  }
  if (options.templateId === "fast-fragile") {
    drawFastDriftSockets(graphic, options);
    return;
  }
  if (options.templateId === "slow-tough") {
    drawSlowDriftSockets(graphic, options);
    return;
  }
  drawSwarmDriftSockets(graphic, options);
}

function drawFastDriftSockets(
  graphic: PixiGraphics,
  options: {
    animation: EnemySpriteAnimationState;
    drift: EnemyDriftVisualState;
    palette: PixelPalette;
    radius: number;
    variant: CommonEnemyVisualVariant;
  },
): void {
  const { animation, drift, palette, radius, variant } = options;
  const pulse = 0.34 + animation.phase * 0.18;
  for (const side of [-1, 1]) {
    const s = side as -1 | 1;
    drawOutlinedPoly(
      graphic,
      [
        s * radius * 0.7,
        -radius * 0.6,
        s * radius * (1.15 + variant.wingSpan * 0.2),
        -radius * 0.38,
        s * radius * 0.9,
        radius * 0.04,
      ],
      drift.tintColor,
      palette.dark,
      pulse,
    );
    drawEmissiveSlit(graphic, s * radius * 0.72, radius * 0.14, s * 10, 3, drift.accentColor, 0.44);
  }
  drawPixelJoint(graphic, 0, -radius * 0.74, 3.5, { ...palette, accent: drift.accentColor, armor: drift.tintColor }, 0.58);
  drawDriftRings(graphic, radius, drift, 0.26);
}

function drawSlowDriftSockets(
  graphic: PixiGraphics,
  options: {
    animation: EnemySpriteAnimationState;
    drift: EnemyDriftVisualState;
    palette: PixelPalette;
    radius: number;
    variant: CommonEnemyVisualVariant;
  },
): void {
  const { animation, drift, palette, radius, variant } = options;
  const sidePod = radius * (1.02 + variant.sidePodScale * 0.12);
  for (const side of [-1, 1]) {
    const s = side as -1 | 1;
    drawOutlinedRect(
      graphic,
      s < 0 ? -sidePod - 9 : sidePod,
      -radius * 0.32 + animation.phase * 2,
      9,
      radius * 0.72,
      drift.tintColor,
      palette.dark,
      0.34,
    );
    drawEmissiveSlit(graphic, s * radius * 0.28, -radius * 0.58, s * 14, 4, drift.accentColor, 0.46);
  }
  graphic
    .circle(0, 0, radius * 0.78)
    .stroke({ color: drift.tintColor, width: 2, alpha: 0.18 })
    .circle(0, 0, radius * 1.05)
    .stroke({ color: drift.accentColor, width: 1, alpha: 0.1 });
}

function drawSwarmDriftSockets(
  graphic: PixiGraphics,
  options: {
    animation: EnemySpriteAnimationState;
    drift: EnemyDriftVisualState;
    palette: PixelPalette;
    radius: number;
    variant: CommonEnemyVisualVariant;
  },
): void {
  const { animation, drift, palette, radius, variant } = options;
  const nodeCount = 5 + Math.min(2, drift.secondaryThemeIds.length);
  for (let index = 0; index < nodeCount; index += 1) {
    const angle = index * 2.399 + animation.frame * 0.27;
    const distance = radius * (0.74 + (index % 3) * 0.16) * variant.sidePodScale;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    drawPixelJoint(
      graphic,
      x,
      y,
      2.6 + (index % 2),
      { ...palette, accent: index % 2 === 0 ? drift.accentColor : drift.tintColor },
      0.52,
    );
    graphic
      .moveTo(x * 0.45, y * 0.45)
      .lineTo(x, y)
      .stroke({ color: index % 2 === 0 ? drift.tintColor : drift.accentColor, width: 1, alpha: 0.24 });
  }
  drawDriftRings(graphic, radius, drift, 0.18);
}

function drawDriftRings(
  graphic: PixiGraphics,
  radius: number,
  drift: EnemyDriftVisualState,
  alpha: number,
): void {
  if (drift.secondaryThemeIds.length === 0) {
    return;
  }
  for (let index = 0; index < Math.min(3, drift.secondaryThemeIds.length + 1); index += 1) {
    graphic
      .circle(0, 0, radius + 6 + index * 5)
      .stroke({ color: index % 2 === 0 ? drift.tintColor : drift.accentColor, width: 1, alpha: alpha - index * 0.035 });
  }
}
