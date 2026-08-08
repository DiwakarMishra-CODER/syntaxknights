import {
  nextMode,
  seedAbility,
  STRONG_KNOWLEDGE,
  updateAbility,
  WEAK_KNOWLEDGE,
} from "./ability";
import { bandFor, clampDepth, nextDepth, type DepthInputs } from "./depth";
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
/**
 * Below this there is nothing for the reporter to quote. writeReport would
 * fail verbatim validation twice and burn TWO of a 20/day budget before
 * degrading to the same output degradeReport gives for free.
 */
export const MIN_ANSWERS_FOR_REPORT = 2;
/** Extra follow-ups earned when the last answer was strong. */
export const STRONG_ANSWER_BONUS = 2;
export { STRONG_KNOWLEDGE };

export function initState(blueprint: Blueprint): SessionState {
  const first = blueprint.focusDays[0];
  return {
    questionCount: 0,
    daysCovered: [],
    currentDay: first?.day ?? 1,
    currentDepth: first?.startDepth ?? 2,
    followUpCount: 0,
    followUpAllowance: MAX_FOLLOW_UPS,
    // The planner has already reasoned about this candidate from their
    // record; its opening depth is a usable prior. Clamped so an LLM number
    // cannot preset a mode before they have said a word.
    abilityEstimate: seedAbility(first?.startDepth),
    mode: "normal",
    consecutiveWeak: 0,
    consecutiveStrong: 0,
    lastScores: null,
    depthViolations: 0,
    consecutiveReactions: 0,
    endedEarly: false,
    lastTurnSubstantive: true,
  };
}

/**
 * Fills defaults for fields added after a session was created. `db.ts` falls
 * back to a whole EMPTY_STATE object, not per-field, so an older row would
 * otherwise return `consecutiveStrong: undefined` and turn the arithmetic
 * into NaN silently.
 */
export function hydrateState(raw: Partial<SessionState> | null | undefined): SessionState {
  return {
    questionCount: raw?.questionCount ?? 0,
    daysCovered: raw?.daysCovered ?? [],
    currentDay: raw?.currentDay ?? 0,
    currentDepth: raw?.currentDepth ?? 2,
    followUpCount: raw?.followUpCount ?? 0,
    followUpAllowance: raw?.followUpAllowance ?? MAX_FOLLOW_UPS,
    abilityEstimate: raw?.abilityEstimate ?? 3,
    mode: raw?.mode ?? "normal",
    consecutiveWeak: raw?.consecutiveWeak ?? 0,
    consecutiveStrong: raw?.consecutiveStrong ?? 0,
    lastScores: raw?.lastScores ?? null,
    depthViolations: raw?.depthViolations ?? 0,
    consecutiveReactions: raw?.consecutiveReactions ?? 0,
    endedEarly: raw?.endedEarly ?? false,
    lastTurnSubstantive: raw?.lastTurnSubstantive ?? true,
  };
}

export function uncoveredDays(state: SessionState, blueprint: Blueprint): number[] {
  const covered = new Set(state.daysCovered);
  return blueprint.focusDays.map((f) => f.day).filter((d) => !covered.has(d));
}

/** Whether an interview has enough substance to spend a reporter call on. */
export function worthReporting(state: SessionState): boolean {
  return state.questionCount >= MIN_ANSWERS_FOR_REPORT;
}

export function mayConclude(state: SessionState): boolean {
  return (
    state.questionCount >= MIN_QUESTIONS &&
    state.daysCovered.length >= MIN_DAYS_COVERED
  );
}

/** The inputs the depth walk needs, gathered from state. */
function depthInputs(state: SessionState): DepthInputs {
  return {
    currentDepth: state.currentDepth,
    abilityEstimate: state.abilityEstimate,
    mode: state.mode,
    lastScores: state.lastScores,
    lastTurnSubstantive: state.lastTurnSubstantive,
  };
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
  /** Force an empty reaction this turn — see nextDirective. */
  omitReaction: boolean;
  /** Why depth moved (or did not), in words the model and the panel both read. */
  depthReason: string;
  depthCeiling: number;
  depthDelta: -1 | 0 | 1;
}

