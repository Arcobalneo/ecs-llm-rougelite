import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";
import type { Point } from "../simulation/arena-math.js";
import {
  drawGearShard,
  drawOutlinedPoly,
  drawOutlinedRect,
  drawStarSpark,
} from "./pixel-primitives.js";
import {
  paletteForWishcraftFeedback,
  themeIdForWishcraftFeedback,
  type WishcraftVfxPalette,
} from "./wishcraft-vfx-palette.js";
import {
  drawThemeProjectileMotif,
  motifForTheme,
} from "./wishcraft-theme-motifs.js";
import { drawMechanicProjectileAccent } from "./wishcraft/mechanic-accent-vfx.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface ActiveProjectileGraphic {
  bornAtSeconds: number;
  graphic: PixiGraphics;
  laneOffset: number;
  mode: "beam" | "projectile";
  origin: Point;
  rotation: number;
  target: Point;
  ttlSeconds: number;
}

export function createProjectileVfxGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
  loadout: readonly Wishcraft[],
): Omit<ActiveProjectileGraphic, "bornAtSeconds"> | undefined {
  if (!shouldCreateProjectileVfx(event)) {
    return undefined;
  }
  if (event.kind !== "wishcraft-hit") {
    return undefined;
  }
  const dx = event.position.x - event.origin.x;
  const dy = event.position.y - event.origin.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 24) {
    return undefined;
  }
  const palette = paletteForWishcraftFeedback(event, loadout);
  const themeId = themeIdForWishcraftFeedback(event, loadout);
  const graphic = new Graphics();
  drawProjectileVfxBody(graphic, {
    distance,
    mechanicId: event.mechanicId,
    palette,
    themeId,
    visualKind: event.visualKind,
  });
  const ttlSeconds = event.visualKind === "beam" ? 0.42 : event.visualKind === "missile" ? 0.62 : 0.48;
  return {
    graphic,
    laneOffset: laneOffsetForProjectile(event),
    mode: event.visualKind === "beam" ? "beam" : "projectile",
    origin: { ...event.origin },
    rotation: Math.atan2(dy, dx),
    target: { ...event.position },
    ttlSeconds,
  };
}

export function projectileVfxProgress(options: {
  bornAtSeconds: number;
  nowSeconds: number;
  ttlSeconds: number;
}): number {
  const age = Math.max(0, options.nowSeconds - options.bornAtSeconds);
  return Math.min(1, age / options.ttlSeconds);
}

export function shouldCreateProjectileVfx(event: CombatFeedback): boolean {
  if (event.kind !== "wishcraft-hit") {
    return false;
  }
  if (["area", "burst", "melee", "pickup", "shield", "summon", "trigger"].includes(event.visualKind)) {
    return false;
  }
  return Math.hypot(event.position.x - event.origin.x, event.position.y - event.origin.y) >= 24;
}

export function updateProjectileVfxGraphic(
  projectile: ActiveProjectileGraphic,
  progress: number,
): void {
  const eased = projectile.mode === "beam" ? 0.5 : 1 - (1 - progress) * (1 - progress);
  const x = projectile.origin.x + (projectile.target.x - projectile.origin.x) * eased;
  const y = projectile.origin.y + (projectile.target.y - projectile.origin.y) * eased + projectile.laneOffset * Math.sin(progress * Math.PI);
  projectile.graphic.position.set(x, y);
  projectile.graphic.rotation = projectile.rotation;
  projectile.graphic.alpha = projectile.mode === "beam"
    ? 0.96 - progress * 0.58
    : 1 - progress * progress * 0.82;
  const pulse = projectile.mode === "beam" ? 1 + Math.sin(progress * Math.PI * 5) * 0.035 : 1 + Math.sin(progress * Math.PI) * 0.18;
  projectile.graphic.scale.set(pulse);
}

