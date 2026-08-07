import { appendFileSync, readFileSync } from "node:fs";
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
  // Tallies stay current even when the file write is unavailable, so key
  // selection still works within a process on a read-only filesystem.
  noteEventInTallies(event);

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

// ---------------------------------------------------------------------------
// Daily tallies — the basis for quota-aware key selection
// ---------------------------------------------------------------------------

/**
 * Gemini's free-tier RPD resets at midnight Pacific. Rather than compute a
 * UTC offset (which DST breaks twice a year), we ask Intl for the Pacific
 * calendar date of an instant and group by that string.
 */
export function pacificDay(when: Date | string): string {
  const d = typeof when === "string" ? new Date(when) : when;
  // en-CA gives YYYY-MM-DD directly.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** The instant of the next midnight Pacific, i.e. when RPD budgets reset. */
export function nextQuotaReset(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(now);

  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  // "24" appears at midnight in some ICU versions.
  const elapsed =
    (get("hour") % 24) * 3_600_000 + get("minute") * 60_000 + get("second") * 1000;

  return new Date(now.getTime() + (86_400_000 - elapsed));
}

export function describeReset(now: Date = new Date()): string {
  const at = nextQuotaReset(now);
  const mins = Math.max(0, Math.round((at.getTime() - now.getTime()) / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `midnight Pacific, in ~${h}h${String(m).padStart(2, "0")}m (${at.toISOString()})`;
}

export interface Tally {
  ok: number;
  rateLimited: number;
  errors: number;
  /** The limit Gemini reported alongside a 429, when it did. */
  reportedLimit?: string;
  quotaMetric?: string;
}

export const tallyKey = (model: string, keyIndex: number) => `${model}|${keyIndex}`;

/** Pure: fold events into per-model-per-key tallies for one Pacific day. */
export function tallyEvents(
  events: QuotaEvent[],
  day: string = pacificDay(new Date())
): Map<string, Tally> {
  const out = new Map<string, Tally>();

  for (const e of events) {
    if (pacificDay(e.ts) !== day) continue;

    const k = tallyKey(e.model, e.keyIndex);
    const t = out.get(k) ?? { ok: 0, rateLimited: 0, errors: 0 };

    if (e.outcome === "success") t.ok++;
    else if (e.outcome === "rate_limited") {
      t.rateLimited++;
      t.reportedLimit ??= e.quotaLimit;
      t.quotaMetric ??= e.quotaMetric;
    } else t.errors++;

    out.set(k, t);
  }

  return out;
}

export function readEvents(): QuotaEvent[] {
  try {
    return readFileSync(LOG_PATH, "utf8")
      .split("\n")
      .filter((l) => l.trim().length > 0)
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as QuotaEvent];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

/**
 * Today's tallies, read once per process and then kept current by
 * recordQuotaEvent. On Vercel the log file does not exist, so this is an
 * empty map and key selection falls back to plain round-robin.
 */
let cache: { day: string; tallies: Map<string, Tally> } | null = null;

export function todayTallies(): Map<string, Tally> {
  const day = pacificDay(new Date());
  if (cache?.day !== day) {
    cache = { day, tallies: tallyEvents(readEvents(), day) };
  }
  return cache.tallies;
}

/** Keeps the in-process tallies current without re-reading the file. */
export function noteEventInTallies(event: QuotaEvent): void {
  const day = pacificDay(new Date());
  if (cache?.day !== day) {
    cache = { day, tallies: tallyEvents(readEvents(), day) };
  }

  const k = tallyKey(event.model, event.keyIndex);
  const t = cache.tallies.get(k) ?? { ok: 0, rateLimited: 0, errors: 0 };
  if (event.outcome === "success") t.ok++;
  else if (event.outcome === "rate_limited") {
    t.rateLimited++;
    t.reportedLimit ??= event.quotaLimit;
    t.quotaMetric ??= event.quotaMetric;
  } else t.errors++;
  cache.tallies.set(k, t);
}
