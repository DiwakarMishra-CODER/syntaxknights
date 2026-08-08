import { describe, expect, it } from "vitest";

import {
  initState,
  MIN_DAYS_COVERED,
  MIN_QUESTIONS,
  nextDirective,
  recordTurn,
  shouldEnd,
  uncoveredDays,
} from "./orchestrator";
import type { TurnDecision } from "./prompts/turn";
import type { Blueprint, InterviewMode, SessionState } from "./types";

/**
 * The gate. Everything else tests a rule in isolation; this runs whole
 * interviews and asserts the thing the product actually claims — that the
 * depth trace responds to the candidate, and responds DIFFERENTLY to
 * different candidates.
 *
 * The regression it guards is concrete: the second live interview produced
 * 2,2,2,2,2,2,2,2,2,2,1,1 for a candidate whose answers plainly varied.
 */

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

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * A candidate who answers well at or below their true level and degrades
 * above it. Specificity tracks knowledge so the "generic answer" hold does
 * not fire spuriously.
 */
function candidateAt(trueLevel: number) {
  return (askedDepth: number) => {
    const knowledge = clamp(4 - (askedDepth - trueLevel), 1, 5);
    return {
      knowledge,
      communication: 3,
      specificity: clamp(knowledge, 1, 5),
      objectivesHit: [],
    };
  };
}

type FakeModel = "obedient" | "selfCorrecting";

interface SimResult {
  trace: number[];
  state: SessionState;
  modesVisited: InterviewMode[];
  violations: string[];
}

function simulate(candidate: ReturnType<typeof candidateAt>, model: FakeModel): SimResult {
  let state = initState(blueprint);
  const trace: number[] = [];
  const modesVisited: InterviewMode[] = [state.mode];
  const violations: string[] = [];

  for (let i = 0; i < 30; i++) {
    const directive = nextDirective(state, blueprint);
    const rubric = candidate(directive.depth);

    // The self-correcting model nudges one rung when the answer in front of
    // it is clearly off the directed rung — exactly what the prompt permits,
    // and what the ±1 drift tolerance exists for.
    const reported =
      model === "obedient"
        ? directive.depth
        : clamp(directive.depth + (rubric.knowledge >= 5 ? 1 : rubric.knowledge <= 1 ? -1 : 0), 1, 5);

    const decision: TurnDecision = {
      rubric,
      claims: [],
      reaction: "",
      question: "q?",
      action: directive.mustConclude
        ? "conclude"
        : directive.mustMove
          ? "next_topic"
          : "follow_up",
      targetDay: directive.mustMove ? directive.targetDay : state.currentDay,
      depth: reported,
      rationale: "r",
      substantive: true,
    };

    const ending = shouldEnd(state, decision);
    const recorded = recordTurn(state, decision, blueprint, directive);
    state = recorded.state;
    violations.push(...recorded.violations);
    if (!ending) trace.push(reported);
    modesVisited.push(state.mode);
    if (ending) break;
  }

  return { trace, state, modesVisited, violations };
}

const distinct = (xs: number[]) => new Set(xs).size;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

for (const model of ["obedient", "selfCorrecting"] as const) {
  describe(`the trace adapts — ${model} model`, () => {
    const weak = simulate(candidateAt(2), model);
    const strong = simulate(candidateAt(4), model);
    // Level 0, not 1: a level-1 candidate never triggers recovery because
    // the controller backs off fast enough to keep them answering — which is
    // the correct behaviour, and means recovery needs someone who is weak
    // even at the floor to exercise it.
    const struggling = simulate(candidateAt(0), model);

    it("is not flat", () => {
      // The direct regression against 2,2,2,2,2,2,2,2,2,2,1,1
      expect(distinct(weak.trace)).toBeGreaterThanOrEqual(2);
      expect(distinct(strong.trace)).toBeGreaterThanOrEqual(2);
      expect(distinct(struggling.trace)).toBeGreaterThanOrEqual(2);
    });

    it("uses the range of the ladder across candidates", () => {
      // A self-correcting model saturates one candidate's trace at the top or
      // bottom, so per-trace variety is a weak signal. What must hold is that
      // the three candidates between them exercise most of the ladder.
      const all = new Set([...weak.trace, ...strong.trace, ...struggling.trace]);
      expect(all.size).toBeGreaterThanOrEqual(4);
    });

    it("differs between a strong and a weak candidate", () => {
      expect(strong.trace).not.toEqual(weak.trace);
      expect(mean(strong.trace)).toBeGreaterThan(mean(weak.trace) + 0.5);
    });

    it("reaches the top of the ladder for a strong candidate and not for a weak one", () => {
      expect(Math.max(...strong.trace)).toBeGreaterThanOrEqual(4);
      expect(Math.max(...weak.trace)).toBeLessThanOrEqual(4);
      expect(Math.min(...struggling.trace)).toBeLessThanOrEqual(2);
    });

    it("never jumps more than one rung", () => {
      for (const t of [weak.trace, strong.trace, struggling.trace]) {
        for (let i = 1; i < t.length; i++) {
          expect(Math.abs(t[i] - t[i - 1])).toBeLessThanOrEqual(1);
        }
        expect(t.every((d) => d >= 1 && d <= 5)).toBe(true);
      }
    });

    it("puts a strong candidate under pressure", () => {
      expect(strong.modesVisited).toContain("pressure");
    });

    it("enters recovery for a struggling candidate AND lets them out", () => {
      // The one-way door: previously anyone who never scored 4 stayed in
      // recovery for the rest of the interview.
      expect(struggling.modesVisited).toContain("recovery");
      const firstRecovery = struggling.modesVisited.indexOf("recovery");
      expect(struggling.modesVisited.slice(firstRecovery)).toContain("normal");
    });

    it("still meets both graded floors for every candidate", () => {
      for (const r of [weak, strong, struggling]) {
        expect(r.state.questionCount).toBeGreaterThanOrEqual(MIN_QUESTIONS);
        expect(r.state.daysCovered.length).toBeGreaterThanOrEqual(MIN_DAYS_COVERED);
        expect(uncoveredDays(r.state, blueprint)).toEqual([]);
      }
    });
  });
}

describe("what the traces actually look like", () => {
  it("prints them, so a regression to flatness is visible in the output", () => {
    for (const [label, level] of [["struggling", 1], ["weak", 2], ["strong", 4]] as const) {
      const r = simulate(candidateAt(level), "selfCorrecting");
      console.log(
        `  ${label.padEnd(11)} depth ${r.trace.join(" ")}   ` +
          `mode ${r.state.mode}  ability ${r.state.abilityEstimate.toFixed(2)}  ` +
          `drift ${r.state.depthViolations}`
      );
    }
    expect(true).toBe(true);
  });
});
