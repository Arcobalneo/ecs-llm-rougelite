import { createBossEncounterPlan } from "../../../shared/boss/boss-planning.js";
import { wishcraftCatalog } from "../../../shared/wishcraft/catalog.js";
import type { ThemeId, Wishcraft } from "../../../shared/wishcraft/types.js";
import { bootPixiArena } from "../../rendering/combat-renderer.js";
import { calculateViewport } from "../../simulation/arena-math.js";
import { getCommonEnemyTemplate } from "../../simulation/combat.js";
import { createCombatLoopState, type CombatFeedback } from "../../simulation/combat-loop.js";
import { createArenaVisualState, arenaVisualPhases } from "../arena-visual-state.js";

export interface LiveCombatSpectacleQaScenario {
  bossCount: number;
  enemyCount: number;
  feedback: readonly CombatFeedback[];
  height: number;
  level: number;
  loadout: readonly Wishcraft[];
  summonCount: number;
  width: number;
  xpShardCount: number;
}

const player = { x: 1600, y: 1000 };

export function createLiveCombatSpectacleQaScenario(): LiveCombatSpectacleQaScenario {
  const loadout = createSpectacleQaLoadout();
  return {
    bossCount: 2,
    enemyCount: 144,
    feedback: createSpectacleFeedback(player, loadout),
    height: 900,
    level: 42,
    loadout,
    summonCount: 4,
    width: 1440,
    xpShardCount: 46,
  };
}

export function liveCombatSpectacleQaCoverageSummary(
  scenario = createLiveCombatSpectacleQaScenario(),
): {
  bossCount: number;
  enemyCount: number;
  loadoutSize: number;
  summonCount: number;
  themeCount: number;
  visualKindCount: number;
  wishcraftHitCount: number;
  xpShardCount: number;
} {
  const wishcraftHits = scenario.feedback.filter((event): event is Extract<CombatFeedback, { kind: "wishcraft-hit" }> => event.kind === "wishcraft-hit");
  return {
    bossCount: scenario.bossCount,
    enemyCount: scenario.enemyCount,
    loadoutSize: scenario.loadout.length,
    summonCount: scenario.summonCount,
    themeCount: new Set(scenario.loadout.map((craft) => craft.primaryThemeId)).size,
    visualKindCount: new Set(wishcraftHits.map((event) => event.visualKind)).size,
    wishcraftHitCount: wishcraftHits.length,
    xpShardCount: scenario.xpShardCount,
  };
}

export async function bootLiveCombatSpectacleQaScene(options: {
  canvas: HTMLCanvasElement;
  root: HTMLElement;
}): Promise<void> {
  const scenario = createLiveCombatSpectacleQaScenario();
  options.canvas.width = scenario.width;
  options.canvas.height = scenario.height;
  options.canvas.dataset.liveCombatSpectacleQa = "true";

  const combatState = createCombatLoopState({
    player,
    enemies: createSpectacleEnemyField(player, scenario.enemyCount),
    wishcraftLoadout: [...scenario.loadout],
  });
  combatState.activeCombatSeconds = 246;
  combatState.bossKills = 5;
  combatState.kills = 3180;
  combatState.score = 94680;
  combatState.levelState.level = scenario.level;
  combatState.levelState.xp = 318;
  combatState.levelState.nextLevelXp = 390;
  combatState.player.vitals.health = Math.round(combatState.player.vitals.maxHealth * 0.62);
  combatState.wishcraftRuntime.shield = {
    capacity: 86,
    nextRegenAtSeconds: 0,
    regenDelaySeconds: 4,
    value: 49,
  };
  combatState.wishcraftRuntime.summons = createSpectacleSummons(player, scenario.loadout, scenario.summonCount);
  combatState.xpShards = createSpectacleXpShards(player, scenario.xpShardCount);
  combatState.feedback = [...scenario.feedback];

  const plan = createBossEncounterPlan({
    bossEncounterNumber: 9,
    loadout: scenario.loadout,
    plannedLevel: 45,
  });
  const bossState = {
    activeCombatSeconds: combatState.activeCombatSeconds,
    advanceArenaPhase: false,
    bossEncounterNumber: 9,
    bosses: plan.bosses.slice(0, scenario.bossCount).map((boss, index) => ({
      health: 520 - index * 190,
      id: `spectacle-qa-boss-${index}`,
      maxHealth: 1960,
    })),
    combatPaused: false,
    healthProgress: 0.2,
    pendingPlan: { ...plan, bosses: plan.bosses.slice(0, scenario.bossCount) },
    phase: "active" as const,
    queuedLevelUps: [],
    runtimeSeconds: 19.6,
  };
  const visualState = createArenaVisualState();
  visualState.phaseIndex = 4;
  visualState.phase = arenaVisualPhases[4 % arenaVisualPhases.length];

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
          vector: { x: -0.64, y: -0.34, strength: 0.72 },
        },
      },
      lastTimestamp: 0,
      position: player,
      viewport: calculateViewport({ width: scenario.width, height: scenario.height }),
    },
    visualState,
  });

  syncSpectacleQaOverlay(options.root, combatState, bossState.healthProgress, plan.bosses.map((boss) => boss.name).join(" / "));
  options.root.dataset.liveCombatSpectacleReady = "true";
  options.root.dataset.qaReady = "true";
}

