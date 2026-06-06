import { PLAYER_COLLISION_RADIUS } from "../../simulation/arena-math.js";
import type { PlayerMechAnimationState } from "../combat-entity-animation.js";
import {
  drawCableBundle,
  drawHeatSinkStack,
  drawMechFaceplate,
  drawPanelSeams,
  drawRivetCluster,
  drawWeaponRail,
} from "../mech-detail-primitives.js";
import {
  drawEmissiveSlit,
  drawOutlinedRect,
  drawPixelHighlights,
  drawPixelStamp,
  drawThruster,
  type PixelPalette,
  type PixelStampRows,
} from "../pixel-primitives.js";
import { drawPlayerMechFrameArt } from "./player-mech-frame-art.js";
import { drawPlayerMechStateArt } from "./player-mech-state-art.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

const playerMechStamp: PixelStampRows = [
  "......tt......",
  ".....tCCt.....",
  "....tAeeAt....",
  "...ttACCAtt...",
  "..tAAAccAAAt..",
  ".tAdACCCAdAt.",
  "ttAdACCCAdAtt",
  "ddtdAeeAdtdd",
  ".tAAAccAAAt.",
  "..tdAAAAAdt..",
  "...tAAddAt...",
  "...tAddddAt..",
  "..tAgd..dgAt.",
  "..ggg....ggg.",
];

export function createPlayerMech(
  Graphics: PixiGraphicsCtor,
  animation: PlayerMechAnimationState = defaultPlayerMechAnimationState(),
): PixiGraphics {
  const graphic = new Graphics();
  drawPlayerMechGraphic(graphic, animation);
  return graphic;
}

export function redrawPlayerMechGraphic(
  graphic: PixiGraphics,
  animation: PlayerMechAnimationState,
): void {
  graphic.clear();
  drawPlayerMechGraphic(graphic, animation);
}

