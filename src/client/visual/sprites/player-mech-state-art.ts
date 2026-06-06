import type { PlayerMechAnimationState } from "../combat-entity-animation.js";
import {
  drawCableBundle,
  drawPanelSeams,
  drawRivetCluster,
} from "../mech-detail-primitives.js";
import {
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawOutlinedSegment,
  drawPixelGlow,
  drawPixelJoint,
  type PixelPalette,
} from "../pixel-primitives.js";

type PixiGraphics = import("pixi.js").Graphics;

export interface PlayerMechStateArtProfile {
  frameSignature: string;
  hitFlickerBands: number;
  installProgress: number;
  installRailCount: number;
  microPanelCount: number;
  reactorPulseCount: number;
  shieldSparkCount: number;
  snapOnPlateCount: number;
}

export function playerMechStateArtProfile(animation: PlayerMechAnimationState): PlayerMechStateArtProfile {
  const installActive = animation.wishInstallProgress < 0.96;
  const hitActive = animation.hitFlash > 0.02;
  const frame = idleFrameProfile(animation.idleFrame);
  return {
    frameSignature: `${animation.idleFrame}:${frame.shoulderRise}:${frame.visorShift}:${frame.reactorPhase}:${frame.finSpread}`,
    hitFlickerBands: hitActive ? 4 + Math.ceil(animation.hitFlash * 5) : 0,
    installProgress: animation.wishInstallProgress,
    installRailCount: installActive ? 6 : 0,
    microPanelCount: 8 + frame.finSpread + frame.reactorPhase,
    reactorPulseCount: 5 + frame.reactorPhase,
    shieldSparkCount: hitActive ? 8 + Math.ceil(animation.hitFlash * 8) : 0,
    snapOnPlateCount: installActive ? 5 + Math.ceil((1 - animation.wishInstallProgress) * 5) : 0,
  };
}

export function drawPlayerMechStateArt(
  graphic: PixiGraphics,
  options: {
    animation: PlayerMechAnimationState;
    palette: PixelPalette;
  },
): void {
  const profile = playerMechStateArtProfile(options.animation);
  const frame = idleFrameProfile(options.animation.idleFrame);
  drawIdleFrameMicroPanels(graphic, { frame, palette: options.palette, profile });
  drawIdleReactorAndVisor(graphic, { animation: options.animation, frame, palette: options.palette, profile });
  if (profile.installRailCount > 0) {
    drawWishInstallSnapOn(graphic, { animation: options.animation, frame, palette: options.palette, profile });
  }
  if (profile.hitFlickerBands > 0) {
    drawHitFlicker(graphic, { animation: options.animation, palette: options.palette, profile });
  }
}

function drawIdleFrameMicroPanels(
  graphic: PixiGraphics,
  options: {
    frame: IdleFrameProfile;
    palette: PixelPalette;
    profile: PlayerMechStateArtProfile;
  },
): void {
  const shoulderY = -25 - options.frame.shoulderRise;
  for (const side of [-1, 1] as const) {
    drawOutlinedPoly(
      graphic,
      [
        side * 28,
        shoulderY,
        side * (42 + options.frame.finSpread),
        shoulderY - 4,
        side * (46 + options.frame.finSpread),
        shoulderY + 8,
        side * 29,
        shoulderY + 11,
      ],
      side < 0 ? options.palette.armor : options.palette.trim,
      options.palette.dark,
      0.42,
    );
    drawOutlinedRect(
      graphic,
      side * (31 + options.frame.finSpread) - (side < 0 ? 6 : 0),
      7 + options.frame.shoulderRise * 0.4,
      6,
      16,
      side < 0 ? options.palette.trim : options.palette.armor,
      options.palette.dark,
      0.4,
    );
  }

  const seams = [
    { from: { x: -31, y: -32 + options.frame.shoulderRise }, to: { x: -10, y: -22 }, alpha: 0.2 },
    { from: { x: 31, y: -32 + options.frame.shoulderRise }, to: { x: 10, y: -22 }, alpha: 0.2 },
    { from: { x: -11, y: 3 }, to: { x: -24, y: 31 + options.frame.reactorPhase }, alpha: 0.18 },
    { from: { x: 11, y: 3 }, to: { x: 24, y: 31 + options.frame.reactorPhase }, alpha: 0.18 },
  ];
  drawPanelSeams(graphic, seams, options.palette);
  drawRivetCluster(
    graphic,
    Array.from({ length: options.profile.microPanelCount }, (_, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const row = Math.floor(index / 2);
      return {
        alpha: 0.26 + (index % 3) * 0.06,
        radius: 1.1 + (index % 2) * 0.35,
        x: side * (18 + (row % 4) * 7),
        y: -25 + row * 9 + options.frame.shoulderRise * 0.35,
      };
    }),
    options.palette,
  );
}

