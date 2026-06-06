import {
  drawArmorPanel,
  drawEmissiveSlit,
  drawOutlinedSegment,
} from "../../../pixel-primitives.js";
import { poseAnchors } from "./anchors.js";
import type { BossActionPoseProfile } from "./profile.js";
import type { BossActionPoseOptions } from "./types.js";

export function drawStaggerPose(
  options: BossActionPoseOptions,
  profile: BossActionPoseProfile,
  wounded: number,
): void {
  const anchors = poseAnchors(options.silhouette);
  const graphic = options.graphic;
  for (let index = 0; index < Math.min(profile.staggerPlates, anchors.length); index += 1) {
    const anchor = anchors[index];
    const drift = 12 + (index % 4) * 8 + wounded * 16;
    drawArmorPanel(
      graphic,
      [
        anchor.x - 12,
        anchor.y - 8,
        anchor.x + drift,
        anchor.y - 16,
        anchor.x + 14,
        anchor.y + 12,
        anchor.x - drift * 0.42,
        anchor.y + 14,
      ],
      options.palette,
      0.3 + wounded * 0.28,
    );
    drawOutlinedSegment(
      graphic,
      { x: anchor.x - 14, y: anchor.y },
      { x: anchor.x + 18 + drift * 0.28, y: anchor.y - 10 + (index % 3) * 8 },
      2,
      index % 2 === 0 ? options.palette.core : options.palette.accent,
      options.palette.dark,
      0.24 + wounded * 0.22,
    );
  }
  for (let index = 0; index < Math.min(profile.exposedPoseCores, anchors.length); index += 1) {
    const anchor = anchors[(index * 2) % anchors.length];
    drawEmissiveSlit(graphic, anchor.x - 8, anchor.y - 7, 16, 14, index % 2 === 0 ? options.palette.core : options.palette.accent, 0.52 + wounded * 0.3);
    graphic
      .circle(anchor.x, anchor.y, 15 + index)
      .stroke({ color: options.palette.core, width: 1, alpha: 0.22 + wounded * 0.18 });
  }
}
