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

THIS IS A LEARNING TOOL. Nobody is being hired or rejected. The reader is a person who just spent time explaining work they are proud of, to someone who kept pushing. Write for them, not about them.

TONE.
Direct and specific, warm without being soft. No grade, no verdict, no score. Never "you failed to" or "you should have". Say what happened and what to do next. They should finish reading it wanting to go and build something, not wanting to hide.

QUOTE THEM. THIS IS THE CORE REQUIREMENT.
Every strength MUST contain at least one direct quote of the candidate's own words, in double quotes, copied EXACTLY as they said it. Every gap MUST do the same wherever they actually spoke to the topic — quote the vague sentence, the hand-wave, the thing they could not pin down.

Copy quotes character for character from the transcript. Do not tidy grammar, do not paraphrase inside quote marks, do not merge two sentences into one quote. A quote that is not verbatim will be rejected and you will be asked again.

THE ONE EXCEPTION: if a gap is that a topic never came up at all, you cannot quote silence. Say so plainly — "evaluation never came up in this conversation" — and do not invent a quote to satisfy the rule. An honest unquoted gap beats a fabricated quoted one.

SUMMARY.
2-4 sentences on how the interview actually went. Name the system they built. Reference the specific things they explained well and where the explanation thinned out. Not a score, a portrait.

Stop when the facts stop. Do not close with a clause that restates the record or grades the whole thing — "matching the consistent technical understanding shown throughout your cohort record" says nothing, and a separate section already makes that comparison properly. The last sentence should carry as much information as the first.

PLAIN WORDS.
The interview climbs a five-rung ladder internally and those rungs have names. NEVER use them to describe how the candidate did: not "recall", "application", "tradeoff", "edge case", or "redesign", and never "reached X level" or "stayed at X".

Those words name what a QUESTION demanded, not how well someone answered. Used as a result they read backwards — "reached redesign" is the BEST outcome and lands on the reader as "you need to redesign this"; "stayed at tradeoff" lands as "you got stuck". Say what the person could and could not do instead: "you explained your choices and what they cost, but we did not get to where your approach breaks down."

You may use these words in their ordinary English sense — discussing an actual trade-off in their system is fine. What is banned is using them as a label for performance.

STRENGTHS. AN EMPTY LIST IS A REAL ANSWER.
What they demonstrably showed, each anchored to a direct quote. Not "good communication" but: explained the retrieval fallback clearly — "if nothing clears the threshold we return a fallback saying we don't have that information".

There is no minimum. If the transcript contains nothing they demonstrably explained — they typed filler, they answered nothing, everything was a hand-wave — return an EMPTY strengths list and let the gaps and next steps carry the report. Do not reach for the nearest thing that can be phrased kindly.

The things that are NOT strengths, however true they are: showing up, answering all the questions, staying engaged, being honest that they did not know, writing at length, being willing to learn. None of those are the candidate explaining their system, which is the only thing this list is for. "You worked through all ten questions" tells a person who understood nothing that they did fine, and that is the one outcome this whole report exists to prevent.

Effort is not evidence. Length is not evidence. Confidence is not evidence. A quote is evidence — and if you cannot find one, say nothing here.

GAPS.
Where the explanation did not hold up, phrased as what is missing rather than what is wrong. A gap is a thing they have not learned to say yet, not a defect. If they hand-waved, quote the hand-wave. Be honest — vague feedback helps nobody — but never sneer.

A gap is about the SYSTEM or the understanding, never about the candidate having noticed something. If they named their own weak spot, that is credit, not a demerit — write the gap as the weakness itself and let the quote show they already see it. "Your classifier fallback is guesswork, and you know it: <quote>" is a gap. "You identified the limitations of your fallback" is a strength wearing a gap's heading, and under a heading called Gaps it reads as a black mark for being self-aware.

NEXT.
Concrete actions. Something they could do this week on the system they already have. "Write down the three retrieval failures you saw and what you'd change" beats "study RAG more". Point at their build, not a curriculum.

EVERY next item must name the AREA it belongs to, using the exact title from AREAS COVERED below, and lead with it. Format: "Conversation Memory & Context Management — refactor message storage to key by session id, then test with two browsers at once." This is the one place day numbers and cohort titles ARE welcome: they are going back to their own repo, and naming the area is how they find it. Order the items so the weakest area comes first.

THEIR COHORT RECORD.
You are given what the 31-day record said before the interview started, and what the interview reached. Where those disagree, say so plainly in the summary — "you needed several attempts on most of this, but explained the memory trade-off better than that suggests" is worth more than either fact alone. Where they agree, do not labour it.

