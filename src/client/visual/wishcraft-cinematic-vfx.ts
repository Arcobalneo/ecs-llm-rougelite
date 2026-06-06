import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";
import type { Point } from "../simulation/arena-math.js";
import {
  drawOutlinedPoly,
  drawPixelGlow,
} from "./pixel-primitives.js";
import {
  motifForTheme,
  type WishcraftThemeMotif,
} from "./wishcraft-theme-motifs.js";
import {
  paletteForWishcraftFeedback,
  themeIdForWishcraftFeedback,
  type WishcraftVfxPalette,
} from "./wishcraft-vfx-palette.js";
import { drawSpectacleMotif } from "./wishcraft/spectacle/motif.js";
import {
  drawPatternThemeGlyph,
  patternThemeKitForTheme,
  type WishcraftPatternThemeKit,
} from "./wishcraft/pattern/theme-kits.js";
import {
  shouldCreateWishcraftCinematic,
  wishcraftCinematicOrigin,
  wishcraftCinematicProfile,
  wishcraftCinematicProgress,
  type WishcraftCinematicFamily,
  type WishcraftCinematicProfile,
} from "./wishcraft/cinematic/types.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface ActiveWishcraftCinematicGraphic {
  bornAtSeconds: number;
  family: WishcraftCinematicFamily;
  graphic: PixiGraphics;
  origin: Point;
  pulseScale: number;
  rotationSpeed: number;
  ttlSeconds: number;
}

export {
  shouldCreateWishcraftCinematic,
  wishcraftCinematicProfile,
  wishcraftCinematicProgress,
} from "./wishcraft/cinematic/types.js";

export function createWishcraftCinematicGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
  loadout: readonly Wishcraft[],
): Omit<ActiveWishcraftCinematicGraphic, "bornAtSeconds"> | undefined {
  const profile = wishcraftCinematicProfile(event);
  const origin = wishcraftCinematicOrigin(event);
  if (!profile || !origin || event.kind !== "wishcraft-hit" || !shouldCreateWishcraftCinematic(event)) {
    return undefined;
  }

  const themeId = themeIdForWishcraftFeedback(event, loadout);
  const palette = paletteForWishcraftFeedback(event, loadout);
  const motif = motifForTheme(themeId);
  const themeKit = patternThemeKitForTheme(themeId);
  const direction = Math.atan2(event.position.y - event.origin.y, event.position.x - event.origin.x);
  const graphic = new Graphics();
  drawWishcraftCinematic(graphic, {
    direction,
    motif,
    palette,
    profile,
    themeKit,
  });
  return {
    family: profile.family,
    graphic,
    origin,
    pulseScale: pulseScaleForFamily(profile.family),
    rotationSpeed: rotationSpeedForFamily(profile.family),
    ttlSeconds: profile.ttlSeconds,
  };
}

export function updateWishcraftCinematicGraphic(
  cinematic: ActiveWishcraftCinematicGraphic,
  progress: number,
): void {
  cinematic.graphic.position.set(cinematic.origin.x, cinematic.origin.y);
  cinematic.graphic.rotation += cinematic.rotationSpeed * (1 - progress * 0.5);
  cinematic.graphic.alpha = 1 * (1 - progress * progress * 0.82);
  const scale = 0.58 + progress * cinematic.pulseScale;
  cinematic.graphic.scale.set(scale);
}

function drawWishcraftCinematic(
  graphic: PixiGraphics,
  options: {
    direction: number;
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    profile: WishcraftCinematicProfile;
    themeKit: WishcraftPatternThemeKit;
  },
): void {
  drawPixelGlow(graphic, 0, 0, options.profile.width * 0.78, options.palette.color, 0.2 * options.profile.intensity);
  drawCinematicRings(graphic, options);
  drawCinematicCoreHighlights(graphic, options);
  switch (options.profile.family) {
    case "beam-overdrive":
      drawBeamOverdrive(graphic, options);
      return;
    case "blade-storm":
      drawBladeStorm(graphic, options);
      return;
    case "lance-break":
      drawLanceBreak(graphic, options);
      return;
    case "missile-bloom":
      drawMissileBloom(graphic, options);
      return;
    case "nova-detonation":
      drawNovaDetonation(graphic, options);
      return;
    case "scatter-barrage":
      drawScatterBarrage(graphic, options);
      return;
    case "summon-salvo":
      drawSummonSalvo(graphic, options);
      return;
    case "trigger-rupture":
      drawTriggerRupture(graphic, options);
      return;
  }
}

