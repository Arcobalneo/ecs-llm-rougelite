import { wishcraftCatalog } from "../../shared/wishcraft/catalog.js";
import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatLoopState } from "../simulation/combat-loop.js";
import type { ArenaRuntimeState } from "../simulation/arena-runtime.js";
import type { BossEncounterState } from "../simulation/boss-encounter.js";
import { resolveMovementVector } from "../simulation/movement.js";
import {
  enemyDriftFromLoadout,
  phaseTintFromLoadout,
  type ArenaVisualState,
} from "../visual/arena-visual-state.js";
import { drawArenaHorizon } from "../visual/arena-horizon.js";
import { drawBossEncounterVfx } from "../visual/boss-encounter-vfx.js";
import { drawBossPresenceVfx } from "../visual/boss-presence-vfx.js";
import { drawLateRunFieldVfx } from "../visual/late-run-field-vfx.js";
import { drawPlayerReadabilityVfx } from "../visual/player-readability-vfx.js";
import { drawPersistentWishcraftSourceVfx } from "../visual/wishcraft-persistent-source-vfx.js";
import {
  createCommonEnemyGraphic,
  createPlayerMech,
  createSummonGraphic,
  createXpShardGraphic,
  redrawCommonEnemyGraphic,
  redrawPlayerMechGraphic,
} from "../visual/combat-entity-sprites.js";
import { redrawXpShardGraphic } from "../visual/sprites/xp-shard-sprite.js";
import {
  syncBossGraphics,
} from "../visual/boss-entity-sprites.js";
import {
  enemySpriteAnimationState,
  type PlayerMechAnimationState,
  playerMechAnimationState,
} from "../visual/combat-entity-animation.js";
import {
  syncPlayerVisualAttachments,
  syncScreenEffects,
} from "../visual/runtime-attachments.js";
import {
  assembleRuntimeVisuals,
  createVisualBudget,
  type RuntimeVisualAssembly,
  type VisualEntityRole,
} from "../visual/visual-assembly.js";
import {
  syncFeedbackGraphics,
} from "./feedback-renderer.js";
import { syncGraphicsMap } from "./entity-sync.js";
import {
  applyCombatCamera,
  createCombatStageLayers,
  type PixiContainer,
  type PixiGraphics,
  type PixiGraphicsCtor,
} from "./pixi-stage.js";
import {
  createCombatRenderCache,
  type CombatRenderCache,
} from "./render-cache.js";

export const VISUAL_POLISH_VERSION = "hd2d-cyberpixel-v34";
export {
  MAX_FEEDBACK_GRAPHICS_PER_FRAME,
  selectBudgetedFeedback,
} from "./feedback-renderer.js";

