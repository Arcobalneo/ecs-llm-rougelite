import type { Point } from "./arena-math.js";
import type { CombatEnemy, CommonEnemyTemplate } from "./combat.js";

export interface WishcraftRuntimeEnemy extends CombatEnemy {
  health: number;
  templateId: CommonEnemyTemplate["id"];
}

export interface WishcraftRuntimeContext {
  deltaSeconds: number;
  enemies: WishcraftRuntimeEnemy[];
  events: readonly WishcraftRuntimeEvent[];
  feedback: { push(feedback: WishcraftRuntimeFeedback): number };
  nowSeconds: number;
  player: Point;
}

export interface WishcraftRuntimeState {
  nextFireAtSecondsByCraftId: Record<string, number>;
  summons: WishcraftSummon[];
  shield: {
    capacity: number;
    nextRegenAtSeconds: number;
    regenDelaySeconds: number;
    value: number;
  };
}

export interface WishcraftStatSupport {
  damageScale: number;
  fireRateScale: number;
  projectileSpeedScale: number;
}

export interface WishcraftSummon {
  craftId: string;
  id: string;
  orbitRadius: number;
  position: Point;
}

export type WishcraftRuntimeEvent =
  | { kind: "kill"; position: Point }
  | { kind: "low-shield"; position: Point }
  | { kind: "pickup"; position: Point };

export type WishcraftRuntimeFeedback =
  | {
      kind: "wishcraft-hit";
      mechanicId: string;
      origin: Point;
      position: Point;
      targetRadius?: number;
      targetTemplateId?: CommonEnemyTemplate["id"];
      visualKind: WishcraftVisualKind;
      wishcraftId: string;
    }
  | {
      kind: "wishcraft-shield";
      capacity: number;
      position: Point;
      wishcraftId: string;
    }
  | {
      kind: "wishcraft-summon";
      position: Point;
      summonId: string;
      wishcraftId: string;
    };

export type WishcraftVisualKind =
  | "area"
  | "beam"
  | "burst"
  | "lance"
  | "melee"
  | "missile"
  | "pickup"
  | "ricochet"
  | "scatter"
  | "shield"
  | "summon"
  | "trigger";
