import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";
import {
  createFeedbackGraphic,
} from "../visual/combat-feedback-vfx.js";
import {
  baseKitVfxProgress,
  createBaseKitVfxGraphic,
  updateBaseKitVfxGraphic,
  type ActiveBaseKitGraphic,
} from "../visual/base-kit-vfx.js";
import {
  resolveBaseKitEmitterSocket,
  withBaseKitEmitterOrigin,
} from "../visual/base-kit-emitter-sockets.js";
import type { RuntimeVisualAssembly } from "../visual/visual-assembly.js";
import {
  resolveWishcraftEmitterSocket,
  withWishcraftEmitterOrigin,
} from "../visual/wishcraft-emitter-sockets.js";
import {
  resolveSummonEmitterSocket,
  withSummonEmitterOrigin,
} from "../visual/summon-emitter-sockets.js";
import type { WishcraftSummon } from "../simulation/wishcraft-mechanics.js";
import {
  createLaunchVfxGraphic,
  launchVfxProgress,
  updateLaunchVfxGraphic,
  type ActiveLaunchGraphic,
} from "../visual/wishcraft-launch-vfx.js";
import {
  createParticleCloudVfxGraphic,
  particleCloudProgress,
  updateParticleCloudVfxGraphic,
  type ActiveParticleCloudGraphic,
} from "../visual/wishcraft-particle-cloud-vfx.js";
import {
  createProjectileVfxGraphic,
  projectileVfxProgress,
  updateProjectileVfxGraphic,
  type ActiveProjectileGraphic,
} from "../visual/wishcraft-projectile-vfx.js";
import {
  createScreenPulseVfxGraphic,
  screenPulseProgress,
  updateScreenPulseVfxGraphic,
  type ActiveScreenPulseGraphic,
} from "../visual/wishcraft-screen-pulse-vfx.js";
import {
  createWishcraftPatternGraphic,
  updateWishcraftPatternGraphic,
  wishcraftPatternProgress,
  type ActiveWishcraftPatternGraphic,
} from "../visual/wishcraft-pattern-vfx.js";
import {
  createTrailResidueGraphic,
  trailResidueProgress,
  updateTrailResidueGraphic,
  type ActiveTrailResidueGraphic,
} from "../visual/wishcraft-trail-vfx.js";
import {
  createWishcraftSpectacleGraphic,
  updateWishcraftSpectacleGraphic,
  wishcraftSpectacleProgress,
  type ActiveWishcraftSpectacleGraphic,
} from "../visual/wishcraft-spectacle-vfx.js";
import {
  createWishcraftCinematicGraphic,
  updateWishcraftCinematicGraphic,
  wishcraftCinematicProgress,
  type ActiveWishcraftCinematicGraphic,
} from "../visual/wishcraft-cinematic-vfx.js";
import {
  createWishcraftEvolvedGraphic,
  updateWishcraftEvolvedGraphic,
  wishcraftEvolvedProgress,
  type ActiveWishcraftEvolvedGraphic,
} from "../visual/wishcraft-evolved-vfx.js";

type PixiContainer = import("pixi.js").Container;
type PixiGraphics = import("pixi.js").Graphics;
type PixiGraphicsCtor = typeof import("pixi.js").Graphics;

export const MAX_FEEDBACK_GRAPHICS_PER_FRAME = 80;

interface ActiveFeedbackGraphic {
  bornAtSeconds: number;
  graphic: PixiGraphics;
  ttlSeconds: number;
}

export interface FeedbackRenderCache {
  baseKitVfx: ActiveBaseKitGraphic[];
  cinematicVfx: ActiveWishcraftCinematicGraphic[];
  evolvedVfx: ActiveWishcraftEvolvedGraphic[];
  feedback: ActiveFeedbackGraphic[];
  lastFeedbackClockSeconds: number;
  lastFeedbackSignature: string;
  launchVfx: ActiveLaunchGraphic[];
  particleCloudVfx: ActiveParticleCloudGraphic[];
  projectileVfx: ActiveProjectileGraphic[];
  patternVfx: ActiveWishcraftPatternGraphic[];
  screenPulseVfx: ActiveScreenPulseGraphic[];
  spectacleVfx: ActiveWishcraftSpectacleGraphic[];
  trailResidueVfx: ActiveTrailResidueGraphic[];
}

export function selectBudgetedFeedback<TFeedback>(feedback: readonly TFeedback[]): TFeedback[] {
  return feedback.slice(0, MAX_FEEDBACK_GRAPHICS_PER_FRAME);
}

