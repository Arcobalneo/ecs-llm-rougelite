import { describe, expect, it } from "vitest";
import type { CombatFeedback } from "../../src/client/simulation/combat-loop.js";
import {
  baseKitFrameSignature,
  baseKitVfxProgress,
  createBaseKitVfxProfile,
  shouldCreateBaseKitVfx,
} from "../../src/client/visual/base-kit-vfx.js";

describe("Base kit VFX", () => {
  it("only creates animated VFX for base weapon impact feedback with an origin", () => {
    expect(shouldCreateBaseKitVfx(baseImpact("machine-gun"))).toBe(true);
    expect(shouldCreateBaseKitVfx(baseImpact("laser-sword"))).toBe(true);
    expect(shouldCreateBaseKitVfx({ kind: "impact", position: { x: 20, y: 0 } })).toBe(false);
    expect(shouldCreateBaseKitVfx({
      kind: "impact",
      origin: { x: 0, y: 0 },
      position: { x: 80, y: 0 },
    })).toBe(false);
  });

  it("gives the machine gun a richer multi-layer tracer profile than a single line", () => {
    const profile = createBaseKitVfxProfile(baseImpact("machine-gun"));

    expect(profile?.kind).toBe("machine-gun");
    expect(profile?.ttlSeconds).toBeGreaterThan(0.28);
    expect(profile?.stageCount).toBeGreaterThanOrEqual(3);
    expect(profile?.muzzleFlashCount).toBeGreaterThanOrEqual(4);
    expect(profile?.projectileSegments).toBeGreaterThanOrEqual(7);
    expect(profile?.particleCount).toBeGreaterThanOrEqual(12);
  });

  it("gives the laser sword windup, active, and fade frames with dense blade fragments", () => {
    const profile = createBaseKitVfxProfile(baseImpact("laser-sword"));

    expect(profile?.kind).toBe("laser-sword");
    expect(profile?.ttlSeconds).toBeGreaterThan(0.34);
    expect(profile?.stageCount).toBeGreaterThanOrEqual(3);
    expect(profile?.bladeAfterimages).toBeGreaterThanOrEqual(5);
    expect(profile?.particleCount).toBeGreaterThanOrEqual(16);
    expect(profile?.contactShardCount).toBeGreaterThanOrEqual(8);
  });

  it("changes frame signatures across animation progress without changing the event", () => {
    const event = baseImpact("laser-sword");
    const early = baseKitFrameSignature(event, 0.08);
    const active = baseKitFrameSignature(event, 0.42);
    const fade = baseKitFrameSignature(event, 0.84);

    expect(early).not.toBe(active);
    expect(active).not.toBe(fade);
    expect(early).toContain("windup");
    expect(active).toContain("active");
    expect(fade).toContain("fade");
  });

  it("tracks base weapon animation lifetime with clamped progress", () => {
    expect(baseKitVfxProgress({ bornAtSeconds: 10, nowSeconds: 10, ttlSeconds: 0.4 })).toBe(0);
    expect(baseKitVfxProgress({ bornAtSeconds: 10, nowSeconds: 10.2, ttlSeconds: 0.4 })).toBeCloseTo(0.5);
    expect(baseKitVfxProgress({ bornAtSeconds: 10, nowSeconds: 10.8, ttlSeconds: 0.4 })).toBe(1);
  });
});

function baseImpact(visualKind: "laser-sword" | "machine-gun"): CombatFeedback {
  return {
    kind: "impact",
    origin: { x: 0, y: 0 },
    position: visualKind === "machine-gun" ? { x: 260, y: -34 } : { x: 60, y: 22 },
    visualKind,
  };
}
