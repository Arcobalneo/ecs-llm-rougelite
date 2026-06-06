import {
  ARENA_BOUNDS,
  type Point,
} from "./arena-math.js";
import { getCommonEnemyTemplate } from "./combat.js";
import type {
  CombatLoopEnemy,
  CombatLoopState,
} from "./combat-loop.js";

export const INITIAL_ENEMY_COUNT = 36;

export function createInitialEnemies(player: Point): CombatLoopEnemy[] {
  return Array.from({ length: INITIAL_ENEMY_COUNT }, (_, index) =>
    createEnemy(`enemy-initial-${index}`, enemyTemplateForSpawnIndex(index), enemySpawnPosition(player, index, 280)),
  );
}

export function spawnReplacementEnemies(combatState: CombatLoopState, player: Point): void {
  const desiredEnemyCount = desiredEnemyCountForBossKills(combatState.bossKills, combatState.activeCombatSeconds);
  while (combatState.enemies.length < desiredEnemyCount) {
    const index = combatState.kills + combatState.enemies.length;
    combatState.enemies.push(
      createEnemy(`enemy-${index}`, enemyTemplateForSpawnIndex(index), enemySpawnPosition(player, index, 430)),
    );
  }
}

export function desiredEnemyCountForBossKills(bossKills: number, activeCombatSeconds = 0): number {
  const bossPressure = Math.max(0, Math.floor(bossKills)) * 14;
  const timePressure = Math.min(64, Math.floor(Math.max(0, activeCombatSeconds) / 45) * 7);
  return INITIAL_ENEMY_COUNT + bossPressure + timePressure;
}

function enemyTemplateForSpawnIndex(index: number): CombatLoopEnemy["templateId"] {
  return index % 3 === 0 ? "fast-fragile" : index % 3 === 1 ? "slow-tough" : "swarm-fragile";
}

function enemySpawnPosition(player: Point, index: number, baseDistance: number): Point {
  const angle = index * 2.399963229728653;
  const distance = baseDistance + (index % 6) * 46;
  return {
    x: clamp(player.x + Math.cos(angle) * distance, 40, ARENA_BOUNDS.width - 40),
    y: clamp(player.y + Math.sin(angle) * distance, 40, ARENA_BOUNDS.height - 40),
  };
}

function createEnemy(
  id: string,
  templateId: CombatLoopEnemy["templateId"],
  position: Point,
): CombatLoopEnemy {
  const template = getCommonEnemyTemplate(templateId);
  return {
    id,
    templateId,
    position,
    health: template.maxHealth,
    radius: template.radius,
    nextContactAtSeconds: 0,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
