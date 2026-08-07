import { describe, expect, it } from "vitest";

import { getCandidate } from "../signals";
import type { Blueprint } from "../types";
import { missionRecord, selectableDays, validateBlueprint } from "./planner";

const harold = getCandidate("CAND-008")!;

function blueprintWithDays(days: number[]): Blueprint {
  return {
    persona: "p",
    openingLine: "o",
    targetQuestions: 10,
    arc: { warmup: 2, build: 3, stress: 3, land: 2 },
    focusDays: days.map((day) => ({
      day,
      title: "t",
      reason: "r",
      startDepth: 3,
      strategy: "verify_depth" as const,
    })),
  };
}

describe("selectableDays", () => {
  it("is exactly the candidate's mission days, minus SETUP", () => {
    expect(selectableDays(harold)).toEqual([4, 5, 14, 15, 21, 22, 23, 27, 28, 31]);
    // Day 1 is in Harold's missions but is a SETUP day.
    expect(selectableDays(harold)).not.toContain(1);
  });

  it("keeps skipped days so gap-probing still works", () => {
    // 14 and 15 are Harold's skips.
    expect(selectableDays(harold)).toContain(14);
    expect(selectableDays(harold)).toContain(15);
  });

  it("always leaves enough days to satisfy the 4-day minimum", () => {
    for (const id of ["CAND-018", "CAND-017", "CAND-011", "CAND-010", "CAND-008"]) {
      expect(selectableDays(getCandidate(id)!).length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("missionRecord", () => {
  it("states the real outcome for each mission", () => {
    const r = missionRecord(harold);
    expect(r).toContain("Day 14 — Fine-Tuning: Concepts & When to Use It [LEARN] — SKIPPED");
    expect(r).toContain("Day 21 — Agentic Frameworks: LangChain Agents & Tool Use [BUILD] — passed after 5 attempts");
    expect(r).toContain("Day 28 — Docker & Kubernetes Deployment [SHIP_IT] — passed first try");
  });

  it("marks genuine failures as failed, not skipped", () => {
    const gerald = getCandidate("CAND-010")!;
    const r = missionRecord(gerald);
    expect(r).toMatch(/Day 8 .* — FAILED after \d+ attempts/);
  });
});

describe("validateBlueprint", () => {
  it("rejects a day absent from the candidate's record", () => {
    // Day 25 is the exact day the planner previously fabricated for Harold.
    expect(selectableDays(harold)).not.toContain(25);
    expect(() =>
      validateBlueprint(blueprintWithDays([28, 15, 23, 25]), harold)
    ).toThrow(/day 25 is not in this candidate's mission record/);
  });

  it("rejects SETUP days", () => {
    expect(() =>
      validateBlueprint(blueprintWithDays([1, 4, 5, 21]), harold)
    ).toThrow(/SETUP/);
  });

  it("rejects fewer than 4 usable focus days", () => {
    expect(() => validateBlueprint(blueprintWithDays([4, 5, 21]), harold)).toThrow(
      /at least 4/
    );
  });

  it("accepts a plan drawn entirely from the record", () => {
    const b = validateBlueprint(blueprintWithDays([28, 15, 23, 31]), harold);
    expect(b.focusDays).toHaveLength(4);
    // Titles are re-sourced from the curriculum, not trusted from the model.
    expect(b.focusDays[0].title).toBe("Docker & Kubernetes Deployment");
  });
});
