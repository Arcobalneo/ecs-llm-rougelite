import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INITIAL_ENEMY_COUNT, desiredEnemyCountForBossKills, mountArena } from "../../src/client/arena.js";
import { createCombatLoopState } from "../../src/client/simulation/combat-loop.js";
import { xpThresholdForLevel } from "../../src/client/simulation/progression-combat.js";
import { CONTENT_VERSION } from "../../src/shared/content-version.js";
import { wishcraftCatalog } from "../../src/shared/wishcraft/catalog.js";

describe("Arena controls shell", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("refreshes viewport state when the Arena container resizes", () => {
    const resizeObservers: Array<{ observe(target: Element): void; trigger(): void }> = [];
    class FakeResizeObserver {
      readonly callback: ResizeObserverCallback;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        resizeObservers.push({
          observe: vi.fn(),
          trigger: () => {
            this.callback([], this);
          },
        });
      }

      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    }

    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    Object.defineProperty(dom.window, "ResizeObserver", {
      configurable: true,
      value: FakeResizeObserver,
    });
    const root = dom.window.document.querySelector("#app")!;

    mountArena({
      root,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
    });

    const screen = dom.window.document.querySelector<HTMLElement>("[data-screen=\"arena\"]")!;
    Object.defineProperty(screen, "clientWidth", { configurable: true, value: 390 });
    Object.defineProperty(screen, "clientHeight", { configurable: true, value: 844 });

    resizeObservers[0].trigger();

    const playerMech = dom.window.document.querySelector("[data-player-mech]");
    expect(playerMech?.getAttribute("data-viewport-height")).toBe("720.00");
    expect(Number(playerMech?.getAttribute("data-viewport-width"))).toBeCloseTo(332.7, 1);
  });

  it("mounts player-anchored UI and a persistent joystick for movement-only play", () => {
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
    });
    const root = dom.window.document.querySelector("#app")!;

    mountArena({
      root,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
    });

    const playerMech = dom.window.document.querySelector("[data-player-mech]");
    expect(playerMech).not.toBeNull();
    expect(playerMech?.getAttribute("data-player-world-x")).toBe("1600.00");
    expect(playerMech?.getAttribute("data-player-world-y")).toBe("1000.00");
    expect(dom.window.document.querySelector("[data-player-level]")?.textContent).toBe("Lv.001");
    expect(dom.window.document.querySelector("[data-hud-level]")?.textContent).toBe("Lv.001");
    expect(dom.window.document.querySelector("[data-player-health]")).not.toBeNull();
    expect(dom.window.document.querySelector("[data-joystick]")).not.toBeNull();
    expect(dom.window.document.querySelector("[data-joystick-knob]")).not.toBeNull();
    expect(dom.window.document.querySelector("[data-combat-action]")).toBeNull();
    expect(dom.window.document.querySelector("[data-run-content-version]")?.textContent).toBe("");
    expect(dom.window.document.querySelector("[data-dom-hud]")?.textContent).not.toContain(CONTENT_VERSION);
  });

  it("starts with survivor-like horde density and scales enemy pressure after Boss victories and combat time", () => {
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
    });
    const root = dom.window.document.querySelector("#app")!;

    mountArena({
      root,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
    });

    expect(INITIAL_ENEMY_COUNT).toBeGreaterThanOrEqual(36);
    expect(desiredEnemyCountForBossKills(0, 0)).toBe(INITIAL_ENEMY_COUNT);
    expect(desiredEnemyCountForBossKills(0, 150)).toBeGreaterThan(desiredEnemyCountForBossKills(0, 0));
    expect(desiredEnemyCountForBossKills(1, 180)).toBeGreaterThan(desiredEnemyCountForBossKills(0, 180));
    expect(desiredEnemyCountForBossKills(3, 600)).toBeGreaterThanOrEqual(96);
  });

  it("opens a paused Wish Break on level-up, blocks empty submit, fulfills one Wishcraft, and manifests it", async () => {
    vi.useFakeTimers();
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    vi.setSystemTime(0);
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
    });
    initialCombatState.feedback.push({ kind: "level-up", level: 2 });
    const fulfilledWishes: string[] = [];
    let resolveFulfillment: ((wishcraft: typeof wishcraftCatalog.fixtures.starLance) => void) | undefined;

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
      fulfillWish: ({ wish }) => {
        fulfilledWishes.push(wish);
        return new Promise((resolve) => {
          resolveFulfillment = resolve;
        });
      },
    });

    const dialog = dom.window.document.querySelector<HTMLElement>("[data-wish-break]");
    const input = dom.window.document.querySelector<HTMLInputElement>("[data-wish-input]");
    const submit = dom.window.document.querySelector<HTMLButtonElement>("[data-wish-submit]");

    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain("银河魔装机神");
    expect(input?.placeholder).toContain("龙息");
    expect(submit?.disabled).toBe(true);
    expect(dom.window.document.querySelector("[data-screen=\"arena\"]")?.getAttribute("data-combat-paused")).toBe(
      "true",
    );

    input!.value = "给我一把星火长枪";
    input!.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    expect(submit?.disabled).toBe(false);
    submit!.click();
    await waitForMicrotasks(dom.window);

    expect(fulfilledWishes).toEqual(["给我一把星火长枪"]);
    expect(dialog?.textContent).toContain("愿望兑现中");
    resolveFulfillment?.(wishcraftCatalog.fixtures.starLance);
    await waitForMicrotasks(dom.window);

    expect(dialog?.textContent).toContain("星矛回响");
    expect(dialog?.getAttribute("data-phase")).toBe("manifestation");
    expect(
      dom.window.document
        .querySelector("[data-wish-manifestation]")
        ?.getAttribute("data-theme-id"),
    ).toBe("starfire");
    expect(dom.window.document.querySelector("[data-screen=\"arena\"]")?.getAttribute("data-combat-paused")).toBe(
      "true",
    );
    expect(dom.window.document.querySelector("[data-loadout-summary]")?.textContent).toContain(
      "Star Lance Echo",
    );

    vi.advanceTimersByTime(900);
    await waitForMicrotasks(dom.window);

    expect(dialog?.hidden).toBe(true);
    expect(dom.window.document.querySelector("[data-screen=\"arena\"]")?.getAttribute("data-combat-paused")).toBe(
      "false",
    );
    expect(dom.window.document.querySelector("[data-player-mech]")?.getAttribute("data-visual-attachments")).toContain(
      "aura-starfire-0",
    );
  });

  it("renders Wish Break UI in English when the Run language is English", () => {
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
    });
    initialCombatState.feedback.push({ kind: "level-up", level: 2 });

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "en",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
      fulfillWish: async () => wishcraftCatalog.fixtures.starLance,
    });

    const dialog = dom.window.document.querySelector<HTMLElement>("[data-wish-break]")!;
    expect(dialog.textContent).toContain("Galactic Arsenal Deity");
    expect(dialog.textContent).toContain("What power do you want?");
    expect(dialog.textContent).not.toContain("你想要什么能力？");
    expect(dialog.textContent).not.toContain("愿望兑现中");
  });

  it("exposes structured visual assembly warnings without blocking the Arena", () => {
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
    });
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
      wishcraftLoadout: [
        {
          ...wishcraftCatalog.fixtures.starLance,
          id: "wishcraft-missing-visual-test",
          visualPieceIds: ["missing-visual-piece"],
        },
      ],
    });

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
    });

    expect(dom.window.document.querySelector("[data-screen=\"arena\"]")).not.toBeNull();
    const playerMech = dom.window.document.querySelector("[data-player-mech]");
    expect(
      playerMech?.getAttribute("data-visual-warnings"),
    ).toContain("missing-visual-piece");
    expect(JSON.parse(playerMech?.getAttribute("data-visual-warning-report") ?? "[]")).toEqual([
      expect.objectContaining({
        code: "missing-visual-piece",
        severity: "warn",
        visualPieceId: "missing-visual-piece",
        wishcraftId: "wishcraft-missing-visual-test",
      }),
    ]);
  });

  it("exposes visual-only Arena phase and Wishcraft tint state for the Pixi battlefield", async () => {
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
      wishcraftLoadout: [wishcraftCatalog.fixtures.gravityOrbiter],
    });

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
    });
    await waitForMicrotasks(dom.window);

    const screen = dom.window.document.querySelector("[data-screen=\"arena\"]");
    expect(screen?.getAttribute("data-arena-phase")).toBe("deep-starfield");
    expect(screen?.getAttribute("data-arena-tint-theme")).toBe("gravity");
    expect(initialCombatState.enemies).toEqual([]);
  });

  it("uses one shared Arena visual state for DOM phase data and Pixi rendering", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../../src/client/arena.ts", import.meta.url)),
      "utf8",
    );
    const bootSignature = source.match(/async function bootPixiArena\([\s\S]*?\): Promise<void>/)?.[0] ?? "";
    const bootBody = source.match(/async function bootPixiArena\([\s\S]*?\n}\n\nfunction isRealBrowserCanvas/)?.[0] ?? "";

    expect(source).toContain("void bootPixiArena(options.canvas, options.screen, state, combatState, bossState, arenaVisualState)");
    expect(bootSignature).toContain("visualState: ArenaVisualState");
    expect(bootBody).not.toContain("const arenaVisualState = createArenaVisualState()");
    expect(bootBody).toContain("visualState");
  });

  it("does not advance score while a Wish Break is waiting for player input", async () => {
    vi.useFakeTimers();
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    vi.setSystemTime(0);
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
    });
    initialCombatState.activeCombatSeconds = 25;
    initialCombatState.score = 444;
    initialCombatState.feedback.push({ kind: "level-up", level: 2 });

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
      fulfillWish: async () => wishcraftCatalog.fixtures.starLance,
    });

    vi.advanceTimersByTime(3000);
    await waitForMicrotasks(dom.window);

    expect(dom.window.document.querySelector("[data-screen=\"arena\"]")?.getAttribute("data-combat-paused")).toBe(
      "true",
    );
    expect(dom.window.document.querySelector("[data-score]")?.textContent).toBe("Score 444");
  });

  it("freezes combat cooldown clocks through Wish Fulfillment and Manifestation", async () => {
    vi.useFakeTimers();
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    vi.setSystemTime(0);
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [
        {
          id: "enemy-cooldown-probe",
          templateId: "swarm-fragile",
          position: { x: 1820, y: 1000 },
          health: 6,
          radius: 11,
          nextContactAtSeconds: 0,
        },
      ],
    });
    initialCombatState.nextMachineGunAtSeconds = 1;
    initialCombatState.feedback.push({ kind: "level-up", level: 2 });
    let resolveFulfillment: ((wishcraft: typeof wishcraftCatalog.fixtures.starLance) => void) | undefined;

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
      fulfillWish: () =>
        new Promise((resolve) => {
          resolveFulfillment = resolve;
        }),
    });

    const input = dom.window.document.querySelector<HTMLInputElement>("[data-wish-input]")!;
    input.value = "给我一把星火长枪";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    dom.window.document.querySelector<HTMLButtonElement>("[data-wish-submit]")!.click();
    vi.advanceTimersByTime(10_000);
    await waitForMicrotasks(dom.window);

    resolveFulfillment?.(wishcraftCatalog.fixtures.starLance);
    await waitForMicrotasks(dom.window);
    vi.advanceTimersByTime(820);
    await waitForMicrotasks(dom.window);
    vi.advanceTimersByTime(16);
    await waitForMicrotasks(dom.window);

    expect(dom.window.document.querySelector("[data-screen=\"arena\"]")?.getAttribute("data-combat-paused")).toBe(
      "false",
    );
    expect(dom.window.document.querySelector("[data-score]")?.textContent).toBe("Score 0");
  });

  it("posts Wish Fulfillment requests to the server by default", async () => {
    vi.useFakeTimers();
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    vi.setSystemTime(0);
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ wishcraft: wishcraftCatalog.fixtures.starLance }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
    });
    initialCombatState.feedback.push({ kind: "level-up", level: 2 });

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
    });

    const input = dom.window.document.querySelector<HTMLInputElement>("[data-wish-input]")!;
    input.value = "  给我一把星火长枪  ";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    dom.window.document.querySelector<HTMLButtonElement>("[data-wish-submit]")!.click();
    await waitForMicrotasks(dom.window);

    expect(fetchMock).toHaveBeenCalledWith("/api/runs/run_test_123/wish-fulfillments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        language: "zh",
        level: 2,
        loadoutSummary: "Empty Wishcraft Loadout",
        wish: "给我一把星火长枪",
      }),
    });
  });

  it("keeps Wish Break paused for retry when fulfillment fails before the server records a Wishcraft", async () => {
    vi.useFakeTimers();
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    vi.setSystemTime(0);
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
    });
    initialCombatState.feedback.push({ kind: "level-up", level: 2 });

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
      fulfillWish: async () => {
        throw new Error("server unavailable");
      },
    });

    const input = dom.window.document.querySelector<HTMLInputElement>("[data-wish-input]")!;
    input.value = "给我一把星火长枪";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    dom.window.document.querySelector<HTMLButtonElement>("[data-wish-submit]")!.click();
    await waitForMicrotasks(dom.window);
    await waitForMicrotasks(dom.window);

    const dialog = dom.window.document.querySelector<HTMLElement>("[data-wish-break]")!;
    expect(dialog.getAttribute("data-phase")).toBe("wish-break");
    expect(dialog.hidden).toBe(false);
    expect(dialog.textContent).toContain("银河魔装机神");
    expect(dialog.textContent).not.toContain("星矛回响");
    expect(dom.window.document.querySelector("[data-screen=\"arena\"]")?.getAttribute("data-combat-paused")).toBe(
      "true",
    );
  });

  it("opens a Boss warning with name and health bar after the level 5 Wishcraft Manifestation", async () => {
    vi.useFakeTimers();
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    vi.setSystemTime(0);
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
    });
    initialCombatState.feedback.push({ kind: "level-up", level: 5 });

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
      fulfillWish: async () => wishcraftCatalog.fixtures.starLance,
    });

    const input = dom.window.document.querySelector<HTMLInputElement>("[data-wish-input]")!;
    input.value = "给我一把星火长枪";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    dom.window.document.querySelector<HTMLButtonElement>("[data-wish-submit]")!.click();
    await waitForMicrotasks(dom.window);
    await waitForMicrotasks(dom.window);
    vi.advanceTimersByTime(900);
    await waitForMicrotasks(dom.window);

    const bossWarning = dom.window.document.querySelector<HTMLElement>("[data-boss-warning]");
    expect(bossWarning?.hidden).toBe(false);
    expect(bossWarning?.getAttribute("data-phase")).toBe("warning");
    expect(dom.window.document.querySelector("[data-boss-name]")?.textContent).toContain("冰霜");
    const bossHealth = dom.window.document.querySelector<HTMLElement>("[data-boss-health]");
    expect(bossHealth).not.toBeNull();
    expect(bossHealth?.style.getPropertyValue("--boss-health")).toBe("100%");
    expect(dom.window.document.querySelector("[data-common-enemy-name]")).toBeNull();
    expect(dom.window.document.querySelector("[data-common-enemy-health]")).toBeNull();
    expect(dom.window.document.querySelector("[data-screen=\"arena\"]")?.getAttribute("data-combat-paused")).toBe(
      "true",
    );

    vi.advanceTimersByTime(1_300);
    await waitForMicrotasks(dom.window);
    vi.advanceTimersByTime(250);
    await waitForMicrotasks(dom.window);

    expect(bossWarning?.getAttribute("data-phase")).toBe("active");
    expect(bossWarning?.classList.contains("boss-active-hud")).toBe(true);
    expect(Number.parseFloat(bossHealth?.style.getPropertyValue("--boss-health") ?? "100")).toBeLessThan(100);
  });

  it("records Boss plans when warning starts and marks the same encounter defeated on victory", async () => {
    vi.useFakeTimers();
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    vi.setSystemTime(0);
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
    });
    initialCombatState.feedback.push({ kind: "level-up", level: 5 });
    const recordedPlans: Array<{ defeated: boolean; encounterId: string; plannedLevel: number }> = [];

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
      fulfillWish: async () => wishcraftCatalog.fixtures.starLance,
      recordBossPlan: async ({ defeated, encounterId, plan }) => {
        recordedPlans.push({ defeated, encounterId, plannedLevel: plan.plannedLevel });
      },
    });

    const input = dom.window.document.querySelector<HTMLInputElement>("[data-wish-input]")!;
    input.value = "给我一把星火长枪";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    dom.window.document.querySelector<HTMLButtonElement>("[data-wish-submit]")!.click();
    await waitForMicrotasks(dom.window);
    await waitForMicrotasks(dom.window);
    vi.advanceTimersByTime(900);
    await waitForMicrotasks(dom.window);

    expect(recordedPlans).toEqual([
      {
        defeated: false,
        encounterId: "run_test_123-boss-1-level-5",
        plannedLevel: 5,
      },
    ]);

    vi.advanceTimersByTime(40_000);
    await waitForMicrotasks(dom.window);

    expect(recordedPlans).toEqual([
      {
        defeated: false,
        encounterId: "run_test_123-boss-1-level-5",
        plannedLevel: 5,
      },
      {
        defeated: true,
        encounterId: "run_test_123-boss-1-level-5",
        plannedLevel: 5,
      },
    ]);
  });

  it("serializes Boss defeated recording behind the warning plan write", async () => {
    vi.useFakeTimers();
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    vi.setSystemTime(0);
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
    });
    initialCombatState.feedback.push({ kind: "level-up", level: 5 });
    const recordedPlans: Array<{ defeated: boolean; encounterId: string }> = [];
    let releaseWarningWrite: (() => void) | undefined;

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
      fulfillWish: async () => wishcraftCatalog.fixtures.starLance,
      recordBossPlan: async ({ defeated, encounterId }) => {
        if (!defeated) {
          await new Promise<void>((resolve) => {
            releaseWarningWrite = resolve;
          });
        }
        recordedPlans.push({ defeated, encounterId });
      },
    });

    const input = dom.window.document.querySelector<HTMLInputElement>("[data-wish-input]")!;
    input.value = "给我一把星火长枪";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    dom.window.document.querySelector<HTMLButtonElement>("[data-wish-submit]")!.click();
    await waitForMicrotasks(dom.window);
    await waitForMicrotasks(dom.window);
    vi.advanceTimersByTime(900);
    await waitForMicrotasks(dom.window);

    expect(releaseWarningWrite).toBeTypeOf("function");
    expect(recordedPlans).toEqual([]);

    vi.advanceTimersByTime(40_000);
    await waitForMicrotasks(dom.window);
    expect(recordedPlans).toEqual([]);

    releaseWarningWrite?.();
    await waitForMicrotasks(dom.window, 4);

    expect(recordedPlans).toEqual([
      { defeated: false, encounterId: "run_test_123-boss-1-level-5" },
      { defeated: true, encounterId: "run_test_123-boss-1-level-5" },
    ]);
  });

  it("does not send Boss defeated recording when the warning plan write fails", async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    vi.setSystemTime(0);
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
    });
    initialCombatState.feedback.push({ kind: "level-up", level: 5 });
    const recordedPlans: Array<{ defeated: boolean; encounterId: string }> = [];

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
      fulfillWish: async () => wishcraftCatalog.fixtures.starLance,
      recordBossPlan: async ({ defeated, encounterId }) => {
        if (!defeated) {
          throw new Error("warning write failed");
        }
        recordedPlans.push({ defeated, encounterId });
      },
    });

    const input = dom.window.document.querySelector<HTMLInputElement>("[data-wish-input]")!;
    input.value = "给我一把星火长枪";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    dom.window.document.querySelector<HTMLButtonElement>("[data-wish-submit]")!.click();
    await waitForMicrotasks(dom.window);
    await waitForMicrotasks(dom.window);
    vi.advanceTimersByTime(900);
    await waitForMicrotasks(dom.window, 4);

    vi.advanceTimersByTime(40_000);
    await waitForMicrotasks(dom.window, 4);

    expect(recordedPlans).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith("Boss plan record failed", expect.any(Error));
    consoleError.mockRestore();
  });

  it("queues all level-up Wish Breaks during active Boss combat until Boss victory", async () => {
    vi.useFakeTimers();
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    vi.setSystemTime(0);
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
    });
    initialCombatState.levelState = {
      level: 5,
      nextLevelXp: xpThresholdForLevel(5),
      xp: 0,
    };
    initialCombatState.player.vitals = {
      ...initialCombatState.player.vitals,
      health: 124,
      level: 5,
      maxHealth: 124,
    };
    initialCombatState.feedback.push({ kind: "level-up", level: 5 });
    const fulfilledLevels: number[] = [];

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
      fulfillWish: async ({ level }) => {
        fulfilledLevels.push(level);
        return wishcraftCatalog.fixtures.starLance;
      },
    });

    const input = dom.window.document.querySelector<HTMLInputElement>("[data-wish-input]")!;
    input.value = "给我一把星火长枪";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    dom.window.document.querySelector<HTMLButtonElement>("[data-wish-submit]")!.click();
    await waitForMicrotasks(dom.window);
    await waitForMicrotasks(dom.window);
    vi.advanceTimersByTime(2_200);
    await waitForMicrotasks(dom.window);

    expect(dom.window.document.querySelector("[data-boss-warning]")?.getAttribute("data-phase")).toBe("active");
    initialCombatState.xpShards.push({
      attracted: true,
      id: "xp-boss-active-level",
      position: { x: initialCombatState.player.position.x + 2, y: initialCombatState.player.position.y },
      value: xpThresholdForLevel(5) + xpThresholdForLevel(6),
    });
    vi.advanceTimersByTime(100);
    await waitForMicrotasks(dom.window);

    const dialog = dom.window.document.querySelector<HTMLElement>("[data-wish-break]")!;
    expect(dialog.hidden).toBe(true);
    expect(dialog.getAttribute("data-phase")).not.toBe("wish-break");

    vi.advanceTimersByTime(40_000);
    await waitForMicrotasks(dom.window);

    expect(dom.window.document.querySelector("[data-boss-warning]")?.getAttribute("data-phase")).toBe("victory");
    expect(dialog.hidden).toBe(false);
    expect(dialog.getAttribute("data-phase")).toBe("wish-break");
    input.value = "第二个愿望";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    dom.window.document.querySelector<HTMLButtonElement>("[data-wish-submit]")!.click();
    await waitForMicrotasks(dom.window);

    expect(fulfilledLevels).toEqual([5, 6]);

    await waitForMicrotasks(dom.window);
    vi.advanceTimersByTime(900);
    await waitForMicrotasks(dom.window);

    expect(dialog.hidden).toBe(false);
    expect(dialog.getAttribute("data-phase")).toBe("wish-break");
    input.value = "第三个愿望";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    dom.window.document.querySelector<HTMLButtonElement>("[data-wish-submit]")!.click();
    await waitForMicrotasks(dom.window);

    expect(fulfilledLevels).toEqual([5, 6, 7]);
  });

  it("freezes on death, submits the completed Run summary, accepts Player Name, and shows Leaderboard", async () => {
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
    });
    const completedSummaries: unknown[] = [];
    const submittedNames: string[] = [];
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [],
      wishcraftLoadout: [wishcraftCatalog.fixtures.starLance],
    });
    initialCombatState.player.vitals.health = 0;
    initialCombatState.score = 1234;
    initialCombatState.kills = 12;
    initialCombatState.bossKills = 1;

    let resolveCompletion:
      | ((summary: Awaited<ReturnType<NonNullable<Parameters<typeof mountArena>[0]["completeRun"]>>>) => void)
      | undefined;
    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
      completeRun: (summary) => {
        completedSummaries.push(summary);
        return new Promise((resolve) => {
          resolveCompletion = resolve;
        });
      },
      submitPlayerName: async ({ playerName }) => {
        submittedNames.push(playerName);
        return {
          achievedAt: "2026-06-06T00:00:00.000Z",
          bestRunId: "run_test_123",
          bossKills: 1,
          kills: 12,
          level: 1,
          playerName: "Nova Pilot",
          score: 1234,
        };
      },
      fetchLeaderboard: async () => [
        {
          achievedAt: "2026-06-06T00:00:00.000Z",
          bestRunId: "run_test_123",
          bossKills: 1,
          kills: 12,
          level: 1,
          playerName: "Nova Pilot",
          score: 1234,
        },
      ],
    });
    await waitForMicrotasks(dom.window);

    expect(completedSummaries).toEqual([
      expect.objectContaining({
        bossKills: 1,
        contentVersion: CONTENT_VERSION,
        kills: 12,
        runId: "run_test_123",
        score: 1234,
      }),
    ]);
    expect(dom.window.document.querySelector("[data-settlement]")?.getAttribute("data-phase")).toBe("summary-submitting");
    expect(dom.window.document.querySelector<HTMLInputElement>("[data-player-name-input]")?.disabled).toBe(true);
    resolveCompletion?.({
      ...(completedSummaries[0] as Parameters<NonNullable<Parameters<typeof mountArena>[0]["completeRun"]>>[0]),
      completedAt: "2026-06-06T00:00:00.000Z",
    });
    await waitForMicrotasks(dom.window);
    expect(dom.window.document.querySelector("[data-settlement]")?.getAttribute("data-phase")).toBe("name-entry");
    expect(dom.window.document.querySelector("[data-screen=\"arena\"]")?.getAttribute("data-combat-paused")).toBe(
      "true",
    );

    const input = dom.window.document.querySelector<HTMLInputElement>("[data-player-name-input]")!;
    input.value = "  Nova   Pilot ";
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    dom.window.document.querySelector<HTMLButtonElement>("[data-player-name-submit]")!.click();
    await waitForMicrotasks(dom.window);

    expect(submittedNames).toEqual(["  Nova   Pilot "]);
    expect(dom.window.document.querySelector("[data-leaderboard]")?.textContent).toContain("Nova Pilot");
    expect(dom.window.document.querySelector("[data-leaderboard]")?.textContent).toContain("1234");
    expect(dom.window.document.querySelector("[data-screen=\"arena\"]")?.getAttribute("data-combat-paused")).toBe(
      "true",
    );
  });

  it("does not advance simulation or resubmit the Run after death settlement completes", async () => {
    vi.useFakeTimers();
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
      pretendToBeVisual: true,
    });
    vi.setSystemTime(0);
    const completedSummaries: unknown[] = [];
    const initialCombatState = createCombatLoopState({
      player: { x: 1600, y: 1000 },
      enemies: [
        {
          id: "enemy-after-death",
          templateId: "swarm-fragile",
          position: { x: 1602, y: 1000 },
          health: 1,
          nextContactAtSeconds: 0,
          radius: 11,
        },
      ],
    });
    initialCombatState.activeCombatSeconds = 50;
    initialCombatState.player.vitals.health = 0;
    initialCombatState.score = 999;

    mountArena({
      root: dom.window.document.querySelector("#app")!,
      language: "zh",
      run: { runId: "run_test_123", contentVersion: CONTENT_VERSION },
      initialCombatState,
      completeRun: async (summary) => {
        completedSummaries.push(summary);
        return { ...summary, completedAt: "2026-06-06T00:00:00.000Z" };
      },
    });
    await waitForMicrotasks(dom.window);
    vi.advanceTimersByTime(5_000);
    await waitForMicrotasks(dom.window);

    expect(completedSummaries).toHaveLength(1);
    expect(dom.window.document.querySelector("[data-score]")?.textContent).toBe("Score 999");
    expect(initialCombatState.enemies.map((enemy) => enemy.id)).toContain("enemy-after-death");
    expect(dom.window.document.querySelector("[data-screen=\"arena\"]")?.getAttribute("data-combat-paused")).toBe(
      "true",
    );
  });
});

async function waitForMicrotasks(
  window: { queueMicrotask(callback: VoidFunction): void },
  count = 1,
): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await new Promise<void>((resolve) => {
      window.queueMicrotask(() => resolve());
    });
  }
}