function drawPlayerMechGraphic(
  graphic: PixiGraphics,
  animation: PlayerMechAnimationState,
): void {
  const palette: PixelPalette = {
    accent: 0xff4fd8,
    armor: 0x8cefff,
    core: 0x44f5ff,
    dark: 0x020612,
    glow: 0x44f5ff,
    trim: 0xe8fbff,
  };
  const leanX = animation.leanX;
  const leanY = animation.leanY;
  graphic
    .circle(0, -3, 42)
    .stroke({ color: 0x44f5ff, width: 2, alpha: 0.16 })
    .circle(0, -3, 30)
    .stroke({ color: 0xff4fd8, width: 1, alpha: 0.18 });
  drawPlayerMechFrameArt(graphic, { animation, palette });
  drawPlayerMechStateArt(graphic, { animation, palette });
  drawPixelStamp(graphic, playerMechStamp, 5, palette, { x: -35 + leanX * 0.18, y: -41 + leanY * 0.16 });
  drawMechFaceplate(graphic, {
    palette,
    sensorY: -33 + leanY * 0.08,
    width: 42,
    x: -21 + leanX * 0.18,
    y: -43 + leanY * 0.14,
  });
  drawOutlinedRect(graphic, -38 + leanX * 0.42, -18 + leanY * 0.12, 14, 24, palette.armor, palette.dark, 0.9);
  drawOutlinedRect(graphic, 24 + leanX * 0.42, -17 + leanY * 0.12, 14, 24, palette.armor, palette.dark, 0.9);
  drawOutlinedRect(graphic, -51 + leanX * 0.6, -9 + leanY * 0.16, 15, 7, palette.accent, palette.dark, 0.94);
  drawOutlinedRect(graphic, 36 + leanX * 0.6, -8 + leanY * 0.16, 15, 7, palette.accent, palette.dark, 0.94);
  drawWeaponRail(graphic, { length: 36, palette, x: -61 + leanX * 0.58, y: -2 + leanY * 0.14 });
  drawWeaponRail(graphic, { length: 36, palette, x: 25 + leanX * 0.58, y: -1 + leanY * 0.14 });
  drawHeatSinkStack(graphic, { count: 4, height: 2, palette, width: 13, x: -36 + leanX * 0.32, y: 10 + leanY * 0.12 });
  drawHeatSinkStack(graphic, { count: 4, height: 2, palette, width: 13, x: 23 + leanX * 0.32, y: 10 + leanY * 0.12 });
  drawOutlinedRect(graphic, -21 - leanX * 0.16, 21 + leanY * 0.28, 11, 25, palette.trim, palette.dark, 0.9);
  drawOutlinedRect(graphic, 10 - leanX * 0.16, 21 + leanY * 0.28, 11, 25, palette.trim, palette.dark, 0.9);
  drawThruster(graphic, -19 - leanX * 0.35, 42 - Math.max(0, leanY * 0.2), 12, animation.thrusterDown, palette, "down");
  drawThruster(graphic, 7 - leanX * 0.35, 42 - Math.max(0, leanY * 0.2), 12, animation.thrusterDown * 0.92, palette, "down");
  drawThruster(graphic, -49, -3, 8, animation.thrusterLeft, palette, "left");
  drawThruster(graphic, 41, -3, 8, animation.thrusterRight, palette, "right");
  drawEmissiveSlit(graphic, -4 + leanX * 0.12, -33 + leanY * 0.08, 8, 6, palette.core, 0.9);
  drawEmissiveSlit(graphic, -5 + leanX * 0.16, -13 + leanY * 0.08, 10, 28, palette.core, 0.72);
  drawPanelSeams(
    graphic,
    [
      { from: { x: -24, y: -20 }, to: { x: -8, y: 10 }, width: 1 },
      { from: { x: 24, y: -20 }, to: { x: 8, y: 10 }, width: 1 },
      { from: { x: -17, y: 17 }, to: { x: -26, y: 40 }, width: 1, alpha: 0.34 },
      { from: { x: 17, y: 17 }, to: { x: 26, y: 40 }, width: 1, alpha: 0.34 },
    ],
    palette,
  );
  drawCableBundle(graphic, {
    count: 3,
    from: { x: -26 + leanX * 0.2, y: -6 + leanY * 0.1 },
    palette,
    sag: 5,
    to: { x: -11 + leanX * 0.2, y: 16 + leanY * 0.1 },
  });
  drawCableBundle(graphic, {
    count: 3,
    from: { x: 26 + leanX * 0.2, y: -6 + leanY * 0.1 },
    palette,
    sag: 5,
    to: { x: 11 + leanX * 0.2, y: 16 + leanY * 0.1 },
  });
  drawRivetCluster(
    graphic,
    [
      { x: -29, y: -13 },
      { x: 29, y: -13 },
      { x: -20, y: 17, radius: 1.5, alpha: 0.44 },
      { x: 20, y: 17, radius: 1.5, alpha: 0.44 },
      { x: -13, y: 38, radius: 1.5, alpha: 0.42 },
      { x: 13, y: 38, radius: 1.5, alpha: 0.42 },
    ],
    palette,
  );
  graphic
    .rect(-26, 45, 52, 4 + animation.movementStrength * 4)
    .fill({ color: palette.glow, alpha: 0.08 + animation.movementStrength * 0.09 })
    .rect(-17, 48, 34, 3 + animation.movementStrength * 5)
    .fill({ color: palette.accent, alpha: 0.08 + animation.movementStrength * 0.1 });
  drawPixelHighlights(graphic, [
    { x: -8, y: -31, width: 16, height: 2, color: 0xf7fdff },
    { x: -15, y: -18, width: 6, height: 3, color: 0xfff2a8 },
    { x: 9, y: -18, width: 6, height: 3, color: 0xfff2a8 },
    { x: -25, y: -11, width: 4, height: 17, color: 0x245cff },
    { x: 21, y: -11, width: 4, height: 17, color: 0x245cff },
    { x: -8, y: 22, width: 4, height: 12, color: 0xff4fd8 },
    { x: 4, y: 22, width: 4, height: 12, color: 0xff4fd8 },
    { x: -14, y: -4, width: 4, height: 18, color: 0x0b1026 },
    { x: 10, y: -4, width: 4, height: 18, color: 0x0b1026 },
  ]);
  graphic
    .circle(0, -3, PLAYER_COLLISION_RADIUS)
    .stroke({ color: 0xff4fd8, width: 2, alpha: 0.55 })
    .circle(0, -3, 34)
    .stroke({ color: 0x44f5ff, width: 1, alpha: 0.34 });
}

function defaultPlayerMechAnimationState(): PlayerMechAnimationState {
  return {
    bob: 0,
    hitFlash: 0,
    idleFrame: 0,
    leanX: 0,
    leanY: 0,
    movementStrength: 0,
    thrusterBack: 12,
    thrusterDown: 14,
    thrusterLeft: 8,
    thrusterRight: 8,
    wishInstallProgress: 1,
  };
}
