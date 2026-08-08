import type { InterviewMode } from "./types";

/**
 * The ability estimate and the mode machine.
 *
 * The previous mode logic was three sequential `if`s, which is an
 * order-dependent cascade rather than a state machine. Its practical effect
 * was a one-way door: the only exit from `recovery` was a knowledge score of
 * 4, so a candidate who never scored above 3 entered recovery on turn two and
 * stayed there for the rest of the interview. The mirror bug applied to
 * `pressure`.
 *
 * This is a real transition function, symmetric by construction: swap
 * weak/strong, recovery/pressure and the comparisons, and it maps onto
 * itself. That symmetry is asserted in the tests rather than hoped for.
 *
 * Pure. Every constant is exported so the arithmetic can be tested directly.
 */

/**
 * Weight on the newest score. At 0.4 the starting prior was still visible at
 * turn seven; at 0.5 the two most recent answers carry 75% and the prior is
 * gone by the midpoint of a ten-question interview.
 */
export const ABILITY_ALPHA = 0.5;
export const INITIAL_ABILITY = 3;
/**
 * The planner's opening depth is a prior, clamped so it cannot preset a mode.
 *
 * The bounds sit strictly INSIDE the regime thresholds. At [2, 4] they landed
 * exactly on RECOVERY_ENTER (2.0) and PRESSURE_ENTER (4.0), and since those
 * comparisons are inclusive, a plan opening at depth 2 put the candidate into
 * recovery before they had answered anything — pinning the ceiling to 2 and
 * suppressing the first three questions.
 */
export const INITIAL_ABILITY_MIN = 2.25;
export const INITIAL_ABILITY_MAX = 3.75;

export const WEAK_KNOWLEDGE = 2;
export const STRONG_KNOWLEDGE = 4;

export const RECOVERY_WEAK_STREAK = 2;
export const PRESSURE_STRONG_STREAK = 2;

/** Matched 0.5 hysteresis bands, so one off answer cannot flip a regime. */
export const RECOVERY_ENTER_ABILITY = 2.0;
export const RECOVERY_EXIT_ABILITY = 2.5;
export const PRESSURE_EXIT_ABILITY = 3.5;
export const PRESSURE_ENTER_ABILITY = 4.0;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Exponentially weighted moving average over knowledge scores. */
export function updateAbility(previous: number, knowledge: number): number {
  const k = clamp(knowledge, 1, 5);
  return ABILITY_ALPHA * k + (1 - ABILITY_ALPHA) * previous;
}

/** Seeds the estimate from the plan's opening depth, clamped to a neutral band. */
export function seedAbility(startDepth: number | undefined): number {
  return clamp(startDepth ?? INITIAL_ABILITY, INITIAL_ABILITY_MIN, INITIAL_ABILITY_MAX);
}

export interface ModeSignals {
  abilityEstimate: number;
  consecutiveWeak: number;
  consecutiveStrong: number;
  /** False for a greeting or non-answer — no evidence, so no transition. */
  scored: boolean;
}

export function nextMode(previous: InterviewMode, s: ModeSignals): InterviewMode {
  if (!s.scored) return previous;

  // Boundaries are inclusive on both sides so the machine mirrors exactly:
  // `<= 2.0` is the reflection of `>= 4.0`. With `<` on one side and `>=` on
  // the other, a candidate sitting precisely on the threshold was treated
  // differently depending on which direction they came from.
  const sinking =
    s.consecutiveWeak >= RECOVERY_WEAK_STREAK ||
    s.abilityEstimate <= RECOVERY_ENTER_ABILITY;

  const soaring =
    s.consecutiveStrong >= PRESSURE_STRONG_STREAK ||
    s.abilityEstimate >= PRESSURE_ENTER_ABILITY;

  switch (previous) {
    case "recovery":
      if (soaring) return "pressure";
      // The fix for the one-way door: an adequate answer clears the weak
      // streak, and clearing it is now enough to leave.
      return s.consecutiveWeak === 0 && s.abilityEstimate >= RECOVERY_EXIT_ABILITY
        ? "normal"
        : "recovery";

    case "pressure":
      if (sinking) return "recovery";
      return s.consecutiveStrong === 0 && s.abilityEstimate <= PRESSURE_EXIT_ABILITY
        ? "normal"
        : "pressure";

    case "normal":
    default:
      // Safety before stretch: if both fire, back off rather than push.
      if (sinking) return "recovery";
      if (soaring) return "pressure";
      return "normal";
  }
}
