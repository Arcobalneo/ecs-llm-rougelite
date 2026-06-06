import type { Wishcraft } from "../../shared/wishcraft/types.js";
import {
  isForbiddenWishcraftRuntime,
  mechanicById,
  numberParameter,
  orbitPosition,
  sameSummons,
} from "./wishcraft-runtime-utils.js";
import type {
  WishcraftRuntimeContext,
  WishcraftRuntimeState,
} from "./wishcraft-runtime-types.js";

export function syncShield(
  runtime: WishcraftRuntimeState,
  loadout: readonly Wishcraft[],
  context: WishcraftRuntimeContext,
): void {
  const shieldWishcrafts = loadout.filter((wishcraft) =>
    !isForbiddenWishcraftRuntime(wishcraft) &&
    wishcraft.mechanicPieceIds.some((id) => mechanicById(id)?.archetype === "shield"),
  );
  const capacity = shieldWishcrafts.reduce(
    (sum, wishcraft) => sum + numberParameter(wishcraft, "shieldCapacity", 0),
    0,
  );
  const regenDelaySeconds =
    shieldWishcrafts.length === 0
      ? 0
      : Math.min(
          ...shieldWishcrafts.map((wishcraft) =>
            numberParameter(wishcraft, "shieldRegenDelay", 4),
          ),
        );
  const previousCapacity = runtime.shield.capacity;
  runtime.shield.regenDelaySeconds = regenDelaySeconds;

  if (capacity === 0) {
    runtime.shield = {
      capacity: 0,
      nextRegenAtSeconds: 0,
      regenDelaySeconds: 0,
      value: 0,
    };
    return;
  }

  if (capacity !== previousCapacity) {
    const addedCapacity = Math.max(0, capacity - previousCapacity);
    runtime.shield = {
      capacity,
      nextRegenAtSeconds: runtime.shield.nextRegenAtSeconds,
      regenDelaySeconds,
      value: Math.min(capacity, runtime.shield.value + addedCapacity),
    };
    context.feedback.push({
      kind: "wishcraft-shield",
      capacity,
      position: context.player,
      wishcraftId: "shield-loadout",
    });
  }

  if (
    runtime.shield.value < runtime.shield.capacity &&
    context.nowSeconds >= runtime.shield.nextRegenAtSeconds
  ) {
    const regenPerSecond = Math.max(4, runtime.shield.capacity / regenDelaySeconds);
    runtime.shield.value = Math.min(
      runtime.shield.capacity,
      runtime.shield.value + regenPerSecond * context.deltaSeconds,
    );
  }
}

export function syncSummons(
  runtime: WishcraftRuntimeState,
  loadout: readonly Wishcraft[],
  context: WishcraftRuntimeContext,
): void {
  const summons = loadout.flatMap((wishcraft) => {
    if (
      isForbiddenWishcraftRuntime(wishcraft) ||
      !wishcraft.mechanicPieceIds.some((id) => mechanicById(id)?.archetype === "summon")
    ) {
      return [];
    }
    const count = Math.min(5, Math.max(1, Math.floor(numberParameter(wishcraft, "summonCount", 1))));
    return Array.from({ length: count }, (_, index) => ({
      craftId: wishcraft.id,
      id: `${wishcraft.id}-summon-${index}`,
      orbitRadius: numberParameter(wishcraft, "orbitRadius", 72),
      position: orbitPosition({
        center: context.player,
        index,
        count,
        nowSeconds: context.nowSeconds,
        radius: numberParameter(wishcraft, "orbitRadius", 72),
      }),
    }));
  });
  if (sameSummons(runtime.summons, summons)) {
    runtime.summons = runtime.summons.map((summon, index) => ({
      ...summon,
      position: summons[index]?.position ?? summon.position,
    }));
    return;
  }
  runtime.summons = summons;
  for (const summon of summons) {
    context.feedback.push({
      kind: "wishcraft-summon",
      position: context.player,
      summonId: summon.id,
      wishcraftId: summon.craftId,
    });
  }
}
