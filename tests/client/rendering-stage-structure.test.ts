import { describe, expect, it } from "vitest";
import {
  applyCombatCamera,
  COMBAT_STAGE_LAYER_ORDER,
  createCombatStageLayers,
  type PixiContainer,
  type PixiContainerCtor,
  type PixiGraphics,
  type PixiGraphicsCtor,
} from "../../src/client/rendering/pixi-stage.js";
import { playerMechAnimationWithFeedback } from "../../src/client/rendering/combat-renderer.js";
import { createCombatRenderCache } from "../../src/client/rendering/render-cache.js";
import { calculateViewport } from "../../src/client/simulation/arena-math.js";
import type { ArenaRuntimeState } from "../../src/client/simulation/arena-runtime.js";

describe("Pixi combat rendering structure", () => {
  it("keeps layer order explicit so visual additions do not pile into the renderer", () => {
    const player = new FakeGraphics("player");
    const layers = createCombatStageLayers({
      Container: FakeContainer as unknown as PixiContainerCtor,
      Graphics: FakeGraphics as unknown as PixiGraphicsCtor,
      player: player as unknown as PixiGraphics,
    });
    const orderedChildren = layers.stage.children as unknown[];

    expect(orderedChildren).toEqual(COMBAT_STAGE_LAYER_ORDER.map((layerName) => layers[layerName]));
    expect(orderedChildren.indexOf(layers.enemyLayer)).toBeLessThan(orderedChildren.indexOf(player));
    expect(orderedChildren.indexOf(layers.projectileLayer)).toBeLessThan(
      orderedChildren.indexOf(layers.playerAttachmentLayer),
    );
    expect(orderedChildren.indexOf(layers.launchLayer)).toBeLessThan(
      orderedChildren.indexOf(layers.wishcraftPatternLayer),
    );
    expect(orderedChildren.indexOf(layers.wishcraftPatternLayer)).toBeLessThan(
      orderedChildren.indexOf(layers.playerAttachmentLayer),
    );
    expect(orderedChildren.indexOf(layers.feedbackLayer)).toBeGreaterThan(orderedChildren.indexOf(player));
  });

  it("initializes render caches in one place", () => {
    const cache = createCombatRenderCache();

    expect(cache.enemies).toBeInstanceOf(Map);
    expect(cache.lastPlayerHitAtSeconds).toBe(Number.NEGATIVE_INFINITY);
    expect(cache.lastPlayerLoadoutSignature).toBe("");
    expect(cache.playerWishInstallStartedAtSeconds).toBe(Number.NEGATIVE_INFINITY);
    expect(cache.xpShards).toBeInstanceOf(Map);
    expect(cache.summons).toBeInstanceOf(Map);
    expect(cache.bossIds).toBe("");
    expect(cache.cinematicVfx).toEqual([]);
    expect(cache.playerAttachmentIds).toBe("");
    expect(cache.lastFeedbackSignature).toBe("");
    expect(cache.patternVfx).toEqual([]);
    expect(cache.projectileVfx).toEqual([]);
    expect(cache.spectacleVfx).toEqual([]);
  });

  it("applies camera transform without owning gameplay state", () => {
    const stage = new FakeContainer("stage");
    const state = {
      activeKeys: new Set<string>(),
      input: {},
      lastTimestamp: 0,
      position: { x: 800, y: 520 },
      viewport: calculateViewport({ width: 1280, height: 720 }),
    } satisfies ArenaRuntimeState;

    applyCombatCamera(stage as unknown as PixiContainer, state);

    expect(stage.scale.x).toBeCloseTo(state.viewport.scale);
    expect(stage.scale.y).toBeCloseTo(state.viewport.scale);
    expect(stage.position.x).toBeLessThan(0);
    expect(stage.position.y).toBeLessThan(0);
  });

  it("derives player hit and Wishcraft install animation from render-only cache", () => {
    const cache = createCombatRenderCache();
    const base = {
      bob: 0,
      hitFlash: 0,
      idleFrame: 0 as const,
      leanX: 0,
      leanY: 0,
      movementStrength: 0,
      thrusterBack: 12,
      thrusterDown: 14,
      thrusterLeft: 8,
      thrusterRight: 8,
      wishInstallProgress: 1,
    };

    const firstLoadout = playerMechAnimationWithFeedback({
      base,
      feedback: [],
      loadout: [{ id: "first-craft" }] as never,
      nowSeconds: 4,
      renderCache: cache,
    });
    const secondLoadout = playerMechAnimationWithFeedback({
      base,
      feedback: [{ damage: 4, kind: "player-hit", position: { x: 0, y: 0 } }],
      loadout: [{ id: "first-craft" }, { id: "second-craft" }] as never,
      nowSeconds: 5,
      renderCache: cache,
    });

    expect(firstLoadout.wishInstallProgress).toBe(1);
    expect(secondLoadout.hitFlash).toBeGreaterThan(0);
    expect(secondLoadout.wishInstallProgress).toBe(0);
    expect(cache.lastPlayerHitAtSeconds).toBe(5);
    expect(cache.lastPlayerLoadoutSignature).toBe("first-craft,second-craft");
  });
});

class FakeContainer {
  readonly children: FakeContainer[] = [];
  readonly position = {
    x: 0,
    y: 0,
    set: (x: number, y: number) => {
      this.position.x = x;
      this.position.y = y;
    },
  };
  readonly scale = {
    x: 1,
    y: 1,
    set: (x: number, y = x) => {
      this.scale.x = x;
      this.scale.y = y;
    },
  };

  constructor(readonly name = "container") {}

  addChild(...children: FakeContainer[]): void {
    this.children.push(...children);
  }
}

class FakeGraphics extends FakeContainer {
  constructor(name = "graphics") {
    super(name);
  }
}
