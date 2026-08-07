import type { TurnAction, TurnDecision } from "./prompts/turn";
import type { Blueprint, SessionState } from "./types";

/**
 * The state machine that enforces the graded hard requirements.
 *
 * The model is not trusted to count. It proposes an action; this decides
 * whether the action is allowed and overrides it when a requirement would
 * otherwise be missed. Every rule here is deterministic and unit-tested,
 * because "the interview covered at least 4 days" is graded and must not
 * depend on an LLM remembering to.
 *
 * Pure: no I/O, no clock, no randomness. State goes in, new state comes
 * out, and the caller persists it to Supabase.
 */

/** Graded floors. An interview that misses either of these fails. */
export const MIN_QUESTIONS = 8;
export const MIN_DAYS_COVERED = 4;
/** Consecutive follow-ups on one day before we force a move. */
export const MAX_FOLLOW_UPS = 3;

/** Recent turns dominate: 0.4 on the newest score. */
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
    abilityEstimate: INITIAL_ABILITY,
    mode: "normal",
    consecutiveWeak: 0,
  };
}

export function uncoveredDays(state: SessionState, blueprint: Blueprint): number[] {
  const covered = new Set(state.daysCovered);
  return blueprint.focusDays.map((f) => f.day).filter((d) => !covered.has(d));
}

/** True once both graded floors are satisfied. */
export function mayConclude(state: SessionState): boolean {
  return (
    state.questionCount >= MIN_QUESTIONS &&
    state.daysCovered.length >= MIN_DAYS_COVERED
  );
}

export interface AppliedTurn {
  /** The decision as it should reach the user, after any override. */
  decision: TurnDecision;
  state: SessionState;
  /** Human-readable overrides applied, for logging and for rationale. */
  overrides: string[];
}

/**
 * Applies one turn output to the state, overriding the model where a hard
 * requirement demands it. Call this BEFORE the question reaches the user.
 */
export function applyTurn(
  state: SessionState,
  decision: TurnDecision,
  blueprint: Blueprint
): AppliedTurn {
  const overrides: string[] = [];

  // --- assessment feeds the model of the candidate -----------------------
  const knowledge = clamp(decision.rubric?.knowledge ?? INITIAL_ABILITY, 1, 5);

  const abilityEstimate =
    ABILITY_ALPHA * knowledge + (1 - ABILITY_ALPHA) * state.abilityEstimate;

  const consecutiveWeak = knowledge <= 2 ? state.consecutiveWeak + 1 : 0;

  let mode = state.mode;
  if (consecutiveWeak >= 2) mode = "recovery";
  // A single strong answer is enough to leave recovery.
  if (knowledge >= 4) mode = "normal";
  if (mode === "normal" && abilityEstimate >= 4) mode = "pressure";

  // --- decide whether the model's action survives ------------------------
  const questionCount = state.questionCount + 1;
  // Provisionally credit the day the model proposed; the day it actually
  // lands on is only known after the overrides below, and is credited then.
  const proposedCoverage = cover(state.daysCovered, decision.targetDay);

  const provisional: SessionState = {
    ...state,
    questionCount,
    daysCovered: proposedCoverage,
    abilityEstimate,
    consecutiveWeak,
    mode,
  };

  let action: TurnAction = decision.action;
  const remaining = uncoveredDays(provisional, blueprint);

  // 1. Concluding early would miss a graded floor.
  if (action === "conclude" && !mayConclude(provisional)) {
    action = "next_topic";
    overrides.push(
      `conclude blocked at question ${questionCount} with ` +
        `${proposedCoverage.length}/${MIN_DAYS_COVERED} days covered`
    );
  }

  // 2. Too long on one day.
  const followUpCount = action === "follow_up" ? state.followUpCount + 1 : 0;
  if (action === "follow_up" && followUpCount > MAX_FOLLOW_UPS) {
    action = "next_topic";
    overrides.push(`${MAX_FOLLOW_UPS} follow-ups on day ${state.currentDay}`);
  }

  // 3. Only just enough questions left to reach every remaining day.
  const questionsLeft = blueprint.targetQuestions - questionCount;
  if (action !== "conclude" && remaining.length > 0 && questionsLeft <= remaining.length) {
    if (action !== "next_topic") {
      overrides.push(
        `${questionsLeft} questions left for ${remaining.length} uncovered day(s)`
      );
    }
    action = "next_topic";
  }

  // --- resolve the day and depth the next question lands on --------------
  let targetDay = decision.targetDay;
  if (action === "next_topic") {
    const next = remaining[0];
    if (next !== undefined) {
      targetDay = next;
    } else if (mayConclude(provisional)) {
      // Everything is covered and the floors are met: let it end.
      action = "conclude";
      overrides.push("all focus days covered and floors met");
    }
  }

  const depth = chooseDepth(provisional, targetDay, blueprint, action);

  const nextState: SessionState = {
    ...provisional,
    // Credit the day the question ACTUALLY lands on. Crediting the model's
    // proposal instead meant a forced topic switch never counted toward
    // coverage, so the 4-day floor could never be reached by override.
    daysCovered: cover(proposedCoverage, targetDay),
    currentDay: targetDay,
    currentDepth: depth,
    followUpCount: action === "follow_up" ? followUpCount : 0,
  };

  return {
    decision: { ...decision, action, targetDay, depth },
    state: nextState,
    overrides,
  };
}

/**
 * Depth follows the ability estimate, then mode adjusts it. Recovery never
 * climbs; pressure never drops. A fresh day starts from its planned depth.
 */
export function chooseDepth(
  state: SessionState,
  targetDay: number,
  blueprint: Blueprint,
  action: TurnAction
): number {
  if (action === "next_topic") {
    const focus = blueprint.focusDays.find((f) => f.day === targetDay);
    const planned = focus?.startDepth ?? Math.round(state.abilityEstimate);
    // Never open a new day above what they have shown they can handle.
    return clamp(Math.min(planned, Math.round(state.abilityEstimate) + 1), 1, 5);
  }

  const base = Math.round(state.abilityEstimate);
  if (state.mode === "recovery") return clamp(Math.min(base, state.currentDepth - 1), 1, 5);
  if (state.mode === "pressure") return clamp(Math.max(base, state.currentDepth + 1), 1, 5);
  return clamp(base, 1, 5);
}

function cover(days: number[], day: number): number[] {
  return days.includes(day) ? days : [...days, day];
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
