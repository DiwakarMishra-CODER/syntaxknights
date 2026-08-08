import { describe, expect, it } from "vitest";

import {
  hydrateState,
  MIN_ANSWERS_FOR_REPORT,
  initState,
  MAX_FOLLOW_UPS,
  MIN_DAYS_COVERED,
  MIN_QUESTIONS,
  mayConclude,
  nextDirective,
  recordTurn,
  shouldEnd,
  STRONG_ANSWER_BONUS,
  uncoveredDays,
  worthReporting,
} from "./orchestrator";
import type { TurnDecision } from "./prompts/turn";
import type { Blueprint, SessionState } from "./types";

const blueprint: Blueprint = {
  persona: "p",
  openingLine: "o",
  targetQuestions: 10,
  arc: { warmup: 2, build: 3, stress: 3, land: 2 },
  focusDays: [
    { day: 28, title: "Deployment", reason: "r", startDepth: 3, strategy: "verify_depth" },
    { day: 23, title: "MCP", reason: "r", startDepth: 2, strategy: "rebuild_confidence" },
    { day: 15, title: "Fine-tuning", reason: "r", startDepth: 2, strategy: "probe_gap" },
    { day: 31, title: "Capstone", reason: "r", startDepth: 3, strategy: "pressure_test" },
  ],
};

function turn(over: Partial<TurnDecision> & { knowledge?: number } = {}): TurnDecision {
  const { knowledge = 3, ...rest } = over;
  return {
    rubric: { knowledge, communication: 3, specificity: 3, objectivesHit: [] },
    claims: [],
    reaction: "Okay.",
    question: "q?",
    action: "follow_up",
    targetDay: 28,
    depth: 3,
    rationale: "r",
    substantive: true,
    ...rest,
  };
}

/** Runs one full turn the way the CLI does: directive, then record. */
function step(state: SessionState, decision: TurnDecision) {
  const directive = nextDirective(state, blueprint);
  const recorded = recordTurn(state, decision, blueprint, directive);
  return { directive, ...recorded };
}

describe("the off-by-one is gone", () => {
  it("records the day the question was actually about", () => {
    let state = initState(blueprint);
    // Model asks about day 28 and says so.
    const r = step(state, turn({ targetDay: 28 }));
    expect(r.state.currentDay).toBe(28);
    expect(r.state.daysCovered).toEqual([28]);
  });

  it("never credits a day no question was asked about", () => {
    let state = initState(blueprint);
    // Three follow-ups on 28, so the next directive forces a move.
    for (let i = 0; i < MAX_FOLLOW_UPS; i++) {
      state = step(state, turn({ action: "follow_up", targetDay: 28 })).state;
    }
    expect(state.daysCovered).toEqual([28]);

    const directive = nextDirective(state, blueprint);
    expect(directive.mustMove).toBe(true);
    expect(directive.targetDay).toBe(23);
    // Crucially: day 23 is NOT yet covered — only directed.
    expect(state.daysCovered).not.toContain(23);

    // Only once the model actually asks about 23 does it count.
    state = recordTurn(state, turn({ targetDay: 23, action: "next_topic" }), blueprint, directive).state;
    expect(state.daysCovered).toEqual([28, 23]);
  });

  it("flags a model that ignores the directive instead of silently relabelling", () => {
    let state = initState(blueprint);
    for (let i = 0; i < MAX_FOLLOW_UPS; i++) {
      state = step(state, turn({ action: "follow_up", targetDay: 28 })).state;
    }
    const r = step(state, turn({ targetDay: 28, action: "follow_up" }));
    expect(r.violations.join(" ")).toMatch(/directed to day 23 but asked about day 28/);
    // and the record still says 28, because that is what was asked
    expect(r.state.currentDay).toBe(28);
  });
});

describe("directive computed before the call", () => {
  it("does not force a move while the thread has room", () => {
    const d = nextDirective(initState(blueprint), blueprint);
    expect(d.mustMove).toBe(false);
    expect(d.targetDay).toBe(28);
  });

  it("forces a move once follow-ups are spent, naming the reason", () => {
    let state = initState(blueprint);
    for (let i = 0; i < MAX_FOLLOW_UPS; i++) {
      state = step(state, turn({ action: "follow_up", targetDay: 28 })).state;
    }
    const d = nextDirective(state, blueprint);
    expect(d.mustMove).toBe(true);
    expect(d.moveReason).toMatch(/follow-ups already used/);
  });

  it("forbids concluding until both floors are met", () => {
    const d = nextDirective(initState(blueprint), blueprint);
    expect(d.mayConclude).toBe(false);
  });

  it("permits concluding once both floors are met", () => {
    const state: SessionState = {
      ...initState(blueprint),
      questionCount: 9,
      daysCovered: [28, 23, 15, 31],
    };
    expect(nextDirective(state, blueprint).mayConclude).toBe(true);
  });

  it("forces a move when questions left equal untouched topics", () => {
    const state: SessionState = {
      ...initState(blueprint),
      questionCount: 7,
      daysCovered: [28],
    };
    const d = nextDirective(state, blueprint);
    expect(d.mustMove).toBe(true);
    expect(d.moveReason).toMatch(/questions left/);
  });
});

