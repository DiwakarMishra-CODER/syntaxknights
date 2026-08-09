import { getClaimLedger, getRecentTurns } from "./db";
import { report as runReporter } from "./engine";
import { worthReporting } from "./orchestrator";
import { degradeReport, type ReportContext } from "./prompts/reporter";
import { deriveSignals } from "./signals";
import { compareToRecord, topicsReached } from "./summary";
import type { Blueprint, Candidate, Claim, Feedback, SessionState, Turn } from "./types";

/**
 * Builds the end-of-interview report.
 *
 * Shared by the normal conclusion in /api/interview and the candidate-initiated
 * /api/session/[id]/end, so the two can never drift into producing different
 * reports for the same transcript.
 */
export async function buildReport(args: {
  sessionId: string;
  candidate: Candidate;
  blueprint: Blueprint;
  state: SessionState;
  endedEarly?: boolean;
}): Promise<Feedback> {
  const { sessionId, candidate, blueprint, state, endedEarly } = args;

  // Independent reads. They were sequential here while route.ts already ran
  // the same pair in parallel.
  const [transcript, claimLedger]: [Turn[], Claim[]] = await Promise.all([
    getRecentTurns(sessionId, 400),
    getClaimLedger(sessionId),
  ]);

  const rubrics = transcript
    .filter((t) => t.role === "interviewer" && t.rubric)
    .map((t) => ({ day: t.targetDay ?? 0, depth: t.depth ?? 0, rubric: t.rubric! }));

  const topics = topicsReached(transcript, blueprint.focusDays);
  const signals = deriveSignals(candidate);

  const ctx: ReportContext = {
    candidate,
    blueprint,
    transcript,
    claimLedger,
    rubrics,
    daysCovered: state.daysCovered,
    questionCount: state.questionCount,
    topics,
    comparison: compareToRecord({
      firstTryRate: signals.firstTryRate,
      coverage: signals.coverage,
      missionsCompleted: candidate.signals.missionsCompleted,
      missionsFirstTry: candidate.signals.missionsFirstTry,
      skippedDays: signals.skippedDays,
      failedDays: signals.failedDays,
      struggledDays: signals.struggledDays,
      abilityEstimate: state.abilityEstimate,
      topics,
    }),
    endedEarly,
  };

  // With almost nothing said there is nothing to quote, so the reporter would
  // fail verbatim validation twice and burn two calls of a 20/day budget to
  // arrive at the same place degradeReport reaches for free.
  if (!worthReporting(state)) {
    console.warn(
      `[report] ${sessionId}: ${state.questionCount} answer(s) — skipping the reporter call`
    );
    return degradeReport(null, ctx).feedback;
  }

  return runReporter(ctx);
}
