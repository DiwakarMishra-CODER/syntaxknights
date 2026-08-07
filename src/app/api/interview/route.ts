import { NextResponse } from "next/server";

import {
  appendTurn,
  createSession,
  getClaimLedger,
  getRecentTurns,
  loadSession,
  markDone,
  saveReport,
  saveSessionState,
} from "@/lib/db";
import { LLMError } from "@/lib/llm";
import {
  initState,
  nextDirective,
  recordTurn,
  shouldEnd,
} from "@/lib/orchestrator";
import { planInterview } from "@/lib/prompts/planner";
import { degradeReport, writeReport } from "@/lib/prompts/reporter";
import { runTurn, type TurnResult } from "@/lib/prompts/turn";
import { getCandidate } from "@/lib/signals";
import type { Candidate, Feedback, InterviewResponse, Turn } from "@/lib/types";

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

  const blueprint = await planInterview(candidate);
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

  let decision: TurnResult;
  try {
    decision = await runTurn({
      blueprint,
      recentTurns,
      claimLedger,
      targetDay: directive.targetDay,
      depth: directive.depth,
      questionsAsked: state.questionCount,
      directive,
    });
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

  const reaction = directive.omitReaction ? "" : (decision.reaction ?? "").trim();
  const text = [reaction, decision.question].filter(Boolean).join(" ").trim();

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

  const feedback = await buildReport(sessionId, session.candidate, blueprint, nextState);
  await saveReport(sessionId, feedback);
  await markDone(sessionId);

  return reply(text, true, feedback);
}

/** The report must exist. writeReport never throws; this is belt and braces. */
async function buildReport(
  sessionId: string,
  candidate: Candidate,
  blueprint: NonNullable<Awaited<ReturnType<typeof loadSession>>>["blueprint"],
  state: Awaited<ReturnType<typeof loadSession>> extends null
    ? never
    : ReturnType<typeof initState>
): Promise<Feedback> {
  const transcript: Turn[] = await getRecentTurns(sessionId, 200);
  const claimLedger = await getClaimLedger(sessionId);

  const rubrics = transcript
    .filter((t) => t.role === "interviewer" && t.rubric)
    .map((t) => ({
      day: t.targetDay ?? 0,
      depth: t.depth ?? 0,
      rubric: t.rubric!,
    }));

  const ctx = {
    candidate,
    blueprint: blueprint!,
    transcript,
    claimLedger,
    rubrics,
    daysCovered: state.daysCovered,
    questionCount: state.questionCount,
  };

  try {
    return await writeReport(ctx);
  } catch (err) {
    console.error(`[route] reporter failed hard on ${sessionId}:`, err);
    return degradeReport(null, ctx).feedback;
  }
}
