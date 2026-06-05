import 'dotenv/config';

import { Ajv, type ErrorObject, type JSONSchemaType } from 'ajv';
import OpenAI from 'openai';
import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';
import { performance } from 'node:perf_hooks';

// DeepSeek's currently usable structured-output path is JSON Output:
//   response_format: { type: 'json_object' }
//
// This is not the same as OpenAI Structured Outputs:
//   response_format: { type: 'json_schema', json_schema: ... }
//
// At the time this script was written, the DeepSeek OpenAI-compatible endpoint
// rejected json_schema with: "This response_format type is unavailable now".
// Treat AJV validation below as the hard schema boundary for this project.

type ThinkingType = 'enabled' | 'disabled';
type ReasoningEffort = 'high' | 'max';

type LootDrop = {
  id: string;
  rarity: 'common' | 'rare' | 'epic';
  score: number;
  tags: Array<'plasma' | 'shield' | 'drone' | 'engine'>;
  spawn: {
    wave: number;
    weight: number;
  };
};

type RunResult = {
  run: number;
  status: 'pass' | 'fail';
  latencyMs: number;
  finishReason: string | null;
  parseOk: boolean;
  schemaValid: boolean;
  errors: string[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    reasoningTokens?: number;
  };
  sample: string;
};

type DeepSeekChatRequest = Omit<ChatCompletionCreateParamsNonStreaming, 'reasoning_effort'> & {
  thinking?: {
    type: ThinkingType;
  };
  reasoning_effort?: ReasoningEffort;
};

const env = {
  baseURL: readRequiredEnv('DEEPSEEK_OPENAI_BASE_URL').replace(/\/+$/, ''),
  apiKey: readRequiredEnv('DEEPSEEK_API_KEY'),
  model: readRequiredEnv('DEEPSEEK_MODEL'),
  thinkingType: readEnumEnv<ThinkingType>('DEEPSEEK_THINKING_TYPE', ['enabled', 'disabled'], 'enabled'),
  reasoningEffort: readEnumEnv<ReasoningEffort>('DEEPSEEK_REASONING_EFFORT', ['high', 'max'], 'high'),
};

const runs = readPositiveIntegerEnv('DEEPSEEK_TEST_RUNS', 8);

const lootDropSchema: JSONSchemaType<LootDrop> = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'rarity', 'score', 'tags', 'spawn'],
  properties: {
    id: {
      type: 'string',
      pattern: '^loot-[0-9]{2}$',
    },
    rarity: {
      type: 'string',
      enum: ['common', 'rare', 'epic'],
    },
    score: {
      type: 'integer',
      minimum: 10,
      maximum: 99,
    },
    tags: {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: {
        type: 'string',
        enum: ['plasma', 'shield', 'drone', 'engine'],
      },
    },
    spawn: {
      type: 'object',
      additionalProperties: false,
      required: ['wave', 'weight'],
      properties: {
        wave: {
          type: 'integer',
          minimum: 1,
          maximum: 3,
        },
        weight: {
          type: 'number',
          minimum: 0.1,
          maximum: 1,
        },
      },
    },
  },
};

const ajv = new Ajv({ allErrors: true, strict: true });
const validateLootDrop = ajv.compile(lootDropSchema);

const client = new OpenAI({
  apiKey: env.apiKey,
  baseURL: env.baseURL,
});

const results: RunResult[] = [];

for (let run = 1; run <= runs; run += 1) {
  results.push(await testJsonObjectSchemaPrompt(run));
}

const passed = results.filter((result) => result.status === 'pass').length;
const latencies = [...results].map((result) => result.latencyMs).sort((a, b) => a - b);

const summary = {
  config: {
    baseURL: env.baseURL,
    model: env.model,
    apiKey: '<redacted>',
    thinkingType: env.thinkingType,
    reasoningEffort: env.reasoningEffort,
    runs,
  },
  supportedOutputMode: 'response_format={ type: "json_object" }',
  unsupportedOutputMode: 'response_format={ type: "json_schema", json_schema: ... }',
  schemaMode: 'DeepSeek JSON Output plus local AJV JSON Schema validation',
  passRate: `${passed}/${runs}`,
  latencyMs: {
    min: latencies[0],
    p50: percentile(latencies, 0.5),
    avg: Math.round(results.reduce((sum, result) => sum + result.latencyMs, 0) / results.length),
    p95: percentile(latencies, 0.95),
    max: latencies[latencies.length - 1],
  },
  reasoningTokens: results.map((result) => result.usage?.reasoningTokens ?? null),
  results,
};

console.log(JSON.stringify(summary, null, 2));

if (passed !== runs) {
  process.exitCode = 1;
}

async function testJsonObjectSchemaPrompt(run: number): Promise<RunResult> {
  const request: DeepSeekChatRequest = {
    model: env.model,
    temperature: 0,
    max_tokens: 700,
    thinking: {
      type: env.thinkingType,
    },
    reasoning_effort: env.reasoningEffort,
    response_format: {
      type: 'json_object',
    },
    messages: [
      {
        role: 'system',
        content: 'Return JSON only. No markdown, no comments, no prose.',
      },
      {
        role: 'user',
        content: [
          'Generate one roguelite loot drop object.',
          'It must satisfy this JSON Schema exactly, including required fields, no extra fields, enums, ranges, and pattern constraints.',
          `Schema: ${JSON.stringify(lootDropSchema)}`,
        ].join(' '),
      },
    ],
  };

  const started = performance.now();
  const completion = await client.chat.completions.create(request as ChatCompletionCreateParamsNonStreaming);
  const latencyMs = Math.round(performance.now() - started);
  const choice = completion.choices[0];
  const content = choice?.message.content ?? '';
  const parsed = parseJson(content);
  const schemaValid = parsed.ok ? validateLootDrop(parsed.value) : false;
  const errors = parsed.ok ? formatAjvErrors(validateLootDrop.errors) : [parsed.error];

  return {
    run,
    status: parsed.ok && schemaValid ? 'pass' : 'fail',
    latencyMs,
    finishReason: choice?.finish_reason ?? null,
    parseOk: parsed.ok,
    schemaValid,
    errors,
    usage: {
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens,
      reasoningTokens: completion.usage?.completion_tokens_details?.reasoning_tokens,
    },
    sample: content.slice(0, 260),
  };
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readEnumEnv<T extends string>(name: string, values: readonly T[], fallback: T): T {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  if (!values.includes(value as T)) {
    throw new Error(`${name} must be one of: ${values.join(', ')}`);
  }
  return value as T;
}

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function parseJson(value: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return {
      ok: true,
      value: JSON.parse(value),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) {
    return [];
  }
  return errors.map((error) => `${error.instancePath || '/'} ${error.message ?? 'failed validation'}`);
}

function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  const index = Math.ceil((sortedValues.length - 1) * percentileValue);
  return sortedValues[index];
}
