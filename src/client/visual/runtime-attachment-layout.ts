import type { AttachmentSlot } from "../../shared/wishcraft/types.js";
import type { Point } from "../simulation/arena-math.js";

export function runtimeAttachmentSlotAngle(slot: AttachmentSlot): number {
  const angles: Record<AttachmentSlot, number> = {
    aura: 0,
    back: 3.9,
    core: 4.7,
    head: 4.7,
    hip: 1.6,
    impact: 0.7,
    orbit: 0,
    projectile: 5.8,
    shoulder: 3.7,
    summon: 2.4,
    trail: 1.57,
    weapon: 5.8,
    arm: 5.6,
  };
  return angles[slot];
}

export function runtimeAttachmentSlotOffset(slot: AttachmentSlot, index: number, scale: number): Point {
  const alternating = index % 2 === 0 ? -1 : 1;
  const offsets: Record<AttachmentSlot, Point> = {
    aura: { x: 0, y: 0 },
    projectile: { x: alternating * 22 * scale, y: -4 * scale },
    trail: { x: 0, y: 10 * scale },
    orbit: { x: 0, y: 0 },
    shoulder: { x: alternating * 19 * scale, y: -10 * scale },
    back: { x: 0, y: -2 * scale },
    weapon: { x: alternating * 24 * scale, y: 0 },
    impact: { x: 0, y: 0 },
    summon: { x: alternating * 42 * scale, y: -20 * scale },
    core: { x: 0, y: -4 * scale },
    head: { x: 0, y: -25 * scale },
    arm: { x: alternating * 25 * scale, y: 1 * scale },
    hip: { x: alternating * 13 * scale, y: 17 * scale },
  };
  return offsets[slot];
}
