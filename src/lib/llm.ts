import { GoogleGenAI } from "@google/genai";

/**
 * The single place any model is ever called.
 *
 * Gemini 3.x notes, verified against @google/genai 2.16.0 type definitions:
 *  - The surface is ai.interactions.create(), and its params are snake_case.
 *  - thinking_level lives inside generation_config; it replaced thinking_budget.
 *  - temperature / top_p / top_k no longer exist on GenerationConfig at all.
 *  - Schema-enforced JSON goes in response_format, not the deprecated
 *    responseSchema / responseMimeType fields.
 */

export type Role = "planner" | "interviewer" | "evaluator" | "reporter";

type ThinkingLevel = "minimal" | "low" | "medium" | "high";

interface RoleConfig {
  model: string;
  thinkingLevel: ThinkingLevel;
  maxOutputTokens: number;
}

/** Role -> model mapping. Change models here and nowhere else. */
export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  planner: {
    model: "gemini-3.6-flash",
    thinkingLevel: "high",
    maxOutputTokens: 4096,
  },
  interviewer: {
    model: "gemini-3.6-flash",
    thinkingLevel: "medium",
    maxOutputTokens: 2048,
  },
  evaluator: {
    model: "gemini-3.5-flash-lite",
    thinkingLevel: "minimal",
    maxOutputTokens: 1024,
  },
  reporter: {
    model: "gemini-3.6-flash",
    thinkingLevel: "high",
    maxOutputTokens: 4096,
  },
};

const MAX_ROUNDS = 3;
const BACKOFF_MS = [1000, 2000, 4000];

export type LLMErrorKind =
  | "config"
  | "rate_limited"
  | "malformed_output"
  | "api_error";

export class LLMError extends Error {
  readonly kind: LLMErrorKind;
  readonly role: Role | null;
  readonly cause?: unknown;

  constructor(
    kind: LLMErrorKind,
    message: string,
    role: Role | null = null,
    cause?: unknown
  ) {
    super(message);
    this.name = "LLMError";
    this.kind = kind;
    this.role = role;
    this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// Key pool
// ---------------------------------------------------------------------------

let keys: string[] | null = null;
/** Round-robin cursor. Not session state — a cold start just restarts at 0. */
let cursor = 0;

function apiKeys(): string[] {
  if (keys) return keys;

  const parsed = (process.env.GEMINI_API_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (parsed.length === 0) {
    throw new LLMError(
      "config",
      "GEMINI_API_KEYS is empty. Set a comma-separated list in .env.local."
    );
  }

  keys = parsed;
  return keys;
}

/** One key or six — same code path either way. */
export function keyCount(): number {
  return apiKeys().length;
}

const clients = new Map<number, GoogleGenAI>();

function clientFor(index: number): GoogleGenAI {
  const existing = clients.get(index);
  if (existing) return existing;

  const created = new GoogleGenAI({ apiKey: apiKeys()[index] });
  clients.set(index, created);
  return created;
}

function isRateLimited(err: unknown): boolean {
  const e = err as { status?: number; code?: number; message?: string };
  if (e?.status === 429 || e?.code === 429) return true;
  const msg = String(e?.message ?? err ?? "");
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// callLLM
// ---------------------------------------------------------------------------

export interface CallOptions {
  role: Role;
  /** Keep byte-identical across turns so the prefix can be cached. */
  system: string;
  input: string;
  /** JSON Schema. When present the response is schema-enforced JSON. */
  schema?: Record<string, unknown>;
}

export async function callLLM<T = unknown>(
  opts: CallOptions & { schema: Record<string, unknown> }
): Promise<T>;
export async function callLLM(
  opts: CallOptions & { schema?: undefined }
): Promise<string>;
export async function callLLM<T = unknown>(
  opts: CallOptions
): Promise<T | string> {
  const { role, system, input, schema } = opts;
  const cfg = ROLE_CONFIG[role];
  if (!cfg) throw new LLMError("config", `Unknown role "${role}"`, role);

  const total = apiKeys().length;
  let lastError: unknown = null;
  let softRetried = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    let rateLimitedThisRound = 0;

    for (let attempt = 0; attempt < total; attempt++) {
      const keyIndex = cursor % total;
      cursor = (cursor + 1) % total;

      const started = Date.now();
      try {
        const interaction = await clientFor(keyIndex).interactions.create({
          model: cfg.model,
          input,
          system_instruction: system,
          generation_config: {
            thinking_level: cfg.thinkingLevel,
            max_output_tokens: cfg.maxOutputTokens,
          },
          ...(schema
            ? {
                response_format: {
                  type: "text" as const,
                  mime_type: "application/json",
                  schema,
                },
              }
            : {}),
        });

        const latency = Date.now() - started;
        const text = interaction.output_text ?? "";
        logCall(role, cfg, keyIndex, latency, interaction.usage);

        if (!schema) return text;

        try {
          return JSON.parse(text) as T;
        } catch (parseErr) {
          if (softRetried) {
            throw new LLMError(
              "malformed_output",
              `${role}: model returned non-JSON despite schema enforcement`,
              role,
              parseErr
            );
          }
          softRetried = true;
          continue;
        }
      } catch (err) {
        lastError = err;

        if (err instanceof LLMError) throw err;

        if (isRateLimited(err)) {
          rateLimitedThisRound++;
          console.warn(
            `[llm] ${role} key#${keyIndex} rate limited (429), rotating`
          );
          continue;
        }

        console.error(`[llm] ${role} key#${keyIndex} error:`, err);
        if (softRetried) {
          throw new LLMError(
            "api_error",
            `${role}: ${(err as Error)?.message ?? "unknown error"}`,
            role,
            err
          );
        }
        softRetried = true;
        continue;
      }
    }

    // Every key in the pool was rate limited — back off and try again.
    if (rateLimitedThisRound > 0 && round < MAX_ROUNDS - 1) {
      const wait = BACKOFF_MS[round] ?? 4000;
      console.warn(
        `[llm] ${role}: all ${total} key(s) rate limited, backing off ${wait}ms (round ${round + 1}/${MAX_ROUNDS})`
      );
      await sleep(wait);
    }
  }

  if (isRateLimited(lastError)) {
    throw new LLMError(
      "rate_limited",
      `${role}: all ${total} key(s) rate limited after ${MAX_ROUNDS} rounds`,
      role,
      lastError
    );
  }

  throw new LLMError(
    "api_error",
    `${role}: exhausted retries — ${(lastError as Error)?.message ?? "unknown error"}`,
    role,
    lastError
  );
}

interface Usage {
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_thought_tokens?: number;
  total_tokens?: number;
  total_cached_tokens?: number;
}

function logCall(
  role: Role,
  cfg: RoleConfig,
  keyIndex: number,
  latencyMs: number,
  usage: Usage | undefined
) {
  const inTok = usage?.total_input_tokens ?? 0;
  const outTok = usage?.total_output_tokens ?? 0;
  const thoughtTok = usage?.total_thought_tokens ?? 0;
  const cached = usage?.total_cached_tokens ?? 0;

  console.log(
    `[llm] ${role} model=${cfg.model} thinking=${cfg.thinkingLevel} ` +
      `key#${keyIndex} ${latencyMs}ms ` +
      `in=${inTok} out=${outTok} thought=${thoughtTok} cached=${cached} ` +
      `total=${usage?.total_tokens ?? inTok + outTok}`
  );
}
