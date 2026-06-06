import { wishcraftCatalog } from "../../shared/wishcraft/catalog.js";
import type { Wishcraft } from "../../shared/wishcraft/types.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";

export interface WishcraftVfxPalette {
  accent: number;
  color: number;
}

export function paletteForWishcraftFeedback(
  event: Extract<CombatFeedback, { kind: "wishcraft-hit" }>,
  loadout: readonly Wishcraft[],
): WishcraftVfxPalette {
  const wishcraft = loadout.find((craft) => craft.id === event.wishcraftId);
  const theme = wishcraftCatalog.themeTags.find((candidate) => candidate.id === wishcraft?.primaryThemeId);
  if (!theme) {
    const color = colorForWishcraftVisual(event.visualKind);
    return { accent: 0xe8fbff, color };
  }
  return {
    accent: Number.parseInt(theme.palette.accent.replace("#", ""), 16),
    color: Number.parseInt(theme.palette.primary.replace("#", ""), 16),
  };
}

export function themeIdForWishcraftFeedback(
  event: Extract<CombatFeedback, { kind: "wishcraft-hit" }>,
  loadout: readonly Wishcraft[],
): string | undefined {
  return loadout.find((craft) => craft.id === event.wishcraftId)?.primaryThemeId;
}

export function colorForWishcraftVisual(visualKind: string): number {
  const colors: Record<string, number> = {
    area: 0xff4fd8,
    beam: 0x44f5ff,
    burst: 0xffcc4d,
    lance: 0xfff2a8,
    melee: 0xe8fbff,
    missile: 0xff7a3d,
    pickup: 0x8cffd2,
    ricochet: 0x7affb2,
    scatter: 0xff6bd6,
    shield: 0x62ff9d,
    summon: 0xfff6d6,
    trigger: 0x7df9ff,
  };
  return colors[visualKind] ?? 0x44f5ff;
}
