import { describe, expect, it } from "vitest";
import {
  knownWishcraftPatternThemeKitCount,
  patternThemeKitForTheme,
  patternThemeKitSignature,
} from "../../src/client/visual/wishcraft/pattern/theme-kits.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";

describe("Wishcraft pattern theme kits", () => {
  it("defines a dedicated pattern kit for every configured theme", () => {
    expect(knownWishcraftPatternThemeKitCount()).toBe(wishcraftCatalog.themeTags.length);
  });

  it("keeps every theme pattern signature unique for wish-fidelity freshness", () => {
    const signatures = new Set(
      wishcraftCatalog.themeTags.map((theme) => patternThemeKitSignature(theme.id)),
    );

    expect(signatures.size).toBe(wishcraftCatalog.themeTags.length);
  });

  it("falls back to neon pattern language for unknown theme ids", () => {
    expect(patternThemeKitForTheme(undefined).themeId).toBe("neon");
    expect(patternThemeKitForTheme("not-real").themeId).toBe("neon");
  });

  it("uses different glyphs for closely related motif groups", () => {
    expect(patternThemeKitForTheme("starfire").glyph).not.toBe(patternThemeKitForTheme("solar").glyph);
    expect(patternThemeKitForTheme("frost").glyph).not.toBe(patternThemeKitForTheme("crystal").glyph);
    expect(patternThemeKitForTheme("dragon").glyph).not.toBe(patternThemeKitForTheme("demon").glyph);
    expect(patternThemeKitForTheme("music").glyph).not.toBe(patternThemeKitForTheme("quantum").glyph);
  });
});
