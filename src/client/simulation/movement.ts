export interface MovementVector {
  x: number;
  y: number;
  strength: number;
}

export interface TimedMovementVector {
  activeAt: number;
  vector: MovementVector;
}

export interface MovementInput {
  keyboard?: TimedMovementVector;
  joystick?: TimedMovementVector;
}

export const ZERO_MOVEMENT: MovementVector = Object.freeze({ x: 0, y: 0, strength: 0 });

const leftKeys = new Set(["KeyA", "ArrowLeft"]);
const rightKeys = new Set(["KeyD", "ArrowRight"]);
const upKeys = new Set(["KeyW", "ArrowUp"]);
const downKeys = new Set(["KeyS", "ArrowDown"]);

export function createKeyboardVector(activeKeys: ReadonlySet<string>): MovementVector {
  const x = axisFromKeys(activeKeys, leftKeys, rightKeys);
  const y = axisFromKeys(activeKeys, upKeys, downKeys);
  return normalizeMovement(x, y);
}

export function normalizeMovement(x: number, y: number): MovementVector {
  const length = Math.hypot(x, y);
  if (length === 0) {
    return ZERO_MOVEMENT;
  }

  const strength = Math.min(1, length);
  return {
    x: (x / length) * strength,
    y: (y / length) * strength,
    strength,
  };
}

export function resolveMovementVector(input: MovementInput): MovementVector {
  const vectors = [input.keyboard, input.joystick].filter(isActiveMovement);
  if (vectors.length === 0) {
    return ZERO_MOVEMENT;
  }

  vectors.sort((a, b) => b.activeAt - a.activeAt);
  return vectors[0].vector;
}

function axisFromKeys(
  activeKeys: ReadonlySet<string>,
  negativeKeys: ReadonlySet<string>,
  positiveKeys: ReadonlySet<string>,
): number {
  let axis = 0;
  for (const key of negativeKeys) {
    if (activeKeys.has(key)) {
      axis -= 1;
      break;
    }
  }
  for (const key of positiveKeys) {
    if (activeKeys.has(key)) {
      axis += 1;
      break;
    }
  }
  return axis;
}

function isActiveMovement(vector: TimedMovementVector | undefined): vector is TimedMovementVector {
  return vector !== undefined && vector.vector.strength > 0;
}