export function syncFeedbackGraphics(options: {
  feedback: readonly CombatFeedback[];
  feedbackLayer: PixiContainer;
  Graphics: PixiGraphicsCtor;
  launchLayer: PixiContainer;
  loadout: readonly Wishcraft[];
  nowSeconds: number;
  playerVisuals: RuntimeVisualAssembly;
  projectileLayer: PixiContainer;
  renderCache: FeedbackRenderCache;
  screenPulseLayer: PixiContainer;
  summons: readonly WishcraftSummon[];
  trailResidueLayer: PixiContainer;
  wishcraftPatternLayer: PixiContainer;
}): void {
  const signature = feedbackSignature(options.feedback);
  if (signature !== options.renderCache.lastFeedbackSignature) {
    const newlyVisibleFeedback = options.nowSeconds >= options.renderCache.lastFeedbackClockSeconds
      ? options.feedback
      : [];
    for (const event of selectBudgetedFeedback(newlyVisibleFeedback)) {
      const effect = createFeedbackGraphic(event, options.Graphics, options.loadout);
      if (effect) {
        options.feedbackLayer.addChild(effect.graphic);
        options.renderCache.feedback.push({
          bornAtSeconds: options.nowSeconds,
          graphic: effect.graphic,
          ttlSeconds: effect.ttlSeconds,
        });
      }

      const visualEvent = withSummonEmitterOrigin(
        withWishcraftEmitterOrigin(
          event,
          resolveWishcraftEmitterSocket({
            event,
            loadout: options.loadout,
            visuals: options.playerVisuals,
          }),
        ),
        resolveSummonEmitterSocket({
          event,
          summons: options.summons,
        }),
      );
      const baseKitEvent = withBaseKitEmitterOrigin(
        visualEvent,
        resolveBaseKitEmitterSocket({ event: visualEvent }),
      );
      const baseKit = createBaseKitVfxGraphic(baseKitEvent, options.Graphics);
      if (baseKit) {
        options.projectileLayer.addChild(baseKit.graphic);
        options.renderCache.baseKitVfx.push({
          ...baseKit,
          bornAtSeconds: options.nowSeconds,
        });
      }
      const projectile = createProjectileVfxGraphic(visualEvent, options.Graphics, options.loadout);
      if (projectile) {
        options.projectileLayer.addChild(projectile.graphic);
        options.renderCache.projectileVfx.push({
          ...projectile,
          bornAtSeconds: options.nowSeconds,
        });
      }
      const launch = createLaunchVfxGraphic(visualEvent, options.Graphics, options.loadout);
      if (launch) {
        options.launchLayer.addChild(launch.graphic);
        options.renderCache.launchVfx.push({
          ...launch,
          bornAtSeconds: options.nowSeconds,
        });
      }
      const particleCloud = createParticleCloudVfxGraphic(visualEvent, options.Graphics, options.loadout);
      if (particleCloud) {
        options.feedbackLayer.addChild(particleCloud.graphic);
        options.renderCache.particleCloudVfx.push({
          ...particleCloud,
          bornAtSeconds: options.nowSeconds,
        });
      }
      const screenPulse = createScreenPulseVfxGraphic(visualEvent, options.Graphics, options.loadout);
      if (screenPulse) {
        options.screenPulseLayer.addChild(screenPulse.graphic);
        options.renderCache.screenPulseVfx.push({
          ...screenPulse,
          bornAtSeconds: options.nowSeconds,
        });
      }
      const pattern = createWishcraftPatternGraphic(visualEvent, options.Graphics, options.loadout);
      if (pattern) {
        options.wishcraftPatternLayer.addChild(pattern.graphic);
        options.renderCache.patternVfx.push({
          ...pattern,
          bornAtSeconds: options.nowSeconds,
        });
      }
      const evolved = createWishcraftEvolvedGraphic(visualEvent, options.Graphics, options.loadout);
      if (evolved) {
        options.wishcraftPatternLayer.addChild(evolved.graphic);
        options.renderCache.evolvedVfx.push({
          ...evolved,
          bornAtSeconds: options.nowSeconds,
        });
      }
      const trail = createTrailResidueGraphic(visualEvent, options.Graphics, options.loadout);
      if (trail) {
        options.trailResidueLayer.addChild(trail.graphic);
        options.renderCache.trailResidueVfx.push({
          ...trail,
          bornAtSeconds: options.nowSeconds,
        });
      }
      const spectacle = createWishcraftSpectacleGraphic(visualEvent, options.Graphics, options.loadout);
      if (spectacle) {
        options.screenPulseLayer.addChild(spectacle.graphic);
        options.renderCache.spectacleVfx.push({
          ...spectacle,
          bornAtSeconds: options.nowSeconds,
        });
      }
      const cinematic = createWishcraftCinematicGraphic(visualEvent, options.Graphics, options.loadout);
      if (cinematic) {
        options.screenPulseLayer.addChild(cinematic.graphic);
        options.renderCache.cinematicVfx.push({
          ...cinematic,
          bornAtSeconds: options.nowSeconds,
        });
      }
    }
    options.renderCache.lastFeedbackSignature = signature;
  }
  options.renderCache.lastFeedbackClockSeconds = options.nowSeconds;

  syncImpactFeedback(options);
  syncBaseKitFeedback(options);
  syncProjectileFeedback(options);
  syncLaunchFeedback(options);
  syncParticleCloudFeedback(options);
  syncScreenPulseFeedback(options);
  syncPatternFeedback(options);
  syncEvolvedFeedback(options);
  syncTrailResidueFeedback(options);
  syncSpectacleFeedback(options);
  syncCinematicFeedback(options);
}

