import { wishcraftCatalog } from "../../shared/wishcraft/catalog.js";
import type { ThemeId, Wishcraft } from "../../shared/wishcraft/types.js";
import type { Point } from "../simulation/arena-math.js";
import { drawGearShard, drawOutlinedPoly, drawStarSpark } from "./pixel-primitives.js";
import { motifForTheme, type WishcraftThemeMotif } from "./wishcraft-theme-motifs.js";

type PixiGraphics = import("pixi.js").Graphics;

export const MAX_LATE_RUN_FIELD_LANES = 28;
export const MAX_LATE_RUN_FIELD_PARTICLES = 96;

export interface LateRunFieldState {
  activeBossCount: number;
  bossKills: number;
  level: number;
  loadout: readonly Wishcraft[];
  nowSeconds: number;
  phase: "active" | "none" | "queued-warning" | "victory" | "warning";
  player: Point;
}

export function drawLateRunFieldVfx(graphic: PixiGraphics, state: LateRunFieldState): void {
  graphic.clear();
  graphic.position.set(state.player.x, state.player.y);

  const laneCount = lateRunFieldLaneCount(state);
  const particleCount = lateRunFieldParticleCount(state);
  const intensity = lateRunFieldIntensity(state);
  const themes = lateRunFieldThemeIds(state.loadout);
  const palettes = themes.length > 0 ? themes.map(paletteForTheme) : [paletteForTheme(undefined)];

  drawFieldOrbitArcs(graphic, {
    intensity,
    laneCount,
    nowSeconds: state.nowSeconds,
    palettes,
  });
  drawFieldLanes(graphic, {
    intensity,
    laneCount,
    nowSeconds: state.nowSeconds,
    palettes,
  });
  drawFieldParticles(graphic, {
    intensity,
    nowSeconds: state.nowSeconds,
    palettes,
    particleCount,
    themes,
  });
}

export function lateRunFieldLaneCount(state: Pick<LateRunFieldState, "activeBossCount" | "bossKills" | "level" | "loadout" | "phase">): number {
  const levelBands = Math.max(0, Math.floor(Math.max(1, state.level) / 5));
  const loadoutPressure = Math.min(8, state.loadout.length);
  const bossPressure = Math.min(8, state.bossKills * 2);
  const encounterPressure = state.phase === "active"
    ? 3 + Math.min(4, state.activeBossCount * 2)
    : state.phase === "warning" || state.phase === "queued-warning"
      ? 2
      : 0;
  return clamp(2 + levelBands * 3 + loadoutPressure * 2 + bossPressure + encounterPressure, 2, MAX_LATE_RUN_FIELD_LANES);
}

export function lateRunFieldParticleCount(state: Pick<LateRunFieldState, "activeBossCount" | "bossKills" | "level" | "loadout" | "phase">): number {
  const laneCount = lateRunFieldLaneCount(state);
  const craftPressure = Math.min(12, state.loadout.length * 5);
  const bossPressure = state.phase === "active" ? state.activeBossCount * 8 : 0;
  return clamp(12 + laneCount * 3 + craftPressure + bossPressure, 12, MAX_LATE_RUN_FIELD_PARTICLES);
}

export function lateRunFieldIntensity(state: Pick<LateRunFieldState, "activeBossCount" | "bossKills" | "level" | "loadout" | "phase">): number {
  const base = 0.18;
  const level = Math.min(0.28, Math.max(0, state.level - 1) * 0.012);
  const loadout = Math.min(0.32, state.loadout.length * 0.045);
  const bosses = Math.min(0.2, state.bossKills * 0.045);
  const encounter = state.phase === "active" ? Math.min(0.16, state.activeBossCount * 0.08) : 0;
  return Math.min(1, base + level + loadout + bosses + encounter);
}

export function lateRunFieldThemeIds(loadout: readonly Wishcraft[]): ThemeId[] {
  const themes: ThemeId[] = [];
  for (const wishcraft of [...loadout].reverse()) {
    const themeId = normalizeThemeId(wishcraft.primaryThemeId);
    if (themeId && !themes.includes(themeId)) {
      themes.push(themeId);
    }
    if (themes.length >= 4) {
      break;
    }
  }
  return themes;
}

function drawFieldOrbitArcs(
  graphic: PixiGraphics,
  options: {
    intensity: number;
    laneCount: number;
    nowSeconds: number;
    palettes: readonly FieldPalette[];
  },
): void {
  const ringCount = clamp(Math.ceil(options.laneCount / 5), 2, 7);
  for (let ring = 0; ring < ringCount; ring += 1) {
    const palette = options.palettes[ring % options.palettes.length] ?? paletteForTheme(undefined);
    const radius = 150 + ring * 46;
    const start = options.nowSeconds * (0.08 + ring * 0.01) + ring * 0.76;
    const arcLength = 0.9 + (ring % 3) * 0.32;
    graphic
      .arc(0, 0, radius, start, start + arcLength)
      .stroke({ color: palette.color, width: ring % 2 === 0 ? 2 : 1, alpha: 0.1 * options.intensity })
      .arc(0, 0, radius + 14, start + 1.7, start + 1.7 + arcLength * 0.72)
      .stroke({ color: palette.accent, width: 1, alpha: 0.08 * options.intensity });
  }
}

