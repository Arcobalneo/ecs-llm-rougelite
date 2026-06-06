import type { BossMechSilhouette } from "../../../../../shared/boss/boss-planning.js";
import type { BossPoseAnchor } from "./types.js";

export function poseAnchors(silhouette: BossMechSilhouette): readonly BossPoseAnchor[] {
  if (silhouette === "flying") {
    return [
      { x: -146, y: -48 },
      { x: -112, y: -88 },
      { x: -78, y: 28 },
      { x: -36, y: -44 },
      { x: 0, y: -82 },
      { x: 36, y: -44 },
      { x: 78, y: 28 },
      { x: 112, y: -88 },
      { x: 146, y: -48 },
    ];
  }
  if (silhouette === "crawling") {
    return [
      { x: -124, y: -28 },
      { x: -88, y: 30 },
      { x: -50, y: -40 },
      { x: -8, y: 24 },
      { x: 38, y: -38 },
      { x: 80, y: 28 },
      { x: 124, y: -18 },
      { x: 152, y: -48 },
    ];
  }
  return [
    { x: -94, y: -34 },
    { x: -64, y: -88 },
    { x: -40, y: 28 },
    { x: 0, y: -102 },
    { x: 0, y: -28 },
    { x: 40, y: 28 },
    { x: 64, y: -88 },
    { x: 94, y: -34 },
  ];
}
