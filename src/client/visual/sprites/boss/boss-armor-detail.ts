import type { BossMechSilhouette } from "../../../../shared/boss/boss-planning.js";
import type { BossSpriteAnimationState } from "../../combat-entity-animation.js";
import {
  drawDragonSpine,
  drawHeatSinkStack,
  drawPanelSeams,
  drawRivetCluster,
  drawWeaponRail,
} from "../../mech-detail-primitives.js";
import {
  drawArmorPanel,
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawOutlinedSegment,
  drawPixelGlow,
  drawPixelJoint,
  type PixelPalette,
} from "../../pixel-primitives.js";
import type { PixiGraphics } from "./boss-sprite-types.js";

export interface BossArmorDetailProfile {
  armRailSockets: number;
  armorPlates: number;
  chargedSockets: number;
  clawSockets: number;
  crownSpikes: number;
  dragonScalePlates: number;
  energySeams: number;
  engineVents: number;
  exposedReactors: number;
  fractureSparks: number;
  silhouette: BossMechSilhouette;
  treadPlates: number;
  wingMicroPanels: number;
}

export function bossArmorDetailProfile(options: {
  animation: BossSpriteAnimationState;
  healthProgress: number;
  silhouette: BossMechSilhouette;
}): BossArmorDetailProfile {
  const telegraph = Math.max(0, Math.min(1, options.animation.telegraph));
  const wounded = 1 - Math.max(0, Math.min(1, options.healthProgress));
  const lowHealth = wounded > 0.36 ? Math.min(1, (wounded - 0.36) / 0.54) : 0;
  const charged = Math.ceil(telegraph * 9);
  const fractures = Math.ceil(lowHealth * 12);
  const exposed = wounded > 0.48 ? Math.ceil((wounded - 0.48) * 10) : 0;
  if (options.silhouette === "flying") {
    return {
      armRailSockets: 2,
      armorPlates: 18,
      chargedSockets: charged + 3,
      clawSockets: 2,
      crownSpikes: 5,
      dragonScalePlates: 13,
      energySeams: 16,
      engineVents: 10,
      exposedReactors: exposed,
      fractureSparks: fractures,
      silhouette: options.silhouette,
      treadPlates: 0,
      wingMicroPanels: 18,
    };
  }
  if (options.silhouette === "crawling") {
    return {
      armRailSockets: 1,
      armorPlates: 22,
      chargedSockets: charged + 2,
      clawSockets: 10,
      crownSpikes: 4,
      dragonScalePlates: 14,
      energySeams: 14,
      engineVents: 5,
      exposedReactors: exposed,
      fractureSparks: fractures,
      silhouette: options.silhouette,
      treadPlates: 16,
      wingMicroPanels: 0,
    };
  }
  return {
    armRailSockets: 12,
    armorPlates: 20,
    chargedSockets: charged + 4,
    clawSockets: 4,
    crownSpikes: 9,
    dragonScalePlates: 12,
    energySeams: 15,
    engineVents: 7,
    exposedReactors: exposed,
    fractureSparks: fractures,
    silhouette: options.silhouette,
    treadPlates: 2,
    wingMicroPanels: 4,
  };
}

export function bossArmorDetailBudget(profile: BossArmorDetailProfile): number {
  return profile.armRailSockets +
    profile.armorPlates +
    profile.chargedSockets +
    profile.clawSockets +
    profile.crownSpikes +
    profile.dragonScalePlates +
    profile.energySeams +
    profile.engineVents +
    profile.exposedReactors +
    profile.fractureSparks +
    profile.treadPlates +
    profile.wingMicroPanels;
}

export function drawBossArmorDetail(
  graphic: PixiGraphics,
  options: {
    animation: BossSpriteAnimationState;
    healthProgress: number;
    palette: PixelPalette;
    silhouette: BossMechSilhouette;
  },
): void {
  const profile = bossArmorDetailProfile(options);
  if (options.silhouette === "flying") {
    drawFlyingArmorDetail(graphic, options, profile);
    return;
  }
  if (options.silhouette === "crawling") {
    drawCrawlingArmorDetail(graphic, options, profile);
    return;
  }
  drawHumanoidArmorDetail(graphic, options, profile);
}

