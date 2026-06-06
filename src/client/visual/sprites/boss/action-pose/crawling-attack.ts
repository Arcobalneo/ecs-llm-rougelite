import {
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedSegment,
} from "../../../pixel-primitives.js";
import type { BossActionPoseProfile } from "./profile.js";
import type { BossActionPoseOptions } from "./types.js";

export function drawCrawlingAttackPose(
  options: BossActionPoseOptions,
  profile: BossActionPoseProfile,
  intensity: number,
): void {
  const graphic = options.graphic;
  drawCrawlingHeadLunge(options, intensity);
  for (let claw = 0; claw < Math.min(8, profile.clawPoseStrikes); claw += 1) {
    const sideRow = claw % 2 === 0 ? -1 : 1;
    const x = -138 + claw * 42;
    const y = 48 + sideRow * intensity * 18;
    const reach = 56 + intensity * 46 + (claw % 3) * 8;
    drawOutlinedSegment(graphic, { x: x - 18, y: 14 }, { x: x + 24, y }, 14, options.palette.dark, options.palette.dark, 0.58);
    drawOutlinedSegment(graphic, { x: x - 12, y: 15 }, { x: x + 20, y }, 7, options.palette.trim, options.palette.dark, 0.44 + intensity * 0.28);
    drawOutlinedPoly(
      graphic,
      [x, y - 17, x + reach, y - 8, x + 18, y + 25, x - 15, y + 14],
      claw % 2 === 0 ? options.palette.core : options.palette.accent,
      options.palette.dark,
      0.5 + intensity * 0.36,
    );
    graphic
      .rect(x + 22, y - 3, 26 + intensity * 18, 3)
      .fill({ color: claw % 2 === 0 ? options.palette.accent : options.palette.core, alpha: 0.18 + intensity * 0.2 });
  }

  drawOutlinedSegment(graphic, { x: 30, y: -36 }, { x: 194 + intensity * 56, y: -74 - intensity * 14 }, 17, options.palette.dark, options.palette.dark, 0.54);
  drawOutlinedSegment(graphic, { x: 42, y: -36 }, { x: 184 + intensity * 48, y: -68 - intensity * 12 }, 9, options.palette.core, options.palette.dark, 0.44 + intensity * 0.4);
  drawEmissiveSlit(graphic, 54, -34, 66 + intensity * 48, 16, options.palette.accent, 0.54 + intensity * 0.3);
  graphic
    .moveTo(-160, 66)
    .lineTo(-48, 80 + intensity * 12)
    .lineTo(74, 68)
    .lineTo(196, 40 - intensity * 12)
    .stroke({ color: options.palette.accent, width: 3, alpha: 0.2 + intensity * 0.26 });
}

function drawCrawlingHeadLunge(options: BossActionPoseOptions, intensity: number): void {
  const graphic = options.graphic;
  const biteReach = 34 + intensity * 42;
  drawOutlinedPoly(
    graphic,
    [88, -56, 140 + biteReach, -82, 126 + biteReach, -48, 100, -34],
    options.palette.dark,
    options.palette.dark,
    0.5,
  );
  drawOutlinedPoly(
    graphic,
    [92, -48, 136 + biteReach, -66, 118 + biteReach, -38, 104, -28],
    options.palette.armor,
    options.palette.dark,
    0.48 + intensity * 0.24,
  );
  drawOutlinedPoly(
    graphic,
    [118, -40, 174 + biteReach, -20, 124, -10],
    options.palette.accent,
    options.palette.dark,
    0.38 + intensity * 0.36,
  );
  drawOutlinedPoly(
    graphic,
    [120, -30, 178 + biteReach, -46, 130, -54],
    options.palette.core,
    options.palette.dark,
    0.34 + intensity * 0.34,
  );
  graphic
    .circle(138 + biteReach * 0.52, -43, 28 + intensity * 16)
    .stroke({ color: options.palette.core, width: 2, alpha: 0.22 + intensity * 0.28 });
}
