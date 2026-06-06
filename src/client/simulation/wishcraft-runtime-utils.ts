import { wishcraftCatalog } from "../../shared/wishcraft/catalog.js";
import type { MechanicPiece, Wishcraft } from "../../shared/wishcraft/types.js";
import {
  forbiddenWishcraftParameterKeys,
  forbiddenWishcraftParameterKeySet,
} from "../../shared/wishcraft/validation.js";
import type { Point } from "./arena-math.js";
import type {
  WishcraftRuntimeEvent,
  WishcraftRuntimeState,
  WishcraftSummon,
  WishcraftVisualKind,
} from "./wishcraft-runtime-types.js";

export function numberParameter(wishcraft: Wishcraft, key: string, fallback: number): number {
  const value = wishcraft.parameters[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function mechanicById(id: string): MechanicPiece | undefined {
  return wishcraftCatalog.mechanicPieces.find((piece) => piece.id === id);
}

export function isForbiddenRuntimeMechanic(mechanic: MechanicPiece, wishcraft: Wishcraft): boolean {
  if (isForbiddenWishcraftRuntime(wishcraft)) {
    return true;
  }
  return (
    forbiddenWishcraftParameterKeys.some((key) =>
      Object.prototype.hasOwnProperty.call(wishcraft.parameters, key),
    ) ||
    mechanic.forbiddenFlags?.some((flag) => forbiddenWishcraftParameterKeySet.has(flag)) === true
  );
}

export function isForbiddenWishcraftRuntime(wishcraft: Wishcraft): boolean {
  return forbiddenWishcraftParameterKeys.some((key) =>
    Object.prototype.hasOwnProperty.call(wishcraft.parameters, key),
  );
}

export function sameSummons(left: readonly WishcraftSummon[], right: readonly WishcraftSummon[]): boolean {
  return (
    left.length === right.length &&
    left.every((summon, index) => summon.id === right[index]?.id && summon.orbitRadius === right[index]?.orbitRadius)
  );
}

export function triggerMatchesEvent(mechanic: MechanicPiece, event: WishcraftRuntimeEvent): boolean {
  if (mechanic.id.includes("on-kill")) {
    return event.kind === "kill";
  }
  if (mechanic.id.includes("on-pickup")) {
    return event.kind === "pickup";
  }
  if (mechanic.id.includes("low-shield")) {
    return event.kind === "low-shield";
  }
  return event.kind === "kill" || event.kind === "pickup" || event.kind === "low-shield";
}

export function orbitPosition(options: {
  center: Point;
  count: number;
  index: number;
  nowSeconds: number;
  radius: number;
}): Point {
  const angle = options.nowSeconds * 1.8 + (options.index / Math.max(1, options.count)) * Math.PI * 2;
  return {
    x: options.center.x + Math.cos(angle) * options.radius,
    y: options.center.y + Math.sin(angle) * options.radius,
  };
}

export function projectileCount(wishcraft: Wishcraft): number {
  return Math.min(8, Math.max(1, Math.floor(numberParameter(wishcraft, "projectileCount", 1))));
}

export function visualKindForMechanic(mechanic: MechanicPiece): WishcraftVisualKind {
  if (mechanic.id.includes("beam") || mechanic.id.includes("pierce")) {
    return "beam";
  }
  if (mechanic.id.includes("missile")) {
    return "missile";
  }
  if (mechanic.id.includes("scatter")) {
    return "scatter";
  }
  if (mechanic.id.includes("ricochet")) {
    return "ricochet";
  }
  if (mechanic.archetype === "area-burst") {
    return "area";
  }
  if (mechanic.archetype === "burst") {
    return "burst";
  }
  if (mechanic.archetype === "trigger") {
    return "trigger";
  }
  if (mechanic.archetype === "summon") {
    return "summon";
  }
  if (mechanic.archetype === "shield") {
    return "shield";
  }
  if (mechanic.archetype === "pickup") {
    return "pickup";
  }
  return "lance";
}

export function isReady(runtime: WishcraftRuntimeState, wishcraft: Wishcraft, nowSeconds: number): boolean {
  return nowSeconds >= (runtime.nextFireAtSecondsByCraftId[wishcraft.id] ?? 0);
}

export function angleBetween(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function shortestAngleDelta(left: number, right: number): number {
  return Math.atan2(Math.sin(right - left), Math.cos(right - left));
}

export function degreesToRadians(degrees: number): number {
  return (degrees / 180) * Math.PI;
}

export function distanceBetween(left: Point, right: Point): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

export function normalize(vector: Point): Point {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) {
    return { x: 1, y: 0 };
  }
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}
