import { describe, expect, it } from "vitest";

import {
  DEPTH_BANDS,
  askPhrase,
  bandFor,
  clampDepth,
  depthCeiling,
  depthFloor,
  ladderText,
  nextDepth,
  reanchorDepth,
  stepDepth,
  type DepthInputs,
} from "./depth";
import type { InterviewMode } from "./types";

const at = (over: Partial<DepthInputs> = {}): DepthInputs => ({
  currentDepth: 3,
  abilityEstimate: 3,
  mode: "normal",
  lastScores: { knowledge: 3, communication: 3, specificity: 3 },
  ...over,
});

const MODES: InterviewMode[] = ["normal", "recovery", "pressure"];

describe("the ladder", () => {
  it("has five named rungs", () => {
    expect(DEPTH_BANDS).toHaveLength(5);
    expect(bandFor(1)).toBe("recall");
    expect(bandFor(5)).toBe("redesign");
  });

  it("clamps out-of-range depths rather than returning undefined", () => {
    expect(bandFor(0)).toBe("recall");
    expect(bandFor(99)).toBe("redesign");
    expect(clampDepth(-3)).toBe(1);
    expect(clampDepth(9)).toBe(5);
  });

  it("states every rung in the text the model is given", () => {
    for (const band of DEPTH_BANDS) expect(ladderText()).toContain(band);
  });
});

describe("stepDepth — the bug that flattened the trace", () => {
  it("RISES on a strong answer while staying on the same thread", () => {
    // This is the regression. Previously depth only moved on a topic change.
    const s = stepDepth(at({ currentDepth: 3, abilityEstimate: 4, lastScores: { knowledge: 5, communication: 4, specificity: 4 } }));
    expect(s.depth).toBe(4);
    expect(s.delta).toBe(1);
  });

  it("treats an adequate answer (knowledge 3) as a climb, not a hold", () => {
    // Holding on 3 is what pins a middling candidate flat forever.
    for (let d = 2; d <= 4; d++) {
      const s = stepDepth(at({ currentDepth: d, abilityEstimate: 4.5 }));
      expect(s.delta).toBe(1);
    }
  });

  it("drops a rung on a weak answer", () => {
    const s = stepDepth(at({ currentDepth: 4, lastScores: { knowledge: 2, communication: 3, specificity: 3 } }));
    expect(s.depth).toBe(3);
    expect(s.delta).toBe(-1);
  });

  it("holds and asks for a concrete instance when specificity is low", () => {
    const s = stepDepth(at({ currentDepth: 3, lastScores: { knowledge: 5, communication: 4, specificity: 2 } }));
    expect(s.delta).toBe(0);
    expect(s.reason).toMatch(/concrete instance/i);
  });

  it("puts weak knowledge ahead of weak specificity", () => {
    const s = stepDepth(at({ currentDepth: 4, lastScores: { knowledge: 1, communication: 1, specificity: 1 } }));
    expect(s.delta).toBe(-1);
  });

  it("does not move before anything has been scored", () => {
    const s = stepDepth(at({ currentDepth: 3, lastScores: null }));
    expect(s.delta).toBe(0);
    expect(s.reason).toMatch(/opening/i);
  });
});

describe("ceiling and floor keep the walk bounded", () => {
  it("allows exactly one rung above demonstrated ability", () => {
    expect(depthCeiling(at({ abilityEstimate: 2.75, mode: "normal" }))).toBe(4);
    expect(depthCeiling(at({ abilityEstimate: 2.75, mode: "recovery" }))).toBe(3);
    expect(depthCeiling(at({ abilityEstimate: 2.75, mode: "pressure" }))).toBe(5);
  });

  it("floors at 2 unless the interview has deliberately backed off", () => {
    expect(depthFloor(at({ mode: "normal" }))).toBe(2);
    expect(depthFloor(at({ mode: "pressure" }))).toBe(2);
    expect(depthFloor(at({ mode: "recovery" }))).toBe(1);
  });

  it("keeps floor <= ceiling for every mode and ability", () => {
    for (const mode of MODES) {
      for (let a = 1; a <= 5; a += 0.25) {
        const i = at({ mode, abilityEstimate: a });
        expect(depthFloor(i)).toBeLessThanOrEqual(depthCeiling(i));
      }
    }
  });

  it("moves at most one rung, and stays in band whenever it started in band", () => {
    // Two invariants, and they can conflict when the model reported a depth
    // outside the band. One-rung-per-turn wins; the walk then converges.
    for (const mode of MODES) {
      for (let a = 1; a <= 5; a += 0.5) {
        for (let d = 1; d <= 5; d++) {
          for (const k of [1, 2, 3, 4, 5]) {
            for (const sp of [1, 3, 5]) {
              const i = at({ mode, abilityEstimate: a, currentDepth: d, lastScores: { knowledge: k, communication: 3, specificity: sp } });
              const lo = depthFloor(i);
              const hi = depthCeiling(i);
              const s = stepDepth(i);

              expect(Math.abs(s.depth - d)).toBeLessThanOrEqual(1);
              expect(s.depth).toBeGreaterThanOrEqual(1);
              expect(s.depth).toBeLessThanOrEqual(5);

              if (d >= lo && d <= hi) {
                expect(s.depth).toBeGreaterThanOrEqual(lo);
                expect(s.depth).toBeLessThanOrEqual(hi);
              } else {
                // out of band: must have moved toward it, never away
                const distBefore = d < lo ? lo - d : d - hi;
                const distAfter = s.depth < lo ? lo - s.depth : Math.max(0, s.depth - hi);
                expect(distAfter).toBeLessThan(distBefore);
              }
            }
          }
        }
      }
    }
  });
});

