import { wishcraftCatalog } from "../../shared/wishcraft/catalog.js";
import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";
import type { CommonEnemyTemplate } from "../simulation/combat.js";
import {
  drawGearShard,
  drawOutlinedPoly,
  drawPixelGlow,
  drawStarSpark,
} from "./pixel-primitives.js";
import { motifForTheme, type WishcraftThemeMotif } from "./wishcraft-theme-motifs.js";

type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export interface EnemyDeathVfxPalette {
  accent: number;
  color: number;
}

export function createEnemyDeathVfxGraphic(
  event: CombatFeedback,
  Graphics: PixiGraphicsCtor,
  loadout: readonly Wishcraft[],
): { graphic: PixiGraphics; ttlSeconds: number } | undefined {
  if (event.kind !== "enemy-death") {
    return undefined;
  }
  const graphic = new Graphics();
  const palette = enemyDeathPaletteFromLoadout(loadout);
  const themeId = latestThemeIdFromLoadout(loadout);
  drawEnemyDeathVfx(graphic, {
    motif: motifForTheme(themeId),
    palette,
    radius: event.radius ?? radiusForTemplate(event.templateId),
    templateId: event.templateId ?? "fast-fragile",
    themeId,
  });
  graphic.position.set(event.position.x, event.position.y);
  return {
    graphic,
    ttlSeconds: ttlForEnemyDeathTemplate(event.templateId),
  };
}

export function enemyDeathShardCount(templateId: CommonEnemyTemplate["id"] | undefined): number {
  if (templateId === "slow-tough") {
    return 24;
  }
  if (templateId === "swarm-fragile") {
    return 18;
  }
  return 16;
}

export function ttlForEnemyDeathTemplate(templateId: CommonEnemyTemplate["id"] | undefined): number {
  if (templateId === "slow-tough") {
    return 0.72;
  }
  if (templateId === "swarm-fragile") {
    return 0.58;
  }
  return 0.52;
}

function drawEnemyDeathVfx(
  graphic: PixiGraphics,
  options: {
    motif: WishcraftThemeMotif;
    palette: EnemyDeathVfxPalette;
    radius: number;
    templateId: CommonEnemyTemplate["id"];
    themeId: string | undefined;
  },
): void {
  drawPixelGlow(graphic, 0, 0, options.radius * 3.1, options.palette.color, 0.13);
  drawDeathCore(graphic, options);
  if (options.templateId === "slow-tough") {
    drawSlowToughBreakup(graphic, options);
  } else if (options.templateId === "swarm-fragile") {
    drawSwarmBreakup(graphic, options);
  } else {
    drawFastHarrierBreakup(graphic, options);
  }
  drawThemeResidue(graphic, options);
}

function drawDeathCore(
  graphic: PixiGraphics,
  options: {
    palette: EnemyDeathVfxPalette;
    radius: number;
    templateId: CommonEnemyTemplate["id"];
  },
): void {
  const ringRadius = options.radius * (options.templateId === "slow-tough" ? 2.3 : 1.9);
  graphic
    .circle(0, 0, ringRadius * 0.42)
    .stroke({ color: options.palette.accent, width: 3, alpha: 0.46 })
    .circle(0, 0, ringRadius * 0.7)
    .stroke({ color: options.palette.color, width: 1, alpha: 0.24 });
  for (let spoke = 0; spoke < 10; spoke += 1) {
    const angle = (spoke / 10) * Math.PI * 2;
    graphic
      .moveTo(Math.cos(angle) * ringRadius * 0.26, Math.sin(angle) * ringRadius * 0.26)
      .lineTo(Math.cos(angle) * ringRadius * (0.7 + (spoke % 3) * 0.12), Math.sin(angle) * ringRadius * (0.7 + (spoke % 3) * 0.12))
      .stroke({ color: spoke % 2 === 0 ? options.palette.accent : options.palette.color, width: spoke % 4 === 0 ? 2 : 1, alpha: 0.34 });
  }
}

