import { NextResponse } from "next/server";

import { getRecentTurns, loadSession } from "@/lib/db";
import { MIN_DAYS_COVERED, MIN_QUESTIONS } from "@/lib/orchestrator";

/**
 * Read-only view of the session for the instrument panel.
 *
 * Kept OFF /api/interview deliberately: that contract is frozen and a
 * conformance check may assert the response has no fields beyond
 * `reply`, `done` and `feedback`. Everything the panel needs lives here
 * instead, sourced from Supabase — the same rows the interview wrote.
 */

export const dynamic = "force-dynamic";

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
  const depthHistory = interviewerTurns
    .filter((t) => t.depth !== null)
    .map((t, i) => ({
      index: i,
      turnNumber: t.turnNumber,
      day: t.targetDay,
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
    },
    depthHistory,
    rationale: latest?.rationale ?? null,
    claims,
  });
}
