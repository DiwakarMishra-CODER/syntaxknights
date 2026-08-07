import { describe, expect, it } from "vitest";

import type { Feedback, Turn } from "../types";
import {
  buildReporterInput,
  candidateTranscriptText,
  degradeReport,
  extractQuotes,
  REPORTER_SYSTEM,
  verifyReport,
} from "./reporter";
import { getCandidate } from "../signals";

const transcript: Turn[] = [
  {
    turnNumber: 1,
    role: "interviewer",
    content: "Walk me through how a new model version reaches production.",
    targetDay: 28,
    depth: 3,
    rubric: null,
    claims: [],
    rationale: null,
  },
  {
    turnNumber: 2,
    role: "candidate",
    content:
      "We build a container image in CI and push it to the registry, then apply the updated manifest so Kubernetes rolls the pods.",
    targetDay: 28,
    depth: 3,
    rubric: null,
    claims: [],
    rationale: null,
  },
  {
    turnNumber: 3,
    role: "interviewer",
    content: "What happens to an in-flight conversation during that?",
    targetDay: 28,
    depth: 4,
    rubric: null,
    claims: [],
    rationale: null,
  },
  {
    turnNumber: 4,
    role: "candidate",
    content: "We set it up properly so sessions keep working.",
    targetDay: 28,
    depth: 4,
    rubric: null,
    claims: [],
    rationale: null,
  },
];

const base: Feedback = {
  summary: "A solid conversation about the deployment path.",
  strengths: [],
  gaps: [],
  next: ["Write down the rollout steps."],
};

describe("extractQuotes", () => {
  it("finds straight and curly quoted spans", () => {
    expect(extractQuotes('he said "rolls the pods" clearly')).toEqual(["rolls the pods"]);
    expect(extractQuotes("he said “rolls the pods” clearly")).toEqual([
      "rolls the pods",
    ]);
  });

  it("ignores trivially short quotes", () => {
    expect(extractQuotes('a "x" b')).toEqual([]);
  });
});

describe("verifyReport — the fabrication guard", () => {
  it("REJECTS a strength quoting words the candidate never said", () => {
    const feedback: Feedback = {
      ...base,
      strengths: [
        'Explained rollout well — "we drain connections before terminating the pod".',
      ],
    };
    const check = verifyReport(feedback, transcript);

    expect(check.ok).toBe(false);
    expect(check.fabricated).toContain(
      "we drain connections before terminating the pod"
    );
  });

  it("accepts a strength quoting the candidate verbatim", () => {
    const feedback: Feedback = {
      ...base,
      strengths: [
        'Clear on the deploy path — "apply the updated manifest so Kubernetes rolls the pods".',
      ],
    };
    expect(verifyReport(feedback, transcript).ok).toBe(true);
  });

  it("tolerates capitalisation and surrounding punctuation, not changed words", () => {
    const ok: Feedback = {
      ...base,
      strengths: ['Described CI clearly: "We build a container image in CI".'],
    };
    expect(verifyReport(ok, transcript).ok).toBe(true);

    const tampered: Feedback = {
      ...base,
      strengths: ['Described CI clearly: "We build a docker image in CI".'],
    };
    expect(verifyReport(tampered, transcript).ok).toBe(false);
  });

  it("rejects a strength with no quote at all", () => {
    const feedback: Feedback = {
      ...base,
      strengths: ["Good communication throughout."],
    };
    const check = verifyReport(feedback, transcript);
    expect(check.ok).toBe(false);
    expect(check.unquotedStrengths).toEqual(["Good communication throughout."]);
  });

  it("catches a fabricated quote in a gap too", () => {
    const feedback: Feedback = {
      ...base,
      strengths: ['Clear on CI — "push it to the registry".'],
      gaps: ['Vague on sessions — "we used a termination grace period of 30s".'],
    };
    const check = verifyReport(feedback, transcript);
    expect(check.ok).toBe(false);
    expect(check.fabricated).toContain("we used a termination grace period of 30s");
  });

  it("catches a fabricated quote in the summary", () => {
    const feedback: Feedback = {
      ...base,
      summary: 'You said "I benchmarked three vector stores" early on.',
      strengths: ['Clear on CI — "push it to the registry".'],
    };
    expect(verifyReport(feedback, transcript).ok).toBe(false);
  });

  it("never quotes the interviewer's own words as if they were the candidate's", () => {
    const feedback: Feedback = {
      ...base,
      strengths: ['You addressed "an in-flight conversation" directly.'],
    };
    // That phrase is the interviewer's, not the candidate's.
    expect(verifyReport(feedback, transcript).ok).toBe(false);
  });

  it("ALLOWS an unquoted gap — silence cannot be quoted", () => {
    const feedback: Feedback = {
      ...base,
      strengths: ['Clear on CI — "push it to the registry".'],
      gaps: ["Evaluation never came up in this conversation."],
    };
    const check = verifyReport(feedback, transcript);
    expect(check.ok).toBe(true);
    expect(check.unquotedGaps).toHaveLength(1);
  });
});

describe("candidateTranscriptText", () => {
  it("includes only candidate turns", () => {
    const text = candidateTranscriptText(transcript);
    expect(text).toContain("rolls the pods");
    expect(text).not.toContain("Walk me through");
  });
});

describe("reporter input", () => {
  it("now carries the full transcript", () => {
    const input = buildReporterInput({
      candidate: getCandidate("CAND-017")!,
      blueprint: {
        persona: "p",
        openingLine: "o",
        targetQuestions: 10,
        arc: { warmup: 2, build: 4, stress: 2, land: 2 },
        focusDays: [],
      },
      transcript,
      claimLedger: [],
      rubrics: [],
      daysCovered: [28],
      questionCount: 2,
    });

    expect(input).toContain("FULL TRANSCRIPT");
    expect(input).toContain("rolls the pods");
    expect(input).toContain("CLAIM LEDGER");
  });
});

