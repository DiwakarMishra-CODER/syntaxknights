import { findDay } from "./curriculum";
import { bandFor } from "./depth";
import { COHORT_DAYS, type Claim, type FocusDay, type Turn } from "./types";

/**
 * What the candidate sees at the end, derived entirely from turns already
 * stored. No score: a single number would tell them which answers were wrong
 * after an interview built so they could not infer that, and it would imply a
 * precision the rubric cannot back.
 *
 * Instead: how far they got in each area, and what they asserted without
 * being able to back it. Both are specific, both are actionable, and neither
 * is a grade.
 *
 * Pure. No I/O.
 */

export interface TopicReach {
  day: number;
  title: string;
  questionsAsked: number;
  /** Deepest rung reached on this topic. A property of the QUESTIONS. */
  depthReached: number;
  band: string;
  /** Answers on this topic that were actually scored. */
  answered: number;
  /** Mean knowledge across those answers, or null if none were scored. */
  knowledgeAvg: number | null;
}

/**
 * Mean knowledge score per day, from answers correctly paired to their score.
 *
 * The pairing is the whole point and it is off-by-one in the obvious reading:
 * an interviewer turn carries the rubric for the answer BEFORE it and the
 * targetDay of the question AFTER it. Attributing a turn's own rubric to its
 * own targetDay scores every answer against the wrong topic.
 *
 * Answers the model marked non-substantive have a null rubric and contribute
 * nothing — a topic where the candidate only ever typed filler ends with an
 * empty list, which is why `knowledgeAvg` is nullable rather than defaulted.
 */
function knowledgeByDay(turns: Turn[]): Map<number, number[]> {
  const out = new Map<number, number[]>();
  let questionDay: number | null = null;
  let awaitingDay: number | null = null;

  for (const t of turns) {
    if (t.role === "interviewer") {
      if (awaitingDay !== null && t.rubric) {
        const scores = out.get(awaitingDay) ?? [];
        scores.push(t.rubric.knowledge);
        out.set(awaitingDay, scores);
      }
      awaitingDay = null;
      questionDay = t.targetDay;
    } else if (t.role === "candidate" && questionDay !== null) {
      awaitingDay = questionDay;
      questionDay = null;
    }
  }

  return out;
}

/**
 * One row per area actually discussed, ordered by how well the candidate
 * explained it.
 *
 * It used to be ordered — and labelled — by `depthReached`, which is the
 * deepest rung the INTERVIEWER's questions sat on. That measures the
 * interview, not the candidate: a topic where every answer was gibberish
 * still reported the depth of the questions asked about it, and the report
 * rendered that as an achievement. Depth is still carried, because "we never
 * got past the basics here" is worth saying — but it no longer decides the
 * order, the label, or the bar.
 */
export function topicsReached(turns: Turn[], focusDays: FocusDay[] = []): TopicReach[] {
  const byDay = new Map<number, { count: number; max: number }>();

  for (const t of turns) {
    if (t.role !== "interviewer") continue;
    if (t.targetDay === null || t.depth === null) continue;
    // The opening line is not a question — it carries no rubric.
    if (t.rubric === null && t.rationale === "opening line from the blueprint") continue;

    const entry = byDay.get(t.targetDay) ?? { count: 0, max: 0 };
    entry.count += 1;
    entry.max = Math.max(entry.max, t.depth);
    byDay.set(t.targetDay, entry);
  }

  const scores = knowledgeByDay(turns);

  const titleFor = (day: number) =>
    focusDays.find((f) => f.day === day)?.title ?? findDay(day)?.title ?? `Day ${day}`;

  return [...byDay.entries()]
    .map(([day, { count, max }]) => {
      const marks = scores.get(day) ?? [];
      return {
        day,
        title: titleFor(day),
        questionsAsked: count,
        depthReached: max,
        band: bandFor(max),
        answered: marks.length,
        knowledgeAvg: marks.length
          ? marks.reduce((s, n) => s + n, 0) / marks.length
          : null,
      };
    })
    // Best-explained first. An unscored topic sorts last: it is not a strong
    // result and must never be presented as one.
    .sort(
      (a, b) =>
        (b.knowledgeAvg ?? -1) - (a.knowledgeAvg ?? -1) ||
        b.depthReached - a.depthReached ||
        b.questionsAsked - a.questionsAsked
    );
}

