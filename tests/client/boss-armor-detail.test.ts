import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import type { BossMechSilhouette } from "../../src/shared/boss/boss-planning.js";
import type { BossSpriteAnimationState } from "../../src/client/visual/combat-entity-animation.js";
import {
  bossArmorDetailBudget,
  bossArmorDetailProfile,
} from "../../src/client/visual/sprites/boss/boss-armor-detail.js";

const silhouettes: BossMechSilhouette[] = ["flying", "crawling", "humanoid"];

describe("Boss armor detail layer", () => {
  it("adds persistent high-density dragon-mech detail to every Boss silhouette", () => {
    for (const silhouette of silhouettes) {
      const profile = bossArmorDetailProfile({
        animation: animation({}),
        healthProgress: 1,
        silhouette,
      });

      expect(bossArmorDetailBudget(profile)).toBeGreaterThanOrEqual(56);
      expect(profile.armorPlates + profile.energySeams + profile.dragonScalePlates).toBeGreaterThan(34);
    }
  });

  it("keeps each Boss silhouette visually specialized", () => {
    const base = { animation: animation({ telegraph: 0.74 }), healthProgress: 0.72 };
    const flying = bossArmorDetailProfile({ ...base, silhouette: "flying" });
    const crawling = bossArmorDetailProfile({ ...base, silhouette: "crawling" });
    const humanoid = bossArmorDetailProfile({ ...base, silhouette: "humanoid" });

    expect(flying.wingMicroPanels + flying.engineVents).toBeGreaterThan(crawling.wingMicroPanels + crawling.engineVents);
    expect(crawling.treadPlates + crawling.clawSockets).toBeGreaterThan(flying.treadPlates + flying.clawSockets);
    expect(humanoid.crownSpikes + humanoid.armRailSockets).toBeGreaterThan(crawling.crownSpikes + crawling.armRailSockets);
  });

  it("turns telegraph and low health into extra visual density without changing mechanics", () => {
    const idle = bossArmorDetailProfile({
      animation: animation({ telegraph: 0 }),
      healthProgress: 1,
      silhouette: "humanoid",
    });
    const attacking = bossArmorDetailProfile({
      animation: animation({ telegraph: 0.92 }),
      healthProgress: 0.7,
      silhouette: "humanoid",
    });
    const wounded = bossArmorDetailProfile({
      animation: animation({ telegraph: 0.2 }),
      healthProgress: 0.14,
      silhouette: "humanoid",
    });

    expect(attacking.chargedSockets).toBeGreaterThan(idle.chargedSockets);
    expect(wounded.exposedReactors).toBeGreaterThan(idle.exposedReactors);
    expect(wounded.fractureSparks).toBeGreaterThan(idle.fractureSparks);
  });

  it("keeps Boss sprite assembly split into focused modules", async () => {
    const bossEntry = await readFile("src/client/visual/boss-entity-sprites.ts", "utf8");
    const armorDetail = await readFile("src/client/visual/sprites/boss/boss-armor-detail.ts", "utf8");

    expect(bossEntry).toContain("./sprites/boss/boss-armor-detail.js");
    expect(bossEntry.split("\n").length).toBeLessThan(225);
    expect(armorDetail).toContain("export function drawBossArmorDetail");
  });
});

function animation(overrides: Partial<BossSpriteAnimationState>): BossSpriteAnimationState {
  return {
    auraPulse: 1,
    entranceAlpha: 1,
    frame: 0,
    hitFlashAlpha: 0,
    jawOpen: 0,
    telegraph: 0,
    wingSpread: 1,
    ...overrides,
  };
}
