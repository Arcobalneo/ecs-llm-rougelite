import type { CommonEnemyTemplate } from "../simulation/combat.js";

export type CommonEnemyVariantId = 0 | 1 | 2 | 3;

export interface CommonEnemyVisualVariant {
  antennaCount: number;
  armorBulk: number;
  asymmetry: -1 | 0 | 1;
  engineCount: number;
  hornLength: number;
  id: CommonEnemyVariantId;
  sensorOffset: number;
  sidePodScale: number;
  wingSpan: number;
}

export function commonEnemyVisualVariant(options: {
  enemyId: string;
  templateId: CommonEnemyTemplate["id"];
}): CommonEnemyVisualVariant {
  const id = variantIdForEnemy(options);
  const base = variantBaseByTemplate[options.templateId][id];
  const asymmetry = ((stableSeed(`${options.templateId}:${options.enemyId}:asym`) % 3) - 1) as -1 | 0 | 1;
  return {
    ...base,
    asymmetry,
    id,
  };
}

export function commonEnemyVariantCount(): number {
  return 4;
}

export function variantIdForEnemy(options: {
  enemyId: string;
  templateId: CommonEnemyTemplate["id"];
}): CommonEnemyVariantId {
  return ((stableSeed(options.enemyId) + templateVariantOffset[options.templateId]) % commonEnemyVariantCount()) as CommonEnemyVariantId;
}

const variantBaseByTemplate: Record<CommonEnemyTemplate["id"], readonly Omit<CommonEnemyVisualVariant, "asymmetry" | "id">[]> = {
  "fast-fragile": [
    { antennaCount: 1, armorBulk: 0.84, engineCount: 1, hornLength: 7, sensorOffset: 0, sidePodScale: 0.82, wingSpan: 0.92 },
    { antennaCount: 2, armorBulk: 0.94, engineCount: 2, hornLength: 11, sensorOffset: -2, sidePodScale: 0.72, wingSpan: 1.16 },
    { antennaCount: 0, armorBulk: 0.74, engineCount: 3, hornLength: 5, sensorOffset: 2, sidePodScale: 1.08, wingSpan: 0.82 },
    { antennaCount: 2, armorBulk: 1.05, engineCount: 2, hornLength: 14, sensorOffset: 1, sidePodScale: 0.94, wingSpan: 1.28 },
  ],
  "slow-tough": [
    { antennaCount: 0, armorBulk: 1.1, engineCount: 2, hornLength: 3, sensorOffset: 0, sidePodScale: 1.2, wingSpan: 0.7 },
    { antennaCount: 1, armorBulk: 1.28, engineCount: 4, hornLength: 6, sensorOffset: -2, sidePodScale: 0.92, wingSpan: 0.86 },
    { antennaCount: 0, armorBulk: 0.98, engineCount: 2, hornLength: 9, sensorOffset: 2, sidePodScale: 1.36, wingSpan: 0.62 },
    { antennaCount: 2, armorBulk: 1.42, engineCount: 3, hornLength: 4, sensorOffset: 1, sidePodScale: 1.08, wingSpan: 0.76 },
  ],
  "swarm-fragile": [
    { antennaCount: 2, armorBulk: 0.72, engineCount: 1, hornLength: 5, sensorOffset: -1, sidePodScale: 0.7, wingSpan: 0.86 },
    { antennaCount: 4, armorBulk: 0.82, engineCount: 2, hornLength: 3, sensorOffset: 2, sidePodScale: 0.95, wingSpan: 1.18 },
    { antennaCount: 3, armorBulk: 0.64, engineCount: 3, hornLength: 7, sensorOffset: 0, sidePodScale: 1.12, wingSpan: 0.72 },
    { antennaCount: 1, armorBulk: 0.9, engineCount: 2, hornLength: 9, sensorOffset: 1, sidePodScale: 0.84, wingSpan: 1.34 },
  ],
};

const templateVariantOffset: Record<CommonEnemyTemplate["id"], number> = {
  "fast-fragile": 0,
  "slow-tough": 1,
  "swarm-fragile": 2,
};

function stableSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