/**
 * What reaching a given rung actually means, in a sentence.
 *
 * The report may NOT name a rung. The ladder's names describe what the
 * QUESTION demanded; used as a result they read backwards — "reached
 * redesign" is the best possible outcome and lands as "you need to redesign
 * this", "stayed at tradeoff" as "you got stuck". Nobody should have to
 * learn a private vocabulary to read their own feedback.
 *
 * The names stay in the panel, where all five are drawn as a scale and the
 * context carries them.
 */
/**
 * These describe what the QUESTIONS went after, and are phrased that way.
 *
 * They used to be phrased as achievements — "Explained the trade-offs" — while
 * still being keyed on question depth. Asking a trade-off question and getting
 * silence produced "Explained the trade-offs". The rung is a fact about the
 * interview, so the sentence now states the interview; how the candidate did
 * is a separate, separately-measured field.
 */
const FINDING: Record<number, string> = {
  1: "Asked what the pieces were",
  2: "Asked how you built it",
  3: "Asked about the trade-offs",
  4: "Asked where it breaks",
  5: "Asked how you would rebuild it",
};

/** Answer quality on a topic, in a word. Null when nothing there was scored. */
export function levelFor(knowledgeAvg: number | null): string | null {
  if (knowledgeAvg === null) return null;
  if (knowledgeAvg >= 4) return "Explained well";
  if (knowledgeAvg >= 3) return "Partly explained";
  return "Not explained yet";
}

export interface TopicFinding {
  day: number;
  title: string;
  finding: string;
  questionsAsked: number;
  /** The rung reached, 1-5 — what the questions demanded. */
  depthReached: number;
  /** Mean knowledge on this topic, or null if no answer here was scored. */
  knowledgeAvg: number | null;
  /** The one-word verdict, or null when there is nothing to base one on. */
  level: string | null;
}

/**
 * One plain sentence per area.
 *
 * Note what the wording deliberately does NOT claim: "we did not get to X"
 * is true whether the candidate plateaued there or the interview ended
 * first. `topicsReached` cannot tell those apart, so the copy must be honest
 * under both — which is why it says what did not happen rather than why.
 */
export function topicFindings(topics: TopicReach[]): TopicFinding[] {
  // "Your strongest area" is a claim about the CANDIDATE, so it is decided by
  // the answer scores. Keyed on depthReached it crowned whichever topic the
  // interviewer happened to push one rung further, even if every answer there
  // scored 1/5.
  const scored = topics.filter((t) => t.knowledgeAvg !== null);
  const top = scored.length ? Math.max(...scored.map((t) => t.knowledgeAvg!)) : null;
  // Comparative, so it needs something to compare against AND a clear winner.
  // One topic, a tie at the top, or nothing scored at all gets no label. It
  // also has to be a result worth naming — "strongest" among answers that were
  // all weak is a ranking, not a strength.
  const soleLeader =
    top !== null &&
    top >= 3 &&
    scored.length > 1 &&
    scored.filter((t) => t.knowledgeAvg === top).length === 1;

  return topics.map((t) => ({
    day: t.day,
    title: t.title,
    questionsAsked: t.questionsAsked,
    depthReached: t.depthReached,
    knowledgeAvg: t.knowledgeAvg,
    level: levelFor(t.knowledgeAvg),
    // Terse on purpose. Two areas reached at the same rung genuinely ARE the
    // same finding, and depth plus question count are the only honest inputs
    // here — so the line is short enough to read as a table row rather than as
    // prose that looks templated. The area-specific detail lives in the
    // model's strengths and gaps, which have the transcript to draw on.
    finding:
      (FINDING[t.depthReached] ?? FINDING[1]) +
      ` — ${t.questionsAsked} question${t.questionsAsked === 1 ? "" : "s"}` +
      (t.answered === 0 ? ". No answer here was scored." : "") +
      (soleLeader && t.knowledgeAvg === top ? ". Your strongest area." : ""),
  }));
}

/**
 * Every question, in order, with how hard it was and why it was asked.
 *
 * All of this used to be on screen DURING the interview, where it leaked the
 * assessment: the rationale is the model's own account of what it is probing,
 * so a candidate reading it is answering a question they have been shown the
 * mark scheme for. After the interview it is the opposite — the single most
 * useful thing the product can tell someone about how they were read.
 *
 * Pure. Built from turns already stored; no extra model call.
 */
