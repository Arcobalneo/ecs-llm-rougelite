import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import type { CommonEnemyTemplate } from "../../src/client/simulation/combat.js";
import {
  commonEnemyMotionArtPartBudget,
  commonEnemyMotionArtProfile,
} from "../../src/client/visual/sprites/common-enemy-motion-art.js";

const templates: CommonEnemyTemplate["id"][] = ["fast-fragile", "slow-tough", "swarm-fragile"];

describe("Common enemy motion art", () => {
  it("defines distinct authored motion frames for every common enemy family", () => {
    for (const templateId of templates) {
      const signatures = new Set(
        [0, 1, 2, 3].map((frame) =>
          JSON.stringify(commonEnemyMotionArtProfile({ frame: frame as 0 | 1 | 2 | 3, templateId })),
        ),
      );

      expect(signatures.size).toBe(4);
      expect(commonEnemyMotionArtPartBudget(templateId)).toBeGreaterThan(40);
    }
  });

  it("makes fast fragile enemies read as darting engine drones", () => {
    const fast = commonEnemyMotionArtProfile({ frame: 3, templateId: "fast-fragile" });
    const slow = commonEnemyMotionArtProfile({ frame: 3, templateId: "slow-tough" });

    expect(fast.afterimagePixels + fast.engineStreaks).toBeGreaterThan(
      slow.afterimagePixels + slow.engineStreaks,
    );
    expect(fast.flutterArcs).toBeGreaterThan(slow.flutterArcs);
  });

  it("makes slow tough enemies read as heavy scraping crawlers", () => {
    const slow = commonEnemyMotionArtProfile({ frame: 1, templateId: "slow-tough" });
    const fast = commonEnemyMotionArtProfile({ frame: 1, templateId: "fast-fragile" });
    const swarm = commonEnemyMotionArtProfile({ frame: 1, templateId: "swarm-fragile" });

    expect(slow.treadSparks + slow.scrapeMarks + slow.ventPuffs).toBeGreaterThan(
      fast.treadSparks + fast.scrapeMarks + fast.ventPuffs,
    );
    expect(slow.treadSparks + slow.scrapeMarks).toBeGreaterThan(
      swarm.treadSparks + swarm.scrapeMarks,
    );
  });

  it("makes swarm fragile enemies read through micro-node motion without growing their body", () => {
    const swarm = commonEnemyMotionArtProfile({ frame: 2, templateId: "swarm-fragile" });
    const fast = commonEnemyMotionArtProfile({ frame: 2, templateId: "fast-fragile" });
    const slow = commonEnemyMotionArtProfile({ frame: 2, templateId: "slow-tough" });

    expect(swarm.microNodes).toBeGreaterThan(fast.microNodes);
    expect(swarm.microNodes).toBeGreaterThan(slow.microNodes);
    expect(swarm.trailPixels + swarm.flutterArcs).toBeGreaterThan(
      fast.trailPixels + fast.flutterArcs,
    );
  });

  it("keeps the common enemy sprite factory as a small composition entrypoint", async () => {
    const spriteFactory = await readFile("src/client/visual/sprites/common-enemy-sprites.ts", "utf8");
    const motionArt = await readFile("src/client/visual/sprites/common-enemy-motion-art.ts", "utf8");

    expect(spriteFactory).toContain("./common-enemy-motion-art.js");
    expect(spriteFactory.split("\n").length).toBeLessThan(470);
    expect(motionArt).toContain("export function drawCommonEnemyMotionArt");
  });
});
