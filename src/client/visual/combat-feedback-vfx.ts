import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";
import {
  drawMicroPixelDebris,
  drawOutlinedPoly,
  drawPixelGlow,
  drawStarSpark,
  drawThemeResidue,
} from "./pixel-primitives.js";
import {
  paletteForWishcraftFeedback,
  themeIdForWishcraftFeedback,
} from "./wishcraft-vfx-palette.js";
import {
  drawThemeImpactMotif,
  motifForTheme,
} from "./wishcraft-theme-motifs.js";
import { createCommonEnemyHitVfxGraphic } from "./common-enemy-hit-vfx.js";
import { createEnemyDeathVfxGraphic } from "./enemy-death-vfx.js";
import { drawMechanicImpactAccent } from "./wishcraft/mechanic-accent-vfx.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export function createFeedbackGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
  loadout: readonly Wishcraft[],
): { graphic: PixiGraphics; ttlSeconds: number } | undefined {
  const commonEnemyHit = createCommonEnemyHitVfxGraphic(event, Graphics, loadout);
  if (commonEnemyHit) {
    return commonEnemyHit;
  }

  if (event.kind === "impact") {
    const graphic = new Graphics();
    if (event.visualKind === "machine-gun" && event.origin) {
      const dx = event.origin.x - event.position.x;
      const dy = event.origin.y - event.position.y;
      const length = Math.hypot(dx, dy);
      const unit = length > 0 ? { x: dx / length, y: dy / length } : { x: -1, y: 0 };
      const tail = Math.min(130, Math.max(40, length * 0.36));
      graphic
        .moveTo(unit.x * tail, unit.y * tail)
        .lineTo(0, 0)
        .stroke({ color: 0x44f5ff, width: 3, alpha: 0.46 })
        .moveTo(unit.x * tail * 0.42, unit.y * tail * 0.42)
        .lineTo(0, 0)
        .stroke({ color: 0xe8fbff, width: 1, alpha: 0.78 });
      drawSparkBurst(graphic, { accent: 0xe8fbff, color: 0x44f5ff, radius: 13, spokes: 5 });
    } else if (event.visualKind === "laser-sword") {
      graphic
        .arc(0, 0, 34, -1.1, 1.05)
        .stroke({ color: 0xe8fbff, width: 6, alpha: 0.72 })
        .arc(0, 0, 44, -0.95, 0.88)
        .stroke({ color: 0xff4fd8, width: 2, alpha: 0.56 })
        .poly([18, -28, 50, -9, 20, 11])
        .fill({ color: 0x44f5ff, alpha: 0.22 });
    } else {
      drawSparkBurst(graphic, { accent: 0xe8fbff, color: 0x44f5ff, radius: 20, spokes: 7 });
    }
    graphic.position.set(event.position.x, event.position.y);
    return { graphic, ttlSeconds: event.visualKind === "laser-sword" ? 0.3 : 0.24 };
  }
  if (event.kind === "wishcraft-hit") {
    const palette = paletteForWishcraftFeedback(event, loadout);
    const color = palette.color;
    const accent = palette.accent;
    const themeId = themeIdForWishcraftFeedback(event, loadout);
    const motif = motifForTheme(themeId);
    const graphic = new Graphics();
    if (event.visualKind === "beam") {
      graphic
        .rect(-44, -5, 88, 10)
        .fill({ color, alpha: 0.34 })
        .rect(-56, -2, 112, 4)
        .fill({ color: accent, alpha: 0.72 })
        .circle(0, 0, 24)
        .stroke({ color, width: 2, alpha: 0.48 });
    } else if (event.visualKind === "missile") {
      graphic
        .poly([-26, 0, 10, -13, 28, 0, 10, 13])
        .fill({ color, alpha: 0.76 })
        .poly([-32, -8, -16, 0, -32, 8])
        .fill({ color: accent, alpha: 0.56 });
      drawSparkBurst(graphic, { accent, color, radius: 28, spokes: 9 });
    } else if (event.visualKind === "scatter") {
      for (let index = 0; index < 7; index += 1) {
        const angle = index * 0.92;
        const distance = 7 + (index % 3) * 8;
        graphic
          .circle(Math.cos(angle) * distance, Math.sin(angle) * distance, 3 + (index % 2) * 2)
          .fill({ color: index % 2 === 0 ? color : accent, alpha: 0.78 });
      }
      graphic.circle(0, 0, 28).stroke({ color, width: 1, alpha: 0.26 });
    } else if (event.visualKind === "ricochet") {
      graphic
        .moveTo(-30, 18)
        .lineTo(-6, -16)
        .lineTo(18, 12)
        .lineTo(36, -10)
        .stroke({ color, width: 4, alpha: 0.82 })
        .moveTo(-20, 13)
        .lineTo(0, -9)
        .lineTo(21, 7)
        .stroke({ color: accent, width: 2, alpha: 0.72 });
    } else if (event.visualKind === "burst" || event.visualKind === "area") {
      drawLayeredNova(graphic, { accent, color, radius: event.visualKind === "area" ? 62 : 42, themeId });
      graphic
        .circle(0, 0, event.visualKind === "area" ? 46 : 34)
        .stroke({ color, width: 4, alpha: 0.56 })
        .circle(0, 0, event.visualKind === "area" ? 66 : 48)
        .stroke({ color: accent, width: 1, alpha: 0.24 });
    } else if (event.visualKind === "melee") {
      graphic
        .arc(0, 0, 38, -0.95, 1.05)
        .stroke({ color, width: 7, alpha: 0.76 })
        .arc(0, 0, 27, -0.82, 0.9)
        .stroke({ color: accent, width: 3, alpha: 0.78 })
        .poly([22, -27, 54, -9, 25, 8])
        .fill({ color: accent, alpha: 0.34 });
      drawMeleeAfterimageFan(graphic, { accent, color, themeId });
    } else if (event.visualKind === "summon") {
      graphic
        .circle(0, 0, 17)
        .stroke({ color, width: 3, alpha: 0.74 })
        .circle(0, 0, 29)
        .stroke({ color: accent, width: 2, alpha: 0.42 });
      drawSparkBurst(graphic, { accent, color, radius: 24, spokes: 6 });
    } else {
      graphic
        .moveTo(-28, 0)
        .lineTo(28, 0)
        .stroke({ color, width: 6, alpha: 0.76 })
        .moveTo(2, -13)
        .lineTo(35, 0)
        .lineTo(2, 13)
        .stroke({ color: accent, width: 2, alpha: 0.72 });
      if (event.visualKind === "trigger") {
        drawTriggerSigil(graphic, { accent, color, themeId });
      }
    }
    drawThemeResidue(graphic, event.visualKind, { accent, color });
    drawWishcraftImpactDebris(graphic, event.visualKind, { accent, color }, themeId);
    drawMechanicImpactAccent(graphic, {
      mechanicId: event.mechanicId,
      motif,
      palette,
      radius: event.visualKind === "area" || event.visualKind === "burst" ? 68 : 42,
      visualKind: event.visualKind,
    });
    drawThemeImpactMotif(graphic, {
      motif,
      palette,
      radius: event.visualKind === "area" || event.visualKind === "burst" ? 68 : 42,
      visualKind: event.visualKind,
    });
    graphic.position.set(event.position.x, event.position.y);
    return { graphic, ttlSeconds: ttlForVisualKind(event.visualKind) };
  }
  if (event.kind === "wishcraft-shield") {
    const graphic = new Graphics()
      .circle(0, 0, 42)
      .stroke({ color: 0x62ff9d, width: 4, alpha: 0.58 })
      .circle(0, 0, 58)
      .stroke({ color: 0xe8fbff, width: 1, alpha: 0.26 });
    drawSparkBurst(graphic, { accent: 0xe8fbff, color: 0x62ff9d, radius: 42, spokes: 10 });
    graphic.position.set(event.position.x, event.position.y);
    return { graphic, ttlSeconds: 0.42 };
  }
  if (event.kind === "wishcraft-summon") {
    const graphic = new Graphics()
      .circle(0, 0, 15)
      .fill({ color: 0xfff6d6, alpha: 0.64 })
      .circle(0, 0, 27)
      .stroke({ color: 0x7ddfff, width: 3, alpha: 0.55 })
      .circle(0, 0, 42)
      .stroke({ color: 0xff4fd8, width: 1, alpha: 0.24 });
    graphic.position.set(event.position.x, event.position.y);
    return { graphic, ttlSeconds: 0.45 };
  }
  if (event.kind === "enemy-death") {
    return createEnemyDeathVfxGraphic(event, Graphics, loadout);
  }
  if (event.kind === "xp-collect") {
    const graphic = new Graphics()
      .circle(0, 0, 13)
      .stroke({ color: 0xe8fbff, width: 2, alpha: 0.58 })
      .circle(0, 0, 21)
      .stroke({ color: 0x44f5ff, width: 1, alpha: 0.32 });
    graphic.position.set(event.position.x, event.position.y);
    return { graphic, ttlSeconds: 0.24 };
  }
  if (event.kind === "player-hit") {
    const graphic = new Graphics()
      .circle(0, 0, 31)
      .stroke({ color: 0xff4f6a, width: 4, alpha: 0.62 })
      .rect(-24, -24, 48, 48)
      .stroke({ color: 0xfff2a8, width: 1, alpha: 0.22 });
    graphic.position.set(event.position.x, event.position.y);
    return { graphic, ttlSeconds: 0.32 };
  }
  return undefined;
}

