import type { MechanicPiece, Wishcraft } from "../../shared/wishcraft/types.js";
import {
  isForbiddenRuntimeMechanic,
  isForbiddenWishcraftRuntime,
  mechanicById,
  numberParameter,
} from "./wishcraft-runtime-utils.js";
import type {
  WishcraftRuntimeState,
  WishcraftStatSupport,
} from "./wishcraft-runtime-types.js";

export function pickupRangeForWishcrafts(loadout: readonly Wishcraft[], baseRange: number): number {
  const scale = loadout.reduce((currentScale, wishcraft) => {
    if (isForbiddenWishcraftRuntime(wishcraft)) {
      return currentScale;
    }
    if (!wishcraft.mechanicPieceIds.some((id) => mechanicById(id)?.archetype === "pickup")) {
      return currentScale;
    }
    return Math.max(currentScale, numberParameter(wishcraft, "pickupRangeScale", 1));
  }, 1);
  return baseRange * scale;
}

export function statSupportForWishcrafts(loadout: readonly Wishcraft[]): WishcraftStatSupport {
  return loadout.reduce<WishcraftStatSupport>(
    (support, wishcraft) => {
      const supportPieces = wishcraft.mechanicPieceIds
        .map((id) => mechanicById(id))
        .filter((piece): piece is MechanicPiece => piece?.archetype === "stat-support");
      if (
        supportPieces.length === 0 ||
        supportPieces.some((piece) => isForbiddenRuntimeMechanic(piece, wishcraft))
      ) {
        return support;
      }

      return {
        damageScale: support.damageScale + Math.max(0, numberParameter(wishcraft, "damageScale", 1) - 1),
        fireRateScale:
          support.fireRateScale + Math.max(0, numberParameter(wishcraft, "fireRateScale", 1) - 1),
        projectileSpeedScale:
          support.projectileSpeedScale +
          Math.max(0, numberParameter(wishcraft, "projectileSpeedScale", 1) - 1),
      };
    },
    {
      damageScale: 1,
      fireRateScale: 1,
      projectileSpeedScale: 1,
    },
  );
}

export function absorbDamageWithWishcraftShield(options: {
  damage: number;
  nowSeconds: number;
  runtime: WishcraftRuntimeState;
}): { healthDamage: number; shieldDamage: number } {
  if (options.damage <= 0 || options.runtime.shield.capacity <= 0 || options.runtime.shield.value <= 0) {
    return { healthDamage: Math.max(0, options.damage), shieldDamage: 0 };
  }

  const shieldDamage = Math.min(options.runtime.shield.value, options.damage);
  options.runtime.shield.value -= shieldDamage;
  options.runtime.shield.nextRegenAtSeconds =
    options.nowSeconds + options.runtime.shield.regenDelaySeconds;

  return {
    healthDamage: options.damage - shieldDamage,
    shieldDamage,
  };
}
