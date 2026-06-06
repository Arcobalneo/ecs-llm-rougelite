import type { BossMechSilhouette } from "../../../../../shared/boss/boss-planning.js";
import type { BossSpriteAnimationState } from "../../../combat-entity-animation.js";

export interface BossActionPoseProfile {
  armCannonPoses: number;
  clawPoseStrikes: number;
  entranceFrames: number;
  exposedPoseCores: number;
  posePanels: number;
  staggerPlates: number;
  wingPoseBlades: number;
}

export function bossActionPoseProfile(options: {
  animation: BossSpriteAnimationState;
  healthProgress: number;
  silhouette: BossMechSilhouette;
}): BossActionPoseProfile {
  const entrance = entranceIntensity(options.animation);
  const attack = Math.max(0, Math.min(1, options.animation.telegraph));
  const wounded = 1 - Math.max(0, Math.min(1, options.healthProgress));
  const stagger = wounded > 0.46 ? Math.min(1, (wounded - 0.46) / 0.4) : 0;
  const silhouetteWeight = options.silhouette === "flying" ? 1.28 : options.silhouette === "humanoid" ? 1.2 : 1.16;

  return {
    armCannonPoses: options.silhouette === "humanoid" ? Math.ceil(attack * 6) : 0,
    clawPoseStrikes: options.silhouette === "crawling" ? Math.ceil(attack * 8) : 0,
    entranceFrames: Math.ceil(entrance * 7 * silhouetteWeight),
    exposedPoseCores: wounded > 0.34 ? Math.ceil((wounded - 0.34) * 10 * silhouetteWeight) : 0,
    posePanels: Math.ceil((entrance * 1.2 + attack * 1.1 + stagger * 1.2) * 5 * silhouetteWeight),
    staggerPlates: Math.ceil(stagger * 11 * silhouetteWeight),
    wingPoseBlades: options.silhouette === "flying" ? Math.ceil(attack * 10) : 0,
  };
}

export function bossActionPoseSignature(options: {
  animation: BossSpriteAnimationState;
  healthProgress: number;
  silhouette: BossMechSilhouette;
}): string {
  const profile = bossActionPoseProfile(options);
  const state = profile.entranceFrames > 0
    ? "entrance"
    : profile.staggerPlates > 0
      ? "stagger"
      : profile.wingPoseBlades + profile.clawPoseStrikes + profile.armCannonPoses > 0
        ? "attack"
        : "idle";
  return [
    options.silhouette,
    state,
    `e${profile.entranceFrames}`,
    `p${profile.posePanels}`,
    `w${profile.wingPoseBlades}`,
    `c${profile.clawPoseStrikes}`,
    `a${profile.armCannonPoses}`,
    `x${profile.exposedPoseCores}`,
    `s${profile.staggerPlates}`,
  ].join(":");
}

export function entranceIntensity(animation: BossSpriteAnimationState): number {
  return Math.max(0, Math.min(1, 1 - animation.entranceAlpha));
}
