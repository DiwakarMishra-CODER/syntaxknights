/**
 * A/B: separate evaluator+interviewer (2 calls) vs the merged turn (1 call).
 *
 *   npm run compare:turn
 *
 * BOTH paths run on gemini-3.5-flash-lite so the merge is the only variable.
 * Runs once. Does not loop. Budget: 3 calls.
 */
import type { CallUsage } from "../src/lib/llm";
import { evaluate, type Evaluation } from "../src/lib/prompts/evaluator";
import { ask } from "../src/lib/prompts/interviewer";
import { filterInventedClaims } from "../src/lib/prompts/shared";
import { candidateWords, runTurn, type TurnContext, type TurnResult } from "../src/lib/prompts/turn";
import type { Blueprint, Claim, Turn } from "../src/lib/types";

const MODEL = "gemini-3.5-flash-lite";

const blueprint: Blueprint = {
  persona:
    "You are a staff engineer on a healthcare AI team talking with Harold, a 28-year veteran and Distinguished Engineer. You respect his deep systems background while curiously probing how he bridged traditional engineering into the modern LLM stack.",
  openingLine: "Harold, let's talk about how you deployed the chatbot.",
  targetQuestions: 10,
  arc: { warmup: 2, build: 3, stress: 3, land: 2 },
  focusDays: [
    {
      day: 28,
      title: "Docker & Kubernetes Deployment",
      reason: "Passed first try; 28 years of systems experience behind it.",
      startDepth: 3,
      strategy: "verify_depth",
    },
    {
      day: 23,
      title: "Model Context Protocol (MCP)",
      reason: "Needed 5 attempts — worth finding out what finally clicked.",
      startDepth: 2,
      strategy: "rebuild_confidence",
    },
    {
      day: 15,
      title: "Fine-Tuning: Hands-On with LoRA & QLoRA",
      reason: "Skipped entirely — check whether he picked it up elsewhere.",
      startDepth: 2,
      strategy: "probe_gap",
    },
    {
      day: 31,
      title: "Capstone Project & Final Demo",
      reason: "Passed after 2 attempts; the whole system comes together here.",
      startDepth: 3,
      strategy: "pressure_test",
    },
  ],
};

/** Four prior turns ending in a deliberately weak, vague answer. */
const recentTurns: Turn[] = [
  {
    turnNumber: 1,
    role: "interviewer",
    content:
      "You shipped the chatbot on Kubernetes. Walk me through how a new model version actually reaches production.",
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
      "We build a container image in CI and push it to the registry, then apply the updated manifest so Kubernetes rolls the pods. There's a readiness probe so traffic only shifts once the new pods answer health checks.",
    targetDay: 28,
    depth: 3,
    rubric: null,
    claims: [],
    rationale: null,
  },
  {
    turnNumber: 3,
    role: "interviewer",
    content:
      "What happens to an in-flight clinician conversation while those pods are being replaced?",
    targetDay: 28,
    depth: 4,
    rubric: null,
    claims: [],
    rationale: null,
  },
  {
    turnNumber: 4,
    role: "candidate",
    content:
      "Yeah, so we handle that. Kubernetes takes care of most of it really — it's pretty good at rolling things safely. We set it up properly so sessions keep working. I'd have to look at the config again to remember the exact details but it was handled.",
    targetDay: 28,
    depth: 4,
    rubric: null,
    claims: [],
    rationale: null,
  },
];

const claimLedger: Claim[] = [
  { day: 28, text: "builds images in CI and rolls pods via updated manifests", unjustified: false },
  { day: 28, text: "uses readiness probes to gate traffic shifting", unjustified: false },
  { day: 23, text: "MCP tool integration eventually worked after several attempts", unjustified: true },
];

const ctx: TurnContext = {
  blueprint,
  recentTurns,
  claimLedger,
  targetDay: 28,
  depth: 4,
  questionsAsked: 2,
};

interface Measured<T> {
  result: T;
  latencyMs: number;
  usages: CallUsage[];
}

async function pathA(): Promise<Measured<{ evaluation: Evaluation; move: unknown }>> {
  const usages: CallUsage[] = [];
  const started = Date.now();
  const evaluation = await evaluate(ctx, {
    model: MODEL,
    onUsage: (u) => usages.push(u),
  });
  const move = await ask(ctx, evaluation, {
    model: MODEL,
    onUsage: (u) => usages.push(u),
  });
  return { result: { evaluation, move }, latencyMs: Date.now() - started, usages };
}

