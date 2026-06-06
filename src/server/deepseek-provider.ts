import OpenAI from "openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import type { WishProvider, WishProviderInput, WishProviderResult } from "./wish-interpreter.js";

export interface DeepSeekProviderEnv {
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string;
  DEEPSEEK_OPENAI_BASE_URL?: string;
  DEEPSEEK_THINKING_TYPE?: string;
}

type DeepSeekRequest = Omit<ChatCompletionCreateParamsNonStreaming, "reasoning_effort"> & {
  extra_body?: {
    thinking: {
      type: "enabled" | "disabled";
    };
  };
  thinking?: {
    type: "enabled" | "disabled";
  };
};

export function createDeepSeekWishProviderFromEnv(env: DeepSeekProviderEnv): WishProvider {
  const apiKey = readRequired(env, "DEEPSEEK_API_KEY");
  const baseURL = readRequired(env, "DEEPSEEK_OPENAI_BASE_URL").replace(/\/+$/, "");
  const model = readRequired(env, "DEEPSEEK_MODEL");
  const thinkingType = readThinkingType(env.DEEPSEEK_THINKING_TYPE);
  const client = new OpenAI({ apiKey, baseURL });

  return {
    config: {
      baseURL,
      model,
      provider: "deepseek",
      responseFormat: "json_object",
      thinkingType,
    },
    async generate(input: WishProviderInput): Promise<WishProviderResult> {
      const request: DeepSeekRequest = {
        model,
        max_tokens: 2500,
        temperature: input.attempt === 1 ? 0.22 : 0.05,
        extra_body: { thinking: { type: thinkingType } },
        thinking: { type: thinkingType },
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "You are the Wish Interpreter for Infinite Starwish.",
              "Return one valid JSON object only. No markdown, no prose, no empty content.",
              "Choose from the supplied catalogSummary only; do not invent IDs, fields, parameter names, or gameplay rules.",
              "Output exactly one Wishcraft object with fields: id, sourceWish, name, primaryThemeId, primaryMechanicId, mechanicPieceIds, visualPieceIds, parameters.",
              "name must contain both cn and en.",
              "Use concise names: cn <= 12 chars, en <= 28 chars.",
              "primaryMechanicId must appear in mechanicPieceIds.",
              "parameters may contain only keys listed under the chosen mechanic pieces.",
              "Prefer visual fidelity to the Wish: theme and visualPieceIds should make the result look like the Wish.",
              "Forbidden: healing, DOT, enemy statuses, mines, traps, turrets, movement changes, max-health changes, crit, dodge, active buttons, targeting changes, executable code.",
              "If the Wish asks to become weak, self-harm, use traps, mines, turrets, or other forbidden outcomes, reinterpret it as a positive automatic direct-damage, shield, or summon reward.",
              "Wishcraft names are cosmetic but must not promise weakness, traps, mines, turrets, healing, DOT, status effects, or other forbidden mechanics.",
              "If this is a repair attempt, output a corrected complete Wishcraft object, not an explanation.",
            ].join(" "),
          },
          {
            role: "user",
            content: createPromptPayload(input),
          },
        ],
      };
      const completion = await client.chat.completions.create(
        request as ChatCompletionCreateParamsNonStreaming,
      );

      return {
        finishReason: completion.choices[0]?.finish_reason ?? undefined,
        rawText: completion.choices[0]?.message.content ?? "",
        usage: {
          completionTokens: completion.usage?.completion_tokens,
          promptTokens: completion.usage?.prompt_tokens,
          reasoningTokens: completion.usage?.completion_tokens_details?.reasoning_tokens,
          totalTokens: completion.usage?.total_tokens,
        },
      };
    },
  };
}

function createPromptPayload(input: WishProviderInput): string {
  return JSON.stringify({
    task:
      input.attempt === 1
        ? "Interpret the Wish into one legal Wishcraft JSON object."
        : "Repair the previous invalid output into one legal Wishcraft JSON object.",
    attempt: input.attempt,
    catalogSummary: JSON.parse(input.catalogSummary) as unknown,
    hardRequirements: [
      "Return JSON object only.",
      "Use exact IDs from catalogSummary.",
      "Use only parameter keys listed on selected mechanic pieces.",
      "Keep one primary fantasy even for multi-intent wishes.",
      "The result should be legal and visually match the player's wish.",
      "Keep reward parameters positive; do not lower damageScale below 1.",
      "For forbidden or self-weakening wishes, transform the fantasy into a positive safe reward and avoid forbidden words in name.cn/name.en.",
    ],
    language: input.language,
    level: input.level,
    loadoutSummary: input.loadoutSummary,
    previousErrors: input.previousErrors,
    previousInvalidOutput: input.repairOf,
    wish: input.wish,
  });
}

function readRequired(env: DeepSeekProviderEnv, key: keyof DeepSeekProviderEnv): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function readThinkingType(value: string | undefined): "enabled" | "disabled" {
  if (!value) {
    return "disabled";
  }
  if (value !== "enabled" && value !== "disabled") {
    throw new Error("DEEPSEEK_THINKING_TYPE must be enabled or disabled");
  }
  return value;
}
