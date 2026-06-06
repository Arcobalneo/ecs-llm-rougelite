import type { BossPlanEntry } from "../../shared/boss/boss-planning.js";
import { wishcraftCatalog } from "../../shared/wishcraft/catalog.js";
import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { Point } from "../simulation/arena-math.js";
import type { BossEncounterState } from "../simulation/boss-encounter.js";
import {
  bossSpriteAnimationState,
  type BossSpriteAnimationState,
} from "./combat-entity-animation.js";
import { drawCompactAttachment } from "./runtime-attachments.js";
import {
  assembleRuntimeVisuals,
  createVisualBudget,
  layoutRuntimeVisualAttachments,
} from "./visual-assembly.js";
import {
  drawPixelGlow,
  type PixelPalette,
} from "./pixel-primitives.js";
import { drawBossDamageOverlay } from "./boss-damage-overlay.js";
import { drawBossStateOverlay } from "./boss-state-overlay.js";
import { drawBossActionPose } from "./sprites/boss/boss-action-pose.js";
import { drawBossArmorDetail } from "./sprites/boss/boss-armor-detail.js";
import { selectBossCoreColor } from "./sprites/boss/boss-sprite-color.js";
import { drawBossTelegraph } from "./sprites/boss/boss-telegraph-sprite.js";
import { drawCrawlingDragonBoss } from "./sprites/boss/crawling-dragon-boss-sprite.js";
import { drawFlyingDragonBoss } from "./sprites/boss/flying-dragon-boss-sprite.js";
import { drawHumanoidDragonBoss } from "./sprites/boss/humanoid-dragon-boss-sprite.js";
import type {
  BossSpriteRenderCache,
  PixiContainer,
  PixiGraphics,
  PixiGraphicsCtor,
} from "./sprites/boss/boss-sprite-types.js";

export type { BossSpriteRenderCache } from "./sprites/boss/boss-sprite-types.js";

export function syncBossGraphics(options: {
  bossState: BossEncounterState;
  Graphics: PixiGraphicsCtor;
  layer: PixiContainer;
  nowSeconds: number;
  player: Point;
  renderCache: BossSpriteRenderCache;
  visualPolishVersion: string;
}): void {
  const bosses = options.bossState.pendingPlan?.bosses ?? [];
  const ids = options.bossState.phase === "warning" || options.bossState.phase === "active"
    ? bosses.map((boss) => `${options.visualPolishVersion}:${boss.templateId}:${boss.rivalThemeId}:${boss.silhouette}:${boss.visualPieceIds.join(",")}`).join("|")
    : "";
  if (ids !== options.renderCache.bossIds) {
    for (const graphic of options.renderCache.bosses) {
      graphic.destroy();
    }
    options.renderCache.bosses = [];
    if (ids.length > 0) {
      options.renderCache.bosses = bosses.map((boss, index) =>
        createBossGraphic({
          animation: bossSpriteAnimationState({
            healthProgress: options.bossState.healthProgress,
            index,
            nowSeconds: options.nowSeconds,
            phase: options.bossState.phase,
          }),
          boss,
          Graphics: options.Graphics,
          index,
        }),
      );
      for (const graphic of options.renderCache.bosses) {
        options.layer.addChild(graphic);
      }
    }
    options.renderCache.bossIds = ids;
  }

  for (const [index, graphic] of options.renderCache.bosses.entries()) {
    const boss = bosses[index];
    if (!boss) {
      continue;
    }
    const animation = bossSpriteAnimationState({
      healthProgress: options.bossState.healthProgress,
      index,
      nowSeconds: options.nowSeconds,
      phase: options.bossState.phase,
    });
    redrawBossGraphic(graphic, {
      animation,
      boss,
      healthProgress: options.bossState.healthProgress,
      index,
    });
    const side = index === 0 ? -1 : 1;
    graphic.position.set(options.player.x + side * (220 + index * 90), options.player.y - 120 + index * 120);
    graphic.rotation = Math.sin(options.nowSeconds * 1.25 + index) * 0.035;
    graphic.alpha = animation.entranceAlpha;
    graphic.scale.set(1);
  }
}

