import { describe, expect, it } from "vitest";

import {
  compareToRecord,
  explanationSignal,
  topicFindings,
  topicsReached,
  unjustifiedClaims,
} from "./summary";
import type { Claim, FocusDay, Turn } from "./types";

const iTurn = (
  turnNumber: number,
  targetDay: number | null,
  depth: number | null,
  over: Partial<Turn> = {}
): Turn => ({
  turnNumber,
  role: "interviewer",
  content: "q?",
  targetDay,
  depth,
  rubric: { knowledge: 3, communication: 3, specificity: 3, objectivesHit: [] },
  claims: [],
  rationale: "r",
  ...over,
});

const answer = (turnNumber: number): Turn => ({
  turnNumber,
  role: "candidate",
  content: "a",
  targetDay: 10,
  depth: 3,
  rubric: null,
  claims: [],
  rationale: null,
});

const focusDays: FocusDay[] = [
  { day: 10, title: "The Retrieval & Matching Engine", reason: "r", startDepth: 2, strategy: "verify_depth" },
  { day: 28, title: "Docker & Kubernetes Deployment", reason: "r", startDepth: 2, strategy: "probe_gap" },
];

describe("topicsReached", () => {
  it("reports the deepest rung reached per topic", () => {
    const rows = topicsReached(
      [iTurn(1, 10, 2), iTurn(3, 10, 4), iTurn(5, 10, 3), iTurn(7, 28, 2)],
      focusDays
    );
    const retrieval = rows.find((r) => r.day === 10)!;
    expect(retrieval.depthReached).toBe(4);
    expect(retrieval.band).toBe("edge case");
    expect(retrieval.questionsAsked).toBe(3);
  });

  it("orders by how far they got, so the strongest area reads first", () => {
    const rows = topicsReached([iTurn(1, 28, 2), iTurn(3, 10, 5)], focusDays);
    expect(rows.map((r) => r.day)).toEqual([10, 28]);
  });

  it("names the topic from the plan, and falls back to the curriculum", () => {
    const rows = topicsReached([iTurn(1, 10, 3), iTurn(3, 20, 3)], focusDays);
    expect(rows.find((r) => r.day === 10)!.title).toBe("The Retrieval & Matching Engine");
    // day 20 was visited but is not in the plan — still gets a real title
    expect(rows.find((r) => r.day === 20)!.title).toBe("Conversation Memory & Context Management");
  });

  it("ignores candidate turns and the opening line", () => {
    const rows = topicsReached(
      [
        iTurn(1, 10, 2, { rubric: null, rationale: "opening line from the blueprint" }),
        answer(2),
        iTurn(3, 10, 4),
      ],
      focusDays
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].questionsAsked).toBe(1);
    expect(rows[0].depthReached).toBe(4);
  });

  it("returns nothing for an interview that never started", () => {
    expect(topicsReached([], focusDays)).toEqual([]);
  });
});

describe("unjustifiedClaims", () => {
  const c = (text: string, unjustified: boolean): Claim => ({ day: 10, text, unjustified });

  it("keeps only what they could not back", () => {
    const out = unjustifiedClaims([
      c("uses pgvector with 768 dimensions", false),
      c("we set it up properly so sessions keep working", true),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].text).toMatch(/set it up properly/);
  });

  it("de-duplicates the same assertion repeated across turns", () => {
    const out = unjustifiedClaims([
      c("We set it up properly.", true),
      c("we set it up properly", true),
      c("  WE SET IT UP PROPERLY!  ", true),
    ]);
    expect(out).toHaveLength(1);
  });

  it("returns an empty list when everything was backed up", () => {
    expect(unjustifiedClaims([c("uses pgvector", false)])).toEqual([]);
    expect(unjustifiedClaims([])).toEqual([]);
  });
});

