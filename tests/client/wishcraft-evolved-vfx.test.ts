import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import type { CombatFeedback } from "../../src/client/simulation/combat-loop.js";
import {
  shouldCreateWishcraftEvolved,
  wishcraftEvolvedProfile,
  wishcraftEvolvedProgress,
} from "../../src/client/visual/wishcraft-evolved-vfx.js";

describe("Wishcraft evolved VFX", () => {
  it("creates evolved-weapon profiles for high-readability Wishcraft families", () => {
    for (const visualKind of ["area", "beam", "burst", "missile", "pickup", "ricochet", "scatter", "shield", "summon", "trigger"]) {
      expect(shouldCreateWishcraftEvolved(wishcraftHit(visualKind))).toBe(true);
    }

    expect(shouldCreateWishcraftEvolved(wishcraftHit("lance"))).toBe(false);
    expect(shouldCreateWishcraftEvolved({ kind: "impact", position: { x: 0, y: 0 } })).toBe(false);
  });

  it("promotes spiral mechanics into the largest evolved projectile profile", () => {
    const spiral = wishcraftEvolvedProfile(wishcraftHit("lance", "projectile-spiral"));
    const scatter = wishcraftEvolvedProfile(wishcraftHit("scatter"));

    expect(spiral?.pattern).toBe("spiral-corkscrew");
    expect(spiral?.motifCount).toBeGreaterThan(scatter?.motifCount ?? 0);
    expect(spiral?.radius).toBeGreaterThan(scatter?.radius ?? 0);
  });

  it("budgets shield and pickup as large visible reward effects", () => {
    const shield = wishcraftEvolvedProfile(wishcraftHit("shield"));
    const pickup = wishcraftEvolvedProfile(wishcraftHit("pickup"));
    const missile = wishcraftEvolvedProfile(wishcraftHit("missile"));

    expect(shield?.ringCount).toBeGreaterThan(missile?.ringCount ?? 0);
    expect(pickup?.ttlSeconds).toBeGreaterThanOrEqual(missile?.ttlSeconds ?? 0);
    expect(shield?.radius).toBeGreaterThan(missile?.radius ?? 0);
  });

  it("tracks evolved lifetime progress with clamping", () => {
    expect(wishcraftEvolvedProgress({ bornAtSeconds: 5, nowSeconds: 5, ttlSeconds: 1 })).toBe(0);
    expect(wishcraftEvolvedProgress({ bornAtSeconds: 5, nowSeconds: 5.5, ttlSeconds: 1 })).toBeCloseTo(0.5);
    expect(wishcraftEvolvedProgress({ bornAtSeconds: 5, nowSeconds: 7, ttlSeconds: 1 })).toBe(1);
  });

  it("keeps evolved Wishcraft VFX split into an entrypoint, profile rules, and motif drawing", async () => {
    const entrypoint = await readFile("src/client/visual/wishcraft-evolved-vfx.ts", "utf8");
    const profileRules = await readFile("src/client/visual/wishcraft/evolved/types.ts", "utf8");
    const motifDrawing = await readFile("src/client/visual/wishcraft/evolved/motif.ts", "utf8");

    expect(entrypoint.split("\n").length).toBeLessThan(140);
    expect(entrypoint).toContain("./wishcraft/evolved/types.js");
    expect(entrypoint).toContain("./wishcraft/evolved/motif.js");
    expect(profileRules).toContain("export function wishcraftEvolvedProfile");
    expect(motifDrawing).toContain("export function drawEvolvedWishcraftMotif");
  });
});

function wishcraftHit(visualKind: string, mechanicId = `${visualKind}-mechanic`): CombatFeedback {
  return {
    kind: "wishcraft-hit",
    mechanicId,
    origin: { x: 0, y: 0 },
    position: { x: 140, y: 46 },
    visualKind,
    wishcraftId: "test-craft",
  };
}