function syncBaseKitFeedback(options: {
  nowSeconds: number;
  renderCache: FeedbackRenderCache;
}): void {
  const survivors: ActiveBaseKitGraphic[] = [];
  for (const effect of options.renderCache.baseKitVfx) {
    const progress = baseKitVfxProgress({
      bornAtSeconds: effect.bornAtSeconds,
      nowSeconds: options.nowSeconds,
      ttlSeconds: effect.ttlSeconds,
    });
    if (progress >= 1) {
      effect.graphic.destroy();
      continue;
    }
    updateBaseKitVfxGraphic(effect, progress);
    survivors.push(effect);
  }
  options.renderCache.baseKitVfx = survivors;
}

function syncImpactFeedback(options: {
  nowSeconds: number;
  renderCache: FeedbackRenderCache;
}): void {
  const survivors: ActiveFeedbackGraphic[] = [];
  for (const effect of options.renderCache.feedback) {
    const age = Math.max(0, options.nowSeconds - effect.bornAtSeconds);
    const progress = Math.min(1, age / effect.ttlSeconds);
    if (progress >= 1) {
      effect.graphic.destroy();
      continue;
    }
    effect.graphic.alpha = 1 - progress * progress;
    const scale = 1 + progress * 1.45;
    effect.graphic.scale.set(scale);
    effect.graphic.rotation += 0.018 + progress * 0.014;
    survivors.push(effect);
  }
  options.renderCache.feedback = survivors;
}

function syncProjectileFeedback(options: {
  nowSeconds: number;
  renderCache: FeedbackRenderCache;
}): void {
  const survivors: ActiveProjectileGraphic[] = [];
  for (const projectile of options.renderCache.projectileVfx) {
    const progress = projectileVfxProgress({
      bornAtSeconds: projectile.bornAtSeconds,
      nowSeconds: options.nowSeconds,
      ttlSeconds: projectile.ttlSeconds,
    });
    if (progress >= 1) {
      projectile.graphic.destroy();
      continue;
    }
    updateProjectileVfxGraphic(projectile, progress);
    survivors.push(projectile);
  }
  options.renderCache.projectileVfx = survivors;
}

function syncLaunchFeedback(options: {
  nowSeconds: number;
  renderCache: FeedbackRenderCache;
}): void {
  const survivors: ActiveLaunchGraphic[] = [];
  for (const launch of options.renderCache.launchVfx) {
    const progress = launchVfxProgress({
      bornAtSeconds: launch.bornAtSeconds,
      nowSeconds: options.nowSeconds,
      ttlSeconds: launch.ttlSeconds,
    });
    if (progress >= 1) {
      launch.graphic.destroy();
      continue;
    }
    updateLaunchVfxGraphic(launch, progress);
    survivors.push(launch);
  }
  options.renderCache.launchVfx = survivors;
}

function syncTrailResidueFeedback(options: {
  nowSeconds: number;
  renderCache: FeedbackRenderCache;
}): void {
  const survivors: ActiveTrailResidueGraphic[] = [];
  for (const trail of options.renderCache.trailResidueVfx) {
    const progress = trailResidueProgress({
      bornAtSeconds: trail.bornAtSeconds,
      nowSeconds: options.nowSeconds,
      ttlSeconds: trail.ttlSeconds,
    });
    if (progress >= 1) {
      trail.graphic.destroy();
      continue;
    }
    updateTrailResidueGraphic(trail, progress);
    survivors.push(trail);
  }
  options.renderCache.trailResidueVfx = survivors;
}

function syncParticleCloudFeedback(options: {
  nowSeconds: number;
  renderCache: FeedbackRenderCache;
}): void {
  const survivors: ActiveParticleCloudGraphic[] = [];
  for (const cloud of options.renderCache.particleCloudVfx) {
    const progress = particleCloudProgress({
      bornAtSeconds: cloud.bornAtSeconds,
      nowSeconds: options.nowSeconds,
      ttlSeconds: cloud.ttlSeconds,
    });
    if (progress >= 1) {
      cloud.graphic.destroy();
      continue;
    }
    updateParticleCloudVfxGraphic(cloud, progress);
    survivors.push(cloud);
  }
  options.renderCache.particleCloudVfx = survivors;
}

