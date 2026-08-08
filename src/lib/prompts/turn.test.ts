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

describe("a non-answer gets a human response, not silence", () => {
  it("makes the reaction required rather than optional", () => {
    // Observed live: the candidate typed "kejwhfiuwehfiwrbkawrjbkw", the
    // model correctly set substantive false, said nothing at all, and asked
    // a different question. That reads as a form, not an interviewer.
    expect(TURN_SYSTEM).toMatch(/WHEN substantive IS FALSE, SAY SOMETHING/);
    expect(TURN_SYSTEM).toMatch(/REQUIRED, not optional/);
  });

  it("separates 'nothing came through' from 'I don't know'", () => {
    // They need opposite handling: repeat the question vs never repeat it.
    expect(TURN_SYSTEM).toMatch(/ASK THE SAME QUESTION AGAIN/);
    expect(TURN_SYSTEM).toMatch(/never repeat the question they just failed/);
  });

  it("keeps the acknowledgement kind", () => {
    expect(TURN_SYSTEM).toMatch(/Never scold, never sigh, never comment on the typing/);
  });
});

describe("the reaction reflects rather than grades", () => {
  it("asks for the substance back, not a bare acknowledgement", () => {
    expect(TURN_SYSTEM).toMatch(/REFLECT WHAT THEY SAID, DO NOT GRADE IT/);
    expect(TURN_SYSTEM).toMatch(/Use their own nouns/);
  });

  it("still forbids the verdict, which is the whole reason for the rule", () => {
    // "Great answer" changes the interview being measured: a candidate told
    // they did well doubles down, one told they did badly starts performing
    // for the grader instead of explaining what they built.
    expect(TURN_SYSTEM).toMatch(/NEVER REVEAL CORRECTNESS/);
    expect(TURN_SYSTEM).toMatch(/Great answer\./);
    expect(TURN_SYSTEM).toMatch(/a verdict/);
  });

  it("forbids reflecting back something they did not say", () => {
    // A reflection that supplies the missing piece both hands them the
    // answer and tells them they had missed it.
    expect(TURN_SYSTEM).toMatch(/never add the detail they left out/);
  });

  it("keeps the escape hatch the orchestrator relies on", () => {
    // recordTurn counts consecutive reactions and the directive can force
    // one to be dropped; the model must still know to emit "".
    expect(TURN_SYSTEM).toMatch(/reaction field must be an empty string/);
  });
});
