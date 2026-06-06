import { describe, expect, it } from "vitest";
import { syncGraphicsMap } from "../../src/client/rendering/entity-sync.js";

describe("entity graphics synchronization", () => {
  it("creates, updates, and removes cached graphics by cache key", () => {
    const cache = new Map<string, FakeGraphic>();
    const layer = new FakeLayer();
    const updates: string[] = [];

    syncGraphicsMap({
      Graphics: FakeGraphic,
      cache,
      cacheKey: (item) => `${item.id}:${item.variant}`,
      create: (Graphics, item) => new Graphics(`${item.id}:${item.variant}`),
      items: [
        { id: "enemy-a", variant: "fast" },
        { id: "enemy-b", variant: "slow" },
      ],
      layer,
      update: (graphic, item) => {
        graphic.updatedWith = `${item.id}:${item.variant}`;
        updates.push(graphic.updatedWith);
      },
    });

    expect([...cache.keys()]).toEqual(["enemy-a:fast", "enemy-b:slow"]);
    expect(layer.children.map((child) => child.key)).toEqual(["enemy-a:fast", "enemy-b:slow"]);
    expect(updates).toEqual(["enemy-a:fast", "enemy-b:slow"]);

    syncGraphicsMap({
      Graphics: FakeGraphic,
      cache,
      cacheKey: (item) => `${item.id}:${item.variant}`,
      create: (Graphics, item) => new Graphics(`${item.id}:${item.variant}`),
      items: [
        { id: "enemy-a", variant: "drifted" },
      ],
      layer,
      update: (graphic, item) => {
        graphic.updatedWith = `${item.id}:${item.variant}`;
      },
    });

    expect([...cache.keys()]).toEqual(["enemy-a:drifted"]);
    expect(layer.children.map((child) => child.key)).toEqual(["enemy-a:fast", "enemy-b:slow", "enemy-a:drifted"]);
    expect(layer.children[0]?.destroyed).toBe(true);
    expect(layer.children[1]?.destroyed).toBe(true);
    expect(layer.children[2]?.destroyed).toBe(false);
  });
});

class FakeLayer {
  readonly children: FakeGraphic[] = [];

  addChild(graphic: FakeGraphic): void {
    this.children.push(graphic);
  }
}

class FakeGraphic {
  destroyed = false;
  updatedWith = "";

  constructor(readonly key = "graphic") {}

  destroy(): void {
    this.destroyed = true;
  }
}
