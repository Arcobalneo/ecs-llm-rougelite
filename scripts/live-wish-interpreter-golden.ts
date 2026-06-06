import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createDeepSeekWishProviderFromEnv } from "../src/server/deepseek-provider.js";
import { interpretWish } from "../src/server/wish-interpreter.js";
import {
  validateWishcraftContract,
  validateWishcraftRewardTone,
} from "../src/shared/wishcraft/validation.js";
import { wishcraftCatalog } from "../src/shared/wishcraft/catalog.js";

const scenarios = [
  { language: "zh" as const, wish: "我想要黑洞伴飞炮围着我旋转" },
  { language: "zh" as const, wish: "给我龙息火焰剑和星火弹幕" },
  { language: "en" as const, wish: "I want neon music waves that fire plasma notes" },
  { language: "en" as const, wish: "Give me angel shield drones" },
  { language: "zh" as const, wish: "让我变弱并放一个自动炮塔陷阱" },
  { language: "en" as const, wish: "Meteor thunder missiles, very bright and explosive" },
  { language: "zh" as const, wish: "量子时钟让子弹像齿轮一样爆开" },
  { language: "en" as const, wish: "Forest ocean crystal orbiting companions" },
  { language: "zh" as const, wish: "霓虹赛博像素风的护盾光环" },
  { language: "en" as const, wish: "A swarm of tiny demon wingmen" },
  { language: "zh" as const, wish: "磁轨经验吸附和闪电弹" },
  { language: "en" as const, wish: "Solar lunar blade barrage" },
];

const provider = createDeepSeekWishProviderFromEnv(process.env);
const scenarioLimit = readPositiveInteger(process.env.DEEPSEEK_TEST_RUNS, scenarios.length);
const selectedScenarios = scenarios.slice(0, Math.min(scenarioLimit, scenarios.length));
const results = [];

for (const [index, scenario] of selectedScenarios.entries()) {
  const level = 2 + index;
  const result = await interpretWish(provider, {
    language: scenario.language,
    level,
    loadoutSummary: index === 0 ? "Empty Wishcraft Loadout" : "Prior Wishcrafts exist; avoid repetition.",
    wish: scenario.wish,
  });
  const validationErrors = validateWishcraftContract(wishcraftCatalog, result.finalWishcraft, level);
  const rewardErrors = validateWishcraftRewardTone(result.finalWishcraft);
  results.push({
    scenario,
    status:
      validationErrors.length === 0 &&
      rewardErrors.length === 0 &&
      result.trace.attempts.length <= 4 &&
      result.finalWishcraft.name.cn.length <= 12 &&
      result.finalWishcraft.name.en.length <= 28
        ? "pass"
        : "fail",
    finalWishcraft: result.finalWishcraft,
    validationErrors: [...validationErrors, ...rewardErrors],
    fallback: result.trace.fallbackReason !== undefined,
    attempts: result.trace.attempts.length,
    repairAttempts: Math.max(0, result.trace.attempts.length - 1),
    trace: result.trace,
  });
}

const fallbackCount = results.filter((result) => result.fallback).length;
const failed = results.filter((result) => result.status === "fail");
const report = {
  generatedAt: new Date().toISOString(),
  provider: provider.config,
  gates: {
    maxFallbacks: 1,
    maxRepairAttemptsPerScenario: 3,
    minScenarioCount: Math.min(12, scenarios.length),
    scenarioCount: scenarios.length,
    selectedScenarioCount: selectedScenarios.length,
  },
  summary: {
    fallbackCount,
    passCount: results.length - failed.length,
    scenarioCount: results.length,
  },
  results,
};

const reportPath = join(process.cwd(), "artifacts", "llm", "wish-interpreter-live-report.json");
await mkdir(join(process.cwd(), "artifacts", "llm"), { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ reportPath, summary: report.summary }, null, 2));

if (
  failed.length > 0 ||
  fallbackCount > report.gates.maxFallbacks ||
  results.length < report.gates.minScenarioCount
) {
  process.exitCode = 1;
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
