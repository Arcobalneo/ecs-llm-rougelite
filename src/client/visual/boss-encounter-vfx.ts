import type { BossMechSilhouette } from "../../shared/boss/boss-planning.js";
import type { BossEncounterState } from "../simulation/boss-encounter.js";
import type { Point } from "../simulation/arena-math.js";
import { drawGearShard, drawOutlinedPoly, drawPixelGlow, drawStarSpark } from "./pixel-primitives.js";
import { motifForTheme, type WishcraftThemeMotif } from "./wishcraft-theme-motifs.js";

type PixiGraphics = import("pixi.js").Graphics;

export interface BossEncounterVfxOptions {
  bossState: BossEncounterState;
  nowSeconds: number;
  player: Point;
}

export function drawBossEncounterVfx(
  graphic: PixiGraphics,
  options: BossEncounterVfxOptions,
): void {
  graphic.clear();
  if (options.bossState.phase === "victory") {
    drawBossVictoryShatterVfx(graphic, options);
    return;
  }
  if (options.bossState.phase !== "warning" && options.bossState.phase !== "active") {
    return;
  }
  const bosses = options.bossState.pendingPlan?.bosses ?? [];
  const warning = options.bossState.phase === "warning";
  const pressure = bossEncounterPressure({
    bossCount: bosses.length,
    healthProgress: options.bossState.healthProgress,
    phase: options.bossState.phase,
  });

  for (const [index, boss] of bosses.entries()) {
    const side = index === 0 ? -1 : 1;
    const center = {
      x: options.player.x + side * (220 + index * 90),
      y: options.player.y - 120 + index * 120,
    };
    const palette = bossEncounterPalette(boss.rivalThemeId);
    const motif = motifForTheme(boss.rivalThemeId);
    drawEncounterRift(graphic, {
      center,
      index,
      motif,
      nowSeconds: options.nowSeconds,
      palette,
      pressure,
      silhouette: boss.silhouette,
      warning,
    });
    drawTargetingLattice(graphic, {
      center,
      index,
      nowSeconds: options.nowSeconds,
      palette,
      pressure,
      silhouette: boss.silhouette,
      warning,
    });
    drawDragonThreatMarks(graphic, {
      center,
      motif,
      nowSeconds: options.nowSeconds,
      palette,
      pressure,
      silhouette: boss.silhouette,
    });
  }
}

export function bossEncounterThreatMarkCount(options: {
  bossCount: number;
  phase: BossEncounterState["phase"];
}): number {
  if (options.phase !== "warning" && options.phase !== "active") {
    return 0;
  }
  return options.bossCount * (options.phase === "warning" ? 10 : 7);
}

export function bossEncounterPressure(options: {
  bossCount: number;
  healthProgress: number;
  phase: BossEncounterState["phase"];
}): number {
  if (options.phase !== "warning" && options.phase !== "active") {
    return 0;
  }
  const wounded = 1 - Math.max(0, Math.min(1, options.healthProgress));
  const bossCount = Math.max(1, options.bossCount);
  const phasePressure = options.phase === "warning" ? 0.86 : 0.48 + wounded * 0.36;
  return Math.min(1, phasePressure + (bossCount - 1) * 0.12);
}

export interface BossVictoryShatterProfile {
  coreBursts: number;
  plateFragments: number;
  residueRings: number;
  shockSpokes: number;
}

export function bossVictoryShatterProfile(options: {
  bossCount: number;
  runtimeSeconds: number;
}): BossVictoryShatterProfile {
  const progress = bossVictoryShatterProgress(options.runtimeSeconds);
  const bossCount = Math.max(1, options.bossCount);
  return {
    coreBursts: bossCount,
    plateFragments: Math.ceil((14 + bossCount * 8) * (1 - progress * 0.32)),
    residueRings: Math.max(2, Math.ceil((5 + bossCount) * (1 - progress * 0.45))),
    shockSpokes: Math.ceil((12 + bossCount * 6) * (1 - progress * 0.25)),
  };
}

export function bossVictoryShatterProgress(runtimeSeconds: number): number {
  return Math.min(1, Math.max(0, runtimeSeconds / 1.25));
}