function drawLayeredNova(
  graphic: PixiGraphics,
  options: { accent: number; color: number; radius: number; themeId: string | undefined },
): void {
  drawSparkBurst(graphic, { accent: options.accent, color: options.color, radius: options.radius, spokes: 18 });
  for (let ring = 0; ring < 3; ring += 1) {
    const radius = options.radius * (0.62 + ring * 0.28);
    graphic
      .circle(0, 0, radius)
      .stroke({
        color: ring % 2 === 0 ? options.color : options.accent,
        width: ring === 0 ? 3 : 1,
        alpha: 0.28 - ring * 0.05,
      });
  }
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2;
    const inner = options.radius * 0.34;
    const outer = options.radius * (0.72 + (index % 3) * 0.12);
    drawOutlinedPoly(
      graphic,
      [
        Math.cos(angle) * inner,
        Math.sin(angle) * inner,
        Math.cos(angle + 0.07) * outer,
        Math.sin(angle + 0.07) * outer,
        Math.cos(angle - 0.07) * outer,
        Math.sin(angle - 0.07) * outer,
      ],
      index % 2 === 0 ? options.color : options.accent,
      0x020612,
      0.26,
    );
  }
  if (options.themeId === "music") {
    for (let index = 0; index < 4; index += 1) {
      graphic
        .moveTo(-options.radius, -18 + index * 12)
        .lineTo(options.radius, -18 + index * 12)
        .stroke({ color: index % 2 === 0 ? options.accent : options.color, width: 1, alpha: 0.22 });
    }
  }
}

