import { NextResponse } from "next/server";

import { getRecentTurns, loadSession } from "@/lib/db";
import { findDay } from "@/lib/curriculum";
import { bandFor, depthCeiling } from "@/lib/depth";
import { MIN_DAYS_COVERED, MIN_QUESTIONS } from "@/lib/orchestrator";
import { deriveSignals } from "@/lib/signals";
import {
  compareToRecord,
  explanationSignal,
  topicsReached,
  unjustifiedClaims,
} from "@/lib/summary";

/**
 * Read-only view of the session for the instrument panel.
 *
 * Kept OFF /api/interview deliberately: that contract is frozen and a
 * conformance check may assert the response has no fields beyond
 * `reply`, `done` and `feedback`. Everything the panel needs lives here
 * instead, sourced from Supabase — the same rows the interview wrote.
 */

export const dynamic = "force-dynamic";

const blueprintTitle = (
  focusDays: Array<{ day: number; title: string }>,
  day: number
): string | undefined => focusDays.find((f) => f.day === day)?.title;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = await loadSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "no such session" }, { status: 404 });
  }

  const turns = await getRecentTurns(sessionId, 400);
  const interviewerTurns = turns.filter((t) => t.role === "interviewer");

  // One point per question asked. The opening line carries no rubric, so
  // it seeds the trace at its planned depth without implying a measurement.
  // Same title resolution as summary.ts:47-48 — plan first, curriculum
  // second — so the chart's segment labels and the report's area names can
  // never disagree.
  const titleFor = (day: number | null) =>
    day === null
      ? null
      : blueprintTitle(session.blueprint?.focusDays ?? [], day) ??
        findDay(day)?.title ??
        `Day ${day}`;

  const depthHistory = interviewerTurns
    .filter((t) => t.depth !== null)
    .map((t, i) => ({
      index: i,
      turnNumber: t.turnNumber,
      day: t.targetDay,
      title: titleFor(t.targetDay),
      depth: t.depth as number,
      knowledge: t.rubric?.knowledge ?? null,
      measured: t.rubric !== null,
    }));

  const latest = interviewerTurns[interviewerTurns.length - 1] ?? null;

  const claims = turns.flatMap((t) =>
    (t.claims ?? []).map((c) => ({
      text: c.text,
      day: c.day,
      unjustified: c.unjustified === true,
      // Nothing sets this yet — contradiction detection is not built, so
      // the panel will correctly show none rather than inventing them.
      contradicted: c.status === "contradicted",
    }))
  );

  const { state, blueprint } = session;
  const signals = deriveSignals(session.candidate);
  const topics = topicsReached(turns, blueprint?.focusDays ?? []);

  return NextResponse.json({
    status: session.status,
    candidate: {
      id: session.candidate.member.id,
      name: session.candidate.member.name,
      jobRole: session.candidate.member.jobRole,
      yearsExperience: session.candidate.member.yearsExperience,
      missionsCompleted: session.candidate.signals.missionsCompleted,
      missionsFirstTry: session.candidate.signals.missionsFirstTry,
    },
    plan: {
      targetQuestions: blueprint?.targetQuestions ?? 0,
      focusDays:
        blueprint?.focusDays.map((f) => ({
          day: f.day,
          title: f.title,
          strategy: f.strategy,
        })) ?? [],
    },
    floors: { minQuestions: MIN_QUESTIONS, minDays: MIN_DAYS_COVERED },
    state: {
      questionCount: state.questionCount,
      daysCovered: state.daysCovered,
      currentDay: state.currentDay,
      currentDepth: state.currentDepth,
      followUpCount: state.followUpCount,
      followUpAllowance: state.followUpAllowance,
      abilityEstimate: Number(state.abilityEstimate.toFixed(2)),
      mode: state.mode,
      consecutiveStrong: state.consecutiveStrong,
      // The ceiling moves with demonstrated ability — the clearest single
      // number showing the interview responding rather than asserting it.
      depthCeiling: depthCeiling({
        currentDepth: state.currentDepth,
        abilityEstimate: state.abilityEstimate,
        mode: state.mode,
        lastScores: state.lastScores,
      }),
      depthBand: bandFor(state.currentDepth),
      /** Times the model reported a depth 2+ rungs off the directed one. */
      depthViolations: state.depthViolations,
    },
    // Enough to rebuild the conversation after a refresh, now that the
    // session id lives in the URL and a refresh is reachable.
    transcript: turns.map((t) => ({ role: t.role, content: t.content })),
    endedEarly: state.endedEarly,
    depthHistory,
    rationale: latest?.rationale ?? null,
    claims,
    // The end-of-interview result, in place of a score. Both derived from
    // turns already stored — no extra model call, no schema change, and
    // nothing added to the frozen /api/interview response.
    topics,
    explanation: explanationSignal(
      turns.map((t) => t.rubric).filter((r): r is NonNullable<typeof r> => r !== null)
    ),
    unjustified: unjustifiedClaims(turns.flatMap((t) => t.claims ?? [])),
    // The comparison a generic interview cannot make: this candidate's
    // 31-day record existed before they said a word.
    comparison: compareToRecord({
      firstTryRate: signals.firstTryRate,
      coverage: signals.coverage,
      missionsCompleted: session.candidate.signals.missionsCompleted,
      missionsFirstTry: session.candidate.signals.missionsFirstTry,
      skippedDays: signals.skippedDays,
      failedDays: signals.failedDays,
      struggledDays: signals.struggledDays,
      abilityEstimate: state.abilityEstimate,
      topics,
    }),
  });
}