function drawCinematicRings(
  graphic: PixiGraphics,
  options: CinematicDrawOptions,
): void {
  for (let ring = 0; ring < options.profile.ringCount; ring += 1) {
    const radius = options.profile.width * (0.22 + ring * 0.12);
    graphic
      .circle(0, 0, radius)
      .stroke({
        color: ring % 2 === 0 ? options.palette.color : options.palette.accent,
        width: ring === 0 ? 3 : 1,
        alpha: (0.36 - ring * 0.032) * options.profile.intensity,
      });
  }
}

function drawCinematicCoreHighlights(
  graphic: PixiGraphics,
  options: CinematicDrawOptions,
): void {
  const width = options.profile.width;
  graphic
    .circle(0, 0, width * 0.08)
    .fill({ color: 0xe8fbff, alpha: 0.22 * options.profile.intensity })
    .circle(0, 0, width * 0.16)
    .stroke({ color: options.palette.accent, width: 2, alpha: 0.46 * options.profile.intensity });
  for (let spark = 0; spark < 16; spark += 1) {
    const angle = spark * 2.399 + options.themeKit.angleOffset;
    const inner = width * (0.12 + (spark % 3) * 0.035);
    const outer = width * (0.3 + (spark % 5) * 0.045);
    graphic
      .moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      .lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
      .stroke({
        color: spark % 3 === 0 ? 0xe8fbff : spark % 2 === 0 ? options.palette.accent : options.palette.color,
        width: spark % 4 === 0 ? 3 : 2,
        alpha: 0.3 + (spark % 3) * 0.07,
      });
  }
}

function drawBeamOverdrive(graphic: PixiGraphics, options: CinematicDrawOptions): void {
  const width = options.profile.width;
  for (let lane = 0; lane < options.profile.afterimageCount; lane += 1) {
    const t = lane / Math.max(1, options.profile.afterimageCount - 1);
    const y = (t - 0.5) * 62 + Math.sin(t * Math.PI * 5) * 10;
    graphic
      .moveTo(-width * 0.78, y)
      .lineTo(width * 0.78, -y * 0.35)
      .stroke({ color: lane % 2 === 0 ? options.palette.color : options.palette.accent, width: lane % 3 === 0 ? 5 : 3, alpha: 0.28 });
  }
  for (let cap = -1; cap <= 1; cap += 2) {
    drawOutlinedPoly(
      graphic,
      [
        cap * width * 0.82,
        0,
        cap * width * 0.62,
        -18,
        cap * width * 0.48,
        0,
        cap * width * 0.62,
        18,
      ],
      cap < 0 ? options.palette.accent : options.palette.color,
      0x020612,
      0.42,
    );
  }
  drawCinematicParticles(graphic, options, "lane");
}

function drawBladeStorm(graphic: PixiGraphics, options: CinematicDrawOptions): void {
  const width = options.profile.width;
  for (let blade = 0; blade < options.profile.afterimageCount; blade += 1) {
    const angle = -1.32 + blade * (2.64 / Math.max(1, options.profile.afterimageCount - 1));
    graphic
      .arc(0, 0, width * (0.42 + (blade % 4) * 0.045), angle, angle + 0.64)
      .stroke({ color: blade % 2 === 0 ? options.palette.accent : options.palette.color, width: blade % 3 === 0 ? 6 : 4, alpha: 0.38 });
    drawPatternThemeGlyph(graphic, {
      alpha: 0.5,
      kit: options.themeKit,
      palette: options.palette,
      rotation: angle,
      size: 8 + (blade % 3),
      x: Math.cos(angle + 0.3) * width * 0.52,
      y: Math.sin(angle + 0.3) * width * 0.52,
    });
  }
  drawCinematicParticles(graphic, options, "radial");
}

