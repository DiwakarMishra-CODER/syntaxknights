import { callLLM } from "../llm";
import type { Blueprint, Candidate, Claim, Feedback } from "../types";
import { ANTI_INVENTION } from "./shared";
import type { TurnRubric } from "./turn";

/**
 * Runs ONCE at the end. Produces the feedback block in the API contract.
 *
 * Token discipline: never sends the full transcript. It gets the claim
 * ledger (which already summarises everything said), the per-turn rubric
 * scores, and the plan — enough to judge the interview without replaying it.
 */

/** Byte-identical across calls. */
export const REPORTER_SYSTEM = `You write the feedback a candidate receives after a practice technical interview. They are a graduate of a 31-day AI engineering cohort that builds one system end to end: an enterprise healthcare chatbot.

THIS IS A LEARNING TOOL. Nobody is being hired or rejected. The reader is a person who just spent an hour explaining work they are proud of, to someone who kept pushing. Write for them, not about them.

TONE.
Direct and specific, warm without being soft. No grade, no verdict, no score. Never "you failed to" or "you should have". Say what happened and what to do next. They should finish reading it wanting to go and build something, not wanting to hide.

SUMMARY.
2-4 sentences on how the interview actually went. Name the system they built. Reference the specific things they explained well and where the explanation thinned out. Not a score, a portrait.

STRENGTHS.
What they demonstrably showed. Each one anchored to something they actually said or built — not "good communication" but "explained the retrieval fallback clearly, including why the threshold was arbitrary".

GAPS.
Where the explanation did not hold up, phrased as what is missing rather than what is wrong. A gap is a thing they have not learned to say yet, not a defect. If they hand-waved, name the thing they hand-waved. Be honest — vague feedback helps nobody — but never sneer.

NEXT.
Concrete actions. Something they could do this week on the system they already have. "Write down the three retrieval failures you saw and what you'd change" beats "study RAG more". Point at their build, not a curriculum.

${ANTI_INVENTION}

Here, "the input" is the claim ledger and rubric scores below. If a topic never came up, do not write about it. Never invent a strength they did not show or a gap you did not observe.`;

export const REPORTER_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" }, minItems: 1 },
    gaps: { type: "array", items: { type: "string" } },
    next: { type: "array", items: { type: "string" }, minItems: 1 },
  },
  required: ["summary", "strengths", "gaps", "next"],
} as const;

export interface ReportContext {
  candidate: Candidate;
  blueprint: Blueprint;
  claimLedger: Claim[];
  /** One entry per answered turn, in order. */
  rubrics: Array<{ day: number; depth: number; rubric: TurnRubric }>;
  daysCovered: number[];
  questionCount: number;
}

export function buildReporterInput(ctx: ReportContext): string {
  const m = ctx.candidate.member;

  const scores = ctx.rubrics.length
    ? ctx.rubrics
        .map(
          (r, i) =>
            `Q${i + 1} day ${r.day} depth ${r.depth}: knowledge ${r.rubric.knowledge}, ` +
            `communication ${r.rubric.communication}, specificity ${r.rubric.specificity}` +
            (r.rubric.objectivesHit.length
              ? `\n    objectives touched: ${r.rubric.objectivesHit.join("; ")}`
              : "")
        )
        .join("\n")
    : "(no answers scored)";

  const avg = (pick: (r: TurnRubric) => number) =>
    ctx.rubrics.length
      ? (ctx.rubrics.reduce((s, r) => s + pick(r.rubric), 0) / ctx.rubrics.length).toFixed(1)
      : "n/a";

  const ledger = ctx.claimLedger.length
    ? ctx.claimLedger
        .map((c) => `- day ${c.day}: ${c.text}${c.unjustified ? "  [asserted without detail]" : ""}`)
        .join("\n")
    : "(nothing claimed)";

  return [
    `CANDIDATE`,
    `${m.name} — ${m.jobRole}, ${m.yearsExperience} years, ${m.education}`,
    ``,
    `INTERVIEW`,
    `${ctx.questionCount} questions across days ${ctx.daysCovered.join(", ")}.`,
    `Planned focus: ${ctx.blueprint.focusDays
      .map((f) => `day ${f.day} ${f.title} (${f.strategy})`)
      .join("; ")}`,
    ``,
    `SCORES PER ANSWER (1-5)`,
    scores,
    ``,
    `AVERAGES: knowledge ${avg((r) => r.knowledge)}, communication ${avg(
      (r) => r.communication
    )}, specificity ${avg((r) => r.specificity)}`,
    ``,
    `CLAIM LEDGER — everything they asserted about their system`,
    ledger,
    ``,
    `TASK`,
    `Write their feedback.`,
  ].join("\n");
}

export async function writeReport(
  ctx: ReportContext,
  opts: {
    onUsage?: Parameters<typeof callLLM>[0]["onUsage"];
    model?: string;
    maxWaitMs?: number;
  } = {}
): Promise<Feedback> {
  return callLLM<Feedback>({
    role: "reporter",
    system: REPORTER_SYSTEM,
    input: buildReporterInput(ctx),
    schema: REPORTER_SCHEMA as unknown as Record<string, unknown>,
    onUsage: opts.onUsage,
    model: opts.model,
    maxWaitMs: opts.maxWaitMs,
  });
}