function drawFlyingArmorDetail(
  graphic: PixiGraphics,
  options: ArmorDrawOptions,
  profile: BossArmorDetailProfile,
): void {
  const { animation, palette } = options;
  const wingOpen = animation.wingSpread;
  drawDragonScaleFan(graphic, palette, profile.dragonScalePlates, { x: 0, y: -6, radiusX: 58, radiusY: 39 });
  for (const side of [-1, 1] as const) {
    for (let panel = 0; panel < profile.wingMicroPanels / 2; panel += 1) {
      const x = side * (48 + panel * 9) * wingOpen;
      const y = -39 + (panel % 5) * 14;
      drawArmorPanel(
        graphic,
        [x - side * 5, y - 4, x + side * 11, y - 10, x + side * 15, y + 3, x - side * 2, y + 8],
        palette,
        0.28 + (panel % 3) * 0.035,
      );
    }
    drawHeatSinkStack(graphic, {
      alpha: 0.38,
      count: Math.min(6, profile.engineVents / 2),
      height: 3,
      palette,
      width: 34,
      x: side < 0 ? -111 * wingOpen : 77 * wingOpen,
      y: 18,
    });
    drawWeaponRail(graphic, { length: 46, palette, x: side < 0 ? -116 * wingOpen : 70 * wingOpen, y: -38 });
    for (let socket = 0; socket < Math.min(5, profile.chargedSockets); socket += 1) {
      drawPixelJoint(graphic, side * (28 + socket * 18), -21 + socket * 8, 3.2, palette, 0.46 + animation.telegraph * 0.28);
    }
  }
  drawEnergySeams(graphic, palette, profile.energySeams, flyingSeamAnchors);
  drawCrownSpikes(graphic, palette, profile.crownSpikes, { x: 0, y: -67, spread: 56 });
  drawDamageDetails(graphic, options, profile, flyingDamageAnchors);
}

function drawCrawlingArmorDetail(
  graphic: PixiGraphics,
  options: ArmorDrawOptions,
  profile: BossArmorDetailProfile,
): void {
  const { animation, palette } = options;
  drawDragonScaleFan(graphic, palette, profile.dragonScalePlates, { x: 8, y: -16, radiusX: 84, radiusY: 28 });
  for (let tread = 0; tread < profile.treadPlates; tread += 1) {
    const side = tread % 2 === 0 ? -1 : 1;
    const row = Math.floor(tread / 2);
    drawOutlinedRect(
      graphic,
      side < 0 ? -112 - (row % 3) * 3 : 76 + (row % 3) * 3,
      -9 + row * 8 + frameDirection(animation.frame + row),
      28,
      5,
      tread % 3 === 0 ? palette.accent : palette.trim,
      palette.dark,
      0.36,
    );
  }
  for (let claw = 0; claw < profile.clawSockets; claw += 1) {
    const side = claw % 2 === 0 ? -1 : 1;
    const row = Math.floor(claw / 2);
    const x = side * (44 + row * 17);
    const y = 31 + (row % 3) * 5;
    drawOutlinedPoly(graphic, [x - side * 5, y - 6, x + side * 18, y, x - side * 4, y + 8], palette.core, palette.dark, 0.32 + animation.telegraph * 0.2);
  }
  drawHeatSinkStack(graphic, {
    alpha: 0.36,
    count: profile.engineVents,
    height: 3,
    palette,
    width: 54,
    x: -72,
    y: 21,
  });
  drawEnergySeams(graphic, palette, profile.energySeams, crawlingSeamAnchors);
  drawCrownSpikes(graphic, palette, profile.crownSpikes, { x: 72, y: -38, spread: 42 });
  for (let socket = 0; socket < profile.chargedSockets; socket += 1) {
    const x = -70 + socket * 22;
    drawEmissiveSlit(graphic, x, -26 + (socket % 3) * 8, 9, 4, socket % 2 === 0 ? palette.core : palette.accent, 0.4 + animation.telegraph * 0.22);
  }
  drawDamageDetails(graphic, options, profile, crawlingDamageAnchors);
}

function drawHumanoidArmorDetail(
  graphic: PixiGraphics,
  options: ArmorDrawOptions,
  profile: BossArmorDetailProfile,
): void {
  const { animation, palette } = options;
  drawDragonScaleFan(graphic, palette, profile.dragonScalePlates, { x: 0, y: -27, radiusX: 46, radiusY: 72 });
  for (const side of [-1, 1] as const) {
    for (let rail = 0; rail < profile.armRailSockets / 2; rail += 1) {
      const y = -22 + rail * 11 - animation.telegraph * 11;
      drawWeaponRail(graphic, { length: 36 + (rail % 3) * 8, palette, x: side < 0 ? -123 : 86, y });
      drawPixelJoint(graphic, side * (82 + rail * 4), y + 4, 3.4, palette, 0.42 + animation.telegraph * 0.28);
    }
    drawHeatSinkStack(graphic, {
      alpha: 0.36,
      count: Math.min(5, profile.engineVents),
      height: 2,
      palette,
      width: 28,
      x: side < 0 ? -64 : 36,
      y: 43,
    });
  }
  drawCrownSpikes(graphic, palette, profile.crownSpikes, { x: 0, y: -127, spread: 76 });
  drawEnergySeams(graphic, palette, profile.energySeams, humanoidSeamAnchors);
  for (let socket = 0; socket < profile.chargedSockets; socket += 1) {
    const side = socket % 2 === 0 ? -1 : 1;
    const row = Math.floor(socket / 2);
    drawEmissiveSlit(graphic, side * (19 + row * 11), -50 + row * 15, side * 10, 4, socket % 2 === 0 ? palette.accent : palette.core, 0.44 + animation.telegraph * 0.2);
  }
  drawDamageDetails(graphic, options, profile, humanoidDamageAnchors);
}

