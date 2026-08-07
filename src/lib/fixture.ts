import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { TurnResult } from "./prompts/turn";
import type { Blueprint, Feedback } from "./types";

/**
 * Server-side replay. With FIXTURE=1 the route serves a recorded session
 * instead of calling Gemini — same route, same contract, same response
 * shape, recorded latency simulated.
 *
 * Everything except the model call still runs for real: the orchestrator,
 * the state machine, Supabase persistence and the response builder. Only
 * the three model calls are substituted, so the UI exercises the genuine
 * endpoint and switching to live is one environment variable.
 */

export function fixtureEnabled(): boolean {
  return process.env.FIXTURE === "1";
}

/** Scales simulated latency. 1 = realistic, 0.05 for fast UI iteration. */
function speed(): number {
  const n = Number(process.env.FIXTURE_SPEED ?? "1");
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Measured medians from the live runs in .quota-log.json. The recording
 * itself does not carry per-call latency, so these stand in — the point is
 * that the UI's thinking state lasts as long in replay as in production.
 */
const LATENCY_MS = { plan: 17_000, turn: 7_000, report: 20_000 };

export const fixtureLatency = (k: keyof typeof LATENCY_MS) =>
  Math.round(LATENCY_MS[k] * speed());

export const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Recording {
  candidateId: string;
  turns: Array<{ answer: string; decision: TurnResult }>;
  feedback: Feedback | null;
}

let cached: Recording | null = null;

function recording(): Recording {
  if (cached) return cached;
  const path =
    process.env.FIXTURE_SESSION ?? join(process.cwd(), "fixtures", "session-CAND-017.json");
  cached = JSON.parse(readFileSync(path, "utf8")) as Recording;
  return cached;
}

/**
 * The blueprint that PAIRS WITH the recording, not the latest plan for
 * that candidate. Serving a newer blueprint alongside an older recording
 * makes the panel show coverage for days the recording never visits.
 */
export function fixtureBlueprint(candidateId: string): Blueprint {
  const path =
    process.env.FIXTURE_BLUEPRINT ??
    join(process.cwd(), "fixtures", `blueprint-${candidateId}-run1.json`);
  return JSON.parse(readFileSync(path, "utf8")) as Blueprint;
}

/**
 * The nth recorded decision. Returns null past the end of the recording,
 * which the caller turns into a graceful close rather than a crash.
 */
export function fixtureTurn(index: number): TurnResult | null {
  const turns = recording().turns;
  if (index >= turns.length) return null;

  const d = turns[index].decision;
  // Recordings predate `substantive`; absent means it was a real answer.
  return { ...d, substantive: d.substantive ?? true, rejectedClaims: d.rejectedClaims ?? [] };
}

export function fixtureTurnCount(): number {
  return recording().turns.length;
}

export function fixtureFeedback(): Feedback | null {
  return recording().feedback;
}
