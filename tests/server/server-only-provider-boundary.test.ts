import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("server-only Wish Interpreter provider boundary", () => {
  it("does not expose DeepSeek configuration names in browser or shared source", async () => {
    const clientFiles = [
      ...(await listFiles("src/client")),
      ...(await listFiles("src/shared")),
      ...(await listFiles("dist").catch(() => [])),
    ];
    const source = (
      await Promise.all(clientFiles.map((path) => readFile(path, "utf8")))
    ).join("\n");

    expect(source).not.toContain("DEEPSEEK_API_KEY");
    expect(source).not.toContain("DEEPSEEK_OPENAI_BASE_URL");
    expect(source).not.toContain("deepseek-provider");
  });
});

async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = `${root}/${entry.name}`;
      if (entry.isDirectory()) {
        return listFiles(path);
      }
      return [path];
    }),
  );
  return files.flat();
}