function createSpectacleQaLoadout(): Wishcraft[] {
  return [
    craft("spectacle-starfire", "starfire", "projectile-lance", ["aura", "projectile", "trail", "orbit"], { damageScale: 1.38, projectileCount: 4 }),
    craft("spectacle-plasma", "plasma", "projectile-beam", ["shoulder", "back", "weapon", "impact"], { rangeScale: 1.35 }),
    craft("spectacle-neon", "neon", "projectile-scatter", ["weapon", "projectile", "trail", "impact"], { projectileCount: 7 }),
    craft("spectacle-quantum", "quantum", "projectile-spiral", ["aura", "orbit", "projectile", "trail"], { projectileCount: 6 }),
    craft("spectacle-magnetic", "magnetic", "projectile-ricochet", ["core", "weapon", "trail", "impact"], { projectileCount: 5 }),
    craft("spectacle-meteor", "meteor", "projectile-missile", ["back", "shoulder", "projectile", "impact"], { projectileCount: 6 }),
    craft("spectacle-frost", "frost", "area-burst-nova", ["arm", "hip", "aura", "impact"], { blastRadius: 190 }),
    craft("spectacle-dragon", "dragon", "melee-saw", ["back", "weapon", "arm", "impact"], { damageScale: 1.32 }),
    craft("spectacle-gravity", "gravity", "summon-orbiter", ["summon", "core", "head", "trail"], { summonCount: 4 }),
    craft("spectacle-angel", "angel", "shield-capacity", ["shoulder", "back", "aura", "weapon"], { shieldCapacity: 86 }),
    craft("spectacle-void", "void", "pickup-magnet", ["core", "aura", "trail", "impact"], { pickupRange: 230 }),
    craft("spectacle-clockwork", "clockwork", "trigger-on-kill", ["impact", "summon", "core", "orbit"], { blastRadius: 150 }),
  ];
}

