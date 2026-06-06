import {
  drawCableBundle,
  drawDragonSpine,
  drawHeatSinkStack,
  drawMechFaceplate,
  drawPanelSeams,
  drawRivetCluster,
  drawWeaponRail,
} from "../../mech-detail-primitives.js";
import {
  drawArmorPanel,
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawOutlinedSegment,
  drawPixelHighlights,
  drawPixelJoint,
  drawPixelStamp,
  drawSensorPair,
  type PixelStampRows,
} from "../../pixel-primitives.js";
import type { BossSilhouetteDrawOptions } from "./boss-sprite-types.js";
import { drawHumanoidBossStateBodyParts } from "./boss-state-body-parts.js";

const humanoidDragonBossStamp: PixelStampRows = [
  "......a...a......",
  ".....aCaaaCa.....",
  "....tACeeeCAt....",
  "...tAACCCCAAt...",
  "..tAAdddddAAt..",
  ".ttAACCeeCCAtt.",
  "dtdAACCCCCAdtd",
  "..tAAAdddAAAt..",
  "..tAAdddddAAt..",
  ".ttAgg..ggAtt.",
  ".ggg......ggg.",
];

export function drawHumanoidDragonBoss(options: BossSilhouetteDrawOptions): void {
  const { animation, graphic, palette } = options;
  const armLift = animation.telegraph * 18 + (animation.frame % 2 === 0 ? -3 : 3);
  drawOutlinedSegment(graphic, { x: -51, y: -52 }, { x: -82, y: 18 - armLift }, 30, palette.trim, palette.dark, 0.72);
  drawOutlinedSegment(graphic, { x: 51, y: -52 }, { x: 82, y: 18 - armLift }, 30, palette.trim, palette.dark, 0.72);
  drawWeaponRail(graphic, { length: 62, palette, x: -118, y: 6 - armLift });
  drawWeaponRail(graphic, { length: 62, palette, x: 56, y: 6 - armLift });
  drawOutlinedSegment(graphic, { x: -33, y: 28 }, { x: -32, y: 91 }, 22, palette.trim, palette.dark, 0.72);
  drawOutlinedSegment(graphic, { x: 33, y: 28 }, { x: 32, y: 91 }, 22, palette.trim, palette.dark, 0.72);
  drawOutlinedRect(graphic, -46, -63, 92, 97, palette.armor, palette.dark, 0.5);
  drawPixelStamp(graphic, humanoidDragonBossStamp, 8, palette, { y: -96 });
  drawHumanoidBossStateBodyParts({
    animation,
    graphic,
    healthProgress: options.healthProgress,
    palette,
  });
  drawOutlinedRect(graphic, -34, -96, 68, 35, palette.dark, palette.dark, 0.66);
  drawMechFaceplate(graphic, { palette, sensorY: -85, width: 58, x: -29, y: -101 - animation.jawOpen * 4 });
  drawOutlinedRect(graphic, -24, -103 - animation.jawOpen * 4, 48, 18 + animation.jawOpen * 4, palette.accent, palette.dark, 0.84);
  drawOutlinedPoly(graphic, [-24, -101, -47, -128, -12, -105], palette.armor, palette.dark, 0.7);
  drawOutlinedPoly(graphic, [24, -101, 47, -128, 12, -105], palette.armor, palette.dark, 0.7);
  drawDragonSpine(graphic, {
    count: 5,
    palette,
    root: { x: -24, y: -126 },
    size: 10,
    step: { x: 12, y: 0 },
  });
  drawArmorPanel(graphic, [-50, -57, 50, -57, 42, 34, -42, 34], palette, 0.56);
  drawOutlinedRect(graphic, -25, -48, 50, 74, palette.dark, palette.dark, 0.6);
  drawEmissiveSlit(graphic, -9, -41, 18, 60, palette.accent, 0.66);
  drawHeatSinkStack(graphic, { count: 6, height: 3, palette, width: 26, x: -42, y: -31, alpha: 0.4 });
  drawHeatSinkStack(graphic, { count: 6, height: 3, palette, width: 26, x: 16, y: -31, alpha: 0.4 });
  drawCableBundle(graphic, {
    count: 5,
    from: { x: -31, y: -17 },
    palette,
    sag: 12,
    to: { x: 31, y: -17 },
  });
  drawPanelSeams(
    graphic,
    [
      { from: { x: -45, y: -47 }, to: { x: -16, y: 24 }, width: 1, alpha: 0.3 },
      { from: { x: 45, y: -47 }, to: { x: 16, y: 24 }, width: 1, alpha: 0.3 },
      { from: { x: -39, y: -3 }, to: { x: 39, y: -3 }, width: 1, alpha: 0.28 },
    ],
    palette,
  );
  drawSensorPair(graphic, -17, -84, 8, 5, palette);
  drawOutlinedSegment(graphic, { x: -43, y: -18 }, { x: -14, y: 13 }, 3, palette.trim, palette.dark, 0.55);
  drawOutlinedSegment(graphic, { x: 43, y: -18 }, { x: 14, y: 13 }, 3, palette.trim, palette.dark, 0.55);
  drawOutlinedRect(graphic, -108, 19, 47, 22, palette.accent, palette.dark, 0.68);
  drawOutlinedRect(graphic, 61, 19, 47, 22, palette.accent, palette.dark, 0.68);
  drawOutlinedRect(graphic, -48, 85, 36, 16, palette.accent, palette.dark, 0.72);
  drawOutlinedRect(graphic, 12, 85, 36, 16, palette.accent, palette.dark, 0.72);
  for (const side of [-1, 1]) {
    drawPixelJoint(graphic, side * 51, -42, 7, palette, 0.78);
    drawPixelJoint(graphic, side * 34, 35, 6, palette, 0.76);
  }
  drawRivetCluster(
    graphic,
    [
      { x: -42, y: -53 },
      { x: 42, y: -53 },
      { x: -29, y: 26, radius: 1.7 },
      { x: 29, y: 26, radius: 1.7 },
      { x: -33, y: 84, radius: 1.6 },
      { x: 33, y: 84, radius: 1.6 },
    ],
    palette,
  );
  drawPixelHighlights(graphic, [
    { x: -16, y: -84, width: 8, height: 5, color: 0xfff2a8 },
    { x: 8, y: -84, width: 8, height: 5, color: 0xfff2a8 },
    { x: -61, y: -29, width: 6, height: 34, color: palette.accent },
    { x: 55, y: -29, width: 6, height: 34, color: palette.accent },
    { x: -5, y: 23, width: 10, height: 15, color: 0xe8fbff },
  ]);
  graphic
    .circle(0, -8, 86)
    .stroke({ color: palette.accent, width: 3, alpha: 0.24 })
    .circle(0, -8, 118)
    .stroke({ color: palette.armor, width: 1, alpha: 0.13 });
}