describe("reporter prompt", () => {
  it("requires a direct quote in every strength and gap", () => {
    expect(REPORTER_SYSTEM).toMatch(/Every strength MUST contain at least one direct quote/);
    expect(REPORTER_SYSTEM).toMatch(/Every gap MUST do the same/);
  });

  it("carries the shared anti-invention rule", async () => {
    const { ANTI_INVENTION } = await import("./shared");
    expect(REPORTER_SYSTEM).toContain(ANTI_INVENTION);
  });

  it("gives an explicit escape valve rather than forcing an invented quote", () => {
    expect(REPORTER_SYSTEM).toMatch(/you cannot quote silence/);
  });
});

describe("degradeReport — never return nothing", () => {
  const ctx = {
    candidate: getCandidate("CAND-017")!,
    blueprint: {
      persona: "p",
      openingLine: "o",
      targetQuestions: 10,
      arc: { warmup: 2, build: 4, stress: 2, land: 2 },
      focusDays: [],
    },
    transcript,
    claimLedger: [],
    rubrics: [],
    daysCovered: [3, 10, 22, 28],
    questionCount: 9,
  };

  it("returns the surviving strength when 2 of 3 fail validation", () => {
    const feedback: Feedback = {
      summary: "A solid conversation.",
      strengths: [
        'Clear on the deploy path — "apply the updated manifest so Kubernetes rolls the pods".',
        'Explained draining — "we drain connections before terminating the pod".', // fabricated
        "Good communication throughout.", // no quote
      ],
      gaps: [],
      next: ["Write down the rollout steps."],
    };

    const { feedback: out, degradation } = degradeReport(feedback, ctx);

    expect(out.strengths).toHaveLength(1);
    expect(out.strengths[0]).toContain("rolls the pods");
    expect(degradation.droppedStrengths).toHaveLength(2);
    expect(degradation.strengthsBackfilled).toBe(false);
    // and it is a valid report, not an error
    expect(verifyReport(out, transcript).ok).toBe(true);
  });

  it("emits one honest unquoted line when every strength fails", () => {
    const feedback: Feedback = {
      summary: "A solid conversation.",
      strengths: ['Bad — "we drain connections before terminating the pod".'],
      gaps: [],
      next: ["Write down the rollout steps."],
    };

    const { feedback: out, degradation } = degradeReport(feedback, ctx);

    expect(out.strengths).toHaveLength(1);
    expect(out.strengths[0]).toContain("9 questions");
    expect(out.strengths[0]).not.toContain('"');
    expect(degradation.strengthsBackfilled).toBe(true);
  });

  it("keeps unquoted gaps but drops fabricated ones", () => {
    const feedback: Feedback = {
      summary: "A solid conversation.",
      strengths: ['Clear on CI — "push it to the registry".'],
      gaps: [
        "Evaluation never came up in this conversation.",
        'Vague — "we used a termination grace period of 30s".',
      ],
      next: ["Write down the rollout steps."],
    };

    const { feedback: out, degradation } = degradeReport(feedback, ctx);

    expect(out.gaps).toEqual(["Evaluation never came up in this conversation."]);
    expect(degradation.droppedGaps).toHaveLength(1);
  });

  it("replaces a summary containing a fabricated quote with a factual one", () => {
    const feedback: Feedback = {
      summary: 'You said "I benchmarked three vector stores" early on.',
      strengths: ['Clear on CI — "push it to the registry".'],
      gaps: [],
      next: ["Write down the rollout steps."],
    };

    const { feedback: out, degradation } = degradeReport(feedback, ctx);

    expect(degradation.summaryReplaced).toBe(true);
    expect(out.summary).toContain("9 questions");
    expect(out.summary).not.toContain("benchmarked");
  });

  it("always returns a contract-shaped object with non-empty strengths and next", () => {
    const wreckage: Feedback = {
      summary: 'All bad — "I benchmarked three vector stores".',
      strengths: ['Bad — "we drain connections before terminating the pod".'],
      gaps: ['Bad — "termination grace period of 30s".'],
      next: ['Bad — "I benchmarked three vector stores".'],
    };

    const { feedback: out } = degradeReport(wreckage, ctx);

    expect(typeof out.summary).toBe("string");
    expect(out.summary.length).toBeGreaterThan(0);
    expect(out.strengths.length).toBeGreaterThan(0);
    expect(Array.isArray(out.gaps)).toBe(true);
    expect(out.next.length).toBeGreaterThan(0);

    // The invariant for degraded output is NOT verifyReport().ok — the
    // backfilled strength is deliberately unquoted, which that gate
    // rejects by design. What must hold is that no fabricated quote
    // survives: everything invented has been removed.
    expect(verifyReport(out, transcript).fabricated).toEqual([]);
  });

  it("leaves no fabricated quote anywhere, even when everything failed", () => {
    const wreckage: Feedback = {
      summary: 'All bad — "I benchmarked three vector stores".',
      strengths: ['Bad — "we drain connections before terminating the pod".'],
      gaps: ['Bad — "termination grace period of 30s".'],
      next: ['Bad — "I benchmarked three vector stores".'],
    };

    const { feedback: out } = degradeReport(wreckage, ctx);
    const all = [out.summary, ...out.strengths, ...out.gaps, ...out.next].join(" ");

    expect(all).not.toContain("benchmarked");
    expect(all).not.toContain("drain connections");
    expect(all).not.toContain("grace period");
  });
});
