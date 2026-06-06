import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHomeExperience } from "../../src/client/home.js";
import { CONTENT_VERSION } from "../../src/shared/content-version.js";

describe("home-to-arena flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to Chinese, switches language only before a Run, and enters an empty Arena after server Run creation", async () => {
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
    });
    const createdRuns: string[] = [];

    createHomeExperience({
      root: dom.window.document.querySelector("#app")!,
      fetchRun: async () => {
        createdRuns.push("created");
        return { runId: "run_test_123", contentVersion: CONTENT_VERSION };
      },
    });

    expect(dom.window.document.body.textContent).toContain("无限星愿");
    expect(
      dom.window.document.querySelector("[data-language=\"zh\"]")?.getAttribute("aria-pressed"),
    ).toBe("true");

    dom.window.document.querySelector<HTMLButtonElement>("[data-language=\"en\"]")!.click();
    expect(dom.window.document.body.textContent).toContain("Infinite Starwish");
    expect(
      dom.window.document.querySelector("[data-language=\"en\"]")?.getAttribute("aria-pressed"),
    ).toBe("true");

    dom.window.document.querySelector<HTMLButtonElement>("[data-action=\"start\"]")!.click();
    await waitForHomeAction(dom.window);

    expect(createdRuns).toHaveLength(1);
    expect(dom.window.document.querySelector("[data-screen=\"arena\"]")).not.toBeNull();
    expect(dom.window.document.querySelector("[data-combat-canvas]")).not.toBeNull();
    expect(dom.window.document.querySelector("[data-dom-hud]")?.textContent).toContain(
      "Lv.001",
    );
    expect(dom.window.document.querySelector("[data-language=\"zh\"]")).toBeNull();
    expect(dom.window.document.querySelector("[data-language=\"en\"]")).toBeNull();
  });

  it("does not enter play when the server cannot create a Run", async () => {
    const dom = new JSDOM("<!doctype html><main id=\"app\"></main>", {
      url: "http://localhost:5173/",
    });

    createHomeExperience({
      root: dom.window.document.querySelector("#app")!,
      fetchRun: async () => {
        throw new Error("server unavailable");
      },
    });

    dom.window.document.querySelector<HTMLButtonElement>("[data-action=\"start\"]")!.click();
    await waitForHomeAction(dom.window);

    expect(dom.window.document.querySelector("[data-screen=\"home\"]")).not.toBeNull();
    expect(dom.window.document.querySelector("[data-screen=\"arena\"]")).toBeNull();
    expect(dom.window.document.body.textContent).toContain("服务器暂时不可用");
  });
});

function waitForHomeAction(window: { queueMicrotask(callback: VoidFunction): void }): Promise<void> {
  return new Promise((resolve) => {
    window.queueMicrotask(() => resolve());
  });
}
