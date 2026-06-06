import type { Point } from "../simulation/arena-math.js";

type PixiGraphics = import("pixi.js").Graphics;

export interface PixelPalette {
  accent: number;
  armor: number;
  core: number;
  dark: number;
  glow: number;
  trim: number;
}

export type PixelStampRows = readonly string[];

export function drawPixelGlow(
  graphic: PixiGraphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number,
): void {
  graphic
    .circle(x, y, radius)
    .fill({ color, alpha: alpha * 0.55 })
    .circle(x, y, radius * 0.92)
    .stroke({ color, width: 1, alpha })
    .circle(x, y, radius * 0.58)
    .fill({ color, alpha: alpha * 0.26 });
}

export function drawPixelHighlights(
  graphic: PixiGraphics,
  highlights: ReadonlyArray<{ color: number; height: number; width: number; x: number; y: number }>,
): void {
  for (const highlight of highlights) {
    graphic
      .rect(highlight.x, highlight.y, highlight.width, highlight.height)
      .fill({ color: highlight.color, alpha: 0.76 });
  }
}

export function drawOutlinedRect(
  graphic: PixiGraphics,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  outline = 0x020612,
  alpha = 0.92,
): void {
  graphic
    .rect(x - 2, y - 2, width + 4, height + 4)
    .fill({ color: outline, alpha: 0.95 })
    .rect(x, y, width, height)
    .fill({ color, alpha });
}

export function drawOutlinedPoly(
  graphic: PixiGraphics,
  points: readonly number[],
  color: number,
  outline = 0x020612,
  alpha = 0.9,
): void {
  const expanded = expandPolyFromCenter(points, 2.2);
  graphic
    .poly(expanded)
    .fill({ color: outline, alpha: 0.95 })
    .poly([...points])
    .fill({ color, alpha });
}

export function drawEmissiveSlit(
  graphic: PixiGraphics,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  alpha = 0.86,
): void {
  graphic
    .rect(x - 1, y - 1, width + 2, height + 2)
    .fill({ color: 0xe8fbff, alpha: alpha * 0.18 })
    .rect(x, y, width, height)
    .fill({ color, alpha });
}

export function drawThruster(
  graphic: PixiGraphics,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: PixelPalette,
  direction: "down" | "left" | "right" = "down",
): void {
  drawOutlinedRect(graphic, x, y, width, Math.max(3, height * 0.35), palette.dark, palette.dark, 0.94);
  if (direction === "down") {
    graphic
      .poly([x, y + height * 0.3, x + width * 0.5, y + height, x + width, y + height * 0.3])
      .fill({ color: palette.glow, alpha: 0.42 })
      .rect(x + width * 0.35, y + height * 0.34, width * 0.3, height * 0.5)
      .fill({ color: palette.accent, alpha: 0.58 });
    return;
  }
  const sign = direction === "left" ? -1 : 1;
  const baseX = direction === "left" ? x + width : x;
  graphic
    .poly([
      baseX,
      y,
      baseX + sign * height,
      y + height * 0.5,
      baseX,
      y + height,
    ])
    .fill({ color: palette.glow, alpha: 0.34 })
    .rect(baseX, y + height * 0.35, sign * height * 0.6, height * 0.3)
    .fill({ color: palette.accent, alpha: 0.5 });
}

export function drawPixelJoint(
  graphic: PixiGraphics,
  x: number,
  y: number,
  radius: number,
  palette: PixelPalette,
  alpha = 0.86,
): void {
  graphic
    .circle(x, y, radius + 2)
    .fill({ color: palette.dark, alpha: 0.92 })
    .circle(x, y, radius)
    .fill({ color: palette.trim, alpha })
    .rect(x - radius * 0.45, y - 1, radius * 0.9, 2)
    .fill({ color: palette.accent, alpha: 0.58 });
}

export function drawArmorPanel(
  graphic: PixiGraphics,
  points: readonly number[],
  palette: PixelPalette,
  alpha = 0.84,
): void {
  drawOutlinedPoly(graphic, points, palette.armor, palette.dark, alpha);
  const center = centerForPoly(points);
  graphic
    .circle(center.x, center.y, 2)
    .fill({ color: palette.accent, alpha: 0.46 });
}

export function drawOutlinedSegment(
  graphic: PixiGraphics,
  from: Point,
  to: Point,
  width: number,
  color: number,
  outline: number,
  alpha = 0.78,
): void {
  graphic
    .moveTo(from.x, from.y)
    .lineTo(to.x, to.y)
    .stroke({ color: outline, width: width + 4, alpha: 0.86 })
    .moveTo(from.x, from.y)
    .lineTo(to.x, to.y)
    .stroke({ color, width, alpha });
}

export function drawSensorPair(
  graphic: PixiGraphics,
  leftX: number,
  y: number,
  width: number,
  height: number,
  palette: PixelPalette,
): void {
  drawEmissiveSlit(graphic, leftX, y, width, height, palette.core, 0.88);
  drawEmissiveSlit(graphic, -leftX - width, y, width, height, palette.core, 0.88);
  graphic
    .rect(leftX + width + 1, y + 1, 2, height)
    .fill({ color: palette.accent, alpha: 0.54 })
    .rect(-leftX - width - 3, y + 1, 2, height)
    .fill({ color: palette.accent, alpha: 0.54 });
}

