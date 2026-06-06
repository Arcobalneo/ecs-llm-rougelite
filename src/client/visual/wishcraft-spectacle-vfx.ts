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
  colorForWishcraftVisual,
  paletteForWishcraftFeedback,
  themeIdForWishcraftFeedback,
  type WishcraftVfxPalette,
} from "./wishcraft-vfx-palette.js";
import { drawSpectacleMotif } from "./wishcraft/spectacle/motif.js";
import {
  shouldCreateWishcraftSpectacle,
  wishcraftSpectacleOrigin,
  wishcraftSpectacleProfile,
  type WishcraftSpectacleFamily,
  type WishcraftSpectacleProfile,
} from "./wishcraft/spectacle/types.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface ActiveWishcraftSpectacleGraphic {
  bornAtSeconds: number;
  family: WishcraftSpectacleFamily;
  graphic: PixiGraphics;
  origin: Point;
  rotationSpeed: number;
  ttlSeconds: number;
}

export {
  shouldCreateWishcraftSpectacle,
  wishcraftSpectacleProfile,
} from "./wishcraft/spectacle/types.js";

export function createWishcraftSpectacleGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
  loadout: readonly Wishcraft[],
): Omit<ActiveWishcraftSpectacleGraphic, "bornAtSeconds"> | undefined {
  const profile = wishcraftSpectacleProfile(event);
  const origin = wishcraftSpectacleOrigin(event);
  if (!profile || !origin || !shouldCreateWishcraftSpectacle(event)) {
    return undefined;
  }
  const palette = paletteForSpectacle(event, loadout);
  const motif = motifForSpectacle(event, loadout);
  const graphic = new Graphics();
  drawWishcraftSpectacle(graphic, { motif, palette, profile });
  return {
    family: profile.family,
    graphic,
    origin,
    rotationSpeed: rotationSpeedForSpectacle(profile.family),
    ttlSeconds: profile.ttlSeconds,
  };
}

export function wishcraftSpectacleProgress(options: {
  bornAtSeconds: number;
  nowSeconds: number;
  ttlSeconds: number;
}): number {
  const age = Math.max(0, options.nowSeconds - options.bornAtSeconds);
  return Math.min(1, age / options.ttlSeconds);
}

export function updateWishcraftSpectacleGraphic(
  spectacle: ActiveWishcraftSpectacleGraphic,
  progress: number,
): void {
  spectacle.graphic.position.set(spectacle.origin.x, spectacle.origin.y);
  spectacle.graphic.rotation += spectacle.rotationSpeed * (1 - progress * 0.35);
  spectacle.graphic.alpha = 0.9 * (1 - progress * progress);
  const scale = scaleForSpectacle(spectacle.family, progress);
  spectacle.graphic.scale.set(scale.x, scale.y);
}

function drawWishcraftSpectacle(
  graphic: PixiGraphics,
  options: {
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    profile: WishcraftSpectacleProfile;
  },
): void {
  drawPixelGlow(graphic, 0, 0, radiusForSpectacle(options.profile) * 0.72, options.palette.color, 0.12 * options.profile.intensity);
  switch (options.profile.family) {
    case "melee-super":
      drawMeleeSuper(graphic, options);
      return;
    case "pickup-magnet":
      drawPickupMagnet(graphic, options);
      return;
    case "shield-shell":
      drawShieldShell(graphic, options);
      return;
    case "summon-fire":
      drawSummonFire(graphic, options);
      return;
    case "trigger-break":
      drawTriggerBreak(graphic, options);
      return;
  }
}

