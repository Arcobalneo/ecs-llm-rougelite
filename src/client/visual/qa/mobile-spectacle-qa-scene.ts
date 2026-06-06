import { createBossEncounterPlan } from "../../../shared/boss/boss-planning.js";
import type { ThemeId, Wishcraft } from "../../../shared/wishcraft/types.js";
import { bootPixiArena } from "../../rendering/combat-renderer.js";
import { calculateViewport } from "../../simulation/arena-math.js";
import { getCommonEnemyTemplate } from "../../simulation/combat.js";
import { createCombatLoopState, type CombatFeedback } from "../../simulation/combat-loop.js";
import { createArenaVisualState, arenaVisualPhases } from "../arena-visual-state.js";

export interface MobileSpectacleQaScenario {
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

export function createMobileSpectacleQaScenario(): MobileSpectacleQaScenario {
  const loadout = createMobileSpectacleLoadout();
  return {
    bossCount: 2,
    enemyCount: 108,
    feedback: createMobileSpectacleFeedback(player, loadout),
    height: 844,
    level: 42,
    loadout,
    summonCount: 4,
    width: 390,
    xpShardCount: 38,
  };
}

export function mobileSpectacleQaCoverageSummary(
  scenario = createMobileSpectacleQaScenario(),
): {
  aspectRatio: number;
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
    aspectRatio: scenario.height / scenario.width,
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

export async function bootMobileSpectacleQaScene(options: {
  canvas: HTMLCanvasElement;
  root: HTMLElement;
}): Promise<void> {
  const scenario = createMobileSpectacleQaScenario();
  options.canvas.width = scenario.width;
  options.canvas.height = scenario.height;
  options.canvas.dataset.mobileSpectacleQa = "true";

  const combatState = createCombatLoopState({
    player,
    enemies: createMobileSpectacleEnemyField(player, scenario.enemyCount),
    wishcraftLoadout: [...scenario.loadout],
  });
  combatState.activeCombatSeconds = 252;
  combatState.bossKills = 5;
  combatState.kills = 2860;
  combatState.score = 88240;
  combatState.levelState.level = scenario.level;
  combatState.levelState.xp = 301;
  combatState.levelState.nextLevelXp = 390;
  combatState.player.vitals.health = Math.round(combatState.player.vitals.maxHealth * 0.58);
  combatState.wishcraftRuntime.shield = {
    capacity: 86,
    nextRegenAtSeconds: 0,
    regenDelaySeconds: 4,
    value: 48,
  };
  combatState.wishcraftRuntime.summons = createMobileSpectacleSummons(player, scenario.loadout, scenario.summonCount);
  combatState.xpShards = createMobileSpectacleXpShards(player, scenario.xpShardCount);
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
      health: 490 - index * 170,
      id: `mobile-spectacle-boss-${index}`,
      maxHealth: 1960,
    })),
    combatPaused: false,
    healthProgress: 0.2,
    pendingPlan: { ...plan, bosses: plan.bosses.slice(0, scenario.bossCount) },
    phase: "active" as const,
    queuedLevelUps: [],
    runtimeSeconds: 18.8,
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
          vector: { x: -0.34, y: -0.82, strength: 0.89 },
        },
      },
      lastTimestamp: 0,
      position: player,
      viewport: calculateViewport({ width: scenario.width, height: scenario.height }),
    },
    visualState,
  });

  syncMobileSpectacleOverlay(options.root, combatState, bossState.healthProgress, plan.bosses.map((boss) => boss.name).join(" / "));
  options.root.dataset.mobileSpectacleReady = "true";
  options.root.dataset.qaReady = "true";
}

