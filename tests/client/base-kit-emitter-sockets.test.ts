import { describe, expect, it } from "vitest";
import type { CombatFeedback } from "../../src/client/simulation/combat-loop.js";
import {
  baseKitEmitterSocketProfile,
  resolveBaseKitEmitterSocket,
  withBaseKitEmitterOrigin,
} from "../../src/client/visual/base-kit-emitter-sockets.js";

describe("Base kit emitter sockets", () => {
  it("moves machine-gun VFX origin to the visible weapon rail on the target side", () => {
    const right = resolveBaseKitEmitterSocket({ event: impact("machine-gun", { x: 200, y: -20 }) });
    const left = resolveBaseKitEmitterSocket({ event: impact("machine-gun", { x: -180, y: 24 }) });

    expect(right?.origin.x).toBeGreaterThan(30);
    expect(right?.origin.y).toBeLessThan(4);
    expect(left?.origin.x).toBeLessThan(-30);
    expect(left?.origin.y).toBeLessThan(4);
    expect(right?.socketId).toBe("right-forearm-rail");
    expect(left?.socketId).toBe("left-forearm-rail");
  });

  it("moves laser-sword VFX origin to the close combat arm instead of player center", () => {
    const socket = resolveBaseKitEmitterSocket({ event: impact("laser-sword", { x: -42, y: 30 }) });

    expect(socket?.socketId).toBe("left-sword-hilt");
    expect(socket?.origin.x).toBeLessThan(-34);
    expect(socket?.origin.y).toBeGreaterThan(-2);
  });

  it("wraps base weapon feedback without changing target position or non-base feedback", () => {
    const event = impact("machine-gun", { x: 140, y: 0 });
    const socket = resolveBaseKitEmitterSocket({ event });
    const wrapped = withBaseKitEmitterOrigin(event, socket);

    expect(wrapped.kind).toBe("impact");
    if (wrapped.kind !== "impact") {
      throw new Error("expected base impact feedback");
    }
    expect(wrapped.position).toEqual(event.position);
    expect(wrapped.origin).not.toEqual(event.origin);
    expect(withBaseKitEmitterOrigin({ kind: "xp-collect", position: { x: 0, y: 0 }, value: 4 }, socket)).toEqual({
      kind: "xp-collect",
      position: { x: 0, y: 0 },
      value: 4,
    });
  });

  it("exposes a visual-only socket profile for QA coverage", () => {
    const profile = baseKitEmitterSocketProfile();

    expect(profile.machineGunSockets).toBe(2);
    expect(profile.laserSwordSockets).toBe(2);
    expect(profile.visualOnly).toBe(true);
  });
});

function impact(
  visualKind: "laser-sword" | "machine-gun",
  position: { x: number; y: number },
): Extract<CombatFeedback, { kind: "impact" }> {
  return {
    kind: "impact",
    origin: { x: 0, y: 0 },
    position,
    visualKind,
  };
}