function drawBossVictoryShatterVfx(
  graphic: PixiGraphics,
  options: BossEncounterVfxOptions,
): void {
  const plan = options.bossState.completedPlan ?? options.bossState.pendingPlan;
  const bosses = plan?.bosses ?? [];
  if (bosses.length === 0) {
    return;
  }
  const progress = bossVictoryShatterProgress(options.bossState.runtimeSeconds);
  const profile = bossVictoryShatterProfile({
    bossCount: bosses.length,
    runtimeSeconds: options.bossState.runtimeSeconds,
  });
  for (const [index, boss] of bosses.entries()) {
    const side = index === 0 ? -1 : 1;
    const center = {
      x: options.player.x + side * (220 + index * 90),
      y: options.player.y - 120 + index * 120,
    };
    const palette = bossEncounterPalette(boss.rivalThemeId);
    const motif = motifForTheme(boss.rivalThemeId);
    drawVictoryCoreBurst(graphic, { center, index, motif, palette, profile, progress, silhouette: boss.silhouette });
    drawVictoryPlateFragments(graphic, { center, index, motif, palette, profile, progress, silhouette: boss.silhouette });
    drawVictoryResidueRings(graphic, { center, index, palette, profile, progress, silhouette: boss.silhouette });
  }
}

function drawVictoryCoreBurst(
  graphic: PixiGraphics,
  options: {
    center: Point;
    index: number;
    motif: WishcraftThemeMotif;
    palette: EncounterPalette;
    profile: BossVictoryShatterProfile;
    progress: number;
    silhouette: BossMechSilhouette;
  },
): void {
  const radius = options.silhouette === "crawling" ? 150 : options.silhouette === "flying" ? 134 : 118;
  const pulse = 1 - options.progress;
  drawPixelGlow(graphic, options.center.x, options.center.y, radius * (0.78 + options.progress * 0.52), options.palette.color, 0.12 * pulse);
  graphic
    .circle(options.center.x, options.center.y, 24 + options.progress * 44)
    .fill({ color: 0xe8fbff, alpha: 0.18 * pulse })
    .circle(options.center.x, options.center.y, 42 + options.progress * 72)
    .stroke({ color: options.palette.accent, width: 4, alpha: 0.38 * pulse });
  for (let spoke = 0; spoke < options.profile.shockSpokes; spoke += 1) {
    const angle = spoke * 2.399 + options.index * 0.4;
    const inner = radius * (0.08 + options.progress * 0.18);
    const outer = radius * (0.48 + (spoke % 4) * 0.1 + options.progress * 0.72);
    graphic
      .moveTo(options.center.x + Math.cos(angle) * inner, options.center.y + Math.sin(angle) * inner)
      .lineTo(options.center.x + Math.cos(angle) * outer, options.center.y + Math.sin(angle) * outer * 0.72)
      .stroke({
        color: spoke % 3 === 0 ? 0xe8fbff : spoke % 2 === 0 ? options.palette.accent : options.palette.color,
        width: spoke % 5 === 0 ? 5 : 2,
        alpha: (0.38 - options.progress * 0.24),
      });
    if (spoke % 4 === 0) {
      drawThreatMotif(graphic, {
        alpha: 0.4 * pulse,
        motif: options.motif,
        palette: options.palette,
        size: 7 + (spoke % 4),
        x: options.center.x + Math.cos(angle) * outer,
        y: options.center.y + Math.sin(angle) * outer * 0.72,
      });
    }
  }
}

function drawVictoryPlateFragments(
  graphic: PixiGraphics,
  options: {
    center: Point;
    index: number;
    motif: WishcraftThemeMotif;
    palette: EncounterPalette;
    profile: BossVictoryShatterProfile;
    progress: number;
    silhouette: BossMechSilhouette;
  },
): void {
  const spread = options.silhouette === "crawling" ? 210 : options.silhouette === "flying" ? 190 : 165;
  for (let fragment = 0; fragment < options.profile.plateFragments; fragment += 1) {
    const angle = fragment * 2.399 + options.index * 0.8;
    const distance = spread * (0.22 + (fragment % 6) * 0.09 + options.progress * 0.48);
    const x = options.center.x + Math.cos(angle) * distance;
    const y = options.center.y + Math.sin(angle) * distance * 0.68;
    const size = 10 + (fragment % 5) * 4;
    drawOutlinedPoly(
      graphic,
      [x - size, y - size * 0.45, x + size * 1.1, y - size * 0.25, x + size * 0.72, y + size * 0.8, x - size * 0.65, y + size * 0.58],
      fragment % 3 === 0 ? options.palette.accent : fragment % 2 === 0 ? options.palette.color : 0xe8fbff,
      0x020612,
      0.48 * (1 - options.progress * 0.45),
    );
    if (fragment % 5 === 0) {
      drawThreatMotif(graphic, {
        alpha: 0.28 * (1 - options.progress),
        motif: options.motif,
        palette: options.palette,
        size: 5 + (fragment % 3),
        x,
        y,
      });
    }
  }
}

