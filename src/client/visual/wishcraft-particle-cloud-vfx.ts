import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";
import type { Point } from "../simulation/arena-math.js";
import {
  drawGearShard,
  drawOutlinedPoly,
  drawPixelGlow,
  drawStarSpark,
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

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface ActiveParticleCloudGraphic {
  bornAtSeconds: number;
  driftX: number;
  driftY: number;
  graphic: PixiGraphics;
  origin: Point;
  rotation: number;
  ttlSeconds: number;
}

export function shouldCreateParticleCloudVfx(event: CombatFeedback): boolean {
  if (event.kind !== "wishcraft-hit") {
    return false;
  }
  return !["pickup", "shield"].includes(event.visualKind);
}

export function particleCloudParticleCount(event: CombatFeedback): number {
  if (event.kind !== "wishcraft-hit") {
    return 0;
  }
  const distance = Math.hypot(event.position.x - event.origin.x, event.position.y - event.origin.y);
  const baseByKind: Record<string, number> = {
    area: 34,
    beam: 30,
    burst: 30,
    lance: 20,
    melee: 24,
    missile: 28,
    ricochet: 22,
    scatter: 26,
    summon: 18,
    trigger: 28,
  };
  return Math.min(48, (baseByKind[event.visualKind] ?? 18) + Math.floor(Math.min(360, distance) / 60));
}

export function createParticleCloudVfxGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
  loadout: readonly Wishcraft[],
): Omit<ActiveParticleCloudGraphic, "bornAtSeconds"> | undefined {
  if (!shouldCreateParticleCloudVfx(event) || event.kind !== "wishcraft-hit") {
    return undefined;
  }
  const dx = event.position.x - event.origin.x;
  const dy = event.position.y - event.origin.y;
  const distance = Math.hypot(dx, dy);
  const palette = paletteForWishcraftFeedback(event, loadout);
  const motif = motifForTheme(themeIdForWishcraftFeedback(event, loadout));
  const graphic = new Graphics();
  const count = particleCloudParticleCount(event);
  const radius = particleCloudRadius({
    distance,
    visualKind: event.visualKind,
  });
  drawParticleCloud(graphic, {
    count,
    distance,
    motif,
    palette,
    radius,
    visualKind: event.visualKind,
  });
  return {
    driftX: dx === 0 && dy === 0 ? 0 : (dx / Math.max(1, distance)) * 10,
    driftY: dx === 0 && dy === 0 ? 0 : (dy / Math.max(1, distance)) * 10,
    graphic,
    origin: particleCloudOrigin(event),
    rotation: Math.atan2(dy, dx),
    ttlSeconds: event.visualKind === "beam" ? 0.86 : event.visualKind === "area" ? 0.74 : 0.64,
  };
}

export function particleCloudProgress(options: {
  bornAtSeconds: number;
  nowSeconds: number;
  ttlSeconds: number;
}): number {
  const age = Math.max(0, options.nowSeconds - options.bornAtSeconds);
  return Math.min(1, age / options.ttlSeconds);
}

export function updateParticleCloudVfxGraphic(
  cloud: ActiveParticleCloudGraphic,
  progress: number,
): void {
  cloud.graphic.position.set(
    cloud.origin.x + cloud.driftX * progress,
    cloud.origin.y + cloud.driftY * progress,
  );
  cloud.graphic.rotation = cloud.rotation + progress * 0.18;
  cloud.graphic.alpha = 0.82 * (1 - progress * progress);
  const scale = 0.9 + progress * 0.7;
  cloud.graphic.scale.set(scale);
}

function particleCloudOrigin(event: Extract<CombatFeedback, { kind: "wishcraft-hit" }>): Point {
  if (event.visualKind === "area" || event.visualKind === "burst" || event.visualKind === "trigger" || event.visualKind === "melee") {
    return { ...event.position };
  }
  return {
    x: (event.origin.x + event.position.x) * 0.5,
    y: (event.origin.y + event.position.y) * 0.5,
  };
}

