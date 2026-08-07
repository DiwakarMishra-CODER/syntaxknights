/**
 * The full interview loop as a CLI. You answer as the candidate.
 *
 *   npm run interview CAND-017                  live
 *   FIXTURE_RECORD=1 npm run interview CAND-017 live, saving a replay fixture
 *   FIXTURE_REPLAY=fixtures/session-x.json npm run interview CAND-017
 *                                              replay, ZERO API calls
 *
 * The blueprint is loaded from fixtures/ rather than re-planned, so a run
 * costs ~10 turn calls plus 1 reporter call and nothing on the planner.
 *
 * State is held in memory here because this is a local CLI, not the
 * serverless route. The route must persist the identical SessionState to
 * Supabase every request — see CLAUDE.md. The orchestrator is pure, so
 * both callers share it unchanged.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createInterface } from "node:readline/promises";

import { LLMError, type CallUsage } from "../src/lib/llm";
import { applyTurn, initState, mayConclude } from "../src/lib/orchestrator";
import { writeReport } from "../src/lib/prompts/reporter";
import { runTurn, type TurnContext, type TurnResult } from "../src/lib/prompts/turn";
import { getCandidate } from "../src/lib/signals";
import type { Blueprint, Claim, Feedback, SessionState, Turn } from "../src/lib/types";

const HARD_CAP = 16; // safety net; the orchestrator should conclude first

interface Recording {
  candidateId: string;
  turns: Array<{ answer: string; decision: TurnResult }>;
  feedback: Feedback | null;
}

function loadBlueprint(id: string): Blueprint {
  const path = `fixtures/blueprint-${id}.json`;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Blueprint;
  } catch {
    throw new Error(`No saved blueprint at ${path}. Run: npm run plan ${id}`);
  }
}

function statePanel(state: SessionState, rationale: string, overrides: string[]) {
  const line = (k: string, v: string) => `  ${k.padEnd(16)} ${v}`;
  console.log(`\n  ${"-".repeat(62)}`);
  console.log(line("question", String(state.questionCount)));
  console.log(line("current day", String(state.currentDay)));
  console.log(line("depth", `${state.currentDepth}/5`));
  console.log(line("days covered", `[${state.daysCovered.join(", ")}]`));
  console.log(line("ability est.", state.abilityEstimate.toFixed(2)));
  console.log(line("mode", state.mode));
  console.log(line("follow-ups", String(state.followUpCount)));
  console.log(line("rationale", rationale));
  if (overrides.length) {
    for (const o of overrides) console.log(line("OVERRIDE", o));
  }
  console.log(`  ${"-".repeat(62)}\n`);
}

async function main() {
  const id = process.argv.slice(2).find((a) => !a.startsWith("-")) ?? "CAND-017";
  const replayPath = process.env.FIXTURE_REPLAY;
  const recording = process.env.FIXTURE_RECORD === "1";

  const candidate = getCandidate(id);
  if (!candidate) throw new Error(`${id} not found in data/candidates.json`);

  const blueprint = loadBlueprint(id);
  let state = initState(blueprint);

  const replay: Recording | null = replayPath
    ? (JSON.parse(readFileSync(replayPath, "utf8")) as Recording)
    : null;

  const transcript: Turn[] = [];
  const ledger: Claim[] = [];
  const rubrics: Array<{ day: number; depth: number; rubric: TurnResult["rubric"] }> = [];
  const record: Recording = { candidateId: id, turns: [], feedback: null };
  const usages: CallUsage[] = [];

  const rl = replay ? null : createInterface({ input: process.stdin, output: process.stdout });

  console.log(`\n${"=".repeat(66)}`);
  console.log(`${candidate.member.name} — ${candidate.member.jobRole}, ${candidate.member.yearsExperience}y`);
  console.log(`Focus days: ${blueprint.focusDays.map((f) => `${f.day} (${f.strategy})`).join(", ")}`);
  console.log(`${replay ? "REPLAY — no API calls" : recording ? "LIVE, recording fixture" : "LIVE"}`);
  console.log(`${"=".repeat(66)}\n`);

  console.log(`INTERVIEWER: ${blueprint.openingLine}\n`);
  transcript.push({
    turnNumber: 1,
    role: "interviewer",
    content: blueprint.openingLine,
    targetDay: state.currentDay,
    depth: state.currentDepth,
    rubric: null,
    claims: [],
    rationale: "opening line from the blueprint",
  });

  let concluded = false;

  for (let i = 0; i < HARD_CAP && !concluded; i++) {
    const answer = replay
      ? replay.turns[i]?.answer
      : await rl!.question("YOU: ");

    if (answer === undefined) break;
    if (!replay && answer.trim().toLowerCase() === "/quit") break;
    if (replay) console.log(`YOU: ${answer}\n`);

    transcript.push({
      turnNumber: transcript.length + 1,
      role: "candidate",
      content: answer,
      targetDay: state.currentDay,
      depth: state.currentDepth,
      rubric: null,
      claims: [],
      rationale: null,
    });

    const ctx: TurnContext = {
      blueprint,
      recentTurns: transcript.slice(-4), // token discipline: last 4 only
      claimLedger: ledger,
      targetDay: state.currentDay,
      depth: state.currentDepth,
      questionsAsked: state.questionCount,
    };

    const decision = replay
      ? replay.turns[i]!.decision
      : await runTurn(ctx, { onUsage: (u) => usages.push(u), maxWaitMs: 70_000 });

    record.turns.push({ answer, decision });

    const applied = applyTurn(state, decision, blueprint);
    state = applied.state;

    ledger.push(...decision.claims);
    rubrics.push({ day: decision.targetDay, depth: decision.depth, rubric: decision.rubric });

    console.log(
      `\nINTERVIEWER: ${applied.decision.reaction} ${applied.decision.question}`
    );
    statePanel(state, applied.decision.rationale, applied.overrides);

    transcript.push({
      turnNumber: transcript.length + 1,
      role: "interviewer",
      content: `${applied.decision.reaction} ${applied.decision.question}`,
      targetDay: applied.decision.targetDay,
      depth: applied.decision.depth,
      rubric: applied.decision.rubric,
      claims: applied.decision.claims,
      rationale: applied.decision.rationale,
    });

    if (applied.decision.action === "conclude") concluded = true;
  }

  rl?.close();

  console.log(`\n${"=".repeat(66)}\nFULL TRANSCRIPT\n${"=".repeat(66)}`);
  for (const t of transcript) {
    console.log(`\n[${t.turnNumber}] ${t.role === "candidate" ? "CANDIDATE" : "INTERVIEWER"}${
      t.targetDay ? ` (day ${t.targetDay}, depth ${t.depth})` : ""
    }`);
    console.log(t.content);
  }

  console.log(`\n${"=".repeat(66)}\nFINAL REPORT\n${"=".repeat(66)}`);
  const feedback = replay
    ? replay.feedback
    : await writeReport(
        {
          candidate,
          blueprint,
          transcript,
          claimLedger: ledger,
          rubrics,
          daysCovered: state.daysCovered,
          questionCount: state.questionCount,
        },
        { onUsage: (u) => usages.push(u), maxWaitMs: 70_000 }
      );

  record.feedback = feedback;

  if (feedback) {
    console.log(`\nSUMMARY\n  ${feedback.summary}`);
    console.log(`\nSTRENGTHS`);
    for (const s of feedback.strengths) console.log(`  - ${s}`);
    console.log(`\nGAPS`);
    for (const g of feedback.gaps) console.log(`  - ${g}`);
    console.log(`\nNEXT`);
    for (const n of feedback.next) console.log(`  - ${n}`);
  }

  console.log(
    `\n${"=".repeat(66)}\n` +
      `questions ${state.questionCount} · days covered [${state.daysCovered.join(", ")}] · ` +
      `floors met: ${mayConclude(state) ? "YES" : "NO"}\n` +
      `API calls: ${usages.length}  tokens: ${usages.reduce((s, u) => s + u.total, 0)}`
  );

  if (recording) {
    mkdirSync("fixtures", { recursive: true });
    const out = `fixtures/session-${id}.json`;
    writeFileSync(out, JSON.stringify(record, null, 2));
    console.log(`\nrecorded -> ${out}  (replay with FIXTURE_REPLAY=${out})`);
  }
}

main().catch((err) => {
  if (err instanceof LLMError) console.error(`\nLLMError [${err.kind}]: ${err.message}`);
  else console.error(`\n${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
