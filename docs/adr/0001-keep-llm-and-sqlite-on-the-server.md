# Keep LLM and SQLite on the Server

The browser client runs the game experience, but LLM interpretation and SQLite persistence belong behind a server boundary. This keeps LLM API keys out of the browser, gives leaderboard updates a trusted write path, and centralizes wish interpretation traces for tuning instead of scattering persistence across clients.