function createMobileSpectacleLoadout(): Wishcraft[] {
  return [
    craft("mobile-spectacle-starfire", "starfire", "projectile-lance", ["aura", "projectile", "trail", "orbit"], { projectileCount: 4 }),
    craft("mobile-spectacle-plasma", "plasma", "projectile-beam", ["shoulder", "back", "weapon", "impact"], { rangeScale: 1.35 }),
    craft("mobile-spectacle-neon", "neon", "projectile-scatter", ["weapon", "projectile", "trail", "impact"], { projectileCount: 7 }),
    craft("mobile-spectacle-quantum", "quantum", "projectile-spiral", ["aura", "orbit", "projectile", "trail"], { projectileCount: 6 }),
    craft("mobile-spectacle-magnetic", "magnetic", "projectile-ricochet", ["core", "weapon", "trail", "impact"], { projectileCount: 5 }),
    craft("mobile-spectacle-meteor", "meteor", "projectile-missile", ["back", "shoulder", "projectile", "impact"], { projectileCount: 6 }),
    craft("mobile-spectacle-frost", "frost", "area-burst-nova", ["arm", "hip", "aura", "impact"], { blastRadius: 178 }),
    craft("mobile-spectacle-dragon", "dragon", "melee-saw", ["back", "weapon", "arm", "impact"], { damageScale: 1.32 }),
    craft("mobile-spectacle-gravity", "gravity", "summon-orbiter", ["summon", "core", "head", "trail"], { summonCount: 4 }),
    craft("mobile-spectacle-angel", "angel", "shield-capacity", ["shoulder", "back", "aura", "weapon"], { shieldCapacity: 86 }),
    craft("mobile-spectacle-void", "void", "pickup-magnet", ["core", "aura", "trail", "impact"], { pickupRange: 230 }),
    craft("mobile-spectacle-clockwork", "clockwork", "trigger-on-kill", ["impact", "summon", "core", "orbit"], { blastRadius: 150 }),
  ];
}

