import {
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedSegment,
} from "../../../pixel-primitives.js";
import type { BossActionPoseProfile } from "./profile.js";
import type { BossActionPoseOptions } from "./types.js";

export function drawFlyingAttackPose(
  options: BossActionPoseOptions,
  profile: BossActionPoseProfile,
  intensity: number,
): void {
  const graphic = options.graphic;
  for (const side of [-1, 1] as const) {
    const wingLift = 40 + intensity * 58;
    const wingTip = { x: side * (198 + intensity * 42), y: -86 - wingLift };
    const lowerTip = { x: side * (176 + intensity * 34), y: 44 + intensity * 10 };
    drawOutlinedSegment(graphic, { x: side * 20, y: -34 }, wingTip, 14, options.palette.dark, options.palette.dark, 0.58);
    drawOutlinedSegment(graphic, { x: side * 28, y: -30 }, wingTip, 7, options.palette.core, options.palette.dark, 0.48 + intensity * 0.34);
    drawOutlinedSegment(graphic, { x: side * 16, y: -18 }, lowerTip, 10, options.palette.trim, options.palette.dark, 0.32 + intensity * 0.3);
    drawOutlinedPoly(
      graphic,
      [
        side * 42,
        -44,
        side * (124 + intensity * 16),
        -100 - wingLift * 0.45,
        side * (96 + intensity * 18),
        -36,
      ],
      options.palette.dark,
      options.palette.dark,
      0.42,
    );

    for (let blade = 0; blade < Math.min(9, profile.wingPoseBlades); blade += 1) {
      const row = blade % 3;
      const reach = 42 + intensity * 34 + row * 10;
      const x = side * (70 + blade * 17);
      const y = -70 - wingLift * 0.48 + row * 32 + Math.floor(blade / 3) * 10;
      drawOutlinedPoly(
        graphic,
        [x, y, x + side * (reach + 12), y - 28 - row * 5, x + side * (28 + row * 5), y + 26],
        blade % 2 === 0 ? options.palette.accent : options.palette.core,
        options.palette.dark,
        0.5 + intensity * 0.3,
      );
    }
  }

  drawEmissiveSlit(graphic, -22, -48 - intensity * 14, 44, 18 + intensity * 18, options.palette.core, 0.58 + intensity * 0.3);
  graphic
    .moveTo(-42, -38)
    .lineTo(0, -66 - intensity * 24)
    .lineTo(42, -38)
    .stroke({ color: options.palette.accent, width: 2, alpha: 0.26 + intensity * 0.32 });
  graphic
    .circle(0, -50, 46 + intensity * 22)
    .stroke({ color: options.palette.core, width: 2, alpha: 0.18 + intensity * 0.26 });
}
