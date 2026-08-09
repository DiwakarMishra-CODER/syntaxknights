import { findDay } from "./curriculum";
import type { FocusDay, Turn } from "./types";

/**
 * Pure derivations behind the report, shared by the interactive view
 * (components/Report.tsx) and the print view (components/ReportPrint.tsx).
 *
 * They live here rather than inside Report.tsx so the two cannot drift: a
 * printed report that scores an answer differently from the one on screen is
 * worse than no printed report. No JSX, no React, no I/O.
 */

/** Calculates overall interview performance grade using super simple, clear friendly terms */
export function calculatePerformance(turns: Turn[]) {
  const scored = answerRubrics(turns);
  // No scored answers means no evidence. Returning 80% "Strong Builder"
  // invents a grade out of nothing, which is exactly what the verbatim and
  // claim guards exist to prevent elsewhere. null hides the block instead.
  if (scored.length === 0) return null;

  let totalScore = 0;
  let count = 0;

  scored.forEach((r) => {
    totalScore += (r.knowledge + r.communication + r.specificity) / 3;
    count++;
  });

  const avgScore = count > 0 ? totalScore / count : 3;
  const pct = Math.round((avgScore / 5) * 100);

  if (pct >= 85) return { pct, grade: "Top Star Builder ⭐", level: "Super Strong" };
  if (pct >= 70) return { pct, grade: "Strong System Builder 👍", level: "Great Job" };
  if (pct >= 55) return { pct, grade: "Good Start, Keep Building 🛠️", level: "Getting Better" };
  return { pct, grade: "Learning & Growing 🌱", level: "Keep Practicing" };
}

/**
 * The assessment criteria, each from something actually measured.
 *
 * These were previously derived from the single overall percentage by
 * arithmetic offset -- criterion 2 was `pct + 10`, criterion 4 was `pct - 5`
 * -- so five separately-labelled bars all moved together and none of them
 * measured what its label claimed. The rubric already scores three distinct
 * dimensions on every answer, and the blueprint already lists the objectives
 * each day was meant to cover, so the labels can be backed by real numbers.
 *
 * Returns null when nothing was scored, for the same reason
 * calculatePerformance does.
 */
export function assessmentCriteria(turns: Turn[], focusDays: FocusDay[]) {
  const scored = answerRubrics(turns);
  if (scored.length === 0) return null;

  const mean = (pick: (r: NonNullable<Turn["rubric"]>) => number) =>
    scored.reduce((sum, r) => sum + pick(r), 0) / scored.length;

  const knowledge = mean((r) => r.knowledge);
  const communication = mean((r) => r.communication);
  const specificity = mean((r) => r.specificity);

  // Objectives the candidate actually spoke to, counted once each however
  // many times they came up, against everything the blueprint planned to ask.
  const hit = new Set<string>();
  for (const r of scored) for (const o of r.objectivesHit ?? []) hit.add(o);
  const planned = focusDays.reduce(
    (n, d) => n + (findDay(d.day)?.objectives.length ?? 0),
    0
  );

  const asPct = (v: number) => Math.round((v / 5) * 100);

  return {
    // How many answers carry a score, which is not always how many were given:
    // an answer at the very end has no following turn to grade it.
    scoredCount: scored.length,
    knowledge,
    communication,
    specificity,
    objectivesHit: hit.size,
    objectivesPlanned: planned,
    knowledgePct: asPct(knowledge),
    communicationPct: asPct(communication),
    specificityPct: asPct(specificity),
    objectivesPct: planned > 0 ? Math.round((hit.size / planned) * 100) : 0,
  };
}

/** One decimal, so a 2.5 average does not read as a flat 3. */
export const rung = (v: number) => `${Math.round(v * 10) / 10}/5`;

/** Turns raw turns into Q&A pairs for replay view */
export function extractQAPairs(turns: Turn[], focusDays: FocusDay[]) {
  const pairs: Array<{
    turnNumber: number;
    question: string;
    answer: string;
    rubric: Turn["rubric"];
    targetDay: number | null;
    depth: number | null;
    topicTitle: string;
    /** Why this question followed the previous answer. Null for the opener,
     *  which reacted to nothing. */
    rationale: string | null;
  }> = [];

  let lastQuestion: {
    text: string;
    targetDay: number | null;
    depth: number | null;
    turnNumber: number;
    rationale: string | null;
  } | null = null;

  turns.forEach((t) => {
    if (t.role === "interviewer") {
      // This turn's rubric grades the answer just before it.
      const awaiting = pairs[pairs.length - 1];
      if (awaiting && awaiting.rubric === null && t.rubric) awaiting.rubric = t.rubric;
      lastQuestion = {
        text: t.content,
        targetDay: t.targetDay,
        depth: t.depth,
        turnNumber: t.turnNumber,
        // The opening line's "rationale" is a fixed blueprint string, not a
        // reaction to anything the candidate said.
        rationale:
          t.rubric === null && t.rationale === "opening line from the blueprint"
            ? null
            : t.rationale,
      };
    } else if (t.role === "candidate" && lastQuestion) {
      const dayFocus = focusDays.find((f) => f.day === lastQuestion?.targetDay);
      pairs.push({
        turnNumber: pairs.length + 1,
        question: lastQuestion.text,
        answer: t.content,
        // Filled in below from the NEXT interviewer turn: an answer is scored
        // by the call that reacts to it, so candidate rows are always written
        // with rubric null (see route.ts). Reading t.rubric here found nothing
        // on every real session and every answer fell back to "3/5".
        rubric: null as Turn["rubric"],
        targetDay: lastQuestion.targetDay,
        depth: lastQuestion.depth,
        topicTitle: dayFocus?.title ?? "AI Project Topic",
        rationale: lastQuestion.rationale,
      });
      lastQuestion = null;
    }
  });

  return pairs;
}

/**
 * The rubrics that actually exist, in answer order.
 *
 * An answer is scored by the interviewer turn that follows it, so the scores
 * live on interviewer rows; the opening line has none because nothing came
 * before it. Filtering candidate rows for rubrics -- which is what the report
 * used to do -- matched zero turns in every real session.
 */
export function answerRubrics(turns: Turn[]) {
  return turns
    .filter((t) => t.role === "interviewer" && t.rubric)
    .map((t) => t.rubric!);
}