export async function bootPixiArena(options: {
  bossState: BossEncounterState;
  canvas: HTMLCanvasElement;
  combatState: CombatLoopState;
  screen: HTMLElement;
  state: ArenaRuntimeState;
  visualState: ArenaVisualState;
}): Promise<void> {
  if (!isRealBrowserCanvas(options.canvas)) {
    options.screen.dataset.pixiStatus = "skipped";
    return;
  }

  try {
    const { Application, Container, Graphics } = await import("pixi.js");
    const app = new Application();
    await app.init({
      canvas: options.canvas,
      resizeTo: options.screen,
      backgroundAlpha: 0,
      antialias: false,
      preference: "webgl",
    });

    const player = createPlayerMech(Graphics);
    const layers = createCombatStageLayers({ Container, Graphics, player });
    const renderCache = createCombatRenderCache();
    renderCache.lastFeedbackClockSeconds = options.combatState.activeCombatSeconds;
    app.stage.addChild(layers.stage);
    options.screen.dataset.pixiStatus = "ready";
    app.ticker.add(() => {
      const movement = resolveMovementVector(options.state.input);
      const playerAnimation = playerMechAnimationWithFeedback({
        base: playerMechAnimationState({
          movement,
          nowSeconds: options.combatState.activeCombatSeconds,
        }),
        loadout: options.combatState.wishcraftLoadout,
        nowSeconds: options.combatState.activeCombatSeconds,
        renderCache,
        feedback: options.combatState.feedback,
      });
      redrawPlayerMechGraphic(
        player,
        playerAnimation,
      );
      applyCombatCamera(layers.stage, options.state);
      const hover = Math.sin(options.combatState.activeCombatSeconds * 4.2) * (movement.strength > 0 ? 1.2 : 2.2);
      player.position.set(options.state.position.x, options.state.position.y + hover);
      player.scale.set(1 + Math.sin(options.combatState.activeCombatSeconds * 3.1) * 0.012);
      renderCombatGraphics({
        bossState: options.bossState,
        bossEncounter: layers.bossEncounter,
        bossPresence: layers.bossPresence,
        combatState: options.combatState,
        enemyLayer: layers.enemyLayer,
        feedbackLayer: layers.feedbackLayer,
        Graphics,
        horizon: layers.horizon,
        lateRunField: layers.lateRunField,
        launchLayer: layers.launchLayer,
        persistentSourceVfx: layers.persistentSourceVfx,
        playerAttachmentLayer: layers.playerAttachmentLayer,
        playerReadabilityField: layers.playerReadabilityField,
        projectileLayer: layers.projectileLayer,
        renderCache,
        screen: options.screen,
        screenEffectLayer: layers.screenEffectLayer,
        screenPulseLayer: layers.screenPulseLayer,
        summonLayer: layers.summonLayer,
        trailResidueLayer: layers.trailResidueLayer,
        visualState: options.visualState,
        wishcraftPatternLayer: layers.wishcraftPatternLayer,
        xpLayer: layers.xpLayer,
      });
    });
  } catch (error) {
    options.screen.dataset.pixiStatus = "failed";
    console.error("Failed to initialize Pixi Arena", error);
  }
}

export function visualCacheKeyForEntity(
  entityId: string,
  role: VisualEntityRole,
  visuals: RuntimeVisualAssembly,
): string {
  const attachmentIds = visuals.attachments.map((attachment) => attachment.visualPieceId).join(",");
  return `${VISUAL_POLISH_VERSION}:${entityId}:${role}:${attachmentIds}`;
}

export function playerMechAnimationWithFeedback(options: {
  base: PlayerMechAnimationState;
  feedback: readonly CombatLoopState["feedback"][number][];
  loadout: readonly Wishcraft[];
  nowSeconds: number;
  renderCache: Pick<CombatRenderCache, "lastPlayerHitAtSeconds" | "lastPlayerLoadoutSignature" | "playerWishInstallStartedAtSeconds">;
}): PlayerMechAnimationState {
  if (options.feedback.some((event) => event.kind === "player-hit")) {
    options.renderCache.lastPlayerHitAtSeconds = options.nowSeconds;
  }
  const loadoutSignature = options.loadout.map((craft) => craft.id).join(",");
  if (loadoutSignature !== options.renderCache.lastPlayerLoadoutSignature) {
    if (options.renderCache.lastPlayerLoadoutSignature.length > 0 && options.loadout.length > 0) {
      options.renderCache.playerWishInstallStartedAtSeconds = options.nowSeconds;
    }
    options.renderCache.lastPlayerLoadoutSignature = loadoutSignature;
  }

  return {
    ...options.base,
    hitFlash: playerHitFlashProgress(options.nowSeconds - options.renderCache.lastPlayerHitAtSeconds),
    wishInstallProgress: playerWishInstallProgress(options.nowSeconds - options.renderCache.playerWishInstallStartedAtSeconds),
  };
}

