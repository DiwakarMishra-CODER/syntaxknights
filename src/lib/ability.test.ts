import { describe, expect, it } from "vitest";

import {
  ABILITY_ALPHA,
  INITIAL_ABILITY,
  nextMode,
  PRESSURE_STRONG_STREAK,
  RECOVERY_WEAK_STREAK,
  PRESSURE_ENTER_ABILITY,
  PRESSURE_EXIT_ABILITY,
  RECOVERY_ENTER_ABILITY,
  RECOVERY_EXIT_ABILITY,
  seedAbility,
  updateAbility,
  type ModeSignals,
} from "./ability";
import type { InterviewMode } from "./types";

const sig = (over: Partial<ModeSignals> = {}): ModeSignals => ({
  abilityEstimate: 3,
  consecutiveWeak: 0,
  consecutiveStrong: 0,
  scored: true,
  ...over,
});

const MODES: InterviewMode[] = ["normal", "recovery", "pressure"];

describe("updateAbility", () => {
  it("is an EWMA with the exported alpha — no hidden constants", () => {
    expect(updateAbility(3, 5)).toBeCloseTo(3 + ABILITY_ALPHA * 2, 10);
    expect(updateAbility(2, 2)).toBe(2);
  });

  it("lets recent answers dominate within a short interview", () => {
    // The old alpha of 0.4 left the starting prior visible at turn seven.
    let a = INITIAL_ABILITY;
    for (let i = 0; i < 4; i++) a = updateAbility(a, 5);
    expect(a).toBeGreaterThan(4.5);
  });

  it("clamps a rogue knowledge score", () => {
    expect(updateAbility(3, 99)).toBe(updateAbility(3, 5));
    expect(updateAbility(3, -4)).toBe(updateAbility(3, 1));
  });

  it("seeds from the plan, clamped strictly inside the regime thresholds", () => {
    expect(seedAbility(1)).toBe(2.25);
    expect(seedAbility(5)).toBe(3.75);
    expect(seedAbility(3)).toBe(3);
    expect(seedAbility(undefined)).toBe(INITIAL_ABILITY);
  });
});

describe("recovery is no longer a one-way door", () => {
  it("lets Tyler out — an adequate answer clears the streak and exits", () => {
    // He scored 1,2 then 3s. Previously the only exit was knowledge >= 4, so
    // he was pinned in recovery for the whole interview at depth 1-2.
    const after3 = updateAbility(updateAbility(updateAbility(3, 1), 2), 3);
    expect(after3).toBeGreaterThanOrEqual(RECOVERY_EXIT_ABILITY);
    expect(nextMode("recovery", sig({ abilityEstimate: after3, consecutiveWeak: 0 }))).toBe("normal");
  });

  it("does not let him out while the estimate is still below the band", () => {
    expect(nextMode("recovery", sig({ abilityEstimate: 2.4, consecutiveWeak: 0 }))).toBe("recovery");
  });

  it("keeps him in while the weak streak is live", () => {
    expect(nextMode("recovery", sig({ abilityEstimate: 3.5, consecutiveWeak: 2 }))).toBe("recovery");
  });

  it("can jump straight to pressure from recovery", () => {
    expect(nextMode("recovery", sig({ consecutiveStrong: 2, abilityEstimate: 4.2 }))).toBe("pressure");
  });
});

describe("pressure is not a one-way door either", () => {
  it("exits once the estimate decays below the band", () => {
    expect(nextMode("pressure", sig({ abilityEstimate: 3.4, consecutiveStrong: 0 }))).toBe("normal");
  });

  it("holds inside the hysteresis band, so one off answer does not flip it", () => {
    expect(nextMode("pressure", sig({ abilityEstimate: 3.6, consecutiveStrong: 0 }))).toBe("pressure");
    expect(PRESSURE_EXIT_ABILITY).toBeLessThan(PRESSURE_ENTER_ABILITY);
  });

  it("drops all the way to recovery on a weak streak", () => {
    expect(nextMode("pressure", sig({ consecutiveWeak: 2, abilityEstimate: 2.0 }))).toBe("recovery");
  });
});

