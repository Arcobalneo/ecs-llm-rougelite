import { describe, expect, it } from "vitest";
import {
  enemyDeathShardCount,
  ttlForEnemyDeathTemplate,
} from "../../src/client/visual/enemy-death-vfx.js";

describe("Enemy death VFX", () => {
  it("uses template-specific shard budgets for readable mechanical breakup", () => {
    expect(enemyDeathShardCount("slow-tough")).toBeGreaterThan(enemyDeathShardCount("fast-fragile"));
    expect(enemyDeathShardCount("swarm-fragile")).toBeGreaterThan(enemyDeathShardCount("fast-fragile"));
  });

  it("keeps heavier enemies visually present longer than fragile enemies", () => {
    expect(ttlForEnemyDeathTemplate("slow-tough")).toBeGreaterThan(ttlForEnemyDeathTemplate("fast-fragile"));
    expect(ttlForEnemyDeathTemplate("swarm-fragile")).toBeGreaterThanOrEqual(
      ttlForEnemyDeathTemplate("fast-fragile"),
    );
  });
});