async function pathB(): Promise<Measured<TurnResult>> {
  const usages: CallUsage[] = [];
  const started = Date.now();
  const result = await runTurn(ctx, {
    model: MODEL,
    onUsage: (u) => usages.push(u),
  });
  return { result, latencyMs: Date.now() - started, usages };
}

function totals(usages: CallUsage[]) {
  return usages.reduce(
    (acc, u) => ({
      calls: acc.calls + 1,
      input: acc.input + u.input,
      output: acc.output + u.output,
      thought: acc.thought + u.thought,
      total: acc.total + u.total,
    }),
    { calls: 0, input: 0, output: 0, thought: 0, total: 0 }
  );
}

/**
 * Reports claim fidelity for both paths against the candidate's own words.
 * Path A does not filter, so its claims are raw; path B filters inside
 * runTurn, so we print what it kept AND what it dropped. Without both, a
 * clean B is ambiguous — it could mean the prompt rule worked, or merely
 * that the filter caught a fabrication the prompt still produced.
 */
function reportClaimFidelity(label: string, raw: Claim[], said: string) {
  const { kept, rejected } = filterInventedClaims(raw, said);
  console.log(`\n  claim fidelity [${label}]: ${raw.length} raw, ${kept.length} grounded, ${rejected.length} invented`);
  for (const r of rejected) {
    console.log(`    INVENTED (${r.unsupportedTerms.join(", ")}): ${r.claim.text}`);
  }
  for (const k of kept) console.log(`    grounded: ${k.text}`);
}

async function main() {
  console.log(`Both paths on ${MODEL}. The merge is the only variable.\n`);

  const said = candidateWords(ctx);

  console.log("--- A: separate evaluator + interviewer (2 calls) ---");
  const a = await pathA();
  console.log(JSON.stringify(a.result, null, 2));
  reportClaimFidelity("A, unfiltered", a.result.evaluation.claims, said);

  console.log("\n--- B: merged turn (1 call) ---");
  const b = await pathB();
  console.log(JSON.stringify(b.result, null, 2));
  reportClaimFidelity(
    "B, pre-filter",
    [...b.result.claims, ...b.result.rejectedClaims],
    said
  );

  const ta = totals(a.usages);
  const tb = totals(b.usages);

  console.log(`\n${"=".repeat(72)}`);
  console.log(
    `${"path".padEnd(6)} ${"calls".padStart(5)} ${"latency".padStart(9)} ` +
      `${"in".padStart(7)} ${"out".padStart(6)} ${"thought".padStart(8)} ${"total".padStart(7)}`
  );
  console.log(
    `${"A".padEnd(6)} ${String(ta.calls).padStart(5)} ${`${a.latencyMs}ms`.padStart(9)} ` +
      `${String(ta.input).padStart(7)} ${String(ta.output).padStart(6)} ` +
      `${String(ta.thought).padStart(8)} ${String(ta.total).padStart(7)}`
  );
  console.log(
    `${"B".padEnd(6)} ${String(tb.calls).padStart(5)} ${`${b.latencyMs}ms`.padStart(9)} ` +
      `${String(tb.input).padStart(7)} ${String(tb.output).padStart(6)} ` +
      `${String(tb.thought).padStart(8)} ${String(tb.total).padStart(7)}`
  );

  // Signed, and labelled by direction — B is not always cheaper on tokens,
  // and printing "-41% fewer" would read as a saving when it is a cost.
  const delta = (from: number, to: number) => {
    const p = Math.round(((from - to) / from) * 100);
    return p >= 0 ? `${p}% fewer` : `${-p}% MORE`;
  };
  const pct = delta;
  console.log(
    `\nB uses ${tb.calls}/${ta.calls} of the requests, ` +
      `${pct(ta.total, tb.total)} tokens, ` +
      `${pct(a.latencyMs, b.latencyMs)} wall clock.`
  );
  console.log(
    `Per 10-turn interview: A = ${ta.calls * 10} requests, B = ${tb.calls * 10} requests.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
