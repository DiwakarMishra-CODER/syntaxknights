import { getObjectives } from "../curriculum";
import { callLLM } from "../llm";
import type { Claim } from "../types";
import type { TurnContext, TurnRubric } from "./turn";

/**
 * The assessment half of a turn, as a standalone call.
 *
 * Superseded by the merged turn.ts, but kept so the merge can be reverted
 * and so scripts/compare-turn.ts has a real second path to measure.
 */

export interface Evaluation {
  rubric: TurnRubric;
  claims: Claim[];
}

export const EVALUATOR_SYSTEM = `You assess a single answer from a technical interview with a graduate of a 31-day AI engineering cohort. You do NOT ask questions and you do NOT talk to the candidate. You return scores and extracted claims, nothing else.

All 31 days build one system: an enterprise healthcare chatbot. Judge whether they are describing THEIR build or reciting general knowledge.

SCORING, 1-5 EACH.
knowledge — do they understand the mechanism, or are they repeating vocabulary?
communication — could another engineer act on this explanation?
specificity — real details from their own system, or a generic textbook answer?
objectivesHit — which of the listed day objectives the answer demonstrably touched. Quote the objective text. Empty is a valid answer.

CLAIMS.
Extract every factual assertion about their system. Mark unjustified: true when it was asserted with no supporting detail.`;

export const EVALUATOR_SCHEMA = {
  type: "object",
  properties: {
    rubric: {
      type: "object",
      properties: {
        knowledge: { type: "integer", minimum: 1, maximum: 5 },
        communication: { type: "integer", minimum: 1, maximum: 5 },
        specificity: { type: "integer", minimum: 1, maximum: 5 },
        objectivesHit: { type: "array", items: { type: "string" } },
      },
      required: ["knowledge", "communication", "specificity", "objectivesHit"],
    },
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          day: { type: "integer" },
          unjustified: { type: "boolean" },
        },
        required: ["text", "day", "unjustified"],
      },
    },
  },
  required: ["rubric", "claims"],
} as const;

export function buildEvaluatorInput(ctx: TurnContext): string {
  const last = ctx.recentTurns[ctx.recentTurns.length - 1];

  return [
    `DAY ${ctx.targetDay} OBJECTIVES`,
    ...getObjectives(ctx.targetDay).map((o) => `- ${o}`),
    ``,
    `THE QUESTION THEY WERE ASKED`,
    ctx.recentTurns.filter((t) => t.role === "interviewer").slice(-1)[0]?.content ??
      "(none)",
    ``,
    `THEIR ANSWER`,
    last?.role === "candidate" ? last.content : "(no answer yet)",
    ``,
    `TASK`,
    `Score this answer and extract its claims.`,
  ].join("\n");
}

export async function evaluate(
  ctx: TurnContext,
  opts: {
    onUsage?: Parameters<typeof callLLM>[0]["onUsage"];
    model?: string;
  } = {}
): Promise<Evaluation> {
  return callLLM<Evaluation>({
    role: "evaluator",
    system: EVALUATOR_SYSTEM,
    input: buildEvaluatorInput(ctx),
    schema: EVALUATOR_SCHEMA as unknown as Record<string, unknown>,
    onUsage: opts.onUsage,
    model: opts.model,
  });
}
