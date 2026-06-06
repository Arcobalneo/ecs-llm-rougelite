import { describe, expect, it } from "vitest";
import {
  assembleRuntimeVisuals,
  createVisualBudget,
  layoutRuntimeVisualAttachments,
} from "../../src/client/visual/visual-assembly.js";
import {
  MAX_FEEDBACK_GRAPHICS_PER_FRAME,
  selectBudgetedFeedback,
  VISUAL_POLISH_VERSION,
  visualCacheKeyForEntity,
} from "../../src/client/rendering/combat-renderer.js";
import { paletteForWishcraftFeedback } from "../../src/client/visual/wishcraft-vfx-palette.js";
import {
  projectileVfxBodyLength,
  projectileVfxProgress,
  shouldCreateProjectileVfx,
} from "../../src/client/visual/wishcraft-projectile-vfx.js";
import {
  particleCloudParticleCount,
  particleCloudProgress,
  shouldCreateParticleCloudVfx,
} from "../../src/client/visual/wishcraft-particle-cloud-vfx.js";
import {
  screenPulseIntensity,
  screenPulseProgress,
  shouldCreateScreenPulseVfx,
} from "../../src/client/visual/wishcraft-screen-pulse-vfx.js";
import {
  baseKitVfxProgress,
  shouldCreateBaseKitVfx,
} from "../../src/client/visual/base-kit-vfx.js";
import {
  xpMagnetTrailSegmentCount,
} from "../../src/client/visual/sprites/xp-shard-sprite.js";
import {
  bossPresenceRingCount,
} from "../../src/client/visual/boss-presence-vfx.js";
import {
  launchVfxProgress,
  shouldCreateLaunchVfx,
} from "../../src/client/visual/wishcraft-launch-vfx.js";
import {
  shouldCreateTrailResidueVfx,
  trailResidueProgress,
} from "../../src/client/visual/wishcraft-trail-vfx.js";
import {
  enemySpriteAnimationState,
  playerMechAnimationState,
} from "../../src/client/visual/combat-entity-animation.js";
import {
  drawCableBundle,
  drawDragonSpine,
  drawHeatSinkStack,
  drawMechFaceplate,
  drawPanelSeams,
  drawRivetCluster,
  drawWeaponRail,
  drawWingStruts,
} from "../../src/client/visual/mech-detail-primitives.js";
import {
  resolveWishcraftEmitterSocket,
  withWishcraftEmitterOrigin,
} from "../../src/client/visual/wishcraft-emitter-sockets.js";
import {
  resolveSummonEmitterSocket,
  withSummonEmitterOrigin,
} from "../../src/client/visual/summon-emitter-sockets.js";
import {
  knownWishcraftThemeMotifCount,
  motifForTheme,
} from "../../src/client/visual/wishcraft-theme-motifs.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";
import type { Wishcraft } from "../../src/shared/wishcraft/types.js";

