import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CommonEnemyTemplate } from "../simulation/combat.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";
import {
  drawOutlinedPoly,
  drawPixelGlow,
  drawStarSpark,
} from "./pixel-primitives.js";
import {
  paletteForWishcraftFeedback,
} from "./wishcraft-vfx-palette.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export type CommonEnemyHitFamily =
  | "armor-plate-buckle"
  | "harrier-wing-shear"
  | "swarm-node-disrupt";

export interface CommonEnemyHitVfxProfile {
  armorPlateCount: number;
  family: CommonEnemyHitFamily;
  nodeFlashCount: number;
  radius: number;
  templateId: CommonEnemyTemplate["id"];
  wingShardCount: number;
}

interface CommonEnemyHitPalette {
  accent: number;
  color: number;
}

export function shouldCreateCommonEnemyHitVfx(event: CombatFeedback): boolean {
  return hasCommonEnemyHitTarget(event);
}

export function commonEnemyHitVfxProfile(event: CombatFeedback): CommonEnemyHitVfxProfile | undefined {
  if (!hasCommonEnemyHitTarget(event)) {
    return undefined;
  }
  const templateId = event.targetTemplateId;
  const radius = event.targetRadius ?? radiusForTemplate(templateId);
  const radiusScale = Math.max(0, Math.round((radius - 12) / 4));
  if (templateId === "slow-tough") {
    return {
      armorPlateCount: 8 + radiusScale,
      family: "armor-plate-buckle",
      nodeFlashCount: 4,
      radius,
      templateId,
      wingShardCount: 2,
    };
  }
  if (templateId === "swarm-fragile") {
    return {
      armorPlateCount: 2,
      family: "swarm-node-disrupt",
      nodeFlashCount: 11 + Math.max(0, radiusScale),
      radius,
      templateId,
      wingShardCount: 3,
    };
  }
  return {
    armorPlateCount: 3,
    family: "harrier-wing-shear",
    nodeFlashCount: 5,
    radius,
    templateId,
    wingShardCount: 8 + Math.max(0, radiusScale),
  };
}

export function ttlForCommonEnemyHit(templateId: CommonEnemyTemplate["id"] | undefined): number {
  if (templateId === "slow-tough") {
    return 0.34;
  }
  if (templateId === "swarm-fragile") {
    return 0.22;
  }
  return 0.26;
}

export function createCommonEnemyHitVfxGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
  loadout: readonly Wishcraft[],
): { graphic: PixiGraphics; ttlSeconds: number } | undefined {
  const profile = commonEnemyHitVfxProfile(event);
  if (!profile || !("position" in event)) {
    return undefined;
  }
  const graphic = new Graphics();
  const palette = paletteForHit(event, loadout);
  drawCommonEnemyHitVfx(graphic, profile, {
    attackAngle: attackAngleForEvent(event),
    palette,
    visualKind: "visualKind" in event ? event.visualKind : undefined,
  });
  graphic.position.set(event.position.x, event.position.y);
  return {
    graphic,
    ttlSeconds: ttlForCommonEnemyHit(profile.templateId),
  };
}

function drawCommonEnemyHitVfx(
  graphic: PixiGraphics,
  profile: CommonEnemyHitVfxProfile,
  options: {
    attackAngle: number;
    palette: CommonEnemyHitPalette;
    visualKind: string | undefined;
  },
): void {
  drawPixelGlow(graphic, 0, 0, profile.radius * 3.35, options.palette.color, 0.16);
  drawImpactAxis(graphic, profile, options);
  if (profile.family === "armor-plate-buckle") {
    drawSlowToughHit(graphic, profile, options.palette);
  } else if (profile.family === "swarm-node-disrupt") {
    drawSwarmHit(graphic, profile, options.palette);
  } else {
    drawFastHarrierHit(graphic, profile, options.palette);
  }
}

