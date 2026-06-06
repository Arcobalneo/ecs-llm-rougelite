import type { Wishcraft } from "../../shared/wishcraft/types.js";
import { applyMechanicAttack, cooldownSeconds } from "./wishcraft-attacks.js";
import { syncShield, syncSummons } from "./wishcraft-persistent-effects.js";
import {
  isForbiddenRuntimeMechanic,
  isReady,
  mechanicById,
} from "./wishcraft-runtime-utils.js";
import type {
  WishcraftRuntimeContext,
  WishcraftRuntimeState,
} from "./wishcraft-runtime-types.js";

export type {
  WishcraftRuntimeContext,
  WishcraftRuntimeEnemy,
  WishcraftRuntimeEvent,
  WishcraftRuntimeFeedback,
  WishcraftRuntimeState,
  WishcraftStatSupport,
  WishcraftSummon,
  WishcraftVisualKind,
} from "./wishcraft-runtime-types.js";
export {
  absorbDamageWithWishcraftShield,
  pickupRangeForWishcrafts,
  statSupportForWishcrafts,
} from "./wishcraft-support.js";

export function createWishcraftRuntimeState(): WishcraftRuntimeState {
  return {
    nextFireAtSecondsByCraftId: {},
    shield: {
      capacity: 0,
      nextRegenAtSeconds: 0,
      regenDelaySeconds: 0,
      value: 0,
    },
    summons: [],
  };
}

export function stepWishcraftMechanics(options: {
  context: WishcraftRuntimeContext;
  loadout: readonly Wishcraft[];
  mode?: "all" | "triggers";
  runtime: WishcraftRuntimeState;
}): void {
  const mode = options.mode ?? "all";
  if (mode === "all") {
    syncShield(options.runtime, options.loadout, options.context);
    syncSummons(options.runtime, options.loadout, options.context);
  }

  for (const wishcraft of options.loadout) {
    const mechanic = mechanicById(wishcraft.primaryMechanicId);
    if (!mechanic || isForbiddenRuntimeMechanic(mechanic, wishcraft)) {
      continue;
    }
    if (mode === "triggers" && mechanic.archetype !== "trigger") {
      continue;
    }
    if (mechanic.archetype === "shield" || mechanic.archetype === "pickup" || mechanic.archetype === "stat-support") {
      continue;
    }
    if (!isReady(options.runtime, wishcraft, options.context.nowSeconds)) {
      continue;
    }
    const applied = applyMechanicAttack({
      context: options.context,
      mechanic,
      wishcraft,
    });
    if (applied) {
      options.runtime.nextFireAtSecondsByCraftId[wishcraft.id] =
        options.context.nowSeconds + cooldownSeconds(wishcraft, mechanic);
    }
  }
}
