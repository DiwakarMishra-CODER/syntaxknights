import {
  fixtureBlueprint,
  fixtureEnabled,
  fixtureFeedback,
  fixtureLatency,
  fixtureTurn,
  pause,
} from "./fixture";
import { planInterview } from "./prompts/planner";
import { degradeReport, writeReport, type ReportContext } from "./prompts/reporter";
import { runTurn, type TurnContext, type TurnResult } from "./prompts/turn";
import type { Blueprint, Candidate, Feedback } from "./types";

/**
 * The single seam between the route and the model.
 *
 * Live, these are thin pass-throughs. Under FIXTURE=1 they serve a
 * recording with simulated latency. The route does not know which is
 * happening, so the replayed responses are identical in shape and timing
 * to live ones by construction rather than by resemblance.
 */

export async function plan(candidate: Candidate): Promise<Blueprint> {
  if (fixtureEnabled()) {
    await pause(fixtureLatency("plan"));
    return fixtureBlueprint(candidate.member.id);
  }
  return planInterview(candidate);
}

/**
 * `index` is the number of questions already asked, which addresses the
 * recording positionally. Past the end of the recording it returns null and
 * the caller closes the interview cleanly.
 */
export async function turn(
  ctx: TurnContext,
  index: number
): Promise<TurnResult | null> {
  if (fixtureEnabled()) {
    await pause(fixtureLatency("turn"));
    return fixtureTurn(index);
  }
  return runTurn(ctx, { maxWaitMs: 8000 });
}

export async function report(ctx: ReportContext): Promise<Feedback> {
  if (fixtureEnabled()) {
    await pause(fixtureLatency("report"));
    return fixtureFeedback() ?? degradeReport(null, ctx).feedback;
  }

  try {
    return await writeReport(ctx);
  } catch {
    return degradeReport(null, ctx).feedback;
  }
}
