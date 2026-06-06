import { drawCrawlingAttackPose } from "./action-pose/crawling-attack.js";
import { drawEntrancePose } from "./action-pose/entrance.js";
import { drawFlyingAttackPose } from "./action-pose/flying-attack.js";
import { drawHumanoidAttackPose } from "./action-pose/humanoid-attack.js";
import {
  bossActionPoseProfile,
  bossActionPoseSignature,
  entranceIntensity,
} from "./action-pose/profile.js";
import { drawStaggerPose } from "./action-pose/stagger.js";
import type { BossActionPoseOptions } from "./action-pose/types.js";
import { drawPixelGlow } from "../../pixel-primitives.js";

export {
  bossActionPoseProfile,
  bossActionPoseSignature,
  type BossActionPoseProfile,
} from "./action-pose/profile.js";
export type { BossActionPoseOptions } from "./action-pose/types.js";

export function drawBossActionPose(
  graphic: BossActionPoseOptions["graphic"],
  options: Omit<BossActionPoseOptions, "graphic">,
): void {
  const profile = bossActionPoseProfile(options);
  if (
    profile.entranceFrames +
    profile.posePanels +
    profile.wingPoseBlades +
    profile.clawPoseStrikes +
    profile.armCannonPoses +
    profile.exposedPoseCores +
    profile.staggerPlates <= 0
  ) {
    return;
  }

  const attack = Math.max(0, Math.min(1, options.animation.telegraph));
  const entrance = entranceIntensity(options.animation);
  const wounded = 1 - Math.max(0, Math.min(1, options.healthProgress));
  const focusY = options.silhouette === "humanoid" ? -34 : options.silhouette === "crawling" ? -2 : -14;
  drawPixelGlow(
    graphic,
    0,
    focusY,
    108 + attack * 74 + entrance * 44 + wounded * 18,
    options.palette.core,
    0.06 + attack * 0.1 + entrance * 0.07 + wounded * 0.03,
  );

  const drawOptions: BossActionPoseOptions = { ...options, graphic };
  if (profile.entranceFrames > 0) {
    drawEntrancePose(drawOptions, profile, entrance);
  }
  if (profile.wingPoseBlades > 0) {
    drawFlyingAttackPose(drawOptions, profile, attack);
  }
  if (profile.clawPoseStrikes > 0) {
    drawCrawlingAttackPose(drawOptions, profile, attack);
  }
  if (profile.armCannonPoses > 0) {
    drawHumanoidAttackPose(drawOptions, profile, attack);
  }
  if (profile.exposedPoseCores > 0 || profile.staggerPlates > 0) {
    drawStaggerPose(drawOptions, profile, wounded);
  }
}
