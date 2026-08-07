import { describe, expect, it } from "vitest";

import {
  applyTurn,
  initState,
  MAX_FOLLOW_UPS,
  MIN_DAYS_COVERED,
  MIN_QUESTIONS,
  mayConclude,
  uncoveredDays,
} from "./orchestrator";
import type { TurnDecision } from "./prompts/turn";
import type { Blueprint, SessionState } from "./types";

const blueprint: Blueprint = {
  persona: "p",
  openingLine: "o",
  targetQuestions: 10,
  arc: { warmup: 2, build: 3, stress: 3, land: 2 },
  focusDays: [
    { day: 28, title: "Docker & Kubernetes Deployment", reason: "r", startDepth: 3, strategy: "verify_depth" },
    { day: 23, title: "Model Context Protocol (MCP)", reason: "r", startDepth: 2, strategy: "rebuild_confidence" },
    { day: 15, title: "Fine-Tuning", reason: "r", startDepth: 2, strategy: "probe_gap" },
    { day: 31, title: "Capstone", reason: "r", startDepth: 3, strategy: "pressure_test" },
  ],
};

/** A model turn output. Defaults are deliberately unremarkable. */
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
    ...rest,
  };
}

describe("initState", () => {
  it("starts on the first focus day at its planned depth", () => {
    const s = initState(blueprint);
    expect(s.currentDay).toBe(28);
    expect(s.currentDepth).toBe(3);
    expect(s.questionCount).toBe(0);
    expect(s.daysCovered).toEqual([]);
    expect(s.mode).toBe("normal");
  });

  it("is JSON-serialisable for the jsonb column", () => {
    const s = initState(blueprint);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});

describe("conclude is blocked until both graded floors are met", () => {
  it("overrides a model that concludes at question 5", () => {
    let state = initState(blueprint);
    // Cover 2 days over 4 questions, then let the model try to bail out.
    for (const day of [28, 28, 23, 23]) {
      state = applyTurn(state, turn({ targetDay: day }), blueprint).state;
    }
    expect(state.questionCount).toBe(4);

    const applied = applyTurn(state, turn({ action: "conclude", targetDay: 23 }), blueprint);

    expect(applied.decision.action).not.toBe("conclude");
    expect(applied.decision.action).toBe("next_topic");
    expect(applied.overrides.join(" ")).toMatch(/conclude blocked at question 5/);
    // and it is redirected to a day not yet covered
    expect([15, 31]).toContain(applied.decision.targetDay);
  });

  it("blocks conclude when questions are enough but days are not", () => {
    let state: SessionState = {
      ...initState(blueprint),
      questionCount: 9,
      daysCovered: [28, 23],
    };
    const applied = applyTurn(state, turn({ action: "conclude", targetDay: 23 }), blueprint);
    expect(applied.decision.action).toBe("next_topic");
  });

  it("allows conclude once both floors are met", () => {
    const state: SessionState = {
      ...initState(blueprint),
      questionCount: 9,
      daysCovered: [28, 23, 15, 31],
    };
    const applied = applyTurn(state, turn({ action: "conclude", targetDay: 31 }), blueprint);
    expect(applied.decision.action).toBe("conclude");
    expect(mayConclude(applied.state)).toBe(true);
  });
});

describe("follow-up cap", () => {
  it(`forces next_topic after ${MAX_FOLLOW_UPS} follow-ups`, () => {
    let state = initState(blueprint);
    const actions: string[] = [];

    for (let i = 0; i < MAX_FOLLOW_UPS + 1; i++) {
      const applied = applyTurn(state, turn({ action: "follow_up", targetDay: 28 }), blueprint);
      actions.push(applied.decision.action);
      state = applied.state;
    }

    expect(actions.slice(0, MAX_FOLLOW_UPS)).toEqual(
      Array(MAX_FOLLOW_UPS).fill("follow_up")
    );
    expect(actions[MAX_FOLLOW_UPS]).toBe("next_topic");
    expect(state.currentDay).not.toBe(28);
  });

  it("resets the counter when the topic changes", () => {
    let state = initState(blueprint);
    state = applyTurn(state, turn({ action: "follow_up" }), blueprint).state;
    state = applyTurn(state, turn({ action: "follow_up" }), blueprint).state;
    expect(state.followUpCount).toBe(2);

    state = applyTurn(state, turn({ action: "next_topic" }), blueprint).state;
    expect(state.followUpCount).toBe(0);
  });
});

describe("running out of questions forces coverage", () => {
  it("switches topic when remaining questions equal uncovered days", () => {
    const state: SessionState = {
      ...initState(blueprint),
      questionCount: 6,
      daysCovered: [28],
    };
    // 3 uncovered days, and after this question only 3 questions remain.
    const applied = applyTurn(state, turn({ action: "follow_up", targetDay: 28 }), blueprint);
    expect(applied.decision.action).toBe("next_topic");
    expect(applied.overrides.join(" ")).toMatch(/uncovered day/);
  });
});

describe("mode and ability tracking", () => {
  it("enters recovery after two consecutive weak turns", () => {
    let state = initState(blueprint);
    state = applyTurn(state, turn({ knowledge: 2 }), blueprint).state;
    expect(state.mode).toBe("normal");
    state = applyTurn(state, turn({ knowledge: 1 }), blueprint).state;
    expect(state.mode).toBe("recovery");
    expect(state.consecutiveWeak).toBe(2);
  });

  it("leaves recovery after a single strong turn", () => {
    let state = initState(blueprint);
    state = applyTurn(state, turn({ knowledge: 2 }), blueprint).state;
    state = applyTurn(state, turn({ knowledge: 2 }), blueprint).state;
    expect(state.mode).toBe("recovery");

    state = applyTurn(state, turn({ knowledge: 4 }), blueprint).state;
    expect(state.mode).toBe("normal");
    expect(state.consecutiveWeak).toBe(0);
  });

  it("does not raise depth while recovering", () => {
    let state = initState(blueprint);
    state = applyTurn(state, turn({ knowledge: 1 }), blueprint).state;
    const before = state.currentDepth;
    const applied = applyTurn(state, turn({ knowledge: 1, action: "follow_up" }), blueprint);
    expect(applied.state.mode).toBe("recovery");
    expect(applied.decision.depth).toBeLessThanOrEqual(before);
  });

  it("weights recent scores more heavily", () => {
    let state = initState(blueprint); // ability 3
    for (let i = 0; i < 4; i++) {
      state = applyTurn(state, turn({ knowledge: 5 }), blueprint).state;
    }
    const high = state.abilityEstimate;
    expect(high).toBeGreaterThan(4);

    state = applyTurn(state, turn({ knowledge: 1 }), blueprint).state;
    // One bad answer moves it materially, but does not erase the history.
    expect(state.abilityEstimate).toBeLessThan(high);
    expect(state.abilityEstimate).toBeGreaterThan(1);
  });

  it("enters pressure mode when ability is consistently high", () => {
    let state = initState(blueprint);
    for (let i = 0; i < 5; i++) {
      state = applyTurn(state, turn({ knowledge: 5 }), blueprint).state;
    }
    expect(state.mode).toBe("pressure");
  });
});

describe("the graded floors always hold, whatever the model does", () => {
  const adversarial: Array<[string, () => TurnDecision]> = [
    ["always concludes", () => turn({ action: "conclude" })],
    ["never leaves day 28", () => turn({ action: "follow_up", targetDay: 28 })],
    ["always weak", () => turn({ knowledge: 1, action: "follow_up", targetDay: 28 })],
    ["always strong", () => turn({ knowledge: 5, action: "follow_up", targetDay: 28 })],
  ];

  for (const [name, make] of adversarial) {
    it(`reaches ${MIN_DAYS_COVERED} days and ${MIN_QUESTIONS} questions when the model ${name}`, () => {
      let state = initState(blueprint);
      let action = "";

      // Run the interview to its natural end, with a hard stop as a guard.
      for (let i = 0; i < 40 && action !== "conclude"; i++) {
        const applied = applyTurn(state, make(), blueprint);
        state = applied.state;
        action = applied.decision.action;
      }

      expect(state.questionCount).toBeGreaterThanOrEqual(MIN_QUESTIONS);
      expect(state.daysCovered.length).toBeGreaterThanOrEqual(MIN_DAYS_COVERED);
      expect(uncoveredDays(state, blueprint)).toEqual([]);
      expect(action).toBe("conclude");
    });
  }
});
