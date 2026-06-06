import {
  drawGearShard,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawStarSpark,
} from "../../pixel-primitives.js";
import type { WishcraftVfxPalette } from "../../wishcraft-vfx-palette.js";
import {
  drawPatternThemeGlyph,
  type WishcraftPatternThemeKit,
} from "../pattern/theme-kits.js";
import type { WishcraftMechanicAccentPattern } from "../mechanic-accent/types.js";
import type { WishcraftEvolvedProfile } from "./types.js";

type PixiGraphics = import("pixi.js").Graphics;

export interface EvolvedWishcraftOrnamentProfile {
  contrailShards: number;
  corkscrewDust: number;
  directionalRibs: number;
  energyGlyphs: number;
  foregroundShards: number;
  haloBands: number;
  orbitPearls: number;
  pattern: WishcraftMechanicAccentPattern;
  sparkBursts: number;
}

export function evolvedWishcraftOrnamentProfile(
  pattern: WishcraftMechanicAccentPattern,
): EvolvedWishcraftOrnamentProfile {
  return {
    ...ornamentTable[pattern],
    pattern,
  };
}

export function evolvedWishcraftOrnamentBudget(pattern: WishcraftMechanicAccentPattern): number {
  const profile = evolvedWishcraftOrnamentProfile(pattern);
  return profile.contrailShards +
    profile.corkscrewDust +
    profile.directionalRibs +
    profile.energyGlyphs +
    profile.foregroundShards +
    profile.haloBands +
    profile.orbitPearls +
    profile.sparkBursts;
}

export function drawEvolvedWishcraftOrnaments(
  graphic: PixiGraphics,
  options: {
    direction: number;
    palette: WishcraftVfxPalette;
    profile: WishcraftEvolvedProfile;
    themeKit: WishcraftPatternThemeKit;
  },
): void {
  const ornament = evolvedWishcraftOrnamentProfile(options.profile.pattern);
  drawHaloBands(graphic, options, ornament);
  drawDirectionalRibs(graphic, options, ornament);
  drawOrbitPearls(graphic, options, ornament);
  drawContrailShards(graphic, options, ornament);
  drawCorkscrewDust(graphic, options, ornament);
  drawEnergyGlyphs(graphic, options, ornament);
  drawForegroundShards(graphic, options, ornament);
  drawSparkBursts(graphic, options, ornament);
}

function drawHaloBands(
  graphic: PixiGraphics,
  options: OrnamentDrawOptions,
  ornament: EvolvedWishcraftOrnamentProfile,
): void {
  for (let band = 0; band < ornament.haloBands; band += 1) {
    const radius = options.profile.radius * (0.2 + band * 0.07);
    const alpha = (0.18 - band * 0.014) * options.profile.intensity;
    if (band % 3 === 0) {
      drawOutlinedRect(
        graphic,
        -radius * 0.72,
        -radius * 0.72,
        radius * 1.44,
        radius * 1.44,
        band % 2 === 0 ? options.palette.accent : options.palette.color,
        0x020612,
        alpha,
      );
      continue;
    }
    graphic
      .circle(0, 0, radius)
      .stroke({ color: band % 2 === 0 ? options.palette.color : options.palette.accent, width: band % 4 === 0 ? 3 : 1, alpha });
  }
}

function drawDirectionalRibs(
  graphic: PixiGraphics,
  options: OrnamentDrawOptions,
  ornament: EvolvedWishcraftOrnamentProfile,
): void {
  const spread = options.profile.pattern === "scatter-fan" ? 1.3 : 0.46;
  for (let rib = 0; rib < ornament.directionalRibs; rib += 1) {
    const t = rib / Math.max(1, ornament.directionalRibs - 1);
    const angle = options.direction + (t - 0.5) * spread + (rib % 2 === 0 ? 0.04 : -0.04);
    const inner = options.profile.radius * (0.12 + (rib % 3) * 0.025);
    const outer = options.profile.radius * (0.64 + (rib % 4) * 0.045);
    graphic
      .moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      .lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
      .stroke({
        color: rib % 2 === 0 ? options.palette.accent : options.palette.color,
        width: rib % 5 === 0 ? 5 : 2,
        alpha: 0.14 + options.profile.intensity * 0.12,
      });
  }
}