function playerHitFlashProgress(ageSeconds: number): number {
  if (!Number.isFinite(ageSeconds) || ageSeconds < 0 || ageSeconds > 0.42) {
    return 0;
  }
  const progress = ageSeconds / 0.42;
  return (1 - progress) * (0.65 + Math.sin(progress * Math.PI * 5) * 0.35);
}

function playerWishInstallProgress(ageSeconds: number): number {
  if (!Number.isFinite(ageSeconds) || ageSeconds < 0) {
    return 1;
  }
  return Math.min(1, ageSeconds / 0.72);
}

function isRealBrowserCanvas(canvas: HTMLCanvasElement): boolean {
  const userAgent = canvas.ownerDocument.defaultView?.navigator.userAgent ?? "";
  return typeof canvas.getContext === "function" && !userAgent.includes("jsdom");
}

function renderCombatGraphics(options: {
  bossState: BossEncounterState;
  bossEncounter: PixiGraphics;
  bossPresence: PixiGraphics;
  combatState: CombatLoopState;
  enemyLayer: PixiContainer;
  feedbackLayer: PixiContainer;
  Graphics: PixiGraphicsCtor;
  horizon: PixiGraphics;
  lateRunField: PixiGraphics;
  launchLayer: PixiContainer;
  persistentSourceVfx: PixiGraphics;
  playerAttachmentLayer: PixiContainer;
  playerReadabilityField: PixiGraphics;
  projectileLayer: PixiContainer;
  renderCache: CombatRenderCache;
  screen: HTMLElement;
  screenEffectLayer: PixiContainer;
  screenPulseLayer: PixiContainer;
  summonLayer: PixiContainer;
  trailResidueLayer: PixiContainer;
  visualState: ArenaVisualState;
  wishcraftPatternLayer: PixiContainer;
  xpLayer: PixiContainer;
}): void {
  const phaseTint = phaseTintFromLoadout({
    loadout: options.combatState.wishcraftLoadout,
    phase: options.visualState.phase,
  });
  updateArenaVisualDataset(options.screen, options.visualState, options.combatState.wishcraftLoadout);
  drawArenaHorizon(options.horizon, options.visualState, phaseTint.color, options.combatState.activeCombatSeconds);
  drawBossPresenceVfx(options.bossPresence, {
    bossState: options.bossState,
    nowSeconds: options.combatState.activeCombatSeconds,
    player: options.combatState.player.position,
  });
  drawBossEncounterVfx(options.bossEncounter, {
    bossState: options.bossState,
    nowSeconds: options.combatState.activeCombatSeconds,
    player: options.combatState.player.position,
  });
  drawLateRunFieldVfx(options.lateRunField, {
    activeBossCount: options.bossState.bosses.length,
    bossKills: options.combatState.bossKills,
    level: options.combatState.levelState.level,
    loadout: options.combatState.wishcraftLoadout,
    nowSeconds: options.combatState.activeCombatSeconds,
    phase: options.bossState.phase,
    player: options.combatState.player.position,
  });
  drawPersistentWishcraftSourceVfx(options.persistentSourceVfx, {
    nowSeconds: options.combatState.activeCombatSeconds,
    player: options.combatState.player.position,
    runtime: options.combatState.wishcraftRuntime,
    xpShards: options.combatState.xpShards,
  });
  syncBossGraphics({
    bossState: options.bossState,
    Graphics: options.Graphics,
    layer: options.enemyLayer,
    nowSeconds: options.combatState.activeCombatSeconds,
    player: options.combatState.player.position,
    renderCache: options.renderCache,
    visualPolishVersion: VISUAL_POLISH_VERSION,
  });
  const playerVisuals = assembleRuntimeVisuals({
    catalog: wishcraftCatalog,
    entityRole: "player",
    loadout: options.combatState.wishcraftLoadout,
    budget: createVisualBudget("player"),
  });
  syncPlayerVisualAttachments({
    attachmentLayer: options.playerAttachmentLayer,
    Graphics: options.Graphics,
    nowSeconds: options.combatState.activeCombatSeconds,
    player: options.combatState.player.position,
    renderCache: options.renderCache,
    visualPolishVersion: VISUAL_POLISH_VERSION,
    visuals: playerVisuals,
  });
  syncScreenEffects({
    effectLayer: options.screenEffectLayer,
    Graphics: options.Graphics,
    nowSeconds: options.combatState.activeCombatSeconds,
    player: options.combatState.player.position,
    renderCache: options.renderCache,
    visualPolishVersion: VISUAL_POLISH_VERSION,
    visuals: playerVisuals,
  });
  drawPlayerReadabilityVfx(options.playerReadabilityField, {
    activeBossCount: options.bossState.phase === "active" ? options.bossState.bosses.length : 0,
    enemyCount: options.combatState.enemies.length,
    feedbackCount: options.combatState.feedback.length,
    level: options.combatState.levelState.level,
    loadoutSize: options.combatState.wishcraftLoadout.length,
    nowSeconds: options.combatState.activeCombatSeconds,
    player: options.combatState.player.position,
  });

  syncGraphicsMap<CombatLoopState["xpShards"][number], PixiGraphics, PixiGraphicsCtor>({
    Graphics: options.Graphics,
    items: options.combatState.xpShards,
    layer: options.xpLayer,
    cache: options.renderCache.xpShards,
    create: (Graphics) => {
      const graphic = createXpShardGraphic(Graphics);
      graphic.rotation = Math.PI / 4;
      return graphic;
    },
    update: (graphic, shard) => {
      graphic.position.set(shard.position.x, shard.position.y);
      redrawXpShardGraphic(graphic, {
        attracted: shard.attracted,
        nowSeconds: options.combatState.activeCombatSeconds,
        playerOffset: {
          x: options.combatState.player.position.x - shard.position.x,
          y: options.combatState.player.position.y - shard.position.y,
        },
        value: shard.value,
      });
      graphic.rotation += shard.attracted ? 0.08 : 0.03;
      graphic.scale.set(shard.attracted ? 1.12 : 1);
    },
  });

  syncGraphicsMap<CombatLoopState["enemies"][number], PixiGraphics, PixiGraphicsCtor>({
    Graphics: options.Graphics,
    items: options.combatState.enemies,
    layer: options.enemyLayer,
    cache: options.renderCache.enemies,
    cacheKey: (enemy) => {
      const visuals = assembleRuntimeVisuals({
        catalog: wishcraftCatalog,
        entityRole: "common-enemy",
        loadout: options.combatState.wishcraftLoadout.slice(-2),
        budget: createVisualBudget("common-enemy"),
      });
      const drift = enemyDriftFromLoadout(options.combatState.wishcraftLoadout);
      return `${visualCacheKeyForEntity(enemy.id, "common-enemy", visuals)}:${drift.dominantThemeId ?? "base"}:${drift.secondaryThemeIds.join(",")}`;
    },
    create: (Graphics, enemy) => {
      const driftVisuals = assembleRuntimeVisuals({
        catalog: wishcraftCatalog,
        entityRole: "common-enemy",
        loadout: options.combatState.wishcraftLoadout.slice(-2),
        budget: createVisualBudget("common-enemy"),
      });
      return createCommonEnemyGraphic({
        animation: enemySpriteAnimationState({
          damaged: enemy.health < maxEnemyHealthForVisual(enemy),
          id: enemy.id,
          nowSeconds: options.combatState.activeCombatSeconds,
          templateId: enemy.templateId,
        }),
        drift: enemyDriftFromLoadout(options.combatState.wishcraftLoadout),
        enemy,
        Graphics,
        visuals: driftVisuals,
      });
    },
    update: (graphic, enemy) => {
      const driftVisuals = assembleRuntimeVisuals({
        catalog: wishcraftCatalog,
        entityRole: "common-enemy",
        loadout: options.combatState.wishcraftLoadout.slice(-2),
        budget: createVisualBudget("common-enemy"),
      });
      const animation = enemySpriteAnimationState({
        damaged: enemy.health < maxEnemyHealthForVisual(enemy),
        id: enemy.id,
        nowSeconds: options.combatState.activeCombatSeconds,
        templateId: enemy.templateId,
      });
      redrawCommonEnemyGraphic(graphic, {
        animation,
        drift: enemyDriftFromLoadout(options.combatState.wishcraftLoadout),
        enemy,
        visuals: driftVisuals,
      });
      graphic.position.set(enemy.position.x + animation.recoilX, enemy.position.y + animation.recoilY);
      const wobbleSeed = Number(enemy.id.replace(/\D/g, "").slice(-3)) || 0;
      graphic.rotation = Math.sin(options.combatState.activeCombatSeconds * 2.5 + wobbleSeed) * 0.045;
      graphic.scale.set(1 + Math.sin(options.combatState.activeCombatSeconds * 3.2 + wobbleSeed) * 0.025);
    },
  });

  syncGraphicsMap<CombatLoopState["wishcraftRuntime"]["summons"][number], PixiGraphics, PixiGraphicsCtor>({
    Graphics: options.Graphics,
    items: options.combatState.wishcraftRuntime.summons,
    layer: options.summonLayer,
    cache: options.renderCache.summons,
    cacheKey: (summon) => {
      const visuals = assembleRuntimeVisuals({
        catalog: wishcraftCatalog,
        entityRole: "summon",
        loadout: options.combatState.wishcraftLoadout.filter((craft) => craft.id === summon.craftId),
        budget: createVisualBudget("summon"),
      });
      return visualCacheKeyForEntity(summon.id, "summon", visuals);
    },
    create: (Graphics, summon) => {
      const summonVisuals = assembleRuntimeVisuals({
        catalog: wishcraftCatalog,
        entityRole: "summon",
        loadout: options.combatState.wishcraftLoadout.filter((craft) => craft.id === summon.craftId),
        budget: createVisualBudget("summon"),
      });
      return createSummonGraphic({
        Graphics,
        orbitRadius: summon.orbitRadius,
        visuals: summonVisuals,
      });
    },
    update: (graphic, summon) => {
      graphic.position.set(summon.position.x, summon.position.y);
      const pulse = 1 + Math.sin(options.combatState.activeCombatSeconds * 7.5 + summon.orbitRadius) * 0.08;
      graphic.scale.set(pulse);
      graphic.rotation += 0.04;
    },
  });

  syncFeedbackGraphics({
    feedback: options.combatState.feedback,
    feedbackLayer: options.feedbackLayer,
    Graphics: options.Graphics,
    launchLayer: options.launchLayer,
    loadout: options.combatState.wishcraftLoadout,
    nowSeconds: options.combatState.activeCombatSeconds,
    playerVisuals,
    projectileLayer: options.projectileLayer,
    renderCache: options.renderCache,
    screenPulseLayer: options.screenPulseLayer,
    summons: options.combatState.wishcraftRuntime.summons,
    trailResidueLayer: options.trailResidueLayer,
    wishcraftPatternLayer: options.wishcraftPatternLayer,
  });
}

function maxEnemyHealthForVisual(enemy: CombatLoopState["enemies"][number]): number {
  if (enemy.templateId === "fast-fragile") {
    return 9;
  }
  if (enemy.templateId === "slow-tough") {
    return 24;
  }
  return 6;
}

function updateArenaVisualDataset(
  screen: HTMLElement,
  visualState: ArenaVisualState,
  loadout: readonly Wishcraft[],
): void {
  const tint = phaseTintFromLoadout({
    loadout,
    phase: visualState.phase,
  });
  screen.dataset.arenaPhase = visualState.phase.id;
  screen.dataset.arenaTintTheme = tint.themeId ?? "";
}
