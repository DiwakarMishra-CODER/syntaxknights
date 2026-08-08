import type { InterviewMode } from "./types";

/**
 * The depth ladder and the rule that walks it.
 *
 * Depth used to be a projection of the ability estimate, recomputed ONLY on a
 * forced topic change. Within a thread it was a pass-through, so it never
 * moved — and because a strong answer raised the follow-up allowance, it
 * actually delayed the one moment depth could rise. The result was a flat
 * trace on a product whose entire claim is adaptation.
 *
 * Now depth is a bounded walk: it steps at most one rung every turn, in the
 * direction the last answer earned, with ability acting as a ceiling and
 * floor rather than as the value itself.
 *
 * Pure. No I/O, no clock, no randomness.
 */

export const DEPTH_BANDS = [
  "recall",
  "application",
  "tradeoff",
  "edge case",
  "redesign",
] as const;

export type DepthBand = (typeof DEPTH_BANDS)[number];

export const MIN_DEPTH = 1;
export const MAX_DEPTH = 5;

export const clampDepth = (d: number) =>
  Math.min(Math.max(Math.round(d), MIN_DEPTH), MAX_DEPTH);

export function bandFor(depth: number): DepthBand {
  return DEPTH_BANDS[clampDepth(depth) - 1];
}

/**
 * The ladder as the model is told it. Byte-stable — it is embedded in
 * TURN_SYSTEM, which must stay identical across turns to stay cacheable.
 */
export function ladderText(): string {
  return [
    "  1 recall      — what it was.        \"What did you use for the vector store?\"",
    "  2 application — how they used it.   \"How did you chunk the documents?\"",
    "  3 tradeoff    — why that and not the alternative, and what it cost.",
    "  4 edge case   — where it breaks.    \"A policy limit lands across a chunk boundary. What does the clinician see?\"",
    "  5 redesign    — rebuild it under a new constraint.",
  ].join("\n");
}

/**
 * The chart's y-axis, in words a visitor can read cold.
 *
 * NOT DEPTH_BANDS. Those five names describe what a QUESTION demands and are
 * embedded byte-for-byte in TURN_SYSTEM, so the model keeps thinking in
 * "recall / application / tradeoff / edge case / redesign". But on an axis
 * they are unreadable without a legend nobody has — "4 edge case" tells a
 * first-time visitor nothing about difficulty, and "5 redesign" reads like an
 * instruction. The model's vocabulary and the viewer's are allowed to differ.
 */
export const RUNG_LABEL = [
  "what it is",
  "how you used it",
  "why that way",
  "where it breaks",
  "rebuild it",
] as const;

/**
 * What a rung is ASKING FOR, in plain words.
 *
 * The panel showed "depth 5 · redesign · ceiling 5", which needs a legend
 * nobody has. This says the same thing as a phrase a visitor can read cold.
 *
 * Pronoun-free deliberately: candidate pronouns are not in the cohort data,
 * and a name is not evidence of them.
 */
export function askPhrase(depth: number): string {
  return [
    "asking what it is",
    "asking how it was used",
    "asking why this way and not another",
    "asking where it breaks",
    "asking for a redesign from scratch",
  ][clampDepth(depth) - 1];
}

/** Scores of the most recent substantive answer. */
export interface LastScores {
  knowledge: number;
  communication: number;
  specificity: number;
}

export interface DepthInputs {
  currentDepth: number;
  abilityEstimate: number;
  mode: InterviewMode;
  lastScores: LastScores | null;
  /** False after a greeting, a mis-paste, or anything that was not an answer. */
  lastTurnSubstantive?: boolean;
}

export interface DepthStep {
  depth: number;
  delta: -1 | 0 | 1;
  /** Plain English, rendered into the prompt and shown in the panel. */
  reason: string;
  ceiling: number;
  floor: number;
}

/**
 * One rung above what they have shown they can handle. Round, not floor:
 * flooring pins a candidate averaging 2.75 at tradeoff level forever, which
 * is the flat trace this exists to prevent.
 */
