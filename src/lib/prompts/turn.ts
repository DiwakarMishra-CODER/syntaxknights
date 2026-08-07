import { getObjectives } from "../curriculum";
import { callLLM } from "../llm";
import type { TurnDirective } from "../orchestrator";
import type { Blueprint, Claim, Turn, TurnRubric } from "../types";
import { ANTI_INVENTION, filterInventedClaims } from "./shared";

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

export type { TurnRubric };

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
  /** False for a greeting or non-answer — scores are then ignored. */
  substantive: boolean;
}

/** Byte-identical across every turn so the prefix stays cacheable. */
export const TURN_SYSTEM = `You are a staff engineer interviewing a graduate of an AI engineering cohort about a system they built: an enterprise healthcare chatbot. You do two jobs in one pass — first ASSESS the answer they just gave, then DECIDE the next question from it. Never decide the question before assessing.

This is a LEARNING tool, not a hiring screen. Nobody is being rejected. They are practising to explain what they built.

YOU DO NOT KNOW ABOUT "DAYS".
Never say "on Day 22", "for Day 28", or any day number. Never mention the curriculum, missions, or modules. A real interviewer has never seen the syllabus — they have seen a system and are curious about it. Say "the deployment", "your retrieval layer", "the agent routing". If a day number appears in your question, the question is wrong.

OBJECTIVES ARE CONTEXT, NOT A CHECKLIST.
The objectives below tell you what this part of the system involved. They are NOT a list to verify one by one. Never walk through them. Never ask "how did you structure X" just because X is listed. If you find yourself confirming that they did each listed thing, stop — that is a quiz, not an interview.

ASK ABOUT CONSEQUENCES, NOT INVENTORY.
Nobody has ever been asked in a real interview what base image they used. Prefer why, what-breaks, what-if, and what-did-you-trade over what-did-you-use.
  Bad:  "What base image did you start with?"
  Bad:  "Which endpoint were you hitting?"
  Bad:  "How did you structure the health endpoint?"
  Good: "What happens to an in-flight conversation when a pod restarts?"
  Good: "A clinician asks something your documents don't cover. What do they see?"
  Good: "You said you'd do it differently now — what would you change first?"

CROSS-TOPIC BEATS SINGLE-TOPIC.
A question that makes them trace one request across retrieval, the model call and the response is worth more than four questions about one area. "Walk me through what happens when a patient asks about their coverage" tells you more than any component question.

CHASE REVEALED WEAKNESS. THIS OUTRANKS THE PLAN.
If they reveal a real problem, go there immediately. It is always the strongest thread available, better than anything you had planned.
  They mention a wildcard CORS origin on a healthcare app — ask about it.
  They say they had no query router at all — ask what that costs them.
  They say "I couldn't really tell you how it decided" — that is the interview.
A revealed weakness handled with curiosity is the most valuable minute in the conversation. Do not answer it with "Got it" and move on.

NEVER REVEAL CORRECTNESS.
The reaction is a bare acknowledgement. Never praise, never confirm or deny. No "great answer", no "exactly", no "not quite". They must not be able to infer their score from your tone. VARY IT — "Okay." "Right." "Fair enough." "Mm." "I see." — and often use no reaction at all, just the question. Repeating one phrase every turn reads as a bot.

THE QUESTION.
Exactly one, under 30 words, following from what they just said.

SUBSTANTIVE.
Set substantive false when the reply is a greeting, an "I don't know", an empty line or anything carrying no information about the system. A greeting is not evidence of low knowledge. When false, still ask a real question, and the scores will be ignored.

SCORING, 1-5 EACH.
knowledge — do they understand the mechanism, or repeat vocabulary?
communication — could another engineer act on this explanation?
specificity — their build with real detail, or a generic textbook answer?
objectivesHit — objectives their answer demonstrably touched. Quote the text. Empty is normal and fine.

HOW THE SCORES DRIVE THE NEXT QUESTION.
- knowledge >= 4 — they have it. Go deeper or pressure-test an edge case. Do NOT abandon a thread that just got productive.
- knowledge <= 2 — do not pile on. Hold or drop a level and ask something smaller and more concrete.
- specificity <= 2 — ask for one concrete instance from their own build.
- A claim contradicting the ledger outranks everything except a revealed weakness.

CLAIMS.
Extract every factual assertion about their system, in their own words or close paraphrase. If they hand-waved, the claim IS the hand-wave, marked unjustified.

${ANTI_INVENTION}

ACTION.
follow_up — stay on this thread.
clarify — too vague to assess; ask them to pin it down.
next_topic — this thread is done; move on.
conclude — ONLY when the constraints permit it. The question field is then not a question at all: it is a short closing beat. Thank them, say one specific true thing about the conversation, and invite them to ask you something.`;

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
    substantive: {
      type: "boolean",
      description:
        "False for a greeting, an empty reply, or anything carrying no information about their system.",
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
    "substantive",
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
  /** Computed BEFORE this call — the model writes to it, not around it. */
  directive: TurnDirective;
}

