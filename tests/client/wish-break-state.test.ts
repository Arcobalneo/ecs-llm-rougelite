import { describe, expect, it } from "vitest";
import {
  createWishBreakState,
  finishManifestation,
  receiveWishcraft,
  startWishBreak,
  submitWish,
} from "../../src/client/simulation/wish-break.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";

describe("Mock Wish Break journey state", () => {
  it("freezes combat on level-up and blocks empty Wish submissions", () => {
    const state = startWishBreak(createWishBreakState(), { level: 2 });

    expect(state.phase).toBe("wish-break");
    expect(state.combatPaused).toBe(true);
    expect(state.activeCombatSeconds).toBe(0);
    expect(submitWish(state, "   ")).toEqual({
      state,
      accepted: false,
      reason: "empty-wish",
    });
  });

  it("locks into one in-flight Wish Fulfillment and appends one Wishcraft without rewriting loadout", () => {
    const state = startWishBreak(createWishBreakState(), { level: 2 });
    const submitted = submitWish(state, "I want a star lance");

    expect(submitted.accepted).toBe(true);
    expect(submitted.state.phase).toBe("wish-fulfillment");
    expect(submitWish(submitted.state, "another wish").accepted).toBe(false);

    const fulfilled = receiveWishcraft(submitted.state, wishcraftCatalog.fixtures.starLance);
    expect(fulfilled.phase).toBe("manifestation");
    expect(fulfilled.loadout.map((craft) => craft.id)).toEqual([
      wishcraftCatalog.fixtures.starLance.id,
    ]);
    expect(fulfilled.loadoutSummary).toContain("Star Lance Echo");
    expect(
      receiveWishcraft(fulfilled, wishcraftCatalog.fixtures.gravityOrbiter).loadout.map(
        (craft) => craft.id,
      ),
    ).toEqual([wishcraftCatalog.fixtures.starLance.id]);

    const secondBreak = startWishBreak(finishManifestation(fulfilled), { level: 3 });
    const second = receiveWishcraft(
      submitWish(secondBreak, "black hole orbiters").state,
      wishcraftCatalog.fixtures.gravityOrbiter,
    );
    expect(second.loadout.map((craft) => craft.id)).toEqual([
      wishcraftCatalog.fixtures.starLance.id,
      wishcraftCatalog.fixtures.gravityOrbiter.id,
    ]);
  });

  it("excludes Wish Break, Fulfillment, and Manifestation time from active combat time", () => {
    const state = createWishBreakState({ activeCombatSeconds: 15 });
    const inBreak = startWishBreak(state, { level: 2 });
    const submitted = submitWish(inBreak, "black hole orbiters").state;
    const manifested = receiveWishcraft(submitted, wishcraftCatalog.fixtures.gravityOrbiter);
    const resumed = finishManifestation(manifested);

    expect(resumed.activeCombatSeconds).toBe(15);
    expect(resumed.phase).toBe("combat");
    expect(resumed.combatPaused).toBe(false);
  });

  it("processes queued level-up Wish Breaks one by one after each Manifestation", () => {
    const firstBreak = startWishBreak(createWishBreakState(), { level: 2 });
    const queued = startWishBreak(startWishBreak(firstBreak, { level: 3 }), { level: 4 });

    expect(queued.phase).toBe("wish-break");
    expect(queued.currentLevel).toBe(2);
    expect(queued.queuedLevels).toEqual([3, 4]);

    const firstAward = receiveWishcraft(
      submitWish(queued, "star lance").state,
      wishcraftCatalog.fixtures.starLance,
    );
    const secondBreak = finishManifestation(firstAward);

    expect(secondBreak.phase).toBe("wish-break");
    expect(secondBreak.currentLevel).toBe(3);
    expect(secondBreak.queuedLevels).toEqual([4]);
    expect(secondBreak.loadoutSummary).toContain("Star Lance Echo");

    const secondAward = receiveWishcraft(
      submitWish(secondBreak, "black hole orbiters").state,
      wishcraftCatalog.fixtures.gravityOrbiter,
    );
    const thirdBreak = finishManifestation(secondAward);

    expect(thirdBreak.phase).toBe("wish-break");
    expect(thirdBreak.currentLevel).toBe(4);
    expect(thirdBreak.queuedLevels).toEqual([]);
    expect(thirdBreak.loadoutSummary).toContain("Black Hole Companions");
  });
});
