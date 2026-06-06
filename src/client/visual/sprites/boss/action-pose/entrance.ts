import {
  drawEmissiveSlit,
  drawOutlinedRect,
} from "../../../pixel-primitives.js";
import type { BossActionPoseProfile } from "./profile.js";
import type { BossActionPoseOptions } from "./types.js";
import { poseAnchors } from "./anchors.js";

export function drawEntrancePose(
  options: BossActionPoseOptions,
  profile: BossActionPoseProfile,
  intensity: number,
): void {
  const anchors = poseAnchors(options.silhouette);
  const graphic = options.graphic;
  for (let index = 0; index < Math.min(profile.entranceFrames, anchors.length); index += 1) {
    const anchor = anchors[index];
    const height = 32 + (index % 3) * 14 + intensity * 26;
    const width = 16 + (index % 2) * 5;
    drawOutlinedRect(
      graphic,
      anchor.x - width * 0.5,
      anchor.y - height * 0.5,
      width,
      height,
      index % 2 === 0 ? options.palette.dark : options.palette.armor,
      options.palette.dark,
      0.34 + intensity * 0.4,
    );
    drawEmissiveSlit(
      graphic,
      anchor.x - 5,
      anchor.y - height * 0.34,
      10,
      height * 0.68,
      index % 2 === 0 ? options.palette.core : options.palette.accent,
      0.3 + intensity * 0.4,
    );
    graphic
      .rect(anchor.x - 20, anchor.y - height * 0.08, 40, 2)
      .fill({ color: options.palette.accent, alpha: 0.16 + intensity * 0.22 });
  }

  const focusY = options.silhouette === "humanoid" ? -38 : options.silhouette === "crawling" ? -6 : -12;
  graphic
    .circle(0, focusY, 72 + intensity * 48)
    .stroke({ color: options.palette.accent, width: 2, alpha: 0.14 + intensity * 0.26 })
    .circle(0, focusY, 42 + intensity * 30)
    .stroke({ color: options.palette.core, width: 1, alpha: 0.16 + intensity * 0.22 });
}