function drawFieldLanes(
  graphic: PixiGraphics,
  options: {
    intensity: number;
    laneCount: number;
    nowSeconds: number;
    palettes: readonly FieldPalette[];
  },
): void {
  for (let lane = 0; lane < options.laneCount; lane += 1) {
    const palette = options.palettes[lane % options.palettes.length] ?? paletteForTheme(undefined);
    const angle = lane * 2.399 + options.nowSeconds * (0.025 + (lane % 5) * 0.002);
    const distance = 85 + (lane % 7) * 43;
    const center = {
      x: Math.cos(angle + options.nowSeconds * 0.055) * distance,
      y: Math.sin(angle + options.nowSeconds * 0.04) * distance * 0.7,
    };
    const direction = angle + Math.PI * 0.5 + Math.sin(options.nowSeconds * 0.17 + lane) * 0.18;
    const length = 250 + (lane % 6) * 48;
    const halfX = Math.cos(direction) * length * 0.5;
    const halfY = Math.sin(direction) * length * 0.5;
    const width = lane % 6 === 0 ? 3 : 1;
    graphic
      .moveTo(center.x - halfX, center.y - halfY)
      .lineTo(center.x + halfX, center.y + halfY)
      .stroke({ color: 0x020612, width: width + 4, alpha: 0.2 * options.intensity })
      .moveTo(center.x - halfX, center.y - halfY)
      .lineTo(center.x + halfX, center.y + halfY)
      .stroke({ color: lane % 2 === 0 ? palette.accent : palette.color, width, alpha: 0.22 * options.intensity });
    drawLanePixels(graphic, {
      center,
      direction,
      intensity: options.intensity,
      lane,
      length,
      palette,
    });
  }
}

function drawLanePixels(
  graphic: PixiGraphics,
  options: {
    center: Point;
    direction: number;
    intensity: number;
    lane: number;
    length: number;
    palette: FieldPalette;
  },
): void {
  const marks = 3 + (options.lane % 4);
  for (let mark = 0; mark < marks; mark += 1) {
    const t = (mark + 1) / (marks + 1) - 0.5;
    const x = options.center.x + Math.cos(options.direction) * options.length * t;
    const y = options.center.y + Math.sin(options.direction) * options.length * t;
    const size = options.lane % 3 === 0 ? 5 : 3;
    graphic
      .rect(x - size * 0.5 - 1, y - size * 0.5 - 1, size + 2, size + 2)
      .fill({ color: 0x020612, alpha: 0.25 * options.intensity })
      .rect(x - size * 0.5, y - size * 0.5, size, size)
      .fill({ color: mark % 2 === 0 ? options.palette.accent : options.palette.color, alpha: 0.36 * options.intensity });
  }
}

function drawFieldParticles(
  graphic: PixiGraphics,
  options: {
    intensity: number;
    nowSeconds: number;
    palettes: readonly FieldPalette[];
    particleCount: number;
    themes: readonly ThemeId[];
  },
): void {
  for (let index = 0; index < options.particleCount; index += 1) {
    const palette = options.palettes[index % options.palettes.length] ?? paletteForTheme(undefined);
    const themeId = options.themes[index % Math.max(1, options.themes.length)];
    const angle = index * 2.399 + options.nowSeconds * (0.08 + (index % 4) * 0.012);
    const radius = 80 + (index % 18) * 20;
    drawFieldMotif(graphic, {
      alpha: 0.22 * options.intensity,
      motif: motifForTheme(themeId),
      palette,
      size: 4 + (index % 5),
      x: Math.cos(angle) * radius,
      y: Math.sin(angle * 0.93) * radius * 0.72,
    });
  }
}

function drawFieldMotif(
  graphic: PixiGraphics,
  options: {
    alpha: number;
    motif: WishcraftThemeMotif;
    palette: FieldPalette;
    size: number;
    x: number;
    y: number;
  },
): void {
  if (options.motif === "celestial" || options.motif === "meteor") {
    drawStarSpark(graphic, options.x, options.y, options.palette.accent, options.alpha);
    return;
  }
  if (options.motif === "clockwork") {
    drawGearShard(graphic, options.x, options.y, options.size, options.palette.accent, options.alpha);
    return;
  }
  if (options.motif === "crystal-frost" || options.motif === "dragon-demon" || options.motif === "blade-metal") {
    drawOutlinedPoly(
      graphic,
      [options.x, options.y - options.size, options.x + options.size, options.y, options.x, options.y + options.size, options.x - options.size, options.y],
      options.motif === "dragon-demon" ? options.palette.color : options.palette.accent,
      0x020612,
      options.alpha,
    );
    return;
  }
  if (options.motif === "neon" || options.motif === "music-quantum" || options.motif === "shield-angel") {
    graphic
      .rect(options.x - options.size * 0.5, options.y - options.size * 0.5, options.size, options.size)
      .stroke({ color: options.palette.accent, width: 1, alpha: options.alpha });
    return;
  }
  graphic
    .circle(options.x, options.y, options.size * 0.52)
    .stroke({ color: options.palette.accent, width: 1, alpha: options.alpha })
    .circle(options.x, options.y, options.size * 0.22)
    .fill({ color: options.palette.color, alpha: options.alpha * 0.72 });
}

interface FieldPalette {
  accent: number;
  color: number;
}

function paletteForTheme(themeId: ThemeId | undefined): FieldPalette {
  const theme = wishcraftCatalog.themeTags.find((candidate) => candidate.id === themeId);
  if (!theme) {
    return { accent: 0xe8fbff, color: 0x44f5ff };
  }
  return {
    accent: Number.parseInt(theme.palette.accent.replace("#", ""), 16),
    color: Number.parseInt(theme.palette.primary.replace("#", ""), 16),
  };
}

function normalizeThemeId(themeId: string | undefined): ThemeId | undefined {
  return wishcraftCatalog.themeTags.some((theme) => theme.id === themeId)
    ? (themeId as ThemeId)
    : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