function drawOrbitPearls(
  graphic: PixiGraphics,
  options: OrnamentDrawOptions,
  ornament: EvolvedWishcraftOrnamentProfile,
): void {
  for (let pearl = 0; pearl < ornament.orbitPearls; pearl += 1) {
    const angle = pearl * 2.399 + options.themeKit.angleOffset;
    const radius = options.profile.radius * (0.34 + (pearl % 5) * 0.06);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    graphic
      .circle(x, y, 5 + (pearl % 3))
      .fill({ color: 0xe8fbff, alpha: 0.12 })
      .circle(x, y, 3 + (pearl % 2))
      .fill({ color: pearl % 2 === 0 ? options.palette.color : options.palette.accent, alpha: 0.44 });
  }
}

function drawContrailShards(
  graphic: PixiGraphics,
  options: OrnamentDrawOptions,
  ornament: EvolvedWishcraftOrnamentProfile,
): void {
  for (let shard = 0; shard < ornament.contrailShards; shard += 1) {
    const t = shard / Math.max(1, ornament.contrailShards - 1);
    const angle = options.direction + (shard % 2 === 0 ? -0.22 : 0.22) + Math.sin(t * Math.PI) * 0.14;
    const distance = options.profile.radius * (0.2 + t * 0.62);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 6 + (shard % 4);
    drawOutlinedPoly(
      graphic,
      [
        x - Math.cos(angle) * size,
        y - Math.sin(angle) * size,
        x + Math.cos(angle + 1.6) * size * 0.65,
        y + Math.sin(angle + 1.6) * size * 0.65,
        x + Math.cos(angle) * size * 1.5,
        y + Math.sin(angle) * size * 1.5,
      ],
      shard % 2 === 0 ? options.palette.color : options.palette.accent,
      0x020612,
      0.24 + options.profile.intensity * 0.18,
    );
  }
}

function drawCorkscrewDust(
  graphic: PixiGraphics,
  options: OrnamentDrawOptions,
  ornament: EvolvedWishcraftOrnamentProfile,
): void {
  for (const side of [-1, 1] as const) {
    for (let mote = 0; mote < ornament.corkscrewDust; mote += 1) {
      const t = mote / Math.max(1, ornament.corkscrewDust - 1);
      const angle = options.direction + side * (t * Math.PI * 4.8 + options.themeKit.angleOffset);
      const radius = options.profile.radius * (0.16 + t * 0.66);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const size = 2 + (mote % 3);
      graphic
        .rect(x - 1, y - 1, size + 2, size + 2)
        .fill({ color: 0x020612, alpha: 0.35 })
        .rect(x, y, size, size)
        .fill({ color: side < 0 ? options.palette.color : options.palette.accent, alpha: 0.26 + options.profile.intensity * 0.16 });
    }
  }
}