describe("conclude is still refused early", () => {
  it("blocks it and keeps the interview going", () => {
    const state = initState(blueprint);
    const r = step(state, turn({ action: "conclude" }));
    expect(r.concludeBlocked).toBe(true);
    expect(shouldEnd(state, turn({ action: "conclude" }))).toBe(false);
    // the question still counted, and its day still recorded honestly
    expect(r.state.questionCount).toBe(1);
  });

  it("allows it once the floors are met, without counting it as a question", () => {
    const state: SessionState = {
      ...initState(blueprint),
      questionCount: 9,
      daysCovered: [28, 23, 15, 31],
    };
    const r = step(state, turn({ action: "conclude" }));
    expect(r.concludeBlocked).toBe(false);
    expect(shouldEnd(state, turn({ action: "conclude" }))).toBe(true);
    // a closing beat is not a question
    expect(r.state.questionCount).toBe(9);
  });
});

describe("quality-aware follow-up cap", () => {
  it("grants extra room after a strong answer", () => {
    let state = initState(blueprint);
    expect(state.followUpAllowance).toBe(MAX_FOLLOW_UPS);

    state = step(state, turn({ knowledge: 5, action: "follow_up", targetDay: 28 })).state;
    expect(state.followUpAllowance).toBe(MAX_FOLLOW_UPS + STRONG_ANSWER_BONUS);
  });

  it("does not force a move at 3 when the thread is productive", () => {
    let state = initState(blueprint);
    for (let i = 0; i < MAX_FOLLOW_UPS; i++) {
      state = step(state, turn({ knowledge: 5, action: "follow_up", targetDay: 28 })).state;
    }
    expect(nextDirective(state, blueprint).mustMove).toBe(false);
  });

  it("still caps a floundering thread at 3", () => {
    let state = initState(blueprint);
    for (let i = 0; i < MAX_FOLLOW_UPS; i++) {
      state = step(state, turn({ knowledge: 2, action: "follow_up", targetDay: 28 })).state;
    }
    expect(nextDirective(state, blueprint).mustMove).toBe(true);
  });

  it("resets the allowance when the topic changes", () => {
    let state = initState(blueprint);
    state = step(state, turn({ knowledge: 5, targetDay: 28 })).state;
    expect(state.followUpAllowance).toBe(MAX_FOLLOW_UPS + STRONG_ANSWER_BONUS);
    state = step(state, turn({ knowledge: 3, targetDay: 23, action: "next_topic" })).state;
    expect(state.followUpAllowance).toBe(MAX_FOLLOW_UPS);
  });
});

describe("depth and scoring", () => {
  it("RAISES depth after a strong answer on the SAME thread", () => {
    // The regression. Depth used to be a pass-through unless a topic change
    // forced it, so a productive thread never got harder.
    let state = initState(blueprint);
    const before = state.currentDepth;
    state = step(state, turn({ knowledge: 5, action: "follow_up", targetDay: 28 })).state;

    const d = nextDirective(state, blueprint);
    expect(d.mustMove).toBe(false);
    expect(d.depth).toBeGreaterThan(before);
    expect(d.depthReason).toMatch(/Cleared/i);
  });

  it("grants the follow-up bonus AND climbs on the same turn", () => {
    // These used to fight each other: the bonus delayed mustMove, which was
    // the only moment depth was recomputed. Asserted together so neither can
    // silently regress.
    let state = initState(blueprint);
    const before = state.currentDepth;
    state = step(state, turn({ knowledge: 5, action: "follow_up", targetDay: 28 })).state;

    expect(state.followUpAllowance).toBe(MAX_FOLLOW_UPS + STRONG_ANSWER_BONUS);
    expect(nextDirective(state, blueprint).depth).toBeGreaterThan(before);
  });

  it("lowers depth after a weak answer on the same thread", () => {
    let state = initState(blueprint);
    state = step(state, turn({ knowledge: 5 })).state;   // climb first
    const high = nextDirective(state, blueprint).depth;
    state = step(state, turn({ knowledge: 1 })).state;
    expect(nextDirective(state, blueprint).depth).toBeLessThan(high);
  });

  it("never moves more than one rung per turn, whatever the model does", () => {
    let state = initState(blueprint);
    for (let i = 0; i < 40; i++) {
      const d = nextDirective(state, blueprint);
      expect(Math.abs(d.depth - state.currentDepth)).toBeLessThanOrEqual(1);
      state = recordTurn(state, turn({ knowledge: (i % 5) + 1, depth: d.depth }), blueprint, d).state;
    }
  });

  it("does NOT score a non-substantive reply", () => {
    const state = initState(blueprint);
    const before = state.abilityEstimate;

    const r = step(state, turn({ substantive: false, knowledge: 1 }));

    expect(r.state.abilityEstimate).toBe(before);
    expect(r.state.consecutiveWeak).toBe(0);
    expect(r.state.mode).toBe("normal");
    // but it still counts as a turn taken
    expect(r.state.questionCount).toBe(1);
  });

  it("scores a substantive reply normally", () => {
    const state = initState(blueprint);
    const r = step(state, turn({ substantive: true, knowledge: 5 }));
    expect(r.state.abilityEstimate).toBeGreaterThan(state.abilityEstimate);
  });

  it("enters recovery after two consecutive weak substantive answers", () => {
    let state = initState(blueprint);
    state = step(state, turn({ knowledge: 2 })).state;
    state = step(state, turn({ knowledge: 1 })).state;
    expect(state.mode).toBe("recovery");
  });

  it("leaves recovery after one strong answer", () => {
    let state = initState(blueprint);
    state = step(state, turn({ knowledge: 2 })).state;
    state = step(state, turn({ knowledge: 2 })).state;
    state = step(state, turn({ knowledge: 4 })).state;
    expect(state.mode).toBe("normal");
  });
});

