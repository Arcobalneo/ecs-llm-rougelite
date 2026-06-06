import {
  drawCableBundle,
  drawDragonSpine,
  drawHeatSinkStack,
  drawMechFaceplate,
  drawPanelSeams,
  drawRivetCluster,
  drawWingStruts,
} from "../../mech-detail-primitives.js";
import {
  drawArmorPanel,
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedSegment,
  drawPixelJoint,
  drawPixelStamp,
  drawThruster,
  type PixelStampRows,
} from "../../pixel-primitives.js";
import type { BossSilhouetteDrawOptions } from "./boss-sprite-types.js";
import { drawFlyingBossStateBodyParts } from "./boss-state-body-parts.js";

const flyingDragonBossStamp: PixelStampRows = [
  "............aa............",
  "...........aCCa...........",
  ".....tt...aACCAa...tt.....",
  "....tAAttaACCCCaattAAt....",
  "...tAACCAAddddAACCAAt...",
  "..tAACCCAAeeeeAACCCAAt..",
  ".ttAAddAACCccAAddAAtt.",
  "..tAAggAAddddAAggAAt..",
  "...tgg..ttAAAtt..ggt...",
  "....g....tACAt....g....",
  ".........tgggt.........",
];

export function drawFlyingDragonBoss(options: BossSilhouetteDrawOptions): void {
  const { animation, graphic, palette } = options;
  const wingOpen = animation.wingSpread;
  drawOutlinedPoly(
    graphic,
    [-132 * wingOpen, -10, -78 * wingOpen, -55 * wingOpen, -28, -28, -6, -48, -16, -13, -70 * wingOpen, 30],
    palette.dark,
    palette.dark,
    0.58,
  );
  drawOutlinedPoly(
    graphic,
    [132 * wingOpen, -10, 78 * wingOpen, -55 * wingOpen, 28, -28, 6, -48, 16, -13, 70 * wingOpen, 30],
    palette.dark,
    palette.dark,
    0.58,
  );
  drawOutlinedPoly(
    graphic,
    [-112 * wingOpen, -6, -70 * wingOpen, -42 * wingOpen, -20, -18, -2, -36, -14, -5, -62 * wingOpen, 22],
    palette.armor,
    palette.dark,
    0.44,
  );
  drawOutlinedPoly(
    graphic,
    [112 * wingOpen, -6, 70 * wingOpen, -42 * wingOpen, 20, -18, 2, -36, 14, -5, 62 * wingOpen, 22],
    palette.armor,
    palette.dark,
    0.44,
  );
  for (const side of [-1, 1]) {
    drawOutlinedSegment(graphic, { x: side * 9, y: -25 }, { x: side * 84, y: -28 }, 3, palette.trim, palette.dark, 0.62);
    drawOutlinedSegment(graphic, { x: side * 13, y: -2 }, { x: side * 72, y: 18 }, 3, palette.accent, palette.dark, 0.42);
    drawArmorPanel(graphic, [side * 60, -12, side * 91, -25, side * 75, -2, side * 51, 5], palette, 0.58);
    drawWingStruts(graphic, {
      alpha: 0.5,
      palette,
      root: { x: side * 13, y: -24 },
      struts: [
        { x: side * 74 * wingOpen, y: -48 * wingOpen },
        { x: side * 97 * wingOpen, y: -13 },
        { x: side * 65 * wingOpen, y: 25 },
      ],
    });
    drawHeatSinkStack(graphic, {
      count: 5,
      height: 3,
      palette,
      width: 24,
      x: side < 0 ? -109 * wingOpen : 85 * wingOpen,
      y: -13,
      alpha: 0.42,
    });
  }
  drawPixelStamp(graphic, flyingDragonBossStamp, 7, palette, { y: -47 });
  drawFlyingBossStateBodyParts({
    animation,
    graphic,
    healthProgress: options.healthProgress,
    palette,
  });
  drawMechFaceplate(graphic, { palette, sensorY: -33 - animation.jawOpen * 3, width: 54, x: -27, y: -48 - animation.jawOpen * 2 });
  drawArmorPanel(graphic, [-32, -21, 32, -21, 26, 25, -26, 25], palette, 0.72);
  drawDragonSpine(graphic, {
    count: 6,
    palette,
    root: { x: -47, y: 31 },
    size: 12,
    step: { x: 18, y: 3 },
  });
  drawPanelSeams(
    graphic,
    [
      { from: { x: -28, y: -17 }, to: { x: -9, y: 21 }, width: 1, alpha: 0.32 },
      { from: { x: 28, y: -17 }, to: { x: 9, y: 21 }, width: 1, alpha: 0.32 },
      { from: { x: -39, y: 5 }, to: { x: 39, y: 5 }, width: 1, alpha: 0.28 },
    ],
    palette,
  );
  drawEmissiveSlit(graphic, -13, -33 - animation.jawOpen * 3, 26, 8 + animation.jawOpen * 4, palette.accent, 0.84);
  drawEmissiveSlit(graphic, -5, -19, 10, 42, 0xe8fbff, 0.44);
  drawEmissiveSlit(graphic, -22, -8, 9, 5, palette.core, 0.76);
  drawEmissiveSlit(graphic, 13, -8, 9, 5, palette.core, 0.76);
  drawOutlinedSegment(graphic, { x: -30, y: 5 }, { x: -11, y: 20 }, 3, palette.trim, palette.dark, 0.58);
  drawOutlinedSegment(graphic, { x: 30, y: 5 }, { x: 11, y: 20 }, 3, palette.trim, palette.dark, 0.58);
  drawOutlinedPoly(graphic, [-12, -48, 0, -78, 12, -48], palette.accent, palette.dark, 0.84);
  drawOutlinedPoly(graphic, [-31, -47, -49, -66, -13, -52], palette.trim, palette.dark, 0.66);
  drawOutlinedPoly(graphic, [31, -47, 49, -66, 13, -52], palette.trim, palette.dark, 0.66);
  drawOutlinedPoly(graphic, [-52, 24, -20, 48, -13, 19], palette.accent, palette.dark, 0.56);
  drawOutlinedPoly(graphic, [52, 24, 20, 48, 13, 19], palette.accent, palette.dark, 0.56);
  drawCableBundle(graphic, {
    count: 4,
    from: { x: -35, y: 18 },
    palette,
    sag: 10,
    to: { x: 35, y: 18 },
  });
  drawRivetCluster(
    graphic,
    [
      { x: -42, y: -22 },
      { x: 42, y: -22 },
      { x: -31, y: 16, radius: 1.6 },
      { x: 31, y: 16, radius: 1.6 },
      { x: 0, y: -6, radius: 2, alpha: 0.5 },
    ],
    palette,
  );
  for (const side of [-1, 1]) {
    drawPixelJoint(graphic, side * 34, -7, 5, palette, 0.8);
    drawEmissiveSlit(graphic, side * 29 - (side < 0 ? 12 : 0), -12, 12, 6, 0xfff2a8, 0.76);
    drawThruster(graphic, side * 66 - (side < 0 ? 12 : 0), -15, 12, 18, palette, side < 0 ? "left" : "right");
  }
  graphic
    .circle(0, -7, 44)
    .stroke({ color: palette.accent, width: 3, alpha: 0.34 })
    .circle(0, -7, 72)
    .stroke({ color: palette.armor, width: 1, alpha: 0.16 });
}
