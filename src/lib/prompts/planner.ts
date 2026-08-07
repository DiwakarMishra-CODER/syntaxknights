import { interviewableDays, loadCurriculum } from "../curriculum";
import { callLLM, LLMError } from "../llm";
import { deriveSignals, type DerivedSignals } from "../signals";
import {
  FOCUS_STRATEGIES,
  type Blueprint,
  type Candidate,
  type FocusDay,
} from "../types";

/**
 * Runs ONCE per session. Picks which days to interview on and how to play
 * each one, based on the candidate's actual cohort record.
 *
 * Token discipline: the curriculum goes in as day number + title + type
 * only. Objectives are ~155 lines across 31 days and belong in the
 * per-turn prompt for a single target day, not here.
 */

/** Byte-identical across every call so the prefix stays cacheable. */
export const PLANNER_SYSTEM = `You plan technical interviews for graduates of a 31-day AI engineering cohort.

This is a LEARNING tool, not a hiring screen. Nobody is being rejected. The candidate is practising to explain what they built. Your plan should give them the best possible chance to show what they know, while still being a real interview that stretches them.

THE CURRICULUM IS ONE CONTINUOUS BUILD.
All 31 days build a single system: an enterprise healthcare chatbot. A "day" is not an abstract topic — it is a slice of the product they shipped. Frame every focus day around the system they actually built. Ask about their retrieval layer, their guardrails, their deployment. Never ask "what is a vector database" — ask what happened when theirs returned nothing useful.

PERSONA.
You are casting a staff engineer who is hiring for a healthcare AI team. Warm, curious, direct. Genuinely interested in how things were built and unafraid to push. Not a quizmaster, not a friend. Adapt the register to this specific candidate: a nervous career-changer and a 28-year veteran should not meet the same interviewer.

CHOOSING FOCUS DAYS.
- Pick 4-6 days. Fewer than 4 is a failure.
- Prefer SHIP_IT and CAPSTONE days. Those are real deliverables with decisions attached.
- Never pick SETUP days. There is nothing worth interviewing on there.
- Spread across the arc of the build. Do not pick five adjacent days.
- Every reason must cite this candidate's specific record — attempts, skips, failures, first-try rate. A reason that would apply to anyone is a bad reason.

STRATEGY, KEYED TO THE RECORD.
- firstTryRate >= 0.8 — they found it easy. startDepth 3-4, lean pressure_test. Find the edge of what they know.
- firstTryRate <= 0.2 — they got there, but slowly. startDepth 1-2, lean rebuild_confidence. The question to answer is whether they understand it or merely persisted. Do not assume the latter.
- Skipped days — probe_gap. Many people learn a skipped topic elsewhere. Check whether they picked it up on their own. Never punish a skip.
- Failed days — they tried and could not finish. Handle with care. Ask what blocked them. rebuild_confidence here must not become condescension, and never make them re-live a failure for its own sake.
- Days passed on the first try with high attempts elsewhere — verify_depth. Confirm the understanding is real.

ARC.
warmup lets them get comfortable on something they did well. build goes deeper into the system. stress applies real pressure on the strongest material. land closes on something they can end feeling good about. The four numbers must sum to targetQuestions.

OPENING LINE.
The first thing the candidate reads. Warm, specific to them, and it should name something real they built. No "Tell me about yourself."`;

export const PLANNER_SCHEMA = {
  type: "object",
  properties: {
    persona: {
      type: "string",
      description:
        "The interviewer's character for this session, 2-3 sentences, adapted to this candidate.",
    },
    openingLine: {
      type: "string",
      description: "The first thing the candidate sees. Warm and specific.",
    },
    targetQuestions: { type: "integer", minimum: 8, maximum: 12 },
    arc: {
      type: "object",
      properties: {
        warmup: { type: "integer", minimum: 1 },
        build: { type: "integer", minimum: 1 },
        stress: { type: "integer", minimum: 1 },
        land: { type: "integer", minimum: 1 },
      },
      required: ["warmup", "build", "stress", "land"],
    },
    focusDays: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          day: { type: "integer", minimum: 3, maximum: 31 },
          title: { type: "string" },
          reason: {
            type: "string",
            description:
              "Why this day for THIS candidate, citing their actual record.",
          },
          startDepth: { type: "integer", minimum: 1, maximum: 5 },
          strategy: { type: "string", enum: FOCUS_STRATEGIES },
        },
        required: ["day", "title", "reason", "startDepth", "strategy"],
      },
    },
  },
  required: ["persona", "openingLine", "targetQuestions", "arc", "focusDays"],
} as const;

