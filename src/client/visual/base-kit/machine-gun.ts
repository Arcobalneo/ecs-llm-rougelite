import {
  drawOutlinedPoly,
  drawPixelGlow,
  drawStarSpark,
} from "../pixel-primitives.js";
import {
  baseKitAnimationStage,
  clampProgress,
  type BaseKitVfxProfile,
} from "./types.js";

type PixiGraphics = import("pixi.js").Graphics;

export function drawMachineGunVfxFrame(
  graphic: PixiGraphics,
  profile: BaseKitVfxProfile,
  options: {
    distance: number;
    progress: number;
  },
): void {
  const progress = clampProgress(options.progress);
  const stage = baseKitAnimationStage(progress);
  const length = Math.min(430, Math.max(92, options.distance));
  const muzzleX = 36;
  const tipX = Math.min(length, Math.max(86, options.distance - 10));
  const activePulse = stage === "windup" ? progress / 0.22 : stage === "active" ? 1 : 1 - (progress - 0.72) / 0.28;
  const travel = stage === "windup" ? 0.45 + activePulse * 0.2 : stage === "active" ? 1 : 0.78;
  const visibleTipX = muzzleX + (tipX - muzzleX) * travel;

  drawMuzzleAssembly(graphic, muzzleX, activePulse);
  drawIonTracer(graphic, profile, {
    muzzleX,
    progress,
    stage,
    tipX: visibleTipX,
  });
  drawShellAndPixelEjection(graphic, profile, {
    muzzleX,
    progress,
    stage,
  });
  drawContactBurst(graphic, profile, {
    progress,
    tipX: visibleTipX,
  });
}

function drawMuzzleAssembly(graphic: PixiGraphics, muzzleX: number, pulse: number): void {
  drawPixelGlow(graphic, muzzleX + 16, 0, 22 + pulse * 12, 0x44f5ff, 0.11 + pulse * 0.09);
  graphic
    .rect(muzzleX - 12, -9, 25, 18)
    .fill({ color: 0x020612, alpha: 0.82 })
    .rect(muzzleX - 9, -6, 23, 4)
    .fill({ color: 0xbffbff, alpha: 0.4 + pulse * 0.2 })
    .rect(muzzleX - 9, 2, 19, 4)
    .fill({ color: 0xff4fd8, alpha: 0.24 + pulse * 0.2 });

  for (let index = 0; index < 5; index += 1) {
    const angle = -0.72 + index * 0.36;
    const inner = 14 + index;
    const outer = 31 + pulse * 18 + (index % 2) * 5;
    graphic
      .moveTo(muzzleX + Math.cos(angle) * inner, Math.sin(angle) * inner)
      .lineTo(muzzleX + Math.cos(angle) * outer, Math.sin(angle) * outer)
      .stroke({ color: index % 2 === 0 ? 0xe8fbff : 0x44f5ff, width: 2, alpha: 0.34 + pulse * 0.38 });
  }

  drawOutlinedPoly(
    graphic,
    [muzzleX + 8, -15, muzzleX + 48, -8, muzzleX + 62, 0, muzzleX + 48, 8, muzzleX + 8, 15],
    0x44f5ff,
    0x020612,
    0.24 + pulse * 0.25,
  );
}

function drawIonTracer(
  graphic: PixiGraphics,
  profile: BaseKitVfxProfile,
  options: {
    muzzleX: number;
    progress: number;
    stage: string;
    tipX: number;
  },
): void {
  const bodyAlpha = options.stage === "fade" ? 0.28 : 0.78;
  const shellWidth = options.stage === "windup" ? 7 : 11;
  graphic
    .rect(options.muzzleX + 24, -shellWidth * 0.5, Math.max(8, options.tipX - options.muzzleX - 24), shellWidth)
    .fill({ color: 0x44f5ff, alpha: bodyAlpha * 0.18 })
    .rect(options.muzzleX + 30, -2, Math.max(8, options.tipX - options.muzzleX - 38), 4)
    .fill({ color: 0x44f5ff, alpha: bodyAlpha * 0.58 })
    .rect(options.muzzleX + 36, -1, Math.max(6, options.tipX - options.muzzleX - 52), 2)
    .fill({ color: 0xe8fbff, alpha: bodyAlpha });

  for (let index = 0; index < profile.projectileSegments; index += 1) {
    const t = (index + 0.5) / profile.projectileSegments;
    const wave = Math.sin((t + options.progress) * Math.PI * 4);
    const x = options.muzzleX + 34 + (options.tipX - options.muzzleX - 48) * t;
    const y = wave * (6 + (index % 3));
    const segmentLength = 10 + (index % 4) * 5;
    graphic
      .rect(x, y - 1, segmentLength, 2)
      .fill({ color: index % 2 === 0 ? 0xff4fd8 : 0x44f5ff, alpha: 0.34 + bodyAlpha * 0.18 })
      .rect(x + 2, -y - 2, Math.max(4, segmentLength - 5), 2)
      .fill({ color: 0xe8fbff, alpha: 0.18 + bodyAlpha * 0.16 });
  }
}

function drawShellAndPixelEjection(
  graphic: PixiGraphics,
  profile: BaseKitVfxProfile,
  options: {
    muzzleX: number;
    progress: number;
    stage: string;
  },
): void {
  const activeAlpha = options.stage === "fade" ? 0.22 : 0.58;
  const count = Math.max(5, Math.round(profile.particleCount * 0.45));
  for (let index = 0; index < count; index += 1) {
    const angle = -1.65 + index * 0.31;
    const spread = 12 + (index % 5) * 6 + options.progress * 36;
    const x = options.muzzleX + 4 + Math.cos(angle) * spread;
    const y = 4 + Math.sin(angle) * spread * 0.78;
    const size = 2 + (index % 3);
    graphic
      .rect(x - 1, y - 1, size + 2, size + 2)
      .fill({ color: 0x020612, alpha: activeAlpha * 0.7 })
      .rect(x, y, size, size)
      .fill({ color: index % 3 === 0 ? 0xfff2a8 : 0x44f5ff, alpha: activeAlpha });
  }
}

function drawContactBurst(
  graphic: PixiGraphics,
  profile: BaseKitVfxProfile,
  options: {
    progress: number;
    tipX: number;
  },
): void {
  const progress = clampProgress(options.progress);
  const alpha = progress < 0.18 ? progress / 0.18 : 1 - Math.max(0, progress - 0.68) / 0.32;
  drawPixelGlow(graphic, options.tipX, 0, 18 + alpha * 18, 0xe8fbff, 0.12 + alpha * 0.16);
  drawStarSpark(graphic, options.tipX, 0, 0xe8fbff, 0.45 + alpha * 0.32);
  for (let index = 0; index < profile.contactShardCount; index += 1) {
    const angle = index * 2.399 + progress * 0.7;
    const distance = 11 + (index % 4) * 6 + progress * 18;
    const x = options.tipX + Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    drawOutlinedPoly(
      graphic,
      [x - 5, y - 2, x + 7, y, x - 3, y + 4],
      index % 2 === 0 ? 0x44f5ff : 0xff4fd8,
      0x020612,
      0.26 + alpha * 0.42,
    );
  }
}
