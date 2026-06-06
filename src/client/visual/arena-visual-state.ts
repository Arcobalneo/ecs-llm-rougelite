import { wishcraftCatalog } from "../../shared/wishcraft/catalog.js";
import type { ThemeId, Wishcraft } from "../../shared/wishcraft/types.js";

export interface EnemyDriftVisualState {
  dominantThemeId?: ThemeId;
  loadoutWindow: number;
  secondaryThemeIds: ThemeId[];
  tintColor: number;
  accentColor: number;
}

export interface ArenaVisualPhase {
  id: "deep-starfield" | "nebula-rift" | "ion-graveyard" | "singularity-gate";
  backgroundColor: number;
  gridColor: number;
  starColor: number;
  accentColor: number;
  intensity: number;
}

export interface ArenaVisualState {
  phase: ArenaVisualPhase;
  phaseIndex: number;
}

export interface ArenaPhaseTint {
  alpha: number;
  color: number;
  themeId?: ThemeId;
}

const enemyDriftWindow = 3;

export const arenaVisualPhases: ArenaVisualPhase[] = [
  {
    id: "deep-starfield",
    backgroundColor: 0x050712,
    gridColor: 0x1a496a,
    starColor: 0xe8fbff,
    accentColor: 0xff4fd8,
    intensity: 0.8,
  },
  {
    id: "nebula-rift",
    backgroundColor: 0x08051a,
    gridColor: 0x4a2c78,
    starColor: 0xffd6ff,
    accentColor: 0x44f5ff,
    intensity: 0.95,
  },
  {
    id: "ion-graveyard",
    backgroundColor: 0x041316,
    gridColor: 0x2e6f74,
    starColor: 0xa8ffef,
    accentColor: 0xfff06a,
    intensity: 1.08,
  },
  {
    id: "singularity-gate",
    backgroundColor: 0x070511,
    gridColor: 0x5b4dff,
    starColor: 0xf7fdff,
    accentColor: 0xff4fd8,
    intensity: 1.18,
  },
];

export function createArenaVisualState(): ArenaVisualState {
  return {
    phase: arenaVisualPhases[0],
    phaseIndex: 0,
  };
}

export function enemyDriftFromLoadout(loadout: readonly Wishcraft[]): EnemyDriftVisualState {
  const recent = loadout.slice(-enemyDriftWindow).reverse();
  const dominantThemeId = normalizeThemeId(recent[0]?.primaryThemeId);
  const secondaryThemeIds = recent
    .slice(1)
    .map((wishcraft) => normalizeThemeId(wishcraft.primaryThemeId))
    .filter((themeId): themeId is ThemeId => themeId !== undefined);
  const dominantTheme = themeById(dominantThemeId);
  const secondaryTheme = themeById(secondaryThemeIds[0]);
  return {
    dominantThemeId,
    loadoutWindow: enemyDriftWindow,
    secondaryThemeIds,
    tintColor: colorFromTheme(dominantTheme, 0x75ff9a, "primary"),
    accentColor: colorFromTheme(secondaryTheme ?? dominantTheme, 0xe8fbff, "accent"),
  };
}

export function advanceArenaPhaseAfterBossCompletion(
  state: ArenaVisualState,
  event: { doubleBoss: boolean },
): ArenaVisualState {
  if (!event.doubleBoss) {
    return state;
  }
  const phaseIndex = (state.phaseIndex + 1) % arenaVisualPhases.length;
  return {
    phase: arenaVisualPhases[phaseIndex],
    phaseIndex,
  };
}

export function phaseTintFromLoadout(options: {
  loadout: readonly Wishcraft[];
  phase: ArenaVisualPhase;
}): ArenaPhaseTint {
  const latestThemeId = normalizeThemeId(options.loadout.at(-1)?.primaryThemeId);
  const theme = themeById(latestThemeId);
  return {
    alpha: latestThemeId ? 0.16 : 0,
    color: colorFromTheme(theme, options.phase.accentColor, "primary"),
    themeId: latestThemeId,
  };
}

function themeById(themeId: ThemeId | undefined) {
  if (!themeId) {
    return undefined;
  }
  return wishcraftCatalog.themeTags.find((theme) => theme.id === themeId);
}

function normalizeThemeId(themeId: string | undefined): ThemeId | undefined {
  return wishcraftCatalog.themeTags.some((theme) => theme.id === themeId)
    ? (themeId as ThemeId)
    : undefined;
}

function colorFromTheme(
  theme: (typeof wishcraftCatalog.themeTags)[number] | undefined,
  fallback: number,
  role: "accent" | "primary",
): number {
  if (!theme) {
    return fallback;
  }
  return Number.parseInt(theme.palette[role].replace("#", ""), 16);
}