function drawFastHarrierBreakup(
  graphic: PixiGraphics,
  options: { motif: WishcraftThemeMotif; palette: EnemyDeathVfxPalette; radius: number },
): void {
  drawShardFan(graphic, {
    count: enemyDeathShardCount("fast-fragile"),
    lengthScale: 1.18,
    motif: options.motif,
    palette: options.palette,
    radius: options.radius,
    spread: 0.58,
    startAngle: -Math.PI * 0.08,
  });
  for (const side of [-1, 1]) {
    drawOutlinedPoly(
      graphic,
      [side * 13, -5, side * 42, -18, side * 50, -5, side * 22, 9],
      options.palette.color,
      0x020612,
      0.5,
    );
    graphic
      .moveTo(side * 8, 4)
      .lineTo(side * 58, side * 2)
      .stroke({ color: options.palette.accent, width: 1, alpha: 0.38 });
  }
}

function drawSlowToughBreakup(
  graphic: PixiGraphics,
  options: { motif: WishcraftThemeMotif; palette: EnemyDeathVfxPalette; radius: number },
): void {
  drawShardFan(graphic, {
    count: enemyDeathShardCount("slow-tough"),
    lengthScale: 1.44,
    motif: options.motif,
    palette: options.palette,
    radius: options.radius,
    spread: 0.86,
    startAngle: 0,
  });
  for (let plate = 0; plate < 8; plate += 1) {
    const angle = plate * 0.785;
    const distance = options.radius * (1.15 + (plate % 3) * 0.42);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    drawOutlinedPoly(
      graphic,
      [x - 9, y - 7, x + 11, y - 4, x + 9, y + 8, x - 8, y + 6],
      plate % 2 === 0 ? options.palette.color : options.palette.accent,
      0x020612,
      0.58,
    );
  }
}

function drawSwarmBreakup(
  graphic: PixiGraphics,
  options: { motif: WishcraftThemeMotif; palette: EnemyDeathVfxPalette; radius: number },
): void {
  drawShardFan(graphic, {
    count: enemyDeathShardCount("swarm-fragile"),
    lengthScale: 0.92,
    motif: options.motif,
    palette: options.palette,
    radius: options.radius,
    spread: 1.1,
    startAngle: Math.PI * 0.12,
  });
  for (let node = 0; node < 9; node += 1) {
    const angle = node * 2.399;
    const distance = options.radius * (0.9 + (node % 4) * 0.28);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    graphic
      .circle(x, y, 4 + (node % 3))
      .fill({ color: node % 2 === 0 ? options.palette.color : options.palette.accent, alpha: 0.54 })
      .moveTo(x * 0.4, y * 0.4)
      .lineTo(x * 1.45, y * 1.45)
      .stroke({ color: options.palette.accent, width: 1, alpha: 0.26 });
  }
}

function drawShardFan(
  graphic: PixiGraphics,
  options: {
    count: number;
    lengthScale: number;
    motif: WishcraftThemeMotif;
    palette: EnemyDeathVfxPalette;
    radius: number;
    spread: number;
    startAngle: number;
  },
): void {
  for (let index = 0; index < options.count; index += 1) {
    const angle = options.startAngle + index * 2.399;
    const distance = options.radius * (0.8 + (index % 7) * 0.32) * options.lengthScale;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle * options.spread) * distance;
    const width = 5 + (index % 4) * 3;
    const height = 3 + (index % 3) * 3;
    graphic
      .rect(x - width / 2 - 1, y - height / 2 - 1, width + 2, height + 2)
      .fill({ color: 0x020612, alpha: 0.78 })
      .rect(x - width / 2, y - height / 2, width, height)
      .fill({ color: index % 2 === 0 ? options.palette.color : options.palette.accent, alpha: 0.72 })
      .moveTo(0, 0)
      .lineTo(x * 1.32, y * 1.32)
      .stroke({ color: index % 2 === 0 ? options.palette.accent : options.palette.color, width: 1, alpha: 0.27 });
    if (index % 4 === 0) {
      drawMotifShard(graphic, {
        motif: options.motif,
        palette: options.palette,
        size: 4 + (index % 5),
        x: x * 1.12,
        y: y * 1.12,
      });
    }
  }
}

