import { describe, expect, it } from "vitest";

import { TURN_SCHEMA, TURN_SYSTEM } from "./turn";

describe("the rationale is shown on screen, so it cannot guess pronouns", () => {
  it("forbids gendered pronouns for the candidate", () => {
    // Observed live: "She identified state loss as the cost of specialist
    // isolation." The cohort data has no pronoun field — that was inferred
    // from the name Emily Chen.
    expect(TURN_SYSTEM).toMatch(/NEVER ASSUME A PRONOUN/);
    expect(TURN_SYSTEM).toMatch(/a name is not evidence/i);
  });

  it("repeats the rule where the model writes the field", () => {
    const rationale = (TURN_SCHEMA.properties as Record<string, { description?: string }>)
      .rationale;
    expect(rationale.description).toMatch(/never "he" or "she"/i);
  });
});

describe("the rationale is the largest text in the panel", () => {
  it("bans the ladder's internal names from it", () => {
    // Observed live: "Moving to edge case (depth 4) to probe what happens
    // when a critical piece of state is lost during that handover."
    expect(TURN_SYSTEM).toMatch(/THE RATIONALE IS SHOWN ON SCREEN/);
    expect(TURN_SYSTEM).toMatch(/never write "depth 4" or any depth number/);
  });

  it("repeats the ban where the model writes the field", () => {
    const rationale = (TURN_SCHEMA.properties as Record<string, { description?: string }>)
      .rationale;
    expect(rationale.description).toMatch(/never name a rung/i);
    expect(rationale.description).toMatch(/depth N/);
  });

  it("still gives the model the ladder to THINK in", () => {
    // The display vocabulary changed; the model's did not. DEPTH_BANDS is
    // embedded byte-for-byte here and must stay.
    for (const band of ["recall", "application", "tradeoff", "edge case", "redesign"]) {
      expect(TURN_SYSTEM).toContain(band);
    }
  });
});
