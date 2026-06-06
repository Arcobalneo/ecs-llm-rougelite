import { describe, expect, it } from "vitest";
import { interpretWish, type WishProvider } from "../../src/server/wish-interpreter.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";

describe("Wish Interpreter", () => {
  it("repairs invalid provider output up to three times before accepting a legal Wishcraft", async () => {
    const provider = createSequenceProvider([
      "{ broken json",
      JSON.stringify({
        ...wishcraftCatalog.fixtures.gravityOrbiter,
        primaryMechanicId: "missing-mechanic",
      }),
      JSON.stringify(wishcraftCatalog.fixtures.gravityOrbiter),
    ]);

    const result = await interpretWish(provider, {
      language: "en",
      level: 2,
      loadoutSummary: "Empty Wishcraft Loadout",
      wish: "black hole orbiters",
    });

    expect(result.finalWishcraft).toEqual(wishcraftCatalog.fixtures.gravityOrbiter);
    expect(result.trace.fallbackReason).toBeUndefined();
    expect(result.trace.attempts.map((attempt) => attempt.phase)).toEqual([
      "initial",
      "repair",
      "repair",
    ]);
    expect(provider.calls.map((call) => call.attempt)).toEqual([1, 2, 3]);
    expect(provider.calls[1].previousErrors.length).toBeGreaterThan(0);
    expect(provider.calls[2].repairOf).toBe(
      JSON.stringify({
        ...wishcraftCatalog.fixtures.gravityOrbiter,
        primaryMechanicId: "missing-mechanic",
      }),
    );
  });

  it("falls back instead of throwing when the provider fails on every attempt", async () => {
    const provider = createThrowingProvider();

    const result = await interpretWish(provider, {
      language: "en",
      level: 2,
      loadoutSummary: "Empty Wishcraft Loadout",
      wish: "I want black hole gravity orbiters",
    });

    expect(result.finalWishcraft.primaryThemeId).toBe("gravity");
    expect(result.trace.fallbackReason).toBe("provider_error");
    expect(result.trace.attempts).toHaveLength(4);
    expect(result.trace.attempts.every((attempt) => attempt.phase === "repair" || attempt.phase === "initial")).toBe(true);
    expect(result.trace.validationErrors).toEqual(
      expect.arrayContaining([expect.stringContaining("provider unavailable")]),
    );
  });

  it("does not mark a repaired success as fallback after a transient provider error", async () => {
    const provider = createTransientThrowingProvider([
      JSON.stringify(wishcraftCatalog.fixtures.gravityOrbiter),
    ]);

    const result = await interpretWish(provider, {
      language: "en",
      level: 2,
      loadoutSummary: "Empty Wishcraft Loadout",
      wish: "black hole orbiters",
    });

    expect(result.finalWishcraft).toEqual(wishcraftCatalog.fixtures.gravityOrbiter);
    expect(result.trace.fallbackReason).toBeUndefined();
    expect(result.trace.attempts).toHaveLength(2);
    expect(result.trace.attempts[0].errors).toEqual([
      expect.stringContaining("transient provider error"),
    ]);
    expect(result.trace.attempts[1].errors).toEqual([]);
  });

  it("legalizes an otherwise creative output while preserving theme and names", async () => {
    const overBudget = {
      ...wishcraftCatalog.fixtures.gravityOrbiter,
      name: { cn: "黑洞伴星", en: "Black Hole Companions" },
      mechanicPieceIds: [
        "summon-orbiter",
        "summon-drone",
        "summon-wingman",
        "shield-capacity",
      ],
      parameters: {
        damageScale: 99,
        summonCount: 12,
        orbitRadius: 999,
        illegalKnob: 1,
      },
      visualPieceIds: wishcraftCatalog.visualPieces.slice(0, 10).map((piece) => piece.id),
    };
    const provider = createSequenceProvider([JSON.stringify(overBudget)]);

    const result = await interpretWish(provider, {
      language: "en",
      level: 2,
      loadoutSummary: "Empty Wishcraft Loadout",
      wish: "black hole orbiters",
    });

    expect(result.finalWishcraft.name).toEqual(overBudget.name);
    expect(result.finalWishcraft.primaryThemeId).toBe("gravity");
    expect(result.finalWishcraft.primaryMechanicId).toBe("summon-orbiter");
    expect(result.finalWishcraft.mechanicPieceIds).toContain("summon-orbiter");
    expect(result.finalWishcraft.parameters).toMatchObject({
      damageScale: 1.35,
      summonCount: 5,
      orbitRadius: 140,
    });
    expect(result.finalWishcraft.parameters).not.toHaveProperty("illegalKnob");
    expect(result.finalWishcraft.visualPieceIds.length).toBeLessThanOrEqual(3);
    expect(result.trace.fallbackReason).toBeUndefined();
    expect(result.trace.legalizationChanges.length).toBeGreaterThan(0);
  });

  it("does not attribute failed legalization changes to a later clean repair", async () => {
    const invalidButParsed = {
      ...wishcraftCatalog.fixtures.starLance,
      name: { cn: "炮塔陷阱", en: "Weak Trap" },
      parameters: {
        ...wishcraftCatalog.fixtures.starLance.parameters,
        illegalKnob: 1,
      },
      visualPieceIds: ["unknown-visual"],
    };
    const provider = createSequenceProvider([
      JSON.stringify(invalidButParsed),
      JSON.stringify(wishcraftCatalog.fixtures.starLance),
    ]);

    const result = await interpretWish(provider, {
      language: "en",
      level: 2,
      loadoutSummary: "Empty Wishcraft Loadout",
      wish: "star lance",
    });

    expect(result.finalWishcraft).toEqual(wishcraftCatalog.fixtures.starLance);
    expect(result.trace.legalizationChanges).toEqual([]);
    expect(result.trace.attempts[0].errors.length).toBeGreaterThan(0);
  });

  it("accepts higher-level visual budgets when validating interpreted Wishcrafts", async () => {
    const levelFiveVisualBudget = {
      ...wishcraftCatalog.fixtures.gravityOrbiter,
      id: "wishcraft-angel-shield-orbit",
      sourceWish: "angel shield drones",
      name: { cn: "天使护盾", en: "Angel Shield Orbit" },
      primaryThemeId: "angel",
      primaryMechanicId: "shield-orbit",
      mechanicPieceIds: ["shield-orbit"],
      visualPieceIds: ["aura-angel-1", "hip-angel-0", "projectile-angel-2", "back-shield-1"],
      parameters: { shieldCapacity: 20, orbitRadius: 72, summonCount: 1 },
    };
    const provider = createSequenceProvider([JSON.stringify(levelFiveVisualBudget)]);

    const result = await interpretWish(provider, {
      language: "en",
      level: 5,
      loadoutSummary: "Several Wishcrafts already installed",
      wish: "Give me angel shield drones",
    });

    expect(result.finalWishcraft).toEqual(levelFiveVisualBudget);
    expect(result.trace.fallbackReason).toBeUndefined();
    expect(result.trace.attempts).toHaveLength(1);
  });

  it("uses Wish keywords to choose a themed fallback when all attempts fail", async () => {
    const provider = createSequenceProvider(["not json", "still not json", "bad", "nope"]);

    const result = await interpretWish(provider, {
      language: "en",
      level: 2,
      loadoutSummary: "Empty Wishcraft Loadout",
      wish: "I want black hole gravity orbiters",
    });

    expect(result.finalWishcraft.primaryThemeId).toBe("gravity");
    expect(result.finalWishcraft.primaryMechanicId).toBe("summon-orbiter");
    expect(result.trace.fallbackReason).toBe("invalid_output");
    expect(result.trace.attempts).toHaveLength(4);
  });

  it("falls back to a legal Wishcraft that follows non-gravity theme keywords", async () => {
    const provider = createSequenceProvider(["", "", "", ""]);

    const result = await interpretWish(provider, {
      language: "zh",
      level: 3,
      loadoutSummary: "Empty Wishcraft Loadout",
      wish: "我要雷鸣闪电弹幕",
    });

    expect(result.finalWishcraft.primaryThemeId).toBe("thunder");
    expect(result.finalWishcraft.primaryMechanicId).not.toBe("projectile-lance");
    expect(result.finalWishcraft.name.cn).toContain("雷鸣");
    expect(result.trace.attempts).toHaveLength(4);
    expect(result.trace.validationErrors.length).toBeGreaterThan(0);
    expect(result.trace.fallbackReason).toBe("invalid_output");
  });

  it("turns forbidden or self-weakening wishes into positive fallback rewards", async () => {
    const provider = createSequenceProvider(["", "", "", ""]);

    const result = await interpretWish(provider, {
      language: "zh",
      level: 6,
      loadoutSummary: "Prior Wishcrafts exist; avoid repetition.",
      wish: "让我变弱并放一个自动炮塔陷阱",
    });

    const nameText = `${result.finalWishcraft.name.cn} ${result.finalWishcraft.name.en}`.toLocaleLowerCase();
    expect(result.finalWishcraft.primaryMechanicId).not.toContain("turret");
    expect(nameText).not.toContain("弱");
    expect(nameText).not.toContain("陷阱");
    expect(nameText).not.toContain("weak");
    expect(nameText).not.toContain("trap");
    expect(result.finalWishcraft.parameters.damageScale).not.toBeLessThan(1);
  });

  it("repairs contract-valid outputs whose names promise forbidden or negative mechanics", async () => {
    const forbiddenName = {
      ...wishcraftCatalog.fixtures.starLance,
      name: { cn: "炮塔陷阱", en: "Weak Trap" },
    };
    const provider = createSequenceProvider([
      JSON.stringify(forbiddenName),
      JSON.stringify({
        ...wishcraftCatalog.fixtures.starLance,
        name: { cn: "星火守护", en: "Starfire Guardian" },
      }),
    ]);

    const result = await interpretWish(provider, {
      language: "zh",
      level: 6,
      loadoutSummary: "Prior Wishcrafts exist; avoid repetition.",
      wish: "让我变弱并放一个自动炮塔陷阱",
    });

    expect(result.finalWishcraft.name).toEqual({ cn: "星火守护", en: "Starfire Guardian" });
    expect(result.trace.attempts).toHaveLength(2);
    expect(result.trace.attempts[0].errors).toEqual(
      expect.arrayContaining([expect.stringContaining("forbidden or negative fantasy")]),
    );
    expect(result.trace.fallbackReason).toBeUndefined();
  });

  it("does not crash when provider output is parseable JSON but missing Wishcraft fields", async () => {
    const provider = createSequenceProvider([
      JSON.stringify({ name: "not the expected object" }),
      JSON.stringify(wishcraftCatalog.fixtures.starLance),
    ]);

    const result = await interpretWish(provider, {
      language: "en",
      level: 2,
      loadoutSummary: "Empty Wishcraft Loadout",
      wish: "star lance",
    });

    expect(result.finalWishcraft).toEqual(wishcraftCatalog.fixtures.starLance);
    expect(result.trace.attempts).toHaveLength(2);
    expect(result.trace.attempts[0].errors.length).toBeGreaterThan(0);
  });

  it("repairs instead of throwing when parsed output has primary IDs but missing arrays or parameters", async () => {
    const provider = createSequenceProvider([
      JSON.stringify({
        id: "wishcraft-partial",
        sourceWish: "star lance",
        name: { cn: "星矛", en: "Star Lance" },
        primaryThemeId: "starfire",
        primaryMechanicId: "projectile-lance",
      }),
      JSON.stringify(wishcraftCatalog.fixtures.starLance),
    ]);

    const result = await interpretWish(provider, {
      language: "en",
      level: 2,
      loadoutSummary: "Empty Wishcraft Loadout",
      wish: "star lance",
    });

    expect(result.finalWishcraft).toEqual(wishcraftCatalog.fixtures.starLance);
    expect(result.trace.fallbackReason).toBeUndefined();
    expect(result.trace.attempts).toHaveLength(2);
    expect(result.trace.attempts[0].errors.length).toBeGreaterThan(0);
  });

  it("falls back instead of crashing when provider output is parseable non-object JSON", async () => {
    const provider = createSequenceProvider(["null", "null", "null", "null"]);

    const result = await interpretWish(provider, {
      language: "en",
      level: 2,
      loadoutSummary: "Empty Wishcraft Loadout",
      wish: "star lance",
    });

    expect(result.finalWishcraft.primaryThemeId).toBe("starfire");
    expect(result.trace.fallbackReason).toBe("invalid_output");
    expect(result.trace.attempts).toHaveLength(4);
    expect(result.trace.validationErrors.length).toBeGreaterThan(0);
  });
});

function createSequenceProvider(outputs: string[]): WishProvider & { calls: Array<Parameters<WishProvider["generate"]>[0]> } {
  const calls: Array<Parameters<WishProvider["generate"]>[0]> = [];
  return {
    calls,
    config: {
      model: "fake-wish-provider",
      provider: "fake",
      thinkingType: "disabled",
    },
    async generate(input) {
      calls.push(input);
      return {
        rawText: outputs[Math.min(calls.length - 1, outputs.length - 1)],
      };
    },
  };
}

function createThrowingProvider(): WishProvider {
  return {
    config: {
      model: "throwing-wish-provider",
      provider: "fake",
      thinkingType: "disabled",
    },
    async generate() {
      throw new Error("provider unavailable");
    },
  };
}

function createTransientThrowingProvider(outputs: string[]): WishProvider {
  let callIndex = 0;
  return {
    config: {
      model: "transient-wish-provider",
      provider: "fake",
      thinkingType: "disabled",
    },
    async generate() {
      callIndex += 1;
      if (callIndex === 1) {
        throw new Error("transient provider error");
      }
      return {
        rawText: outputs[Math.min(callIndex - 2, outputs.length - 1)],
      };
    },
  };
}
