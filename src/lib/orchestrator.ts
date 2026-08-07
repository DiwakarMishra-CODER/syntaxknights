import type { TurnAction, TurnDecision } from "./prompts/turn";
import type { Blueprint, SessionState } from "./types";

/**
 * The state machine that enforces the graded hard requirements.
 *
 * Constraints are computed BEFORE the model is called and handed to it as
 * instruction, so the model writes its question for the day it is actually
 * meant to be on. Nothing about the question is rewritten afterwards.
 *
 * The previous design overrode `targetDay` after generation, which meant a
 * question written about day 3 was filed under day 10 and coverage counted
 * days no question had yet been asked about. Recording the model's own
 * targetDay is what keeps the transcript honest.
 *
 * Pure: no I/O, no clock, no randomness.
 */

/** Graded floors. An interview that misses either of these fails. */
export const MIN_QUESTIONS = 8;
export const MIN_DAYS_COVERED = 4;
/** Follow-ups allowed on one thread before we insist on moving. */
export const MAX_FOLLOW_UPS = 3;
/** Extra follow-ups earned when the last answer was strong. */
export const STRONG_ANSWER_BONUS = 2;
/** knowledge at or above this counts as a productive thread. */
export const STRONG_KNOWLEDGE = 4;

const ABILITY_ALPHA = 0.4;
const INITIAL_ABILITY = 3;

export function initState(blueprint: Blueprint): SessionState {
  const first = blueprint.focusDays[0];
  return {
    questionCount: 0,
    daysCovered: [],
    currentDay: first?.day ?? 1,
    currentDepth: first?.startDepth ?? 2,
    followUpCount: 0,
    followUpAllowance: MAX_FOLLOW_UPS,
    abilityEstimate: INITIAL_ABILITY,
    mode: "normal",
    consecutiveWeak: 0,
  };
}

export function uncoveredDays(state: SessionState, blueprint: Blueprint): number[] {
  const covered = new Set(state.daysCovered);
  return blueprint.focusDays.map((f) => f.day).filter((d) => !covered.has(d));
}

export function mayConclude(state: SessionState): boolean {
  return (
    state.questionCount >= MIN_QUESTIONS &&
    state.daysCovered.length >= MIN_DAYS_COVERED
  );
}

/** Depth follows what they have actually shown, not the original plan. */
export function depthFromAbility(state: SessionState): number {
  const base = Math.round(state.abilityEstimate);
  if (state.mode === "recovery") return clamp(base - 1, 1, 5);
  if (state.mode === "pressure") return clamp(base + 1, 1, 5);
  return clamp(base, 1, 5);
}

/**
 * What the model is allowed to do on the next turn. Computed before the
 * call and rendered into the prompt, so there is nothing to override after.
 */
export interface TurnDirective {
  targetDay: number;
  depth: number;
  /** True when the model must leave the current thread this turn. */
  mustMove: boolean;
  /** Plain-English justification, shown to the model. */
  moveReason: string;
  mayConclude: boolean;
  mustConclude: boolean;
  uncovered: number[];
  questionsLeft: number;
  followUpsUsed: number;
  followUpsAllowed: number;
}

export function nextDirective(
  state: SessionState,
  blueprint: Blueprint
): TurnDirective {
  const uncovered = uncoveredDays(state, blueprint);
  const questionsLeft = Math.max(0, blueprint.targetQuestions - state.questionCount);

  const exhaustedThread = state.followUpCount >= state.followUpAllowance;
  const runningOut = uncovered.length > 0 && questionsLeft <= uncovered.length;

  const mustMove = (exhaustedThread || runningOut) && uncovered.length > 0;

  const moveReason = !mustMove
    ? ""
    : exhaustedThread
      ? `${state.followUpCount} follow-ups already used on day ${state.currentDay}`
      : `only ${questionsLeft} questions left and ${uncovered.length} planned topic(s) still untouched`;

  const targetDay = mustMove ? uncovered[0] : state.currentDay;
  const canEnd = mayConclude(state);

  return {
    targetDay,
    depth: mustMove ? depthFromAbility(state) : state.currentDepth,
    mustMove,
    moveReason,
    mayConclude: canEnd,
    mustConclude: canEnd && (state.questionCount >= blueprint.targetQuestions || uncovered.length === 0),
    uncovered,
    questionsLeft,
    followUpsUsed: state.followUpCount,
    followUpsAllowed: state.followUpAllowance,
  };
}