export interface TimelineEntry {
  /** 1-based, counting questions only. */
  number: number;
  question: string;
  title: string;
  depth: number;
  band: string;
  /** Why this question followed the previous answer. Null for the opener. */
  rationale: string | null;
  /** True when this question opened a new area. */
  startsTopic: boolean;
}

export function questionTimeline(
  turns: Turn[],
  focusDays: FocusDay[] = []
): TimelineEntry[] {
  const titleFor = (day: number) =>
    focusDays.find((f) => f.day === day)?.title ?? findDay(day)?.title ?? `Day ${day}`;

  const out: TimelineEntry[] = [];
  let previousDay: number | null = null;

  for (const t of turns) {
    if (t.role !== "interviewer") continue;
    if (t.targetDay === null || t.depth === null) continue;

    // The opening line is not a question — it carries no rubric and its
    // "rationale" is a fixed string from the blueprint, not a reaction to
    // anything the candidate said.
    const isOpener = t.rubric === null && t.rationale === "opening line from the blueprint";

    out.push({
      number: out.length + 1,
      question: t.content,
      title: titleFor(t.targetDay),
      depth: t.depth,
      band: bandFor(t.depth),
      rationale: isOpener ? null : t.rationale,
      startsTopic: t.targetDay !== previousDay,
    });
    previousDay = t.targetDay;
  }

  return out;
}

/**
 * Claims the candidate made without supporting detail, de-duplicated.
 *
 * These are already extracted per turn and filtered against the candidate's
 * own words, so every line here is something they actually said. It is the
 * most actionable artifact the interview produces and until now the candidate
 * never saw it.
 */
export function unjustifiedClaims(claims: Claim[]): Claim[] {
  const seen = new Set<string>();
  const out: Claim[] = [];

  for (const c of claims) {
    if (!c.unjustified) continue;
    const key = c.text.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }

  return out;
}

/**
 * Knowing it versus being able to say it.
 *
 * The rubric scores these separately on every answer and the report was
 * blending them into one impression. For a tool whose entire purpose is
 * practising the EXPLAINING, that is the most useful distinction it has.
 *
 * Emits a sentence, never a number. A bare "4.38" with no stated scale is the
 * exact defect just removed from the panel, and this is candidate-facing.
 * Returns null when the two track each other — there is no finding to report.
 */
export const EXPLANATION_GAP = 0.75;

