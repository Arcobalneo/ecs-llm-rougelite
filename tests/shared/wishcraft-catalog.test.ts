import { describe, expect, it } from "vitest";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";
import { validateCatalogCompleteness } from "../../src/shared/wishcraft/validation.js";

describe("Wishcraft content catalog", () => {
  it("is broad enough for initial Wishcraft composition depth", () => {
    expect(wishcraftCatalog.themeTags).toHaveLength(24);
    expect(wishcraftCatalog.mechanicPieces.length).toBeGreaterThanOrEqual(30);
    expect(wishcraftCatalog.visualPieces.length).toBeGreaterThanOrEqual(80);
    expect(wishcraftCatalog.visualPieces.length).toBeLessThanOrEqual(120);
  });

  it("fully configures every Theme Tag instead of exposing bare labels", () => {
    for (const theme of wishcraftCatalog.themeTags) {
      expect(theme.displayName.cn.length).toBeGreaterThan(0);
      expect(theme.displayName.en.length).toBeGreaterThan(0);
      expect(theme.palette.primary).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.palette.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.effects.length).toBeGreaterThanOrEqual(2);
      expect(theme.fallbackKeywords.cn.length).toBeGreaterThanOrEqual(2);
      expect(theme.fallbackKeywords.en.length).toBeGreaterThanOrEqual(2);
      expect(theme.rivalThemeIds.length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(theme.mechanicCompatibility).length).toBeGreaterThanOrEqual(5);
      expect(Math.max(...Object.values(theme.mechanicCompatibility))).toBeGreaterThanOrEqual(1.15);
      expect(Math.min(...Object.values(theme.mechanicCompatibility))).toBeLessThanOrEqual(0.65);
      expect(theme.testExamples.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("passes configuration completeness checks for IDs, budgets, schemas, attachment coverage, and rivals", () => {
    expect(validateCatalogCompleteness(wishcraftCatalog)).toEqual([]);
  });

  it("keeps Visual Pieces and Mechanic Pieces decoupled through Theme Tags and slots", () => {
    const visualSlots = new Set(wishcraftCatalog.visualPieces.map((visual) => visual.slot));
    for (const semantics of wishcraftCatalog.attachmentSemantics) {
      expect(visualSlots.has(semantics.slot)).toBe(true);
    }

    for (const visual of wishcraftCatalog.visualPieces) {
      expect(visual).not.toHaveProperty("mechanicPieceId");
      expect(visual).not.toHaveProperty("damageScale");
      expect(wishcraftCatalog.themeTags.some((theme) => theme.id === visual.themeId)).toBe(true);
      expect(
        wishcraftCatalog.attachmentSemantics.some((semantics) => semantics.slot === visual.slot),
      ).toBe(true);
    }

    for (const mechanic of wishcraftCatalog.mechanicPieces) {
      expect(mechanic).not.toHaveProperty("visualPieceId");
      expect(mechanic.allowedThemeIds.length).toBeGreaterThanOrEqual(8);
      expect(mechanic.allowedThemeIds.length).toBeLessThan(wishcraftCatalog.themeTags.length);
    }
  });

  it("fails completeness checks for missing budgets, schema ranges, attachment coverage, and rival data", () => {
    expect(
      validateCatalogCompleteness({
        ...wishcraftCatalog,
        themeTags: [wishcraftCatalog.themeTags[0], ...wishcraftCatalog.themeTags],
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("themeTags duplicate id")]));

    expect(
      validateCatalogCompleteness({
        ...wishcraftCatalog,
        themeTags: [
          { ...wishcraftCatalog.themeTags[0], fallbackKeywords: { cn: [], en: [] } },
          ...wishcraftCatalog.themeTags.slice(1),
        ],
      }),
    ).toContain("theme starfire missing fallback keywords");

    expect(
      validateCatalogCompleteness({
        ...wishcraftCatalog,
        themeTags: [
          { ...wishcraftCatalog.themeTags[0], effects: [] },
          ...wishcraftCatalog.themeTags.slice(1),
        ],
      }),
    ).toContain("theme starfire missing effects");

    expect(
      validateCatalogCompleteness({
        ...wishcraftCatalog,
        themeTags: [
          { ...wishcraftCatalog.themeTags[0], mechanicCompatibility: {} },
          ...wishcraftCatalog.themeTags.slice(1),
        ],
      }),
    ).toContain("theme starfire missing mechanic compatibility");

    expect(
      validateCatalogCompleteness({
        ...wishcraftCatalog,
        themeTags: [
          { ...wishcraftCatalog.themeTags[0], testExamples: [] },
          ...wishcraftCatalog.themeTags.slice(1),
        ],
      }),
    ).toContain("theme starfire missing test examples");

    expect(
      validateCatalogCompleteness({
        ...wishcraftCatalog,
        budgets: [],
      }),
    ).toContain("missing budgets");

    expect(
      validateCatalogCompleteness({
        ...wishcraftCatalog,
        mechanicPieces: [
          {
            ...wishcraftCatalog.mechanicPieces[0],
            parameterSchema: { damageScale: { default: 1 } },
          },
          ...wishcraftCatalog.mechanicPieces.slice(1),
        ],
      }),
    ).toContain("mechanic projectile-lance parameter damageScale missing range");

    expect(
      validateCatalogCompleteness({
        ...wishcraftCatalog,
        attachmentSemantics: wishcraftCatalog.attachmentSemantics.filter(
          (semantics) => semantics.slot !== "weapon",
        ),
      }),
    ).toEqual(expect.arrayContaining([expect.stringContaining("missing attachment semantics")]));

    expect(
      validateCatalogCompleteness({
        ...wishcraftCatalog,
        visualPieces: wishcraftCatalog.visualPieces.filter((visual) => visual.slot !== "weapon"),
      }),
    ).toContain("slot weapon missing visual pieces");

    expect(
      validateCatalogCompleteness({
        ...wishcraftCatalog,
        themeTags: [
          { ...wishcraftCatalog.themeTags[0], rivalThemeIds: [] },
          ...wishcraftCatalog.themeTags.slice(1),
        ],
      }),
    ).toContain("theme starfire missing rival themes");
  });
});
