import { describe, expect, it } from "vitest";

import { deriveSignals, getCandidate, loadCandidates } from "./signals";
import { isAttempted, isSkipped, type Candidate } from "./types";

/** Rounded to 3dp, the precision the expected values are stated to. */
const to3 = (n: number) => Number(n.toFixed(3));

function show(c: Candidate, s: ReturnType<typeof deriveSignals>) {
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  console.log(
    [
      ``,
      `=== ${c.member.id}  ${c.member.name} ===`,
      `  ${c.member.jobRole}, ${c.member.yearsExperience}y, ${c.member.education}`,
      `  firstTryRate   ${to3(s.firstTryRate).toFixed(3)}  (${pct(s.firstTryRate)})`,
      `  engagement     ${to3(s.engagement).toFixed(3)}  (${pct(s.engagement)})`,
      `  coverage       ${to3(s.coverage).toFixed(3)}  (${pct(s.coverage)})`,
      `  skippedDays    [${s.skippedDays.join(", ")}]`,
      `  failedDays     [${s.failedDays.join(", ")}]`,
      `  struggledDays  [${s.struggledDays.join(", ")}]`,
      `  cleanDays      [${s.cleanDays.join(", ")}]`,
      `  profileNote    ${s.profileNote}`,
    ].join("\n")
  );
}

function signalsFor(id: string) {
  const candidate = getCandidate(id);
  expect(candidate, `${id} not found in data/candidates.json`).toBeDefined();
  const derived = deriveSignals(candidate!);
  show(candidate!, derived);
  return derived;
}

describe("candidates.json", () => {
  it("loads 20 candidates", () => {
    expect(loadCandidates()).toHaveLength(20);
  });

  it("missions[] is a subset — never use it to compute completion", () => {
    for (const c of loadCandidates()) {
      expect(c.missions.length).toBeLessThan(31);
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

  it("member.status is COMPLETED for everyone and carries no signal", () => {
    const statuses = new Set(loadCandidates().map((c) => c.member.status));
    expect([...statuses]).toEqual(["COMPLETED"]);
  });
});

describe("deriveSignals — real candidates", () => {
  it("CAND-018 Diane Foster", () => {
    const s = signalsFor("CAND-018");
    expect(to3(s.firstTryRate)).toBe(1.0);
    expect(to3(s.coverage)).toBe(1.0);
    expect(s.skippedDays).toEqual([]);
  });

  it("CAND-017 Tyler Brooks", () => {
    const s = signalsFor("CAND-017");
    expect(to3(s.firstTryRate)).toBe(0.032);
    expect(to3(s.coverage)).toBe(1.0);
    expect(s.skippedDays).toEqual([]);
  });

  it("CAND-011 Mia Alvarez", () => {
    const s = signalsFor("CAND-011");
    expect(to3(s.firstTryRate)).toBe(0.357);
    expect(to3(s.coverage)).toBe(0.452);
    expect(s.skippedDays).toEqual([7, 8, 12, 16, 22]);
  });

  it("CAND-010 Gerald Combs", () => {
    const s = signalsFor("CAND-010");
    expect(to3(s.firstTryRate)).toBe(0.043);
    expect(to3(s.coverage)).toBe(0.742);
    expect(s.failedDays).toEqual([8, 10, 22]);
    // A failure is not a skip.
    for (const d of s.failedDays) expect(s.skippedDays).not.toContain(d);
  });

  it("CAND-008 Harold Whitfield", () => {
    const s = signalsFor("CAND-008");
    expect(to3(s.firstTryRate)).toBe(0.556);
    expect(to3(s.coverage)).toBe(0.871);
    expect(s.skippedDays).toEqual([14, 15]);
  });
});

describe("invariants across all 20 candidates", () => {
  it("rates are within [0, 1] and day sets are disjoint", () => {
    for (const c of loadCandidates()) {
      const s = deriveSignals(c);
      for (const r of [s.firstTryRate, s.engagement, s.coverage]) {
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(1);
      }

      const overlaps = (a: number[], b: number[]) =>
        a.filter((d) => b.includes(d));
      expect(overlaps(s.cleanDays, s.struggledDays)).toEqual([]);
      expect(overlaps(s.cleanDays, s.failedDays)).toEqual([]);
      expect(overlaps(s.skippedDays, s.failedDays)).toEqual([]);
      expect(overlaps(s.skippedDays, s.cleanDays)).toEqual([]);
    }
  });

  it("every candidate has a non-empty profileNote", () => {
    for (const c of loadCandidates()) {
      expect(deriveSignals(c).profileNote.length).toBeGreaterThan(0);
    }
  });
});