function drawLanceBreak(graphic: PixiGraphics, options: CinematicDrawOptions): void {
  const width = options.profile.width;
  for (let ghost = 0; ghost < options.profile.afterimageCount; ghost += 1) {
    const offset = (ghost - options.profile.afterimageCount * 0.5) * 8;
    graphic
      .moveTo(-width * 0.72, offset)
      .lineTo(width * 0.46, offset * 0.2)
      .stroke({ color: ghost % 2 === 0 ? options.palette.color : options.palette.accent, width: ghost % 3 === 0 ? 5 : 3, alpha: 0.3 });
  }
  drawOutlinedPoly(
    graphic,
    [-width * 0.12, -18, width * 0.78, 0, -width * 0.12, 18, width * 0.08, 0],
    options.palette.accent,
    0x020612,
    0.48,
  );
  drawCinematicParticles(graphic, options, "lane");
}

function drawMissileBloom(graphic: PixiGraphics, options: CinematicDrawOptions): void {
  const width = options.profile.width;
  for (let missile = 0; missile < options.profile.afterimageCount; missile += 1) {
    const angle = (missile / options.profile.afterimageCount) * Math.PI * 2;
    const radius = width * (0.24 + (missile % 4) * 0.075);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    graphic
      .moveTo(x * 0.35, y * 0.35)
      .quadraticCurveTo(x * 0.72 - y * 0.12, y * 0.72 + x * 0.12, x, y)
      .stroke({ color: missile % 2 === 0 ? options.palette.color : options.palette.accent, width: 3, alpha: 0.34 });
    drawOutlinedPoly(graphic, [x - 8, y - 5, x + 12, y, x - 8, y + 5], options.palette.color, 0x020612, 0.42);
  }
  drawCinematicParticles(graphic, options, "radial");
}

function drawNovaDetonation(graphic: PixiGraphics, options: CinematicDrawOptions): void {
  const width = options.profile.width;
  for (let spoke = 0; spoke < options.profile.afterimageCount; spoke += 1) {
    const angle = (spoke / options.profile.afterimageCount) * Math.PI * 2 + options.themeKit.angleOffset;
    graphic
      .moveTo(Math.cos(angle) * width * 0.16, Math.sin(angle) * width * 0.16)
      .lineTo(Math.cos(angle) * width * 0.78, Math.sin(angle) * width * 0.78)
      .stroke({ color: spoke % 2 === 0 ? options.palette.color : options.palette.accent, width: spoke % 4 === 0 ? 6 : 3, alpha: 0.35 });
    drawPatternThemeGlyph(graphic, {
      alpha: 0.42,
      kit: options.themeKit,
      palette: options.palette,
      rotation: angle,
      size: 7 + (spoke % 3),
      x: Math.cos(angle) * width * 0.62,
      y: Math.sin(angle) * width * 0.62,
    });
  }
  drawCinematicParticles(graphic, options, "radial");
}

function drawScatterBarrage(graphic: PixiGraphics, options: CinematicDrawOptions): void {
  const width = options.profile.width;
  const start = options.direction - 0.68;
  for (let lane = 0; lane < options.profile.afterimageCount; lane += 1) {
    const t = lane / Math.max(1, options.profile.afterimageCount - 1);
    const angle = start + t * 1.36;
    const length = width * (0.46 + (lane % 4) * 0.06);
    graphic
      .moveTo(Math.cos(angle) * width * 0.08, Math.sin(angle) * width * 0.08)
      .lineTo(Math.cos(angle) * length, Math.sin(angle) * length)
      .stroke({ color: lane % 2 === 0 ? options.palette.accent : options.palette.color, width: lane % 3 === 0 ? 5 : 3, alpha: 0.34 });
    drawSpectacleMotif(graphic, {
      alpha: 0.44,
      motif: options.motif,
      palette: options.palette,
      size: 5 + (lane % 4),
      x: Math.cos(angle) * length,
      y: Math.sin(angle) * length,
    });
  }
  drawCinematicParticles(graphic, options, "fan");
}