describe("depth drift is recorded, never overridden", () => {
  it("flags a model that reports two or more rungs off the directive", () => {
    const state = initState(blueprint);
    const d = nextDirective(state, blueprint);
    const r = recordTurn(state, turn({ depth: d.depth + 3 }), blueprint, d);

    expect(r.violations.join(" ")).toMatch(/directed depth/);
    expect(r.state.depthViolations).toBe(1);
    // the record keeps what was actually asked
    expect(r.state.currentDepth).toBe(Math.min(d.depth + 3, 5));
  });

  it("tolerates one rung — the directive is one answer stale by design", () => {
    const state = initState(blueprint);
    const d = nextDirective(state, blueprint);
    const r = recordTurn(state, turn({ depth: d.depth + 1 }), blueprint, d);

    expect(r.violations).toEqual([]);
    expect(r.state.depthViolations).toBe(0);
  });
});

describe("state survives the jsonb round trip", () => {
  it("is fully JSON-serialisable after a turn", () => {
    const state = step(initState(blueprint), turn({ knowledge: 4 })).state;
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it("hydrates a session row written before these fields existed", () => {
    const old = { questionCount: 3, daysCovered: [28], currentDay: 28, currentDepth: 3 };
    const s = hydrateState(old as never);
    expect(s.consecutiveStrong).toBe(0);
    expect(s.lastScores).toBeNull();
    expect(s.depthViolations).toBe(0);
    expect(Number.isNaN(s.abilityEstimate)).toBe(false);
  });
});

describe("the graded floors still hold against a bad model", () => {
  const adversarial: Array<[string, () => TurnDecision]> = [
    ["always tries to conclude", () => turn({ action: "conclude" })],
    ["never leaves one topic", () => turn({ action: "follow_up", targetDay: 28 })],
    ["always weak", () => turn({ knowledge: 1, action: "follow_up", targetDay: 28 })],
  ];

  for (const [name, make] of adversarial) {
    it(`reaches the floors when the model ${name}`, () => {
      let state = initState(blueprint);
      let ended = false;

      for (let i = 0; i < 40 && !ended; i++) {
        const directive = nextDirective(state, blueprint);
        // An obedient-enough model: follows the move directive when forced.
        const d = make();
        const decision = directive.mustMove
          ? { ...d, targetDay: directive.targetDay, action: "next_topic" as const }
          : d;

        ended = shouldEnd(state, decision);
        state = recordTurn(state, decision, blueprint, directive).state;
      }

      expect(state.questionCount).toBeGreaterThanOrEqual(MIN_QUESTIONS);
      expect(state.daysCovered.length).toBeGreaterThanOrEqual(MIN_DAYS_COVERED);
      expect(uncoveredDays(state, blueprint)).toEqual([]);
      expect(mayConclude(state)).toBe(true);
    });
  }
});

describe("clarify no longer resets the follow-up counter", () => {
  it("trips the cap when follow_up and clarify alternate on one day", () => {
    let state = initState(blueprint);
    const pattern = ["follow_up", "clarify", "follow_up", "clarify"] as const;

    for (const action of pattern) {
      const d = nextDirective(state, blueprint);
      // Weak answers, so no strong-answer bonus is earned.
      state = recordTurn(
        state,
        turn({ action, targetDay: 28, knowledge: 2 }),
        blueprint,
        d
      ).state;
    }

    // 4 turns on one thread with an allowance of 3 must force a move.
    expect(state.followUpCount).toBeGreaterThanOrEqual(MAX_FOLLOW_UPS);
    expect(nextDirective(state, blueprint).mustMove).toBe(true);
  });

  it("still resets when the topic actually changes", () => {
    let state = initState(blueprint);
    state = step(state, turn({ action: "clarify", targetDay: 28 })).state;
    state = step(state, turn({ action: "clarify", targetDay: 28 })).state;
    expect(state.followUpCount).toBe(2);

    state = step(state, turn({ action: "next_topic", targetDay: 23 })).state;
    expect(state.followUpCount).toBe(0);
  });
});

describe("omit-reaction directive", () => {
  it("is off until two consecutive reactions have been used", () => {
    const s = initState(blueprint);
    expect(nextDirective(s, blueprint, 0).omitReaction).toBe(false);
    expect(nextDirective(s, blueprint, 1).omitReaction).toBe(false);
    expect(nextDirective(s, blueprint, 2).omitReaction).toBe(true);
  });
});

/**
 * Floor canaries.
 *
 * The End button gives the candidate a way out, and the tempting way to have
 * built it was to relax the gate or route it through `action: "conclude"`.
 * These assert the graded requirements as literal numbers so that shortcut
 * fails loudly rather than quietly making a hackathon requirement optional.
 */
describe("the graded floors are not negotiable", () => {
  it("still requires 8 questions and 4 days — the numbers in the brief", () => {
    expect(MIN_QUESTIONS).toBe(8);
    expect(MIN_DAYS_COVERED).toBe(4);
  });

  const at = (questionCount: number, days: number[]): SessionState => ({
    ...initState(blueprint),
    questionCount,
    daysCovered: days,
  });

  it("refuses to conclude one question short", () => {
    expect(mayConclude(at(7, [1, 2, 3, 4]))).toBe(false);
  });

  it("refuses to conclude one day short", () => {
    expect(mayConclude(at(8, [1, 2, 3]))).toBe(false);
  });

  it("allows it when both are met", () => {
    expect(mayConclude(at(8, [1, 2, 3, 4]))).toBe(true);
  });

  it("ignores a model that tries to conclude early", () => {
    const decision = turn({ action: "conclude" });
    expect(shouldEnd(at(3, [1]), decision)).toBe(false);
  });
});

describe("worthReporting", () => {
  it("is false before there is anything to quote", () => {
    // Below this the reporter would fail verifyReport twice and burn two of a
    // 20/day budget before degrading to the same text we can produce for free.
    expect(worthReporting({ ...initState(blueprint), questionCount: 0 })).toBe(false);
    expect(worthReporting({ ...initState(blueprint), questionCount: 1 })).toBe(false);
  });

  it("is true at the boundary", () => {
    expect(MIN_ANSWERS_FOR_REPORT).toBe(2);
    expect(worthReporting({ ...initState(blueprint), questionCount: 2 })).toBe(true);
  });
});

describe("a non-answer does not advance anything", () => {
  it("leaves ability, scores and the next directive's depth untouched", () => {
    // Walk up to depth 4 on strong answers, then fumble.
    let state = initState(blueprint);
    for (let i = 0; i < 3; i++) state = step(state, turn({ knowledge: 5 })).state;

    const before = {
      depth: nextDirective(state, blueprint).depth,
      ability: state.abilityEstimate,
      lastScores: state.lastScores,
    };

    const fumbled = step(state, turn({ substantive: false, knowledge: 5 })).state;

    expect(fumbled.abilityEstimate).toBe(before.ability);
    expect(fumbled.lastScores).toEqual(before.lastScores);
    expect(fumbled.lastTurnSubstantive).toBe(false);
    // The one that was broken: the rung must not climb off a non-answer.
    expect(nextDirective(fumbled, blueprint).depth).toBeLessThanOrEqual(before.depth);
  });

  it("clears the flag again on the next real answer", () => {
    // Only the flag is asserted here. The depth AFTER it is not: by this
    // point the follow-up cap forces a topic move, and reanchorDepth
    // deliberately opens a rung back — that is a different rule, covered in
    // depth.test.ts.
    let state = initState(blueprint);
    for (let i = 0; i < 3; i++) state = step(state, turn({ knowledge: 5 })).state;
    state = step(state, turn({ substantive: false })).state;
    expect(state.lastTurnSubstantive).toBe(false);

    state = step(state, turn({ knowledge: 5 })).state;
    expect(state.lastTurnSubstantive).toBe(true);
  });

  it("hydrates old sessions as substantive, so nothing changes for them", () => {
    expect(hydrateState({ questionCount: 3 }).lastTurnSubstantive).toBe(true);
  });
});
