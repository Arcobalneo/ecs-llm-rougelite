import { describe, expect, it } from "vitest";
import {
  ARENA_BOUNDS,
  PLAYER_COLLISION_RADIUS,
  applyMovement,
  calculateCamera,
  calculateViewport,
} from "../../src/client/simulation/arena-math.js";

describe("Arena boundary and camera math", () => {
  it("clamps the Player Mech inside hard Arena boundaries without edge damage", () => {
    const result = applyMovement({
      position: { x: ARENA_BOUNDS.width - PLAYER_COLLISION_RADIUS - 2, y: 240 },
      movement: { x: 1, y: 0, strength: 1 },
      deltaSeconds: 1,
    });

    expect(result.position.x).toBe(ARENA_BOUNDS.width - PLAYER_COLLISION_RADIUS);
    expect(result.position.y).toBe(240);
    expect(result.edgeHit).toBe(true);
    expect(result.damageTaken).toBe(0);
  });

  it("keeps a consistent visible world-height baseline across mobile and desktop", () => {
    const desktop = calculateViewport({ width: 1280, height: 720 });
    const mobile = calculateViewport({ width: 390, height: 844 });

    expect(desktop.visibleWorldHeight).toBe(720);
    expect(mobile.visibleWorldHeight).toBe(720);
    expect(desktop.visibleWorldWidth).toBeCloseTo(1280, 3);
    expect(mobile.visibleWorldWidth).toBeCloseTo(332.7, 1);
  });

  it("follows the player while clamping the camera inside Arena bounds", () => {
    const viewport = calculateViewport({ width: 1280, height: 720 });
    const centerCamera = calculateCamera({ player: { x: 1600, y: 1000 }, viewport });
    expect(centerCamera).toEqual({ x: 960, y: 640 });

    const cornerCamera = calculateCamera({ player: { x: 20, y: 20 }, viewport });
    expect(cornerCamera).toEqual({ x: 0, y: 0 });

    const farCamera = calculateCamera({
      player: { x: ARENA_BOUNDS.width - 10, y: ARENA_BOUNDS.height - 10 },
      viewport,
    });
    expect(farCamera).toEqual({ x: 1920, y: 1280 });
  });
});
