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

export function drawLaserSwordVfxFrame(
  graphic: PixiGraphics,
  profile: BaseKitVfxProfile,
  options: {
    progress: number;
  },
): void {
  const progress = clampProgress(options.progress);
  const stage = baseKitAnimationStage(progress);
  const stagePower = stage === "windup"
    ? progress / 0.22
    : stage === "active"
      ? 1
      : 1 - (progress - 0.72) / 0.28;
  const arcOpen = stage === "windup" ? 0.48 + stagePower * 0.42 : stage === "active" ? 1 : 0.88;
  const radius = 52 + stagePower * 18 + (stage === "fade" ? progress * 10 : 0);

  drawHiltCharge(graphic, stagePower, progress);
  drawBladeCore(graphic, {
    arcOpen,
    progress,
    radius,
    stage,
    stagePower,
  });
  drawAfterimages(graphic, profile, {
    arcOpen,
    progress,
    radius,
    stagePower,
  });
  drawContactShards(graphic, profile, {
    progress,
    radius,
    stagePower,
  });
}

function drawHiltCharge(graphic: PixiGraphics, stagePower: number, progress: number): void {
  drawPixelGlow(graphic, 18, 0, 28 + stagePower * 12, 0xff4fd8, 0.12 + stagePower * 0.08);
  graphic
    .rect(-11, -9, 24, 18)
    .fill({ color: 0x020612, alpha: 0.82 })
    .rect(-6, -5, 20, 4)
    .fill({ color: 0xe8fbff, alpha: 0.42 + stagePower * 0.22 })
    .rect(-4, 2, 17, 4)
    .fill({ color: 0x44f5ff, alpha: 0.28 + stagePower * 0.2 });

  for (let index = 0; index < 4; index += 1) {
    const x = -16 + index * 9;
    const y = (index % 2 === 0 ? -1 : 1) * (14 + progress * 12);
    graphic
      .rect(x, y, 5, 2)
      .fill({ color: index % 2 === 0 ? 0x44f5ff : 0xff4fd8, alpha: 0.22 + stagePower * 0.22 });
  }
}

function drawBladeCore(
  graphic: PixiGraphics,
  options: {
    arcOpen: number;
    progress: number;
    radius: number;
    stage: string;
    stagePower: number;
  },
): void {
  const start = -1.08 * options.arcOpen;
  const end = 1.12 * options.arcOpen;
  const fadeAlpha = options.stage === "fade" ? 0.46 : 0.86;
  graphic
    .arc(0, 0, options.radius + 8, start - 0.14, end + 0.12)
    .stroke({ color: 0x020612, width: 18, alpha: 0.68 })
    .arc(0, 0, options.radius + 8, start - 0.14, end + 0.12)
    .stroke({ color: 0xff4fd8, width: 13, alpha: fadeAlpha * 0.56 })
    .arc(0, 0, options.radius - 2, start, end)
    .stroke({ color: 0x44f5ff, width: 8, alpha: fadeAlpha * 0.72 })
    .arc(0, 0, options.radius - 9, start + 0.08, end - 0.08)
    .stroke({ color: 0xe8fbff, width: 3, alpha: fadeAlpha });

  const tipAngle = end;
  const tipX = Math.cos(tipAngle) * (options.radius + 11);
  const tipY = Math.sin(tipAngle) * (options.radius + 11);
  drawOutlinedPoly(
    graphic,
    [
      tipX - 13,
      tipY - 5,
      tipX + 18,
      tipY,
      tipX - 8,
      tipY + 11,
    ],
    0xe8fbff,
    0x020612,
    0.38 + options.stagePower * 0.35,
  );
  drawStarSpark(graphic, tipX, tipY, 0xe8fbff, 0.38 + options.stagePower * 0.28);
}

function drawAfterimages(
  graphic: PixiGraphics,
  profile: BaseKitVfxProfile,
  options: {
    arcOpen: number;
    progress: number;
    radius: number;
    stagePower: number;
  },
): void {
  for (let index = 0; index < profile.bladeAfterimages; index += 1) {
    const t = (index + 1) / (profile.bladeAfterimages + 1);
    const angle = -1.04 * options.arcOpen + t * 2.12 * options.arcOpen;
    const inner = options.radius - 34 - (index % 3) * 4;
    const outer = options.radius + 20 + (index % 2) * 8;
    const alpha = (0.16 + options.stagePower * 0.24) * (1 - Math.max(0, options.progress - 0.78));
    graphic
      .moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      .lineTo(Math.cos(angle + 0.08) * outer, Math.sin(angle + 0.08) * outer)
      .stroke({ color: index % 2 === 0 ? 0xff4fd8 : 0x44f5ff, width: 3 + (index % 3), alpha });
  }
}

function drawContactShards(
  graphic: PixiGraphics,
  profile: BaseKitVfxProfile,
  options: {
    progress: number;
    radius: number;
    stagePower: number;
  },
): void {
  const burstAlpha = Math.min(1, options.stagePower + 0.2) * (1 - Math.max(0, options.progress - 0.74) / 0.26);
  for (let index = 0; index < profile.contactShardCount; index += 1) {
    const angle = -0.92 + index * (1.95 / Math.max(1, profile.contactShardCount - 1));
    const distance = options.radius + 12 + (index % 4) * 8 + options.progress * 15;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    drawOutlinedPoly(
      graphic,
      [
        x - 4,
        y - 6,
        x + 12,
        y - 1,
        x - 2,
        y + 5,
      ],
      index % 3 === 0 ? 0xe8fbff : index % 2 === 0 ? 0xff4fd8 : 0x44f5ff,
      0x020612,
      0.22 + burstAlpha * 0.48,
    );
  }
}
