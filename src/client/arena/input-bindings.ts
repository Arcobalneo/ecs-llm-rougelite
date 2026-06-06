import {
  clearKeyboardState,
  refreshViewport,
  updateJoystickState,
  updateKeyboardState,
  type ArenaRuntimeState,
} from "../simulation/arena-runtime.js";
import { normalizeMovement } from "../simulation/movement.js";
import type { ArenaRuntimeOptions } from "./types.js";
import { updatePlayerOverlay } from "./hud-renderer.js";

export function bindKeyboard(ownerWindow: Window | null, state: ArenaRuntimeState): void {
  ownerWindow?.addEventListener("keydown", (event) => {
    if (!isMovementKey(event.code)) {
      return;
    }
    event.preventDefault();
    updateKeyboardState(state, {
      code: event.code,
      isDown: true,
      repeat: event.repeat,
      now: performance.now(),
    });
  });
  ownerWindow?.addEventListener("keyup", (event) => {
    if (!isMovementKey(event.code)) {
      return;
    }
    event.preventDefault();
    updateKeyboardState(state, {
      code: event.code,
      isDown: false,
      repeat: false,
      now: performance.now(),
    });
  });
  ownerWindow?.addEventListener("blur", () => {
    clearKeyboardState(state, performance.now());
  });
}

export function bindViewportRefresh(options: ArenaRuntimeOptions, state: ArenaRuntimeState): void {
  const resizeWindow = options.ownerWindow as
    | (Window & { ResizeObserver?: typeof ResizeObserver })
    | null;
  const refresh = () => {
    refreshViewport(state, {
      width: options.screen.clientWidth || options.canvas.width,
      height: options.screen.clientHeight || options.canvas.height,
    });
    updatePlayerOverlay(options.playerOverlay, state);
  };
  options.ownerWindow?.addEventListener("resize", refresh);
  options.ownerWindow?.visualViewport?.addEventListener("resize", refresh);
  if (typeof resizeWindow?.ResizeObserver === "function") {
    const resizeObserver = new resizeWindow.ResizeObserver(refresh);
    resizeObserver.observe(options.screen);
  }
  options.ownerWindow?.document.addEventListener("visibilitychange", () => {
    if (options.ownerWindow?.document.visibilityState === "hidden") {
      clearKeyboardState(state, performance.now());
    }
  });
}

export function bindJoystick(options: ArenaRuntimeOptions, state: ArenaRuntimeState): void {
  let pointerId: number | undefined;
  const joystickRadius = 54;

  options.joystick.root.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    options.joystick.root.setPointerCapture(event.pointerId);
    updateJoystickFromPointer(event);
  });
  options.joystick.root.addEventListener("pointermove", (event) => {
    if (pointerId === event.pointerId) {
      updateJoystickFromPointer(event);
    }
  });
  options.joystick.root.addEventListener("pointerup", releaseJoystick);
  options.joystick.root.addEventListener("pointercancel", releaseJoystick);

  function updateJoystickFromPointer(event: PointerEvent): void {
    const rect = options.joystick.root.getBoundingClientRect();
    const raw = {
      x: event.clientX - (rect.left + rect.width / 2),
      y: event.clientY - (rect.top + rect.height / 2),
    };
    const length = Math.hypot(raw.x, raw.y);
    const capped = length > joystickRadius ? joystickRadius / length : 1;
    const visual = { x: raw.x * capped, y: raw.y * capped };
    options.joystick.knob.style.transform = `translate(${visual.x}px, ${visual.y}px)`;
    updateJoystickState(state, {
      now: performance.now(),
      vector: normalizeMovement(raw.x / joystickRadius, raw.y / joystickRadius),
    });
  }

  function releaseJoystick(event: PointerEvent): void {
    if (pointerId !== event.pointerId) {
      return;
    }
    pointerId = undefined;
    options.joystick.knob.style.transform = "translate(0, 0)";
    updateJoystickState(state, { now: performance.now(), vector: normalizeMovement(0, 0) });
  }
}

function isMovementKey(code: string): boolean {
  return [
    "KeyA",
    "KeyD",
    "KeyS",
    "KeyW",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
  ].includes(code);
}