function drawProjectileVfxBody(
  graphic: PixiGraphics,
  options: {
    distance: number;
    mechanicId: string;
    palette: WishcraftVfxPalette;
    themeId: string | undefined;
    visualKind: string;
  },
): void {
  const length = projectileVfxBodyLength({
    distance: options.distance,
    visualKind: options.visualKind,
  });
  const motif = motifForTheme(options.themeId);
  if (options.visualKind === "beam") {
    drawProjectileLaunchFlash(graphic, -length * 0.5, options.palette, 24);
    graphic
      .rect(-length * 0.5, -16, length, 32)
      .fill({ color: options.palette.color, alpha: 0.16 })
      .rect(-length * 0.5, -9, length, 18)
      .fill({ color: options.palette.accent, alpha: 0.24 })
      .rect(-length * 0.5, -4, length, 8)
      .fill({ color: options.palette.color, alpha: 0.68 })
      .rect(-length * 0.5, -1, length, 2)
      .fill({ color: 0xe8fbff, alpha: 0.8 });
    for (let index = 0; index < 12; index += 1) {
      const x = -length * 0.45 + (index + 1) * (length / 13);
      graphic
        .rect(x - 3, -13, 6, 3)
        .fill({ color: index % 2 === 0 ? options.palette.accent : options.palette.color, alpha: 0.38 })
        .rect(x - 3, 10, 6, 3)
        .fill({ color: index % 2 === 0 ? options.palette.color : options.palette.accent, alpha: 0.32 });
    }
    drawThemeProjectileMotif(graphic, {
      length,
      motif,
      palette: options.palette,
      visualKind: options.visualKind,
    });
    drawThemeLinearMotif(graphic, options.palette, options.themeId, length, 0.72);
    drawMechanicProjectileAccent(graphic, {
      length,
      mechanicId: options.mechanicId,
      motif,
      palette: options.palette,
      visualKind: options.visualKind,
    });
    drawBeamEndCap(graphic, length * 0.5, options.palette, options.themeId);
    return;
  }

  drawProjectileLaunchFlash(graphic, -length * 0.42, options.palette, options.visualKind === "missile" ? 24 : 18);
  drawProjectileAfterimages(graphic, length, options.palette, options.themeId, options.visualKind);
  if (options.visualKind === "scatter") {
    for (const offset of [-18, -8, 4, 16]) {
      graphic
        .moveTo(-length * 0.46, offset)
        .lineTo(length * 0.22, offset * 0.32)
        .stroke({ color: offset === 0 ? options.palette.accent : options.palette.color, width: offset === 0 ? 3 : 2, alpha: 0.58 });
      drawProjectilePellet(graphic, length * 0.27, offset * 0.28, options.palette, offset === 0 ? 6 : 4);
    }
  } else if (options.visualKind === "missile") {
    graphic
      .poly([-length * 0.34, -8, length * 0.18, -12, length * 0.42, 0, length * 0.18, 12, -length * 0.34, 8])
      .fill({ color: 0x020612, alpha: 0.88 })
      .poly([-length * 0.27, -5, length * 0.15, -8, length * 0.33, 0, length * 0.15, 8, -length * 0.27, 5])
      .fill({ color: options.palette.color, alpha: 0.8 })
      .poly([-length * 0.43, -11, -length * 0.28, 0, -length * 0.43, 11])
      .fill({ color: options.palette.accent, alpha: 0.5 })
      .rect(length * 0.02, -2, length * 0.23, 4)
      .fill({ color: 0xe8fbff, alpha: 0.54 });
    drawMissileExhaust(graphic, -length * 0.44, options.palette, options.themeId);
    drawThemeLinearMotif(graphic, options.palette, options.themeId, length * 0.76, 0.46);
  } else if (options.mechanicId.includes("spiral")) {
    for (let index = 0; index < 10; index += 1) {
      const t = index / 9;
      const x = -length * 0.42 + t * length * 0.84;
      const y = Math.sin(t * Math.PI * 3) * 16;
      graphic
        .circle(x, y, 5 + (index % 3))
        .fill({ color: index % 2 === 0 ? options.palette.color : options.palette.accent, alpha: 0.62 })
        .circle(x, -y * 0.75, 3 + (index % 2))
        .fill({ color: index % 2 === 0 ? options.palette.accent : options.palette.color, alpha: 0.42 });
    }
    drawOutlinedPoly(
      graphic,
      [-length * 0.22, -8, length * 0.24, -8, length * 0.42, 0, length * 0.24, 8, -length * 0.22, 8],
      options.palette.color,
      0x020612,
      0.7,
    );
  } else if (options.visualKind === "ricochet") {
    const midX = -length * 0.04;
    graphic
      .moveTo(-length * 0.46, 13)
      .lineTo(midX, -16)
      .lineTo(length * 0.38, 2)
      .stroke({ color: options.palette.color, width: 5, alpha: 0.46 })
      .moveTo(-length * 0.34, 8)
      .lineTo(midX, -10)
      .lineTo(length * 0.27, 0)
      .stroke({ color: options.palette.accent, width: 2, alpha: 0.76 });
    drawOutlinedRect(graphic, midX - 5, -15, 10, 10, options.palette.accent, 0x020612, 0.72);
  } else {
    drawOutlinedPoly(
      graphic,
      [-length * 0.42, -8, length * 0.2, -8, length * 0.46, 0, length * 0.2, 8, -length * 0.42, 8],
      options.palette.color,
      0x020612,
      0.76,
    );
    graphic
      .moveTo(-length * 0.32, 0)
      .lineTo(length * 0.38, 0)
      .stroke({ color: options.palette.accent, width: 3, alpha: 0.82 })
      .moveTo(-length * 0.52, -5)
      .lineTo(-length * 0.16, -5)
      .stroke({ color: options.palette.color, width: 2, alpha: 0.38 })
      .moveTo(-length * 0.52, 5)
      .lineTo(-length * 0.16, 5)
      .stroke({ color: options.palette.accent, width: 2, alpha: 0.34 });
    drawStarSpark(graphic, length * 0.46, 0, options.palette.accent, 0.58);
  }
  drawThemeProjectileMotif(graphic, {
    length,
    motif,
    palette: options.palette,
    visualKind: options.visualKind,
  });
  drawThemeLinearMotif(graphic, options.palette, options.themeId, length, 0.5);
  drawMechanicProjectileAccent(graphic, {
    length,
    mechanicId: options.mechanicId,
    motif,
    palette: options.palette,
    visualKind: options.visualKind,
  });
}

