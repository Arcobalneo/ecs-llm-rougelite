import type { Point } from "../../simulation/arena-math.js";
import type { CombatFeedback } from "../../simulation/combat-loop.js";

export type BaseKitVfxKind = "laser-sword" | "machine-gun";
export type BaseKitAnimationStage = "active" | "fade" | "windup";

export interface BaseKitImpactEvent {
  kind: "impact";
  origin: Point;
  position: Point;
  visualKind: BaseKitVfxKind;
}

export interface BaseKitVfxProfile {
  bladeAfterimages: number;
  contactShardCount: number;
  kind: BaseKitVfxKind;
  muzzleFlashCount: number;
  particleCount: number;
  projectileSegments: number;
  stageCount: number;
  ttlSeconds: number;
}

export function isBaseKitImpactEvent(event: CombatFeedback): event is BaseKitImpactEvent {
  return event.kind === "impact" &&
    event.origin !== undefined &&
    (event.visualKind === "machine-gun" || event.visualKind === "laser-sword");
}

export function createBaseKitVfxProfile(event: CombatFeedback): BaseKitVfxProfile | undefined {
  if (!isBaseKitImpactEvent(event)) {
    return undefined;
  }

  const distance = distanceForEvent(event);
  if (event.visualKind === "machine-gun") {
    const projectileSegments = Math.min(14, Math.max(8, Math.round(distance / 34)));
    return {
      bladeAfterimages: 0,
      contactShardCount: 7,
      kind: "machine-gun",
      muzzleFlashCount: 6,
      particleCount: projectileSegments + 11,
      projectileSegments,
      stageCount: 3,
      ttlSeconds: 0.34,
    };
  }

  return {
    bladeAfterimages: 7,
    contactShardCount: 10,
    kind: "laser-sword",
    muzzleFlashCount: 3,
    particleCount: 24,
    projectileSegments: 0,
    stageCount: 3,
    ttlSeconds: 0.42,
  };
}

export function baseKitAnimationStage(progress: number): BaseKitAnimationStage {
  const clamped = clampProgress(progress);
  if (clamped < 0.22) {
    return "windup";
  }
  if (clamped < 0.72) {
    return "active";
  }
  return "fade";
}

export function baseKitFrameSignature(event: CombatFeedback, progress: number): string {
  const profile = createBaseKitVfxProfile(event);
  if (!profile || !isBaseKitImpactEvent(event)) {
    return "none";
  }

  const stage = baseKitAnimationStage(progress);
  const distanceBucket = Math.round(distanceForEvent(event) / 20) * 20;
  return [
    profile.kind,
    stage,
    `d${distanceBucket}`,
    `m${profile.muzzleFlashCount}`,
    `p${profile.particleCount}`,
    `s${profile.projectileSegments}`,
    `a${profile.bladeAfterimages}`,
    `c${profile.contactShardCount}`,
  ].join(":");
}

export function clampProgress(progress: number): number {
  return Math.min(1, Math.max(0, progress));
}

export function distanceForEvent(event: BaseKitImpactEvent): number {
  return Math.hypot(event.position.x - event.origin.x, event.position.y - event.origin.y);
}