function drawVictoryResidueRings(
  graphic: PixiGraphics,
  options: {
    center: Point;
    index: number;
    palette: EncounterPalette;
    profile: BossVictoryShatterProfile;
    progress: number;
    silhouette: BossMechSilhouette;
  },
): void {
  const radius = options.silhouette === "crawling" ? 184 : options.silhouette === "flying" ? 164 : 142;
  for (let ring = 0; ring < options.profile.residueRings; ring += 1) {
    const ringRadius = radius * (0.32 + ring * 0.16 + options.progress * 0.34);
    const start = options.index * 0.7 + ring * 0.42 + options.progress * 2.4;
    graphic
      .arc(options.center.x, options.center.y, ringRadius, start, start + 1.4 + ring * 0.1)
      .stroke({ color: ring % 2 === 0 ? options.palette.color : options.palette.accent, width: ring % 3 === 0 ? 4 : 2, alpha: 0.28 * (1 - options.progress * 0.55) })
      .arc(options.center.x, options.center.y, ringRadius + 22, start + 2.2, start + 3.02)
      .stroke({ color: 0xe8fbff, width: 1, alpha: 0.16 * (1 - options.progress * 0.5) });
  }
}

function drawEncounterRift(
  graphic: PixiGraphics,
  options: {
    center: Point;
    index: number;
    motif: WishcraftThemeMotif;
    nowSeconds: number;
    palette: EncounterPalette;
    pressure: number;
    silhouette: BossMechSilhouette;
    warning: boolean;
  },
): void {
  const radius = options.silhouette === "humanoid" ? 150 : options.silhouette === "crawling" ? 185 : 170;
  const pulse = 0.5 + Math.sin(options.nowSeconds * 2.7 + options.index) * 0.5;
  drawPixelGlow(graphic, options.center.x, options.center.y, radius * 0.75, options.palette.color, 0.055 * options.pressure);
  for (let ring = 0; ring < (options.warning ? 4 : 3); ring += 1) {
    const ringRadius = radius * (0.58 + ring * 0.16) + pulse * 18;
    const start = options.nowSeconds * (0.18 + ring * 0.025) + options.index;
    graphic
      .arc(options.center.x, options.center.y, ringRadius, start, start + 1.35 + ring * 0.22)
      .stroke({ color: ring % 2 === 0 ? options.palette.color : options.palette.accent, width: ring === 0 ? 4 : 2, alpha: options.pressure * (0.2 - ring * 0.03) })
      .arc(options.center.x, options.center.y, ringRadius + 22, start + 2.1, start + 2.85 + ring * 0.2)
      .stroke({ color: options.palette.accent, width: 1, alpha: options.pressure * (0.14 - ring * 0.02) });
  }
  for (let shard = 0; shard < 12; shard += 1) {
    const angle = shard * 2.399 + options.nowSeconds * 0.08;
    const distance = radius * (0.36 + (shard % 5) * 0.1);
    drawThreatMotif(graphic, {
      alpha: options.pressure * 0.24,
      motif: options.motif,
      palette: options.palette,
      size: 5 + (shard % 4),
      x: options.center.x + Math.cos(angle) * distance,
      y: options.center.y + Math.sin(angle) * distance * 0.72,
    });
  }
}

function drawTargetingLattice(
  graphic: PixiGraphics,
  options: {
    center: Point;
    index: number;
    nowSeconds: number;
    palette: EncounterPalette;
    pressure: number;
    silhouette: BossMechSilhouette;
    warning: boolean;
  },
): void {
  const laneCount = options.warning ? 9 : 6;
  const width = options.silhouette === "crawling" ? 330 : options.silhouette === "flying" ? 300 : 250;
  const height = options.silhouette === "humanoid" ? 270 : 210;
  for (let lane = 0; lane < laneCount; lane += 1) {
    const t = lane / Math.max(1, laneCount - 1);
    const y = options.center.y - height * 0.5 + t * height + Math.sin(options.nowSeconds * 2.1 + lane) * 7;
    const jitter = Math.sin(options.nowSeconds * 0.9 + options.index + lane) * 18;
    graphic
      .moveTo(options.center.x - width * 0.5 + jitter, y)
      .lineTo(options.center.x + width * 0.5 - jitter, y + Math.sin(lane) * 11)
      .stroke({ color: lane % 2 === 0 ? options.palette.color : options.palette.accent, width: lane % 3 === 0 ? 2 : 1, alpha: options.pressure * (options.warning ? 0.16 : 0.1) });
  }
  for (let lock = 0; lock < 5; lock += 1) {
    const angle = lock * 1.257 + options.nowSeconds * 0.22;
    const x = options.center.x + Math.cos(angle) * width * 0.32;
    const y = options.center.y + Math.sin(angle) * height * 0.28;
    graphic
      .rect(x - 10, y - 10, 20, 20)
      .stroke({ color: options.palette.accent, width: 1, alpha: options.pressure * 0.28 })
      .rect(x - 4, y - 4, 8, 8)
      .fill({ color: options.palette.color, alpha: options.pressure * 0.18 });
  }
}

