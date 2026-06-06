import type { AttachmentSlot, Wishcraft } from "../../shared/wishcraft/types.js";
import type { Point } from "../simulation/arena-math.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";
import {
  layoutRuntimeVisualAttachments,
  type RuntimeVisualAssembly,
  type RuntimeVisualAttachment,
} from "./visual-assembly.js";
import { runtimeAttachmentSlotOffset } from "./runtime-attachment-layout.js";

export interface WishcraftEmitterSocket {
  attachment?: RuntimeVisualAttachment;
  origin: Point;
  slot?: AttachmentSlot;
  slotIndex: number;
}

const projectileSlots: AttachmentSlot[] = ["weapon", "projectile", "arm", "shoulder", "back"];
const areaSlots: AttachmentSlot[] = ["core", "aura", "back", "shoulder", "head"];
const meleeSlots: AttachmentSlot[] = ["weapon", "arm", "shoulder", "core"];
const summonSlots: AttachmentSlot[] = ["summon", "orbit", "back", "shoulder"];
const shieldSlots: AttachmentSlot[] = ["aura", "core", "shoulder", "back"];
const pickupSlots: AttachmentSlot[] = ["orbit", "aura", "core", "hip"];
const triggerSlots: AttachmentSlot[] = ["core", "impact", "aura", "back"];

export function resolveWishcraftEmitterSocket(options: {
  event: CombatFeedback;
  loadout: readonly Wishcraft[];
  visuals: RuntimeVisualAssembly;
}): WishcraftEmitterSocket | undefined {
  if (options.event.kind !== "wishcraft-hit") {
    return undefined;
  }
  const event = options.event;

  const layout = layoutRuntimeVisualAttachments(options.visuals.attachments);
  const matchingCraftLayout = layout.filter(
    (candidate) => candidate.attachment.wishcraftId === event.wishcraftId,
  );
  const candidates = matchingCraftLayout.length > 0 ? matchingCraftLayout : layout;
  const selected = selectEmitterAttachment({
    candidates,
    event,
    loadout: options.loadout,
  });
  if (!selected) {
    return {
      origin: { ...event.origin },
      slotIndex: -1,
    };
  }

  const offset = runtimeAttachmentSlotOffset(
    selected.attachment.slot,
    selected.slotIndex,
    selected.attachment.scale,
  );
  return {
    attachment: selected.attachment,
    origin: {
      x: event.origin.x + offset.x,
      y: event.origin.y + offset.y,
    },
    slot: selected.attachment.slot,
    slotIndex: selected.slotIndex,
  };
}

export function withWishcraftEmitterOrigin(
  event: CombatFeedback,
  socket: WishcraftEmitterSocket | undefined,
): CombatFeedback {
  if (event.kind !== "wishcraft-hit" || !socket) {
    return event;
  }
  return {
    ...event,
    origin: socket.origin,
  };
}

function selectEmitterAttachment(options: {
  candidates: ReturnType<typeof layoutRuntimeVisualAttachments>;
  event: Extract<CombatFeedback, { kind: "wishcraft-hit" }>;
  loadout: readonly Wishcraft[];
}): ReturnType<typeof layoutRuntimeVisualAttachments>[number] | undefined {
  const preferredSlots = preferredEmitterSlots(options.event);
  const wishcraft = options.loadout.find((candidate) => candidate.id === options.event.wishcraftId);
  const visualPieceRank = new Map(
    (wishcraft?.visualPieceIds ?? []).map((visualPieceId, index) => [visualPieceId, index]),
  );

  return options.candidates
    .map((candidate, index) => ({
      candidate,
      index,
      rank: preferredSlots.indexOf(candidate.attachment.slot),
      visualPieceRank: visualPieceRank.get(candidate.attachment.visualPieceId) ?? Number.MAX_SAFE_INTEGER,
    }))
    .filter((candidate) => candidate.rank >= 0)
    .sort(
      (left, right) =>
        left.rank - right.rank ||
        left.visualPieceRank - right.visualPieceRank ||
        left.candidate.slotIndex - right.candidate.slotIndex ||
        left.index - right.index,
    )[0]?.candidate;
}

function preferredEmitterSlots(event: Extract<CombatFeedback, { kind: "wishcraft-hit" }>): readonly AttachmentSlot[] {
  if (event.visualKind === "melee") {
    return meleeSlots;
  }
  if (event.visualKind === "area" || event.visualKind === "burst") {
    return areaSlots;
  }
  if (event.visualKind === "summon") {
    return summonSlots;
  }
  if (event.visualKind === "shield") {
    return shieldSlots;
  }
  if (event.visualKind === "pickup") {
    return pickupSlots;
  }
  if (event.visualKind === "trigger") {
    return triggerSlots;
  }
  return projectileSlots;
}
