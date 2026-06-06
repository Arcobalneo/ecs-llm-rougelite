import type { ThemeId } from "../../shared/wishcraft/types.js";
import {
  drawGearShard,
  drawOutlinedPoly,
  drawStarSpark,
} from "./pixel-primitives.js";
import type { WishcraftVfxPalette } from "./wishcraft-vfx-palette.js";

type PixiGraphics = import("pixi.js").Graphics;

export type WishcraftThemeMotif =
  | "celestial"
  | "void-gravity"
  | "plasma-storm"
  | "crystal-frost"
  | "dragon-demon"
  | "music-quantum"
  | "blade-metal"
  | "shield-angel"
  | "swarm-forest"
  | "clockwork"
  | "ocean"
  | "neon"
  | "meteor";

const motifByTheme: Record<ThemeId, WishcraftThemeMotif> = {
  angel: "shield-angel",
  blade: "blade-metal",
  clockwork: "clockwork",
  crystal: "crystal-frost",
  demon: "dragon-demon",
  dragon: "dragon-demon",
  forest: "swarm-forest",
  frost: "crystal-frost",
  gravity: "void-gravity",
  lunar: "celestial",
  magnetic: "blade-metal",
  meteor: "meteor",
  music: "music-quantum",
  neon: "neon",
  ocean: "ocean",
  plasma: "plasma-storm",
  quantum: "music-quantum",
  shield: "shield-angel",
  solar: "celestial",
  starfire: "celestial",
  storm: "plasma-storm",
  swarm: "swarm-forest",
  thunder: "plasma-storm",
  void: "void-gravity",
};

export function motifForTheme(themeId: string | undefined): WishcraftThemeMotif {
  if (!themeId || !(themeId in motifByTheme)) {
    return "neon";
  }
  return motifByTheme[themeId as ThemeId];
}

export function knownWishcraftThemeMotifCount(): number {
  return Object.keys(motifByTheme).length;
}

export function drawThemeProjectileMotif(
  graphic: PixiGraphics,
  options: {
    length: number;
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    visualKind: string;
  },
): void {
  switch (options.motif) {
    case "celestial":
      drawCelestialProjectile(graphic, options);
      return;
    case "void-gravity":
      drawVoidGravityProjectile(graphic, options);
      return;
    case "plasma-storm":
      drawPlasmaStormProjectile(graphic, options);
      return;
    case "crystal-frost":
      drawCrystalFrostProjectile(graphic, options);
      return;
    case "dragon-demon":
      drawDragonDemonProjectile(graphic, options);
      return;
    case "music-quantum":
      drawMusicQuantumProjectile(graphic, options);
      return;
    case "blade-metal":
      drawBladeMetalProjectile(graphic, options);
      return;
    case "shield-angel":
      drawShieldAngelProjectile(graphic, options);
      return;
    case "swarm-forest":
      drawSwarmForestProjectile(graphic, options);
      return;
    case "clockwork":
      drawClockworkProjectile(graphic, options);
      return;
    case "ocean":
      drawOceanProjectile(graphic, options);
      return;
    case "meteor":
      drawMeteorProjectile(graphic, options);
      return;
    case "neon":
      drawNeonProjectile(graphic, options);
      return;
  }
}

export function drawThemeLaunchMotif(
  graphic: PixiGraphics,
  options: {
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    radius: number;
  },
): void {
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const radius = options.radius * (0.45 + (index % 3) * 0.16);
    drawMotifParticle(graphic, {
      alpha: 0.3 + (index % 2) * 0.1,
      motif: options.motif,
      palette: options.palette,
      size: 5 + (index % 3) * 2,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  if (options.motif === "shield-angel" || options.motif === "music-quantum") {
    for (let ring = 0; ring < 3; ring += 1) {
      graphic.circle(0, 0, options.radius * (0.42 + ring * 0.22)).stroke({
        color: ring % 2 === 0 ? options.palette.accent : options.palette.color,
        width: 1,
        alpha: 0.22 - ring * 0.04,
      });
    }
  }
}

export function drawThemeTrailMotif(
  graphic: PixiGraphics,
  options: {
    length: number;
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
  },
): void {
  const count = options.motif === "neon" || options.motif === "music-quantum" ? 13 : 9;
  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1);
    const x = -options.length * 0.46 + t * options.length * 0.92;
    const amplitude = options.motif === "void-gravity" ? 18 : options.motif === "plasma-storm" ? 15 : 11;
    const y = Math.sin(t * Math.PI * 3.4) * amplitude;
    drawMotifParticle(graphic, {
      alpha: 0.18 + (index % 3) * 0.04,
      motif: options.motif,
      palette: options.palette,
      size: 4 + (index % 4),
      x,
      y,
    });
  }
}

