/**
 * Smoke test for the LLM wrapper. Run with:
 *   npm run test:llm
 * (loads .env.local via node's --env-file)
 */
import { getDay } from "../src/lib/curriculum";
import {
  callLLM,
  keyCount,
  LLMError,
  ROLE_CONFIG,
  type CallUsage,
  type ThinkingLevel,
} from "../src/lib/llm";
import { deriveSignals, getCandidate } from "../src/lib/signals";

const SYSTEM =
  "You are a terse assistant used for smoke-testing an API wrapper. Answer exactly what is asked.";

async function textCall() {
  console.log("\n--- 1. plain text call (interviewer) ---");
  const started = Date.now();
  const reply = await callLLM({
    role: "interviewer",
    system: SYSTEM,
    input: "Reply with exactly the word: pong",
  });
  console.log(`model:   ${ROLE_CONFIG.interviewer.model}`);
  console.log(`latency: ${Date.now() - started}ms`);
  console.log(`reply:   ${JSON.stringify(reply)}`);
}

const SCHEMA = {
  type: "object",
  properties: {
    day: { type: "integer" },
    topic: { type: "string" },
    questions: { type: "array", items: { type: "string" } },
  },
  required: ["day", "topic", "questions"],
} as const;

interface Probe {
  day: number;
  topic: string;
  questions: string[];
}

async function schemaCall() {
  console.log("\n--- 2. schema-enforced JSON call (evaluator) ---");
  const started = Date.now();
  const result = await callLLM<Probe>({
    role: "evaluator",
    system: SYSTEM,
    input:
      "A student built a healthcare chatbot on day 12 covering retrieval. " +
      "Return day=12, a one-word topic, and exactly 2 short follow-up questions.",
    schema: SCHEMA as unknown as Record<string, unknown>,
  });

  console.log(`model:   ${ROLE_CONFIG.evaluator.model}`);
  console.log(`latency: ${Date.now() - started}ms`);
  console.log(`parsed:  ${JSON.stringify(result, null, 2)}`);

  const ok =
    typeof result?.day === "number" &&
    typeof result?.topic === "string" &&
    Array.isArray(result?.questions) &&
    result.questions.every((q) => typeof q === "string");

  console.log(ok ? "shape:   OK" : "shape:   FAILED");
  if (!ok) process.exitCode = 1;
}

/**
 * Builds a realistic mid-interview turn prompt (~2000 tokens) out of real
 * project data, so the thinking-level sweep measures something close to
 * what the interviewer will actually send every turn.
 */
function realisticTurnInput(): string {
  const candidate = getCandidate("CAND-008")!;
  const s = deriveSignals(candidate);
  const days = [10, 12, 16, 22, 23, 27, 28].map(getDay);

  const transcript = [
    ["interviewer", "Walk me through how the retrieval layer in the chatbot actually works, end to end."],
    ["candidate", "So when a clinician types a question, we embed it and search our vector store for the closest matching passages from the policy documents. We take the top 5 and stuff them into the prompt as context before calling the model."],
    ["interviewer", "What happens when none of those five passages are actually relevant?"],
    ["candidate", "Honestly that was a problem for a while. Early on it would just confidently answer from whatever came back. We added a relevance threshold on the similarity score so if nothing clears it we return a fallback saying we don't have that information."],
    ["interviewer", "How did you pick the threshold?"],
    ["candidate", "Mostly by trial and error against a set of questions we knew should fail. I don't have a principled justification for the exact number."],
    ["interviewer", "That's fair, and honestly more honest than most answers. Let's talk about what happens after retrieval."],
    ["candidate", "After retrieval we build the prompt with the system instructions, the retrieved passages, and the last few turns of conversation, then call the model and stream the answer back."],
    ["interviewer", "You mentioned the last few turns. How many, and what happens to the ones before that?"],
    ["candidate", "We keep the last six turns verbatim. Anything older gets dropped. We did look at summarising the older turns instead but ran out of time before the demo, so right now it just falls off the end of the window."],
    ["interviewer", "Did dropping them ever cause a visible problem?"],
    ["candidate", "Yes, in a long conversation the model would forget which patient record the clinician was asking about and start answering generically. We never properly fixed it. If I were doing it again I would keep a small running summary of entities mentioned, similar to how we tracked claims elsewhere."],
    ["interviewer", "Let's go somewhere else. Tell me about deploying it."],
    ["candidate", "It runs as a container behind an API gateway. We have a staging environment and a production one, and a GitHub Action that runs the test suite and then pushes the image. Rollbacks are manual — you redeploy the previous tag by hand."],
    ["interviewer", "What does the test suite actually cover?"],
    ["candidate", "Mostly unit tests around the retrieval and prompt assembly code. There's one end-to-end test that asks a known question and checks the answer contains an expected phrase. It's shallow, I know. We didn't have a proper evaluation set."],
  ]
    .map(([role, text]) => `${role.toUpperCase()}: ${text}`)
    .join("\n\n");

  const ledger = [
    "day 12 — used a similarity threshold to suppress low-confidence answers (asserted, unverified)",
    "day 12 — picked the threshold empirically, no principled basis (asserted, candidate volunteered the weakness)",
    "day 22 — streams responses back to the client (asserted, unverified)",
    "day 27 — claims PHI is redacted before it reaches the model (asserted, NOT yet probed)",
  ].join("\n");

  return [
    `CANDIDATE`,
    `${candidate.member.name} — ${candidate.member.jobRole}, ${candidate.member.yearsExperience}y, ${candidate.member.education}`,
    `Coverage ${(s.coverage * 100).toFixed(0)}%, first-try ${(s.firstTryRate * 100).toFixed(0)}%, commits on ${(s.engagement * 100).toFixed(0)}% of days.`,
    `Skipped days: ${s.skippedDays.join(", ") || "none"}. Struggled (3+ attempts): ${s.struggledDays.join(", ") || "none"}.`,
    `Profile: ${s.profileNote}`,
    ``,
    `CURRICULUM CONTEXT (the cohort is one continuous build: an enterprise healthcare chatbot)`,
    ...days.map(
      (d) =>
        `Day ${d.day} — ${d.title} [${d.type}]\n  tools: ${d.tools.join(", ")}\n  objectives:\n${d.objectives.map((o) => `    - ${o}`).join("\n")}`
    ),
    ``,
    `CLAIM LEDGER`,
    ledger,
    ``,
    `RECENT TRANSCRIPT`,
    transcript,
    ``,
    `TASK`,
    `Ask the single best next question. It must build on what they just said, stay anchored to the healthcare chatbot they actually built, and move toward verifying one unprobed claim in the ledger. Return only the question text.`,
  ].join("\n");
}