function drawDragonScaleFan(
  graphic: PixiGraphics,
  palette: PixelPalette,
  count: number,
  origin: { radiusX: number; radiusY: number; x: number; y: number },
): void {
  for (let scale = 0; scale < count; scale += 1) {
    const t = scale / Math.max(1, count - 1);
    const angle = -Math.PI * 0.82 + t * Math.PI * 1.64;
    const radiusX = origin.radiusX * (0.38 + (scale % 4) * 0.13);
    const radiusY = origin.radiusY * (0.38 + (scale % 5) * 0.1);
    const x = origin.x + Math.cos(angle) * radiusX;
    const y = origin.y + Math.sin(angle) * radiusY;
    drawOutlinedPoly(
      graphic,
      [x, y - 7, x + 8, y, x + 3, y + 8, x - 7, y + 2],
      scale % 2 === 0 ? palette.trim : palette.armor,
      palette.dark,
      0.26 + (scale % 3) * 0.035,
    );
  }
}

function drawEnergySeams(
  graphic: PixiGraphics,
  palette: PixelPalette,
  count: number,
  anchors: readonly { from: { x: number; y: number }; to: { x: number; y: number } }[],
): void {
  for (let seam = 0; seam < Math.min(count, anchors.length); seam += 1) {
    const anchor = anchors[seam];
    if (!anchor) {
      continue;
    }
    drawOutlinedSegment(
      graphic,
      anchor.from,
      anchor.to,
      seam % 4 === 0 ? 3 : 2,
      seam % 2 === 0 ? palette.accent : palette.core,
      palette.dark,
      0.28 + (seam % 3) * 0.04,
    );
  }
}

function drawCrownSpikes(
  graphic: PixiGraphics,
  palette: PixelPalette,
  count: number,
  options: { spread: number; x: number; y: number },
): void {
  for (let spike = 0; spike < count; spike += 1) {
    const t = count <= 1 ? 0.5 : spike / (count - 1);
    const x = options.x - options.spread * 0.5 + t * options.spread;
    const height = 15 + (spike % 4) * 5;
    drawOutlinedPoly(
      graphic,
      [x - 7, options.y + 7, x, options.y - height, x + 7, options.y + 7],
      spike % 2 === 0 ? palette.accent : palette.trim,
      palette.dark,
      0.42,
    );
  }
}

function drawDamageDetails(
  graphic: PixiGraphics,
  options: ArmorDrawOptions,
  profile: BossArmorDetailProfile,
  anchors: readonly { x: number; y: number }[],
): void {
  if (profile.exposedReactors + profile.fractureSparks <= 0) {
    return;
  }
  drawPixelGlow(
    graphic,
    options.silhouette === "humanoid" ? 0 : 18,
    options.silhouette === "humanoid" ? -28 : -8,
    46 + profile.exposedReactors * 8,
    options.palette.core,
    0.05 + profile.exposedReactors * 0.012,
  );
  for (let core = 0; core < Math.min(profile.exposedReactors, anchors.length); core += 1) {
    const anchor = anchors[core];
    drawEmissiveSlit(graphic, anchor.x - 5, anchor.y - 6, 10, 12, core % 2 === 0 ? options.palette.core : options.palette.accent, 0.52);
    graphic.circle(anchor.x, anchor.y, 12 + core * 2).stroke({ color: options.palette.core, width: 1, alpha: 0.22 });
  }
  for (let spark = 0; spark < profile.fractureSparks; spark += 1) {
    const anchor = anchors[spark % anchors.length];
    const angle = spark * 2.399;
    const x = anchor.x + Math.cos(angle) * (8 + (spark % 4) * 5);
    const y = anchor.y + Math.sin(angle) * (8 + (spark % 3) * 4);
    graphic
      .moveTo(x - 5, y)
      .lineTo(x + 5, y + frameDirection(spark) * 3)
      .stroke({ color: spark % 2 === 0 ? options.palette.accent : options.palette.core, width: 1, alpha: 0.34 });
  }
}

function frameDirection(frame: number): -1 | 1 {
  return frame % 2 === 0 ? -1 : 1;
}