export function depthCeiling(i: DepthInputs): number {
  if (i.mode === "pressure") return MAX_DEPTH;
  const base = Math.round(i.abilityEstimate);
  return clampDepth(i.mode === "recovery" ? base : base + 1);
}

/**
 * Depth 1 is recall, and asking for recall should MEAN something — that the
 * interview has deliberately backed off. Outside recovery the floor is 2.
 */
export function depthFloor(i: DepthInputs): number {
  return i.mode === "recovery" ? MIN_DEPTH : 2;
}

/**
 * Settles on a depth that is inside [floor, ceiling] AND at most one rung
 * from where we are.
 *
 * The two constraints can conflict: we record the depth the model reports,
 * never an override, so `from` can already sit outside the legal band. When
 * it does, we walk one rung toward the band rather than snapping into it —
 * a four-rung jump would break the one-change-per-turn guarantee that makes
 * the trace readable.
 */
function settle(desired: number, from: number, i: DepthInputs): number {
  const lo = depthFloor(i);
  const hi = depthCeiling(i);
  const target = Math.min(Math.max(desired, lo), hi);

  if (target > from + 1) return from + 1;
  if (target < from - 1) return from - 1;
  return target;
}

const deltaOf = (to: number, from: number): -1 | 0 | 1 =>
  to === from ? 0 : to > from ? 1 : -1;

/** Staying on the same thread: step one rung on what the last answer earned. */
export function stepDepth(i: DepthInputs): DepthStep {
  const ceiling = depthCeiling(i);
  const floor = depthFloor(i);
  const from = clampDepth(i.currentDepth);

  if (!i.lastScores) {
    const depth = settle(from, from, i);
    return {
      depth,
      delta: deltaOf(depth, from),
      reason: "opening rung from the plan.",
      ceiling,
      floor,
    };
  }

  // Before anything else. A non-answer is not evidence, and `lastScores`
  // still holds the PREVIOUS answer's numbers — reading them here is what
  // pushed a candidate from 4 to 5 for pasting the wrong thing.
  if (i.lastTurnSubstantive === false) {
    const depth = settle(from, from, i);
    return {
      depth,
      delta: deltaOf(depth, from),
      reason: "Held — the last message was not an answer, so nothing was shown.",
      ceiling,
      floor,
    };
  }

  const { knowledge, specificity } = i.lastScores;

  // Order matters: weak knowledge outranks weak specificity. Someone who does
  // not understand the mechanism does not need "give me an example", they
  // need an easier question.
  if (knowledge <= 2) {
    const depth = settle(from - 1, from, i);
    return {
      depth,
      delta: deltaOf(depth, from),
      reason: `Dropped a rung — they did not have ${bandFor(from)} yet.`,
      ceiling,
      floor,
    };
  }

  if (specificity <= 2) {
    const depth = settle(from, from, i);
    return {
      depth,
      delta: deltaOf(depth, from),
      reason:
        "Held the rung — the answer was generic. Ask for one concrete instance from their own build.",
      ceiling,
      floor,
    };
  }

  const depth = settle(from + 1, from, i);
  return {
    depth,
    delta: deltaOf(depth, from),
    reason:
      depth === from
        ? `Held at ${bandFor(from)} — this is the ceiling for what they have shown.`
        : `Cleared ${bandFor(from)} — pushing to ${bandFor(depth)}.`,
    ceiling,
    floor,
  };
}

/**
 * Moving to a new topic: open one rung back and climb again. A fresh area is
 * unexplored, and opening at the edge of someone's ability is not honest.
 *
 * Deliberately ignores the plan's startDepth after turn one — re-injecting a
 * stale prior over accumulated evidence is what the ability estimate is for.
 */
export function reanchorDepth(i: DepthInputs): DepthStep {
  const ceiling = depthCeiling(i);
  const floor = depthFloor(i);
  const from = clampDepth(i.currentDepth);
  const depth = settle(from - 1, from, i);

  return {
    depth,
    delta: deltaOf(depth, from),
    reason: "New topic — opening one rung back.",
    ceiling,
    floor,
  };
}

export function nextDepth(i: DepthInputs, mustMove: boolean): DepthStep {
  return mustMove ? reanchorDepth(i) : stepDepth(i);
}
