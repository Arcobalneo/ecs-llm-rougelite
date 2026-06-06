# Require Live LLM Tests for Wish Interpreter Changes

Default tests should stay deterministic and offline, but changes to the wish interpreter, prompts, provider integration, theme tags, pieces, budgets, or wishcraft contract require a live DeepSeek V4 Flash test command. The wish interpreter's core value depends on real model behavior, so schema validity, repair behavior, fallback rate, and wish fidelity must be checked against the actual provider rather than only mocked locally.
