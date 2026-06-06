import {
  ARENA_BOUNDS,
  calculateViewport,
  type Point,
  type Viewport,
} from "./arena-math.js";
import {
  ZERO_MOVEMENT,
  createKeyboardVector,
  type MovementInput,
  type MovementVector,
} from "./movement.js";

export interface ArenaRuntimeState {
  activeKeys: Set<string>;
  input: MovementInput;
  lastTimestamp: number;
  position: Point;
  viewport: Viewport;
}

export interface CreateArenaRuntimeStateOptions {
  now: number;
  viewport: Viewport;
}

export interface KeyboardStateChange {
  code: string;
  isDown: boolean;
  repeat: boolean;
  now: number;
}

export interface JoystickStateChange {
  vector: MovementVector;
  now: number;
}

export function createArenaRuntimeState(options: CreateArenaRuntimeStateOptions): ArenaRuntimeState {
  return {
    activeKeys: new Set(),
    input: {},
    lastTimestamp: options.now,
    position: { x: ARENA_BOUNDS.width / 2, y: ARENA_BOUNDS.height / 2 },
    viewport: options.viewport,
  };
}

export function updateKeyboardState(
  state: ArenaRuntimeState,
  change: KeyboardStateChange,
): void {
  const before = createKeyboardVector(state.activeKeys);

  if (change.isDown) {
    state.activeKeys.add(change.code);
  } else {
    state.activeKeys.delete(change.code);
  }

  const next = createKeyboardVector(state.activeKeys);
  if (change.repeat && movementEquals(before, next)) {
    return;
  }

  state.input.keyboard = { activeAt: change.now, vector: next };
}

export function updateJoystickState(state: ArenaRuntimeState, change: JoystickStateChange): void {
  state.input.joystick = { activeAt: change.now, vector: change.vector };
}

export function clearKeyboardState(state: ArenaRuntimeState, now: number): void {
  state.activeKeys.clear();
  state.input.keyboard = { activeAt: now, vector: ZERO_MOVEMENT };
}

export function refreshViewport(
  state: ArenaRuntimeState,
  screen: { width: number; height: number },
): void {
  state.viewport = calculateViewport(screen);
}

function movementEquals(left: MovementVector, right: MovementVector): boolean {
  return left.x === right.x && left.y === right.y && left.strength === right.strength;
}
