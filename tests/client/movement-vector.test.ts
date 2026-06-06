import { describe, expect, it } from "vitest";
import {
  createKeyboardVector,
  resolveMovementVector,
  type MovementInput,
} from "../../src/client/simulation/movement.js";

describe("Movement Vector resolution", () => {
  it("normalizes keyboard diagonals to a single movement vector", () => {
    const vector = createKeyboardVector(new Set(["KeyW", "ArrowRight"]));

    expect(vector.x).toBeCloseTo(0.7071, 4);
    expect(vector.y).toBeCloseTo(-0.7071, 4);
    expect(vector.strength).toBeCloseTo(1, 4);
  });

  it("uses the most recent active input between keyboard and joystick", () => {
    const input: MovementInput = {
      keyboard: { activeAt: 100, vector: { x: 1, y: 0, strength: 1 } },
      joystick: { activeAt: 120, vector: { x: 0, y: -1, strength: 1 } },
    };

    expect(resolveMovementVector(input)).toEqual({ x: 0, y: -1, strength: 1 });

    input.keyboard = { activeAt: 140, vector: { x: -1, y: 0, strength: 1 } };
    expect(resolveMovementVector(input)).toEqual({ x: -1, y: 0, strength: 1 });
  });
});