describe("compareToRecord", () => {
  const base = {
    firstTryRate: 0.03,
    coverage: 1,
    missionsCompleted: 31,
    missionsFirstTry: 1,
    skippedDays: [],
    failedDays: [],
    struggledDays: [3, 7, 8, 10],
    abilityEstimate: 2.4,
    topics: [
      { day: 20, title: "Conversation Memory", questionsAsked: 5, depthReached: 4, band: "edge case" },
      { day: 10, title: "Retrieval Engine", questionsAsked: 3, depthReached: 2, band: "application" },
    ],
  };

  it("states the record as facts about the candidate, not the cohort", () => {
    // The old wording was "100% of the cohort completed · 3% passed first
    // try" — two facts about ONE person, phrased as facts about twenty.
    const c = compareToRecord(base)!;
    expect(c.record).not.toMatch(/of the cohort/);
    expect(c.record).toContain("You completed all 31 days");
    expect(c.record).toContain("4 days took three or more attempts");
  });

  it("does not claim a clean sweep when only some were first try", () => {
    expect(compareToRecord({ ...base, missionsFirstTry: 31 })!.record).toContain(
      "every one first try"
    );
    expect(compareToRecord(base)!.record).toContain("1 of them first try");
    expect(compareToRecord({ ...base, missionsCompleted: 20 })!.record).toContain(
      "You completed 20 of the 31 days"
    );
  });

  it("names the ends of the range without naming a rung", () => {
    const c = compareToRecord(base)!;
    expect(c.interview).toBe(
      "You went furthest on Conversation Memory, and least far on Retrieval Engine."
    );
  });

  it("does not say 'least far' when every area got equally far", () => {
    // "least far on X" is a comparison. With a tie there is nothing to
    // compare, and naming one of them would invent a ranking.
    const tied = compareToRecord({
      ...base,
      topics: base.topics.map((t) => ({ ...t, depthReached: 3, band: "tradeoff" })),
    })!;
    expect(tied.interview).toBe("You covered 2 areas and got about as far in each.");
  });

  it("does not compare a single area against itself", () => {
    const one = compareToRecord({ ...base, topics: [base.topics[0]] })!;
    expect(one.interview).toBe("Your interview centred on Conversation Memory.");
  });

  it("calls it consistent when the interview matches a weak record", () => {
    expect(compareToRecord(base)!.alignment).toBe("consistent");
  });

  it("calls it outperformed when the interview goes further than the record predicted", () => {
    const c = compareToRecord({ ...base, abilityEstimate: 4.1 })!;
    expect(c.alignment).toBe("outperformed");
    expect(c.note).toMatch(/more than the record predicted/);
  });

  it("calls it underperformed for a strong record and a thin interview", () => {
    const c = compareToRecord({ ...base, firstTryRate: 0.95, abilityEstimate: 2.1 })!;
    expect(c.alignment).toBe("underperformed");
    expect(c.note).toMatch(/building went better than the explaining/);
  });

  it("refuses to compare when nothing was asked", () => {
    // The End button makes this reachable in one click. Comparing here would
    // measure the SEED ability against a real cohort record and congratulate
    // someone for explaining more than expected when they explained nothing.
    expect(compareToRecord({ ...base, topics: [] })).toBeNull();
  });
});

/**
 * The report may not speak the ladder's private vocabulary.
 *
 * "Reached redesign" is the BEST result and reads as "you need to redesign
 * this"; "stayed at tradeoff" reads as "you got stuck". Both are the
 * opposite of what is meant, so the words are banned from the report
 * outright rather than explained.
 */
const RUNG_WORDS = /\b(recall|application|tradeoff|edge case|redesign)\b/i;

