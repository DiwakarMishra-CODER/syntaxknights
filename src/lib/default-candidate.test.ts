import { describe, expect, it } from "vitest";

import {
  candidateRoster,
  DEFAULT_CANDIDATE_ID,
  resolveCandidateId,
} from "./default-candidate";
import { getCandidate } from "./signals";

describe("choosing who is interviewed", () => {
  it("the default is a candidate that actually exists", () => {
    expect(getCandidate(DEFAULT_CANDIDATE_ID)).toBeDefined();
  });

  it("accepts a real id", () => {
    expect(resolveCandidateId("CAND-001")).toBe("CAND-001");
  });

  it("rejects anything it cannot find rather than substituting someone", () => {
    // Returning a fallback here would plan the interview against one person's
    // 31-day record and address the feedback to another. The caller decides
    // what to do with null; this function never guesses.
    for (const bad of ["CAND-999", "", "  ", "cand-001", "../CAND-001", undefined, null]) {
      expect(resolveCandidateId(bad)).toBeNull();
    }
  });

  it("offers the whole roster, in a stable order", () => {
    const roster = candidateRoster();
    expect(roster.length).toBeGreaterThan(1);

    const ids = roster.map((c) => c.member.id);
    expect([...ids].sort()).toEqual(ids);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_CANDIDATE_ID);

    // Every row on the picker must be startable — a name with no resolvable
    // id would render a link that 404s the interview it promises.
    for (const id of ids) expect(resolveCandidateId(id)).toBe(id);
  });
});
