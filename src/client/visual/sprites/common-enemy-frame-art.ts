import type { CommonEnemyTemplate } from "../../simulation/combat.js";
import type { EnemyAnimationFrame, EnemySpriteAnimationState } from "../combat-entity-animation.js";
import type { CommonEnemyVisualVariant } from "../common-enemy-variants.js";
import {
  drawCableBundle,
  drawHeatSinkStack,
  drawRivetCluster,
} from "../mech-detail-primitives.js";
import {
  drawArmorPanel,
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawOutlinedSegment,
  drawPixelJoint,
  type PixelPalette,
} from "../pixel-primitives.js";

type PixiGraphics = import("pixi.js").Graphics;

export interface CommonEnemyFrameSignature {
  armorPanels: number;
  emitterNodes: number;
  frame: EnemyAnimationFrame;
  limbSegments: number;
  silhouetteCuts: number;
  templateId: CommonEnemyTemplate["id"];
}

export function commonEnemyFrameSignature(options: {
  frame: EnemyAnimationFrame;
  templateId: CommonEnemyTemplate["id"];
}): CommonEnemyFrameSignature {
  const table: Record<CommonEnemyTemplate["id"], readonly Omit<CommonEnemyFrameSignature, "frame" | "templateId">[]> = {
    "fast-fragile": [
      { armorPanels: 5, emitterNodes: 3, limbSegments: 6, silhouetteCuts: 4 },
      { armorPanels: 4, emitterNodes: 4, limbSegments: 8, silhouetteCuts: 5 },
      { armorPanels: 6, emitterNodes: 3, limbSegments: 7, silhouetteCuts: 6 },
      { armorPanels: 5, emitterNodes: 5, limbSegments: 9, silhouetteCuts: 5 },
    ],
    "slow-tough": [
      { armorPanels: 8, emitterNodes: 2, limbSegments: 8, silhouetteCuts: 5 },
      { armorPanels: 10, emitterNodes: 3, limbSegments: 10, silhouetteCuts: 6 },
      { armorPanels: 9, emitterNodes: 4, limbSegments: 9, silhouetteCuts: 7 },
      { armorPanels: 11, emitterNodes: 3, limbSegments: 11, silhouetteCuts: 6 },
    ],
    "swarm-fragile": [
      { armorPanels: 3, emitterNodes: 5, limbSegments: 8, silhouetteCuts: 4 },
      { armorPanels: 4, emitterNodes: 7, limbSegments: 10, silhouetteCuts: 5 },
      { armorPanels: 3, emitterNodes: 6, limbSegments: 9, silhouetteCuts: 6 },
      { armorPanels: 5, emitterNodes: 8, limbSegments: 11, silhouetteCuts: 5 },
    ],
  };
  return {
    ...table[options.templateId][options.frame],
    frame: options.frame,
    templateId: options.templateId,
  };
}

export function commonEnemyFrameArtPartBudget(templateId: CommonEnemyTemplate["id"]): number {
  return [0, 1, 2, 3]
    .map((frame) => commonEnemyFrameSignature({ frame: frame as EnemyAnimationFrame, templateId }))
    .reduce((sum, signature) =>
      sum + signature.armorPanels + signature.emitterNodes + signature.limbSegments + signature.silhouetteCuts,
    0);
}

export function drawCommonEnemyFrameArt(
  graphic: PixiGraphics,
  options: {
    animation: EnemySpriteAnimationState;
    palette: PixelPalette;
    radius: number;
    templateId: CommonEnemyTemplate["id"];
    variant: CommonEnemyVisualVariant;
  },
): void {
  if (options.templateId === "fast-fragile") {
    drawFastFragileFrameArt(graphic, options);
    return;
  }
  if (options.templateId === "slow-tough") {
    drawSlowToughFrameArt(graphic, options);
    return;
  }
  drawSwarmFragileFrameArt(graphic, options);
}

function drawFastFragileFrameArt(
  graphic: PixiGraphics,
  options: {
    animation: EnemySpriteAnimationState;
    palette: PixelPalette;
    radius: number;
    variant: CommonEnemyVisualVariant;
  },
): void {
  const { animation, palette, radius, variant } = options;
  const frameShift = frameDirection(animation.frame) * 2.5;
  const finOpen = animation.frame === 1 || animation.frame === 3 ? 1.15 : 0.86;
  for (const side of [-1, 1]) {
    const s = side as -1 | 1;
    drawArmorPanel(
      graphic,
      [
        s * (radius * 0.26),
        -radius * 0.84 + frameShift * 0.2,
        s * (radius * (0.72 + variant.wingSpan * 0.18)),
        -radius * (1.08 + finOpen * 0.1),
        s * (radius * (0.98 + variant.wingSpan * 0.24)),
        -radius * 0.58 + frameShift,
        s * (radius * 0.52),
        -radius * 0.34,
      ],
      palette,
      0.46,
    );
    drawOutlinedSegment(
      graphic,
      { x: s * radius * 0.46, y: radius * 0.18 },
      { x: s * radius * (1.06 + variant.wingSpan * 0.22), y: radius * (0.5 + finOpen * 0.2) },
      3,
      palette.trim,
      palette.dark,
      0.54,
    );
    drawEmissiveSlit(graphic, s * (radius * 0.68), -radius * 0.1 + frameShift, s * 9, 3, palette.accent, 0.46);
  }
  drawHeatSinkStack(graphic, {
    count: 3 + (animation.frame % 2),
    height: 2,
    palette,
    width: radius * 0.78,
    x: -radius * 0.39,
    y: radius * 0.12,
  });
  drawRivetCluster(graphic, fastFrameRivets(animation.frame, radius), palette);
}

