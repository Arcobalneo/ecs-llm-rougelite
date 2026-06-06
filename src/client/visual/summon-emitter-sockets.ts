import type { CombatFeedback } from "../simulation/combat-loop.js";
import type { WishcraftSummon } from "../simulation/wishcraft-mechanics.js";

export interface SummonEmitterSocket {
  origin: { x: number; y: number };
  summonId: string;
}

export function resolveSummonEmitterSocket(options: {
  event: CombatFeedback;
  summons: readonly WishcraftSummon[];
}): SummonEmitterSocket | undefined {
  const event = options.event;
  if (!isSummonHitFeedback(event)) {
    return undefined;
  }
  const summon = options.summons.find((candidate) => candidate.craftId === event.wishcraftId);
  if (!summon) {
    return undefined;
  }
  return {
    origin: { ...summon.position },
    summonId: summon.id,
  };
}

export function withSummonEmitterOrigin(
  event: CombatFeedback,
  socket: SummonEmitterSocket | undefined,
): CombatFeedback {
  if (event.kind !== "wishcraft-hit" || !socket) {
    return event;
  }
  return {
    ...event,
    origin: socket.origin,
  };
}

function isSummonHitFeedback(
  event: CombatFeedback,
): event is Extract<CombatFeedback, { kind: "wishcraft-hit" }> {
  return event.kind === "wishcraft-hit" && event.visualKind === "summon";
}