function syncScreenPulseFeedback(options: {
  nowSeconds: number;
  renderCache: FeedbackRenderCache;
}): void {
  const survivors: ActiveScreenPulseGraphic[] = [];
  for (const pulse of options.renderCache.screenPulseVfx) {
    const progress = screenPulseProgress({
      bornAtSeconds: pulse.bornAtSeconds,
      nowSeconds: options.nowSeconds,
      ttlSeconds: pulse.ttlSeconds,
    });
    if (progress >= 1) {
      pulse.graphic.destroy();
      continue;
    }
    updateScreenPulseVfxGraphic(pulse, progress);
    survivors.push(pulse);
  }
  options.renderCache.screenPulseVfx = survivors;
}

function syncPatternFeedback(options: {
  nowSeconds: number;
  renderCache: FeedbackRenderCache;
}): void {
  const survivors: ActiveWishcraftPatternGraphic[] = [];
  for (const pattern of options.renderCache.patternVfx) {
    const progress = wishcraftPatternProgress({
      bornAtSeconds: pattern.bornAtSeconds,
      nowSeconds: options.nowSeconds,
      ttlSeconds: pattern.ttlSeconds,
    });
    if (progress >= 1) {
      pattern.graphic.destroy();
      continue;
    }
    updateWishcraftPatternGraphic(pattern, progress);
    survivors.push(pattern);
  }
  options.renderCache.patternVfx = survivors;
}

function syncEvolvedFeedback(options: {
  nowSeconds: number;
  renderCache: FeedbackRenderCache;
}): void {
  const survivors: ActiveWishcraftEvolvedGraphic[] = [];
  for (const evolved of options.renderCache.evolvedVfx) {
    const progress = wishcraftEvolvedProgress({
      bornAtSeconds: evolved.bornAtSeconds,
      nowSeconds: options.nowSeconds,
      ttlSeconds: evolved.ttlSeconds,
    });
    if (progress >= 1) {
      evolved.graphic.destroy();
      continue;
    }
    updateWishcraftEvolvedGraphic(evolved, progress);
    survivors.push(evolved);
  }
  options.renderCache.evolvedVfx = survivors;
}

function syncSpectacleFeedback(options: {
  nowSeconds: number;
  renderCache: FeedbackRenderCache;
}): void {
  const survivors: ActiveWishcraftSpectacleGraphic[] = [];
  for (const spectacle of options.renderCache.spectacleVfx) {
    const progress = wishcraftSpectacleProgress({
      bornAtSeconds: spectacle.bornAtSeconds,
      nowSeconds: options.nowSeconds,
      ttlSeconds: spectacle.ttlSeconds,
    });
    if (progress >= 1) {
      spectacle.graphic.destroy();
      continue;
    }
    updateWishcraftSpectacleGraphic(spectacle, progress);
    survivors.push(spectacle);
  }
  options.renderCache.spectacleVfx = survivors;
}

function syncCinematicFeedback(options: {
  nowSeconds: number;
  renderCache: FeedbackRenderCache;
}): void {
  const survivors: ActiveWishcraftCinematicGraphic[] = [];
  for (const cinematic of options.renderCache.cinematicVfx) {
    const progress = wishcraftCinematicProgress({
      bornAtSeconds: cinematic.bornAtSeconds,
      nowSeconds: options.nowSeconds,
      ttlSeconds: cinematic.ttlSeconds,
    });
    if (progress >= 1) {
      cinematic.graphic.destroy();
      continue;
    }
    updateWishcraftCinematicGraphic(cinematic, progress);
    survivors.push(cinematic);
  }
  options.renderCache.cinematicVfx = survivors;
}

function feedbackSignature(feedback: readonly CombatFeedback[]): string {
  return feedback
    .map((event) => {
      if ("position" in event) {
        const template = "templateId" in event ? event.templateId ?? "" : "";
        const targetTemplate = "targetTemplateId" in event ? event.targetTemplateId ?? "" : "";
        const radius = "radius" in event ? event.radius?.toFixed(1) ?? "" : "";
        const targetRadius = "targetRadius" in event ? event.targetRadius?.toFixed(1) ?? "" : "";
        return `${event.kind}:${event.position.x.toFixed(1)}:${event.position.y.toFixed(1)}:${"visualKind" in event ? event.visualKind : ""}:${"wishcraftId" in event ? event.wishcraftId : ""}:${template}:${radius}:${targetTemplate}:${targetRadius}`;
      }
      return event.kind;
    })
    .join("|");
}
