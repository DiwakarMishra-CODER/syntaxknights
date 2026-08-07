import { getObjectives } from "../curriculum";
import { callLLM } from "../llm";
import type { Blueprint, Claim, Turn } from "../types";

/**
 * The Evaluator and Interviewer merged into ONE call per turn.
 *
 * Two calls per turn on a ~10-turn interview is 20 requests; one call is
 * 10. On a free tier that difference decides how many interviews a key
 * supports, so the merge is a quota decision as much as a latency one.
 *
 * evaluator.ts and interviewer.ts are kept so this can be reverted —
 * see scripts/compare-turn.ts for the A/B that justifies the merge.
 */

export type TurnAction = "follow_up" | "next_topic" | "clarify" | "conclude";

export interface TurnRubric {
  knowledge: number;
  communication: number;
  specificity: number;
  objectivesHit: string[];
}

export interface TurnDecision {
  rubric: TurnRubric;
  claims: Claim[];
  /** Bare acknowledgement. Never praise, never reveals correctness. */
  reaction: string;
  /** ONE question, under 30 words. */
  question: string;
  action: TurnAction;
  targetDay: number;
  depth: number;
  rationale: string;
}

/** Byte-identical across every turn so the prefix stays cacheable. */
export const TURN_SYSTEM = `You are conducting a technical interview with a graduate of a 31-day AI engineering cohort. You do two jobs in one pass: first you ASSESS the answer they just gave, then you DECIDE the next question from that assessment. Never decide the question before assessing — the assessment is what the decision is made of.

This is a LEARNING tool, not a hiring screen. Nobody is being rejected. They are practising to explain what they built.

THE CURRICULUM IS ONE CONTINUOUS BUILD.
All 31 days build a single system: an enterprise healthcare chatbot. Ask about the system they actually built, never about the topic in the abstract. Not "what is chunking" but "what did you do when a chunk split a dosage table in half".

VOICE.
Your persona is given in the blueprint. Adopt it exactly. Reference their own words where you can — quoting a phrase they used makes the interview feel heard rather than scripted.

NEVER REVEAL CORRECTNESS.
The reaction field is a bare acknowledgement: "Okay." "Right." "Fair enough." "Got it." Never praise. Never confirm or deny whether the answer was correct. No "great answer", no "exactly", no "that's not quite right". A candidate must not be able to infer their score from your tone. If they ask directly whether they got it right, acknowledge the question and move on without answering it.

THE QUESTION.
Exactly one question. Under 30 words. It must follow from what they just said, not from a script.

SCORING, 1-5 EACH.
knowledge — do they actually understand the mechanism, or are they repeating vocabulary?
communication — can they explain it so another engineer could act on it?
specificity — are they describing THEIR build with real details, or a generic textbook answer?
objectivesHit — which of the listed day objectives their answer demonstrably touched. Quote the objective text. Empty is a valid answer.

HOW THE SCORES DRIVE THE NEXT QUESTION.
- knowledge >= 4 — they have it. Climb a depth level or pressure-test an edge case. Do not re-ask what they just proved.
- knowledge <= 2 — do NOT pile on. Hold the depth or drop one. Scaffold: ask a smaller, more concrete version of the same question. Never ask a harder question of someone who just struggled.
- specificity <= 2 — they are speaking in generalities. Ask for one concrete example from their own build. "Walk me through a specific case where..."
- A claim that contradicts an earlier claim in the ledger — this outranks everything else. Ask about the discrepancy directly, without accusation. "Earlier you said X, just now Y — help me square those."

CLAIMS — EXTRACT, NEVER INVENT.
Extract every factual assertion they made about their system, in their own words or a close paraphrase. A claim must be something they actually said. If they hand-waved — "we handled it", "it was set up properly" — then the claim is the hand-wave itself, marked unjustified. Do NOT name a mechanism they did not name. Writing "configured a termination grace period" when they only said "we set it up properly" is fabrication, and it poisons every later turn that probes against the ledger.

Mark unjustified: true when they asserted something with no supporting detail — those are the ones later turns should probe.

Your question must not presuppose a mechanism they never mentioned. Ask what they did, not how well they did the thing you assumed.

ACTION.
follow_up — stay on this day, go deeper on what they just said.
clarify — the answer was too vague or ambiguous to assess; ask them to pin it down.
next_topic — this day is done; move to the next focus day in the blueprint.
conclude — the target question count is reached and the arc has landed.`;

export const TURN_SCHEMA = {
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
    reaction: {
      type: "string",
      description:
        "Bare acknowledgement only. Never praise, never reveal correctness.",
    },
    question: {
      type: "string",
      description: "Exactly one question, under 30 words.",
    },
    action: {
      type: "string",
      enum: ["follow_up", "next_topic", "clarify", "conclude"],
    },
    targetDay: { type: "integer", minimum: 1, maximum: 31 },
    depth: { type: "integer", minimum: 1, maximum: 5 },
    rationale: {
      type: "string",
      description: "Why this question, given their answer.",
    },
  },
  required: [
    "rubric",
    "claims",
    "reaction",
    "question",
    "action",
    "targetDay",
    "depth",
    "rationale",
  ],
} as const;

export interface TurnContext {
  blueprint: Blueprint;
  /** Last 4 turns ONLY — everything earlier is summarised by the ledger. */
  recentTurns: Turn[];
  claimLedger: Claim[];
  targetDay: number;
  depth: number;
  questionsAsked: number;
}

export function buildTurnInput(ctx: TurnContext): string {
  const { blueprint, recentTurns, claimLedger, targetDay, depth } = ctx;

  const focus = blueprint.focusDays.find((f) => f.day === targetDay);
  const objectives = getObjectives(targetDay);

  const transcript = recentTurns.length
    ? recentTurns
        .map((t) => `${t.role === "candidate" ? "CANDIDATE" : "YOU"}: ${t.content}`)
        .join("\n\n")
    : "(no turns yet — this is the opening)";

  const ledger = claimLedger.length
    ? claimLedger
        .map(
          (c) =>
            `- day ${c.day}: ${c.text}${c.unjustified ? "  [UNJUSTIFIED — worth probing]" : ""}`
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
    focus ? `Strategy: ${focus.strategy}. Why this day: ${focus.reason}` : ``,
    `Current depth: ${depth}/5`,
    ``,
    `DAY ${targetDay} OBJECTIVES`,
    ...objectives.map((o) => `- ${o}`),
    ``,
    `CLAIM LEDGER (everything before the recent turns)`,
    ledger,
    ``,
    `RECENT TURNS`,
    transcript,
    ``,
    `TASK`,
    `Assess the candidate's most recent answer, then decide the next question from that assessment.`,
  ]
    .filter((line) => line !== ``)
    .join("\n");
}

export async function runTurn(
  ctx: TurnContext,
  opts: {
    onUsage?: Parameters<typeof callLLM>[0]["onUsage"];
    model?: string;
    maxWaitMs?: number;
  } = {}
): Promise<TurnDecision> {
  return callLLM<TurnDecision>({
    role: "turn",
    system: TURN_SYSTEM,
    input: buildTurnInput(ctx),
    schema: TURN_SCHEMA as unknown as Record<string, unknown>,
    onUsage: opts.onUsage,
    model: opts.model,
    maxWaitMs: opts.maxWaitMs,
  });
}
