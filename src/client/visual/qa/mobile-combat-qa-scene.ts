import { createBossEncounterPlan } from "../../../shared/boss/boss-planning.js";
import { wishcraftCatalog } from "../../../shared/wishcraft/catalog.js";
import type { Wishcraft } from "../../../shared/wishcraft/types.js";
import { bootPixiArena } from "../../rendering/combat-renderer.js";
import { calculateViewport } from "../../simulation/arena-math.js";
import { getCommonEnemyTemplate } from "../../simulation/combat.js";
import { createCombatLoopState, type CombatFeedback } from "../../simulation/combat-loop.js";
import { createArenaVisualState, arenaVisualPhases } from "../arena-visual-state.js";

export interface MobileCombatQaScenario {
  enemyCount: number;
  height: number;
  level: number;
  loadout: readonly Wishcraft[];
  width: number;
}

export function createMobileCombatQaScenario(): MobileCombatQaScenario {
  return {
    enemyCount: 78,
    height: 844,
    level: 28,
    loadout: createMobileQaLoadout(),
    width: 390,
  };
}

export function mobileCombatQaCoverageSummary(scenario = createMobileCombatQaScenario()): {
  aspectRatio: number;
  enemyCount: number;
  loadoutSize: number;
  themeCount: number;
} {
  return {
    aspectRatio: scenario.height / scenario.width,
    enemyCount: scenario.enemyCount,
    loadoutSize: scenario.loadout.length,
    themeCount: new Set(scenario.loadout.map((craft) => craft.primaryThemeId)).size,
  };
}

export async function bootMobileCombatQaScene(options: {
  canvas: HTMLCanvasElement;
  root: HTMLElement;
}): Promise<void> {
  const scenario = createMobileCombatQaScenario();
  const player = { x: 1600, y: 1000 };
  options.canvas.width = scenario.width;
  options.canvas.height = scenario.height;
  options.canvas.dataset.mobileQa = "true";

  const combatState = createCombatLoopState({
    player,
    enemies: createMobileEnemyField(player, scenario.enemyCount),
    wishcraftLoadout: [...scenario.loadout],
  });
  combatState.activeCombatSeconds = 118;
  combatState.bossKills = 3;
  combatState.kills = 940;
  combatState.score = 28640;
  combatState.levelState.level = scenario.level;
  combatState.levelState.xp = 156;
  combatState.levelState.nextLevelXp = 240;
  combatState.player.vitals.health = Math.round(combatState.player.vitals.maxHealth * 0.72);
  combatState.wishcraftRuntime.shield = {
    capacity: 58,
    nextRegenAtSeconds: 0,
    regenDelaySeconds: 4,
    value: 34,
  };
  combatState.wishcraftRuntime.summons = [
    { craftId: scenario.loadout[1].id, id: "mobile-qa-summon-0", orbitRadius: 76, position: { x: player.x + 82, y: player.y - 42 } },
    { craftId: scenario.loadout[1].id, id: "mobile-qa-summon-1", orbitRadius: 92, position: { x: player.x - 74, y: player.y + 66 } },
  ];
  combatState.xpShards = createMobileXpShards(player);
  combatState.feedback = createMobileFeedback(player, scenario.loadout);

  const plan = createBossEncounterPlan({
    bossEncounterNumber: 6,
    loadout: scenario.loadout,
    plannedLevel: 30,
  });
  const bossState = {
    activeCombatSeconds: combatState.activeCombatSeconds,
    advanceArenaPhase: false,
    bossEncounterNumber: 6,
    bosses: plan.bosses.map((boss, index) => ({
      health: 460 - index * 120,
      id: `mobile-qa-boss-${index}`,
      maxHealth: 1460,
    })),
    combatPaused: false,
    healthProgress: 0.24,
    pendingPlan: plan,
    phase: "active" as const,
    queuedLevelUps: [],
    runtimeSeconds: 7.2,
  };
  const visualState = createArenaVisualState();
  visualState.phaseIndex = 3;
  visualState.phase = arenaVisualPhases[3];

  await bootPixiArena({
    bossState,
    canvas: options.canvas,
    combatState,
    screen: options.root,
    state: {
      activeKeys: new Set(),
      input: {
        joystick: {
          activeAt: 1,
          vector: { x: 0.26, y: -0.92, strength: 0.96 },
        },
      },
      lastTimestamp: 0,
      position: player,
      viewport: calculateViewport({ width: scenario.width, height: scenario.height }),
    },
    visualState,
  });

  syncQaOverlay(options.root, combatState, bossState.healthProgress, plan.bosses.map((boss) => boss.name).join(" / "));
  options.root.dataset.qaReady = "true";
  options.root.dataset.mobileQaReady = "true";
}

