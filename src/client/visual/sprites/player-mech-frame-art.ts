import type { PlayerMechAnimationState } from "../combat-entity-animation.js";
import {
  drawCableBundle,
  drawHeatSinkStack,
  drawPanelSeams,
  drawRivetCluster,
} from "../mech-detail-primitives.js";
import {
  drawArmorPanel,
  drawEmissiveSlit,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawOutlinedSegment,
  drawPixelJoint,
  type PixelPalette,
} from "../pixel-primitives.js";

type PixiGraphics = import("pixi.js").Graphics;

export interface PlayerMechFrameArtProfile {
  armorPanels: number;
  asymmetrySockets: number;
  backpackJets: number;
  legPoseOffset: number;
  silhouetteCuts: number;
  thrusterIntensity: number;
}

export function playerMechFrameArtProfile(animation: PlayerMechAnimationState): PlayerMechFrameArtProfile {
  const movement = Math.max(0, Math.min(1, animation.movementStrength));
  const lateralThrust = Math.max(animation.thrusterLeft, animation.thrusterRight);
  return {
    armorPanels: 10 + Math.ceil(movement * 3),
    asymmetrySockets: 5,
    backpackJets: 4 + Math.ceil(movement * 2),
    legPoseOffset: Math.round(animation.leanX * 1.6 + animation.leanY * 0.8),
    silhouetteCuts: 8 + Math.ceil(Math.abs(animation.leanX) * 0.6) + Math.ceil(movement * 4),
    thrusterIntensity: Math.max(animation.thrusterDown, lateralThrust),
  };
}

export function drawPlayerMechFrameArt(
  graphic: PixiGraphics,
  options: {
    animation: PlayerMechAnimationState;
    palette: PixelPalette;
  },
): void {
  const profile = playerMechFrameArtProfile(options.animation);
  const leanX = options.animation.leanX;
  const leanY = options.animation.leanY;

  drawBackpackAndJets(graphic, {
    leanX,
    leanY,
    palette: options.palette,
    profile,
  });
  drawTorsoArmorBreakup(graphic, {
    leanX,
    leanY,
    palette: options.palette,
    profile,
  });
  drawLimbPoseArmor(graphic, {
    leanX,
    leanY,
    palette: options.palette,
    profile,
  });
  drawSilhouetteCutIns(graphic, {
    leanX,
    leanY,
    palette: options.palette,
    profile,
  });
  drawAsymmetricSockets(graphic, {
    leanX,
    leanY,
    palette: options.palette,
    profile,
  });
}

function drawBackpackAndJets(
  graphic: PixiGraphics,
  options: {
    leanX: number;
    leanY: number;
    palette: PixelPalette;
    profile: PlayerMechFrameArtProfile;
  },
): void {
  drawOutlinedRect(graphic, -29 + options.leanX * 0.08, -25 + options.leanY * 0.04, 58, 18, options.palette.dark, options.palette.dark, 0.82);
  for (const side of [-1, 1] as const) {
    const x = side * (22 + Math.abs(options.leanX) * 0.18);
    drawOutlinedPoly(
      graphic,
      [
        x - side * 5,
        -27,
        x + side * 18,
        -19 + options.leanY * 0.08,
        x + side * 13,
        -4 + options.leanY * 0.12,
        x - side * 9,
        -8,
      ],
      side < 0 ? options.palette.trim : options.palette.armor,
      options.palette.dark,
      0.72,
    );
    drawEmissiveSlit(graphic, x - (side < 0 ? 13 : 0), -20, 13, 4, options.palette.core, 0.62);
    for (let jet = 0; jet < Math.min(3, options.profile.backpackJets - 2); jet += 1) {
      const jetX = side * (28 + jet * 5);
      graphic
        .rect(jetX - 2, 42 + jet * 2, 4, 7 + options.profile.thrusterIntensity * 0.18)
        .fill({ color: jet % 2 === 0 ? options.palette.glow : options.palette.accent, alpha: 0.16 });
    }
    for (let vent = 0; vent < Math.min(3, options.profile.backpackJets); vent += 1) {
      drawOutlinedRect(
        graphic,
        side * (8 + vent * 7) - (side < 0 ? 6 : 0),
        -33 + vent * 4 + options.leanY * 0.04,
        6,
        9,
        vent % 2 === 0 ? options.palette.trim : options.palette.armor,
        options.palette.dark,
        0.36,
      );
    }
  }
}

function drawTorsoArmorBreakup(
  graphic: PixiGraphics,
  options: {
    leanX: number;
    leanY: number;
    palette: PixelPalette;
    profile: PlayerMechFrameArtProfile;
  },
): void {
  const panels = [
    [-28, -25, -10, -30, -4, -12, -24, -8],
    [10, -30, 28, -25, 24, -8, 4, -12],
    [-24, -6, -8, -10, -5, 10, -22, 16],
    [8, -10, 24, -6, 22, 16, 5, 10],
    [-16, 16, -5, 18, -8, 38, -19, 34],
    [5, 18, 16, 16, 19, 34, 8, 38],
  ] as const;
  for (let index = 0; index < Math.min(options.profile.armorPanels, panels.length); index += 1) {
    const shifted = panels[index].map((value, pointIndex) =>
      pointIndex % 2 === 0
        ? value + options.leanX * 0.22
        : value + options.leanY * 0.12,
    );
    drawArmorPanel(graphic, shifted, options.palette, 0.5 + (index % 2) * 0.08);
  }
  drawPanelSeams(
    graphic,
    [
      { from: { x: -31 + options.leanX * 0.2, y: -2 }, to: { x: 31 + options.leanX * 0.2, y: -2 }, alpha: 0.22 },
      { from: { x: -19, y: 13 + options.leanY * 0.1 }, to: { x: 19, y: 13 + options.leanY * 0.1 }, alpha: 0.24 },
      { from: { x: 0, y: -29 }, to: { x: 0, y: 39 }, alpha: 0.2 },
    ],
    options.palette,
  );
}

