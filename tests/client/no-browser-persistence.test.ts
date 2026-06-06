import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const forbiddenPersistenceApis = [
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "navigator.storage",
  "document.cookie",
];

describe("browser persistence contract", () => {
  it("keeps client source free of browser persistence APIs", async () => {
    const clientFiles = [
      "home.ts",
      "main.ts",
      "arena.ts",
    ];

    const source = (
      await Promise.all(
        clientFiles.map(async (file) => {
          try {
            return await readFile(join(process.cwd(), "src/client", file), "utf8");
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
              return "";
            }
            throw error;
          }
        }),
      )
    ).join("\n");

    for (const api of forbiddenPersistenceApis) {
      expect(source).not.toContain(api);
    }
  });
});