function createMobileQaLoadout(): Wishcraft[] {
  return [
    {
      ...wishcraftCatalog.fixtures.starLance,
      id: "mobile-qa-starfire",
      visualPieceIds: ["aura-starfire-0", "projectile-starfire-1", "trail-starfire-2", "orbit-starfire-3"],
      parameters: { damageScale: 1.28, fireRateScale: 1.18, projectileCount: 3 },
    },
    craft("mobile-qa-gravity", "gravity", "summon-orbiter", ["summon-gravity-0", "core-gravity-1", "head-gravity-2", "arm-gravity-3"], { summonCount: 2 }),
    craft("mobile-qa-dragon", "dragon", "melee-saw", ["back-dragon-0", "weapon-dragon-1", "impact-dragon-2"], { damageScale: 1.24 }),
    craft("mobile-qa-plasma", "plasma", "projectile-beam", ["shoulder-plasma-0", "back-plasma-1", "weapon-plasma-2", "impact-plasma-3"], { rangeScale: 1.25 }),
    craft("mobile-qa-frost", "frost", "area-burst-nova", ["arm-frost-0", "hip-frost-1", "aura-frost-2", "projectile-frost-3"], { blastRadius: 155 }),
    craft("mobile-qa-clockwork", "clockwork", "trigger-on-kill", ["impact-clockwork-0", "summon-clockwork-1", "core-clockwork-2"], { blastRadius: 130 }),
    craft("mobile-qa-shield", "shield", "shield-capacity", ["shoulder-shield-0", "back-shield-1", "weapon-shield-2"], { shieldCapacity: 58 }),
  ];
}

function createMobileEnemyField(center: { x: number; y: number }, count: number) {
  const templates = ["fast-fragile", "slow-tough", "swarm-fragile"] as const;
  return Array.from({ length: count }, (_, index) => {
    const templateId = templates[index % templates.length];
    const template = getCommonEnemyTemplate(templateId);
    const angle = index * 2.399;
    const radius = 78 + (index % 13) * 29;
    return {
      health: Math.max(1, template.maxHealth - (index % 4) * 2),
      id: `mobile-qa-enemy-${index}`,
      nextContactAtSeconds: 0,
      position: {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      },
      radius: template.radius,
      templateId,
    };
  });
}

function createMobileXpShards(center: { x: number; y: number }) {
  return Array.from({ length: 22 }, (_, index) => {
    const angle = index * 0.74;
    const radius = 82 + (index % 5) * 24;
    return {
      attracted: index % 2 === 0,
      id: `mobile-qa-xp-${index}`,
      position: {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      },
      value: 4 + (index % 4) * 3,
    };
  });
}

function createMobileFeedback(center: { x: number; y: number }, loadout: readonly Wishcraft[]): CombatFeedback[] {
  const templateIds = ["fast-fragile", "slow-tough", "swarm-fragile"] as const;
  return [
    hit(loadout[0], "projectile-lance", "lance", center, { x: center.x + 220, y: center.y - 86 }),
    hit(loadout[3], "projectile-beam", "beam", center, { x: center.x - 250, y: center.y - 20 }),
    hit(loadout[4], "area-burst-nova", "area", center, { x: center.x + 20, y: center.y + 120 }),
    hit(loadout[2], "melee-saw", "melee", center, { x: center.x - 58, y: center.y + 22 }),
    hit(loadout[1], "summon-orbiter", "summon", center, { x: center.x + 150, y: center.y + 154 }),
    hit(loadout[5], "trigger-on-kill", "trigger", center, { x: center.x - 164, y: center.y - 146 }),
    hit(loadout[3], "projectile-scatter", "scatter", center, { x: center.x + 178, y: center.y + 40 }),
    hit(loadout[4], "projectile-missile", "missile", center, { x: center.x - 130, y: center.y + 192 }),
    ...Array.from({ length: 10 }, (_, index) => ({
      kind: "enemy-death" as const,
      position: {
        x: center.x + Math.cos(index * 0.9) * (96 + (index % 4) * 28),
        y: center.y + Math.sin(index * 0.9) * (104 + (index % 5) * 22),
      },
      radius: [13, 18, 11][index % 3],
      templateId: templateIds[index % templateIds.length],
    })),
  ];
}

function syncQaOverlay(
  root: HTMLElement,
  combatState: ReturnType<typeof createCombatLoopState>,
  bossHealthProgress: number,
  bossName: string,
): void {
  root.style.setProperty("--qa-xp", `${Math.round((combatState.levelState.xp / combatState.levelState.nextLevelXp) * 100)}%`);
  root.style.setProperty("--qa-health", `${Math.round((combatState.player.vitals.health / combatState.player.vitals.maxHealth) * 100)}%`);
  root.style.setProperty("--qa-boss-health", `${Math.round(bossHealthProgress * 100)}%`);
  for (const levelNode of root.querySelectorAll("[data-mobile-qa-level]")) {
    levelNode.replaceChildren(`Lv.${combatState.levelState.level.toString().padStart(3, "0")}`);
  }
  root.querySelector("[data-mobile-qa-score]")?.replaceChildren(`Score ${combatState.score}`);
  root.querySelector("[data-mobile-qa-boss-name]")?.replaceChildren(bossName);
}

function craft(
  id: string,
  primaryThemeId: string,
  primaryMechanicId: string,
  visualPieceIds: string[],
  parameters: Record<string, unknown>,
): Wishcraft {
  return {
    id,
    mechanicPieceIds: [primaryMechanicId],
    name: { cn: id, en: id },
    parameters,
    primaryMechanicId,
    primaryThemeId,
    sourceWish: "mobile visual qa",
    visualPieceIds,
  };
}

function hit(
  wishcraft: Wishcraft,
  mechanicId: string,
  visualKind: string,
  origin: { x: number; y: number },
  position: { x: number; y: number },
): CombatFeedback {
  return {
    kind: "wishcraft-hit",
    mechanicId,
    origin,
    position,
    visualKind,
    wishcraftId: wishcraft.id,
  };
}