function drawImpactAxis(
  graphic: PixiGraphics,
  profile: CommonEnemyHitVfxProfile,
  options: {
    attackAngle: number;
    palette: CommonEnemyHitPalette;
    visualKind: string | undefined;
  },
): void {
  const length = profile.radius * (options.visualKind === "laser-sword" ? 3.25 : 2.65);
  const normal = options.attackAngle + Math.PI * 0.5;
  const slashOffset = options.visualKind === "laser-sword" ? profile.radius * 0.35 : 0;
  for (let lane = -1; lane <= 1; lane += 1) {
    const side = lane * profile.radius * 0.28;
    const start = {
      x: Math.cos(options.attackAngle) * -length + Math.cos(normal) * (side + slashOffset),
      y: Math.sin(options.attackAngle) * -length + Math.sin(normal) * (side + slashOffset),
    };
    const end = {
      x: Math.cos(options.attackAngle) * length * 0.72 + Math.cos(normal) * side,
      y: Math.sin(options.attackAngle) * length * 0.72 + Math.sin(normal) * side,
    };
    graphic
      .moveTo(start.x, start.y)
      .lineTo(end.x, end.y)
      .stroke({
        color: lane === 0 ? 0xe8fbff : options.palette.accent,
        width: lane === 0 ? 3 : 2,
        alpha: lane === 0 ? 0.58 : 0.34,
      });
  }
  const ringRadius = profile.radius * (profile.templateId === "slow-tough" ? 1.55 : 1.28);
  graphic
    .circle(0, 0, ringRadius)
    .stroke({ color: options.palette.color, width: 3, alpha: 0.34 })
    .circle(0, 0, ringRadius * 1.42)
    .stroke({ color: options.palette.accent, width: 2, alpha: 0.22 });
}

function drawFastHarrierHit(
  graphic: PixiGraphics,
  profile: CommonEnemyHitVfxProfile,
  palette: CommonEnemyHitPalette,
): void {
  graphic
    .poly([-profile.radius * 1.2, -5, 0, -12, profile.radius * 1.3, -3, 6, 8])
    .stroke({ color: palette.accent, width: 2, alpha: 0.46 })
    .circle(0, 0, profile.radius * 0.6)
    .stroke({ color: palette.color, width: 2, alpha: 0.38 });
  for (let index = 0; index < profile.wingShardCount; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const distance = profile.radius * (0.8 + (index % 4) * 0.22);
    const x = side * (distance + index * 1.7);
    const y = -profile.radius * 0.45 + (index % 5) * 5;
    drawOutlinedPoly(
      graphic,
      [x - side * 3, y - 4, x + side * 17, y - 9, x + side * 12, y + 3, x - side * 2, y + 5],
      index % 2 === 0 ? palette.color : palette.accent,
      0x020612,
      0.56,
    );
  }
  for (let slash = 0; slash < 4; slash += 1) {
    const y = -profile.radius * 0.72 + slash * profile.radius * 0.46;
    graphic
      .moveTo(-profile.radius * 1.8, y)
      .lineTo(profile.radius * (1.25 + slash * 0.16), y + (slash % 2 === 0 ? -7 : 7))
      .stroke({ color: slash % 2 === 0 ? palette.accent : 0xe8fbff, width: slash === 1 ? 2 : 1, alpha: 0.3 });
  }
  drawStarSpark(graphic, 0, 0, 0xe8fbff, 0.46);
  drawStarSpark(graphic, profile.radius * 0.62, -profile.radius * 0.18, palette.accent, 0.34);
}

