/**
 * Regenerates the final report from a recorded session, without re-running
 * the interview.
 *
 *   npm run report:fixture fixtures/session-CAND-017.json
 *
 * Costs 1 reporter call. Accepts either shape:
 *   { transcript: Turn[] }            a transcript-only fixture
 *   { turns: [{answer, decision}] }   a session recording
 */
import { readFileSync } from "node:fs";

import type { CallUsage } from "../src/lib/llm";
import { writeReport } from "../src/lib/prompts/reporter";
import type { TurnDecision } from "../src/lib/prompts/turn";
import { getCandidate } from "../src/lib/signals";
import type { Blueprint, Claim, Turn, TurnRubric } from "../src/lib/types";

interface Fixture {
  candidateId: string;
  transcript?: Turn[];
  turns?: Array<{ answer: string; decision: TurnDecision }>;
  blueprintPath?: string;
}

/** Rebuilds a transcript from a session recording when none was stored. */
function transcriptFrom(fx: Fixture, openingLine: string): Turn[] {
  if (fx.transcript?.length) return fx.transcript;

  const out: Turn[] = [];
  let n = 1;
  out.push({
    turnNumber: n++,
    role: "interviewer",
    content: openingLine,
    targetDay: null,
    depth: null,
    rubric: null,
    claims: [],
    rationale: null,
  });

  for (const t of fx.turns ?? []) {
    out.push({
      turnNumber: n++,
      role: "candidate",
      content: t.answer,
      targetDay: t.decision.targetDay,
      depth: t.decision.depth,
      rubric: null,
      claims: [],
      rationale: null,
    });
    out.push({
      turnNumber: n++,
      role: "interviewer",
      content: [t.decision.reaction, t.decision.question].filter(Boolean).join(" ").trim(),
      targetDay: t.decision.targetDay,
      depth: t.decision.depth,
      rubric: t.decision.rubric,
      claims: t.decision.claims,
      rationale: t.decision.rationale,
    });
  }
  return out;
}

async function main() {
  const path = process.argv.slice(2).find((a) => !a.startsWith("-"));
  if (!path) throw new Error("usage: npm run report:fixture <fixture.json>");

  const fx = JSON.parse(readFileSync(path, "utf8")) as Fixture;
  const candidate = getCandidate(fx.candidateId);
  if (!candidate) throw new Error(`${fx.candidateId} not found`);

  const blueprint = JSON.parse(
    readFileSync(fx.blueprintPath ?? `fixtures/blueprint-${fx.candidateId}.json`, "utf8")
  ) as Blueprint;

  const transcript = transcriptFrom(fx, blueprint.openingLine);

  const claimLedger: Claim[] = (fx.turns ?? []).flatMap((t) => t.decision.claims ?? []);
  const rubrics: Array<{ day: number; depth: number; rubric: TurnRubric }> = (
    fx.turns ?? []
  )
    .filter((t) => t.decision.substantive !== false && t.decision.rubric)
    .map((t) => ({
      day: t.decision.targetDay,
      depth: t.decision.depth,
      rubric: t.decision.rubric,
    }));

  const answered = transcript.filter((t) => t.role === "candidate").length;
  const daysCovered = [
    ...new Set(
      transcript
        .filter((t) => t.role === "interviewer" && t.targetDay !== null)
        .map((t) => t.targetDay as number)
    ),
  ];

  console.log(
    `${candidate.member.name} — ${transcript.length} turns, ${answered} answers, ` +
      `days [${daysCovered.join(", ")}], ${rubrics.length} scored, ` +
      `${claimLedger.length} claims\n`
  );

  const usages: CallUsage[] = [];
  const feedback = await writeReport(
    {
      candidate,
      blueprint,
      transcript,
      claimLedger,
      rubrics,
      daysCovered,
      questionCount: answered,
    },
    {
      onUsage: (u) => usages.push(u),
      maxWaitMs: 70_000,
      thinking: process.env.REPORT_THINKING as never,
    }
  );

  console.log(`\n${"=".repeat(66)}\nFINAL REPORT\n${"=".repeat(66)}`);
  console.log(`\nSUMMARY\n  ${feedback.summary}`);
  console.log(`\nSTRENGTHS`);
  for (const s of feedback.strengths) console.log(`  - ${s}`);
  console.log(`\nGAPS`);
  for (const g of feedback.gaps) console.log(`  - ${g}`);
  console.log(`\nNEXT`);
  for (const n of feedback.next) console.log(`  - ${n}`);
  console.log(
    `\n${"=".repeat(66)}\nAPI calls: ${usages.length}  tokens: ${usages.reduce(
      (s, u) => s + u.total,
      0
    )}`
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