function drawEnergyGlyphs(
  graphic: PixiGraphics,
  options: OrnamentDrawOptions,
  ornament: EvolvedWishcraftOrnamentProfile,
): void {
  for (let glyph = 0; glyph < ornament.energyGlyphs; glyph += 1) {
    const angle = glyph * 2.399 + options.direction + options.themeKit.angleOffset;
    const radius = options.profile.radius * (0.24 + (glyph % 7) * 0.065);
    drawPatternThemeGlyph(graphic, {
      alpha: 0.42 + options.profile.intensity * 0.16,
      kit: options.themeKit,
      palette: options.palette,
      rotation: angle,
      size: 5 + (glyph % 5),
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
}

function drawForegroundShards(
  graphic: PixiGraphics,
  options: OrnamentDrawOptions,
  ornament: EvolvedWishcraftOrnamentProfile,
): void {
  for (let shard = 0; shard < ornament.foregroundShards; shard += 1) {
    const angle = shard * 2.399 + options.themeKit.angleOffset * 0.7;
    const radius = options.profile.radius * (0.18 + (shard % 9) * 0.058);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (options.themeKit.glyph === "clock-gear" && shard % 5 === 0) {
      drawGearShard(graphic, x, y, 5 + (shard % 3), options.palette.accent, 0.32);
      continue;
    }
    drawOutlinedPoly(
      graphic,
      [x, y - 6, x + 6, y, x + 2, y + 8, x - 7, y + 2],
      shard % 2 === 0 ? options.palette.color : options.palette.accent,
      0x020612,
      0.3 + options.profile.intensity * 0.12,
    );
  }
}

function drawSparkBursts(
  graphic: PixiGraphics,
  options: OrnamentDrawOptions,
  ornament: EvolvedWishcraftOrnamentProfile,
): void {
  for (let spark = 0; spark < ornament.sparkBursts; spark += 1) {
    const angle = spark * 2.399 + options.direction * 0.35;
    const radius = options.profile.radius * (0.2 + (spark % 8) * 0.07);
    drawStarSpark(
      graphic,
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      spark % 2 === 0 ? options.palette.accent : 0xe8fbff,
      0.22 + options.profile.intensity * 0.15,
    );
  }
}

type OrnamentDrawOptions = {
  direction: number;
  palette: WishcraftVfxPalette;
  profile: WishcraftEvolvedProfile;
  themeKit: WishcraftPatternThemeKit;
};

const ornamentTable: Record<
  WishcraftMechanicAccentPattern,
  Omit<EvolvedWishcraftOrnamentProfile, "pattern">
> = {
  "area-nova": { contrailShards: 8, corkscrewDust: 6, directionalRibs: 8, energyGlyphs: 18, foregroundShards: 24, haloBands: 10, orbitPearls: 10, sparkBursts: 22 },
  "beam-cap": { contrailShards: 8, corkscrewDust: 4, directionalRibs: 18, energyGlyphs: 12, foregroundShards: 18, haloBands: 7, orbitPearls: 6, sparkBursts: 16 },
  "burst-array": { contrailShards: 10, corkscrewDust: 8, directionalRibs: 10, energyGlyphs: 16, foregroundShards: 22, haloBands: 9, orbitPearls: 10, sparkBursts: 22 },
  "lance-spear": { contrailShards: 14, corkscrewDust: 5, directionalRibs: 12, energyGlyphs: 10, foregroundShards: 17, haloBands: 6, orbitPearls: 5, sparkBursts: 14 },
  "melee-blade": { contrailShards: 9, corkscrewDust: 6, directionalRibs: 14, energyGlyphs: 14, foregroundShards: 24, haloBands: 7, orbitPearls: 6, sparkBursts: 20 },
  "missile-salvo": { contrailShards: 24, corkscrewDust: 5, directionalRibs: 10, energyGlyphs: 12, foregroundShards: 19, haloBands: 6, orbitPearls: 5, sparkBursts: 20 },
  "pickup-magnet": { contrailShards: 8, corkscrewDust: 22, directionalRibs: 6, energyGlyphs: 20, foregroundShards: 18, haloBands: 9, orbitPearls: 18, sparkBursts: 14 },
  "ricochet-node": { contrailShards: 12, corkscrewDust: 6, directionalRibs: 12, energyGlyphs: 18, foregroundShards: 16, haloBands: 7, orbitPearls: 12, sparkBursts: 18 },
  "scatter-fan": { contrailShards: 14, corkscrewDust: 5, directionalRibs: 16, energyGlyphs: 14, foregroundShards: 20, haloBands: 6, orbitPearls: 8, sparkBursts: 18 },
  "shield-guard": { contrailShards: 4, corkscrewDust: 8, directionalRibs: 4, energyGlyphs: 18, foregroundShards: 18, haloBands: 12, orbitPearls: 16, sparkBursts: 16 },
  "spiral-corkscrew": { contrailShards: 10, corkscrewDust: 26, directionalRibs: 8, energyGlyphs: 24, foregroundShards: 18, haloBands: 9, orbitPearls: 14, sparkBursts: 18 },
  "stat-tuning": { contrailShards: 6, corkscrewDust: 6, directionalRibs: 8, energyGlyphs: 14, foregroundShards: 14, haloBands: 7, orbitPearls: 8, sparkBursts: 14 },
  "summon-link": { contrailShards: 8, corkscrewDust: 8, directionalRibs: 8, energyGlyphs: 18, foregroundShards: 16, haloBands: 8, orbitPearls: 18, sparkBursts: 16 },
  "trigger-sigil": { contrailShards: 8, corkscrewDust: 8, directionalRibs: 8, energyGlyphs: 22, foregroundShards: 22, haloBands: 11, orbitPearls: 12, sparkBursts: 24 },
};