function createMobileSpectacleEnemyField(center: { x: number; y: number }, count: number) {
  const templates = ["fast-fragile", "slow-tough", "swarm-fragile"] as const;
  return Array.from({ length: count }, (_, index) => {
    const templateId = templates[index % templates.length];
    const template = getCommonEnemyTemplate(templateId);
    const ring = Math.floor(index / 18);
    const angle = index * 2.399 + ring * 0.18;
    const radius = 76 + ring * 52 + (index % 7) * 12;
    return {
      health: Math.max(1, template.maxHealth - (index % 5) * 2),
      id: `mobile-spectacle-enemy-${index}`,
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

function createMobileSpectacleSummons(
  center: { x: number; y: number },
  loadout: readonly Wishcraft[],
  count: number,
) {
  const summonCraft = loadout.find((craft) => craft.primaryMechanicId === "summon-orbiter") ?? loadout[0];
  return Array.from({ length: count }, (_, index) => {
    const angle = index * Math.PI * 0.5 + 0.45;
    const orbitRadius = 68 + index * 15;
    return {
      craftId: summonCraft.id,
      id: `mobile-spectacle-summon-${index}`,
      orbitRadius,
      position: {
        x: center.x + Math.cos(angle) * orbitRadius,
        y: center.y + Math.sin(angle) * orbitRadius,
      },
    };
  });
}

function createMobileSpectacleXpShards(center: { x: number; y: number }, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = index * 0.66;
    const radius = 62 + (index % 8) * 22;
    return {
      attracted: index % 3 !== 0,
      id: `mobile-spectacle-xp-${index}`,
      position: {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      },
      value: 4 + (index % 5) * 4,
    };
  });
}

function createMobileSpectacleFeedback(center: { x: number; y: number }, loadout: readonly Wishcraft[]): CombatFeedback[] {
  const byMechanic = new Map(loadout.map((craft) => [craft.primaryMechanicId, craft]));
  return [
    hit(byMechanic.get("projectile-lance") ?? loadout[0], "projectile-lance", "lance", center, { x: center.x + 210, y: center.y - 120 }, "fast-fragile", 13),
    hit(byMechanic.get("projectile-beam") ?? loadout[1], "projectile-beam", "beam", center, { x: center.x - 230, y: center.y - 42 }, "slow-tough", 18),
    hit(byMechanic.get("projectile-scatter") ?? loadout[2], "projectile-scatter", "scatter", center, { x: center.x + 165, y: center.y + 80 }, "swarm-fragile", 11),
    hit(byMechanic.get("projectile-spiral") ?? loadout[3], "projectile-spiral", "spiral", center, { x: center.x - 156, y: center.y + 156 }, "fast-fragile", 13),
    hit(byMechanic.get("projectile-ricochet") ?? loadout[4], "projectile-ricochet", "ricochet", center, { x: center.x + 44, y: center.y - 246 }, "slow-tough", 18),
    hit(byMechanic.get("projectile-missile") ?? loadout[5], "projectile-missile", "missile", center, { x: center.x - 118, y: center.y + 235 }, "slow-tough", 18),
    hit(byMechanic.get("area-burst-nova") ?? loadout[6], "area-burst-nova", "area", center, { x: center.x + 5, y: center.y + 122 }, "swarm-fragile", 11),
    hit(byMechanic.get("melee-saw") ?? loadout[7], "melee-saw", "melee", center, { x: center.x - 52, y: center.y + 32 }, "fast-fragile", 13),
    hit(byMechanic.get("summon-orbiter") ?? loadout[8], "summon-orbiter", "summon", { x: center.x + 92, y: center.y - 54 }, { x: center.x + 130, y: center.y + 178 }, "swarm-fragile", 11),
    hit(byMechanic.get("shield-capacity") ?? loadout[9], "shield-capacity", "shield", center, { x: center.x - 12, y: center.y - 12 }, "slow-tough", 18),
    hit(byMechanic.get("pickup-magnet") ?? loadout[10], "pickup-magnet", "pickup", center, { x: center.x - 136, y: center.y - 212 }, "fast-fragile", 13),
    hit(byMechanic.get("trigger-on-kill") ?? loadout[11], "trigger-on-kill", "trigger", center, { x: center.x + 124, y: center.y - 228 }, "swarm-fragile", 11),
    hit(byMechanic.get("area-burst-nova") ?? loadout[6], "retaliation-burst", "burst", center, { x: center.x + 104, y: center.y + 234 }, "fast-fragile", 13),
    { kind: "wishcraft-shield", capacity: 86, position: center, wishcraftId: byMechanic.get("shield-capacity")?.id ?? loadout[9].id },
    ...Array.from({ length: 12 }, (_, index) => ({
      kind: "enemy-death" as const,
      position: {
        x: center.x + Math.cos(index * 0.78) * (102 + (index % 5) * 30),
        y: center.y + Math.sin(index * 0.78) * (118 + (index % 4) * 28),
      },
      radius: [13, 18, 11][index % 3],
      templateId: (["fast-fragile", "slow-tough", "swarm-fragile"] as const)[index % 3],
    })),
  ];
}

function syncMobileSpectacleOverlay(
  root: HTMLElement,
  combatState: ReturnType<typeof createCombatLoopState>,
  bossHealthProgress: number,
  bossName: string,
): void {
  root.style.setProperty("--qa-xp", `${Math.round((combatState.levelState.xp / combatState.levelState.nextLevelXp) * 100)}%`);
  root.style.setProperty("--qa-health", `${Math.round((combatState.player.vitals.health / combatState.player.vitals.maxHealth) * 100)}%`);
  root.style.setProperty("--qa-boss-health", `${Math.round(bossHealthProgress * 100)}%`);
  for (const levelNode of root.querySelectorAll("[data-mobile-spectacle-level]")) {
    levelNode.replaceChildren(`Lv.${combatState.levelState.level.toString().padStart(3, "0")}`);
  }
  root.querySelector("[data-mobile-spectacle-score]")?.replaceChildren(`Score ${combatState.score}`);
  root.querySelector("[data-mobile-spectacle-boss-name]")?.replaceChildren(bossName);
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
    sourceWish: "mobile spectacle visual qa",
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
