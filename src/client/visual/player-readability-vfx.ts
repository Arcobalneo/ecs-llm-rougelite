import type { Point } from "../simulation/arena-math.js";
import {
  drawOutlinedPoly,
  drawPixelGlow,
} from "./pixel-primitives.js";

type PixiGraphics = import("pixi.js").Graphics;

export interface PlayerReadabilityVfxProfile {
  contrastPlates: number;
  focusRings: number;
  intensity: number;
  reticleTicks: number;
  shieldGlints: number;
}

export function playerReadabilityVfxProfile(options: {
  activeBossCount: number;
  enemyCount: number;
  feedbackCount: number;
  level: number;
  loadoutSize: number;
}): PlayerReadabilityVfxProfile {
  const pressure = Math.min(1, (
    options.enemyCount / 150 +
    options.feedbackCount / 48 +
    options.loadoutSize / 12 +
    options.activeBossCount / 2 +
    options.level / 45
  ) / 5);
  return {
    contrastPlates: 3 + Math.ceil(pressure * 6),
    focusRings: 1 + Math.ceil(pressure * 3),
    intensity: Math.max(0.16, pressure),
    reticleTicks: 4 + Math.ceil(pressure * 10),
    shieldGlints: 2 + Math.ceil(pressure * 8),
  };
}

export function drawPlayerReadabilityVfx(
  graphic: PixiGraphics,
  options: {
    activeBossCount: number;
    enemyCount: number;
    feedbackCount: number;
    level: number;
    loadoutSize: number;
    nowSeconds: number;
    player: Point;
  },
): void {
  const profile = playerReadabilityVfxProfile(options);
  const { player } = options;
  const pulse = 0.5 + Math.sin(options.nowSeconds * 4.1) * 0.5;
  graphic.clear();
  drawPixelGlow(graphic, player.x, player.y, 74 + profile.intensity * 22, 0x020612, 0.2 + profile.intensity * 0.12);
  graphic
    .circle(player.x, player.y, 48 + profile.intensity * 20)
    .fill({ color: 0x020612, alpha: 0.18 + profile.intensity * 0.16 })
    .circle(player.x, player.y, 64 + profile.intensity * 26)
    .stroke({ color: 0xe8fbff, width: 1, alpha: 0.14 + profile.intensity * 0.1 });
  drawContrastPlates(graphic, profile, player, options.nowSeconds);
  drawFocusRings(graphic, profile, player, pulse);
  drawReticleTicks(graphic, profile, player, options.nowSeconds);
  drawShieldGlints(graphic, profile, player, pulse);
}

function drawContrastPlates(
  graphic: PixiGraphics,
  profile: PlayerReadabilityVfxProfile,
  player: Point,
  nowSeconds: number,
): void {
  for (let plate = 0; plate < profile.contrastPlates; plate += 1) {
    const angle = plate * 2.399 + nowSeconds * 0.16;
    const radius = 42 + (plate % 3) * 9 + profile.intensity * 12;
    const x = player.x + Math.cos(angle) * radius;
    const y = player.y + Math.sin(angle) * radius;
    drawOutlinedPoly(
      graphic,
      [x - 12, y - 4, x + 2, y - 10, x + 14, y, x + 1, y + 10, x - 12, y + 5],
      plate % 2 === 0 ? 0x071426 : 0x120817,
      0x020612,
      0.26 + profile.intensity * 0.08,
    );
  }
}

function drawFocusRings(
  graphic: PixiGraphics,
  profile: PlayerReadabilityVfxProfile,
  player: Point,
  pulse: number,
): void {
  for (let ring = 0; ring < profile.focusRings; ring += 1) {
    const radius = 38 + ring * 12 + pulse * 2 + profile.intensity * 10;
    graphic.circle(player.x, player.y, radius).stroke({
      color: ring % 2 === 0 ? 0x44f5ff : 0xff4fd8,
      width: ring === 0 ? 2 : 1,
      alpha: 0.16 + profile.intensity * 0.1 - ring * 0.028,
    });
  }
}

function drawReticleTicks(
  graphic: PixiGraphics,
  profile: PlayerReadabilityVfxProfile,
  player: Point,
  nowSeconds: number,
): void {
  for (let tick = 0; tick < profile.reticleTicks; tick += 1) {
    const angle = (tick / profile.reticleTicks) * Math.PI * 2 + nowSeconds * 0.08;
    const inner = 54 + profile.intensity * 11 + (tick % 2) * 5;
    const outer = inner + 11 + (tick % 3) * 3;
    graphic
      .moveTo(player.x + Math.cos(angle) * inner, player.y + Math.sin(angle) * inner)
      .lineTo(player.x + Math.cos(angle) * outer, player.y + Math.sin(angle) * outer)
      .stroke({ color: tick % 2 === 0 ? 0xe8fbff : 0x44f5ff, width: tick % 4 === 0 ? 2 : 1, alpha: 0.24 + profile.intensity * 0.12 });
  }
}

function drawShieldGlints(
  graphic: PixiGraphics,
  profile: PlayerReadabilityVfxProfile,
  player: Point,
  pulse: number,
): void {
  for (let glint = 0; glint < profile.shieldGlints; glint += 1) {
    const angle = glint * 2.399 + pulse * 0.3;
    const radius = 34 + (glint % 4) * 8 + profile.intensity * 12;
    const x = player.x + Math.cos(angle) * radius;
    const y = player.y + Math.sin(angle) * radius;
    graphic
      .moveTo(x - 5, y)
      .lineTo(x + 5, y)
      .stroke({ color: glint % 2 === 0 ? 0x62ff9d : 0xe8fbff, width: 1, alpha: 0.24 + profile.intensity * 0.12 })
      .moveTo(x, y - 5)
      .lineTo(x, y + 5)
      .stroke({ color: 0xe8fbff, width: 1, alpha: 0.18 + profile.intensity * 0.08 });
  }
}
