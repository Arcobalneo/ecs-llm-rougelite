import type { Wishcraft } from "../../shared/wishcraft/types.js";

export type WishBreakPhase = "combat" | "wish-break" | "wish-fulfillment" | "manifestation";

export interface WishBreakState {
  activeCombatSeconds: number;
  combatPaused: boolean;
  currentLevel?: number;
  inFlightWish?: string;
  loadout: Wishcraft[];
  loadoutSummary: string;
  phase: WishBreakPhase;
  queuedLevels: number[];
}

export interface SubmitWishResult {
  accepted: boolean;
  reason?: "empty-wish" | "not-accepting-wish" | "fulfillment-in-flight";
  state: WishBreakState;
}

export function createWishBreakState(options?: {
  activeCombatSeconds?: number;
  loadout?: Wishcraft[];
}): WishBreakState {
  const loadout = options?.loadout ?? [];
  return {
    activeCombatSeconds: options?.activeCombatSeconds ?? 0,
    combatPaused: false,
    loadout,
    loadoutSummary: summarizeLoadout(loadout),
    phase: "combat",
    queuedLevels: [],
  };
}

export function startWishBreak(
  state: WishBreakState,
  options: { level: number },
): WishBreakState {
  if (state.phase !== "combat") {
    return {
      ...state,
      queuedLevels: [...state.queuedLevels, options.level],
    };
  }

  return {
    ...state,
    combatPaused: true,
    currentLevel: options.level,
    phase: "wish-break",
  };
}

export function submitWish(state: WishBreakState, wish: string): SubmitWishResult {
  if (state.phase === "wish-fulfillment") {
    return { accepted: false, reason: "fulfillment-in-flight", state };
  }
  if (state.phase !== "wish-break") {
    return { accepted: false, reason: "not-accepting-wish", state };
  }
  const trimmedWish = wish.trim();
  if (trimmedWish.length === 0) {
    return { accepted: false, reason: "empty-wish", state };
  }

  return {
    accepted: true,
    state: {
      ...state,
      combatPaused: true,
      inFlightWish: trimmedWish,
      phase: "wish-fulfillment",
    },
  };
}

export function receiveWishcraft(state: WishBreakState, wishcraft: Wishcraft): WishBreakState {
  if (state.phase !== "wish-fulfillment") {
    return state;
  }
  const loadout = [...state.loadout, wishcraft];
  return {
    ...state,
    combatPaused: true,
    inFlightWish: undefined,
    loadout,
    loadoutSummary: summarizeLoadout(loadout),
    phase: "manifestation",
  };
}

export function finishManifestation(state: WishBreakState): WishBreakState {
  if (state.queuedLevels.length > 0) {
    const [nextLevel, ...remainingLevels] = state.queuedLevels;
    return {
      ...state,
      combatPaused: true,
      currentLevel: nextLevel,
      phase: "wish-break",
      queuedLevels: remainingLevels,
    };
  }

  return {
    ...state,
    combatPaused: false,
    currentLevel: undefined,
    phase: "combat",
  };
}

function summarizeLoadout(loadout: readonly Wishcraft[]): string {
  if (loadout.length === 0) {
    return "Empty Wishcraft Loadout";
  }
  return loadout
    .map((craft, index) => `Lv.${index + 2}: ${craft.name.en} / ${craft.name.cn}`)
    .join("; ");
}
