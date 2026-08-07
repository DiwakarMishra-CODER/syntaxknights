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
import {
  initState,
  mayConclude,
  nextDirective,
  recordTurn,
  shouldEnd,
} from "../src/lib/orchestrator";
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

/**
 * Reads a multi-line answer. A single readline call truncated a pasted
 * answer at the first newline in the last run, and the lost text was
 * scored as a non-answer. Submit with a lone "." or /send.
 */
async function readAnswer(
  rl: ReturnType<typeof createInterface>,
  prompt: string
): Promise<string> {
  console.log(`${prompt} (finish with a single "." on its own line, or /quit)`);
  const lines: string[] = [];

  for (;;) {
    const line = await rl.question(lines.length === 0 ? "> " : "| ");
    const t = line.trim();

    if (t === "/quit") return "/quit";
    if (t === "." || t === "/send") break;
    lines.push(line);

    // A one-line answer with no continuation is the common case: allow a
    // blank line to submit it, but only when nothing is pending.
    if (t === "" && lines.length === 1) {
      lines.pop();
      continue;
    }
  }

  const answer = lines.join("\n").trim();
  // Echo so truncation is visible immediately, not three turns later.
  console.log(`\n  [captured ${answer.length} chars]\n  ${answer.replace(/\n/g, "\n  ")}\n`);
  return answer;
}

function statePanel(
  state: SessionState,
  rationale: string,
  violations: string[],
  substantive = true
) {
  const line = (k: string, v: string) => `  ${k.padEnd(16)} ${v}`;
  console.log(`\n  ${"-".repeat(62)}`);
  console.log(line("question", String(state.questionCount)));
  console.log(line("current day", String(state.currentDay)));
  console.log(line("depth", `${state.currentDepth}/5`));
  console.log(line("days covered", `[${state.daysCovered.join(", ")}]`));
  console.log(line("ability est.", state.abilityEstimate.toFixed(2)));
  console.log(line("mode", state.mode));
  console.log(
    line("follow-ups", `${state.followUpCount}/${state.followUpAllowance}`)
  );
  if (!substantive) console.log(line("scored", "no — non-substantive reply"));
  console.log(line("rationale", rationale));
  for (const v of violations) console.log(line("VIOLATION", v));
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
  let consecutiveReactions = 0;

  for (let i = 0; i < HARD_CAP && !concluded; i++) {
    const answer = replay
      ? replay.turns[i]?.answer
      : await readAnswer(rl!, "YOU:");

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

    // Constraints computed BEFORE the call, so the model writes its
    // question for the right topic and nothing is rewritten afterwards.
    const directive = nextDirective(state, blueprint, consecutiveReactions);

    const ctx: TurnContext = {
      blueprint,
      recentTurns: transcript.slice(-4), // token discipline: last 4 only
      claimLedger: ledger,
      targetDay: directive.targetDay,
      depth: directive.depth,
      questionsAsked: state.questionCount,
      directive,
    };

    const decision = replay
      ? replay.turns[i]!.decision
      : await runTurn(ctx, { onUsage: (u) => usages.push(u), maxWaitMs: 70_000 });

    record.turns.push({ answer, decision });

    const ending = shouldEnd(state, decision);
    const recorded = recordTurn(state, decision, blueprint, directive);
    state = recorded.state;

    ledger.push(...decision.claims);
    if (decision.substantive !== false) {
      rubrics.push({
        day: decision.targetDay,
        depth: decision.depth,
        rubric: decision.rubric,
      });
    }

    // Enforce the omission rather than trusting the instruction.
    const reaction = directive.omitReaction ? "" : (decision.reaction ?? "").trim();
    consecutiveReactions = reaction ? consecutiveReactions + 1 : 0;

    const said = [reaction, decision.question].filter(Boolean).join(" ").trim();
    console.log(`\nINTERVIEWER: ${said}`);
    statePanel(state, decision.rationale, recorded.violations, decision.substantive);

    transcript.push({
      turnNumber: transcript.length + 1,
      role: "interviewer",
      content: said,
      // The day the question is ACTUALLY about — the model wrote it for
      // this day because the directive told it to before generation.
      targetDay: decision.targetDay,
      depth: decision.depth,
      rubric: decision.substantive === false ? null : decision.rubric,
      claims: decision.claims,
      rationale: decision.rationale,
    });

    if (recorded.concludeBlocked) {
      console.warn(`  [orchestrator] refused to end early — continuing\n`);
    }

    // The closing beat is printed above; give them the last word rather
    // than exiting on an unanswered line.
    if (ending) {
      concluded = true;
      if (!replay) {
        const parting = await readAnswer(rl!, "YOU (last word, or just \".\"):");
        if (parting && parting !== "/quit") {
          transcript.push({
            turnNumber: transcript.length + 1,
            role: "candidate",
            content: parting,
            targetDay: state.currentDay,
            depth: state.currentDepth,
            rubric: null,
            claims: [],
            rationale: null,
          });
        }
      }
    }
  }

  rl?.close();

  console.log(`\n${"=".repeat(66)}\nFULL TRANSCRIPT\n${"=".repeat(66)}`);
  for (const t of transcript) {
    console.log(`\n[${t.turnNumber}] ${t.role === "candidate" ? "CANDIDATE" : "INTERVIEWER"}${
      t.targetDay ? ` (day ${t.targetDay}, depth ${t.depth})` : ""
    }`);
    console.log(t.content);
  }

  // Persist BEFORE the report. The second live run lost a 24-turn session
  // because the recording was written after, and the reporter threw.
  if (recording) {
    mkdirSync("fixtures", { recursive: true });
    writeFileSync(`fixtures/session-${id}.json`, JSON.stringify({ ...record, transcript }, null, 2));
    console.log(`\n[recorded ${record.turns.length} turns -> fixtures/session-${id}.json]`);
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
    const out = `fixtures/session-${id}.json`;
    writeFileSync(out, JSON.stringify({ ...record, transcript }, null, 2));
    console.log(`\nrecorded -> ${out}  (replay with FIXTURE_REPLAY=${out})`);
  }
}

main().catch((err) => {
  if (err instanceof LLMError) console.error(`\nLLMError [${err.kind}]: ${err.message}`);
  else console.error(`\n${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