describe("reanchorDepth on a topic move", () => {
  it("opens one rung back", () => {
    expect(reanchorDepth(at({ currentDepth: 4, abilityEstimate: 4 })).depth).toBe(3);
  });

  it("never walks below 2 outside recovery, however many moves happen", () => {
    let d = 3;
    for (let n = 0; n < 6; n++) {
      d = reanchorDepth(at({ currentDepth: d, mode: "normal", abilityEstimate: 3 })).depth;
    }
    expect(d).toBeGreaterThanOrEqual(2);
  });
});

describe("nextDepth dispatch", () => {
  it("steps on a follow-up and re-anchors on a move", () => {
    const i = at({ currentDepth: 3, abilityEstimate: 4, lastScores: { knowledge: 5, communication: 4, specificity: 4 } });
    expect(nextDepth(i, false).depth).toBe(4);
    expect(nextDepth(i, true).depth).toBe(2);
  });
});

describe("recovering from an out-of-band depth", () => {
  it("walks toward the legal range one rung at a time, never snapping", () => {
    // The model reports the depth it actually asked at, and we record that
    // rather than overriding it — so `currentDepth` can start outside the
    // band. Snapping into range would break the one-change-per-turn rule.
    const i = at({ currentDepth: 5, abilityEstimate: 1, mode: "recovery", lastScores: { knowledge: 1, communication: 1, specificity: 1 } });
    const s = stepDepth(i);
    expect(s.depth).toBe(4);
    expect(Math.abs(s.depth - 5)).toBe(1);
  });

  it("converges into the band over successive turns", () => {
    let d = 5;
    for (let n = 0; n < 5; n++) {
      d = stepDepth(at({ currentDepth: d, abilityEstimate: 1, mode: "recovery", lastScores: { knowledge: 1, communication: 1, specificity: 1 } })).depth;
    }
    expect(d).toBe(1);
  });
});

/**
 * A non-answer must not make the next question harder.
 *
 * Observed live: a candidate pasted the wrong thing, the turn was correctly
 * marked non-substantive so ability and lastScores froze — and the depth walk
 * then read the PREVIOUS answer's strong scores and escalated 4 → 5. Someone
 * who said nothing was rewarded for it.
 */
describe("a non-answer holds the rung", () => {
  const strong = { knowledge: 5, communication: 5, specificity: 5 };
  const weak = { knowledge: 1, communication: 1, specificity: 1 };

  for (const mode of ["normal", "pressure", "recovery"] as const) {
    it(`holds at every rung in ${mode} mode, whatever the stale scores say`, () => {
      for (let depth = 1; depth <= 5; depth++) {
        for (const lastScores of [strong, weak, null]) {
          const inputs = {
            currentDepth: depth,
            abilityEstimate: 4,
            mode,
            lastScores,
            lastTurnSubstantive: false,
          };
          const step = stepDepth(inputs);
          // "Hold" means hold where it stands, still subject to the mode's
          // floor and ceiling — those exist so recovery cannot strand someone
          // at rung 5 and normal cannot sit on rung 1.
          const bounded = Math.min(
            Math.max(depth, depthFloor(inputs)),
            depthCeiling(inputs)
          );
          expect(step.depth).toBe(bounded);
          // The property that actually matters: never harder than it was.
          expect(step.depth).toBeLessThanOrEqual(Math.max(depth, depthFloor(inputs)));
        }
      }
    });
  }

  it("says why, so the panel does not imply the candidate failed", () => {
    const step = stepDepth({
      currentDepth: 4,
      abilityEstimate: 4,
      mode: "normal",
      lastScores: strong,
      lastTurnSubstantive: false,
    });
    expect(step.reason).toMatch(/not an answer/);
  });

  it("still climbs on a real strong answer — the guard is not a freeze", () => {
    // The regression this must not cause: holding forever.
    const step = stepDepth({
      currentDepth: 3,
      abilityEstimate: 4,
      mode: "normal",
      lastScores: strong,
      lastTurnSubstantive: true,
    });
    expect(step.depth).toBe(4);
  });

  it("defaults to climbing when the flag is absent", () => {
    // Sessions written before the field existed must behave exactly as before.
    const step = stepDepth({
      currentDepth: 3,
      abilityEstimate: 4,
      mode: "normal",
      lastScores: strong,
    });
    expect(step.depth).toBe(4);
  });
});

describe("askPhrase", () => {
  it("covers every rung with a readable phrase", () => {
    for (let d = 1; d <= 5; d++) {
      expect(askPhrase(d)).toMatch(/^asking /);
      expect(askPhrase(d).length).toBeGreaterThan(10);
    }
  });

  it("clamps rather than returning undefined", () => {
    expect(askPhrase(0)).toBe(askPhrase(1));
    expect(askPhrase(9)).toBe(askPhrase(5));
  });

  it("assumes no pronouns — they are not in the cohort data", () => {
    for (let d = 1; d <= 5; d++) {
      expect(askPhrase(d)).not.toMatch(/\b(he|she|him|her|his|hers|they|them|their)\b/i);
    }
  });
});