export function drawThemeImpactMotif(
  graphic: PixiGraphics,
  options: {
    motif: WishcraftThemeMotif;
    palette: WishcraftVfxPalette;
    radius: number;
    visualKind: string;
  },
): void {
  const count = options.visualKind === "area" || options.visualKind === "burst" ? 16 : 10;
  for (let index = 0; index < count; index += 1) {
    const angle = index * 2.399;
    const distance = options.radius * (0.22 + (index % 5) * 0.12);
    drawMotifParticle(graphic, {
      alpha: 0.34 + (index % 2) * 0.12,
      motif: options.motif,
      palette: options.palette,
      size: 5 + (index % 4),
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    });
  }
  if (options.motif === "void-gravity" || options.motif === "ocean") {
    for (let ring = 0; ring < 3; ring += 1) {
      graphic.circle(0, 0, options.radius * (0.38 + ring * 0.22)).stroke({
        color: ring % 2 === 0 ? options.palette.color : options.palette.accent,
        width: ring === 0 ? 2 : 1,
        alpha: 0.2 - ring * 0.04,
      });
    }
  }
}

function drawCelestialProjectile(
  graphic: PixiGraphics,
  options: { length: number; palette: WishcraftVfxPalette },
): void {
  for (let index = 0; index < 6; index += 1) {
    drawStarSpark(
      graphic,
      -options.length * 0.34 + index * options.length * 0.13,
      index % 2 === 0 ? -14 : 14,
      options.palette.accent,
      0.42,
    );
  }
}

function drawVoidGravityProjectile(
  graphic: PixiGraphics,
  options: { length: number; palette: WishcraftVfxPalette },
): void {
  for (let index = 0; index < 5; index += 1) {
    const x = -options.length * 0.34 + index * options.length * 0.17;
    graphic
      .circle(x, 0, 15 + index * 2)
      .stroke({ color: index % 2 === 0 ? options.palette.accent : options.palette.color, width: 1, alpha: 0.22 })
      .circle(x, 0, 4 + (index % 2) * 2)
      .fill({ color: 0x020612, alpha: 0.48 });
  }
}

function drawPlasmaStormProjectile(
  graphic: PixiGraphics,
  options: { length: number; palette: WishcraftVfxPalette },
): void {
  graphic
    .moveTo(-options.length * 0.42, -4)
    .lineTo(-options.length * 0.18, 14)
    .lineTo(options.length * 0.03, -12)
    .lineTo(options.length * 0.23, 10)
    .lineTo(options.length * 0.43, -3)
    .stroke({ color: options.palette.accent, width: 3, alpha: 0.46 });
}

function drawCrystalFrostProjectile(
  graphic: PixiGraphics,
  options: { length: number; palette: WishcraftVfxPalette },
): void {
  for (let index = 0; index < 6; index += 1) {
    const x = -options.length * 0.33 + index * options.length * 0.13;
    drawOutlinedPoly(graphic, [x, -10, x + 9, 0, x, 10, x - 9, 0], options.palette.accent, 0x020612, 0.44);
  }
}

function drawDragonDemonProjectile(
  graphic: PixiGraphics,
  options: { length: number; palette: WishcraftVfxPalette },
): void {
  for (let index = 0; index < 7; index += 1) {
    const x = -options.length * 0.38 + index * options.length * 0.12;
    const y = index % 2 === 0 ? -13 : 13;
    drawOutlinedPoly(graphic, [x - 9, y, x, y - 8, x + 12, y, x, y + 8], options.palette.color, 0x020612, 0.42);
  }
}

function drawMusicQuantumProjectile(
  graphic: PixiGraphics,
  options: { length: number; palette: WishcraftVfxPalette },
): void {
  for (let line = 0; line < 4; line += 1) {
    graphic
      .moveTo(-options.length * 0.42, -15 + line * 10)
      .lineTo(options.length * 0.42, -15 + line * 10 + Math.sin(line) * 4)
      .stroke({ color: line % 2 === 0 ? options.palette.accent : options.palette.color, width: 1, alpha: 0.26 });
  }
}

function drawBladeMetalProjectile(
  graphic: PixiGraphics,
  options: { length: number; palette: WishcraftVfxPalette },
): void {
  drawOutlinedPoly(
    graphic,
    [-options.length * 0.36, -3, options.length * 0.22, -13, options.length * 0.48, 0, options.length * 0.22, 13, -options.length * 0.36, 3],
    options.palette.accent,
    0x020612,
    0.34,
  );
}

