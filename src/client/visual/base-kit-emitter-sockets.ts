import type { Point } from "../simulation/arena-math.js";
import type { CombatFeedback } from "../simulation/combat-loop.js";

export type BaseKitEmitterSocketId =
  | "left-forearm-rail"
  | "left-sword-hilt"
  | "right-forearm-rail"
  | "right-sword-hilt";

export interface BaseKitEmitterSocket {
  origin: Point;
  socketId: BaseKitEmitterSocketId;
  visualKind: "laser-sword" | "machine-gun";
}

export interface BaseKitEmitterSocketProfile {
  laserSwordSockets: number;
  machineGunSockets: number;
  visualOnly: boolean;
}

const machineGunRailOffset = {
  left: { x: -58, y: -2 },
  right: { x: 58, y: -1 },
} as const;

const laserSwordHiltOffset = {
  left: { x: -48, y: 8 },
  right: { x: 48, y: 8 },
} as const;

export function baseKitEmitterSocketProfile(): BaseKitEmitterSocketProfile {
  return {
    laserSwordSockets: 2,
    machineGunSockets: 2,
    visualOnly: true,
  };
}

export function resolveBaseKitEmitterSocket(options: {
  event: CombatFeedback;
}): BaseKitEmitterSocket | undefined {
  const event = options.event;
  if (event.kind !== "impact" || !event.origin) {
    return undefined;
  }
  if (event.visualKind !== "machine-gun" && event.visualKind !== "laser-sword") {
    return undefined;
  }

  const side = event.position.x >= event.origin.x ? "right" : "left";
  const offset = event.visualKind === "machine-gun"
    ? machineGunRailOffset[side]
    : laserSwordHiltOffset[side];
  return {
    origin: {
      x: event.origin.x + offset.x,
      y: event.origin.y + offset.y,
    },
    socketId: event.visualKind === "machine-gun"
      ? side === "right"
        ? "right-forearm-rail"
        : "left-forearm-rail"
      : side === "right"
        ? "right-sword-hilt"
        : "left-sword-hilt",
    visualKind: event.visualKind,
  };
}

export function withBaseKitEmitterOrigin(
  event: CombatFeedback,
  socket: BaseKitEmitterSocket | undefined,
): CombatFeedback {
  if (event.kind !== "impact" || !socket) {
    return event;
  }
  return {
    ...event,
    origin: socket.origin,
  };
}
