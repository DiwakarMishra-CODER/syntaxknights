import { NextResponse } from "next/server";

import {
  appendTurn,
  loadReport,
  loadSession,
  markDone,
  saveReport,
  saveSessionState,
} from "@/lib/db";
import { buildReport } from "@/lib/report-context";

/**
 * The candidate ending the interview themselves.
 *
 * Deliberately NOT part of /api/interview: that request and response shape is
 * frozen and a conformance check asserts exact key equality on it. This lives
 * in the /api/session/[sessionId]/* namespace, which is the documented
 * non-frozen side door.
 *
 * It also imports nothing behavioural from the orchestrator. The graded floors
 * — 8 questions, 4 days — gate when the SYSTEM may conclude, and that gate
 * keeps exactly one caller. Someone choosing to leave is a different thing,
 * and it is recorded as a different thing rather than dressed up as a
 * completed interview.
 */

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = await loadSession(sessionId);
  if (!session) {
    return NextResponse.json({ ok: false, error: "no such session" }, { status: 404 });
  }
  if (!session.blueprint) {
    return NextResponse.json(
      { ok: false, error: "this session was never started" },
      { status: 409 }
    );
  }

  // Double-click guard. A second press must not spend another ~19s reporter
  // call. If the row is missing we fall through, which also recovers an /end
  // that crashed between markDone and saveReport.
  if (session.status === "done") {
    const existing = await loadReport(sessionId);
    if (existing) {
      return NextResponse.json({
        ok: true,
        sessionId,
        endedEarly: session.state.endedEarly,
        alreadyDone: true,
      });
    }
  }

  try {
    // targetDay and depth stay null on purpose: topicsReached and the
    // depthHistory builder both skip null entries, so a closing line cannot
    // add a phantom question to the trace or to "How far you got".
    await appendTurn(sessionId, {
      role: "interviewer",
      content: "You ended the interview here. Your report is below.",
      targetDay: null,
      depth: null,
      rubric: null,
      claims: [],
      rationale: "candidate ended the interview early",
    });

    const state = { ...session.state, endedEarly: true };
    await saveSessionState(sessionId, state);

    // Marked done BEFORE the reporter runs. Reporting first leaves a ~19s
    // window in which an in-flight turn can land, save state, and even ask
    // another question after the candidate pressed End.
    await markDone(sessionId);

    const feedback = await buildReport({
      sessionId,
      candidate: session.candidate,
      blueprint: session.blueprint,
      state,
      endedEarly: true,
    });

    try {
      await saveReport(sessionId, feedback);
    } catch (err) {
      // The report page renders a "still being written" state for this.
      console.error(`[end] saveReport failed for ${sessionId}:`, err);
    }

    return NextResponse.json({ ok: true, sessionId, endedEarly: true, alreadyDone: false });
  } catch (err) {
    console.error(`[end] failed for ${sessionId}:`, err);
    // The session is already closed, so the candidate is not stuck — the
    // report page will show that it is still being written.
    return NextResponse.json(
      { ok: false, error: "could not finish writing the report" },
      { status: 500 }
    );
  }
}