function particleCloudRadius(options: {
  distance: number;
  visualKind: string;
}): number {
  if (options.visualKind === "area") {
    return 76;
  }
  if (options.visualKind === "burst" || options.visualKind === "trigger") {
    return 58;
  }
  if (options.visualKind === "beam") {
    return Math.min(220, Math.max(82, options.distance * 0.34));
  }
  return Math.min(118, Math.max(42, options.distance * 0.22));
}

function drawParticleCloud(
  graphic: PixiGraphics,
  options: {
    count: number;
    distance: number;
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    radius: number;
    visualKind: string;
  },
): void {
  drawPixelGlow(graphic, 0, 0, options.radius * 0.62, options.palette.color, 0.08);
  for (let index = 0; index < options.count; index += 1) {
    const t = index / Math.max(1, options.count - 1);
    const angle = index * 2.399 + motifAngleOffset(options.motif);
    const lane = options.visualKind === "beam"
      ? {
          x: -options.radius * 0.85 + t * options.radius * 1.7,
          y: Math.sin(t * Math.PI * 5) * 18 + ((index % 3) - 1) * 8,
        }
      : {
          x: Math.cos(angle) * options.radius * (0.22 + (index % 5) * 0.14),
          y: Math.sin(angle) * options.radius * (0.22 + (index % 5) * 0.14),
        };
    drawCloudParticle(graphic, {
      alpha: 0.28 + (index % 4) * 0.045,
      motif: options.motif,
      palette: options.palette,
      size: 3 + (index % 5),
      x: lane.x,
      y: lane.y,
    });
  }
  if (options.visualKind === "area" || options.visualKind === "burst" || options.visualKind === "trigger") {
    for (let ring = 0; ring < 3; ring += 1) {
      graphic.circle(0, 0, options.radius * (0.42 + ring * 0.22)).stroke({
        color: ring % 2 === 0 ? options.palette.color : options.palette.accent,
        width: ring === 0 ? 2 : 1,
        alpha: 0.18 - ring * 0.035,
      });
    }
  }
}

function drawCloudParticle(
  graphic: PixiGraphics,
  options: {
    alpha: number;
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
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
    drawGearShard(graphic, options.x, options.y, options.size * 0.75, options.palette.accent, options.alpha);
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
  if (options.motif === "plasma-storm") {
    graphic
      .moveTo(options.x - options.size, options.y)
      .lineTo(options.x, options.y - options.size * 1.3)
      .lineTo(options.x + options.size, options.y + options.size * 0.7)
      .stroke({ color: options.palette.accent, width: 2, alpha: options.alpha });
    return;
  }
  if (options.motif === "neon" || options.motif === "shield-angel" || options.motif === "music-quantum") {
    graphic
      .rect(options.x - options.size * 0.5, options.y - options.size * 0.5, options.size, options.size)
      .fill({ color: options.motif === "neon" ? options.palette.color : options.palette.accent, alpha: options.alpha })
      .rect(options.x - options.size * 0.2, options.y - options.size * 0.2, options.size * 0.4, options.size * 0.4)
      .fill({ color: options.palette.accent, alpha: options.alpha * 0.72 });
    return;
  }
  graphic
    .circle(options.x, options.y, Math.max(2, options.size * 0.56))
    .stroke({ color: options.palette.accent, width: 1, alpha: options.alpha })
    .circle(options.x, options.y, Math.max(1, options.size * 0.24))
    .fill({ color: options.palette.color, alpha: options.alpha * 0.82 });
}

function motifAngleOffset(motif: WishcraftThemeMotif): number {
  const offsets: Record<WishcraftThemeMotif, number> = {
    "blade-metal": 0.5,
    celestial: 0,
    clockwork: 0.9,
    "crystal-frost": 0.3,
    "dragon-demon": 0.72,
    meteor: 1.1,
    "music-quantum": 1.4,
    neon: 1.7,
    ocean: 0.2,
    "plasma-storm": 0.44,
    "shield-angel": 0.66,
    "swarm-forest": 1.22,
    "void-gravity": 0.88,
  };
  return offsets[motif];
}
