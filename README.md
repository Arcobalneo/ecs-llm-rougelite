# ecs-llm-rougelite

A TypeScript browser game prototype for a space pixel-art survivor-like roguelite with LLM-assisted gameplay content.

Coding agents must not maintain this README as project memory.

## Local Development

This project currently requires Node.js `>=25` because the server uses the
built-in `node:sqlite` module for SQLite persistence.

Run the server API and browser client together:

```sh
npm run dev
```

The API defaults to `http://127.0.0.1:8787` and stores SQLite data at
`.data/infinite-starwish.sqlite`. The Vite client proxies `/api` requests to the
server. Start Game requires the server-created Run response; there is no
offline Run fallback.

Useful scripts:

```sh
npm run dev:server
npm run dev:client
npm test -- --run
npm run typecheck
npm run build
```
