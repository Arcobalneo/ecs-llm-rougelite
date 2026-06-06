import { describe, expect, it } from "vitest";
import { calculateViewport } from "../../src/client/simulation/arena-math.js";
import {
  clearKeyboardState,
  createArenaRuntimeState,
  refreshViewport,
  updateKeyboardState,
  updateJoystickState,
} from "../../src/client/simulation/arena-runtime.js";

describe("Arena runtime input state", () => {
  it("does not let keyboard repeat events steal priority back from an active joystick", () => {
    const state = createArenaRuntimeState({
      now: 0,
      viewport: calculateViewport({ width: 1280, height: 720 }),
    });

    updateKeyboardState(state, { code: "KeyD", isDown: true, repeat: false, now: 10 });
    updateJoystickState(state, { vector: { x: 0, y: -1, strength: 1 }, now: 20 });
    updateKeyboardState(state, { code: "KeyD", isDown: true, repeat: true, now: 30 });

    expect(state.input.keyboard?.activeAt).toBe(10);
    expect(state.input.joystick?.activeAt).toBe(20);
  });

  it("refreshes viewport math when the screen size changes", () => {
    const state = createArenaRuntimeState({
      now: 0,
      viewport: calculateViewport({ width: 1280, height: 720 }),
    });

    refreshViewport(state, { width: 390, height: 844 });

    expect(state.viewport.visibleWorldHeight).toBe(720);
    expect(state.viewport.visibleWorldWidth).toBeCloseTo(332.7, 1);
    expect(state.viewport.screenWidth).toBe(390);
    expect(state.viewport.screenHeight).toBe(844);
  });

  it("clears held keyboard movement after focus is lost", () => {
    const state = createArenaRuntimeState({
      now: 0,
      viewport: calculateViewport({ width: 1280, height: 720 }),
    });

    updateKeyboardState(state, { code: "KeyD", isDown: true, repeat: false, now: 10 });
    clearKeyboardState(state, 30);

    expect(state.activeKeys.size).toBe(0);
    expect(state.input.keyboard).toEqual({ activeAt: 30, vector: { x: 0, y: 0, strength: 0 } });
  });
});