export function nextDirective(
  state: SessionState,
  blueprint: Blueprint,
  /** How many of the most recent turns opened with an acknowledgement. */
  consecutiveReactions = 0
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

  // The fix at the heart of this: depth is evaluated on EVERY turn, not only
  // when a topic change forces it. Previously `!mustMove` passed the current
  // depth straight through, so depth could not move within a thread — and the
  // strong-answer follow-up bonus delayed the only moment it could.
  const step = nextDepth(depthInputs(state), mustMove);

  return {
    targetDay,
    depth: step.depth,
    depthReason: step.reason,
    depthCeiling: step.ceiling,
    depthDelta: step.delta,
    mustMove,
    moveReason,
    mayConclude: canEnd,
    mustConclude: canEnd && (state.questionCount >= blueprint.targetQuestions || uncovered.length === 0),
    uncovered,
    questionsLeft,
    followUpsUsed: state.followUpCount,
    followUpsAllowed: state.followUpAllowance,
    // Every turn carried a reaction in the second live run. Asking nicely
    // did not work, so after two in a row it becomes a hard instruction
    // and the caller strips it if the model still emits one.
    omitReaction: consecutiveReactions >= 2,
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

  // The directive is computed from the PREVIOUS answer — the evaluator and
  // interviewer are merged into one call, so it is one answer stale by
  // construction. A single rung of self-correction is the model doing its
  // job; two or more means it ignored the ladder. Recorded, never overridden.
  const reportedDepth = clampDepth(decision.depth);
  const depthDrift = Math.abs(reportedDepth - directive.depth);
  if (depthDrift >= 2) {
    violations.push(
      `directed depth ${directive.depth} (${bandFor(directive.depth)}) but reported ` +
        `${reportedDepth} (${bandFor(reportedDepth)})`
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
  const rubric = decision.rubric;
  const knowledge = clamp(rubric?.knowledge ?? 3, 1, 5);

  const abilityEstimate = scored
    ? updateAbility(state.abilityEstimate, knowledge)
    : state.abilityEstimate;

  const consecutiveWeak = !scored
    ? state.consecutiveWeak
    : knowledge <= WEAK_KNOWLEDGE
      ? state.consecutiveWeak + 1
      : 0;

  const consecutiveStrong = !scored
    ? state.consecutiveStrong
    : knowledge >= STRONG_KNOWLEDGE
      ? state.consecutiveStrong + 1
      : 0;

  // A real transition function rather than three sequential ifs. The old
  // cascade made recovery a one-way door: its only exit was knowledge >= 4,
  // so a candidate who never scored above 3 stayed in it for the whole
  // interview at depth round(ability) - 1.
  const mode = nextMode(state.mode, {
    abilityEstimate,
    consecutiveWeak,
    consecutiveStrong,
    scored,
  });

  // Only a substantive answer updates the scores the depth walk reads.
  const lastScores =
    scored && rubric
      ? {
          knowledge,
          communication: clamp(rubric.communication ?? 3, 1, 5),
          specificity: clamp(rubric.specificity ?? 3, 1, 5),
        }
      : state.lastScores;

  const isConclusion = decision.action === "conclude" && !concludeBlocked;
  const questionCount = isConclusion ? state.questionCount : state.questionCount + 1;

  // Credit the day the question was actually about.
  const daysCovered = isConclusion
    ? state.daysCovered
    : cover(state.daysCovered, decision.targetDay);

  const sameThread = decision.targetDay === state.currentDay;
  // Counts any turn spent on the same thread, not just `follow_up`.
  // Counting only follow_up meant a `clarify` reset the counter to zero, so
  // alternating follow_up/clarify never tripped the cap — one topic took 6
  // of 10 questions in the second live run.
  const followUpCount = sameThread ? state.followUpCount + 1 : 0;

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
      currentDepth: isConclusion ? state.currentDepth : reportedDepth,
      followUpCount,
      followUpAllowance,
      abilityEstimate,
      mode,
      consecutiveWeak,
      consecutiveStrong,
      lastScores,
      depthViolations: state.depthViolations + (depthDrift >= 2 ? 1 : 0),
      consecutiveReactions: state.consecutiveReactions,
      endedEarly: state.endedEarly,
      lastTurnSubstantive: scored,
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
