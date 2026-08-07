import { describe, expect, it } from "vitest";

import {
  candidateName,
  deriveSignals,
  getCandidate,
  loadCandidates,
  type DerivedSignals,
} from "./signals";
import { isAttempted, isSkipped } from "./types";

/** Prints the full derivation so the numbers can be eyeballed. */
function show(id: string, s: DerivedSignals, name: string) {
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  console.log(
    [
      ``,
      `=== ${id}  ${name} ===`,
      `  firstTryRate   ${s.firstTryRate.toFixed(3)}  (${pct(s.firstTryRate)})`,
      `  engagement     ${s.engagement.toFixed(3)}  (${pct(s.engagement)})`,
      `  coverage       ${s.coverage.toFixed(3)}  (${pct(s.coverage)})`,
      `  skippedDays    [${s.skippedDays.join(", ")}]`,
      `  failedDays     [${s.failedDays.join(", ")}]`,
      `  struggledDays  [${s.struggledDays.join(", ")}]`,
      `  cleanDays      [${s.cleanDays.join(", ")}]`,
      `  profileNote    ${s.profileNote}`,
    ].join("\n")
  );
}

function signalsFor(id: string): DerivedSignals {
  const candidate = getCandidate(id);
  expect(candidate, `candidate ${id} not found in data/candidates.json`).toBeDefined();
  const derived = deriveSignals(candidate!);
  show(id, derived, candidateName(candidate!));
  return derived;
}

describe("candidates.json", () => {
  it("loads 20 candidates", () => {
    expect(loadCandidates()).toHaveLength(20);
  });

  it("never derives completion from missions.length", () => {
    // The array is a subset; the signals block is the source of truth.
    for (const c of loadCandidates()) {
      expect(c.signals.missionsCompleted).toBeGreaterThanOrEqual(
        c.missions.filter(isAttempted).filter((m) => m.passed).length
      );
    }
  });

  it("skipped missions carry no attempts or passed keys", () => {
    for (const c of loadCandidates()) {
      for (const m of c.missions.filter(isSkipped)) {
        expect(m).not.toHaveProperty("attempts");
        expect(m).not.toHaveProperty("passed");
      }
    }
  });
});

describe("deriveSignals", () => {
  it("CAND-018 Diane Foster — perfect first-try rate", () => {
    const s = signalsFor("CAND-018");
    expect(s.firstTryRate).toBe(1);
    expect(s.struggledDays).toEqual([]);
  });

  it("CAND-017 Tyler Brooks — very low first-try rate, high coverage", () => {
    const s = signalsFor("CAND-017");
    expect(s.firstTryRate).toBeLessThan(0.35);
    expect(s.coverage).toBeGreaterThan(0.85);
  });

  it("CAND-011 Mia Alvarez — low engagement, many skipped days", () => {
    const s = signalsFor("CAND-011");
    expect(s.engagement).toBeLessThan(0.55);
    expect(s.skippedDays.length).toBeGreaterThanOrEqual(3);
  });

  it("CAND-010 Gerald Combs — has genuine failures", () => {
    const s = signalsFor("CAND-010");
    expect(s.failedDays.length).toBeGreaterThan(0);
    // A failure is not a skip. The two sets must not overlap.
    for (const d of s.failedDays) expect(s.skippedDays).not.toContain(d);
  });

  it("CAND-008 Harold Whitfield — skipped days 14 and 15", () => {
    const s = signalsFor("CAND-008");
    expect(s.skippedDays).toEqual([14, 15]);
    expect(s.failedDays).not.toContain(14);
    expect(s.failedDays).not.toContain(15);
  });
});

describe("invariants across all candidates", () => {
  it("rates are within [0, 1] and day sets are disjoint", () => {
    for (const c of loadCandidates()) {
      const s = deriveSignals(c);
      expect(s.firstTryRate).toBeGreaterThanOrEqual(0);
      expect(s.firstTryRate).toBeLessThanOrEqual(1);
      expect(s.coverage).toBeGreaterThanOrEqual(0);
      expect(s.coverage).toBeLessThanOrEqual(1);

      const overlaps = (a: number[], b: number[]) =>
        a.filter((d) => b.includes(d));
      expect(overlaps(s.cleanDays, s.struggledDays)).toEqual([]);
      expect(overlaps(s.cleanDays, s.failedDays)).toEqual([]);
      expect(overlaps(s.skippedDays, s.failedDays)).toEqual([]);
    }
  });

  it("every candidate has a non-empty profileNote", () => {
    for (const c of loadCandidates()) {
      expect(deriveSignals(c).profileNote.length).toBeGreaterThan(0);
    }
  });
});
