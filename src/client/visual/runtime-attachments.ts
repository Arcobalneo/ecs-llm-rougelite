import type { Point } from "../simulation/arena-math.js";
import {
  layoutRuntimeVisualAttachments,
  type RuntimeVisualAssembly,
  type RuntimeVisualAttachment,
} from "./visual-assembly.js";
import { drawPixelGlow } from "./pixel-primitives.js";
import {
  runtimeAttachmentSlotAngle,
  runtimeAttachmentSlotOffset,
} from "./runtime-attachment-layout.js";

type PixiContainer = import("pixi.js").Container;
type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface RuntimeAttachmentRenderCache {
  playerAttachmentIds: string;
  playerAttachments: PixiGraphics[];
  screenEffectIds: string;
  screenEffects: PixiGraphics[];
}

export function syncPlayerVisualAttachments(options: {
  attachmentLayer: PixiContainer;
  Graphics: PixiGraphicsCtor;
  nowSeconds: number;
  player: Point;
  renderCache: RuntimeAttachmentRenderCache;
  visualPolishVersion: string;
  visuals: RuntimeVisualAssembly;
}): void {
  const ids = `${options.visualPolishVersion}:${options.visuals.attachments.map((attachment) => attachment.visualPieceId).join("|")}`;
  if (ids !== options.renderCache.playerAttachmentIds) {
    for (const graphic of options.renderCache.playerAttachments) {
      graphic.destroy();
    }
    options.attachmentLayer.removeChildren();
    options.renderCache.playerAttachments = layoutRuntimeVisualAttachments(options.visuals.attachments).map((layout) =>
      createAttachmentGraphic(layout.attachment, options.Graphics, layout.slotIndex),
    );
    for (const graphic of options.renderCache.playerAttachments) {
      options.attachmentLayer.addChild(graphic);
    }
    options.renderCache.playerAttachmentIds = ids;
  }

  options.attachmentLayer.position.set(options.player.x, options.player.y);
  options.attachmentLayer.rotation = Math.sin(options.nowSeconds * 0.55) * 0.018;
  for (const [index, graphic] of options.renderCache.playerAttachments.entries()) {
    const pulse = 1 + Math.sin(options.nowSeconds * 2.4 + index * 0.8) * 0.035;
    graphic.scale.set(pulse);
  }
}

export function syncScreenEffects(options: {
  effectLayer: PixiContainer;
  Graphics: PixiGraphicsCtor;
  nowSeconds: number;
  player: Point;
  renderCache: RuntimeAttachmentRenderCache;
  visualPolishVersion: string;
  visuals: RuntimeVisualAssembly;
}): void {
  const ids = `${options.visualPolishVersion}:${options.visuals.screenEffects.map((effect) => effect.sourceAttachmentId).join("|")}`;
  if (ids !== options.renderCache.screenEffectIds) {
    for (const graphic of options.renderCache.screenEffects) {
      graphic.destroy();
    }
    options.effectLayer.removeChildren();
    options.renderCache.screenEffects = options.visuals.screenEffects.map((effect, index) =>
      new options.Graphics()
        .circle(0, 0, 112 + index * 36)
        .stroke({ color: effect.color, width: 1, alpha: effect.intensity * 0.55 })
        .circle(0, 0, 180 + index * 52)
        .stroke({ color: effect.color, width: 1, alpha: effect.intensity * 0.28 }),
    );
    for (const graphic of options.renderCache.screenEffects) {
      options.effectLayer.addChild(graphic);
    }
    options.renderCache.screenEffectIds = ids;
  }

  options.effectLayer.position.set(options.player.x, options.player.y);
  options.effectLayer.rotation = options.nowSeconds * 0.12;
  for (const [index, graphic] of options.renderCache.screenEffects.entries()) {
    const scale = 1 + Math.sin(options.nowSeconds * 1.2 + index) * 0.025;
    graphic.scale.set(scale);
    graphic.alpha = 0.46 + Math.sin(options.nowSeconds * 1.8 + index) * 0.08;
  }
}