/** Day number, title and type only — objectives are deliberately omitted. */
export function compactCurriculum(): string {
  return interviewableDays()
    .map((d) => `${d.day}\t${d.title} [${d.type}]`)
    .join("\n");
}

export function buildPlannerInput(
  candidate: Candidate,
  signals: DerivedSignals
): string {
  const m = candidate.member;
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const list = (days: number[]) => (days.length ? days.join(", ") : "none");

  return [
    `CANDIDATE`,
    `${m.name} — ${m.jobRole}, ${m.yearsExperience} years, ${m.education}`,
    ``,
    `COHORT RECORD (31 days total)`,
    `Missions completed: ${candidate.signals.missionsCompleted}/31 (coverage ${pct(signals.coverage)})`,
    `Passed first try:   ${candidate.signals.missionsFirstTry}/${candidate.signals.missionsCompleted} (first-try rate ${pct(signals.firstTryRate)})`,
    `Days with commits:  ${candidate.signals.commitDays}/31 (engagement ${pct(signals.engagement)})`,
    ``,
    `Skipped days (never attempted): ${list(signals.skippedDays)}`,
    `Failed days (attempted, could not pass): ${list(signals.failedDays)}`,
    `Struggled days (passed, 3+ attempts): ${list(signals.struggledDays)}`,
    `Clean days (passed first try): ${list(signals.cleanDays)}`,
    ``,
    `Shape: ${signals.profileNote}`,
    ``,
    `CURRICULUM (day, title, type — SETUP days already excluded)`,
    compactCurriculum(),
    ``,
    `TASK`,
    `Plan this candidate's interview. Pick 4-6 focus days and justify each one against their record above.`,
  ].join("\n");
}

/** Thrown when the model returns a plan that breaks a hard requirement. */
export class BlueprintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlueprintError";
  }
}

/**
 * Schema enforcement covers types and enums, but not the rules that depend
 * on the curriculum (no SETUP days, real day numbers). Those are checked here.
 */
export function validateBlueprint(b: Blueprint): Blueprint {
  const byDay = new Map(loadCurriculum().days.map((d) => [d.day, d]));

  const seen = new Set<number>();
  const focusDays: FocusDay[] = [];

  for (const f of b.focusDays) {
    const day = byDay.get(f.day);
    if (!day) throw new BlueprintError(`focus day ${f.day} is not in the curriculum`);
    if (day.type === "SETUP") {
      throw new BlueprintError(`focus day ${f.day} is a SETUP day`);
    }
    if (seen.has(f.day)) continue;
    seen.add(f.day);
    // Trust the curriculum's title over whatever the model echoed back.
    focusDays.push({ ...f, title: day.title });
  }

  if (focusDays.length < 4) {
    throw new BlueprintError(
      `only ${focusDays.length} usable focus days, need at least 4`
    );
  }

  if (b.targetQuestions < 8 || b.targetQuestions > 12) {
    throw new BlueprintError(`targetQuestions ${b.targetQuestions} outside 8-12`);
  }

  return { ...b, focusDays };
}

export interface PlanOptions {
  onUsage?: Parameters<typeof callLLM>[0]["onUsage"];
  /** Raise for offline scripts that can afford to wait out a 429 window. */
  maxWaitMs?: number;
  /** Override the configured model, e.g. when its daily quota is spent. */
  model?: string;
}

export async function planInterview(
  candidate: Candidate,
  opts: PlanOptions = {}
): Promise<Blueprint> {
  const signals = deriveSignals(candidate);

  const raw = await callLLM<Blueprint>({
    role: "planner",
    system: PLANNER_SYSTEM,
    input: buildPlannerInput(candidate, signals),
    schema: PLANNER_SCHEMA as unknown as Record<string, unknown>,
    onUsage: opts.onUsage,
    maxWaitMs: opts.maxWaitMs,
    model: opts.model,
  });

  try {
    return validateBlueprint(raw);
  } catch (err) {
    if (err instanceof BlueprintError) throw err;
    throw new LLMError("malformed_output", `planner: ${String(err)}`, "planner", err);
  }
}