function drawLimbPoseArmor(
  graphic: PixiGraphics,
  options: {
    leanX: number;
    leanY: number;
    palette: PixelPalette;
    profile: PlayerMechFrameArtProfile;
  },
): void {
  const legOffset = options.profile.legPoseOffset;
  for (const side of [-1, 1] as const) {
    const hipX = side * 14 - options.leanX * 0.12;
    const kneeX = side * (17 + Math.max(-4, Math.min(4, legOffset * 0.18 * side)));
    drawOutlinedSegment(graphic, { x: hipX, y: 19 }, { x: kneeX, y: 39 + Math.abs(legOffset) * 0.04 }, 6, options.palette.trim, options.palette.dark, 0.64);
    drawPixelJoint(graphic, hipX, 21, 4, options.palette, 0.68);
    drawPixelJoint(graphic, kneeX, 40, 4, options.palette, 0.62);
    drawOutlinedPoly(
      graphic,
      [
        kneeX - side * 5,
        41,
        kneeX + side * 10,
        44,
        kneeX + side * 13,
        54,
        kneeX - side * 8,
        52,
      ],
      options.palette.armor,
      options.palette.dark,
      0.74,
    );
  }
}

function drawSilhouetteCutIns(
  graphic: PixiGraphics,
  options: {
    leanX: number;
    leanY: number;
    palette: PixelPalette;
    profile: PlayerMechFrameArtProfile;
  },
): void {
  const cuts = Math.min(14, options.profile.silhouetteCuts);
  for (let index = 0; index < cuts; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const row = Math.floor(index / 2);
    const y = -29 + row * 10 + options.leanY * 0.07;
    const x = side * (35 + (row % 3) * 5) + options.leanX * 0.18;
    const width = 7 + (index % 3) * 2;
    const height = 3 + (row % 2);
    graphic
      .rect(x - (side < 0 ? width : 0), y, width, height)
      .fill({ color: options.palette.dark, alpha: 0.74 })
      .rect(x - (side < 0 ? width - 1 : -1), y + 1, Math.max(2, width - 2), 1)
      .fill({ color: index % 3 === 0 ? options.palette.core : options.palette.accent, alpha: 0.28 });
  }
}

function drawAsymmetricSockets(
  graphic: PixiGraphics,
  options: {
    leanX: number;
    leanY: number;
    palette: PixelPalette;
    profile: PlayerMechFrameArtProfile;
  },
): void {
  drawOutlinedRect(graphic, -48 + options.leanX * 0.24, -24 + options.leanY * 0.08, 13, 13, options.palette.dark, options.palette.dark, 0.84);
  drawEmissiveSlit(graphic, -45 + options.leanX * 0.24, -20 + options.leanY * 0.08, 7, 4, options.palette.accent, 0.72);
  drawOutlinedRect(graphic, 37 + options.leanX * 0.2, -27 + options.leanY * 0.08, 18, 10, options.palette.trim, options.palette.dark, 0.74);
  drawEmissiveSlit(graphic, 41 + options.leanX * 0.2, -24 + options.leanY * 0.08, 10, 3, options.palette.core, 0.68);
  drawHeatSinkStack(graphic, { count: 3, height: 2, palette: options.palette, width: 15, x: 34 + options.leanX * 0.14, y: 18 + options.leanY * 0.08, alpha: 0.38 });
  drawCableBundle(graphic, {
    alpha: 0.28,
    count: 2,
    from: { x: -44 + options.leanX * 0.14, y: -12 + options.leanY * 0.08 },
    palette: options.palette,
    sag: 4,
    to: { x: -27 + options.leanX * 0.1, y: 8 + options.leanY * 0.08 },
  });
  const socketBudget = Math.max(0, options.profile.asymmetrySockets - 2);
  for (let index = 0; index < socketBudget; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const y = -7 + index * 9 + options.leanY * 0.06;
    const x = side * (39 + (index % 3) * 4) + options.leanX * 0.16;
    drawOutlinedRect(graphic, x - (side < 0 ? 8 : 0), y, 8, 8, index % 2 === 0 ? options.palette.armor : options.palette.dark, options.palette.dark, 0.62);
    drawEmissiveSlit(graphic, x - (side < 0 ? 6 : -2), y + 2, 4, 3, index % 2 === 0 ? options.palette.core : options.palette.accent, 0.46);
  }
  drawRivetCluster(
    graphic,
    [
      { x: -48, y: -27, radius: 1.4, alpha: 0.48 },
      { x: 54, y: -29, radius: 1.4, alpha: 0.48 },
      { x: 42, y: 16, radius: 1.3, alpha: 0.38 },
    ],
    options.palette,
  );
}