export function projectileVfxBodyLength(options: {
  distance: number;
  visualKind: string;
}): number {
  return options.visualKind === "beam"
    ? Math.min(860, Math.max(80, options.distance))
    : Math.min(260, Math.max(72, options.distance * 0.45));
}

function drawProjectileAfterimages(
  graphic: PixiGraphics,
  length: number,
  palette: WishcraftVfxPalette,
  themeId: string | undefined,
  visualKind: string,
): void {
  const count = visualKind === "missile" ? 6 : visualKind === "scatter" ? 4 : 5;
  for (let index = 0; index < count; index += 1) {
    const x = -length * 0.5 - index * 12;
    const width = Math.max(10, length * (0.2 - index * 0.018));
    const y = (index % 2 === 0 ? -1 : 1) * (4 + index * 2);
    graphic
      .rect(x, y - 2, width, 4)
      .fill({ color: index % 2 === 0 ? palette.color : palette.accent, alpha: 0.22 - index * 0.02 });
  }
  if (themeId === "neon" || themeId === "quantum") {
    for (let index = 0; index < 6; index += 1) {
      graphic
        .rect(-length * 0.52 - index * 9, -13 + (index % 3) * 11, 7, 4)
        .fill({ color: index % 2 === 0 ? palette.accent : palette.color, alpha: 0.3 });
    }
  }
}

function drawMissileExhaust(
  graphic: PixiGraphics,
  x: number,
  palette: WishcraftVfxPalette,
  themeId: string | undefined,
): void {
  graphic
    .poly([x, -14, x - 48, 0, x, 14])
    .fill({ color: palette.color, alpha: 0.18 })
    .poly([x - 3, -8, x - 32, 0, x - 3, 8])
    .fill({ color: palette.accent, alpha: 0.32 });
  if (themeId === "meteor" || themeId === "starfire" || themeId === "dragon") {
    for (let index = 0; index < 7; index += 1) {
      drawStarSpark(graphic, x - 12 - index * 6, (index % 2 === 0 ? -1 : 1) * (6 + index), palette.accent, 0.32);
    }
  }
}