type ArmorDrawOptions = {
  animation: BossSpriteAnimationState;
  healthProgress: number;
  palette: PixelPalette;
  silhouette: BossMechSilhouette;
};

const flyingSeamAnchors = [
  { from: { x: -96, y: -31 }, to: { x: -47, y: -10 } },
  { from: { x: 96, y: -31 }, to: { x: 47, y: -10 } },
  { from: { x: -73, y: 13 }, to: { x: -23, y: 4 } },
  { from: { x: 73, y: 13 }, to: { x: 23, y: 4 } },
  { from: { x: -24, y: -35 }, to: { x: 0, y: 21 } },
  { from: { x: 24, y: -35 }, to: { x: 0, y: 21 } },
  { from: { x: -118, y: -10 }, to: { x: -86, y: 24 } },
  { from: { x: 118, y: -10 }, to: { x: 86, y: 24 } },
  { from: { x: -55, y: -49 }, to: { x: -10, y: -28 } },
  { from: { x: 55, y: -49 }, to: { x: 10, y: -28 } },
  { from: { x: -31, y: 26 }, to: { x: 31, y: 26 } },
  { from: { x: -13, y: -56 }, to: { x: 13, y: -56 } },
  { from: { x: -89, y: -44 }, to: { x: -51, y: -31 } },
  { from: { x: 89, y: -44 }, to: { x: 51, y: -31 } },
  { from: { x: -66, y: 35 }, to: { x: -24, y: 17 } },
  { from: { x: 66, y: 35 }, to: { x: 24, y: 17 } },
] as const;

const crawlingSeamAnchors = [
  { from: { x: -86, y: -22 }, to: { x: -40, y: -12 } },
  { from: { x: -42, y: -31 }, to: { x: 6, y: -18 } },
  { from: { x: 4, y: -26 }, to: { x: 54, y: -10 } },
  { from: { x: 48, y: -35 }, to: { x: 102, y: -11 } },
  { from: { x: -96, y: 6 }, to: { x: -44, y: 13 } },
  { from: { x: -42, y: 12 }, to: { x: 16, y: 18 } },
  { from: { x: 16, y: 14 }, to: { x: 74, y: 14 } },
  { from: { x: 68, y: 8 }, to: { x: 112, y: 3 } },
  { from: { x: -70, y: -38 }, to: { x: -10, y: -40 } },
  { from: { x: -9, y: -40 }, to: { x: 54, y: -35 } },
  { from: { x: 58, y: -31 }, to: { x: 105, y: -24 } },
  { from: { x: -80, y: 29 }, to: { x: -22, y: 31 } },
  { from: { x: -20, y: 30 }, to: { x: 38, y: 28 } },
  { from: { x: 38, y: 28 }, to: { x: 96, y: 24 } },
] as const;

const humanoidSeamAnchors = [
  { from: { x: -43, y: -52 }, to: { x: -12, y: -21 } },
  { from: { x: 43, y: -52 }, to: { x: 12, y: -21 } },
  { from: { x: -32, y: -9 }, to: { x: -9, y: 28 } },
  { from: { x: 32, y: -9 }, to: { x: 9, y: 28 } },
  { from: { x: -72, y: -48 }, to: { x: -96, y: -5 } },
  { from: { x: 72, y: -48 }, to: { x: 96, y: -5 } },
  { from: { x: -46, y: 37 }, to: { x: -28, y: 86 } },
  { from: { x: 46, y: 37 }, to: { x: 28, y: 86 } },
  { from: { x: -24, y: -102 }, to: { x: -2, y: -62 } },
  { from: { x: 24, y: -102 }, to: { x: 2, y: -62 } },
  { from: { x: -50, y: -69 }, to: { x: 50, y: -69 } },
  { from: { x: -48, y: 1 }, to: { x: 48, y: 1 } },
  { from: { x: -86, y: 20 }, to: { x: -61, y: 42 } },
  { from: { x: 86, y: 20 }, to: { x: 61, y: 42 } },
  { from: { x: -36, y: 91 }, to: { x: -13, y: 102 } },
] as const;

const flyingDamageAnchors = [
  { x: -38, y: -10 },
  { x: 38, y: -10 },
  { x: 0, y: -32 },
  { x: -72, y: 20 },
  { x: 72, y: 20 },
] as const;

const crawlingDamageAnchors = [
  { x: -60, y: -15 },
  { x: -20, y: -18 },
  { x: 20, y: -12 },
  { x: 58, y: -9 },
  { x: 90, y: -20 },
] as const;

const humanoidDamageAnchors = [
  { x: 0, y: -28 },
  { x: -28, y: -42 },
  { x: 28, y: -42 },
  { x: -32, y: 18 },
  { x: 32, y: 18 },
] as const;
