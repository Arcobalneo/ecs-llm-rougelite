import {
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawOutlinedSegment,
  drawPixelJoint,
} from "../../../pixel-primitives.js";
import type { BossActionPoseProfile } from "./profile.js";
import type { BossActionPoseOptions } from "./types.js";

export function drawHumanoidAttackPose(
  options: BossActionPoseOptions,
  profile: BossActionPoseProfile,
  intensity: number,
): void {
  const graphic = options.graphic;
  for (const side of [-1, 1] as const) {
    const shoulder = { x: side * 54, y: -56 };
    const elbow = { x: side * (90 + intensity * 18), y: -46 - intensity * 28 };
    const cannon = { x: side * (146 + intensity * 46), y: -20 - intensity * 52 };
    drawOutlinedSegment(graphic, shoulder, elbow, 25, options.palette.dark, options.palette.dark, 0.58);
    drawOutlinedSegment(graphic, elbow, cannon, 32, options.palette.dark, options.palette.dark, 0.6);
    drawOutlinedSegment(graphic, shoulder, elbow, 14, options.palette.trim, options.palette.dark, 0.5 + intensity * 0.18);
    drawOutlinedSegment(graphic, elbow, cannon, 16, options.palette.armor, options.palette.dark, 0.54 + intensity * 0.18);
    const cannonX = side < 0 ? cannon.x - 82 : cannon.x;
    drawOutlinedRect(graphic, cannonX, cannon.y - 28, 82, 56, options.palette.dark, options.palette.dark, 0.66);
    drawOutlinedRect(graphic, cannonX + 9, cannon.y - 18, 64, 36, options.palette.armor, options.palette.dark, 0.6);
    drawEmissiveSlit(graphic, cannonX + 9, cannon.y - 7, 64, 14, options.palette.core, 0.52 + intensity * 0.38);
    drawPixelJoint(graphic, shoulder.x, shoulder.y, 12, options.palette, 0.66 + intensity * 0.2);
    drawPixelJoint(graphic, elbow.x, elbow.y, 9, options.palette, 0.56 + intensity * 0.18);
    graphic
      .circle(cannon.x + side * 8, cannon.y, 26 + intensity * 14)
      .stroke({ color: options.palette.accent, width: 2, alpha: 0.2 + intensity * 0.34 });
  }

  drawOutlinedPoly(
    graphic,
    [-28, -76, 0, -112 - intensity * 16, 28, -76, 18, -30, -18, -30],
    options.palette.dark,
    options.palette.dark,
    0.5,
  );
  drawEmissiveSlit(graphic, -18, -62, 36, 54 + profile.armCannonPoses * 4, options.palette.accent, 0.54 + intensity * 0.28);
  graphic
    .circle(0, -36, 38 + intensity * 18)
    .stroke({ color: options.palette.core, width: 2, alpha: 0.2 + intensity * 0.26 });
}
