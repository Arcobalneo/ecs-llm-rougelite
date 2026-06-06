import type { Point } from "../simulation/arena-math.js";
import {
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawOutlinedSegment,
  drawPixelJoint,
  type PixelPalette,
} from "./pixel-primitives.js";

type PixiGraphics = import("pixi.js").Graphics;

export function drawPanelSeams(
  graphic: PixiGraphics,
  seams: ReadonlyArray<{ alpha?: number; from: Point; to: Point; width?: number }>,
  palette: PixelPalette,
): void {
  for (const seam of seams) {
    drawOutlinedSegment(
      graphic,
      seam.from,
      seam.to,
      seam.width ?? 1,
      palette.trim,
      palette.dark,
      seam.alpha ?? 0.38,
    );
  }
}

export function drawRivetCluster(
  graphic: PixiGraphics,
  rivets: ReadonlyArray<{ alpha?: number; radius?: number; x: number; y: number }>,
  palette: PixelPalette,
): void {
  for (const rivet of rivets) {
    const radius = rivet.radius ?? 2;
    graphic
      .circle(rivet.x, rivet.y, radius + 1)
      .fill({ color: palette.dark, alpha: 0.72 })
      .circle(rivet.x, rivet.y, radius)
      .fill({ color: palette.accent, alpha: rivet.alpha ?? 0.58 })
      .rect(rivet.x - radius * 0.42, rivet.y - 1, radius * 0.84, 1)
      .fill({ color: palette.core, alpha: (rivet.alpha ?? 0.58) * 0.55 });
  }
}

export function drawHeatSinkStack(
  graphic: PixiGraphics,
  options: {
    alpha?: number;
    count: number;
    gap?: number;
    height: number;
    palette: PixelPalette;
    width: number;
    x: number;
    y: number;
  },
): void {
  const gap = options.gap ?? 3;
  for (let index = 0; index < options.count; index += 1) {
    const y = options.y + index * gap;
    drawOutlinedRect(
      graphic,
      options.x,
      y,
      options.width - index * 0.8,
      options.height,
      index % 2 === 0 ? options.palette.trim : options.palette.armor,
      options.palette.dark,
      options.alpha ?? 0.48,
    );
  }
}

export function drawCableBundle(
  graphic: PixiGraphics,
  options: {
    alpha?: number;
    color?: number;
    count: number;
    from: Point;
    palette: PixelPalette;
    sag?: number;
    to: Point;
  },
): void {
  const alpha = options.alpha ?? 0.42;
  const color = options.color ?? options.palette.accent;
  const sag = options.sag ?? 8;
  for (let index = 0; index < options.count; index += 1) {
    const offset = index - (options.count - 1) / 2;
    const mid = {
      x: (options.from.x + options.to.x) * 0.5,
      y: (options.from.y + options.to.y) * 0.5 + sag + offset * 2,
    };
    graphic
      .moveTo(options.from.x, options.from.y + offset * 2)
      .lineTo(mid.x, mid.y)
      .lineTo(options.to.x, options.to.y + offset * 2)
      .stroke({ color: options.palette.dark, width: 4, alpha: alpha * 0.72 })
      .moveTo(options.from.x, options.from.y + offset * 2)
      .lineTo(mid.x, mid.y)
      .lineTo(options.to.x, options.to.y + offset * 2)
      .stroke({ color: index % 2 === 0 ? color : options.palette.core, width: 1, alpha });
  }
}

export function drawMechFaceplate(
  graphic: PixiGraphics,
  options: {
    palette: PixelPalette;
    sensorY: number;
    width: number;
    x: number;
    y: number;
  },
): void {
  drawOutlinedPoly(
    graphic,
    [
      options.x,
      options.y + 6,
      options.x + options.width * 0.18,
      options.y,
      options.x + options.width * 0.82,
      options.y,
      options.x + options.width,
      options.y + 6,
      options.x + options.width * 0.74,
      options.y + 20,
      options.x + options.width * 0.26,
      options.y + 20,
    ],
    options.palette.dark,
    options.palette.dark,
    0.86,
  );
  drawEmissiveSlit(graphic, options.x + 8, options.sensorY, options.width - 16, 4, options.palette.core, 0.82);
  drawRivetCluster(
    graphic,
    [
      { x: options.x + 7, y: options.y + 7, radius: 1.6 },
      { x: options.x + options.width - 7, y: options.y + 7, radius: 1.6 },
      { x: options.x + options.width * 0.5, y: options.y + 17, radius: 1.4, alpha: 0.42 },
    ],
    options.palette,
  );
}

export function drawDragonSpine(
  graphic: PixiGraphics,
  options: {
    alpha?: number;
    count: number;
    palette: PixelPalette;
    root: Point;
    size: number;
    step: Point;
  },
): void {
  for (let index = 0; index < options.count; index += 1) {
    const x = options.root.x + options.step.x * index;
    const y = options.root.y + options.step.y * index;
    const size = options.size * (1 - index * 0.045);
    drawOutlinedPoly(
      graphic,
      [x - size * 0.55, y, x, y - size * 1.55, x + size * 0.55, y],
      index % 2 === 0 ? options.palette.accent : options.palette.trim,
      options.palette.dark,
      options.alpha ?? 0.66,
    );
  }
}

export function drawWingStruts(
  graphic: PixiGraphics,
  options: {
    alpha?: number;
    palette: PixelPalette;
    root: Point;
    struts: ReadonlyArray<Point>;
  },
): void {
  for (const strut of options.struts) {
    drawOutlinedSegment(
      graphic,
      options.root,
      strut,
      3,
      options.palette.trim,
      options.palette.dark,
      options.alpha ?? 0.54,
    );
    drawPixelJoint(graphic, strut.x, strut.y, 3, options.palette, (options.alpha ?? 0.54) + 0.12);
  }
}

export function drawWeaponRail(
  graphic: PixiGraphics,
  options: {
    length: number;
    palette: PixelPalette;
    x: number;
    y: number;
  },
): void {
  drawOutlinedRect(graphic, options.x, options.y, options.length, 7, options.palette.dark, options.palette.dark, 0.88);
  drawOutlinedRect(graphic, options.x + 4, options.y + 2, options.length - 8, 3, options.palette.armor, options.palette.dark, 0.72);
  for (let index = 0; index < Math.max(2, Math.floor(options.length / 16)); index += 1) {
    const x = options.x + 9 + index * 14;
    graphic
      .rect(x, options.y - 2, 5, 11)
      .fill({ color: options.palette.accent, alpha: 0.36 })
      .rect(x + 1, options.y, 3, 7)
      .fill({ color: options.palette.core, alpha: 0.38 });
  }
}
