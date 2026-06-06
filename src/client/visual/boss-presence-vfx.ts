import type { BossEncounterState } from "../simulation/boss-encounter.js";
import type { Point } from "../simulation/arena-math.js";

type PixiGraphics = import("pixi.js").Graphics;

export function drawBossPresenceVfx(
  graphic: PixiGraphics,
  options: {
    bossState: BossEncounterState;
    nowSeconds: number;
    player: Point;
  },
): void {
  graphic.clear();
  if (options.bossState.phase !== "warning" && options.bossState.phase !== "active") {
    return;
  }
  const bosses = options.bossState.pendingPlan?.bosses ?? [];
  const warning = options.bossState.phase === "warning";
  const healthPressure = warning ? 1 : 1 - options.bossState.healthProgress;

  for (const [index, boss] of bosses.entries()) {
    const side = index === 0 ? -1 : 1;
    const center = {
      x: options.player.x + side * (220 + index * 90),
      y: options.player.y - 120 + index * 120,
    };
    const color = bossPresenceColor(boss.rivalThemeId);
    const accent = bossPresenceAccent(boss.rivalThemeId);
    const pulse = 0.5 + Math.sin(options.nowSeconds * 3.2 + index) * 0.5;
    const intensity = warning ? 0.78 : 0.42 + healthPressure * 0.28;
    drawBossAura(graphic, {
      accent,
      center,
      color,
      index,
      intensity,
      nowSeconds: options.nowSeconds,
      pulse,
      warning,
    });
  }
}

export function bossPresenceRingCount(bossCount: number, warning: boolean): number {
  return bossCount * (warning ? 5 : 3);
}

function drawBossAura(
  graphic: PixiGraphics,
  options: {
    accent: number;
    center: Point;
    color: number;
    index: number;
    intensity: number;
    nowSeconds: number;
    pulse: number;
    warning: boolean;
  },
): void {
  const ringCount = options.warning ? 5 : 3;
  for (let ring = 0; ring < ringCount; ring += 1) {
    const radius = 112 + ring * 38 + options.pulse * 18;
    graphic
      .circle(options.center.x, options.center.y, radius)
      .stroke({
        color: ring % 2 === 0 ? options.color : options.accent,
        width: ring === 0 ? 3 : 1,
        alpha: options.intensity * (0.18 - ring * 0.022),
      });
  }
  for (let spoke = 0; spoke < 18; spoke += 1) {
    const angle = (spoke / 18) * Math.PI * 2 + options.nowSeconds * (options.warning ? 0.42 : 0.22);
    const inner = 74 + (spoke % 3) * 9;
    const outer = 158 + options.pulse * 24 + (spoke % 4) * 8;
    graphic
      .moveTo(options.center.x + Math.cos(angle) * inner, options.center.y + Math.sin(angle) * inner)
      .lineTo(options.center.x + Math.cos(angle) * outer, options.center.y + Math.sin(angle) * outer)
      .stroke({
        color: spoke % 2 === 0 ? options.accent : options.color,
        width: spoke % 5 === 0 ? 3 : 1,
        alpha: options.intensity * (options.warning ? 0.18 : 0.11),
      });
  }
  for (let scan = 0; scan < 7; scan += 1) {
    const y = options.center.y - 126 + scan * 42 + Math.sin(options.nowSeconds * 2.4 + scan) * 9;
    const width = 210 + (scan % 3) * 34;
    graphic
      .rect(options.center.x - width / 2, y, width, 3)
      .fill({
        color: scan % 2 === 0 ? options.color : options.accent,
        alpha: options.intensity * (options.warning ? 0.14 : 0.08),
      });
  }
}

function bossPresenceColor(themeId: string): number {
  const colors: Record<string, number> = {
    frost: 0x8cefff,
    gravity: 0x7c5cff,
    magnetic: 0xff4fd8,
    ocean: 0x3bd7ff,
    solar: 0xffd15a,
    void: 0x7c5cff,
  };
  return colors[themeId] ?? 0xff4fd8;
}

function bossPresenceAccent(themeId: string): number {
  const colors: Record<string, number> = {
    frost: 0xe8fbff,
    gravity: 0xff4fd8,
    magnetic: 0x44f5ff,
    ocean: 0xe8fbff,
    solar: 0xfff2a8,
    void: 0x44f5ff,
  };
  return colors[themeId] ?? 0x44f5ff;
}
