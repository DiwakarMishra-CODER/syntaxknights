import { NextResponse } from "next/server";

import {
  appendTurn,
  createSession,
  findCachedBlueprint,
  getClaimLedger,
  getRecentTurns,
  loadSession,
  markDone,
  saveReport,
  saveSessionState,
} from "@/lib/db";
import { plan, turn as runTurnCall } from "@/lib/engine";
import { validateBlueprint } from "@/lib/prompts/planner";
import { buildReport } from "@/lib/report-context";
import { LLMError } from "@/lib/llm";
import {
  initState,
  nextDirective,
  recordTurn,
  shouldEnd,
} from "@/lib/orchestrator";
import type { TurnResult } from "@/lib/prompts/turn";
import { getCandidate } from "@/lib/signals";
import type { Blueprint, Candidate, Feedback, InterviewResponse, Turn } from "@/lib/types";

/**
 * The single endpoint. Contract is fixed in CLAUDE.md:
 *   { reply: string, done: boolean } and, when done, `feedback`.
 * NOTHING else goes in the response. Rubric, claims, rationale, state and
 * violations are all persisted but never returned.
 *
 * STATELESS: the session is loaded from Supabase at the top of every
 * request and saved at the bottom. Nothing survives in memory between
 * invocations — that is the documented #1 failure mode for this project.
 */

/**
 * A full final turn is a turn call (~7s) plus the reporter (~19s), around
 * 30s. Vercel's fluid compute gives 300s on every plan including Hobby, so
 * this fits with wide margin — but the default is not relied upon.
 */
export const maxDuration = 120;
export const dynamic = "force-dynamic";

/** Only ever `reply`, `done`, and `feedback` when finished. */
function reply(
  text: string,
  done: boolean,
  feedback?: Feedback,
  status = 200
): NextResponse {
  const body: InterviewResponse = done
    ? { reply: text, done: true, feedback: feedback as Feedback }
    : { reply: text, done: false };
  return NextResponse.json(body, { status });
}

/** Client errors keep the contract shape so a conformance check still parses. */
const bad = (text: string) => reply(text, false, undefined, 400);

function resolveCandidate(raw: unknown): Candidate | null {
  if (typeof raw === "string") return getCandidate(raw) ?? null;
  if (raw && typeof raw === "object" && "member" in raw) {
    return raw as Candidate;
  }
  return null;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return bad("Request body must be a JSON object.");
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return bad("Request body must be valid JSON.");
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  if (!sessionId) return bad("sessionId is required.");

  try {
    return "candidate" in body
      ? await startSession(sessionId, body.candidate)
      : await continueSession(sessionId, body.message);
  } catch (err) {
    // Nothing reaches the client as a 500. An unexpected failure still
    // returns a parseable, contract-shaped body.
    console.error(`[route] unhandled error on ${sessionId}:`, err);
    return reply(
      "Something went wrong on our side. Send your answer again and we'll pick up where we left off.",
      false,
      undefined,
      200
    );
  }
}

/**
 * A cached plan, but only if it is still valid for this candidate.
 *
 * `validateBlueprint` is the same check a freshly generated plan must pass —
 * it asserts the focus days exist in the candidate's record. Skipping it here
 * would let a plan cached before a curriculum or roster edit start an
 * interview about days this person never has, which is exactly the
 * fabrication the planner is validated against in the first place.
 */
