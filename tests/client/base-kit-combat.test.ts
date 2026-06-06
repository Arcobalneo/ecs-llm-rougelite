import { describe, expect, it } from "vitest";
import {
  COMMON_ENEMY_TEMPLATES,
  chooseRangedTarget,
  createBaseKit,
  shouldTriggerMelee,
} from "../../src/client/simulation/combat.js";

describe("Base Kit combat rules", () => {
  it("targets the nearest valid ranged target inside fixed machine gun range", () => {
    const baseKit = createBaseKit();
    const target = chooseRangedTarget({
      player: { x: 100, y: 100 },
      enemies: [
        { id: "far", position: { x: 900, y: 100 }, radius: 14, health: 10 },
        { id: "near", position: { x: 260, y: 120 }, radius: 14, health: 10 },
        { id: "closer", position: { x: 180, y: 140 }, radius: 14, health: 10 },
      ],
      range: baseKit.machineGun.range,
    });

    expect(target?.id).toBe("closer");
  });

  it("does not fire ranged attacks when no valid target is inside range", () => {
    const baseKit = createBaseKit();
    const target = chooseRangedTarget({
      player: { x: 100, y: 100 },
      enemies: [{ id: "outside", position: { x: 900, y: 100 }, radius: 14, health: 10 }],
      range: baseKit.machineGun.range,
    });

    expect(target).toBeUndefined();
  });

  it("triggers close laser sword only when a nearby threat exists", () => {
    const baseKit = createBaseKit();

    expect(
      shouldTriggerMelee({
        player: { x: 100, y: 100 },
        enemies: [{ id: "near", position: { x: 128, y: 102 }, radius: 16, health: 10 }],
        range: baseKit.laserSword.range,
      }),
    ).toBe(true);

    expect(
      shouldTriggerMelee({
        player: { x: 100, y: 100 },
        enemies: [{ id: "far", position: { x: 220, y: 220 }, radius: 16, health: 10 }],
        range: baseKit.laserSword.range,
      }),
    ).toBe(false);
  });

  it("defines three contact-only Common Enemy templates", () => {
    expect(COMMON_ENEMY_TEMPLATES.map((template) => template.id)).toEqual([
      "fast-fragile",
      "slow-tough",
      "swarm-fragile",
    ]);
    expect(COMMON_ENEMY_TEMPLATES.every((template) => template.attackKind === "contact")).toBe(
      true,
    );
  });
});