function createSpectacleEnemyField(center: { x: number; y: number }, count: number) {
  const templates = ["fast-fragile", "slow-tough", "swarm-fragile"] as const;
  return Array.from({ length: count }, (_, index) => {
    const templateId = templates[index % templates.length];
    const template = getCommonEnemyTemplate(templateId);
    const ring = Math.floor(index / 24);
    const angle = index * 2.399 + ring * 0.2;
    const radius = 96 + ring * 64 + (index % 8) * 14;
    return {
      health: Math.max(1, template.maxHealth - (index % 5) * 2),
      id: `spectacle-qa-enemy-${index}`,
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

function createSpectacleSummons(
  center: { x: number; y: number },
  loadout: readonly Wishcraft[],
  count: number,
) {
  const summonCraft = loadout.find((craft) => craft.primaryMechanicId === "summon-orbiter") ?? loadout[0];
  return Array.from({ length: count }, (_, index) => {
    const angle = index * Math.PI * 0.5 + 0.35;
    const orbitRadius = 86 + index * 18;
    return {
      craftId: summonCraft.id,
      id: `spectacle-qa-summon-${index}`,
      orbitRadius,
      position: {
        x: center.x + Math.cos(angle) * orbitRadius,
        y: center.y + Math.sin(angle) * orbitRadius,
      },
    };
  });
}

function createSpectacleXpShards(center: { x: number; y: number }, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = index * 0.618;
    const radius = 74 + (index % 9) * 28;
    return {
      attracted: index % 3 !== 0,
      id: `spectacle-qa-xp-${index}`,
      position: {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      },
      value: 4 + (index % 5) * 4,
    };
  });
}

function createSpectacleFeedback(center: { x: number; y: number }, loadout: readonly Wishcraft[]): CombatFeedback[] {
  const byMechanic = new Map(loadout.map((craft) => [craft.primaryMechanicId, craft]));
  const hits: CombatFeedback[] = [
    hit(byMechanic.get("projectile-lance") ?? loadout[0], "projectile-lance", "lance", center, { x: center.x + 360, y: center.y - 120 }, "fast-fragile", 13),
    hit(byMechanic.get("projectile-beam") ?? loadout[1], "projectile-beam", "beam", center, { x: center.x - 420, y: center.y - 42 }, "slow-tough", 18),
    hit(byMechanic.get("projectile-scatter") ?? loadout[2], "projectile-scatter", "scatter", center, { x: center.x + 320, y: center.y + 78 }, "swarm-fragile", 11),
    hit(byMechanic.get("projectile-spiral") ?? loadout[3], "projectile-spiral", "spiral", center, { x: center.x - 310, y: center.y + 158 }, "fast-fragile", 13),
    hit(byMechanic.get("projectile-ricochet") ?? loadout[4], "projectile-ricochet", "ricochet", center, { x: center.x + 90, y: center.y - 260 }, "slow-tough", 18),
    hit(byMechanic.get("projectile-missile") ?? loadout[5], "projectile-missile", "missile", center, { x: center.x - 190, y: center.y + 270 }, "slow-tough", 18),
    hit(byMechanic.get("area-burst-nova") ?? loadout[6], "area-burst-nova", "area", center, { x: center.x + 10, y: center.y + 140 }, "swarm-fragile", 11),
    hit(byMechanic.get("melee-saw") ?? loadout[7], "melee-saw", "melee", center, { x: center.x - 72, y: center.y + 32 }, "fast-fragile", 13),
    hit(byMechanic.get("summon-orbiter") ?? loadout[8], "summon-orbiter", "summon", { x: center.x + 120, y: center.y - 72 }, { x: center.x + 255, y: center.y + 210 }, "swarm-fragile", 11),
    hit(byMechanic.get("shield-capacity") ?? loadout[9], "shield-capacity", "shield", center, { x: center.x - 18, y: center.y - 12 }, "slow-tough", 18),
    hit(byMechanic.get("pickup-magnet") ?? loadout[10], "pickup-magnet", "pickup", center, { x: center.x - 280, y: center.y - 212 }, "fast-fragile", 13),
    hit(byMechanic.get("trigger-on-kill") ?? loadout[11], "trigger-on-kill", "trigger", center, { x: center.x + 265, y: center.y - 250 }, "swarm-fragile", 11),
    hit(byMechanic.get("area-burst-nova") ?? loadout[6], "retaliation-burst", "burst", center, { x: center.x + 212, y: center.y + 270 }, "fast-fragile", 13),
    hit(byMechanic.get("projectile-lance") ?? loadout[0], "stat-overclock", "stat", center, { x: center.x - 40, y: center.y - 170 }, "slow-tough", 18),
    { kind: "wishcraft-shield", capacity: 86, position: center, wishcraftId: byMechanic.get("shield-capacity")?.id ?? loadout[9].id },
    ...Array.from({ length: 18 }, (_, index) => ({
      kind: "enemy-death" as const,
      position: {
        x: center.x + Math.cos(index * 0.72) * (132 + (index % 6) * 42),
        y: center.y + Math.sin(index * 0.72) * (118 + (index % 5) * 36),
      },
      radius: [13, 18, 11][index % 3],
      templateId: (["fast-fragile", "slow-tough", "swarm-fragile"] as const)[index % 3],
    })),
    ...Array.from({ length: 10 }, (_, index) => ({
      kind: "xp-collect" as const,
      position: {
        x: center.x + Math.cos(index * 0.9) * (70 + (index % 3) * 22),
        y: center.y + Math.sin(index * 0.9) * (72 + (index % 4) * 18),
      },
      value: 8 + index,
    })),
  ];
  return hits;
}

function syncSpectacleQaOverlay(
  root: HTMLElement,
  combatState: ReturnType<typeof createCombatLoopState>,
  bossHealthProgress: number,
  bossName: string,
): void {
  root.style.setProperty("--qa-xp", `${Math.round((combatState.levelState.xp / combatState.levelState.nextLevelXp) * 100)}%`);
  root.style.setProperty("--qa-health", `${Math.round((combatState.player.vitals.health / combatState.player.vitals.maxHealth) * 100)}%`);
  root.style.setProperty("--qa-boss-health", `${Math.round(bossHealthProgress * 100)}%`);
  for (const levelNode of root.querySelectorAll("[data-spectacle-level]")) {
    levelNode.replaceChildren(`Lv.${combatState.levelState.level.toString().padStart(3, "0")}`);
  }
  root.querySelector("[data-spectacle-score]")?.replaceChildren(`Score ${combatState.score}`);
  root.querySelector("[data-spectacle-boss-name]")?.replaceChildren(bossName);
}

function craft(
  id: string,
  primaryThemeId: ThemeId,
  primaryMechanicId: string,
  slots: readonly string[],
  parameters: Record<string, unknown>,
): Wishcraft {
  return {
    id,
    mechanicPieceIds: [primaryMechanicId],
    name: { cn: id, en: id },
    parameters,
    primaryMechanicId,
    primaryThemeId,
    sourceWish: "live combat spectacle qa",
    visualPieceIds: slots.map((slot, index) => `${slot}-${primaryThemeId}-${index}`),
  };
}

function hit(
  wishcraft: Wishcraft,
  mechanicId: string,
  visualKind: string,
  origin: { x: number; y: number },
  position: { x: number; y: number },
  targetTemplateId: "fast-fragile" | "slow-tough" | "swarm-fragile",
  targetRadius: number,
): CombatFeedback {
  return {
    kind: "wishcraft-hit",
    mechanicId,
    origin,
    position,
    targetRadius,
    targetTemplateId,
    visualKind,
    wishcraftId: wishcraft.id,
  };
}
