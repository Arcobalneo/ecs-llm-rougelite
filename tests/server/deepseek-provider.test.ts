import { describe, expect, it } from "vitest";
import { createDeepSeekWishProviderFromEnv } from "../../src/server/deepseek-provider.js";

describe("DeepSeek Wish Provider boundary", () => {
  it("builds a server-only OpenAI-compatible JSON object provider without exposing the API key in config", () => {
    const provider = createDeepSeekWishProviderFromEnv({
      DEEPSEEK_API_KEY: "secret-test-key",
      DEEPSEEK_MODEL: "deepseek-v4-flash",
      DEEPSEEK_OPENAI_BASE_URL: "https://api.deepseek.com",
      DEEPSEEK_THINKING_TYPE: "disabled",
    });

    expect(provider.config).toEqual({
      baseURL: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      provider: "deepseek",
      responseFormat: "json_object",
      thinkingType: "disabled",
    });
    expect(JSON.stringify(provider.config)).not.toContain("secret-test-key");
  });
});
