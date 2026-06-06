import {
  drawDragonSpine,
  drawHeatSinkStack,
  drawPanelSeams,
  drawRivetCluster,
} from "../../mech-detail-primitives.js";
import {
  drawArmorPanel,
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawOutlinedSegment,
  drawPixelJoint,
  drawPixelStamp,
  type PixelStampRows,
} from "../../pixel-primitives.js";
import type { BossSilhouetteDrawOptions } from "./boss-sprite-types.js";
import { drawCrawlingBossStateBodyParts } from "./boss-state-body-parts.js";

const crawlingDragonBossStamp: PixelStampRows = [
  "........aaaaa........",
  ".......aCCCCa...tt...",
  "...tttAACCCCAt.AAAt..",
  "..tAAddddddAAACCCAt.",
  ".tAAddAeeeeAAAdddAt.",
  "tAAACCCCCCCCCAAddAt",
  ".tdAAAcccccAAAdtt.",
  "ttggt..tAAAt..tggtt",
  "g..gg..tgggt..gg..g",
];

export function drawCrawlingDragonBoss(options: BossSilhouetteDrawOptions): void {
  const { animation, graphic, palette } = options;
  const crawl = (animation.frame % 2 === 0 ? -1 : 1) * 3;
  drawOutlinedRect(graphic, -102, -20, 176, 48, palette.dark, palette.dark, 0.56);
  drawOutlinedPoly(graphic, [36, -42, 89, -33 - animation.jawOpen * 8, 119, -12, 82, 8 + animation.jawOpen * 4, 31, -11], palette.armor, palette.dark, 0.7);
  drawOutlinedPoly(graphic, [91, -27, 128, -41, 115, -6], palette.accent, palette.dark, 0.86);
  drawEmissiveSlit(graphic, 79, -21, 12, 6, 0xfff2a8, 0.82);
  for (const side of [-1, 1]) {
    drawOutlinedSegment(graphic, { x: side * 34, y: 15 }, { x: side * 62, y: 34 + crawl }, 11, palette.trim, palette.dark, 0.72);
    drawOutlinedSegment(graphic, { x: side * 70, y: 31 + crawl }, { x: side * 104, y: 38 - crawl }, 9, palette.accent, palette.dark, 0.58);
    drawOutlinedSegment(graphic, { x: side * 6, y: 17 }, { x: side * 42, y: 33 - crawl }, 9, palette.trim, palette.dark, 0.62);
    drawPixelJoint(graphic, side * 39, 17, 6, palette, 0.74);
    drawOutlinedPoly(
      graphic,
      [side * 98, 31 - crawl, side * 122, 43 - crawl, side * 94, 50 + crawl],
      palette.dark,
      palette.dark,
      0.76,
    );
    drawOutlinedPoly(
      graphic,
      [side * 98, 31 - crawl, side * 116, 40 - crawl, side * 96, 45 + crawl],
      palette.accent,
      palette.dark,
      0.64,
    );
  }
  drawPixelStamp(graphic, crawlingDragonBossStamp, 8, palette, { y: -48 });
  drawCrawlingBossStateBodyParts({
    animation,
    graphic,
    healthProgress: options.healthProgress,
    palette,
  });
  drawDragonSpine(graphic, {
    count: 8,
    palette,
    root: { x: -72, y: -31 },
    size: 11,
    step: { x: 21, y: 1 },
  });
  drawArmorPanel(graphic, [-66, -30, -33, -40, -19, -18, -56, -9], palette, 0.62);
  drawArmorPanel(graphic, [-22, -36, 24, -36, 29, -13, -27, -13], palette, 0.7);
  drawArmorPanel(graphic, [26, -28, 62, -20, 55, 6, 19, -5], palette, 0.66);
  drawEmissiveSlit(graphic, -24, -33, 48, 7, palette.core, 0.78);
  drawEmissiveSlit(graphic, -7, -10, 14, 30, palette.accent, 0.52);
  drawEmissiveSlit(graphic, 57, -17, 13, 5, 0xfff2a8, 0.78);
  drawHeatSinkStack(graphic, { count: 6, height: 3, palette, width: 56, x: -61, y: -6, alpha: 0.42 });
  drawPanelSeams(
    graphic,
    [
      { from: { x: -72, y: -15 }, to: { x: 51, y: -9 }, width: 1, alpha: 0.32 },
      { from: { x: -58, y: 7 }, to: { x: 28, y: 16 }, width: 1, alpha: 0.28 },
      { from: { x: 38, y: -35 }, to: { x: 82, y: 0 }, width: 1, alpha: 0.34 },
    ],
    palette,
  );
  drawRivetCluster(
    graphic,
    [
      { x: -58, y: -24 },
      { x: -19, y: -30 },
      { x: 24, y: -22 },
      { x: 58, y: -11 },
      { x: -34, y: 15, radius: 1.7 },
      { x: 17, y: 13, radius: 1.7 },
    ],
    palette,
  );
  drawOutlinedSegment(graphic, { x: -75, y: -2 }, { x: -36, y: 13 }, 3, palette.trim, palette.dark, 0.52);
  drawOutlinedSegment(graphic, { x: -37, y: 7 }, { x: 8, y: 18 }, 3, palette.trim, palette.dark, 0.48);
  for (let index = 0; index < 7; index += 1) {
    drawOutlinedPoly(
      graphic,
      [-74 + index * 22, -31, -64 + index * 22, -56, -53 + index * 22, -31],
      index % 2 === 0 ? palette.accent : 0xe8fbff,
      palette.dark,
      0.62,
    );
  }
  graphic
    .circle(0, 0, 82)
    .stroke({ color: palette.accent, width: 2, alpha: 0.2 })
    .circle(28, -8, 58)
    .stroke({ color: palette.armor, width: 1, alpha: 0.18 });
}