function drawSlowToughFrameArt(
  graphic: PixiGraphics,
  options: {
    animation: EnemySpriteAnimationState;
    palette: PixelPalette;
    radius: number;
    variant: CommonEnemyVisualVariant;
  },
): void {
  const { animation, palette, radius, variant } = options;
  const compression = animation.frame === 1 || animation.frame === 2 ? 2.5 : -1.5;
  for (const side of [-1, 1]) {
    const s = side as -1 | 1;
    for (let tread = 0; tread < 3; tread += 1) {
      drawOutlinedRect(
        graphic,
        s < 0 ? -radius - 18 - tread * 2 : radius + 8 + tread * 2,
        -radius * 0.22 + tread * 8 + frameDirection(animation.frame + tread) * 1.5,
        13 + variant.armorBulk * 3,
        5,
        tread % 2 === 0 ? palette.trim : palette.accent,
        palette.dark,
        0.5,
      );
    }
    for (let claw = 0; claw < 3; claw += 1) {
      const x = s * (radius * (0.42 + claw * 0.19));
      const y = radius * (0.72 + frameDirection(animation.frame + claw) * 0.04);
      drawOutlinedPoly(
        graphic,
        [x - s * 3, y - 3, x + s * 13, y, x - s * 3, y + 5],
        claw % 2 === 0 ? palette.trim : palette.accent,
        palette.dark,
        0.44,
      );
    }
    drawArmorPanel(
      graphic,
      [
        s * radius * 0.3,
        -radius * 0.72 + compression,
        s * radius * (0.86 + variant.sidePodScale * 0.1),
        -radius * 0.58,
        s * radius * (0.76 + variant.sidePodScale * 0.16),
        radius * 0.42,
        s * radius * 0.28,
        radius * 0.5 - compression,
      ],
      palette,
      0.38,
    );
  }
  drawCableBundle(graphic, {
    count: 3,
    from: { x: -radius * 0.52, y: -radius * 0.46 + compression },
    palette,
    sag: 5 + animation.frame,
    to: { x: radius * 0.52, y: -radius * 0.46 - compression },
  });
  drawEmissiveSlit(graphic, -radius * 0.44 + variant.sensorOffset, radius * 0.42, radius * 0.88, 4, palette.accent, 0.48);
  drawRivetCluster(graphic, slowFrameRivets(animation.frame, radius), palette);
}

function drawSwarmFragileFrameArt(
  graphic: PixiGraphics,
  options: {
    animation: EnemySpriteAnimationState;
    palette: PixelPalette;
    radius: number;
    variant: CommonEnemyVisualVariant;
  },
): void {
  const { animation, palette, radius, variant } = options;
  const wingCurl = animation.frame === 0 || animation.frame === 3 ? 0.76 : 1.2;
  for (const side of [-1, 1]) {
    const s = side as -1 | 1;
    drawOutlinedPoly(
      graphic,
      [
        s * radius * 0.26,
        -radius * 0.78,
        s * radius * (1.12 + variant.wingSpan * 0.22),
        -radius * (0.7 + wingCurl * 0.2),
        s * radius * (0.84 + variant.wingSpan * 0.16),
        -radius * 0.12,
        s * radius * 0.34,
        -radius * 0.28,
      ],
      palette.trim,
      palette.dark,
      0.4,
    );
    drawOutlinedPoly(
      graphic,
      [
        s * radius * 0.22,
        radius * 0.28,
        s * radius * (1 + variant.wingSpan * 0.16),
        radius * (0.22 + wingCurl * 0.22),
        s * radius * (0.74 + variant.wingSpan * 0.12),
        radius * 0.76,
        s * radius * 0.32,
        radius * 0.58,
      ],
      palette.armor,
      palette.dark,
      0.34,
    );
  }
  for (let node = 0; node < 4 + animation.frame; node += 1) {
    const angle = node * 1.57 + animation.frame * 0.22;
    const distance = radius * (0.42 + (node % 2) * 0.22);
    drawPixelJoint(
      graphic,
      Math.cos(angle) * distance + variant.asymmetry,
      Math.sin(angle) * distance,
      2.4 + (node % 2),
      palette,
      0.5,
    );
  }
  drawCableBundle(graphic, {
    count: 2 + (animation.frame % 2),
    from: { x: -radius * 0.55, y: radius * 0.08 },
    palette,
    sag: 2 + animation.phase * 4,
    to: { x: radius * 0.55, y: radius * 0.08 },
  });
}

function fastFrameRivets(frame: EnemyAnimationFrame, radius: number) {
  const shift = frameDirection(frame) * 2;
  return [
    { x: -radius * 0.34, y: -radius * 0.7 + shift, radius: 1.1, alpha: 0.38 },
    { x: radius * 0.34, y: -radius * 0.7 - shift, radius: 1.1, alpha: 0.38 },
    { x: -radius * 0.2, y: radius * 0.2, radius: 1, alpha: 0.36 },
    { x: radius * 0.2, y: radius * 0.2, radius: 1, alpha: 0.36 },
  ];
}

function slowFrameRivets(frame: EnemyAnimationFrame, radius: number) {
  const shift = frameDirection(frame) * 1.5;
  return [
    { x: -radius * 0.62, y: -radius * 0.34 + shift, radius: 1.3, alpha: 0.42 },
    { x: radius * 0.62, y: -radius * 0.34 - shift, radius: 1.3, alpha: 0.42 },
    { x: -radius * 0.5, y: radius * 0.22 - shift, radius: 1.2, alpha: 0.38 },
    { x: radius * 0.5, y: radius * 0.22 + shift, radius: 1.2, alpha: 0.38 },
    { x: 0, y: -radius * 0.62, radius: 1.1, alpha: 0.36 },
  ];
}

function frameDirection(frame: number): -1 | 1 {
  return frame % 2 === 0 ? -1 : 1;
}
