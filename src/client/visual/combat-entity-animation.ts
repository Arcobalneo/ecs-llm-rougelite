import type { MovementVector } from "../simulation/movement.js";
import type { CommonEnemyTemplate } from "../simulation/combat.js";

export type EnemyAnimationFrame = 0 | 1 | 2 | 3;

export interface PlayerMechAnimationState {
  bob: number;
  hitFlash: number;
  idleFrame: 0 | 1 | 2 | 3 | 4 | 5;
  leanX: number;
  leanY: number;
  movementStrength: number;
  thrusterBack: number;
  thrusterDown: number;
  thrusterLeft: number;
  thrusterRight: number;
  wishInstallProgress: number;
}

export interface EnemySpriteAnimationState {
  frame: EnemyAnimationFrame;
  hitFlashAlpha: number;
  phase: number;
  recoilX: number;
  recoilY: number;
  thrust: number;
}

export interface BossSpriteAnimationState {
  auraPulse: number;
  entranceAlpha: number;
  frame: EnemyAnimationFrame;
  hitFlashAlpha: number;
  jawOpen: number;
  telegraph: number;
  wingSpread: number;
}

export function playerMechAnimationState(options: {
  movement: MovementVector;
  nowSeconds: number;
}): PlayerMechAnimationState {
  const moving = options.movement.strength;
  const idlePulse = Math.sin(options.nowSeconds * 4.2);
  const thrustPulse = 0.5 + Math.sin(options.nowSeconds * 13.5) * 0.5;
  return {
    bob: idlePulse * (moving > 0 ? 1.2 : 2.2),
    hitFlash: 0,
    idleFrame: Math.floor(options.nowSeconds * 6) % 6 as PlayerMechAnimationState["idleFrame"],
    leanX: options.movement.x * 3.8,
    leanY: options.movement.y * 2.2,
    movementStrength: moving,
    thrusterBack: 12 + moving * (14 + thrustPulse * 8),
    thrusterDown: 14 + Math.max(0, -options.movement.y) * 15 + thrustPulse * 4,
    thrusterLeft: 8 + Math.max(0, options.movement.x) * 15 + thrustPulse * 3,
    thrusterRight: 8 + Math.max(0, -options.movement.x) * 15 + thrustPulse * 3,
    wishInstallProgress: 1,
  };
}

export function enemySpriteAnimationState(options: {
  damaged: boolean;
  id: string;
  nowSeconds: number;
  templateId: CommonEnemyTemplate["id"];
}): EnemySpriteAnimationState {
  const seed = numericSeed(options.id);
  const speed =
    options.templateId === "fast-fragile"
      ? 10.5
      : options.templateId === "slow-tough"
        ? 5.3
        : 13.5;
  const frame = Math.floor(options.nowSeconds * speed + seed) % 4 as EnemyAnimationFrame;
  const phase = 0.5 + Math.sin(options.nowSeconds * speed + seed * 0.31) * 0.5;
  return {
    frame,
    hitFlashAlpha: options.damaged ? 0.5 + phase * 0.22 : 0,
    phase,
    recoilX: options.damaged ? Math.sin(seed + options.nowSeconds * 41) * 2.2 : 0,
    recoilY: options.damaged ? Math.cos(seed + options.nowSeconds * 37) * 1.8 : 0,
    thrust: 0.75 + phase * 0.55,
  };
}

export function bossSpriteAnimationState(options: {
  healthProgress: number;
  index: number;
  nowSeconds: number;
  phase: string;
}): BossSpriteAnimationState {
  const frame = Math.floor(options.nowSeconds * 4.6 + options.index) % 4 as EnemyAnimationFrame;
  const pulse = 0.5 + Math.sin(options.nowSeconds * 2.4 + options.index * 1.7) * 0.5;
  const wounded = 1 - Math.max(0, Math.min(1, options.healthProgress));
  const warningTelegraph = options.phase === "warning" ? 0.45 + pulse * 0.35 : 0;
  const activeTelegraph = options.phase === "active" ? Math.max(0, Math.sin(options.nowSeconds * 3.2 + options.index)) : 0;
  return {
    auraPulse: 0.75 + pulse * 0.42 + wounded * 0.28,
    entranceAlpha: options.phase === "warning" ? 0.45 + pulse * 0.35 : 1,
    frame,
    hitFlashAlpha: wounded > 0.02 ? 0.08 + pulse * Math.min(0.22, wounded * 0.32) : 0,
    jawOpen: warningTelegraph + activeTelegraph * 0.28,
    telegraph: Math.max(warningTelegraph, activeTelegraph * 0.62),
    wingSpread: 0.85 + pulse * 0.28,
  };
}

function numericSeed(id: string): number {
  return [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}