function drawShieldAngelProjectile(
  graphic: PixiGraphics,
  options: { length: number; palette: WishcraftVfxPalette },
): void {
  for (let index = 0; index < 5; index += 1) {
    const x = -options.length * 0.3 + index * options.length * 0.15;
    graphic
      .rect(x - 7, -7, 14, 14)
      .stroke({ color: index % 2 === 0 ? options.palette.accent : options.palette.color, width: 1, alpha: 0.36 });
  }
}

function drawSwarmForestProjectile(
  graphic: PixiGraphics,
  options: { length: number; palette: WishcraftVfxPalette },
): void {
  for (let index = 0; index < 9; index += 1) {
    const x = -options.length * 0.4 + index * options.length * 0.1;
    const y = Math.sin(index * 1.7) * 13;
    graphic
      .circle(x, y, 4)
      .stroke({ color: index % 2 === 0 ? options.palette.color : options.palette.accent, width: 1, alpha: 0.48 });
  }
}

function drawClockworkProjectile(
  graphic: PixiGraphics,
  options: { length: number; palette: WishcraftVfxPalette },
): void {
  for (let index = 0; index < 5; index += 1) {
    drawGearShard(graphic, -options.length * 0.31 + index * options.length * 0.16, index % 2 === 0 ? -10 : 10, 6, options.palette.accent, 0.42);
  }
}

function drawOceanProjectile(
  graphic: PixiGraphics,
  options: { length: number; palette: WishcraftVfxPalette },
): void {
  for (let index = 0; index < 6; index += 1) {
    const t = index / 5;
    graphic
      .circle(-options.length * 0.38 + t * options.length * 0.76, Math.sin(t * Math.PI * 2) * 12, 5 + (index % 2))
      .stroke({ color: index % 2 === 0 ? options.palette.accent : options.palette.color, width: 1, alpha: 0.34 });
  }
}

function drawMeteorProjectile(
  graphic: PixiGraphics,
  options: { length: number; palette: WishcraftVfxPalette },
): void {
  for (let index = 0; index < 8; index += 1) {
    drawOutlinedPoly(
      graphic,
      [
        -options.length * 0.46 + index * options.length * 0.1,
        index % 2 === 0 ? -12 : 12,
        -options.length * 0.41 + index * options.length * 0.1,
        index % 2 === 0 ? -3 : 3,
        -options.length * 0.51 + index * options.length * 0.1,
        index % 2 === 0 ? -2 : 2,
      ],
      options.palette.color,
      0x020612,
      0.36,
    );
  }
}

function drawNeonProjectile(
  graphic: PixiGraphics,
  options: { length: number; palette: WishcraftVfxPalette },
): void {
  for (let index = 0; index < 9; index += 1) {
    graphic
      .rect(-options.length * 0.42 + index * options.length * 0.1, index % 2 === 0 ? -15 : 11, 12, 4)
      .fill({ color: index % 2 === 0 ? options.palette.color : options.palette.accent, alpha: 0.38 });
  }
}

function drawMotifParticle(
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
  if (options.motif === "celestial") {
    drawStarSpark(graphic, options.x, options.y, options.palette.accent, options.alpha);
    return;
  }
  if (options.motif === "clockwork") {
    drawGearShard(graphic, options.x, options.y, options.size * 0.65, options.palette.accent, options.alpha);
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
  if (options.motif === "shield-angel" || options.motif === "neon") {
    graphic
      .rect(options.x - options.size * 0.5, options.y - options.size * 0.5, options.size, options.size)
      .stroke({ color: options.palette.accent, width: 1, alpha: options.alpha });
    return;
  }
  if (options.motif === "plasma-storm") {
    graphic
      .moveTo(options.x - options.size, options.y + options.size * 0.35)
      .lineTo(options.x, options.y - options.size)
      .lineTo(options.x + options.size, options.y + options.size * 0.25)
      .stroke({ color: options.palette.accent, width: 2, alpha: options.alpha });
    return;
  }
  graphic
    .circle(options.x, options.y, Math.max(2, options.size * 0.5))
    .stroke({ color: options.palette.accent, width: 1, alpha: options.alpha })
    .circle(options.x, options.y, Math.max(1, options.size * 0.22))
    .fill({ color: options.palette.color, alpha: options.alpha * 0.8 });
}