function drawMeleeAfterimageFan(
  graphic: PixiGraphics,
  options: { accent: number; color: number; themeId: string | undefined },
): void {
  for (let index = 0; index < 4; index += 1) {
    const radius = 48 + index * 10;
    graphic
      .arc(0, 0, radius, -1.15 + index * 0.08, 1.08 + index * 0.04)
      .stroke({
        color: index % 2 === 0 ? options.color : options.accent,
        width: Math.max(1, 4 - index),
        alpha: 0.26 - index * 0.035,
      });
  }
  if (options.themeId === "blade" || options.themeId === "dragon" || options.themeId === "demon") {
    for (let index = 0; index < 6; index += 1) {
      const angle = -0.92 + index * 0.36;
      const distance = 34 + (index % 3) * 9;
      drawOutlinedPoly(
        graphic,
        [
          Math.cos(angle) * distance,
          Math.sin(angle) * distance - 5,
          Math.cos(angle) * (distance + 18),
          Math.sin(angle) * (distance + 18),
          Math.cos(angle) * distance,
          Math.sin(angle) * distance + 5,
        ],
        index % 2 === 0 ? options.accent : options.color,
        0x020612,
        0.44,
      );
    }
  }
}

function drawTriggerSigil(
  graphic: PixiGraphics,
  options: { accent: number; color: number; themeId: string | undefined },
): void {
  graphic
    .circle(0, 0, 42)
    .stroke({ color: options.color, width: 2, alpha: 0.34 })
    .circle(0, 0, 58)
    .stroke({ color: options.accent, width: 1, alpha: 0.2 });
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    graphic
      .rect(Math.cos(angle) * 34 - 3, Math.sin(angle) * 34 - 3, 6, 6)
      .fill({ color: index % 2 === 0 ? options.accent : options.color, alpha: 0.42 });
  }
  if (options.themeId === "clockwork") {
    for (let index = 0; index < 3; index += 1) {
      graphic
        .circle(0, 0, 21 + index * 13)
        .stroke({ color: index % 2 === 0 ? options.accent : options.color, width: 1, alpha: 0.18 });
    }
  }
}