export function buildTurnInput(ctx: TurnContext): string {
  const { blueprint, recentTurns, claimLedger, directive } = ctx;

  const day = directive.targetDay;
  const focus = blueprint.focusDays.find((f) => f.day === day);
  const objectives = getObjectives(day);

  const transcript = recentTurns.length
    ? recentTurns
        .map((t) => `${t.role === "candidate" ? "CANDIDATE" : "YOU"}: ${t.content}`)
        .join("\n\n")
    : "(no turns yet — this is the opening)";

  const ledger = claimLedger.length
    ? claimLedger
        .map(
          (c) =>
            `- ${c.text}${c.unjustified ? "  [UNJUSTIFIED — worth probing]" : ""}`
        )
        .join("\n")
    : "(nothing claimed yet)";

  // Constraints are instruction, not post-processing. Whatever the model
  // writes here is what gets recorded, so it must be told the rules first.
  const constraints: string[] = [];
  if (directive.mustMove) {
    constraints.push(
      `You MUST move on to "${focus?.title ?? `day ${day}`}" now — ${directive.moveReason}. ` +
        `Set targetDay to ${day} and write your question about that part of the system.`
    );
  } else {
    constraints.push(
      `You may stay on the current thread (targetDay ${day}) or move on if it is spent.`
    );
  }
  constraints.push(
    directive.mayConclude
      ? `You MAY conclude now if the conversation has landed. ${
          directive.mustConclude ? "You SHOULD conclude — the plan is complete." : ""
        }`
      : `You may NOT conclude yet: ${directive.questionsLeft} question(s) still planned and ` +
        `${directive.uncovered.length} topic(s) untouched. Setting action to conclude will be refused.`
  );
  constraints.push(
    `Follow-ups used on this thread: ${directive.followUpsUsed}/${directive.followUpsAllowed}.`
  );
  constraints.push(`Aim for depth ${directive.depth}/5 on the next question.`);

  return [
    `PERSONA`,
    blueprint.persona,
    ``,
    `CONSTRAINTS — follow these exactly`,
    ...constraints.map((c) => `- ${c}`),
    ``,
    `CURRENT TOPIC: ${focus?.title ?? "the system they built"}`,
    focus ? `Angle: ${focus.strategy}. Why this area: ${focus.reason}` : ``,
    ``,
    `CONTEXT — what this part of the system involved.`,
    `This is background so you understand the build. It is NOT a checklist.`,
    ...objectives.map((o) => `- ${o}`),
    ``,
    `CLAIM LEDGER — everything they have asserted so far`,
    ledger,
    ``,
    `RECENT TURNS`,
    transcript,
    ``,
    `TASK`,
    `Assess their most recent answer, then ask the single best next question. ` +
      `If they revealed a weakness, that is your question.`,
  ]
    .filter((line) => line !== ``)
    .join("\n");
}

/** Everything the candidate has actually said in the visible window. */
export function candidateWords(ctx: TurnContext): string {
  return ctx.recentTurns
    .filter((t) => t.role === "candidate")
    .map((t) => t.content)
    .join("\n");
}

export interface TurnResult extends TurnDecision {
  /** Claims dropped for naming a term the candidate never used. */
  rejectedClaims: Claim[];
}

export async function runTurn(
  ctx: TurnContext,
  opts: {
    onUsage?: Parameters<typeof callLLM>[0]["onUsage"];
    model?: string;
    maxWaitMs?: number;
  } = {}
): Promise<TurnResult> {
  const decision = await callLLM<TurnDecision>({
    role: "turn",
    system: TURN_SYSTEM,
    input: buildTurnInput(ctx),
    schema: TURN_SCHEMA as unknown as Record<string, unknown>,
    onUsage: opts.onUsage,
    model: opts.model,
    maxWaitMs: opts.maxWaitMs,
  });

  // A prompt rule is a request; this is the guarantee. An invented claim
  // must never reach the ledger, because every later turn probes against it.
  const { kept, rejected } = filterInventedClaims(
    decision.claims ?? [],
    candidateWords(ctx)
  );

  for (const r of rejected) {
    console.warn(
      `[turn] dropped invented claim (${r.unsupportedTerms.join(", ")}): ${r.claim.text}`
    );
  }

  return { ...decision, claims: kept, rejectedClaims: rejected.map((r) => r.claim) };
}
