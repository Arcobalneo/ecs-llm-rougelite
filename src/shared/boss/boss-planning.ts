import { wishcraftCatalog } from "../wishcraft/catalog.js";
import type { ThemeId, Wishcraft } from "../wishcraft/types.js";

export type BossMechSilhouette = "crawling" | "flying" | "humanoid";

export interface BossTemplateConfig {
  compatibleSilhouettes: BossMechSilhouette[];
  id: string;
  nameSeed: {
    cn: string;
    en: string;
  };
  pressureStyle: "duelist" | "breaker" | "swarm-anchor";
}

export interface BossPlanEntry {
  compatibleSilhouettes: BossMechSilhouette[];
  name: string;
  rivalThemeId: ThemeId;
  silhouette: BossMechSilhouette;
  templateId: string;
  visualPieceIds: string[];
}

export interface BossEncounterPlan {
  bossEncounterNumber: number;
  bosses: BossPlanEntry[];
  encounterKind: "double" | "single";
  plannedLevel: number;
}

export interface BossPlanRecord {
  bosses: BossPlanEntry[];
  contentVersion: string;
  encounterId: string;
  encounterKind: BossEncounterPlan["encounterKind"];
  plannedLevel: number;
  runId: string;
}

export const bossTemplates: BossTemplateConfig[] = [
  {
    id: "sky-tyrant",
    nameSeed: { cn: "天穹", en: "Sky Tyrant" },
    compatibleSilhouettes: ["flying", "humanoid"],
    pressureStyle: "duelist",
  },
  {
    id: "crawler-colossus",
    nameSeed: { cn: "爬行巨像", en: "Crawler Colossus" },
    compatibleSilhouettes: ["crawling"],
    pressureStyle: "swarm-anchor",
  },
  {
    id: "void-knight",
    nameSeed: { cn: "虚空骑士", en: "Void Knight" },
    compatibleSilhouettes: ["humanoid", "flying"],
    pressureStyle: "breaker",
  },
  {
    id: "rail-wyrm",
    nameSeed: { cn: "磁轨龙骸", en: "Rail Wyrm" },
    compatibleSilhouettes: ["flying", "crawling"],
    pressureStyle: "breaker",
  },
];

export function createBossEncounterPlan(options: {
  bossEncounterNumber: number;
  loadout: readonly Wishcraft[];
  plannedLevel: number;
}): BossEncounterPlan {
  const encounterKind = options.bossEncounterNumber % 3 === 0 ? "double" : "single";
  const bossCount = encounterKind === "double" ? 2 : 1;
  const rivalThemeIds = rivalThemesForLoadout(options.loadout, bossCount);
  const bosses: BossPlanEntry[] = [];
  const usedSilhouettes = new Set<BossMechSilhouette>();

  for (let index = 0; index < bossCount; index += 1) {
    const template = bossTemplates[(options.bossEncounterNumber + index - 1) % bossTemplates.length];
    const silhouette = chooseCompatibleSilhouette(template, usedSilhouettes);
    usedSilhouettes.add(silhouette);
    const rivalThemeId = rivalThemeIds[index] ?? "void";
    bosses.push({
      compatibleSilhouettes: [...template.compatibleSilhouettes],
      name: bossName(template, rivalThemeId, options.bossEncounterNumber, index),
      rivalThemeId,
      silhouette,
      templateId: template.id,
      visualPieceIds: visualPiecesForTheme(rivalThemeId),
    });
  }

  return {
    bossEncounterNumber: options.bossEncounterNumber,
    bosses,
    encounterKind,
    plannedLevel: options.plannedLevel,
  };
}

export function createBossPlanRecord(options: {
  contentVersion: string;
  encounterId: string;
  plan: BossEncounterPlan;
  runId: string;
}): BossPlanRecord {
  return {
    bosses: options.plan.bosses.map((boss) => ({
      ...boss,
      compatibleSilhouettes: [...boss.compatibleSilhouettes],
      visualPieceIds: [...boss.visualPieceIds],
    })),
    contentVersion: options.contentVersion,
    encounterId: options.encounterId,
    encounterKind: options.plan.encounterKind,
    plannedLevel: options.plan.plannedLevel,
    runId: options.runId,
  };
}

export function bossEncounterPlansEqual(left: BossEncounterPlan, right: BossEncounterPlan): boolean {
  return JSON.stringify(normalizeBossEncounterPlan(left)) === JSON.stringify(normalizeBossEncounterPlan(right));
}

function rivalThemesForLoadout(loadout: readonly Wishcraft[], count: number): ThemeId[] {
  const recent = loadout.slice(-3).reverse();
  const rivalThemeIds = recent.flatMap((wishcraft) => {
    const theme = wishcraftCatalog.themeTags.find((candidate) => candidate.id === wishcraft.primaryThemeId);
    return theme?.rivalThemeIds ?? [];
  });
  return uniqueThemes(rivalThemeIds).slice(0, count);
}

function chooseCompatibleSilhouette(
  template: BossTemplateConfig,
  usedSilhouettes: ReadonlySet<BossMechSilhouette>,
): BossMechSilhouette {
  return (
    template.compatibleSilhouettes.find((silhouette) => !usedSilhouettes.has(silhouette)) ??
    template.compatibleSilhouettes[0]
  );
}

function bossName(
  template: BossTemplateConfig,
  rivalThemeId: ThemeId,
  encounterNumber: number,
  bossIndex: number,
): string {
  const theme = wishcraftCatalog.themeTags.find((candidate) => candidate.id === rivalThemeId);
  const prefix = theme?.displayName.cn ?? "星渊";
  return `${prefix}${template.nameSeed.cn}-${encounterNumber}${bossIndex === 0 ? "" : `.${bossIndex + 1}`}`;
}

function visualPiecesForTheme(themeId: ThemeId): string[] {
  return wishcraftCatalog.visualPieces
    .filter((piece) => piece.themeId === themeId)
    .slice(0, 4)
    .map((piece) => piece.id);
}

function uniqueThemes(themeIds: readonly ThemeId[]): ThemeId[] {
  return Array.from(new Set(themeIds));
}

function normalizeBossEncounterPlan(plan: BossEncounterPlan): BossEncounterPlan {
  return {
    bossEncounterNumber: plan.bossEncounterNumber,
    bosses: plan.bosses.map((boss) => ({
      compatibleSilhouettes: [...boss.compatibleSilhouettes],
      name: boss.name,
      rivalThemeId: boss.rivalThemeId,
      silhouette: boss.silhouette,
      templateId: boss.templateId,
      visualPieceIds: [...boss.visualPieceIds],
    })),
    encounterKind: plan.encounterKind,
    plannedLevel: plan.plannedLevel,
  };
}