function drawMeleeSuper(
  graphic: PixiGraphics,
  options: {
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    profile: WishcraftSpectacleProfile;
  },
): void {
  const radius = radiusForSpectacle(options.profile);
  for (let arc = 0; arc < 5; arc += 1) {
    graphic
      .arc(0, 0, radius * (0.46 + arc * 0.14), -1.18 + arc * 0.08, 1.16 + arc * 0.04)
      .stroke({
        color: arc % 2 === 0 ? options.palette.color : options.palette.accent,
        width: Math.max(1, 7 - arc),
        alpha: (0.36 - arc * 0.04) * options.profile.intensity,
      });
  }
  for (let blade = 0; blade < options.profile.spokeCount; blade += 1) {
    const angle = -1.05 + blade * (2.1 / Math.max(1, options.profile.spokeCount - 1));
    const inner = radius * 0.36;
    const outer = radius * (0.82 + (blade % 3) * 0.07);
    drawOutlinedPoly(
      graphic,
      [
        Math.cos(angle) * inner,
        Math.sin(angle) * inner - 5,
        Math.cos(angle) * outer,
        Math.sin(angle) * outer,
        Math.cos(angle) * inner,
        Math.sin(angle) * inner + 5,
      ],
      blade % 2 === 0 ? options.palette.accent : options.palette.color,
      0x020612,
      0.38,
    );
  }
}

function drawPickupMagnet(
  graphic: PixiGraphics,
  options: {
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    profile: WishcraftSpectacleProfile;
  },
): void {
  const radius = radiusForSpectacle(options.profile);
  for (let lane = 0; lane < options.profile.spokeCount; lane += 1) {
    const angle = (lane / options.profile.spokeCount) * Math.PI * 2;
    const start = radius * (0.78 + (lane % 3) * 0.08);
    const end = radius * 0.22;
    graphic
      .moveTo(Math.cos(angle) * start, Math.sin(angle) * start)
      .quadraticCurveTo(
        Math.cos(angle + 0.7) * radius * 0.38,
        Math.sin(angle + 0.7) * radius * 0.38,
        Math.cos(angle + 0.28) * end,
        Math.sin(angle + 0.28) * end,
      )
      .stroke({ color: lane % 2 === 0 ? options.palette.color : options.palette.accent, width: lane % 3 === 0 ? 3 : 2, alpha: 0.32 });
    drawSpectacleMotif(graphic, {
      alpha: 0.44,
      motif: options.motif,
      palette: options.palette,
      size: 5 + (lane % 3),
      x: Math.cos(angle) * start,
      y: Math.sin(angle) * start,
    });
  }
}

function drawShieldShell(
  graphic: PixiGraphics,
  options: {
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    profile: WishcraftSpectacleProfile;
  },
): void {
  const radius = radiusForSpectacle(options.profile);
  for (let ring = 0; ring < options.profile.ringCount; ring += 1) {
    graphic.circle(0, 0, radius * (0.42 + ring * 0.16)).stroke({
      color: ring % 2 === 0 ? options.palette.color : options.palette.accent,
      width: ring === 0 ? 4 : 2,
      alpha: (0.38 - ring * 0.055) * options.profile.intensity,
    });
  }
  for (let index = 0; index < options.profile.spokeCount; index += 1) {
    const angle = (index / options.profile.spokeCount) * Math.PI * 2;
    const x = Math.cos(angle) * radius * 0.66;
    const y = Math.sin(angle) * radius * 0.66;
    drawOutlinedPoly(
      graphic,
      [x, y - 8, x + 8, y, x, y + 8, x - 8, y],
      index % 2 === 0 ? options.palette.accent : options.palette.color,
      0x020612,
      0.44,
    );
  }
}

function drawSummonFire(
  graphic: PixiGraphics,
  options: {
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    profile: WishcraftSpectacleProfile;
  },
): void {
  const radius = radiusForSpectacle(options.profile);
  for (let satellite = 0; satellite < 4; satellite += 1) {
    const angle = satellite * Math.PI * 0.5 + 0.35;
    const x = Math.cos(angle) * radius * 0.44;
    const y = Math.sin(angle) * radius * 0.44;
    graphic
      .circle(x, y, 13)
      .stroke({ color: options.palette.accent, width: 3, alpha: 0.42 })
      .moveTo(x * 0.2, y * 0.2)
      .lineTo(x * 1.2, y * 1.2)
      .stroke({ color: options.palette.color, width: 2, alpha: 0.36 });
    drawSpectacleMotif(graphic, { alpha: 0.46, motif: options.motif, palette: options.palette, size: 7, x, y });
  }
  for (let shot = 0; shot < options.profile.spokeCount; shot += 1) {
    const angle = -0.55 + shot * 0.14;
    graphic
      .moveTo(-radius * 0.18, 0)
      .lineTo(radius * 0.86, Math.sin(angle) * radius * 0.34)
      .stroke({ color: shot % 2 === 0 ? options.palette.color : options.palette.accent, width: 2, alpha: 0.22 });
  }
}