function drawBeamEndCap(
  graphic: PixiGraphics,
  x: number,
  palette: WishcraftVfxPalette,
  themeId: string | undefined,
): void {
  graphic
    .circle(x, 0, 24)
    .fill({ color: palette.color, alpha: 0.16 })
    .circle(x, 0, 17)
    .stroke({ color: palette.accent, width: 3, alpha: 0.54 })
    .rect(x - 2, -19, 4, 38)
    .fill({ color: 0xe8fbff, alpha: 0.24 });
  if (themeId === "crystal" || themeId === "frost") {
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2;
      drawOutlinedPoly(
        graphic,
        [
          x + Math.cos(angle) * 18,
          Math.sin(angle) * 18 - 6,
          x + Math.cos(angle) * 29,
          Math.sin(angle) * 29,
          x + Math.cos(angle) * 18,
          Math.sin(angle) * 18 + 6,
        ],
        palette.accent,
        0x020612,
        0.42,
      );
    }
  }
}

function drawProjectileLaunchFlash(
  graphic: PixiGraphics,
  x: number,
  palette: WishcraftVfxPalette,
  radius: number,
): void {
  graphic
    .circle(x, 0, radius)
    .fill({ color: palette.color, alpha: 0.11 })
    .circle(x, 0, radius * 0.58)
    .stroke({ color: palette.accent, width: 2, alpha: 0.42 })
    .rect(x - 3, -radius * 0.7, 6, radius * 1.4)
    .fill({ color: 0xe8fbff, alpha: 0.18 });
}

function drawProjectilePellet(
  graphic: PixiGraphics,
  x: number,
  y: number,
  palette: WishcraftVfxPalette,
  radius: number,
): void {
  graphic
    .circle(x, y, radius + 2)
    .fill({ color: 0x020612, alpha: 0.76 })
    .circle(x, y, radius)
    .fill({ color: palette.color, alpha: 0.82 })
    .circle(x, y, Math.max(2, radius * 0.45))
    .fill({ color: palette.accent, alpha: 0.72 });
}

function drawThemeLinearMotif(
  graphic: PixiGraphics,
  palette: WishcraftVfxPalette,
  themeId: string | undefined,
  length: number,
  alpha: number,
): void {
  if (themeId === "thunder" || themeId === "storm") {
    graphic
      .moveTo(-length * 0.42, 0)
      .lineTo(-length * 0.16, -12)
      .lineTo(length * 0.06, 8)
      .lineTo(length * 0.32, -5)
      .stroke({ color: palette.accent, width: 2, alpha });
    return;
  }
  if (themeId === "gravity" || themeId === "void") {
    for (let index = 0; index < 3; index += 1) {
      const x = -length * 0.18 + index * length * 0.18;
      graphic.circle(x, 0, 12 + index * 3).stroke({ color: index % 2 === 0 ? palette.accent : palette.color, width: 1, alpha: alpha * 0.55 });
    }
    return;
  }
  if (themeId === "clockwork") {
    for (let index = 0; index < 3; index += 1) {
      drawGearShard(graphic, -length * 0.22 + index * length * 0.2, index % 2 === 0 ? -9 : 9, 6, palette.accent, alpha * 0.62);
    }
    return;
  }
  if (themeId === "crystal" || themeId === "frost") {
    for (let index = 0; index < 4; index += 1) {
      const x = -length * 0.3 + index * length * 0.18;
      drawOutlinedPoly(graphic, [x, -7, x + 6, 0, x, 7, x - 6, 0], palette.accent, 0x020612, alpha * 0.52);
    }
    return;
  }
  if (themeId === "neon" || themeId === "quantum") {
    for (let index = 0; index < 5; index += 1) {
      graphic
        .rect(-length * 0.35 + index * length * 0.16, index % 2 === 0 ? -11 : 8, 14, 3)
        .fill({ color: index % 2 === 0 ? palette.color : palette.accent, alpha: alpha * 0.58 });
    }
  }
}

function laneOffsetForProjectile(event: Extract<CombatFeedback, { kind: "wishcraft-hit" }>): number {
  const seed = [...event.wishcraftId, event.visualKind, event.mechanicId]
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ((seed % 5) - 2) * 5;
}