const LEVELS = (process.env.SWEEP_LEVELS?.split(",") as ThinkingLevel[]) ?? [
  "high",
  "medium",
  "low",
  "minimal",
];
const TRIALS = Number(process.env.SWEEP_TRIALS ?? 2);

async function thinkingSweep() {
  const input = realisticTurnInput();
  const approxTokens = Math.round(input.length / 4);
  console.log(
    `\n--- 3. thinking-level sweep (interviewer role, ${input.length} chars ≈ ${approxTokens} tokens, ${TRIALS} trials each) ---`
  );

  const rows: string[] = [];

  for (const level of LEVELS) {
    const latencies: number[] = [];
    const thoughts: number[] = [];
    let inTok = 0;
    let outTok = 0;
    let failure = "";

    for (let t = 0; t < TRIALS; t++) {
      const started = Date.now();
      try {
        let usage: CallUsage | null = null;
        const reply = await callLLM({
          role: "interviewer",
          system: SYSTEM,
          input,
          thinking: level,
          onUsage: (u) => {
            usage = u;
          },
        });
        latencies.push(Date.now() - started);
        const u = usage as CallUsage | null;
        thoughts.push(u?.thought ?? 0);
        inTok = u?.input ?? 0;
        outTok = u?.output ?? 0;
        if (t === 0) {
          console.log(`\n  [${level}] first reply: ${JSON.stringify(reply.slice(0, 160))}`);
        }
      } catch (err) {
        failure = err instanceof LLMError ? `${err.kind}` : "error";
        console.log(`  [${level}] FAILED: ${(err as Error).message}`);
        break;
      }
    }

    if (failure) {
      rows.push(`  ${level.padEnd(8)} FAILED (${failure})`);
      continue;
    }

    const mean = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    const meanThought = Math.round(thoughts.reduce((a, b) => a + b, 0) / thoughts.length);
    rows.push(
      `  ${level.padEnd(8)} ${String(mean).padStart(6)}ms  ` +
        `[${latencies.map((l) => `${l}ms`).join(", ")}]  ` +
        `thought=${String(meanThought).padStart(4)}  in=${inTok} out=${outTok}`
    );
  }

  console.log(`\n  level      mean latency  trials                thought tokens`);
  console.log(rows.join("\n"));
}

async function main() {
  console.log(`key pool: ${keyCount()} key(s)`);
  await textCall();
  await schemaCall();
  await thinkingSweep();
  console.log("\ndone.");
}

main().catch((err) => {
  if (err instanceof LLMError) {
    console.error(`\nLLMError [${err.kind}] ${err.message}`);
  } else {
    console.error("\nUnexpected error:", err);
  }
  process.exitCode = 1;
});