function drawTriggerBreak(
  graphic: PixiGraphics,
  options: {
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    profile: WishcraftSpectacleProfile;
  },
): void {
  const radius = radiusForSpectacle(options.profile);
  for (let ring = 0; ring < options.profile.ringCount; ring += 1) {
    graphic
      .circle(0, 0, radius * (0.28 + ring * 0.16))
      .stroke({ color: ring % 2 === 0 ? options.palette.accent : options.palette.color, width: ring === 0 ? 3 : 1, alpha: 0.34 - ring * 0.04 });
  }
  for (let shard = 0; shard < options.profile.spokeCount; shard += 1) {
    const angle = shard * 2.399;
    const inner = radius * (0.2 + (shard % 4) * 0.05);
    const outer = radius * (0.58 + (shard % 5) * 0.07);
    graphic
      .moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      .lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
      .stroke({ color: shard % 2 === 0 ? options.palette.color : options.palette.accent, width: shard % 4 === 0 ? 3 : 2, alpha: 0.44 });
    drawSpectacleMotif(graphic, {
      alpha: 0.38,
      motif: options.motif,
      palette: options.palette,
      size: 5 + (shard % 3),
      x: Math.cos(angle) * outer,
      y: Math.sin(angle) * outer,
    });
  }
}

function radiusForSpectacle(profile: WishcraftSpectacleProfile): number {
  const radiusByFamily: Record<WishcraftSpectacleFamily, number> = {
    "melee-super": 92,
    "pickup-magnet": 84,
    "shield-shell": 104,
    "summon-fire": 78,
    "trigger-break": 118,
  };
  return radiusByFamily[profile.family] * profile.intensity;
}

function scaleForSpectacle(
  family: WishcraftSpectacleFamily,
  progress: number,
): { x: number; y: number } {
  if (family === "melee-super") {
    return { x: 0.82 + progress * 0.54, y: 0.92 + progress * 0.22 };
  }
  if (family === "pickup-magnet") {
    return { x: 1.08 - progress * 0.12, y: 1.08 - progress * 0.12 };
  }
  return { x: 0.72 + progress * 0.78, y: 0.72 + progress * 0.78 };
}

function rotationSpeedForSpectacle(family: WishcraftSpectacleFamily): number {
  const speeds: Record<WishcraftSpectacleFamily, number> = {
    "melee-super": 0.045,
    "pickup-magnet": -0.08,
    "shield-shell": 0.032,
    "summon-fire": 0.075,
    "trigger-break": -0.12,
  };
  return speeds[family];
}

function paletteForSpectacle(event: CombatFeedback, loadout: readonly Wishcraft[]): WishcraftVfxPalette {
  if (event.kind === "wishcraft-hit") {
    return paletteForWishcraftFeedback(event, loadout);
  }
  const visualKind = event.kind === "wishcraft-shield"
    ? "shield"
    : event.kind === "wishcraft-summon"
      ? "summon"
      : "pickup";
  return {
    accent: 0xe8fbff,
    color: colorForWishcraftVisual(visualKind),
  };
}

function motifForSpectacle(event: CombatFeedback, loadout: readonly Wishcraft[]): WishcraftThemeMotif {
  if (event.kind === "wishcraft-hit") {
    return motifForTheme(themeIdForWishcraftFeedback(event, loadout));
  }
  return event.kind === "wishcraft-shield"
    ? "shield-angel"
    : event.kind === "wishcraft-summon"
      ? "neon"
      : "void-gravity";
}