function drawSlowToughHit(
  graphic: PixiGraphics,
  profile: CommonEnemyHitVfxProfile,
  palette: CommonEnemyHitPalette,
): void {
  graphic
    .rect(-profile.radius * 1.25, -profile.radius * 0.72, profile.radius * 2.5, profile.radius * 1.45)
    .stroke({ color: palette.color, width: 3, alpha: 0.32 })
    .rect(-profile.radius * 0.62, -profile.radius * 0.34, profile.radius * 1.24, profile.radius * 0.68)
    .stroke({ color: palette.accent, width: 2, alpha: 0.42 });
  for (let index = 0; index < profile.armorPlateCount; index += 1) {
    const angle = index * 2.399;
    const distance = profile.radius * (0.7 + (index % 4) * 0.2);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance * 0.72;
    drawOutlinedPoly(
      graphic,
      [x - 8, y - 5, x + 10, y - 4, x + 12, y + 6, x - 7, y + 7],
      index % 2 === 0 ? palette.color : palette.accent,
      0x020612,
      0.62,
    );
  }
  for (let crack = 0; crack < 6; crack += 1) {
    const x = -profile.radius * 0.72 + crack * profile.radius * 0.28;
    graphic
      .moveTo(x, -profile.radius * 0.48)
      .lineTo(x + (crack % 2 === 0 ? 10 : -8), profile.radius * 0.42)
      .stroke({ color: 0xe8fbff, width: crack % 2 === 0 ? 2 : 1, alpha: 0.26 + (crack % 3) * 0.06 });
  }
  graphic
    .rect(-profile.radius * 1.05, -profile.radius * 0.18, profile.radius * 2.1, profile.radius * 0.36)
    .stroke({ color: palette.accent, width: 2, alpha: 0.28 })
    .moveTo(-profile.radius * 1.25, -profile.radius * 0.62)
    .lineTo(profile.radius * 1.08, profile.radius * 0.58)
    .stroke({ color: palette.color, width: 2, alpha: 0.24 });
  drawStarSpark(graphic, -profile.radius * 0.42, -profile.radius * 0.18, palette.accent, 0.28);
  drawStarSpark(graphic, profile.radius * 0.35, profile.radius * 0.22, 0xe8fbff, 0.26);
}

function drawSwarmHit(
  graphic: PixiGraphics,
  profile: CommonEnemyHitVfxProfile,
  palette: CommonEnemyHitPalette,
): void {
  graphic
    .circle(0, 0, profile.radius * 0.72)
    .stroke({ color: palette.accent, width: 2, alpha: 0.36 })
    .circle(0, 0, profile.radius * 1.28)
    .stroke({ color: palette.color, width: 1, alpha: 0.18 });
  for (let index = 0; index < profile.nodeFlashCount; index += 1) {
    const angle = index * 2.399;
    const distance = profile.radius * (0.42 + (index % 5) * 0.18);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 5 + (index % 3);
    graphic
      .circle(x, y, size + 2)
      .fill({ color: 0x020612, alpha: 0.38 })
      .circle(x, y, size)
      .fill({ color: index % 2 === 0 ? palette.color : palette.accent, alpha: 0.7 })
      .moveTo(x * 0.35, y * 0.35)
      .lineTo(x * 1.55, y * 1.55)
      .stroke({ color: palette.accent, width: 1, alpha: 0.32 });
  }
  for (let spoke = 0; spoke < 8; spoke += 1) {
    const angle = (spoke / 8) * Math.PI * 2;
    graphic
      .moveTo(Math.cos(angle) * profile.radius * 0.54, Math.sin(angle) * profile.radius * 0.54)
      .lineTo(Math.cos(angle) * profile.radius * 1.95, Math.sin(angle) * profile.radius * 1.95)
      .stroke({ color: spoke % 2 === 0 ? palette.color : palette.accent, width: 1, alpha: 0.24 });
  }
  drawStarSpark(graphic, 0, 0, palette.accent, 0.36);
}

function paletteForHit(event: CombatFeedback, loadout: readonly Wishcraft[]): CommonEnemyHitPalette {
  if (event.kind === "wishcraft-hit") {
    return paletteForWishcraftFeedback(event, loadout);
  }
  if (event.kind === "impact" && event.visualKind === "laser-sword") {
    return { accent: 0x44f5ff, color: 0xff4fd8 };
  }
  return { accent: 0xe8fbff, color: 0x44f5ff };
}

function radiusForTemplate(templateId: CommonEnemyTemplate["id"]): number {
  if (templateId === "slow-tough") {
    return 18;
  }
  if (templateId === "swarm-fragile") {
    return 11;
  }
  return 13;
}

function attackAngleForEvent(event: CombatFeedback): number {
  if (!("origin" in event) || !event.origin || !("position" in event)) {
    return 0;
  }
  return Math.atan2(event.position.y - event.origin.y, event.position.x - event.origin.x);
}

function hasCommonEnemyHitTarget(
  event: CombatFeedback,
): event is Extract<CombatFeedback, { kind: "impact" | "wishcraft-hit" }> & {
  targetRadius?: number;
  targetTemplateId: CommonEnemyTemplate["id"];
} {
  return (event.kind === "impact" || event.kind === "wishcraft-hit") &&
    event.targetTemplateId !== undefined;
}
