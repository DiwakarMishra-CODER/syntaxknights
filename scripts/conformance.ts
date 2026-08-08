/**
 * What the judges will do, automated.
 *
 *   npm run conformance -- --dry                 failure cases only, 0 LLM calls
 *   npm run conformance                          full interview (~11 LLM calls)
 *   npm run conformance -- --url https://...     against a deployment
 *
 * Uses plain fetch and asserts the contract exactly: the response must be
 * valid JSON carrying `reply` and `done` and NOTHING else, plus `feedback`
 * on the final turn.
 */
import { createSession, markDone } from "../src/lib/db";
import { getCandidate } from "../src/lib/signals";
import type { Blueprint } from "../src/lib/types";

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const URL_ARG = args[args.indexOf("--url") + 1];
const BASE = args.includes("--url") && URL_ARG ? URL_ARG : "http://localhost:3000";
const ENDPOINT = `${BASE.replace(/\/$/, "")}/api/interview`;
const CANDIDATE = "CAND-017";

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  ok ? passed++ : failed++;
  return ok;
}

interface Probe {
  status: number;
  json: Record<string, unknown> | null;
  raw: string;
}

async function post(body: unknown, rawBody?: string): Promise<Probe> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: rawBody ?? JSON.stringify(body),
  });
  const raw = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    /* left null — the caller asserts on it */
  }
  return { status: res.status, json, raw };
}

/** The contract: exactly reply+done, plus feedback only when done. */
function assertShape(label: string, p: Probe) {
  if (!check(`${label}: valid JSON`, p.json !== null, p.raw.slice(0, 120))) return;

  const keys = Object.keys(p.json!).sort();
  const done = p.json!.done === true;
  const expected = done ? ["done", "feedback", "reply"] : ["done", "reply"];

  check(`${label}: exactly ${expected.join("+")}`, keys.join(",") === expected.join(","), `got ${keys.join(",")}`);
  check(`${label}: reply is a string`, typeof p.json!.reply === "string");
  check(`${label}: done is a boolean`, typeof p.json!.done === "boolean");
}

function assertFeedback(p: Probe) {
  const fb = p.json?.feedback as Record<string, unknown> | undefined;
  if (!check("final: feedback present", !!fb)) return;

  const keys = Object.keys(fb!).sort();
  check("final: feedback has exactly summary/strengths/gaps/next",
    keys.join(",") === "gaps,next,strengths,summary", `got ${keys.join(",")}`);
  check("final: summary is a non-empty string",
    typeof fb!.summary === "string" && (fb!.summary as string).length > 0);
  for (const k of ["strengths", "gaps", "next"] as const) {
    check(`final: ${k} is an array of strings`,
      Array.isArray(fb![k]) && (fb![k] as unknown[]).every((x) => typeof x === "string"));
  }
  check("final: strengths is non-empty", (fb!.strengths as unknown[]).length > 0);
  check("final: next is non-empty", (fb!.next as unknown[]).length > 0);
}

// ---------------------------------------------------------------------------

/**
 * `/end` has its OWN contract and must never be checked with assertShape —
 * that helper asserts exactly reply+done, and pointing it here would either
 * fail or, worse, tempt someone to loosen it and take the frozen
 * /api/interview contract with it.
 */
async function postTo(path: string): Promise<Probe> {
  const res = await fetch(`${BASE.replace(/\/$/, "")}${path}`, { method: "POST" });
  const raw = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    /* left null — the caller asserts on it */
  }
  return { status: res.status, json, raw };
}

async function getFrom(path: string): Promise<Probe> {
  const res = await fetch(`${BASE.replace(/\/$/, "")}${path}`, { cache: "no-store" });
  const raw = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    /* left null */
  }
  return { status: res.status, json, raw };
}

/**
 * The candidate ending the interview themselves.
 *
 * Runs at questionCount 0 on purpose: `worthReporting` is false there, so the
 * reporter is skipped entirely and the whole round trip costs zero quota.
 */
async function endEndpoint() {
  console.log("\nENDING EARLY (no LLM calls — questionCount is 0, so the reporter is skipped)");

  const id = `conformance-end-${process.pid}`;
  const candidate = getCandidate(CANDIDATE)!;
  const stub: Blueprint = {
    persona: "p",
    openingLine: "o",
    targetQuestions: 10,
    arc: { warmup: 2, build: 4, stress: 2, land: 2 },
    focusDays: [
      { day: 10, title: "t", reason: "r", startDepth: 2, strategy: "verify_depth" },
      { day: 20, title: "t", reason: "r", startDepth: 2, strategy: "probe_gap" },
      { day: 28, title: "t", reason: "r", startDepth: 2, strategy: "verify_depth" },
      { day: 31, title: "t", reason: "r", startDepth: 2, strategy: "probe_gap" },
    ],
  };

  const missing = await postTo(`/api/session/no-such-session-${process.pid}/end`);
  check("unknown session: 404", missing.status === 404, `got ${missing.status}`);
  check("unknown session: parseable JSON", missing.json !== null, missing.raw.slice(0, 120));

  try {
    await createSession(id, candidate, stub);
  } catch (err) {
    check("end: setup", false, (err as Error).message);
    return;
  }

  const first = await postTo(`/api/session/${id}/end`);
  check("end: 200", first.status === 200, `got ${first.status}`);
  check("end: ok true", first.json?.ok === true);
  check("end: endedEarly true", first.json?.endedEarly === true);
  check("end: alreadyDone false", first.json?.alreadyDone === false);

  // The double-click guard. A second press must not spend another reporter
  // call — the candidate is already looking at the report page.
  const second = await postTo(`/api/session/${id}/end`);
  check("end twice: 200", second.status === 200, `got ${second.status}`);
  check("end twice: alreadyDone true", second.json?.alreadyDone === true);

  // The frozen contract has to survive a session ended out from under it.
  assertShape("message after ending early", await post({ sessionId: id, message: "hi" }));

  const state = await getFrom(`/api/session/${id}/state`);
  check("state after ending: done", state.json?.status === "done", `got ${String(state.json?.status)}`);
  check("state after ending: endedEarly true", state.json?.endedEarly === true);
}

