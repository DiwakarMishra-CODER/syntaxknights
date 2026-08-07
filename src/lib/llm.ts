import { GoogleGenAI } from "@google/genai";

import { parseQuotaError, recordQuotaEvent } from "./quota-log";

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

export type Role =
  | "planner"
  | "turn"
  | "interviewer"
  | "evaluator"
  | "reporter";

export type ThinkingLevel = "minimal" | "low" | "medium" | "high";

interface RoleConfig {
  model: string;
  thinkingLevel: ThinkingLevel;
  maxOutputTokens: number;
}

/**
 * Role -> model mapping. Change models here and nowhere else.
 *
 * ROUTING HYPOTHESIS (pending real data — see .quota-log.json):
 * gemini-3.6-flash measured a hard 20 requests/day on the free tier,
 * which we believe is because it is brand new (July 2026). GA models
 * like flash-lite are typically hundreds-to-1000 RPD; a partial probe
 * reached 17 consecutive flash-lite calls with no 429 on a key that had
 * already served many that day.
 *
 * So the high-volume role goes on the generous model and the scarce new
 * model is reserved for the two once-per-interview calls where quality
 * matters most. Telemetry below will confirm or refute this from normal
 * use rather than by spending quota to probe.
 */
export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  // ~10 calls per interview — must sit on the highest-RPD model.
  turn: {
    model: "gemini-3.5-flash-lite",
    thinkingLevel: "medium",
    maxOutputTokens: 2048,
  },
  // 1 call per interview.
  planner: {
    model: "gemini-3.6-flash",
    thinkingLevel: "high",
    maxOutputTokens: 4096,
  },
  // 1 call per interview.
  reporter: {
    model: "gemini-3.6-flash",
    thinkingLevel: "high",
    maxOutputTokens: 4096,
  },
  // Kept so the merged turn can be un-merged; both on flash-lite so an
  // A/B against `turn` varies only the merge, not the model.
  interviewer: {
    model: "gemini-3.5-flash-lite",
    thinkingLevel: "medium",
    maxOutputTokens: 2048,
  },
  evaluator: {
    model: "gemini-3.5-flash-lite",
    thinkingLevel: "minimal",
    maxOutputTokens: 1024,
  },
};

const MAX_ROUNDS = 3;
const BACKOFF_MS = [1000, 2000, 4000];
/** Safe for a serverless handler. Offline scripts pass a much larger value. */
const DEFAULT_MAX_WAIT_MS = 8000;

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
  return (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("too_many_requests")
  );
}

/**
 * Gemini's 429 body states exactly how long to wait
 * ("Please retry in 58.730922968s"). Honour it rather than guessing.
 *
 * Note the stated delay is not always sufficient: when a DAILY budget is
 * spent, waiting it out still returns 429. Treat it as a lower bound.
 */
function retryAfterMs(err: unknown): number | null {
  const msg = String((err as { message?: string })?.message ?? err ?? "");
  const m = msg.match(/retry in ([\d.]+)s/i);
  if (!m) return null;
  const seconds = Number(m[1]);
  if (!Number.isFinite(seconds)) return null;
  return Math.ceil(seconds * 1000) + 500; // small cushion past the boundary
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
  /** Overrides the role's configured thinking level for this call only. */
  thinking?: ThinkingLevel;
  /**
   * Overrides the role's configured model for this call only. Free-tier
   * quota is per model, so this is the escape hatch when one model's
   * budget is exhausted and the alternative is no answer at all.
   */
  model?: string;
  /** Observability hook — fires on the successful attempt only. */
  onUsage?: (u: CallUsage) => void;
  /**
   * Ceiling on any single rate-limit wait. The free tier resets per minute
   * and the API asks for ~59s, but a serverless handler cannot block that
   * long — so request paths keep the default and fail fast, while offline
   * scripts raise it and simply wait the window out.
   */
  maxWaitMs?: number;
}

export interface CallUsage {
  model: string;
  thinkingLevel: ThinkingLevel;
  keyIndex: number;
  latencyMs: number;
  input: number;
  output: number;
  thought: number;
  cached: number;
  total: number;
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
  const { role, system, input, schema, thinking, onUsage } = opts;
  const maxWait = opts.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;
  const base = ROLE_CONFIG[role];
  if (!base) throw new LLMError("config", `Unknown role "${role}"`, role);

  const cfg: RoleConfig =
    thinking || opts.model
      ? {
          ...base,
          thinkingLevel: thinking ?? base.thinkingLevel,
          model: opts.model ?? base.model,
        }
      : base;

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
        const usage = toUsage(cfg, keyIndex, latency, interaction.usage);
        logCall(role, usage);
        onUsage?.(usage);
        recordQuotaEvent({
          ts: new Date().toISOString(),
          outcome: "success",
          role,
          model: cfg.model,
          keyIndex,
          latencyMs: latency,
          totalTokens: usage.total,
        });

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
          recordQuotaEvent({
            ts: new Date().toISOString(),
            outcome: "rate_limited",
            role,
            model: cfg.model,
            keyIndex,
            ...parseQuotaError(err),
          });
          console.warn(
            `[llm] ${role} key#${keyIndex} rate limited (429), rotating`
          );
          continue;
        }

        recordQuotaEvent({
          ts: new Date().toISOString(),
          outcome: "error",
          role,
          model: cfg.model,
          keyIndex,
          ...parseQuotaError(err),
        });
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
      const asked = retryAfterMs(lastError);
      const wait = Math.min(asked ?? BACKOFF_MS[round] ?? 4000, maxWait);

      if (asked !== null && asked > maxWait) {
        console.warn(
          `[llm] ${role}: API asked for ${Math.round(asked / 1000)}s but the ` +
            `${Math.round(maxWait / 1000)}s ceiling is lower — giving up rather than blocking`
        );
        break;
      }

      console.warn(
        `[llm] ${role}: all ${total} key(s) rate limited, waiting ${wait}ms ` +
          `(${asked !== null ? "API-specified" : "exponential"}, round ${round + 1}/${MAX_ROUNDS})`
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

function toUsage(
  cfg: RoleConfig,
  keyIndex: number,
  latencyMs: number,
  usage: Usage | undefined
): CallUsage {
  const input = usage?.total_input_tokens ?? 0;
  const output = usage?.total_output_tokens ?? 0;
  return {
    model: cfg.model,
    thinkingLevel: cfg.thinkingLevel,
    keyIndex,
    latencyMs,
    input,
    output,
    thought: usage?.total_thought_tokens ?? 0,
    cached: usage?.total_cached_tokens ?? 0,
    total: usage?.total_tokens ?? input + output,
  };
}

function logCall(role: Role, u: CallUsage) {
  console.log(
    `[llm] ${role} model=${u.model} thinking=${u.thinkingLevel} ` +
      `key#${u.keyIndex} ${u.latencyMs}ms ` +
      `in=${u.input} out=${u.output} thought=${u.thought} cached=${u.cached} ` +
      `total=${u.total}`
  );
}
