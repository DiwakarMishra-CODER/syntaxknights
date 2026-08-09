import type { ReportPanel } from "@/components/Report";
import { getRecentTurns, loadReport, loadSession } from "./db";
import { deriveSignals } from "./signals";
import {
  compareToRecord,
  explanationSignal,
  topicsReached,
  unjustifiedClaims,
} from "./summary";
import type { Candidate, Feedback, FocusDay, Turn } from "./types";

/**
 * Everything the report needs, loaded once.
 *
 * Server-only — it touches the DB. Both the interactive report page and the
 * print page render the same numbers, so they must build them the same way;
 * duplicating the panel assembly across two routes is how a printed report
 * ends up disagreeing with the one on screen.
 */

export type ReportLoad =
  | { status: "missing" }
  | { status: "in_progress" }
  | { status: "writing" }
  | {
      status: "ready";
      feedback: Feedback;
      panel: ReportPanel;
      turns: Turn[];
      focusDays: FocusDay[];
      candidate: Candidate;
      endedEarly: boolean;
    };

export async function loadReportView(sessionId: string): Promise<ReportLoad> {
  const session = await loadSession(sessionId);
  if (!session) return { status: "missing" };
  if (session.status !== "done") return { status: "in_progress" };

  const feedback = await loadReport(sessionId);
  if (!feedback) return { status: "writing" };

  const turns = await getRecentTurns(sessionId, 400);
  const signals = deriveSignals(session.candidate);
  const focusDays = session.blueprint?.focusDays ?? [];
  const topics = topicsReached(turns, focusDays);

  const rubrics = turns
    .map((t) => t.rubric)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const panel: ReportPanel = {
    topics,
    explanation: explanationSignal(rubrics),
    unjustified: unjustifiedClaims(turns.flatMap((t) => t.claims ?? [])),
    comparison: compareToRecord({
      firstTryRate: signals.firstTryRate,
      coverage: signals.coverage,
      missionsCompleted: session.candidate.signals.missionsCompleted,
      missionsFirstTry: session.candidate.signals.missionsFirstTry,
      skippedDays: signals.skippedDays,
      failedDays: signals.failedDays,
      struggledDays: signals.struggledDays,
      abilityEstimate: session.state.abilityEstimate,
      topics,
    }),
  };

  return {
    status: "ready",
    feedback,
    panel,
    turns,
    focusDays,
    candidate: session.candidate,
    endedEarly: session.state.endedEarly,
  };
}