async function reusableBlueprint(candidate: Candidate): Promise<Blueprint | null> {
  const cached = await findCachedBlueprint(candidate.member.id);
  if (!cached) return null;

  try {
    const ok = validateBlueprint(cached, candidate);
    console.log(`[plan] reusing cached blueprint for ${candidate.member.id} — 0 planner calls`);
    return ok;
  } catch (err) {
    console.warn(
      `[plan] cached blueprint for ${candidate.member.id} no longer valid, re-planning: ` +
        `${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}

// ---------------------------------------------------------------------------

async function startSession(sessionId: string, rawCandidate: unknown) {
  const candidate = resolveCandidate(rawCandidate);
  if (!candidate) {
    return bad(
      "`candidate` must be a known candidate id (e.g. \"CAND-017\") or a candidate object."
    );
  }

  const existing = await loadSession(sessionId);
  if (existing?.blueprint) {
    // Idempotent: re-sending the opening request replays the opening line
    // rather than burning another planner call.
    return reply(existing.blueprint.openingLine, false);
  }

  // Reuse the plan already made for this person rather than paying for an
  // identical one. The planner is on the model capped at 20 requests per DAY
  // per key, and it used to fire on every page open — including the ones
  // nobody answered a question in.
  const blueprint = (await reusableBlueprint(candidate)) ?? (await plan(candidate));
  const state = initState(blueprint);

  await createSession(sessionId, candidate, blueprint);
  await saveSessionState(sessionId, state);
  await appendTurn(sessionId, {
    role: "interviewer",
    content: blueprint.openingLine,
    targetDay: state.currentDay,
    depth: state.currentDepth,
    rubric: null,
    claims: [],
    rationale: "opening line from the blueprint",
  });

  return reply(blueprint.openingLine, false);
}

async function continueSession(sessionId: string, rawMessage: unknown) {
  const message = typeof rawMessage === "string" ? rawMessage : "";
  if (!message.trim()) return bad("`message` is required and must be a non-empty string.");

  const session = await loadSession(sessionId);
  if (!session) {
    return bad(
      `No interview found for sessionId "${sessionId}". Start one by sending { sessionId, candidate }.`
    );
  }
  if (session.status === "done") {
    return bad("This interview has already finished.");
  }
  if (!session.blueprint) {
    return bad("This session has no interview plan. Start again with { sessionId, candidate }.");
  }

  const { blueprint } = session;
  const state = session.state;

  await appendTurn(sessionId, {
    role: "candidate",
    content: message,
    targetDay: state.currentDay,
    depth: state.currentDepth,
    rubric: null,
    claims: [],
    rationale: null,
  });

  const [recentTurns, claimLedger] = await Promise.all([
    getRecentTurns(sessionId, 4),
    getClaimLedger(sessionId),
  ]);

  const directive = nextDirective(state, blueprint, state.consecutiveReactions);

  let decision: TurnResult | null;
  try {
    decision = await runTurnCall(
      {
        blueprint,
        recentTurns,
        claimLedger,
        targetDay: directive.targetDay,
        depth: directive.depth,
        questionsAsked: state.questionCount,
        directive,
      },
      state.questionCount
    );
  } catch (err) {
    // One retry already happened inside callLLM. Rather than 500, ask a
    // safe, honest question and let the interview continue — the state is
    // untouched, so the next request resumes cleanly.
    console.error(`[route] turn failed on ${sessionId}:`, err);
    const kind = err instanceof LLMError ? err.kind : "unknown";
    return reply(
      kind === "rate_limited" || kind === "quota_exhausted"
        ? "I need a moment — send that again in a few seconds and we'll continue."
        : "Sorry, I lost my train of thought. Tell me more about the part of the system you just described.",
      false
    );
  }

  if (!decision) {
    // A replay ran past the end of its recording. Close cleanly with a
    // report rather than pretending there is another question.
    const feedback = await buildReport({ sessionId, candidate: session.candidate, blueprint, state });
    await persistReport(sessionId, feedback);
    await markDone(sessionId);
    return reply(
      "That's everything I wanted to cover — thank you for walking me through it.",
      true,
      feedback
    );
  }

  // The "vary it, stay quiet sometimes" rule is computed BEFORE the answer
  // is read, so it cannot know the reply will turn out to be a non-answer.
  // Acknowledging one of those is not optional -- silence there is exactly
  // what made this read as a form -- so it outranks the variety rule.
  const mustAcknowledge = decision.substantive === false;
  const reaction =
    directive.omitReaction && !mustAcknowledge ? "" : (decision.reaction ?? "").trim();
  // Joined with a blank line, not a space, so the client can separate the
  // reaction from the question exactly instead of guessing with a regex.
  // `reply` stays a plain string -- the frozen contract is untouched.
  const text = [reaction, decision.question].filter(Boolean).join("\n\n").trim();

  const ending = shouldEnd(state, decision);
  const recorded = recordTurn(state, decision, blueprint, directive);
  const nextState = {
    ...recorded.state,
    consecutiveReactions: reaction ? state.consecutiveReactions + 1 : 0,
  };

  if (recorded.violations.length) {
    console.warn(`[route] ${sessionId} violations: ${recorded.violations.join("; ")}`);
  }

  await appendTurn(sessionId, {
    role: "interviewer",
    content: text,
    targetDay: decision.targetDay,
    depth: decision.depth,
    rubric: decision.substantive === false ? null : decision.rubric,
    claims: decision.claims,
    rationale: decision.rationale,
  });
  await saveSessionState(sessionId, nextState);

  if (!ending) return reply(text, false);

  const feedback = await buildReport({ sessionId, candidate: session.candidate, blueprint, state: nextState });
  await persistReport(sessionId, feedback);
  await markDone(sessionId);

  return reply(text, true, feedback);
}

/**
 * Saving the report must never take down the response. A transient Postgres
 * error would otherwise convert a completed interview into the generic
 * non-done error reply — a contract failure for a run that actually finished.
 */
async function persistReport(sessionId: string, feedback: Feedback) {
  try {
    await saveReport(sessionId, feedback);
  } catch (err) {
    console.error(`[route] saveReport failed for ${sessionId}:`, err);
  }
}