describe("no rung names in candidate-facing copy", () => {
  const topics = [
    { day: 10, title: "Retrieval", questionsAsked: 3, depthReached: 5, band: "redesign" },
    { day: 20, title: "Prompting", questionsAsked: 2, depthReached: 3, band: "tradeoff" },
  ];

  it("keeps them out of the comparison, at every depth", () => {
    for (let d = 1; d <= 5; d++) {
      const c = compareToRecord({
        firstTryRate: 0.5,
        coverage: 1,
        missionsCompleted: 31,
        missionsFirstTry: 16,
        skippedDays: [],
        failedDays: [],
        struggledDays: [],
        abilityEstimate: 3,
        topics: topics.map((t) => ({ ...t, depthReached: d })),
      })!;
      expect(c.record).not.toMatch(RUNG_WORDS);
      expect(c.interview).not.toMatch(RUNG_WORDS);
      expect(c.note).not.toMatch(RUNG_WORDS);
    }
  });

  it("describes each area plainly, with its question count", () => {
    const findings = topicFindings(topics);
    expect(findings).toHaveLength(2);
    for (const f of findings) {
      // No rung used as a LABEL. "trade-offs" and "redesigned" as ordinary
      // English are fine and deliberate — RUNG_WORDS matches the bare label
      // forms ("tradeoff", "redesign"), not these.
      expect(f.finding).not.toMatch(RUNG_WORDS);
      expect(f.finding).toMatch(/— \d+ questions?/);
    }
    expect(findings[0].finding).toMatch(/redesigned it under pressure/);
    expect(findings[0].finding).toMatch(/strongest area/);
    expect(findings[1].finding).not.toMatch(/strongest area/);
  });

  it("says plainly when every area reached the top", () => {
    const both5 = compareToRecord({
      firstTryRate: 1,
      coverage: 1,
      missionsCompleted: 31,
      missionsFirstTry: 31,
      skippedDays: [],
      failedDays: [],
      struggledDays: [],
      abilityEstimate: 4.5,
      topics: topics.map((t) => ({ ...t, depthReached: 5 })),
    })!;
    // "About as far in each" reported the best possible result as a flat line.
    expect(both5.interview).toBe("You reached the deepest level in all 2 areas.");

    const both2 = compareToRecord({
      firstTryRate: 1,
      coverage: 1,
      missionsCompleted: 31,
      missionsFirstTry: 31,
      skippedDays: [],
      failedDays: [],
      struggledDays: [],
      abilityEstimate: 2,
      topics: topics.map((t) => ({ ...t, depthReached: 2 })),
    })!;
    expect(both2.interview).toMatch(/about as far in each/);
  });

  it("covers every rung, so no depth falls through to a blank", () => {
    for (let d = 1; d <= 5; d++) {
      const [f] = topicFindings([{ ...topics[0], depthReached: d }]);
      expect(f.finding.trim().length).toBeGreaterThan(20);
    }
  });

  it("only claims a strongest area when there is a clear single winner", () => {
    // One topic has nothing to be strongest against.
    expect(topicFindings([topics[0]])[0].finding).not.toMatch(/strongest/);
    // A tie at the top would make two areas both "strongest".
    const tied = topicFindings(topics.map((t) => ({ ...t, depthReached: 4 })));
    for (const f of tied) expect(f.finding).not.toMatch(/strongest/);
  });
});

describe("explanationSignal", () => {
  const rubrics = (pairs: Array<[number, number]>) =>
    pairs.map(([knowledge, communication]) => ({ knowledge, communication }));

  it("names the gap when someone knows more than they can say", () => {
    const s = explanationSignal(rubrics([[5, 3], [5, 4], [4, 3]]))!;
    expect(s).toMatch(/knew this better than you explained it/i);
  });

  it("names the reverse without calling it a weakness in communication", () => {
    const s = explanationSignal(rubrics([[3, 5], [2, 4], [3, 5]]))!;
    expect(s).toMatch(/explained yourself clearly/i);
    expect(s).toMatch(/detail underneath/i);
  });

  it("says nothing when the two track each other", () => {
    expect(explanationSignal(rubrics([[4, 4], [3, 3], [5, 5]]))).toBeNull();
    expect(explanationSignal(rubrics([[4, 4], [3, 4], [4, 3]]))).toBeNull();
  });

  it("refuses to read a trend from one answer", () => {
    expect(explanationSignal(rubrics([[5, 1]]))).toBeNull();
    expect(explanationSignal([])).toBeNull();
  });

  it("never exposes a raw score", () => {
    // The panel's "ability 4.38" problem: a number with no stated scale.
    for (const set of [[[5, 3], [5, 3]], [[3, 5], [3, 5]]] as Array<Array<[number, number]>>) {
      const s = explanationSignal(rubrics(set));
      expect(s).not.toMatch(/\d/);
    }
  });
});
