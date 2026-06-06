import { describe, expect, it } from "vitest";
import {
  createWishcraftValidator,
  validateWishcraftContract,
} from "../../src/shared/wishcraft/validation.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";
import type { Wishcraft } from "../../src/shared/wishcraft/types.js";

describe("Wishcraft Contract validation", () => {
  it("accepts one legal Wishcraft with names, primary theme, primary mechanic, legal pieces, and safe parameters", () => {
    const wishcraft: Wishcraft = wishcraftCatalog.fixtures.starLance;

    expect(validateWishcraftContract(wishcraftCatalog, wishcraft)).toEqual([]);
  });

  it("rejects illegal piece IDs, overlong LLM names, executable strings, and forbidden initial mechanics", () => {
    const illegal: Wishcraft = {
      id: "wishcraft-test-illegal",
      sourceWish: "make me heal with a turret trap that freezes enemies",
      name: {
        cn: "这是一个明显超过限制的超长超长超长超长超长名字",
        en: "This is an obviously far too long improvised craft name",
      },
      primaryThemeId: "unknown-theme",
      primaryMechanicId: "forbidden-heal",
      mechanicPieceIds: ["forbidden-heal", "forbidden-turret", "unknown-piece"],
      visualPieceIds: ["unknown-visual"],
      parameters: {
        healsPlayer: true,
        modifiesMovement: true,
        executable: "function run(){ return globalThis.localStorage }",
        enemyStatus: "freeze",
      },
    };

    const errors = validateWishcraftContract(wishcraftCatalog, illegal);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("name.cn"),
        expect.stringContaining("name.en"),
        expect.stringContaining("primaryThemeId"),
        expect.stringContaining("primaryMechanicId"),
        expect.stringContaining("mechanicPieceIds"),
        expect.stringContaining("visualPieceIds"),
        expect.stringContaining("forbidden parameter healsPlayer"),
        expect.stringContaining("forbidden parameter modifiesMovement"),
        expect.stringContaining("executable"),
        expect.stringContaining("enemyStatus"),
      ]),
    );
  });

  it("rejects unknown parameters, wrong parameter types, missing primary link, and over-budget crafts", () => {
    const fixture = wishcraftCatalog.fixtures.starLance;

    expect(
      validateWishcraftContract(wishcraftCatalog, {
        ...fixture,
        parameters: { ...fixture.parameters, maxHealthBoost: 20 },
      }),
    ).toContain("unknown parameter maxHealthBoost");

    expect(
      validateWishcraftContract(wishcraftCatalog, {
        ...fixture,
        parameters: { ...fixture.parameters, damageScale: "huge" },
      }),
    ).toContain("parameter damageScale must be number");

    expect(
      validateWishcraftContract(wishcraftCatalog, {
        ...fixture,
        mechanicPieceIds: ["pickup-magnet"],
      }),
    ).toContain("primaryMechanicId must be included in mechanicPieceIds");

    expect(
      validateWishcraftContract(wishcraftCatalog, {
        ...fixture,
        mechanicPieceIds: wishcraftCatalog.mechanicPieces.map((piece) => piece.id),
        visualPieceIds: wishcraftCatalog.visualPieces.map((piece) => piece.id),
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("mechanic budget"),
        expect.stringContaining("visual budget"),
        expect.stringContaining("supporting mechanic"),
        expect.stringContaining("visual piece count"),
      ]),
    );
  });

  it("rejects arrow-function-looking executable payloads", () => {
    const fixture = wishcraftCatalog.fixtures.starLance;

    expect(
      validateWishcraftContract(wishcraftCatalog, {
        ...fixture,
        sourceWish: "() => 1",
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("executable")]));
  });

  it("exposes an AJV validator for server-side JSON object validation", () => {
    const validator = createWishcraftValidator(wishcraftCatalog);
    const valid = validator(wishcraftCatalog.fixtures.gravityOrbiter);

    expect(valid).toBe(true);
  });
});