describe("the machine is symmetric", () => {
  it("maps onto itself under weak<->strong, recovery<->pressure, ability 6-a", () => {
    const mirrorMode = (m: InterviewMode): InterviewMode =>
      m === "recovery" ? "pressure" : m === "pressure" ? "recovery" : "normal";

    for (const from of MODES) {
      for (const weak of [0, 1, 2]) {
        for (const strong of [0, 1, 2]) {
          // The two counters are mutually exclusive in recordTurn: a score is
          // weak, strong, or neither, so one of them is always 0. Exploring
          // both non-zero tests a state the engine cannot reach.
          if (weak > 0 && strong > 0) continue;
          for (const a of [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5]) {
            // Skip contradictory signals — a two-answer strong streak cannot
            // coexist with bottom-of-range ability, because those same two
            // answers drive the estimate up. Where they do collide, the
            // deliberate safety-before-stretch tiebreak applies and is
            // asserted separately below.
            const sinking = weak >= RECOVERY_WEAK_STREAK || a <= RECOVERY_ENTER_ABILITY;
            const soaring = strong >= PRESSURE_STRONG_STREAK || a >= PRESSURE_ENTER_ABILITY;
            if (sinking && soaring) continue;
            const direct = nextMode(from, sig({ abilityEstimate: a, consecutiveWeak: weak, consecutiveStrong: strong }));
            const mirrored = nextMode(
              mirrorMode(from),
              sig({ abilityEstimate: 6 - a, consecutiveWeak: strong, consecutiveStrong: weak })
            );
            expect(mirrored).toBe(mirrorMode(direct));
          }
        }
      }
    }
  });

  it("breaks symmetry in exactly one place, deliberately: safety before stretch", () => {
    // If a signal somehow sinks AND soars at once, back off rather than push.
    // This is a learning tool; the cost of an unfair question outweighs the
    // cost of an easy one. Asserted so the asymmetry is a decision, not a bug.
    const both = sig({ consecutiveWeak: 2, consecutiveStrong: 2, abilityEstimate: 4.5 });
    expect(nextMode("normal", both)).toBe("recovery");
  });

  it("has matched hysteresis bands on both sides", () => {
    expect(RECOVERY_EXIT_ABILITY - RECOVERY_ENTER_ABILITY).toBeCloseTo(
      PRESSURE_ENTER_ABILITY - PRESSURE_EXIT_ABILITY,
      10
    );
  });
});

describe("every transition is reachable", () => {
  it("covers all nine from/to pairs or explains the gap", () => {
    const reached = new Set<string>();
    for (const from of MODES) {
      for (const weak of [0, 1, 2, 3]) {
        for (const strong of [0, 1, 2, 3]) {
          for (let a = 1; a <= 5; a += 0.25) {
            reached.add(`${from}->${nextMode(from, sig({ abilityEstimate: a, consecutiveWeak: weak, consecutiveStrong: strong }))}`);
          }
        }
      }
    }
    for (const from of MODES) {
      for (const to of MODES) {
        expect(reached.has(`${from}->${to}`)).toBe(true);
      }
    }
  });
});

describe("no evidence, no transition", () => {
  it("never changes mode on a non-substantive reply", () => {
    for (const from of MODES) {
      expect(nextMode(from, sig({ scored: false, consecutiveWeak: 9, abilityEstimate: 1 }))).toBe(from);
    }
  });
});

describe("the seed cannot preset a regime", () => {
  it("never lands on a threshold, for any plan depth", () => {
    // Regression: a plan opening at depth 2 seeded ability to exactly 2.0,
    // which is RECOVERY_ENTER, so the candidate began in recovery.
    for (const startDepth of [1, 2, 3, 4, 5, undefined]) {
      const seed = seedAbility(startDepth);
      expect(seed).toBeGreaterThan(RECOVERY_ENTER_ABILITY);
      expect(seed).toBeLessThan(PRESSURE_ENTER_ABILITY);
    }
  });

  it("leaves a fresh session in normal mode whatever the plan says", () => {
    for (const startDepth of [1, 2, 3, 4, 5]) {
      const seed = seedAbility(startDepth);
      expect(
        nextMode("normal", { abilityEstimate: seed, consecutiveWeak: 0, consecutiveStrong: 0, scored: true })
      ).toBe("normal");
    }
  });
});
