import { appendFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Passive quota telemetry. Every success and every 429 is appended so we
 * learn the real per-model ceilings from normal use instead of spending
 * quota to probe them.
 *
 * Fire-and-forget by design: this must never throw, never block, and never
 * change the outcome of a call. On Vercel the filesystem is read-only
 * outside /tmp, so writes simply no-op there — the log is a local
 * development instrument, not production state.
 *
 * The file is JSON Lines (one JSON object per line) despite the .json
 * name, so appending is O(1) rather than read-modify-write.
 */

const LOG_PATH = join(process.cwd(), ".quota-log.json");

export interface QuotaEvent {
  ts: string;
  outcome: "success" | "rate_limited" | "error";
  role: string;
  model: string;
  keyIndex: number;
  latencyMs?: number;
  totalTokens?: number;
  /** 429 only — the exact metric name Gemini reports. */
  quotaMetric?: string;
  /** 429 only — the limit Gemini reports alongside the metric. */
  quotaLimit?: string;
  /** 429 only — seconds Gemini asks us to wait. */
  retryAfterSec?: string;
  status?: string;
}

let disabled = false;

export function recordQuotaEvent(event: QuotaEvent): void {
  if (disabled) return;
  try {
    appendFileSync(LOG_PATH, `${JSON.stringify(event)}\n`, "utf8");
  } catch {
    // Read-only filesystem (Vercel) or any other write failure: stop
    // trying, stay silent. Telemetry must never break a request.
    disabled = true;
  }
}

/** Pulls the quota facts out of a Gemini 429 body. */
export function parseQuotaError(err: unknown): {
  quotaMetric?: string;
  quotaLimit?: string;
  retryAfterSec?: string;
  status?: string;
} {
  const e = err as { status?: number; message?: string };
  const msg = String(e?.message ?? err ?? "");
  return {
    quotaMetric: msg.match(/metric:\s*([\w./-]+)/)?.[1],
    quotaLimit: msg.match(/limit:\s*(\d+)/)?.[1],
    retryAfterSec: msg.match(/retry in ([\d.]+)s/i)?.[1],
    status: e?.status !== undefined ? String(e.status) : undefined,
  };
}

export { LOG_PATH as QUOTA_LOG_PATH };