export interface RecordedTurn {
  state: SessionState;
  /** The model ignored a directive. Logged, never silently corrected. */
  violations: string[];
  /** True when the model tried to end before the floors were met. */
  concludeBlocked: boolean;
}

/**
 * Folds an actual turn into the state. Records what the model DID — the
 * question's own targetDay — rather than rewriting it.
 *
 * The one thing still enforced here is refusing to end early: that changes
 * whether the interview continues, not what any question was about, so it
 * cannot corrupt the record.
 */
export function recordTurn(
  state: SessionState,
  decision: TurnDecision,
  blueprint: Blueprint,
  directive: TurnDirective
): RecordedTurn {
  const violations: string[] = [];

  if (directive.mustMove && decision.targetDay !== directive.targetDay) {
    violations.push(
      `directed to day ${directive.targetDay} but asked about day ${decision.targetDay}`
    );
  }

  const concludeBlocked =
    decision.action === "conclude" && !mayConclude(state);
  if (concludeBlocked) {
    violations.push(
      `tried to conclude at question ${state.questionCount} with ` +
        `${state.daysCovered.length}/${MIN_DAYS_COVERED} days covered`
    );
  }

  // A greeting or non-answer carries no signal. Scoring it would seed the
  // ability estimate before any evidence exists.
  const scored = decision.substantive !== false;
  const knowledge = clamp(decision.rubric?.knowledge ?? INITIAL_ABILITY, 1, 5);

  const abilityEstimate = scored
    ? ABILITY_ALPHA * knowledge + (1 - ABILITY_ALPHA) * state.abilityEstimate
    : state.abilityEstimate;

  const consecutiveWeak = !scored
    ? state.consecutiveWeak
    : knowledge <= 2
      ? state.consecutiveWeak + 1
      : 0;

  let mode = state.mode;
  if (scored) {
    if (consecutiveWeak >= 2) mode = "recovery";
    if (knowledge >= STRONG_KNOWLEDGE) mode = "normal";
    if (mode === "normal" && abilityEstimate >= 4) mode = "pressure";
  }

  const isConclusion = decision.action === "conclude" && !concludeBlocked;
  const questionCount = isConclusion ? state.questionCount : state.questionCount + 1;

  // Credit the day the question was actually about.
  const daysCovered = isConclusion
    ? state.daysCovered
    : cover(state.daysCovered, decision.targetDay);

  const sameThread = decision.targetDay === state.currentDay;
  const followUpCount =
    decision.action === "follow_up" && sameThread ? state.followUpCount + 1 : 0;

  // A productive thread earns more room; a floundering one still caps at 3.
  const followUpAllowance =
    scored && knowledge >= STRONG_KNOWLEDGE && sameThread
      ? MAX_FOLLOW_UPS + STRONG_ANSWER_BONUS
      : sameThread
        ? state.followUpAllowance
        : MAX_FOLLOW_UPS;

  return {
    state: {
      questionCount,
      daysCovered,
      currentDay: isConclusion ? state.currentDay : decision.targetDay,
      currentDepth: isConclusion ? state.currentDepth : clamp(decision.depth, 1, 5),
      followUpCount,
      followUpAllowance,
      abilityEstimate,
      mode,
      consecutiveWeak,
    },
    violations,
    concludeBlocked,
  };
}

/** True when the interview should stop after this turn. */
export function shouldEnd(state: SessionState, decision: TurnDecision): boolean {
  return decision.action === "conclude" && mayConclude(state);
}

function cover(days: number[], day: number): number[] {
  return days.includes(day) ? days : [...days, day];
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export type { TurnAction };
