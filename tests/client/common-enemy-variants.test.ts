import { describe, expect, it } from "vitest";
import {
  commonEnemyVariantCount,
  commonEnemyVisualVariant,
  variantIdForEnemy,
} from "../../src/client/visual/common-enemy-variants.js";
import type { CommonEnemyTemplate } from "../../src/client/simulation/combat.js";

const templates: CommonEnemyTemplate["id"][] = ["fast-fragile", "slow-tough", "swarm-fragile"];

describe("Common enemy visual variants", () => {
  it("keeps variant selection deterministic for stable sprite silhouettes", () => {
    expect(variantIdForEnemy({ enemyId: "enemy-42", templateId: "fast-fragile" })).toBe(
      variantIdForEnemy({ enemyId: "enemy-42", templateId: "fast-fragile" }),
    );
  });

  it("offers multiple sub-silhouettes for every common enemy template", () => {
    for (const templateId of templates) {
      const variants = new Set(
        Array.from({ length: 24 }, (_, index) =>
          commonEnemyVisualVariant({ enemyId: `enemy-${index}`, templateId }).id,
        ),
      );
      expect(variants.size).toBe(commonEnemyVariantCount());
    }
  });

  it("uses template identity in variant selection so same ids do not force the same family shape", () => {
    const byTemplate = templates.map((templateId) =>
      variantIdForEnemy({ enemyId: "shared-enemy-id", templateId }),
    );

    expect(new Set(byTemplate).size).toBeGreaterThan(1);
  });
});