export function drawCompactAttachment(
  graphic: PixiGraphics,
  attachment: RuntimeVisualAttachment,
  slotIndex: number,
  radius: number,
): void {
  const color = attachment.palette[attachment.paletteRole];
  const accent = attachment.palette.accent;
  const angle = slotIndex * 1.9 + runtimeAttachmentSlotAngle(attachment.slot);
  const distance = radius + 4 + slotIndex * 3;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  if (attachment.slot === "aura" || attachment.slot === "orbit") {
    graphic
      .circle(0, 0, radius + 8 + slotIndex * 5)
      .stroke({ color, width: 1, alpha: 0.34 })
      .circle(0, 0, radius + 14 + slotIndex * 6)
      .stroke({ color: accent, width: 1, alpha: 0.16 });
    return;
  }
  if (attachment.slot === "trail") {
    graphic
      .poly([-8, radius + 2, 0, radius + 28 + slotIndex * 5, 8, radius + 2])
      .fill({ color, alpha: 0.22 })
      .rect(-2, radius + 4, 4, 22 + slotIndex * 3)
      .fill({ color: accent, alpha: 0.34 });
    return;
  }
  if (attachment.slot === "weapon" || attachment.slot === "projectile") {
    graphic
      .rect(x - 12, y - 3, 24, 6)
      .fill({ color, alpha: 0.78 })
      .rect(x + 6, y - 1, 15, 2)
      .fill({ color: accent, alpha: 0.88 })
      .circle(x + 20, y, 7)
      .stroke({ color: accent, width: 1, alpha: 0.34 });
    return;
  }
  if (attachment.slot === "back" || attachment.slot === "shoulder" || attachment.slot === "arm") {
    graphic
      .poly([x - 12, y - 7, x + 8, y - 12, x + 14, y + 4, x - 7, y + 10])
      .fill({ color, alpha: 0.66 })
      .poly([x - 4, y - 5, x + 7, y - 7, x + 8, y + 4, x - 2, y + 5])
      .fill({ color: accent, alpha: 0.44 });
    return;
  }
  graphic
    .circle(x, y, 10)
    .stroke({ color, width: 1, alpha: 0.16 })
    .circle(x, y, 3 + Math.min(3, attachment.scale * 2))
    .fill({ color, alpha: 0.76 })
    .circle(x, y, 6)
    .stroke({ color: accent, width: 1, alpha: 0.36 });
}

