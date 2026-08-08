/**
 * Round-trip check for the Supabase layer. Run with:
 *   npm run test:db
 *
 * Exercises every helper in src/lib/db.ts against the real tables, then
 * deletes the test session (turns and reports cascade).
 */
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

import {
  appendTurn,
  createSession,
  getClaimLedger,
  getRecentTurns,
  loadSession,
  markDone,
  saveReport,
  saveSessionState,
} from "../src/lib/db";
import { getCandidate } from "../src/lib/signals";

const SESSION_ID = `smoke-${process.pid}`;

let failures = 0;

function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function cleanup() {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: ws as unknown as never },
    }
  );
  await client.from("sessions").delete().eq("id", SESSION_ID);
}

async function main() {
  const candidate = getCandidate("CAND-018");
  if (!candidate) throw new Error("CAND-018 not found in data/candidates.json");

  console.log(`session id: ${SESSION_ID}\n`);

  console.log("createSession / loadSession");
  await createSession(SESSION_ID, candidate, {
    persona: "A staff engineer on a healthcare AI team.",
    openingLine: "Tell me about the retrieval layer you shipped.",
    targetQuestions: 10,
    arc: { warmup: 2, build: 4, stress: 3, land: 1 },
    focusDays: [
      { day: 7, title: "d7", reason: "r", startDepth: 2, strategy: "probe_gap" },
      { day: 12, title: "d12", reason: "r", startDepth: 3, strategy: "verify_depth" },
      { day: 22, title: "d22", reason: "r", startDepth: 3, strategy: "pressure_test" },
      { day: 27, title: "d27", reason: "r", startDepth: 2, strategy: "probe_gap" },
    ],
  });
  const loaded = await loadSession(SESSION_ID);
  check("session round-trips", loaded !== null);
  check("candidate jsonb survives", loaded?.candidate?.member?.id === "CAND-018");
  check(
    "blueprint jsonb survives",
    loaded?.blueprint?.focusDays?.length === 4 &&
      loaded?.blueprint?.arc?.build === 4
  );
  check("status defaults to active", loaded?.status === "active");

  console.log("\nloadSession on a missing id");
  const missing = await loadSession("does-not-exist-at-all");
  check("returns null rather than throwing", missing === null);

  console.log("\nsaveSessionState");
  await saveSessionState(SESSION_ID, {
    questionCount: 2,
    daysCovered: [7, 12],
    currentDay: 12,
    currentDepth: 1,
    followUpCount: 1,
    followUpAllowance: 3,
    abilityEstimate: 3.4,
    mode: "recovery",
    consecutiveWeak: 2,
    consecutiveStrong: 0,
    lastScores: null,
    depthViolations: 0,
    consecutiveReactions: 1,
    endedEarly: false,
    lastTurnSubstantive: true,
  });
  const restated = await loadSession(SESSION_ID);
  check(
    "state persisted",
    restated?.state?.currentDay === 12 &&
      restated?.state?.mode === "recovery" &&
      JSON.stringify(restated?.state?.daysCovered) === "[7,12]"
  );

  console.log("\nappendTurn x3 (turn_number auto-derived)");
  await appendTurn(SESSION_ID, {
    role: "interviewer",
    content: "Walk me through the retrieval layer you built on day 12.",
    targetDay: 12,
    depth: 1,
    rubric: null,
    claims: [],
    rationale: "opening probe",
  });
  await appendTurn(SESSION_ID, {
    role: "candidate",
    content: "I used pgvector with a 768-dim embedding.",
    targetDay: 12,
    depth: 1,
    rubric: { knowledge: 4, communication: 3, specificity: 3, objectivesHit: [] },
    claims: [{ day: 12, text: "used pgvector", status: "asserted" }],
    rationale: null,
  });
  await appendTurn(SESSION_ID, {
    role: "interviewer",
    content: "Why 768 and not 1536?",
    targetDay: 12,
    depth: 2,
    rubric: null,
    claims: [{ day: 12, text: "chose 768 dims deliberately", status: "probed" }],
    rationale: "probe the number",
  });

  const recent = await getRecentTurns(SESSION_ID, 2);
  check("getRecentTurns respects n", recent.length === 2, `got ${recent.length}`);
  check(
    "returned in chronological order",
    recent[0].turnNumber === 2 && recent[1].turnNumber === 3,
    recent.map((t) => t.turnNumber).join(",")
  );
  check("turn_number auto-incremented to 3", recent[1].turnNumber === 3);
  check("rubric jsonb survives", recent[0].rubric?.specificity === 3);

  const ledger = await getClaimLedger(SESSION_ID);
  check("claim ledger flattens all turns", ledger.length === 2, `got ${ledger.length}`);
  check("ledger keeps turn order", ledger[0]?.text === "used pgvector");

  console.log("\nsaveReport / markDone");
  await saveReport(SESSION_ID, {
    summary: "Solid on retrieval, thin on evaluation.",
    strengths: ["clear on pgvector trade-offs"],
    gaps: ["no offline eval"],
    next: ["add a golden set"],
  });
  await saveReport(SESSION_ID, {
    summary: "Upserted twice — should not error.",
    strengths: [],
    gaps: [],
    next: [],
  });
  check("saveReport is idempotent (upsert)", true);

  await markDone(SESSION_ID);
  const done = await loadSession(SESSION_ID);
  check("status flipped to done", done?.status === "done");

  console.log("\ncleanup");
  await cleanup();
  const gone = await loadSession(SESSION_ID);
  check("session deleted (turns/reports cascade)", gone === null);

  console.log(
    failures === 0
      ? "\nAll db helpers round-trip correctly."
      : `\n${failures} check(s) FAILED.`
  );
  if (failures > 0) process.exitCode = 1;
}

main().catch(async (err) => {
  console.error("\nError:", err instanceof Error ? err.message : err);
  try {
    await cleanup();
  } catch {
    console.error(`Could not clean up test session ${SESSION_ID} — delete it by hand.`);
  }
  process.exitCode = 1;
});
