import { describe, expect, it } from "vitest";
import {
  lateRunFieldIntensity,
  lateRunFieldLaneCount,
  lateRunFieldParticleCount,
  lateRunFieldThemeIds,
  MAX_LATE_RUN_FIELD_LANES,
  MAX_LATE_RUN_FIELD_PARTICLES,
} from "../../src/client/visual/late-run-field-vfx.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";
import type { Wishcraft } from "../../src/shared/wishcraft/types.js";

describe("Late-run field VFX", () => {
  it("scales density with level, Boss progress, and loadout while clamping visual budgets", () => {
    const early = {
      activeBossCount: 0,
      bossKills: 0,
      level: 1,
      loadout: [] as Wishcraft[],
      phase: "none" as const,
    };
    const late = {
      activeBossCount: 2,
      bossKills: 5,
      level: 32,
      loadout: repeatWishcraft(wishcraftCatalog.fixtures.starLance, 14),
      phase: "active" as const,
    };

    expect(lateRunFieldLaneCount(late)).toBeGreaterThan(lateRunFieldLaneCount(early));
    expect(lateRunFieldParticleCount(late)).toBeGreaterThan(lateRunFieldParticleCount(early));
    expect(lateRunFieldLaneCount(late)).toBeLessThanOrEqual(MAX_LATE_RUN_FIELD_LANES);
    expect(lateRunFieldParticleCount(late)).toBeLessThanOrEqual(MAX_LATE_RUN_FIELD_PARTICLES);
    expect(lateRunFieldIntensity(late)).toBeGreaterThan(lateRunFieldIntensity(early));
  });

  it("uses recent unique Wishcraft themes for field motifs", () => {
    const loadout = [
      wishcraftCatalog.fixtures.starLance,
      {
        ...wishcraftCatalog.fixtures.gravityOrbiter,
        id: "wishcraft-field-gravity",
      },
      {
        ...wishcraftCatalog.fixtures.starLance,
        id: "wishcraft-field-dragon",
        primaryThemeId: "dragon",
      },
      {
        ...wishcraftCatalog.fixtures.starLance,
        id: "wishcraft-field-neon",
        primaryThemeId: "neon",
      },
      {
        ...wishcraftCatalog.fixtures.starLance,
        id: "wishcraft-field-frost",
        primaryThemeId: "frost",
      },
    ];

    expect(lateRunFieldThemeIds(loadout)).toEqual(["frost", "neon", "dragon", "gravity"]);
  });
});

function repeatWishcraft(wishcraft: Wishcraft, count: number): Wishcraft[] {
  return Array.from({ length: count }, (_, index) => ({
    ...wishcraft,
    id: `${wishcraft.id}-${index}`,
  }));
}