export function drawMicroPixelDebris(
  graphic: PixiGraphics,
  palette: { accent: number; color: number },
  options: { count: number; radius: number },
): void {
  for (let index = 0; index < options.count; index += 1) {
    const angle = index * 2.399;
    const distance = options.radius * (0.24 + (index % 5) * 0.13);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 2 + (index % 3);
    graphic
      .rect(x - 1, y - 1, size + 2, size + 2)
      .fill({ color: 0x020612, alpha: 0.46 })
      .rect(x, y, size, size)
      .fill({ color: index % 2 === 0 ? palette.color : palette.accent, alpha: 0.76 });
  }
}

export function drawStarSpark(
  graphic: PixiGraphics,
  x: number,
  y: number,
  color: number,
  alpha: number,
): void {
  graphic
    .moveTo(x - 5, y)
    .lineTo(x + 5, y)
    .stroke({ color, width: 1, alpha })
    .moveTo(x, y - 5)
    .lineTo(x, y + 5)
    .stroke({ color, width: 1, alpha });
}

export function drawGearShard(
  graphic: PixiGraphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number,
): void {
  graphic.circle(x, y, radius).stroke({ color, width: 1, alpha });
  for (let tooth = 0; tooth < 6; tooth += 1) {
    const angle = (tooth / 6) * Math.PI * 2;
    graphic
      .rect(x + Math.cos(angle) * radius - 2, y + Math.sin(angle) * radius - 2, 4, 4)
      .fill({ color, alpha: alpha * 0.8 });
  }
}

export function drawThemeResidue(
  graphic: PixiGraphics,
  visualKind: string,
  palette: { accent: number; color: number },
): void {
  if (visualKind === "beam") {
    for (const offset of [-16, 0, 16]) {
      graphic
        .rect(-38 + offset, 16 + Math.abs(offset) * 0.12, 18, 3)
        .fill({ color: offset === 0 ? palette.accent : palette.color, alpha: 0.26 });
    }
    return;
  }
  if (visualKind === "missile" || visualKind === "burst" || visualKind === "area") {
    graphic
      .circle(0, 0, visualKind === "area" ? 78 : 56)
      .stroke({ color: palette.color, width: 1, alpha: 0.13 })
      .circle(0, 0, visualKind === "area" ? 48 : 34)
      .stroke({ color: palette.accent, width: 1, alpha: 0.18 });
    return;
  }
  if (visualKind === "ricochet") {
    for (const [x, y] of [[-23, 18], [4, -10], [31, 6]] as const) {
      graphic
        .rect(x - 4, y - 4, 8, 8)
        .stroke({ color: palette.accent, width: 1, alpha: 0.42 });
    }
    return;
  }
  if (visualKind === "melee") {
    graphic
      .arc(0, 0, 55, -1.05, 1.12)
      .stroke({ color: palette.color, width: 1, alpha: 0.22 })
      .arc(0, 0, 64, -0.82, 0.9)
      .stroke({ color: palette.accent, width: 1, alpha: 0.16 });
  }
}

export function drawPixelStamp(
  graphic: PixiGraphics,
  rows: PixelStampRows,
  cellSize: number,
  palette: PixelPalette,
  options: { alpha?: number; x?: number; y?: number } = {},
): void {
  const rowWidth = Math.max(...rows.map((row) => row.length));
  const originX = options.x ?? -(rowWidth * cellSize) / 2;
  const originY = options.y ?? -(rows.length * cellSize) / 2;
  const alpha = options.alpha ?? 0.94;
  for (const [rowIndex, row] of rows.entries()) {
    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const token = row[columnIndex];
      if (!token || token === ".") {
        continue;
      }
      const color = colorForStampToken(token, palette);
      const x = originX + columnIndex * cellSize;
      const y = originY + rowIndex * cellSize;
      if (token !== "d") {
        graphic
          .rect(x - 1, y - 1, cellSize + 2, cellSize + 2)
          .fill({ color: palette.dark, alpha: 0.82 });
      }
      graphic
        .rect(x, y, cellSize, cellSize)
        .fill({ color, alpha: token === "e" || token === "g" ? Math.min(1, alpha + 0.04) : alpha });
    }
  }
}

function colorForStampToken(token: string, palette: PixelPalette): number {
  const colors: Record<string, number> = {
    A: palette.armor,
    C: palette.core,
    a: palette.accent,
    c: palette.core,
    d: palette.dark,
    e: palette.core,
    g: palette.glow,
    t: palette.trim,
  };
  return colors[token] ?? palette.armor;
}

function expandPolyFromCenter(points: readonly number[], amount: number): number[] {
  let centerX = 0;
  let centerY = 0;
  const count = points.length / 2;
  for (let index = 0; index < points.length; index += 2) {
    centerX += points[index] ?? 0;
    centerY += points[index + 1] ?? 0;
  }
  centerX /= count;
  centerY /= count;
  const expanded: number[] = [];
  for (let index = 0; index < points.length; index += 2) {
    const x = points[index] ?? 0;
    const y = points[index + 1] ?? 0;
    const dx = x - centerX;
    const dy = y - centerY;
    const length = Math.hypot(dx, dy) || 1;
    expanded.push(x + (dx / length) * amount, y + (dy / length) * amount);
  }
  return expanded;
}

function centerForPoly(points: readonly number[]): Point {
  let centerX = 0;
  let centerY = 0;
  const count = points.length / 2;
  for (let index = 0; index < points.length; index += 2) {
    centerX += points[index] ?? 0;
    centerY += points[index + 1] ?? 0;
  }
  return { x: centerX / count, y: centerY / count };
}