export function createBossGraphic(options: {
  animation: BossSpriteAnimationState;
  boss: BossPlanEntry;
  Graphics: PixiGraphicsCtor;
  index: number;
}): PixiGraphics {
  const graphic = new options.Graphics();
  redrawBossGraphic(graphic, options);
  return graphic;
}

function redrawBossGraphic(
  graphic: PixiGraphics,
  options: {
    animation: BossSpriteAnimationState;
    boss: BossPlanEntry;
    healthProgress?: number;
    index: number;
  },
): void {
  const bossWishcraft: Wishcraft = {
    id: `boss-visual-${options.boss.templateId}-${options.index}`,
    mechanicPieceIds: [],
    name: { cn: options.boss.name, en: options.boss.name },
    parameters: {},
    primaryMechanicId: "boss-visual",
    primaryThemeId: options.boss.rivalThemeId,
    sourceWish: "local boss visual plan",
    visualPieceIds: options.boss.visualPieceIds,
  };
  const visuals = assembleRuntimeVisuals({
    bossSilhouette: options.boss.silhouette,
    catalog: wishcraftCatalog,
    entityRole: "boss-placeholder",
    loadout: [bossWishcraft],
    budget: createVisualBudget("boss-placeholder"),
  });
  const color = visuals.attachments[0]?.palette[visuals.attachments[0].paletteRole] ?? 0xff4fd8;
  const accent = visuals.attachments[0]?.palette.accent ?? 0xe8fbff;
  const shadow = visuals.attachments[0]?.palette.shadow ?? 0x080511;
  const secondary = visuals.attachments[0]?.palette.secondary ?? 0x5b4dff;
  const palette: PixelPalette = {
    accent,
    armor: color,
    core: selectBossCoreColor(color, secondary, accent),
    dark: shadow,
    glow: accent,
    trim: secondary,
  };
  const animation = options.animation;
  graphic.clear();
  drawPixelGlow(graphic, 0, 0, 118 * animation.auraPulse, color, 0.13 + animation.telegraph * 0.06);
  drawPixelGlow(graphic, 0, -4, 78 * animation.auraPulse, accent, 0.1 + animation.telegraph * 0.08);
  drawBossSilhouette(graphic, options.boss, palette, animation, options.healthProgress ?? 1);
  drawBossArmorDetail(graphic, {
    animation,
    healthProgress: options.healthProgress ?? 1,
    palette,
    silhouette: options.boss.silhouette,
  });
  drawBossActionPose(graphic, {
    animation,
    healthProgress: options.healthProgress ?? 1,
    palette,
    silhouette: options.boss.silhouette,
  });
  drawBossDamageOverlay(graphic, {
    animation,
    healthProgress: options.healthProgress ?? 1,
    index: options.index,
    palette,
    silhouette: options.boss.silhouette,
  });
  drawBossStateOverlay(graphic, {
    animation,
    healthProgress: options.healthProgress ?? 1,
    index: options.index,
    palette,
    silhouette: options.boss.silhouette,
  });
  if (animation.telegraph > 0) {
    drawBossTelegraph(graphic, palette, animation);
  }
  if (animation.hitFlashAlpha > 0) {
    graphic
      .circle(0, -6, 92)
      .fill({ color: 0xe8fbff, alpha: animation.hitFlashAlpha * 0.18 })
      .stroke({ color: 0xe8fbff, width: 3, alpha: animation.hitFlashAlpha });
  }
  for (const layout of layoutRuntimeVisualAttachments(visuals.attachments.slice(0, 12))) {
    drawCompactAttachment(graphic, layout.attachment, layout.slotIndex, 68);
  }
}

function drawBossSilhouette(
  graphic: PixiGraphics,
  boss: BossPlanEntry,
  palette: PixelPalette,
  animation: BossSpriteAnimationState,
  healthProgress: number,
): void {
  if (boss.silhouette === "flying") {
    drawFlyingDragonBoss({ animation, graphic, healthProgress, palette });
    return;
  }
  if (boss.silhouette === "crawling") {
    drawCrawlingDragonBoss({ animation, graphic, healthProgress, palette });
    return;
  }
  drawHumanoidDragonBoss({ animation, graphic, healthProgress, palette });
}