${ANTI_INVENTION}

Here, "the input" is the transcript, claim ledger and rubric scores below. If a topic never came up, do not write about it as though it did.`;

export const REPORTER_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    // NO minItems. It used to be 1, and that single number is what made the
    // report congratulate a candidate who had said nothing: the schema
    // demanded a strength, the transcript contained none, so the model
    // invented one. Exactly the shape ANTI_INVENTION exists to stop, enforced
    // by the schema against the prompt. An empty array is a valid report.
    strengths: {
      type: "array",
      items: {
        type: "string",
        description:
          "Must contain a verbatim quote of the candidate in double quotes. " +
          "Omit entirely rather than inventing one — an empty array is valid.",
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
  /** Areas actually reached, deepest first — the titles `next` must cite. */
  topics?: Array<{ day: number; title: string; band: string; depthReached: number; questionsAsked: number }>;
  /** What the record predicted vs what the hour showed. Null when nothing
   *  was asked — there is then no observation to compare against. */
  comparison?: { record: string; interview: string; alignment: string; note: string } | null;
  /** The FULL transcript — the reporter is the one prompt that gets it. */
  transcript: Turn[];
  /** Already filtered by filterInventedClaims upstream. */
  claimLedger: Claim[];
  rubrics: Array<{ day: number; depth: number; rubric: TurnRubric }>;
  daysCovered: number[];
  questionCount: number;
  /** True when the CANDIDATE stopped rather than the interview concluding. */
  endedEarly?: boolean;
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
    ctx.endedEarly ? `HOW THIS ENDED` : `INTERVIEW`,
    ctx.endedEarly
      ? `The candidate chose to end the session themselves after ` +
        `${ctx.questionCount} answer(s)${ctx.daysCovered.length ? ` across days ${ctx.daysCovered.join(", ")}` : ""}. ` +
        `The plan was ${ctx.blueprint.targetQuestions} questions; most of it never happened. ` +
        `Write only about what they did explain. Do not imply they finished, do not imply ` +
        `they gave up, do not speculate about why they stopped, and do not mention the ` +
        `questions that were never asked.`
      : `${ctx.questionCount} questions across days ${ctx.daysCovered.join(", ")}.`,
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
    `AREAS COVERED — use these exact titles in `+"`next`"+`, weakest first`,
    // The rung NAME is withheld on purpose. Handing over "redesign" invites
    // the model to write "you reached redesign level", which reads as
    // criticism when it is the best possible result. The number carries the
    // same information without the loaded word.
    ctx.topics?.length
      ? ctx.topics
          .map(
            (t) =>
              `- ${t.title} — depth ${t.depthReached} of 5 over ${t.questionsAsked} question(s)`
          )
          .join("\n")
      : "(none)",
    ``,
    `COHORT RECORD vs THIS INTERVIEW`,
    ctx.comparison
      ? `Record:    ${ctx.comparison.record}\nInterview: ${ctx.comparison.interview}\nVerdict:   ${ctx.comparison.alignment} — ${ctx.comparison.note}`
      : "(not available)",
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

/** Quoted spans in `text` that no candidate turn supports. */
export function fabricatedQuotes(text: string, normalisedSaid: string): string[] {
  return extractQuotes(text).filter((q) => !normalisedSaid.includes(normaliseQuote(q)));
}

export interface Degradation {
  droppedStrengths: string[];
  droppedGaps: string[];
  summaryReplaced: boolean;
  droppedNext: string[];
  /** True when nothing survived and an honest unquoted line was emitted. */
  strengthsBackfilled: boolean;
}

const daysPhrase = (days: number[]) =>
  days.length ? ` across days ${days.join(", ")}` : "";

/** A grounded sentence built only from state — invents nothing. */
function factualSummary(ctx: ReportContext): string {
  const n = ctx.questionCount;
  const name = ctx.candidate.member.name;

  // "answered 0 questions" is the one-click case: End on the opening line.
  // There is nothing to report on, so say that rather than reporting zero.
  if (n === 0) {
    return `${name} started this session but had not answered anything yet, so there is nothing to give feedback on.`;
  }

  return (
    `${name} answered ${n} question${n === 1 ? "" : "s"}` +
    `${daysPhrase(ctx.daysCovered)} of the cohort build.`
  );
}

/**
 * Last resort after two failed attempts: keep everything that validated,
 * drop only what did not, and always return a usable report.
 *
 * Returning nothing is the worst outcome available — the API contract
 * requires a feedback object, and a candidate who answered ten questions
 * has earned a response. A thinner honest report beats an error.
 */
export function degradeReport(
  feedback: Feedback | null,
  ctx: ReportContext
): { feedback: Feedback; degradation: Degradation } {
  // A null report is the total-failure case: the model never returned
  // anything usable. Everything below then falls through to the factual
  // fallbacks, which is exactly right.
  feedback = feedback ?? { summary: "", strengths: [], gaps: [], next: [] };
  const said = normaliseQuote(candidateTranscriptText(ctx.transcript));

  const strengths = (feedback.strengths ?? []).filter(
    (s) => fabricatedQuotes(s, said).length === 0 && extractQuotes(s).length > 0
  );
  const droppedStrengths = (feedback.strengths ?? []).filter(
    (s) => !strengths.includes(s)
  );

  // Unquoted gaps are legitimate; only fabricated ones go.
  const gaps = (feedback.gaps ?? []).filter(
    (g) => fabricatedQuotes(g, said).length === 0
  );
  const droppedGaps = (feedback.gaps ?? []).filter((g) => !gaps.includes(g));

  const next = (feedback.next ?? []).filter(
    (n) => fabricatedQuotes(n, said).length === 0
  );
  const droppedNext = (feedback.next ?? []).filter((n) => !next.includes(n));

  const summaryBad =
    !feedback.summary || fabricatedQuotes(feedback.summary, said).length > 0;
  const summary = summaryBad ? factualSummary(ctx) : feedback.summary;

  // NOTHING is backfilled here any more.
  //
  // This used to push "You worked through all N questions ... and stayed with
  // each one" whenever no strength survived. It reads as praise, it is
  // reachable by a candidate who typed filler for the whole hour, and it was
  // the loudest thing on the screen for exactly the person who most needed to
  // be told otherwise. Turning up is not a strength.
  //
  // An empty strengths list is contract-valid — `strengths[]` may be empty —
  // and Report.tsx hides the panel rather than rendering an empty box, so the
  // honest outcome is also the one that looks right.
  const strengthsBackfilled = false;

  if (next.length === 0) {
    next.push(
      ctx.daysCovered.length
        ? `Re-read your own answers on days ${ctx.daysCovered.join(", ")} and write ` +
          `down the one thing you wish you had been able to explain more precisely.`
        : `Pick the part of your build you understand least and write down what ` +
          `you would ask someone who knew it well.`
    );
  }

  return {
    feedback: { summary, strengths, gaps, next },
    degradation: {
      droppedStrengths,
      droppedGaps,
      summaryReplaced: summaryBad,
      droppedNext,
      strengthsBackfilled,
    },
  };
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
    onDegrade?: (d: Degradation) => void;
    thinking?: Parameters<typeof callLLM>[0]["thinking"];
  } = {}
): Promise<Feedback> {
  let correction = "";
  let last: Feedback | null = null;
  let lastError: unknown = null;

  // Two attempts. EVERY failure path — a rate limit, a truncated response,
  // unparseable output, a failed verbatim check — falls through to
  // degradation. This function must never throw: the API contract requires
  // a feedback object, and a candidate who answered a full interview has
  // earned a response even if the model could not produce one.
  for (let attempt = 0; attempt < 2; attempt++) {
    let feedback: Feedback;
    try {
      feedback = await callLLM<Feedback>({
        role: "reporter",
        system: REPORTER_SYSTEM,
        input: buildReporterInput(ctx, correction),
        schema: REPORTER_SCHEMA as unknown as Record<string, unknown>,
        onUsage: opts.onUsage,
        model: opts.model,
        maxWaitMs: opts.maxWaitMs,
        thinking: opts.thinking,
      });
    } catch (err) {
      lastError = err;
      const kind = err instanceof LLMError ? err.kind : "unknown";
      console.warn(
        `[reporter] attempt ${attempt + 1} failed (${kind}): ` +
          `${err instanceof Error ? err.message : String(err)}`
      );
      correction = "";
      continue;
    }

    last = feedback;
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
    }
  }

  // Degrade with no further model call.
  const { feedback, degradation } = degradeReport(last, ctx);

  console.warn(
    `[reporter] DEGRADED — ` +
      (last === null
        ? `no usable response from the model (${
            lastError instanceof Error ? lastError.message : "unknown error"
          }); report built from session state alone`
        : `dropped ${degradation.droppedStrengths.length} strength(s), ` +
          `${degradation.droppedGaps.length} gap(s), ` +
          `${degradation.droppedNext.length} next item(s)` +
          `${degradation.summaryReplaced ? ", summary replaced" : ""}` +
          `${degradation.strengthsBackfilled ? ", strengths backfilled" : ""}`)
  );
  opts.onDegrade?.(degradation);

  return feedback;
}