function drawMotifShard(
  graphic: PixiGraphics,
  options: {
    motif: WishcraftThemeMotif;
    palette: EnemyDeathVfxPalette;
    size: number;
    x: number;
    y: number;
  },
): void {
  if (options.motif === "celestial" || options.motif === "meteor") {
    drawStarSpark(graphic, options.x, options.y, options.palette.accent, 0.46);
    return;
  }
  if (options.motif === "clockwork") {
    drawGearShard(graphic, options.x, options.y, options.size, options.palette.accent, 0.38);
    return;
  }
  if (options.motif === "crystal-frost" || options.motif === "blade-metal" || options.motif === "dragon-demon") {
    drawOutlinedPoly(
      graphic,
      [options.x, options.y - options.size, options.x + options.size, options.y, options.x, options.y + options.size, options.x - options.size, options.y],
      options.motif === "dragon-demon" ? options.palette.color : options.palette.accent,
      0x020612,
      0.42,
    );
    return;
  }
  graphic
    .rect(options.x - options.size * 0.5, options.y - options.size * 0.5, options.size, options.size)
    .stroke({ color: options.palette.accent, width: 1, alpha: 0.34 });
}

function drawThemeResidue(
  graphic: PixiGraphics,
  options: {
    motif: WishcraftThemeMotif;
    palette: EnemyDeathVfxPalette;
    radius: number;
    themeId: string | undefined;
  },
): void {
  if (options.themeId === "thunder" || options.themeId === "storm" || options.motif === "plasma-storm") {
    graphic
      .moveTo(-options.radius * 1.8, options.radius * 0.8)
      .lineTo(-options.radius * 0.25, -options.radius * 1.2)
      .lineTo(options.radius * 0.8, options.radius * 0.5)
      .lineTo(options.radius * 1.9, -options.radius * 0.7)
      .stroke({ color: options.palette.accent, width: 2, alpha: 0.42 });
    return;
  }
  if (options.motif === "void-gravity" || options.motif === "ocean") {
    for (let ring = 0; ring < 3; ring += 1) {
      graphic.circle(0, 0, options.radius * (1.4 + ring * 0.52)).stroke({
        color: ring % 2 === 0 ? options.palette.color : options.palette.accent,
        width: 1,
        alpha: 0.18 - ring * 0.04,
      });
    }
    return;
  }
  if (options.motif === "clockwork") {
    for (let ring = 0; ring < 3; ring += 1) {
      drawGearShard(graphic, 0, 0, options.radius * (1.1 + ring * 0.42), options.palette.accent, 0.14 - ring * 0.025);
    }
  }
}

function enemyDeathPaletteFromLoadout(loadout: readonly Wishcraft[]): EnemyDeathVfxPalette {
  const latest = loadout.at(-1);
  const theme = wishcraftCatalog.themeTags.find((candidate) => candidate.id === latest?.primaryThemeId);
  if (!theme) {
    return { accent: 0xfff2a8, color: 0xff4fd8 };
  }
  return {
    accent: Number.parseInt(theme.palette.accent.replace("#", ""), 16),
    color: Number.parseInt(theme.palette.primary.replace("#", ""), 16),
  };
}

function latestThemeIdFromLoadout(loadout: readonly Wishcraft[]): string | undefined {
  return loadout.at(-1)?.primaryThemeId;
}

function radiusForTemplate(templateId: CommonEnemyTemplate["id"] | undefined): number {
  if (templateId === "slow-tough") {
    return 18;
  }
  if (templateId === "swarm-fragile") {
    return 11;
  }
  return 13;
}
