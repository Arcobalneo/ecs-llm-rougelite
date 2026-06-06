export interface ScoreInputs {
  activeCombatSeconds: number;
  kills: number;
  level: number;
  bossKills: number;
}

export function computeScore(inputs: ScoreInputs): number {
  return (
    Math.floor(inputs.activeCombatSeconds) +
    inputs.kills * 10 +
    Math.max(0, inputs.level - 1) * 50 +
    inputs.bossKills * 1000
  );
}