describe("Visual Assembly runtime", () => {
  it("assembles legal Visual Pieces into role-scaled attachments without mechanic fields", () => {
    const visuals = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "player",
      loadout: [wishcraftCatalog.fixtures.starLance, wishcraftCatalog.fixtures.gravityOrbiter],
      budget: createVisualBudget("player"),
    });

    expect(visuals.warnings).toEqual([]);
    expect(visuals.attachments.map((attachment) => attachment.slot)).toEqual(
      expect.arrayContaining(["aura", "projectile", "trail", "summon"]),
    );
    expect(visuals.attachments.every((attachment) => attachment.scale === 1)).toBe(true);
    expect(visuals.attachments.some((attachment) => attachment.supportsParticles)).toBe(true);
    expect(visuals.screenEffects.length).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(visuals)).not.toContain("damageScale");
    expect(JSON.stringify(visuals)).not.toContain("mechanicPieceId");
  });

  it("uses shared attachment semantics across player, summon, common enemy, and boss placeholder roles", () => {
    const player = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "player",
      loadout: [wishcraftCatalog.fixtures.starLance],
      budget: createVisualBudget("player"),
    });
    const summon = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "summon",
      loadout: [wishcraftCatalog.fixtures.gravityOrbiter],
      budget: createVisualBudget("summon"),
    });
    const commonEnemy = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "common-enemy",
      loadout: [wishcraftCatalog.fixtures.starLance],
      budget: createVisualBudget("common-enemy"),
    });
    const boss = assembleRuntimeVisuals({
      bossSilhouette: "flying",
      catalog: wishcraftCatalog,
      entityRole: "boss-placeholder",
      loadout: [wishcraftCatalog.fixtures.starLance, wishcraftCatalog.fixtures.gravityOrbiter],
      budget: createVisualBudget("boss-placeholder"),
    });

    expect(summon.attachments.every((attachment) => attachment.scale <= 0.9)).toBe(true);
    expect(commonEnemy.attachments.every((attachment) => attachment.scale <= 0.65)).toBe(true);
    expect(Math.max(...boss.attachments.map((attachment) => attachment.scale))).toBeGreaterThan(
      Math.max(...player.attachments.map((attachment) => attachment.scale)),
    );
    expect(boss.silhouette).toBe("flying");
  });

  it("degrades by runtime visual budgets while keeping high-priority readable pieces", () => {
    const loadout = repeatWishcraft(
      {
        ...wishcraftCatalog.fixtures.starLance,
        visualPieceIds: [...wishcraftCatalog.fixtures.starLance.visualPieceIds, "orbit-starfire-3"],
      },
      8,
    );

    const visuals = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "player",
      loadout,
      budget: {
        ...createVisualBudget("player"),
        maxAttachments: 5,
        maxAuras: 1,
        maxGlowEffects: 2,
        maxParticleEmitters: 3,
        maxTrails: 1,
        maxWarnings: 8,
      },
    });

    expect(visuals.attachments).toHaveLength(5);
    expect(visuals.attachments.filter((attachment) => attachment.slot === "aura")).toHaveLength(1);
    expect(visuals.attachments.some((attachment) => attachment.slot === "orbit")).toBe(true);
    expect(visuals.particleEmitters.length).toBeLessThanOrEqual(3);
    expect(visuals.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "visual-budget-degraded", severity: "warn" }),
      ]),
    );
  });

  it("budgets impact and low-frequency screen-space effects separately from attachments", () => {
    const stormImpact: Wishcraft = {
      ...wishcraftCatalog.fixtures.starLance,
      id: "wishcraft-storm-impact",
      primaryThemeId: "storm",
      visualPieceIds: ["impact-storm-0", "core-storm-2", "head-storm-3"],
    };

    const visuals = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "player",
      loadout: [stormImpact, ...repeatWishcraft(stormImpact, 4)],
      budget: {
        ...createVisualBudget("player"),
        maxGlowEffects: 3,
        maxImpactEffects: 2,
        maxScreenEffects: 2,
      },
    });

    expect(visuals.impactEffects).toHaveLength(2);
    expect(visuals.screenEffects.length).toBeLessThanOrEqual(2);
    expect(visuals.glowEffects.length).toBeLessThanOrEqual(3);
    expect(visuals.impactEffects.every((effect) => effect.slot === "impact")).toBe(true);
  });

  it("reports structured degradation when non-attachment visual budgets truncate effects", () => {
    const starOrbit: Wishcraft = {
      ...wishcraftCatalog.fixtures.starLance,
      id: "wishcraft-star-orbit",
      visualPieceIds: ["aura-starfire-0", "projectile-starfire-1", "trail-starfire-2", "orbit-starfire-3"],
    };
    const stormImpact: Wishcraft = {
      ...wishcraftCatalog.fixtures.starLance,
      id: "wishcraft-storm-impact",
      primaryThemeId: "storm",
      visualPieceIds: ["impact-storm-0", "core-storm-2", "head-storm-3"],
    };

    const visuals = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "player",
      loadout: [starOrbit, stormImpact],
      budget: {
        ...createVisualBudget("player"),
        maxGlowEffects: 1,
        maxImpactEffects: 0,
        maxParticleEmitters: 1,
        maxScreenEffects: 1,
      },
    });

    expect(visuals.glowEffects).toHaveLength(1);
    expect(visuals.impactEffects).toHaveLength(0);
    expect(visuals.particleEmitters).toHaveLength(1);
    expect(visuals.screenEffects).toHaveLength(1);
    expect(visuals.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ budget: "maxGlowEffects", code: "visual-budget-degraded" }),
        expect.objectContaining({ budget: "maxImpactEffects", code: "visual-budget-degraded" }),
        expect.objectContaining({ budget: "maxParticleEmitters", code: "visual-budget-degraded" }),
        expect.objectContaining({ budget: "maxScreenEffects", code: "visual-budget-degraded" }),
      ]),
    );
  });

  it("lays out repeated slots by per-slot index instead of global attachment order", () => {
    const visuals = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "player",
      loadout: [
        {
          ...wishcraftCatalog.fixtures.starLance,
          id: "wishcraft-layout-test",
          visualPieceIds: [
            "aura-starfire-0",
            "projectile-starfire-1",
            "trail-starfire-2",
            "orbit-starfire-3",
          ],
        },
      ],
      budget: createVisualBudget("player"),
    });

    const layouts = layoutRuntimeVisualAttachments(visuals.attachments);

    expect(layouts.find((layout) => layout.attachment.slot === "aura")?.slotIndex).toBe(0);
    expect(layouts.find((layout) => layout.attachment.slot === "trail")?.slotIndex).toBe(0);
    expect(layouts.find((layout) => layout.attachment.slot === "orbit")?.slotIndex).toBe(0);
  });

  it("resolves long-range Wishcraft VFX from mech weapon sockets instead of the player center", () => {
    const weaponCraft: Wishcraft = {
      ...wishcraftCatalog.fixtures.starLance,
      id: "wishcraft-emitter-weapon",
      primaryThemeId: "void",
      visualPieceIds: ["shoulder-void-0", "back-void-1", "weapon-void-2"],
    };
    const visuals = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "player",
      loadout: [weaponCraft],
      budget: createVisualBudget("player"),
    });
    const event = {
      kind: "wishcraft-hit" as const,
      mechanicId: "projectile-lance",
      origin: { x: 100, y: 200 },
      position: { x: 220, y: 200 },
      visualKind: "lance",
      wishcraftId: weaponCraft.id,
    };

    const socket = resolveWishcraftEmitterSocket({
      event,
      loadout: [weaponCraft],
      visuals,
    });
    const visualEvent = withWishcraftEmitterOrigin(event, socket);

    expect(socket?.slot).toBe("weapon");
    expect(visualEvent.kind === "wishcraft-hit" ? visualEvent.origin : undefined).toEqual({ x: 76, y: 200 });
    expect(event.origin).toEqual({ x: 100, y: 200 });
  });

  it("keeps the original origin when a Wishcraft has no suitable emitter attachment", () => {
    const auraOnlyCraft: Wishcraft = {
      ...wishcraftCatalog.fixtures.starLance,
      id: "wishcraft-emitter-fallback",
      visualPieceIds: ["aura-starfire-0"],
    };
    const visuals = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "player",
      loadout: [auraOnlyCraft],
      budget: createVisualBudget("player"),
    });
    const event = {
      kind: "wishcraft-hit" as const,
      mechanicId: "projectile-lance",
      origin: { x: 40, y: 50 },
      position: { x: 160, y: 50 },
      visualKind: "lance",
      wishcraftId: auraOnlyCraft.id,
    };

    const socket = resolveWishcraftEmitterSocket({
      event,
      loadout: [auraOnlyCraft],
      visuals,
    });

    expect(socket).toEqual({
      origin: { x: 40, y: 50 },
      slotIndex: -1,
    });
  });

  it("selects different emitter sockets for projectile, area, and melee visual families", () => {
    const projectileCraft: Wishcraft = {
      ...wishcraftCatalog.fixtures.starLance,
      id: "wishcraft-emitter-family-projectile",
      primaryThemeId: "void",
      visualPieceIds: ["shoulder-void-0", "back-void-1", "weapon-void-2"],
    };
    const coreArmCraft: Wishcraft = {
      ...wishcraftCatalog.fixtures.starLance,
      id: "wishcraft-emitter-family-core-arm",
      primaryThemeId: "gravity",
      visualPieceIds: ["summon-gravity-0", "core-gravity-1", "arm-gravity-3"],
    };
    const visuals = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "player",
      loadout: [projectileCraft, coreArmCraft],
      budget: createVisualBudget("player"),
    });
    const baseEvent = {
      kind: "wishcraft-hit" as const,
      mechanicId: "projectile-lance",
      origin: { x: 0, y: 0 },
      position: { x: 120, y: 0 },
      visualKind: "lance",
      wishcraftId: projectileCraft.id,
    };

    const projectileSocket = resolveWishcraftEmitterSocket({
      event: baseEvent,
      loadout: [projectileCraft, coreArmCraft],
      visuals,
    });
    const areaSocket = resolveWishcraftEmitterSocket({
      event: {
        ...baseEvent,
        mechanicId: "area-burst-nova",
        visualKind: "area",
        wishcraftId: coreArmCraft.id,
      },
      loadout: [projectileCraft, coreArmCraft],
      visuals,
    });
    const meleeSocket = resolveWishcraftEmitterSocket({
      event: {
        ...baseEvent,
        mechanicId: "melee-arc",
        visualKind: "melee",
        wishcraftId: coreArmCraft.id,
      },
      loadout: [projectileCraft, coreArmCraft],
      visuals,
    });

    expect(projectileSocket?.slot).toBe("weapon");
    expect(areaSocket?.slot).toBe("core");
    expect(meleeSocket?.slot).toBe("arm");
  });

  it("routes summon Wishcraft VFX from the active follower position", () => {
    const event = {
      kind: "wishcraft-hit" as const,
      mechanicId: "summon-drone",
      origin: { x: 10, y: 20 },
      position: { x: 160, y: 80 },
      visualKind: "summon",
      wishcraftId: "wishcraft-summon-source",
    };

    const socket = resolveSummonEmitterSocket({
      event,
      summons: [
        {
          craftId: "wishcraft-summon-source",
          id: "wishcraft-summon-source-summon-0",
          orbitRadius: 72,
          position: { x: 88, y: 44 },
        },
      ],
    });
    const visualEvent = withSummonEmitterOrigin(event, socket);

    expect(socket?.summonId).toBe("wishcraft-summon-source-summon-0");
    expect(visualEvent.kind === "wishcraft-hit" ? visualEvent.origin : undefined).toEqual({ x: 88, y: 44 });
  });

  it("keys non-player render caches by role and visual attachments so loadout drift can refresh", () => {
    const starVisuals = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "common-enemy",
      loadout: [wishcraftCatalog.fixtures.starLance],
      budget: createVisualBudget("common-enemy"),
    });
    const gravityVisuals = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "common-enemy",
      loadout: [wishcraftCatalog.fixtures.gravityOrbiter],
      budget: createVisualBudget("common-enemy"),
    });

    const starKey = visualCacheKeyForEntity("enemy-1", "common-enemy", starVisuals);
    const gravityKey = visualCacheKeyForEntity("enemy-1", "common-enemy", gravityVisuals);

    expect(starKey).toContain(VISUAL_POLISH_VERSION);
    expect(starKey).not.toBe(gravityKey);
  });

  it("budgets per-frame feedback graphics separately from persistent visual attachments", () => {
    const feedback = Array.from({ length: MAX_FEEDBACK_GRAPHICS_PER_FRAME + 20 }, (_, index) => ({
      id: index,
    }));

    const selected = selectBudgetedFeedback(feedback);

    expect(selected).toHaveLength(MAX_FEEDBACK_GRAPHICS_PER_FRAME);
    expect(selected.at(-1)?.id).toBe(MAX_FEEDBACK_GRAPHICS_PER_FRAME - 1);
  });

  it("colors Wishcraft hit feedback from the Wishcraft theme instead of a fixed visual-kind palette", () => {
    const dragon: Wishcraft = {
      ...wishcraftCatalog.fixtures.starLance,
      id: "wishcraft-dragon-feedback",
      primaryThemeId: "dragon",
      visualPieceIds: ["weapon-dragon-2"],
    };

    const palette = paletteForWishcraftFeedback(
      {
        kind: "wishcraft-hit",
        mechanicId: "projectile-lance",
        origin: { x: 0, y: 0 },
        position: { x: 10, y: 20 },
        visualKind: "lance",
        wishcraftId: dragon.id,
      },
      [dragon],
    );

    expect(palette).toEqual({ accent: 0xffd15a, color: 0xff7a3d });
  });

  it("maps every catalog theme to a reusable Wishcraft VFX motif family", () => {
    const motifs = new Set(wishcraftCatalog.themeTags.map((theme) => motifForTheme(theme.id)));

    expect(knownWishcraftThemeMotifCount()).toBe(wishcraftCatalog.themeTags.length);
    expect(motifs.size).toBeGreaterThanOrEqual(10);
    expect(motifForTheme("starfire")).toBe("celestial");
    expect(motifForTheme("gravity")).toBe("void-gravity");
    expect(motifForTheme("clockwork")).toBe("clockwork");
    expect(motifForTheme("neon")).toBe("neon");
    expect(motifForTheme(undefined)).toBe("neon");
  });

  it("creates projectile VFX only for long-range Wishcraft hit families", () => {
    expect(
      shouldCreateProjectileVfx({
        kind: "wishcraft-hit",
        mechanicId: "projectile-lance",
        origin: { x: 0, y: 0 },
        position: { x: 80, y: 0 },
        visualKind: "lance",
        wishcraftId: "wishcraft-projectile-vfx",
      }),
    ).toBe(true);
    expect(
      shouldCreateProjectileVfx({
        kind: "wishcraft-hit",
        mechanicId: "projectile-beam",
        origin: { x: 0, y: 0 },
        position: { x: 0, y: 120 },
        visualKind: "beam",
        wishcraftId: "wishcraft-beam-vfx",
      }),
    ).toBe(true);
    expect(
      shouldCreateProjectileVfx({
        kind: "wishcraft-hit",
        mechanicId: "area-burst-nova",
        origin: { x: 0, y: 0 },
        position: { x: 80, y: 0 },
        visualKind: "area",
        wishcraftId: "wishcraft-area-vfx",
      }),
    ).toBe(false);
    expect(
      shouldCreateProjectileVfx({
        kind: "wishcraft-hit",
        mechanicId: "projectile-lance",
        origin: { x: 0, y: 0 },
        position: { x: 10, y: 0 },
        visualKind: "lance",
        wishcraftId: "wishcraft-short-vfx",
      }),
    ).toBe(false);
  });

  it("clamps projectile VFX lifetime progress between spawn and expiry", () => {
    expect(projectileVfxProgress({ bornAtSeconds: 10, nowSeconds: 9, ttlSeconds: 0.4 })).toBe(0);
    expect(projectileVfxProgress({ bornAtSeconds: 10, nowSeconds: 10.2, ttlSeconds: 0.4 })).toBeCloseTo(0.5);
    expect(projectileVfxProgress({ bornAtSeconds: 10, nowSeconds: 11, ttlSeconds: 0.4 })).toBe(1);
  });

  it("creates separate Wishcraft launch and trail residue VFX around long-range attacks", () => {
    const beamHit = {
      kind: "wishcraft-hit" as const,
      mechanicId: "projectile-beam",
      origin: { x: 0, y: 0 },
      position: { x: 160, y: 0 },
      visualKind: "beam",
      wishcraftId: "wishcraft-beam-vfx",
    };
    const areaHit = {
      ...beamHit,
      mechanicId: "area-burst-nova",
      visualKind: "area",
      wishcraftId: "wishcraft-area-vfx",
    };
    const shortHit = {
      ...beamHit,
      position: { x: 12, y: 0 },
      visualKind: "lance",
      wishcraftId: "wishcraft-short-vfx",
    };

    expect(shouldCreateLaunchVfx(beamHit)).toBe(true);
    expect(shouldCreateLaunchVfx(areaHit)).toBe(true);
    expect(shouldCreateTrailResidueVfx(beamHit)).toBe(true);
    expect(shouldCreateTrailResidueVfx(areaHit)).toBe(false);
    expect(shouldCreateTrailResidueVfx(shortHit)).toBe(false);
  });

  it("clamps launch and trail residue VFX progress over their own lifetimes", () => {
    expect(launchVfxProgress({ bornAtSeconds: 2, nowSeconds: 1, ttlSeconds: 0.25 })).toBe(0);
    expect(launchVfxProgress({ bornAtSeconds: 2, nowSeconds: 2.125, ttlSeconds: 0.25 })).toBeCloseTo(0.5);
    expect(launchVfxProgress({ bornAtSeconds: 2, nowSeconds: 3, ttlSeconds: 0.25 })).toBe(1);
    expect(trailResidueProgress({ bornAtSeconds: 4, nowSeconds: 4.31, ttlSeconds: 0.62 })).toBeCloseTo(0.5);
    expect(trailResidueProgress({ bornAtSeconds: 4, nowSeconds: 5, ttlSeconds: 0.62 })).toBe(1);
  });

  it("draws beam VFX against the full origin-to-target distance instead of target-only decals", () => {
    expect(projectileVfxBodyLength({ distance: 520, visualKind: "beam" })).toBe(520);
    expect(projectileVfxBodyLength({ distance: 520, visualKind: "lance" })).toBe(234);
  });

  it("creates budgeted Wishcraft particle clouds for attack spectacle without affecting pickup or shield visuals", () => {
    const lanceHit = {
      kind: "wishcraft-hit" as const,
      mechanicId: "projectile-lance",
      origin: { x: 0, y: 0 },
      position: { x: 240, y: 0 },
      visualKind: "lance",
      wishcraftId: "wishcraft-particle-cloud",
    };
    const areaHit = {
      ...lanceHit,
      mechanicId: "area-burst-nova",
      visualKind: "area",
      wishcraftId: "wishcraft-particle-area",
    };
    const shortHit = {
      ...lanceHit,
      position: { x: 24, y: 0 },
      wishcraftId: "wishcraft-particle-short",
    };
    const veryLongHit = {
      ...lanceHit,
      position: { x: 2200, y: 0 },
      visualKind: "beam",
      wishcraftId: "wishcraft-particle-long",
    };

    expect(shouldCreateParticleCloudVfx(lanceHit)).toBe(true);
    expect(shouldCreateParticleCloudVfx(areaHit)).toBe(true);
    expect(shouldCreateParticleCloudVfx({ ...lanceHit, visualKind: "pickup" })).toBe(false);
    expect(shouldCreateParticleCloudVfx({ ...lanceHit, visualKind: "shield" })).toBe(false);
    expect(particleCloudParticleCount(shortHit)).toBeLessThan(particleCloudParticleCount(lanceHit));
    expect(particleCloudParticleCount(veryLongHit)).toBeLessThanOrEqual(48);
  });

  it("clamps particle cloud progress over its visual lifetime", () => {
    expect(particleCloudProgress({ bornAtSeconds: 3, nowSeconds: 2, ttlSeconds: 0.8 })).toBe(0);
    expect(particleCloudProgress({ bornAtSeconds: 3, nowSeconds: 3.4, ttlSeconds: 0.8 })).toBeCloseTo(0.5);
    expect(particleCloudProgress({ bornAtSeconds: 3, nowSeconds: 4, ttlSeconds: 0.8 })).toBe(1);
  });

  it("creates screen pulse VFX only for high-impact Wishcraft families", () => {
    const beamHit = {
      kind: "wishcraft-hit" as const,
      mechanicId: "projectile-beam",
      origin: { x: 0, y: 0 },
      position: { x: 420, y: 0 },
      visualKind: "beam",
      wishcraftId: "wishcraft-screen-pulse",
    };

    expect(shouldCreateScreenPulseVfx(beamHit)).toBe(true);
    expect(shouldCreateScreenPulseVfx({ ...beamHit, visualKind: "area" })).toBe(true);
    expect(shouldCreateScreenPulseVfx({ ...beamHit, visualKind: "trigger" })).toBe(true);
    expect(shouldCreateScreenPulseVfx({ ...beamHit, visualKind: "lance" })).toBe(false);
    expect(shouldCreateScreenPulseVfx({ ...beamHit, visualKind: "pickup" })).toBe(false);
    expect(screenPulseIntensity({ ...beamHit, visualKind: "area" })).toBeGreaterThan(screenPulseIntensity(beamHit));
  });

  it("clamps screen pulse progress over its visual lifetime", () => {
    expect(screenPulseProgress({ bornAtSeconds: 5, nowSeconds: 4, ttlSeconds: 0.9 })).toBe(0);
    expect(screenPulseProgress({ bornAtSeconds: 5, nowSeconds: 5.45, ttlSeconds: 0.9 })).toBeCloseTo(0.5);
    expect(screenPulseProgress({ bornAtSeconds: 5, nowSeconds: 6, ttlSeconds: 0.9 })).toBe(1);
  });

  it("adds path-based VFX for base kit attacks without routing them through Wishcraft mechanics", () => {
    expect(
      shouldCreateBaseKitVfx({
        kind: "impact",
        origin: { x: 0, y: 0 },
        position: { x: 260, y: 0 },
        visualKind: "machine-gun",
      }),
    ).toBe(true);
    expect(
      shouldCreateBaseKitVfx({
        kind: "impact",
        origin: { x: 0, y: 0 },
        position: { x: 54, y: 0 },
        visualKind: "laser-sword",
      }),
    ).toBe(true);
    expect(shouldCreateBaseKitVfx({ kind: "enemy-death", position: { x: 0, y: 0 } })).toBe(false);
    expect(baseKitVfxProgress({ bornAtSeconds: 4, nowSeconds: 4.1, ttlSeconds: 0.2 })).toBeCloseTo(0.5);
  });

  it("scales XP magnet trail density by attraction distance", () => {
    expect(xpMagnetTrailSegmentCount(30)).toBe(2);
    expect(xpMagnetTrailSegmentCount(180)).toBeGreaterThan(xpMagnetTrailSegmentCount(60));
    expect(xpMagnetTrailSegmentCount(1200)).toBe(8);
  });

  it("increases Boss presence VFX density for warning and double-Boss encounters", () => {
    expect(bossPresenceRingCount(1, true)).toBeGreaterThan(bossPresenceRingCount(1, false));
    expect(bossPresenceRingCount(2, true)).toBeGreaterThan(bossPresenceRingCount(1, true));
  });

  it("derives entity animation states from time, movement, template, and damage state", () => {
    const movingPlayer = playerMechAnimationState({
      movement: { x: 1, y: 0, strength: 1 },
      nowSeconds: 3,
    });
    const idlePlayer = playerMechAnimationState({
      movement: { x: 0, y: 0, strength: 0 },
      nowSeconds: 3,
    });
    const firstEnemyFrame = enemySpriteAnimationState({
      damaged: false,
      id: "enemy-animated-1",
      nowSeconds: 1,
      templateId: "fast-fragile",
    });
    const secondEnemyFrame = enemySpriteAnimationState({
      damaged: true,
      id: "enemy-animated-1",
      nowSeconds: 1.25,
      templateId: "fast-fragile",
    });

    expect(movingPlayer.thrusterLeft).toBeGreaterThan(idlePlayer.thrusterLeft);
    expect(movingPlayer.movementStrength).toBe(1);
    expect(firstEnemyFrame.frame).not.toBe(secondEnemyFrame.frame);
    expect(secondEnemyFrame.hitFlashAlpha).toBeGreaterThan(0);
  });

  it("keeps mechanical detail primitives modular for higher-fidelity entity art", () => {
    expect([
      drawCableBundle,
      drawDragonSpine,
      drawHeatSinkStack,
      drawMechFaceplate,
      drawPanelSeams,
      drawRivetCluster,
      drawWeaponRail,
      drawWingStruts,
    ].every((draw) => typeof draw === "function")).toBe(true);
  });

  it("safely skips missing or incompatible Visual Pieces and reports structured client warnings", () => {
    const invalid: Wishcraft = {
      ...wishcraftCatalog.fixtures.starLance,
      id: "wishcraft-invalid-visuals",
      visualPieceIds: ["missing-piece", "orbit-starfire-3"],
    };

    const visuals = assembleRuntimeVisuals({
      catalog: wishcraftCatalog,
      entityRole: "player",
      loadout: [invalid],
      budget: createVisualBudget("player"),
    });

    expect(visuals.attachments.map((attachment) => attachment.visualPieceId)).toContain(
      "orbit-starfire-3",
    );
    expect(visuals.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-visual-piece",
          severity: "warn",
          visualPieceId: "missing-piece",
          wishcraftId: "wishcraft-invalid-visuals",
        }),
      ]),
    );
  });
});

function repeatWishcraft(wishcraft: Wishcraft, count: number): Wishcraft[] {
  return Array.from({ length: count }, (_, index) => ({
    ...wishcraft,
    id: `${wishcraft.id}-${index}`,
  }));
}
