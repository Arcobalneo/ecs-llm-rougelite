import { drawPixelGlow } from "../pixel-primitives.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export function createXpShardGraphic(Graphics: PixiGraphicsCtor): PixiGraphics {
  const graphic = new Graphics();
  redrawXpShardGraphic(graphic, {
    attracted: false,
    nowSeconds: 0,
    playerOffset: { x: 0, y: 0 },
    value: 1,
  });
  return graphic;
}

export function redrawXpShardGraphic(
  graphic: PixiGraphics,
  options: {
    attracted: boolean;
    nowSeconds: number;
    playerOffset: { x: number; y: number };
    value: number;
  },
): void {
  graphic.clear();
  if (options.attracted) {
    drawXpMagnetTrail(graphic, options);
  }

  const pulse = 1 + Math.sin(options.nowSeconds * 9 + options.value) * 0.08;
  drawPixelGlow(graphic, 0, 0, 14, 0x44f5ff, 0.16);
  graphic
    .poly([0, -9 * pulse, 8 * pulse, 0, 0, 9 * pulse, -8 * pulse, 0])
    .fill({ color: 0x44f5ff, alpha: 0.9 })
    .poly([0, -6 * pulse, 5 * pulse, 0, 0, 6 * pulse, -5 * pulse, 0])
    .fill({ color: 0xe8fbff, alpha: 0.56 })
    .circle(0, 0, 12)
    .stroke({ color: 0xff4fd8, width: 1, alpha: options.attracted ? 0.56 : 0.34 });
}

export function xpMagnetTrailSegmentCount(distance: number): number {
  return Math.min(8, Math.max(2, Math.floor(distance / 42)));
}

function drawXpMagnetTrail(
  graphic: PixiGraphics,
  options: {
    nowSeconds: number;
    playerOffset: { x: number; y: number };
    value: number;
  },
): void {
  const distance = Math.hypot(options.playerOffset.x, options.playerOffset.y);
  if (distance < 18) {
    return;
  }
  const segments = xpMagnetTrailSegmentCount(distance);
  const unit = {
    x: options.playerOffset.x / distance,
    y: options.playerOffset.y / distance,
  };
  const normal = { x: -unit.y, y: unit.x };
  const maxLength = Math.min(distance - 12, 220);
  const flow = (options.nowSeconds * 6 + options.value * 0.17) % 1;

  for (let index = 0; index < segments; index += 1) {
    const t0 = (index + flow) / (segments + 1);
    const t1 = Math.min(0.96, t0 + 0.18);
    const curve = Math.sin((t0 + options.nowSeconds * 0.9) * Math.PI * 2) * (6 + (index % 3) * 3);
    const start = {
      x: unit.x * maxLength * t0 + normal.x * curve,
      y: unit.y * maxLength * t0 + normal.y * curve,
    };
    const end = {
      x: unit.x * maxLength * t1 + normal.x * curve * 0.38,
      y: unit.y * maxLength * t1 + normal.y * curve * 0.38,
    };
    const alpha = 0.36 + (index % 3) * 0.08;
    graphic
      .moveTo(start.x, start.y)
      .lineTo(end.x, end.y)
      .stroke({ color: 0x020612, width: 5, alpha: alpha * 0.52 })
      .moveTo(start.x, start.y)
      .lineTo(end.x, end.y)
      .stroke({ color: index % 2 === 0 ? 0x44f5ff : 0xff4fd8, width: 2, alpha });
    graphic
      .rect(end.x - 2, end.y - 2, 4, 4)
      .fill({ color: index % 2 === 0 ? 0xe8fbff : 0xfff2a8, alpha: 0.48 });
  }
}