export function explanationSignal(
  rubrics: Array<{ knowledge: number; communication: number }>
): string | null {
  if (rubrics.length < 2) return null;

  const mean = (pick: (r: { knowledge: number; communication: number }) => number) =>
    rubrics.reduce((sum, r) => sum + pick(r), 0) / rubrics.length;

  const gap = mean((r) => r.knowledge) - mean((r) => r.communication);

  if (gap >= EXPLANATION_GAP) {
    return (
      "You knew this better than you explained it. The understanding was " +
      "there; getting it into words took a second pass. That is the part " +
      "worth rehearsing."
    );
  }
  if (-gap >= EXPLANATION_GAP) {
    return (
      "You explained yourself clearly throughout — the answers were easy to " +
      "follow. Where they thinned out was the detail underneath, not the way " +
      "you put it."
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// What the cohort record predicted, against what the interview found
// ---------------------------------------------------------------------------

export type Band = "strong" | "mixed" | "developing";

export interface RecordComparison {
  /** What the 31-day record said before anyone asked a question. */
  record: string;
  /** What the hour actually showed. */
  interview: string;
  expected: Band;
  observed: Band;
  alignment: "consistent" | "outperformed" | "underperformed";
  note: string;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * The 31-day record, addressed to the person who lived it.
 *
 * This used to read `100% of the cohort completed · 100% passed first try`,
 * which states two facts about ONE candidate in words that describe all
 * twenty. A reader learned nothing true from it.
 *
 * Counts are passed in rather than recovered from the ratios: `firstTryRate`
 * is firstTry/completed, so reconstructing it needs two roundings and lands
 * on "30 of 31, 29 first try" style off-by-ones.
 */
function recordLine(input: {
  missionsCompleted: number;
  missionsFirstTry: number;
  skippedDays: number[];
  failedDays: number[];
  struggledDays: number[];
}): string {
  const { missionsCompleted: done, missionsFirstTry: first } = input;

  const parts: string[] = [];
  if (done === 0) {
    parts.push(`You completed none of the ${COHORT_DAYS} days.`);
  } else if (done >= COHORT_DAYS) {
    parts.push(
      first >= done
        ? `You completed all ${COHORT_DAYS} days, every one first try.`
        : `You completed all ${COHORT_DAYS} days, ${first} of them first try.`
    );
  } else {
    parts.push(`You completed ${done} of the ${COHORT_DAYS} days, ${first} first try.`);
  }

  const n = (xs: unknown[], one: string, many: string) =>
    `${xs.length} ${xs.length === 1 ? one : many}`;

  if (input.struggledDays.length)
    parts.push(`${n(input.struggledDays, "day", "days")} took three or more attempts.`);
  if (input.failedDays.length)
    parts.push(`${n(input.failedDays, "day", "days")} you never passed.`);
  if (input.skippedDays.length)
    parts.push(`${n(input.skippedDays, "day", "days")} you skipped.`);

  return parts.join(" ");
}

/** First-try rate is the cohort's own signal of how easily things landed. */
function expectedBand(firstTryRate: number): Band {
  if (firstTryRate >= 0.7) return "strong";
  if (firstTryRate <= 0.25) return "developing";
  return "mixed";
}

/** The interview's own signal, from where the depth walk settled. */
function observedBand(abilityEstimate: number): Band {
  if (abilityEstimate >= 3.5) return "strong";
  if (abilityEstimate <= 2.5) return "developing";
  return "mixed";
}

const ORDER: Band[] = ["developing", "mixed", "strong"];

/**
 * The comparison the cohort data makes possible and a generic interview
 * cannot: this candidate was known before they spoke.
 *
 * Deterministic — no model call, nothing inferred. It states the record, states
 * what the interview reached, and says whether the two agree.
 */
export function compareToRecord(input: {
  firstTryRate: number;
  coverage: number;
  /** Raw counts, not derived from the ratios — see recordLine. */
  missionsCompleted: number;
  missionsFirstTry: number;
  skippedDays: number[];
  failedDays: number[];
  struggledDays: number[];
  abilityEstimate: number;
  topics: TopicReach[];
}): RecordComparison | null {
  // Nothing was asked, so there is nothing to compare the record against.
  // Comparing anyway reports the SEED ability against a real cohort record
  // and announces that someone "explained more than the record predicted"
  // when they explained nothing — reachable in one click via the End button.
  if (input.topics.length === 0) return null;

  const expected = expectedBand(input.firstTryRate);
  const observed = observedBand(input.abilityEstimate);

  const gap = ORDER.indexOf(observed) - ORDER.indexOf(expected);
  const alignment =
    gap > 0 ? "outperformed" : gap < 0 ? "underperformed" : "consistent";

  const record = recordLine(input);

  // This sits under a heading that reads "How You Performed Today", so it has
  // to be about the answers. It used to be built from depthReached and would
  // announce "You reached the deepest level in all 4 areas" whenever the
  // INTERVIEWER had asked hard questions, however they were answered.
  //
  // Topics are sorted best-explained-first, so these are the ends of the range.
  const scored = input.topics.filter((t) => t.knowledgeAvg !== null);
  const best = scored[0];
  const worst = scored[scored.length - 1];

  let interview: string;
  if (scored.length === 0) {
    interview = `Nothing you said in this session could be scored.`;
  } else if (scored.length === 1) {
    interview = `Your interview centred on ${best.title}.`;
  } else if (best.knowledgeAvg! - worst.knowledgeAvg! < 0.5) {
    interview =
      best.knowledgeAvg! >= 4
        ? `You explained all ${scored.length} areas well.`
        : best.knowledgeAvg! >= 3
          ? `You covered ${scored.length} areas and explained them about equally.`
          : `None of the ${scored.length} areas got a full explanation.`;
  } else {
    interview = `You explained ${best.title} best, and ${worst.title} least.`;
  }

  const note =
    alignment === "consistent"
      ? "The interview matched what the record suggested."
      : alignment === "outperformed"
        ? "You explained more than the record predicted — the attempts count did not reflect the understanding."
        : "The interview went less far than the record suggested, which usually means the building went better than the explaining.";

  return {
    record,
    interview,
    expected,
    observed,
    alignment,
    note,
  };
}
