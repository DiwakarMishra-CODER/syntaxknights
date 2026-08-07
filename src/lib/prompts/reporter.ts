import { callLLM, LLMError } from "../llm";
import type { Blueprint, Candidate, Claim, Feedback, Turn, TurnRubric } from "../types";
import { ANTI_INVENTION } from "./shared";

/**
 * Runs ONCE at the end. Produces the feedback block in the API contract.
 *
 * The reporter DOES receive the full transcript, unlike every per-turn
 * prompt. Feedback has to quote the candidate back to themselves to be
 * worth reading, and a verbatim check has nothing to check against
 * without the source text. Withholding the transcript never made the
 * reporter safe — ANTI_INVENTION plus verbatim validation does. This is
 * one call per session, so the token cost is paid once.
 */

/** Byte-identical across calls, including the retry. */
export const REPORTER_SYSTEM = `You write the feedback a candidate receives after a practice technical interview. They are a graduate of a 31-day AI engineering cohort that builds one system end to end: an enterprise healthcare chatbot.

THIS IS A LEARNING TOOL. Nobody is being hired or rejected. The reader is a person who just spent an hour explaining work they are proud of, to someone who kept pushing. Write for them, not about them.

TONE.
Direct and specific, warm without being soft. No grade, no verdict, no score. Never "you failed to" or "you should have". Say what happened and what to do next. They should finish reading it wanting to go and build something, not wanting to hide.

QUOTE THEM. THIS IS THE CORE REQUIREMENT.
Every strength MUST contain at least one direct quote of the candidate's own words, in double quotes, copied EXACTLY as they said it. Every gap MUST do the same wherever they actually spoke to the topic — quote the vague sentence, the hand-wave, the thing they could not pin down.

Copy quotes character for character from the transcript. Do not tidy grammar, do not paraphrase inside quote marks, do not merge two sentences into one quote. A quote that is not verbatim will be rejected and you will be asked again.

THE ONE EXCEPTION: if a gap is that a topic never came up at all, you cannot quote silence. Say so plainly — "evaluation never came up in this conversation" — and do not invent a quote to satisfy the rule. An honest unquoted gap beats a fabricated quoted one.

SUMMARY.
2-4 sentences on how the interview actually went. Name the system they built. Reference the specific things they explained well and where the explanation thinned out. Not a score, a portrait.

STRENGTHS.
What they demonstrably showed, each anchored to a direct quote. Not "good communication" but: explained the retrieval fallback clearly — "if nothing clears the threshold we return a fallback saying we don't have that information".

GAPS.
Where the explanation did not hold up, phrased as what is missing rather than what is wrong. A gap is a thing they have not learned to say yet, not a defect. If they hand-waved, quote the hand-wave. Be honest — vague feedback helps nobody — but never sneer.

NEXT.
Concrete actions. Something they could do this week on the system they already have. "Write down the three retrieval failures you saw and what you'd change" beats "study RAG more". Point at their build, not a curriculum.

${ANTI_INVENTION}

Here, "the input" is the transcript, claim ledger and rubric scores below. If a topic never came up, do not write about it as though it did.`;

export const REPORTER_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    strengths: {
      type: "array",
      minItems: 1,
      items: {
        type: "string",
        description: "Must contain a verbatim quote of the candidate in double quotes.",
      },
    },
    gaps: { type: "array", items: { type: "string" } },
    next: { type: "array", items: { type: "string" }, minItems: 1 },
  },
  required: ["summary", "strengths", "gaps", "next"],
} as const;

export interface ReportContext {
  candidate: Candidate;
  blueprint: Blueprint;
  /** The FULL transcript — the reporter is the one prompt that gets it. */
  transcript: Turn[];
  /** Already filtered by filterInventedClaims upstream. */
  claimLedger: Claim[];
  rubrics: Array<{ day: number; depth: number; rubric: TurnRubric }>;
  daysCovered: number[];
  questionCount: number;
}

/** Everything the candidate actually said, the only quotable source. */
export function candidateTranscriptText(transcript: Turn[]): string {
  return transcript
    .filter((t) => t.role === "candidate")
    .map((t) => t.content)
    .join("\n");
}

export function buildReporterInput(ctx: ReportContext, correction = ""): string {
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

  const transcript = ctx.transcript
    .map((t) => `${t.role === "candidate" ? "CANDIDATE" : "INTERVIEWER"}: ${t.content}`)
    .join("\n\n");

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
    `FULL TRANSCRIPT — quote ONLY from the CANDIDATE lines below`,
    transcript,
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
    correction ? `\nCORRECTION REQUIRED\n${correction}` : ``,
    ``,
    `TASK`,
    `Write their feedback.`,
  ]
    .filter((l) => l !== ``)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Verbatim quote validation
