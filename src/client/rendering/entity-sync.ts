interface DestroyableGraphic {
  destroy(): void;
}

interface GraphicsLayer<TGraphic extends DestroyableGraphic> {
  addChild(graphic: TGraphic): unknown;
}

/*
  syncGraphicsMap follows the supplied cacheKey, so visuals can rebuild when
  recent Wishcraft changes even if the entity id remains stable.
*/
export function syncGraphicsMap<
  TItem extends { id: string },
  TGraphic extends DestroyableGraphic,
  TGraphicsCtor,
>(options: {
  Graphics: TGraphicsCtor;
  cache: Map<string, TGraphic>;
  cacheKey?: (item: TItem) => string;
  create: (Graphics: TGraphicsCtor, item: TItem) => TGraphic;
  items: readonly TItem[];
  layer: GraphicsLayer<TGraphic>;
  update: (graphic: TGraphic, item: TItem) => void;
}): void {
  const cacheKeyFor = options.cacheKey ?? ((item: TItem) => item.id);
  const liveIds = new Set(options.items.map((item) => cacheKeyFor(item)));
  for (const [id, graphic] of options.cache) {
    if (!liveIds.has(id)) {
      options.cache.delete(id);
      graphic.destroy();
    }
  }

  for (const item of options.items) {
    const cacheKey = cacheKeyFor(item);
    let graphic = options.cache.get(cacheKey);
    if (!graphic) {
      graphic = options.create(options.Graphics, item);
      options.cache.set(cacheKey, graphic);
      options.layer.addChild(graphic);
    }
    options.update(graphic, item);
  }
}