function drawDragonThreatMarks(
  graphic: PixiGraphics,
  options: {
    center: Point;
    motif: WishcraftThemeMotif;
    nowSeconds: number;
    palette: EncounterPalette;
    pressure: number;
    silhouette: BossMechSilhouette;
  },
): void {
  const count = bossEncounterThreatMarkCount({ bossCount: 1, phase: "active" });
  const reach = options.silhouette === "crawling" ? 190 : options.silhouette === "flying" ? 165 : 140;
  for (let mark = 0; mark < count; mark += 1) {
    const angle = mark * 2.399 + options.nowSeconds * 0.05;
    const distance = reach * (0.44 + (mark % 4) * 0.15);
    const x = options.center.x + Math.cos(angle) * distance;
    const y = options.center.y + Math.sin(angle) * distance * 0.68;
    const rotation = angle + Math.PI * 0.5;
    const length = 22 + (mark % 3) * 9;
    graphic
      .moveTo(x - Math.cos(rotation) * length * 0.5, y - Math.sin(rotation) * length * 0.5)
      .lineTo(x + Math.cos(rotation) * length * 0.5, y + Math.sin(rotation) * length * 0.5)
      .stroke({ color: 0x020612, width: 7, alpha: options.pressure * 0.32 })
      .moveTo(x - Math.cos(rotation) * length * 0.5, y - Math.sin(rotation) * length * 0.5)
      .lineTo(x + Math.cos(rotation) * length * 0.5, y + Math.sin(rotation) * length * 0.5)
      .stroke({ color: mark % 2 === 0 ? options.palette.accent : options.palette.color, width: 3, alpha: options.pressure * 0.44 });
    if (mark % 3 === 0) {
      drawThreatMotif(graphic, {
        alpha: options.pressure * 0.28,
        motif: options.motif,
        palette: options.palette,
        size: 5 + (mark % 4),
        x,
        y,
      });
    }
  }
}

function drawThreatMotif(
  graphic: PixiGraphics,
  options: {
    alpha: number;
    motif: WishcraftThemeMotif;
    palette: EncounterPalette;
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
  if (options.motif === "crystal-frost" || options.motif === "blade-metal" || options.motif === "dragon-demon") {
    drawOutlinedPoly(
      graphic,
      [options.x, options.y - options.size, options.x + options.size, options.y, options.x, options.y + options.size, options.x - options.size, options.y],
      options.motif === "dragon-demon" ? options.palette.color : options.palette.accent,
      0x020612,
      options.alpha,
    );
    return;
  }
  graphic
    .circle(options.x, options.y, options.size * 0.55)
    .stroke({ color: options.palette.accent, width: 1, alpha: options.alpha })
    .circle(options.x, options.y, options.size * 0.24)
    .fill({ color: options.palette.color, alpha: options.alpha * 0.72 });
}

interface EncounterPalette {
  accent: number;
  color: number;
}

function bossEncounterPalette(themeId: string): EncounterPalette {
  const palettes: Record<string, EncounterPalette> = {
    frost: { accent: 0xe8fbff, color: 0x8cefff },
    gravity: { accent: 0xff4fd8, color: 0x7c5cff },
    magnetic: { accent: 0x44f5ff, color: 0xff4fd8 },
    ocean: { accent: 0xe8fbff, color: 0x3bd7ff },
    solar: { accent: 0xfff2a8, color: 0xffd15a },
    void: { accent: 0x44f5ff, color: 0x7c5cff },
  };
  return palettes[themeId] ?? { accent: 0x44f5ff, color: 0xff4fd8 };
}