// ---------------------------------------------------------------------------

/** Quoted spans, straight or curly, of at least a few characters. */
export function extractQuotes(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/[“"]([^”"]{4,})[”"]/g)) out.push(m[1]);
  return out;
}

/**
 * Words must match in order. Whitespace is collapsed and case ignored so a
 * sentence-initial capital does not fail an otherwise exact quote, but no
 * word may be added, dropped or changed.
 */
function normaliseQuote(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ReportCheck {
  ok: boolean;
  /** Quotes that appear in no candidate turn. */
  fabricated: string[];
  /** Strengths with no quote at all. */
  unquotedStrengths: string[];
  /** Gaps with no quote — a warning, not a failure. See note below. */
  unquotedGaps: string[];
}

/**
 * A gap can legitimately describe something that never came up, and silence
 * cannot be quoted — so a missing quote in a gap is reported but does not
 * fail the report. Forcing a quote there would manufacture the exact
 * invention this guard exists to prevent.
 */
export function verifyReport(feedback: Feedback, transcript: Turn[]): ReportCheck {
  const said = normaliseQuote(candidateTranscriptText(transcript));

  const fabricated: string[] = [];
  const check = (text: string) => {
    const quotes = extractQuotes(text);
    for (const q of quotes) {
      if (!said.includes(normaliseQuote(q))) fabricated.push(q);
    }
    return quotes.length > 0;
  };

  const unquotedStrengths = (feedback.strengths ?? []).filter((s) => !check(s));
  const unquotedGaps = (feedback.gaps ?? []).filter((g) => !check(g));
  check(feedback.summary ?? "");
  for (const n of feedback.next ?? []) check(n);

  return {
    ok: fabricated.length === 0 && unquotedStrengths.length === 0,
    fabricated,
    unquotedStrengths,
    unquotedGaps,
  };
}

export class ReportError extends Error {
  readonly check: ReportCheck;
  constructor(message: string, check: ReportCheck) {
    super(message);
    this.name = "ReportError";
    this.check = check;
  }
}

function correctionFor(check: ReportCheck): string {
  const lines: string[] = [];
  if (check.fabricated.length) {
    lines.push(
      `These quotes do NOT appear anywhere in the candidate's words. Remove them or replace them with real quotes copied exactly from the CANDIDATE lines:`
    );
    for (const q of check.fabricated) lines.push(`  - "${q}"`);
  }
  if (check.unquotedStrengths.length) {
    lines.push(`These strengths contain no direct quote. Every strength needs one:`);
    for (const s of check.unquotedStrengths) lines.push(`  - ${s}`);
  }
  return lines.join("\n");
}

export async function writeReport(
  ctx: ReportContext,
  opts: {
    onUsage?: Parameters<typeof callLLM>[0]["onUsage"];
    model?: string;
    maxWaitMs?: number;
  } = {}
): Promise<Feedback> {
  let correction = "";

  // One retry: the first failure is usually a tidied-up quote, and being
  // shown the exact offending strings fixes it.
  for (let attempt = 0; attempt < 2; attempt++) {
    const feedback = await callLLM<Feedback>({
      role: "reporter",
      system: REPORTER_SYSTEM,
      input: buildReporterInput(ctx, correction),
      schema: REPORTER_SCHEMA as unknown as Record<string, unknown>,
      onUsage: opts.onUsage,
      model: opts.model,
      maxWaitMs: opts.maxWaitMs,
    });

    const check = verifyReport(feedback, ctx.transcript);

    if (check.unquotedGaps.length) {
      console.warn(
        `[reporter] ${check.unquotedGaps.length} gap(s) carry no quote — allowed, ` +
          `a gap may describe something that never came up`
      );
    }

    if (check.ok) return feedback;

    if (attempt === 0) {
      console.warn(
        `[reporter] rejected: ${check.fabricated.length} fabricated quote(s), ` +
          `${check.unquotedStrengths.length} unquoted strength(s). Retrying once.`
      );
      correction = correctionFor(check);
      continue;
    }

    throw new ReportError(
      `Report failed verbatim validation twice. Fabricated quotes: ` +
        `${check.fabricated.map((q) => `"${q}"`).join(", ") || "none"}. ` +
        `Unquoted strengths: ${check.unquotedStrengths.length}.`,
      check
    );
  }

  throw new LLMError("malformed_output", "reporter: unreachable", "reporter");
}
