import { getObjectives } from "../curriculum";
import { callLLM } from "../llm";
import type { Evaluation } from "./evaluator";
import type { TurnAction, TurnContext } from "./turn";

/**
 * The question-asking half of a turn, as a standalone call. Consumes the
 * Evaluator's output.
 *
 * Superseded by the merged turn.ts, but kept so the merge can be reverted
 * and so scripts/compare-turn.ts has a real second path to measure.
 */

export interface InterviewerMove {
  reaction: string;
  question: string;
  action: TurnAction;
  targetDay: number;
  depth: number;
  rationale: string;
}

export const INTERVIEWER_SYSTEM = `You are conducting a technical interview with a graduate of a 31-day AI engineering cohort. An assessment of their latest answer is provided to you. Use it to decide the next question.

This is a LEARNING tool, not a hiring screen. Nobody is being rejected.

THE CURRICULUM IS ONE CONTINUOUS BUILD.
All 31 days build a single system: an enterprise healthcare chatbot. Ask about the system they built, never the topic in the abstract.

VOICE.
Your persona is given below. Adopt it exactly. Reference their own words where you can.

NEVER REVEAL CORRECTNESS.
The reaction field is a bare acknowledgement: "Okay." "Right." "Fair enough." Never praise. Never confirm or deny whether the answer was correct. A candidate must not be able to infer their score from your tone.

THE QUESTION.
Exactly one question. Under 30 words. It must follow from what they just said.

HOW THE SCORES DRIVE THE NEXT QUESTION.
- knowledge >= 4 — climb a depth level or pressure-test an edge case.
- knowledge <= 2 — do NOT pile on. Hold or drop a level and scaffold with a smaller, concrete version of the same question.
- specificity <= 2 — ask for one concrete example from their own build.
- A claim contradicting an earlier claim — outranks everything else. Ask about the discrepancy without accusation.

ACTION.
follow_up — stay on this day, go deeper.
clarify — too vague to assess; ask them to pin it down.
next_topic — this day is done; move to the next focus day.
conclude — target question count reached and the arc has landed.`;

export const INTERVIEWER_SCHEMA = {
  type: "object",
  properties: {
    reaction: { type: "string" },
    question: { type: "string" },
    action: {
      type: "string",
      enum: ["follow_up", "next_topic", "clarify", "conclude"],
    },
    targetDay: { type: "integer", minimum: 1, maximum: 31 },
    depth: { type: "integer", minimum: 1, maximum: 5 },
    rationale: { type: "string" },
  },
  required: [
    "reaction",
    "question",
    "action",
    "targetDay",
    "depth",
    "rationale",
  ],
} as const;

export function buildInterviewerInput(
  ctx: TurnContext,
  evaluation: Evaluation
): string {
  const { blueprint, targetDay } = ctx;
  const focus = blueprint.focusDays.find((f) => f.day === targetDay);

  const transcript = ctx.recentTurns.length
    ? ctx.recentTurns
        .map((t) => `${t.role === "candidate" ? "CANDIDATE" : "YOU"}: ${t.content}`)
        .join("\n\n")
    : "(no turns yet)";

  const ledger = ctx.claimLedger.length
    ? ctx.claimLedger
        .map(
          (c) =>
            `- day ${c.day}: ${c.text}${c.unjustified ? "  [UNJUSTIFIED]" : ""}`
        )
        .join("\n")
    : "(nothing claimed yet)";

  return [
    `PERSONA`,
    blueprint.persona,
    ``,
    `PLAN`,
    `Target ${blueprint.targetQuestions} questions. Asked so far: ${ctx.questionsAsked}.`,
    `Arc: warmup ${blueprint.arc.warmup}, build ${blueprint.arc.build}, stress ${blueprint.arc.stress}, land ${blueprint.arc.land}.`,
    `Focus days: ${blueprint.focusDays.map((f) => `${f.day} (${f.strategy})`).join(", ")}`,
    ``,
    `CURRENT TARGET — day ${targetDay}${focus ? `: ${focus.title}` : ""}`,
    focus ? `Strategy: ${focus.strategy}. Why this day: ${focus.reason}` : "",
    `Current depth: ${ctx.depth}/5`,
    ``,
    `DAY ${targetDay} OBJECTIVES`,
    ...getObjectives(targetDay).map((o) => `- ${o}`),
    ``,
    `ASSESSMENT OF THEIR LATEST ANSWER`,
    `knowledge ${evaluation.rubric.knowledge}/5, communication ${evaluation.rubric.communication}/5, specificity ${evaluation.rubric.specificity}/5`,
    `objectives hit: ${evaluation.rubric.objectivesHit.join("; ") || "none"}`,
    `claims extracted: ${
      evaluation.claims
        .map((c) => `${c.text}${c.unjustified ? " [UNJUSTIFIED]" : ""}`)
        .join("; ") || "none"
    }`,
    ``,
    `CLAIM LEDGER`,
    ledger,
    ``,
    `RECENT TURNS`,
    transcript,
    ``,
    `TASK`,
    `Decide the next question.`,
  ]
    .filter((line) => line !== ``)
    .join("\n");
}

export async function ask(
  ctx: TurnContext,
  evaluation: Evaluation,
  opts: {
    onUsage?: Parameters<typeof callLLM>[0]["onUsage"];
    model?: string;
  } = {}
): Promise<InterviewerMove> {
  return callLLM<InterviewerMove>({
    role: "interviewer",
    system: INTERVIEWER_SYSTEM,
    input: buildInterviewerInput(ctx, evaluation),
    schema: INTERVIEWER_SCHEMA as unknown as Record<string, unknown>,
    onUsage: opts.onUsage,
    model: opts.model,
  });
}