function drawWishcraftImpactDebris(
  graphic: PixiGraphics,
  visualKind: string,
  palette: { accent: number; color: number },
  themeId: string | undefined,
): void {
  const count = visualKind === "area" || visualKind === "burst" ? 14 : visualKind === "beam" ? 10 : 8;
  drawMicroPixelDebris(graphic, palette, { count, radius: visualKind === "area" ? 58 : 38 });
  if (themeId === "starfire" || themeId === "solar" || themeId === "meteor") {
    for (let index = 0; index < 7; index += 1) {
      const angle = index * 0.897;
      const distance = 18 + (index % 3) * 10;
      drawStarSpark(graphic, Math.cos(angle) * distance, Math.sin(angle) * distance, palette.accent, 0.52);
    }
    return;
  }
  if (themeId === "dragon" || themeId === "demon") {
    for (let index = 0; index < 6; index += 1) {
      const angle = index * 1.047;
      const distance = 17 + (index % 2) * 12;
      drawOutlinedPoly(
        graphic,
        [
          Math.cos(angle) * distance,
          Math.sin(angle) * distance - 7,
          Math.cos(angle) * (distance + 9),
          Math.sin(angle) * (distance + 9),
          Math.cos(angle) * distance,
          Math.sin(angle) * distance + 7,
        ],
        index % 2 === 0 ? palette.color : palette.accent,
        0x020612,
        0.5,
      );
    }
    return;
  }
  if (themeId === "shield" || themeId === "angel") {
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      const x = Math.cos(angle) * 34;
      const y = Math.sin(angle) * 34;
      graphic
        .rect(x - 4, y - 4, 8, 8)
        .stroke({ color: palette.accent, width: 1, alpha: 0.42 });
    }
    return;
  }
  if (themeId === "ocean" || themeId === "forest" || themeId === "swarm") {
    for (let index = 0; index < 8; index += 1) {
      const angle = index * 0.785;
      const distance = 14 + (index % 4) * 7;
      graphic
        .circle(Math.cos(angle) * distance, Math.sin(angle) * distance, 3 + (index % 2))
        .stroke({ color: index % 2 === 0 ? palette.color : palette.accent, width: 1, alpha: 0.46 });
    }
  }
}

function drawSparkBurst(
  graphic: PixiGraphics,
  options: { accent: number; color: number; radius: number; spokes: number },
): void {
  drawPixelGlow(graphic, 0, 0, options.radius * 0.9, options.color, 0.16);
  for (let index = 0; index < options.spokes; index += 1) {
    const angle = (index / options.spokes) * Math.PI * 2;
    const inner = options.radius * (0.22 + (index % 3) * 0.06);
    const outer = options.radius * (0.72 + (index % 4) * 0.12);
    graphic
      .moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      .lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
      .stroke({
        color: index % 2 === 0 ? options.color : options.accent,
        width: index % 3 === 0 ? 3 : 2,
        alpha: 0.62,
      });
  }
  graphic
    .circle(0, 0, options.radius * 0.42)
    .stroke({ color: options.accent, width: 2, alpha: 0.44 });
}

function ttlForVisualKind(visualKind: string): number {
  const ttlByKind: Record<string, number> = {
    area: 0.52,
    beam: 0.28,
    burst: 0.46,
    lance: 0.28,
    melee: 0.34,
    missile: 0.4,
    pickup: 0.3,
    ricochet: 0.38,
    scatter: 0.34,
    shield: 0.42,
    summon: 0.44,
    trigger: 0.48,
  };
  return ttlByKind[visualKind] ?? 0.3;
}
