import { describe, expect, it } from "vitest";

import {
  compareToRecord,
  levelFor,
  questionTimeline,
  explanationSignal,
  topicFindings,
  topicsReached,
  unjustifiedClaims,
  type TopicReach,
} from "./summary";
import type { Claim, FocusDay, Turn, TurnRubric } from "./types";

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

describe("topicsReached — answer scores, and the off-by-one that hides them", () => {
  const rubric = (knowledge: number): TurnRubric => ({
    knowledge,
    communication: knowledge,
    specificity: knowledge,
    objectivesHit: [],
  });

  it("scores an answer against the topic of the question it ANSWERED", () => {
    // The trap: an interviewer turn carries the rubric for the answer BEFORE
    // it and the targetDay of the question AFTER it. Reading a turn's own
    // rubric against its own targetDay files every score under the wrong
    // topic. Here day 10 is asked, answered badly, then the interviewer moves
    // to day 28 — so the 1/5 belongs to day 10, not day 28.
    const rows = topicsReached(
      [
        iTurn(1, 10, 2, { rubric: null }),
        answer(2),
        iTurn(3, 28, 2, { rubric: rubric(1) }),
        answer(4),
        iTurn(5, 28, 3, { rubric: rubric(5) }),
      ],
      focusDays
    );

    const retrieval = rows.find((r) => r.day === 10)!;
    const docker = rows.find((r) => r.day === 28)!;
    expect(retrieval.knowledgeAvg).toBe(1);
    expect(docker.knowledgeAvg).toBe(5);
  });

  it("leaves knowledgeAvg null when a topic's answers were never scored", () => {
    // substantive:false answers are stored with a null rubric. A topic where
    // the candidate only ever typed filler must not average to anything.
    const rows = topicsReached(
      [iTurn(1, 10, 2, { rubric: null }), answer(2), iTurn(3, 10, 2, { rubric: null })],
      focusDays
    );
    expect(rows[0].knowledgeAvg).toBeNull();
    expect(rows[0].answered).toBe(0);
    // ...but the questions still happened, and that is still reported.
    expect(rows[0].questionsAsked).toBe(2);
  });

  it("orders by how well each topic was explained, not how hard it was asked", () => {
    const rows = topicsReached(
      [
        iTurn(1, 10, 5, { rubric: null }),
        answer(2),
        iTurn(3, 28, 2, { rubric: rubric(1) }), // day 10, asked at depth 5, answered 1
        answer(4),
        iTurn(5, 28, 2, { rubric: rubric(4) }), // day 28, asked at depth 2, answered 4
      ],
      focusDays
    );
    // Day 10 got the deepest question; day 28 got the better answer.
    expect(rows[0].day).toBe(28);
  });
});

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
      { day: 20, title: "Conversation Memory", questionsAsked: 5, depthReached: 4, band: "edge case", answered: 5, knowledgeAvg: 4 },
      { day: 10, title: "Retrieval Engine", questionsAsked: 3, depthReached: 2, band: "application", answered: 3, knowledgeAvg: 2 },
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

  it("names the ends of the range by how well each was EXPLAINED", () => {
    // This line sits under a heading reading "How You Performed Today". It
    // used to be built from depthReached — the rung the INTERVIEWER's
    // questions sat on — so it reported the interview, not the candidate.
    const c = compareToRecord(base)!;
    expect(c.interview).toBe(
      "You explained Conversation Memory best, and Retrieval Engine least."
    );
  });

  it("does not rank areas that were explained about equally", () => {
    // Naming one of them would invent a ranking that the scores do not support.
    const tied = compareToRecord({
      ...base,
      topics: base.topics.map((t) => ({ ...t, knowledgeAvg: 3 })),
    })!;
    expect(tied.interview).toBe("You covered 2 areas and explained them about equally.");
  });

  it("never announces a top result off the back of hard QUESTIONS", () => {
    // The old code said "You reached the deepest level in all N areas."
    // whenever depthReached was >= 4, however badly it was answered.
    const deepQuestionsBadAnswers = compareToRecord({
      ...base,
      topics: base.topics.map((t) => ({ ...t, depthReached: 5, knowledgeAvg: 1 })),
    })!;
    expect(deepQuestionsBadAnswers.interview).toBe(
      "None of the 2 areas got a full explanation."
    );
  });

  it("says so plainly when nothing could be scored", () => {
    const unscored = compareToRecord({
      ...base,
      topics: base.topics.map((t) => ({ ...t, answered: 0, knowledgeAvg: null })),
    })!;
    expect(unscored.interview).toBe("Nothing you said in this session could be scored.");
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
    { day: 10, title: "Retrieval", questionsAsked: 3, depthReached: 5, band: "redesign", answered: 3, knowledgeAvg: 4.5 },
    { day: 20, title: "Prompting", questionsAsked: 2, depthReached: 3, band: "tradeoff", answered: 2, knowledgeAvg: 3 },
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
    // The finding states what was ASKED, because depthReached is a fact about
    // the questions. What the candidate did with them is `level`, scored
    // separately — see the topicFindings suite below.
    expect(findings[0].finding).toMatch(/Asked how you would rebuild it/);
    expect(findings[0].finding).toMatch(/strongest area/);
    expect(findings[1].finding).not.toMatch(/strongest area/);
  });

  it("says plainly when every area was explained well", () => {
    const bothStrong = compareToRecord({
      firstTryRate: 1,
      coverage: 1,
      missionsCompleted: 31,
      missionsFirstTry: 31,
      skippedDays: [],
      failedDays: [],
      struggledDays: [],
      abilityEstimate: 4.5,
      topics: topics.map((t) => ({ ...t, knowledgeAvg: 4.5 })),
    })!;
    expect(bothStrong.interview).toBe("You explained all 2 areas well.");

    const bothMiddling = compareToRecord({
      firstTryRate: 1,
      coverage: 1,
      missionsCompleted: 31,
      missionsFirstTry: 31,
      skippedDays: [],
      failedDays: [],
      struggledDays: [],
      abilityEstimate: 2,
      topics: topics.map((t) => ({ ...t, knowledgeAvg: 3 })),
    })!;
    expect(bothMiddling.interview).toMatch(/explained them about equally/);
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
    const tied = topicFindings(topics.map((t) => ({ ...t, knowledgeAvg: 4 })));
    for (const f of tied) expect(f.finding).not.toMatch(/strongest/);
  });
});

