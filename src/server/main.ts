import { join } from "node:path";
import { config } from "dotenv";
import { createDeepSeekWishProviderFromEnv } from "./deepseek-provider.js";
import { createServer } from "./http.js";
import { createRunStore } from "./run-store.js";

config();

const port = Number.parseInt(process.env.PORT ?? "8787", 10);
const host = process.env.HOST ?? "127.0.0.1";
const databasePath =
  process.env.SQLITE_DATABASE_PATH ?? join(process.cwd(), ".data", "infinite-starwish.sqlite");

const runStore = createRunStore({ databasePath });
const wishProvider = createDeepSeekWishProviderFromEnv(process.env);
const server = createServer({ runStore, wishProvider });
const listener = await server.listen({ port, host });

console.log(`Infinite Starwish API listening on ${listener.origin}`);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    await listener.close();
    runStore.close();
    process.exit(0);
  });
}
