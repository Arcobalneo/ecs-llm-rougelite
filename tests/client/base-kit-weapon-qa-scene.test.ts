import { describe, expect, it } from "vitest";
import {
  baseKitWeaponQaCoverageSummary,
  createBaseKitWeaponQaScenarios,
} from "../../src/client/visual/qa/base-kit-weapon-qa-scene.js";

describe("Base kit weapon QA scene", () => {
  it("covers both base weapons across windup, active, and fade frames", () => {
    const scenarios = createBaseKitWeaponQaScenarios();
    const summary = baseKitWeaponQaCoverageSummary(scenarios);

    expect(summary.scenarioCount).toBe(6);
    expect(summary.weaponCount).toBe(2);
    expect(summary.frameSignatureCount).toBe(6);
    expect(summary.socketShiftedFrameCount).toBe(6);
    expect(scenarios.map((scenario) => scenario.id)).toEqual([
      "mg-windup",
      "mg-active",
      "mg-fade",
      "sword-windup",
      "sword-active",
      "sword-fade",
    ]);
  });
});