/**
 * The topic row must report the CANDIDATE, not the interviewer.
 *
 * `depthReached` is max(question.depth) over interviewer turns — it never
 * reads an answer. The report used to print a hardcoded "Good Understanding"
 * beside it and size a progress bar by the curriculum day number, so a
 * session of pure gibberish still rendered as a good result.
 */
describe("topic level comes from the answers, not the questions", () => {
  const topic = (over: Partial<TopicReach> = {}): TopicReach => ({
    day: 10,
    title: "Retrieval",
    questionsAsked: 3,
    depthReached: 5,
    band: "redesign",
    answered: 3,
    knowledgeAvg: 4.5,
    ...over,
  });

  it("reports a hard question set answered badly as not explained", () => {
    const [f] = topicFindings([topic({ knowledgeAvg: 1.2 })]);
    expect(f.level).toBe("Not explained yet");
    expect(f.finding).not.toMatch(/strongest/);
  });

  it("gives no level at all when nothing on the topic was scored", () => {
    const [f] = topicFindings([topic({ answered: 0, knowledgeAvg: null })]);
    expect(f.level).toBeNull();
    expect(f.knowledgeAvg).toBeNull();
    expect(f.finding).toMatch(/No answer here was scored/);
  });

  it("never crowns a strongest area out of uniformly weak answers", () => {
    const findings = topicFindings([
      topic({ day: 10, knowledgeAvg: 2 }),
      topic({ day: 20, title: "Prompting", knowledgeAvg: 1 }),
    ]);
    for (const f of findings) expect(f.finding).not.toMatch(/strongest/);
  });

  it("sorts unscored topics last so they cannot lead the section", () => {
    const sorted = topicFindings([
      topic({ day: 10, knowledgeAvg: null, answered: 0 }),
      topic({ day: 20, title: "Prompting", knowledgeAvg: 2 }),
    ]);
    // topicFindings preserves order; topicsReached is what sorts. Assert the
    // level mapping stays correct either way.
    expect(sorted.map((f) => f.level)).toEqual([null, "Not explained yet"]);
  });

  it("maps the bands at their boundaries", () => {
    expect(levelFor(5)).toBe("Explained well");
    expect(levelFor(4)).toBe("Explained well");
    expect(levelFor(3.9)).toBe("Partly explained");
    expect(levelFor(3)).toBe("Partly explained");
    expect(levelFor(2.9)).toBe("Not explained yet");
    expect(levelFor(1)).toBe("Not explained yet");
    expect(levelFor(null)).toBeNull();
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

describe("questionTimeline — the panels' data, after the fact", () => {
  const q = (
    turnNumber: number,
    content: string,
    targetDay: number | null,
    depth: number | null,
    rationale: string | null,
    rubric: TurnRubric | null = { knowledge: 3, communication: 3, specificity: 3, objectivesHit: [] }
  ): Turn => ({
    turnNumber,
    role: "interviewer",
    content,
    targetDay,
    depth,
    rubric,
    claims: [],
    rationale,
  });

  const answer = (turnNumber: number): Turn => ({
    turnNumber,
    role: "candidate",
    content: "an answer",
    targetDay: null,
    depth: null,
    rubric: null,
    claims: [],
    rationale: null,
  });

  const days = [
    { day: 10, title: "Retrieval", reason: "r", startDepth: 2, strategy: "probe_gap" as const },
    { day: 28, title: "Deployment", reason: "r", startDepth: 2, strategy: "verify_depth" as const },
  ];

  it("numbers questions only, ignoring the candidate's turns", () => {
    const t = questionTimeline(
      [q(1, "one?", 10, 2, null, null), answer(2), q(3, "two?", 10, 3, "because X")],
      days
    );
    expect(t.map((e) => e.number)).toEqual([1, 2]);
    expect(t.map((e) => e.question)).toEqual(["one?", "two?"]);
  });

  it("gives the opener no rationale — it reacted to nothing", () => {
    const t = questionTimeline(
      [q(1, "opener?", 10, 2, "opening line from the blueprint", null), q(2, "next?", 10, 3, "because X")],
      days
    );
    expect(t[0].rationale).toBeNull();
    expect(t[1].rationale).toBe("because X");
  });

  it("marks where a new area began", () => {
    const t = questionTimeline(
      [q(1, "a?", 10, 2, "r"), q(2, "b?", 10, 3, "r"), q(3, "c?", 28, 2, "r")],
      days
    );
    expect(t.map((e) => e.startsTopic)).toEqual([true, false, true]);
    expect(t.map((e) => e.title)).toEqual(["Retrieval", "Retrieval", "Deployment"]);
  });

  it("skips the closing line written by /end", () => {
    // It carries no day and no depth, so it is not a question.
    const t = questionTimeline([q(1, "a?", 10, 2, "r"), q(2, "You ended the interview here.", null, null, null)], days);
    expect(t).toHaveLength(1);
  });

  it("carries the rung for display, and the band name with it", () => {
    const t = questionTimeline([q(1, "a?", 10, 4, "r")], days);
    expect(t[0].depth).toBe(4);
    expect(t[0].band).toBe("edge case");
  });
});
