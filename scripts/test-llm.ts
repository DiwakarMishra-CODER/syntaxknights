/**
 * Smoke test for the LLM wrapper. Run with:
 *   npm run test:llm
 * (loads .env.local via node's --env-file)
 */
import { callLLM, keyCount, LLMError, ROLE_CONFIG } from "../src/lib/llm";

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

async function main() {
  console.log(`key pool: ${keyCount()} key(s)`);
  await textCall();
  await schemaCall();
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
