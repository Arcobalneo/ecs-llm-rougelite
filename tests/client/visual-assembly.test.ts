import { describe, expect, it } from "vitest";
import {
  assembleRuntimeVisuals,
  createVisualBudget,
  layoutRuntimeVisualAttachments,
} from "../../src/client/visual/visual-assembly.js";
import {
  MAX_FEEDBACK_GRAPHICS_PER_FRAME,
  selectBudgetedFeedback,
  visualCacheKeyForEntity,
} from "../../src/client/arena.js";
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

    expect(visualCacheKeyForEntity("enemy-1", "common-enemy", starVisuals)).not.toBe(
      visualCacheKeyForEntity("enemy-1", "common-enemy", gravityVisuals),
    );
  });

  it("budgets per-frame feedback graphics separately from persistent visual attachments", () => {
    const feedback = Array.from({ length: MAX_FEEDBACK_GRAPHICS_PER_FRAME + 20 }, (_, index) => ({
      id: index,
    }));

    const selected = selectBudgetedFeedback(feedback);

    expect(selected).toHaveLength(MAX_FEEDBACK_GRAPHICS_PER_FRAME);
    expect(selected.at(-1)?.id).toBe(MAX_FEEDBACK_GRAPHICS_PER_FRAME - 1);
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
