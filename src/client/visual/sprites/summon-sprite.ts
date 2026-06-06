import {
  drawPixelGlow,
  drawPixelHighlights,
} from "../pixel-primitives.js";
import { drawCompactAttachment } from "../runtime-attachments.js";
import {
  layoutRuntimeVisualAttachments,
  type RuntimeVisualAssembly,
} from "../visual-assembly.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export function createSummonGraphic(options: {
  Graphics: PixiGraphicsCtor;
  orbitRadius: number;
  visuals: RuntimeVisualAssembly;
}): PixiGraphics {
  const attachment = options.visuals.attachments[0];
  const color = attachment?.palette[attachment.paletteRole] ?? 0xfff6d6;
  const accent = attachment?.palette.accent ?? 0x7ddfff;
  const graphic = new options.Graphics();
  drawPixelGlow(graphic, 0, 0, 22, color, 0.22);
  graphic
    .poly([0, -15, 13, -4, 9, 13, 0, 18, -9, 13, -13, -4])
    .fill({ color: 0x081424, alpha: 0.96 })
    .poly([0, -10, 8, -2, 5, 9, 0, 12, -5, 9, -8, -2])
    .fill({ color, alpha: 0.9 })
    .rect(-3, -8, 6, 19)
    .fill({ color: 0xe8fbff, alpha: 0.62 })
    .circle(0, 0, 17)
    .stroke({ color: accent, width: 2, alpha: 0.58 })
    .circle(0, 0, Math.min(38, Math.max(20, options.orbitRadius * 0.34)))
    .stroke({ color, width: 1, alpha: 0.28 });
  drawPixelHighlights(graphic, [
    { x: -16, y: -2, width: 5, height: 4, color: accent },
    { x: 11, y: -2, width: 5, height: 4, color: accent },
    { x: -2, y: 16, width: 4, height: 8, color },
  ]);
  for (const layout of layoutRuntimeVisualAttachments(options.visuals.attachments.slice(0, 4))) {
    drawCompactAttachment(graphic, layout.attachment, layout.slotIndex, 10);
  }
  return graphic;
}