function drawSummonSalvo(graphic: PixiGraphics, options: CinematicDrawOptions): void {
  const width = options.profile.width;
  for (let node = 0; node < 5; node += 1) {
    const angle = node * Math.PI * 0.4 - Math.PI * 0.8;
    const x = Math.cos(angle) * width * 0.34;
    const y = Math.sin(angle) * width * 0.34;
    graphic
      .circle(x, y, 11)
      .stroke({ color: options.palette.accent, width: 3, alpha: 0.5 })
      .moveTo(x, y)
      .lineTo(width * 0.68, y * 0.3)
      .stroke({ color: options.palette.color, width: 3, alpha: 0.32 });
    drawPatternThemeGlyph(graphic, { alpha: 0.5, kit: options.themeKit, palette: options.palette, rotation: angle, size: 7, x, y });
  }
  drawCinematicParticles(graphic, options, "lane");
}

function drawTriggerRupture(graphic: PixiGraphics, options: CinematicDrawOptions): void {
  const width = options.profile.width;
  for (let ring = 0; ring < options.profile.ringCount + 2; ring += 1) {
    const radius = width * (0.18 + ring * 0.1);
    graphic
      .rect(-radius, -radius, radius * 2, radius * 2)
      .stroke({ color: ring % 2 === 0 ? options.palette.accent : options.palette.color, width: ring % 3 === 0 ? 4 : 2, alpha: 0.32 });
  }
  for (let shard = 0; shard < options.profile.afterimageCount; shard += 1) {
    const angle = shard * 2.399;
    const inner = width * 0.16;
    const outer = width * (0.48 + (shard % 5) * 0.06);
    drawOutlinedPoly(
      graphic,
      [
        Math.cos(angle) * inner,
        Math.sin(angle) * inner,
        Math.cos(angle + 0.08) * outer,
        Math.sin(angle + 0.08) * outer,
        Math.cos(angle - 0.08) * outer,
        Math.sin(angle - 0.08) * outer,
      ],
      shard % 2 === 0 ? options.palette.color : options.palette.accent,
      0x020612,
      0.34,
    );
  }
  drawCinematicParticles(graphic, options, "radial");
}

function drawCinematicParticles(
  graphic: PixiGraphics,
  options: CinematicDrawOptions,
  mode: "fan" | "lane" | "radial",
): void {
  for (let index = 0; index < options.profile.particleCount; index += 1) {
    const t = index / Math.max(1, options.profile.particleCount - 1);
    const angle = mode === "fan"
      ? options.direction - 0.72 + t * 1.44
      : index * 2.399 + options.themeKit.angleOffset;
    const distance = mode === "lane"
      ? options.profile.width * (0.16 + (index % 7) * 0.08)
      : options.profile.width * (0.18 + (index % 8) * 0.07);
    const laneX = mode === "lane"
      ? -options.profile.width * 0.48 + t * options.profile.width * 0.96
      : Math.cos(angle) * distance;
    const laneY = mode === "lane"
      ? Math.sin(t * Math.PI * 5) * 28 + ((index % 3) - 1) * 7
      : Math.sin(angle) * distance;
    drawSpectacleMotif(graphic, {
      alpha: 0.3 + (index % 5) * 0.055,
      motif: options.motif,
      palette: options.palette,
      size: 4 + (index % 4),
      x: laneX,
      y: laneY,
    });
  }
}

function pulseScaleForFamily(family: WishcraftCinematicFamily): number {
  const scales: Record<WishcraftCinematicFamily, number> = {
    "beam-overdrive": 1.22,
    "blade-storm": 1.46,
    "lance-break": 1.1,
    "missile-bloom": 1.42,
    "nova-detonation": 1.62,
    "scatter-barrage": 1.24,
    "summon-salvo": 1.18,
    "trigger-rupture": 1.7,
  };
  return scales[family];
}

function rotationSpeedForFamily(family: WishcraftCinematicFamily): number {
  const speeds: Record<WishcraftCinematicFamily, number> = {
    "beam-overdrive": 0.002,
    "blade-storm": 0.026,
    "lance-break": 0.004,
    "missile-bloom": 0.018,
    "nova-detonation": 0.014,
    "scatter-barrage": 0.006,
    "summon-salvo": 0.012,
    "trigger-rupture": -0.02,
  };
  return speeds[family];
}

type CinematicDrawOptions = {
  direction: number;
  motif: WishcraftThemeMotif;
  palette: WishcraftVfxPalette;
  profile: WishcraftCinematicProfile;
  themeKit: WishcraftPatternThemeKit;
};