function drawIdleReactorAndVisor(
  graphic: PixiGraphics,
  options: {
    animation: PlayerMechAnimationState;
    frame: IdleFrameProfile;
    palette: PixelPalette;
    profile: PlayerMechStateArtProfile;
  },
): void {
  const pulse = 0.22 + options.frame.reactorPhase * 0.04 + Math.abs(options.animation.bob) * 0.02;
  drawPixelGlow(graphic, 0, -13, 13 + options.frame.reactorPhase * 1.5, options.palette.core, pulse);
  for (let ring = 0; ring < options.profile.reactorPulseCount; ring += 1) {
    const radius = 8 + ring * 4 + options.frame.reactorPhase;
    graphic
      .circle(0, -13, radius)
      .stroke({ color: ring % 2 === 0 ? options.palette.core : options.palette.accent, width: ring === 0 ? 2 : 1, alpha: 0.13 - ring * 0.011 });
  }
  drawEmissiveSlit(
    graphic,
    -12 + options.frame.visorShift,
    -34 + options.frame.shoulderRise * 0.15,
    24,
    2,
    options.palette.trim,
    0.64,
  );
  for (const side of [-1, 1] as const) {
    drawPixelJoint(
      graphic,
      side * (34 + options.frame.finSpread),
      -12 + options.frame.shoulderRise * 0.25,
      2.6,
      options.palette,
      0.38,
    );
  }
}

function drawWishInstallSnapOn(
  graphic: PixiGraphics,
  options: {
    animation: PlayerMechAnimationState;
    frame: IdleFrameProfile;
    palette: PixelPalette;
    profile: PlayerMechStateArtProfile;
  },
): void {
  const progress = Math.max(0, Math.min(1, options.animation.wishInstallProgress));
  const settle = 1 - progress;
  const railRadius = 92 - progress * 24;
  for (let rail = 0; rail < options.profile.installRailCount; rail += 1) {
    const angle = rail / options.profile.installRailCount * Math.PI * 2 + options.frame.reactorPhase * 0.12;
    const x = Math.cos(angle) * railRadius;
    const y = Math.sin(angle) * railRadius - 4;
    drawOutlinedSegment(
      graphic,
      { x: Math.cos(angle) * 40, y: Math.sin(angle) * 40 - 4 },
      { x, y },
      rail % 2 === 0 ? 3 : 2,
      rail % 2 === 0 ? options.palette.core : options.palette.accent,
      options.palette.dark,
      0.26 + settle * 0.18,
    );
  }
  for (let plate = 0; plate < options.profile.snapOnPlateCount; plate += 1) {
    const side = plate % 2 === 0 ? -1 : 1;
    const row = Math.floor(plate / 2);
    const approach = 18 * progress;
    const x = side * (38 + row * 8 + approach);
    const y = -24 + row * 15 - settle * 8;
    drawOutlinedPoly(
      graphic,
      [x - side * 8, y - 5, x + side * 8, y - 2, x + side * 9, y + 8, x - side * 7, y + 6],
      plate % 3 === 0 ? options.palette.accent : options.palette.armor,
      options.palette.dark,
      0.36 + settle * 0.28,
    );
  }
  drawCableBundle(graphic, {
    alpha: 0.18 + settle * 0.14,
    count: 2,
    from: { x: -38 - progress * 18, y: 28 },
    palette: options.palette,
    sag: 7,
    to: { x: 38 + progress * 18, y: 28 },
  });
}

function drawHitFlicker(
  graphic: PixiGraphics,
  options: {
    animation: PlayerMechAnimationState;
    palette: PixelPalette;
    profile: PlayerMechStateArtProfile;
  },
): void {
  const alpha = Math.max(0, Math.min(1, options.animation.hitFlash));
  for (let band = 0; band < options.profile.hitFlickerBands; band += 1) {
    const y = -44 + band * 14;
    const width = 54 + (band % 3) * 16;
    graphic
      .rect(-width * 0.5, y, width, 3)
      .fill({ color: band % 2 === 0 ? options.palette.trim : options.palette.core, alpha: alpha * (0.16 - band * 0.008) });
  }
  graphic
    .circle(0, -3, 52)
    .stroke({ color: options.palette.trim, width: 3, alpha: alpha * 0.28 })
    .circle(0, -3, 61)
    .stroke({ color: options.palette.accent, width: 1, alpha: alpha * 0.22 });
  for (let spark = 0; spark < options.profile.shieldSparkCount; spark += 1) {
    const angle = spark * 2.399;
    const distance = 49 + (spark % 4) * 4;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance - 3;
    graphic
      .rect(x - 2, y - 2, 4, 4)
      .fill({ color: options.palette.dark, alpha: 0.56 })
      .rect(x - 1, y - 1, 2 + (spark % 2), 2 + (spark % 3),)
      .fill({ color: spark % 2 === 0 ? options.palette.trim : options.palette.accent, alpha: alpha * 0.58 });
  }
}

type IdleFrameProfile = {
  finSpread: number;
  reactorPhase: number;
  shoulderRise: number;
  visorShift: number;
};

function idleFrameProfile(frame: PlayerMechAnimationState["idleFrame"]): IdleFrameProfile {
  const table: Record<PlayerMechAnimationState["idleFrame"], IdleFrameProfile> = {
    0: { finSpread: 0, reactorPhase: 0, shoulderRise: 0, visorShift: 0 },
    1: { finSpread: 2, reactorPhase: 1, shoulderRise: 1, visorShift: 1 },
    2: { finSpread: 4, reactorPhase: 2, shoulderRise: 2, visorShift: 0 },
    3: { finSpread: 3, reactorPhase: 3, shoulderRise: 1, visorShift: -1 },
    4: { finSpread: 1, reactorPhase: 2, shoulderRise: -1, visorShift: 0 },
    5: { finSpread: 0, reactorPhase: 1, shoulderRise: -2, visorShift: 1 },
  };
  return table[frame];
}