function createAttachmentGraphic(
  attachment: RuntimeVisualAttachment,
  Graphics: PixiGraphicsCtor,
  index: number,
): PixiGraphics {
  const color = attachment.palette[attachment.paletteRole];
  const accent = attachment.palette.accent;
  const scale = attachment.scale;
  const secondary = attachment.palette.secondary;
  const graphic = new Graphics();
  const offset = runtimeAttachmentSlotOffset(attachment.slot, index, scale);
  drawPixelGlow(graphic, 0, 0, 22 * scale, color, attachment.supportsParticles ? 0.18 : 0.08);

  if (attachment.slot === "aura") {
    graphic
      .circle(0, 0, 40 * scale + index * 7)
      .stroke({ color, width: 3, alpha: 0.38 })
      .circle(0, 0, 56 * scale + index * 9)
      .stroke({ color: accent, width: 1, alpha: 0.2 });
    for (let spoke = 0; spoke < 8; spoke += 1) {
      const angle = (spoke / 8) * Math.PI * 2;
      const inner = 31 * scale + index * 5;
      const outer = 47 * scale + index * 7;
      graphic
        .moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
        .lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
        .stroke({ color: spoke % 2 === 0 ? accent : color, width: 1, alpha: 0.22 });
    }
  } else if (attachment.slot === "orbit") {
    graphic
      .circle(0, 0, 54 * scale + index * 6)
      .stroke({ color, width: 2, alpha: 0.34 })
      .circle(0, 0, 68 * scale + index * 7)
      .stroke({ color: accent, width: 1, alpha: 0.16 });
    for (let orb = 0; orb < 4; orb += 1) {
      const angle = orb * Math.PI * 0.5 + index * 0.3;
      const radius = 42 * scale + index * 4;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      graphic
        .rect(x - 5 * scale, y - 5 * scale, 10 * scale, 10 * scale)
        .fill({ color: orb % 2 === 0 ? color : accent, alpha: 0.78 })
        .circle(x, y, 10 * scale)
        .stroke({ color: 0xe8fbff, width: 1, alpha: 0.26 });
    }
  } else if (attachment.slot === "trail") {
    graphic
      .poly([-12 * scale, 16 * scale, 0, 78 * scale + index * 9, 12 * scale, 16 * scale])
      .fill({ color, alpha: 0.2 })
      .poly([-5 * scale, 18 * scale, 0, 58 * scale + index * 7, 5 * scale, 18 * scale])
      .fill({ color: accent, alpha: 0.34 })
      .rect(-2 * scale, 14 * scale, 4 * scale, 38 * scale)
      .fill({ color: 0xe8fbff, alpha: 0.22 });
  } else if (attachment.slot === "projectile" || attachment.slot === "weapon") {
    graphic
      .rect(-37 * scale, -6 * scale, 74 * scale, 12 * scale)
      .fill({ color: 0x081424, alpha: 0.86 })
      .rect(-31 * scale, -4 * scale, 62 * scale, 8 * scale)
      .fill({ color, alpha: 0.76 })
      .rect(12 * scale, -2 * scale, 30 * scale, 4 * scale)
      .fill({ color: accent, alpha: 0.92 })
      .poly([43 * scale, 0, 30 * scale, -10 * scale, 30 * scale, 10 * scale])
      .fill({ color: 0xe8fbff, alpha: 0.55 });
    for (let spark = 0; spark < 4; spark += 1) {
      graphic
        .rect((-46 - spark * 9) * scale, (-3 + spark * 2) * scale, 5 * scale, 2 * scale)
        .fill({ color: spark % 2 === 0 ? accent : color, alpha: 0.42 });
    }
  } else if (attachment.slot === "shoulder" || attachment.slot === "arm") {
    graphic
      .poly([-18 * scale, -11 * scale, 11 * scale, -16 * scale, 19 * scale, 1 * scale, 4 * scale, 15 * scale, -17 * scale, 9 * scale])
      .fill({ color: 0x081424, alpha: 0.9 })
      .poly([-12 * scale, -7 * scale, 8 * scale, -10 * scale, 13 * scale, 1 * scale, 2 * scale, 10 * scale, -11 * scale, 6 * scale])
      .fill({ color, alpha: 0.82 })
      .rect(-4 * scale, -13 * scale, 8 * scale, 25 * scale)
      .fill({ color: accent, alpha: 0.42 })
      .rect(-14 * scale, 11 * scale, 8 * scale, 5 * scale)
      .fill({ color: secondary, alpha: 0.74 });
  } else if (attachment.slot === "back") {
    graphic
      .poly([-32 * scale, 3 * scale, -12 * scale, -34 * scale, -6 * scale, 28 * scale])
      .fill({ color, alpha: 0.58 })
      .poly([32 * scale, 3 * scale, 12 * scale, -34 * scale, 6 * scale, 28 * scale])
      .fill({ color: accent, alpha: 0.48 })
      .rect(-3 * scale, -26 * scale, 6 * scale, 58 * scale)
      .fill({ color: 0xe8fbff, alpha: 0.18 })
      .circle(-18 * scale, -6 * scale, 8 * scale)
      .stroke({ color: secondary, width: 1, alpha: 0.32 })
      .circle(18 * scale, -6 * scale, 8 * scale)
      .stroke({ color, width: 1, alpha: 0.32 });
  } else if (attachment.slot === "summon") {
    graphic
      .poly([0, -20 * scale, 18 * scale, -4 * scale, 12 * scale, 16 * scale, 0, 22 * scale, -12 * scale, 16 * scale, -18 * scale, -4 * scale])
      .fill({ color, alpha: 0.72 })
      .circle(0, 0, 22 * scale)
      .stroke({ color: accent, width: 2, alpha: 0.44 })
      .circle(0, 0, 33 * scale)
      .stroke({ color, width: 1, alpha: 0.18 });
  } else if (attachment.slot === "core" || attachment.slot === "head") {
    graphic
      .rect(-14 * scale, -14 * scale, 28 * scale, 28 * scale)
      .fill({ color: 0x081424, alpha: 0.9 })
      .rect(-9 * scale, -9 * scale, 18 * scale, 18 * scale)
      .fill({ color, alpha: 0.78 })
      .rect(-4 * scale, -18 * scale, 8 * scale, 36 * scale)
      .fill({ color: accent, alpha: 0.42 })
      .circle(0, 0, 23 * scale)
      .stroke({ color: 0xe8fbff, width: 1, alpha: 0.24 });
  } else {
    graphic
      .circle(0, 0, 20 * scale)
      .stroke({ color, width: 1, alpha: 0.2 })
      .rect(-10 * scale, -10 * scale, 20 * scale, 20 * scale)
      .fill({ color, alpha: 0.66 })
      .rect(-5 * scale, -13 * scale, 10 * scale, 26 * scale)
      .fill({ color: accent, alpha: 0.34 });
  }

  graphic.position.set(offset.x, offset.y);
  return graphic;
}
