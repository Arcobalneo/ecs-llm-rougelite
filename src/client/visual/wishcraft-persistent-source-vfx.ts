import type { Point } from "../simulation/arena-math.js";
import type { XpShard } from "../simulation/progression-combat.js";
import type { WishcraftRuntimeState } from "../simulation/wishcraft-mechanics.js";
import {
  drawOutlinedPoly,
  drawPixelGlow,
} from "./pixel-primitives.js";
import { xpMagnetTrailSegmentCount } from "./sprites/xp-shard-sprite.js";

type PixiGraphics = import("pixi.js").Graphics;

export function persistentShieldRingCount(shield: WishcraftRuntimeState["shield"]): number {
  if (shield.capacity <= 0 || shield.value <= 0) {
    return 0;
  }
  const ratio = shield.value / Math.max(1, shield.capacity);
  return 2 + Math.ceil(ratio * 3);
}

export function persistentXpMagnetLaneCount(shards: readonly XpShard[]): number {
  return Math.min(18, shards.filter((shard) => shard.attracted).length);
}

export function persistentSummonLinkCount(runtime: WishcraftRuntimeState): number {
  return Math.min(8, runtime.summons.length * 2);
}

export function drawPersistentWishcraftSourceVfx(
  graphic: PixiGraphics,
  options: {
    nowSeconds: number;
    player: Point;
    runtime: WishcraftRuntimeState;
    xpShards: readonly XpShard[];
  },
): void {
  graphic.clear();
  drawPersistentShieldShell(graphic, options);
  drawPersistentXpMagnetField(graphic, options);
  drawPersistentSummonLinks(graphic, options);
}

function drawPersistentShieldShell(
  graphic: PixiGraphics,
  options: {
    nowSeconds: number;
    player: Point;
    runtime: WishcraftRuntimeState;
  },
): void {
  const rings = persistentShieldRingCount(options.runtime.shield);
  if (rings === 0) {
    return;
  }
  const ratio = options.runtime.shield.value / Math.max(1, options.runtime.shield.capacity);
  const pulse = 0.5 + Math.sin(options.nowSeconds * 3.1) * 0.5;
  drawPixelGlow(graphic, options.player.x, options.player.y, 82 + ratio * 34, 0x62ff9d, 0.05 + ratio * 0.04);
  for (let ring = 0; ring < rings; ring += 1) {
    const radius = 48 + ring * 13 + pulse * 3 + ratio * 18;
    graphic
      .circle(options.player.x, options.player.y, radius)
      .stroke({
        color: ring % 2 === 0 ? 0x62ff9d : 0xe8fbff,
        width: ring === 0 ? 3 : 1,
        alpha: (0.18 + ratio * 0.16) - ring * 0.035,
      });
  }
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2 + options.nowSeconds * 0.45;
    const radius = 67 + ratio * 26 + (index % 2) * 6;
    const x = options.player.x + Math.cos(angle) * radius;
    const y = options.player.y + Math.sin(angle) * radius;
    drawOutlinedPoly(graphic, [x, y - 6, x + 6, y, x, y + 6, x - 6, y], index % 2 === 0 ? 0xe8fbff : 0x62ff9d, 0x020612, 0.3 + ratio * 0.12);
  }
}

function drawPersistentXpMagnetField(
  graphic: PixiGraphics,
  options: {
    nowSeconds: number;
    player: Point;
    xpShards: readonly XpShard[];
  },
): void {
  const attracted = options.xpShards.filter((shard) => shard.attracted).slice(0, persistentXpMagnetLaneCount(options.xpShards));
  for (const [laneIndex, shard] of attracted.entries()) {
    const dx = options.player.x - shard.position.x;
    const dy = options.player.y - shard.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 24) {
      continue;
    }
    const unit = { x: dx / distance, y: dy / distance };
    const normal = { x: -unit.y, y: unit.x };
    const segments = xpMagnetTrailSegmentCount(distance);
    const flow = (options.nowSeconds * 5 + laneIndex * 0.13) % 1;
    for (let segment = 0; segment < segments; segment += 1) {
      const t0 = (segment + flow) / (segments + 1);
      const t1 = Math.min(0.96, t0 + 0.16);
      const curl = Math.sin((t0 + laneIndex * 0.07) * Math.PI * 2) * (9 + (laneIndex % 3) * 3);
      const start = {
        x: shard.position.x + unit.x * distance * t0 + normal.x * curl,
        y: shard.position.y + unit.y * distance * t0 + normal.y * curl,
      };
      const end = {
        x: shard.position.x + unit.x * distance * t1 + normal.x * curl * 0.42,
        y: shard.position.y + unit.y * distance * t1 + normal.y * curl * 0.42,
      };
      const color = laneIndex % 2 === 0 ? 0x44f5ff : 0xff4fd8;
      graphic
        .moveTo(start.x, start.y)
        .lineTo(end.x, end.y)
        .stroke({ color: 0x020612, width: 5, alpha: 0.2 })
        .moveTo(start.x, start.y)
        .lineTo(end.x, end.y)
        .stroke({ color, width: segment % 3 === 0 ? 3 : 2, alpha: 0.22 + (segment % 2) * 0.08 });
    }
  }
}

function drawPersistentSummonLinks(
  graphic: PixiGraphics,
  options: {
    nowSeconds: number;
    player: Point;
    runtime: WishcraftRuntimeState;
  },
): void {
  const linkCount = persistentSummonLinkCount(options.runtime);
  if (linkCount === 0) {
    return;
  }
  for (const [index, summon] of options.runtime.summons.entries()) {
    const dx = summon.position.x - options.player.x;
    const dy = summon.position.y - options.player.y;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const normal = { x: -Math.sin(angle), y: Math.cos(angle) };
    const pulse = 0.45 + Math.sin(options.nowSeconds * 5.4 + index) * 0.5;
    const mid = {
      x: (options.player.x + summon.position.x) * 0.5 + normal.x * (12 + pulse * 7),
      y: (options.player.y + summon.position.y) * 0.5 + normal.y * (12 + pulse * 7),
    };
    graphic
      .moveTo(options.player.x, options.player.y)
      .quadraticCurveTo(mid.x, mid.y, summon.position.x, summon.position.y)
      .stroke({ color: 0x7ddfff, width: 2, alpha: 0.18 })
      .moveTo(
        summon.position.x - Math.cos(angle) * Math.min(36, distance * 0.24),
        summon.position.y - Math.sin(angle) * Math.min(36, distance * 0.24),
      )
      .lineTo(summon.position.x + Math.cos(angle) * 34, summon.position.y + Math.sin(angle) * 34)
      .stroke({ color: index % 2 === 0 ? 0xfff6d6 : 0xff4fd8, width: 3, alpha: 0.28 });
    graphic
      .circle(summon.position.x, summon.position.y, 24 + pulse * 5)
      .stroke({ color: 0xe8fbff, width: 1, alpha: 0.18 });
  }
}