// ---------------------------------------------------------------------------

async function failureCases() {
  console.log("\nFAILURE CASES (no LLM calls)");

  assertShape("malformed JSON", await post(null, "{not json"));
  assertShape("empty body", await post({}));
  assertShape("missing sessionId", await post({ message: "hello" }));
  assertShape("unknown sessionId", await post({ sessionId: `nope-${Date.now()}`, message: "hi" }));
  assertShape("first request with unknown candidate", await post({ sessionId: `x-${Date.now()}`, candidate: "CAND-999" }));
  assertShape("empty message", await post({ sessionId: `y-${Date.now()}`, message: "   " }));

  // A finished session, created directly so no interview has to be run.
  const doneId = `conformance-done-${process.pid}`;
  const candidate = getCandidate(CANDIDATE)!;
  const stub: Blueprint = {
    persona: "p",
    openingLine: "o",
    targetQuestions: 10,
    arc: { warmup: 2, build: 4, stress: 2, land: 2 },
    focusDays: [
      { day: 10, title: "t", reason: "r", startDepth: 2, strategy: "verify_depth" },
      { day: 20, title: "t", reason: "r", startDepth: 2, strategy: "probe_gap" },
      { day: 28, title: "t", reason: "r", startDepth: 2, strategy: "verify_depth" },
      { day: 31, title: "t", reason: "r", startDepth: 2, strategy: "probe_gap" },
    ],
  };
  try {
    await createSession(doneId, candidate, stub);
    await markDone(doneId);
    assertShape("message on a finished session", await post({ sessionId: doneId, message: "hi" }));
  } catch (err) {
    check("message on a finished session", false, `setup failed: ${(err as Error).message}`);
  }
}

const ANSWERS = [
  "We used ChromaDB for the vector store, chunked the healthcare docs and embedded them, then did a similarity search at query time.",
  "We used the LangChain splitter default, about 1000 characters with overlap. We never tested other sizes.",
  "It would get split in half and neither chunk would carry the whole policy limit.",
  "There was no router — everything went to vector search regardless of the question.",
  "It would return the closest chunk, so a question about a deductible might get a general paragraph instead of the number.",
  "Only a line in the system prompt telling it not to invent numbers. We never verified it worked.",
  "We kept the last ten messages and dropped the oldest ones. That number came from a tutorial.",
  "Kubernetes secrets, created with kubectl and mounted as environment variables in the deployment yaml.",
  "The retrieval held up in the demo but the agent routing was flaky so we avoided triggering it.",
  "I'd start by writing test cases with known deductible values and checking the answers match.",
  "Mostly that I'd add a router and actually measure retrieval quality before shipping again.",
  "Thanks — how large is the team, and would I be closer to retrieval or to the agent side?",
];

async function fullInterview() {
  console.log(`\nFULL INTERVIEW against ${ENDPOINT}`);
  const sessionId = `conformance-${Date.now()}`;

  const first = await post({ sessionId, candidate: CANDIDATE });
  assertShape("opening", first);
  check("opening: done is false", first.json?.done === false);
  console.log(`\n  INTERVIEWER: ${String(first.json?.reply).slice(0, 120)}\n`);

  let questions = 0;
  let finalProbe: Probe | null = null;

  for (const answer of ANSWERS) {
    const p = await post({ sessionId, message: answer });
    assertShape(`turn ${questions + 1}`, p);
    if (!p.json) break;

    questions++;
    console.log(`  Q${questions}: ${String(p.json.reply).slice(0, 110)}`);

    if (p.json.done === true) {
      finalProbe = p;
      break;
    }
  }

  check("at least 8 questions before done", questions >= 8, `got ${questions}`);

  if (!check("interview reached done", finalProbe !== null)) return;
  assertFeedback(finalProbe!);

  // Day coverage is not observable through the API by design, so it is
  // verified against the persisted turns instead.
  const { getRecentTurns } = await import("../src/lib/db");
  const turns = await getRecentTurns(sessionId, 200);
  const days = new Set(
    turns.filter((t) => t.role === "interviewer" && t.targetDay).map((t) => t.targetDay)
  );
  check("at least 4 distinct days covered", days.size >= 4, `got ${days.size}: ${[...days].join(", ")}`);
}

async function main() {
  console.log(`Conformance against ${ENDPOINT}${DRY ? "  [--dry: failure cases only]" : ""}`);

  await failureCases();
  await endEndpoint();
  if (!DRY) await fullInterview();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("\nconformance harness error:", err);
  process.exitCode = 1;
});
