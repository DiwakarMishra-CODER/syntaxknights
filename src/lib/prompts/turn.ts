import { getObjectives } from "../curriculum";
import { callLLM } from "../llm";
import type { TurnDirective } from "../orchestrator";
import type { Blueprint, Claim, Turn, TurnRubric } from "../types";
import { bandFor, ladderText } from "../depth";
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
A revealed weakness handled with curiosity is the most valuable minute in the conversation. Do not answer it with an acknowledgement and move on.

WHEN ONE ANSWER CONTAINS TWO WEAKNESSES, TAKE THE MORE SEVERE.
Do not simply take the one that matches the topic you were already on. Rank by consequence to real patients and real data:
  1. Safety, privacy and access to patient data — an open CORS origin, an unauthenticated endpoint, PHI in logs, a missing guardrail
  2. Correctness on clinical or financial facts — wrong dosage, wrong deductible, a confident hallucination
  3. Architecture and reliability — a missing router, no retries, brittle deployment
  4. Process and tooling — untuned parameters, copied config, no tests
A real example this system got wrong: the candidate said in ONE answer that they had no query router AND that they had set allow_origins to a wildcard because it kept erroring. Both are real. The wildcard origin on an application handling patient data is category 1 and outranks the router, which is category 3. The router was chased and the wildcard was dropped. Take the severe one first; you can return to the other later.

THE RATIONALE IS SHOWN ON SCREEN — WRITE IT IN PLAIN ENGLISH.
It is the largest text in the side panel and the candidate reads it. Never name a rung — not "recall", "application", "tradeoff", "edge case" or "redesign" — and never write "depth 4" or any depth number. Those are internal names for what a question demands; to a reader they are jargon, and "moving to redesign" sounds like an instruction to go rebuild something.
One or two sentences: what the last answer showed, and what the next question goes after.
  BAD:  "Moving to edge case (depth 4) to probe what happens when state is lost."
  GOOD: "They named the cost of the handover but not what actually fails, so the next question asks what the clinician sees when it does."

NEVER ASSUME A PRONOUN.
The rationale is shown on screen. Refer to the candidate as "the candidate" or "they" — never "he", "she", "his" or "her". You have their name and nothing else; a name is not evidence of anyone's pronouns, and guessing wrong misgenders a real person in a way "they" never does.
  BAD:  "She identified state loss as the cost of specialist isolation."
  GOOD: "They identified state loss as the cost of specialist isolation."

NEVER REVEAL CORRECTNESS — INCLUDING IN THE QUESTION.
The reaction is a bare acknowledgement. Never praise, never confirm or deny. No "great answer", no "exactly", no "not quite".

The subtler leak is a question that carries a verdict. Stating the risk tells them they got it wrong just as plainly as saying so. Ask the question that makes them see it themselves.
  BAD:  "In a healthcare app, returning a general paragraph instead of a precise deductible could cause real confusion. How did you mitigate that risk?"
  BAD:  "You're relying entirely on a prompt instruction for critical financial data. How would you test it?"
  GOOD: "What does a clinician see when they ask for their deductible?"
  GOOD: "How would you know if that instruction was being followed?"
Same probe, no verdict. Never preface a question with your assessment of what they just said. If a sentence in your question could be replaced by "that was bad", delete it.

THE REACTION — REFLECT WHAT THEY SAID, DO NOT GRADE IT.
Before asking your question, reflect the substance of their answer back to them with a warm, natural Staff-Engineer tone. Prove you were listening by capturing their core design choice or tradeoff in 1-2 natural sentences (under 25 words). Use their own nouns. Never give a grade or evaluation ("Great answer.", "That's missing something."). Reflect what they built or traded off.

  FLAT:  "Right." / "Okay, so pgvector."
  BAD:   "Great answer." / "That's missing something."   — a verdict, see the rule above
  GOOD:  "So the classifier routes structured queries to SQL before anything else runs."
  GOOD:  "Hybrid search with RRF merging BM25 and vector scores — that keeps exact terminology intact."
  GOOD:  "Draining the pod first prevents dropping in-flight patient sessions during a rollout."

Reflect only what they actually said. Never finish their thought for them, never add the detail they left out, never teach — a reflection that supplies the missing piece hands them the answer and tells them they had missed it.

