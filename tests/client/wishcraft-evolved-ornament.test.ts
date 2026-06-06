import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  evolvedWishcraftOrnamentBudget,
  evolvedWishcraftOrnamentProfile,
} from "../../src/client/visual/wishcraft/evolved/ornament.js";
import type { WishcraftMechanicAccentPattern } from "../../src/client/visual/wishcraft/mechanic-accent/types.js";

const patterns: WishcraftMechanicAccentPattern[] = [
  "area-nova",
  "beam-cap",
  "burst-array",
  "lance-spear",
  "melee-blade",
  "missile-salvo",
  "pickup-magnet",
  "ricochet-node",
  "scatter-fan",
  "shield-guard",
  "spiral-corkscrew",
  "stat-tuning",
  "summon-link",
  "trigger-sigil",
];

describe("Evolved Wishcraft ornament layer", () => {
  it("adds super-weapon visual density to every evolved mechanic pattern", () => {
    for (const pattern of patterns) {
      const profile = evolvedWishcraftOrnamentProfile(pattern);

      expect(evolvedWishcraftOrnamentBudget(pattern)).toBeGreaterThanOrEqual(40);
      expect(profile.foregroundShards + profile.energyGlyphs + profile.sparkBursts).toBeGreaterThan(20);
    }
  });

  it("budgets spiral and pickup as swirling spectacle fields", () => {
    const spiral = evolvedWishcraftOrnamentProfile("spiral-corkscrew");
    const pickup = evolvedWishcraftOrnamentProfile("pickup-magnet");
    const beam = evolvedWishcraftOrnamentProfile("beam-cap");

    expect(spiral.corkscrewDust + spiral.energyGlyphs).toBeGreaterThan(beam.corkscrewDust + beam.energyGlyphs);
    expect(pickup.corkscrewDust + pickup.orbitPearls).toBeGreaterThan(beam.corkscrewDust + beam.orbitPearls);
  });

  it("budgets beam and missile as directional weapon effects", () => {
    const beam = evolvedWishcraftOrnamentProfile("beam-cap");
    const missile = evolvedWishcraftOrnamentProfile("missile-salvo");
    const shield = evolvedWishcraftOrnamentProfile("shield-guard");

    expect(beam.directionalRibs).toBeGreaterThan(shield.directionalRibs);
    expect(missile.contrailShards).toBeGreaterThan(shield.contrailShards);
  });

  it("keeps evolved Wishcraft VFX split into profile, motif, and ornament modules", async () => {
    const motif = await readFile("src/client/visual/wishcraft/evolved/motif.ts", "utf8");
    const ornament = await readFile("src/client/visual/wishcraft/evolved/ornament.ts", "utf8");
    const entrypoint = await readFile("src/client/visual/wishcraft-evolved-vfx.ts", "utf8");

    expect(motif).toContain("./ornament.js");
    expect(ornament).toContain("export function drawEvolvedWishcraftOrnaments");
    expect(entrypoint.split("\n").length).toBeLessThan(140);
  });
});
