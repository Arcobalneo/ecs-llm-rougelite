import type { MovementVector } from "./movement.js";

export interface Point {
  x: number;
  y: number;
}

export interface ArenaBounds {
  width: number;
  height: number;
}

export interface Viewport {
  screenWidth: number;
  screenHeight: number;
  visibleWorldWidth: number;
  visibleWorldHeight: number;
  scale: number;
}

export interface ApplyMovementOptions {
  position: Point;
  movement: MovementVector;
  deltaSeconds: number;
}

export interface MovementResult {
  position: Point;
  edgeHit: boolean;
  damageTaken: number;
}

export const ARENA_BOUNDS: ArenaBounds = Object.freeze({
  width: 3200,
  height: 2000,
});

export const PLAYER_COLLISION_RADIUS = 18;
export const PLAYER_MOVE_SPEED = 220;
export const VISIBLE_WORLD_HEIGHT = 720;

export function applyMovement(options: ApplyMovementOptions): MovementResult {
  const next = {
    x: options.position.x + options.movement.x * PLAYER_MOVE_SPEED * options.deltaSeconds,
    y: options.position.y + options.movement.y * PLAYER_MOVE_SPEED * options.deltaSeconds,
  };
  const clamped = clampPlayerPosition(next);

  return {
    position: clamped,
    edgeHit: clamped.x !== next.x || clamped.y !== next.y,
    damageTaken: 0,
  };
}

export function clampPlayerPosition(position: Point): Point {
  return {
    x: clamp(position.x, PLAYER_COLLISION_RADIUS, ARENA_BOUNDS.width - PLAYER_COLLISION_RADIUS),
    y: clamp(position.y, PLAYER_COLLISION_RADIUS, ARENA_BOUNDS.height - PLAYER_COLLISION_RADIUS),
  };
}

export function calculateViewport(screen: { width: number; height: number }): Viewport {
  const scale = screen.height / VISIBLE_WORLD_HEIGHT;
  return {
    screenWidth: screen.width,
    screenHeight: screen.height,
    visibleWorldWidth: screen.width / scale,
    visibleWorldHeight: VISIBLE_WORLD_HEIGHT,
    scale,
  };
}

export function calculateCamera(options: { player: Point; viewport: Viewport }): Point {
  const maxX = Math.max(0, ARENA_BOUNDS.width - options.viewport.visibleWorldWidth);
  const maxY = Math.max(0, ARENA_BOUNDS.height - options.viewport.visibleWorldHeight);

  return {
    x: Math.round(clamp(options.player.x - options.viewport.visibleWorldWidth / 2, 0, maxX)),
    y: Math.round(clamp(options.player.y - options.viewport.visibleWorldHeight / 2, 0, maxY)),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