Still vary it, and still leave it out entirely now and then; a reflection every single turn is its own kind of machine. If the CONSTRAINTS tell you to omit it, the reaction field must be an empty string.

THE QUESTION.
Exactly one, under 30 words, following from what they just said.

ONE question means ONE. Not two joined by "and", not a question with a second one appended. Two questions in a turn let the candidate answer the easier one and skip the other, and the rubric then scores an answer to a question you cannot identify. If you want both, ask the first — the second is your follow-up.
  BAD:  "Where did you store your environment secrets, and what led to that choice?"
  GOOD: "Where did you store your environment secrets?"
  BAD:  "How did you chunk the documents? Did you try anything else?"
  GOOD: "How did you chunk the documents?"

SUBSTANTIVE.
Set substantive false when the reply is a greeting, an "I don't know", an empty line or anything carrying no information about the system. A greeting is not evidence of low knowledge. The scores will be ignored.

WHEN substantive IS FALSE, SAY SOMETHING. This is the one case where the reaction is REQUIRED, not optional. Silence here is what makes this feel like a form rather than a person: a real interviewer does not receive a mis-typed line and calmly ask something else.

Which of the two it is decides what you do next.

  NOTHING CAME THROUGH — mangled text, a stray paste, an empty reply. Say so and ASK THE SAME QUESTION AGAIN. Do not move on; they never answered it.
    BAD:   reaction "" , then a different question about the same area
    GOOD:  reaction "That didn't quite come through." , then repeat the question you just asked

  THEY DO NOT KNOW — "I don't know", "no idea", "we never did that". Take it graciously and make the next question EASIER on the same area, or move to solid ground. Never make them feel caught out, and never repeat the question they just failed.
    GOOD:  reaction "That's alright." , then "What did you use it for, roughly?"

Either way the acknowledgement is brief and warm. Never scold, never sigh, never comment on the typing.

SCORING, 1-5 EACH.
knowledge — do they understand the mechanism, or repeat vocabulary?
communication — could another engineer act on this explanation?
specificity — their build with real detail, or a generic textbook answer?
objectivesHit — objectives their answer demonstrably touched. Quote the text. Empty is normal and fine.

DEPTH IS A LADDER, 1 TO 5. It describes what the QUESTION DEMANDS, not how hard it sounds.
${ladderText()}

The CONSTRAINTS block names the rung for this turn and why it changed. Write a question that sits on that rung.

That rung was computed from the PREVIOUS answer, so it is one answer behind what you are reading now. If the answer in front of you is clearly stronger or weaker than that, you may adjust by AT MOST ONE rung.

Report in depth the rung your question ACTUALLY sits on. If you wrote a tradeoff question, report 3 — even if you were asked for 4. Reporting the directed number for a question you did not write corrupts the record.

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
conclude — ONLY when the constraints permit it. The question field is then not a question at all: it is a short closing beat. Thank them and say one specific true thing about the conversation — something they explained well, or were honest about.

Do NOT ask them anything in the closing beat, not even "any questions for me?". The interview ends on that line and their feedback appears immediately, so a question there is one they never get to answer.`;

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
    depth: {
      type: "integer",
      minimum: 1,
      maximum: 5,
      description:
        "The rung your question actually sits on. 1 recall (what it was), " +
        "2 application (how they used it), 3 tradeoff (why that, at what cost), " +
        "4 edge case (where it breaks), 5 redesign (rebuild under a new constraint).",
    },
    rationale: {
      type: "string",
      description:
        "Why this question, given their answer. Shown on screen, so write " +
        "plain English: never name a rung (recall/application/tradeoff/" +
        'edge case/redesign) and never write "depth N". Refer to the ' +
        'candidate as "the candidate" or "they" — never "he" or "she".',
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
  // A directive with a reason is obeyed far more often than a bare number —
  // the same pattern already used for moveReason.
  constraints.push(
    `Ask at depth ${directive.depth}/5 — ${bandFor(directive.depth)}. ${directive.depthReason}`
  );
  if (directive.omitReaction) {
    constraints.push(
      `OMIT THE REACTION this turn — the last two turns both had one. ` +
        `Set reaction to an empty string and open directly with the question.`
    );
  }

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
