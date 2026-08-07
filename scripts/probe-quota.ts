/**
 * Measures the real free-tier request budget per model.
 *
 *   npm run probe:quota
 *
 * Uses ONLY the first key in GEMINI_API_KEYS so the rest of the pool stays
 * clean. That key's daily budget is spent by this script — that is the
 * intended cost.
 *
 * Deliberately bypasses src/lib/llm.ts: no rotation, no retry, no backoff.
 * We want the first 429 verbatim, not a resilient call.
 */
import { GoogleGenAI } from "@google/genai";

const MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
];

const INTERVAL_MS = 5000;
const MAX_REQUESTS = 60;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Outcome =
  | { kind: "exhausted"; successes: number; metric: string; limit: string; retryAfter: string }
  | { kind: "unavailable"; successes: number; status: string; detail: string }
  | { kind: "error"; successes: number; status: string; detail: string }
  | { kind: "capped"; successes: number };

interface ErrorFacts {
  status: string;
  metric: string | null;
  limit: string | null;
  retryAfter: string | null;
  notFound: boolean;
  message: string;
}

function readError(err: unknown): ErrorFacts {
  const e = err as { status?: number; message?: string };
  const message = String(e?.message ?? err ?? "");
  return {
    status: String(e?.status ?? "?"),
    metric: message.match(/metric:\s*([\w./-]+)/)?.[1] ?? null,
    limit: message.match(/limit:\s*(\d+)/)?.[1] ?? null,
    retryAfter: message.match(/retry in ([\d.]+)s/i)?.[1] ?? null,
    notFound:
      e?.status === 404 ||
      /not_found|not found|is not supported|does not exist|unsupported model/i.test(
        message
      ),
    message: message.replace(/\s+/g, " ").slice(0, 220),
  };
}

async function probe(ai: GoogleGenAI, model: string): Promise<Outcome> {
  let successes = 0;

  for (let i = 0; i < MAX_REQUESTS; i++) {
    try {
      await ai.interactions.create({
        model,
        input: "Reply with the single word: ok",
        generation_config: { thinking_level: "minimal", max_output_tokens: 16 },
      });
      successes++;
      process.stdout.write(
        `\r  ${model}: ${successes} success${successes === 1 ? "" : "es"}   `
      );
    } catch (err) {
      const f = readError(err);
      process.stdout.write("\n");

      if (f.notFound) {
        console.log(`  ${model}: UNAVAILABLE after ${successes} — status ${f.status}`);
        console.log(`    ${f.message}`);
        return { kind: "unavailable", successes, status: f.status, detail: f.message };
      }

      if (f.status === "429") {
        console.log(`  ${model}: 429 after ${successes} successes`);
        console.log(`    metric:      ${f.metric ?? "(none reported)"}`);
        console.log(`    limit:       ${f.limit ?? "(none reported)"}`);
        console.log(`    retry after: ${f.retryAfter ?? "(none reported)"}s`);
        return {
          kind: "exhausted",
          successes,
          metric: f.metric ?? "(none)",
          limit: f.limit ?? "(none)",
          retryAfter: f.retryAfter ?? "(none)",
        };
      }

      console.log(`  ${model}: ERROR status ${f.status} after ${successes}`);
      console.log(`    ${f.message}`);
      return { kind: "error", successes, status: f.status, detail: f.message };
    }

    if (i < MAX_REQUESTS - 1) await sleep(INTERVAL_MS);
  }

  process.stdout.write("\n");
  console.log(`  ${model}: reached the ${MAX_REQUESTS}-request cap with no 429`);
  return { kind: "capped", successes };
}

async function main() {
  const keys = (process.env.GEMINI_API_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (keys.length === 0) throw new Error("GEMINI_API_KEYS is empty");

  console.log(
    `Probing ${MODELS.length} models with key #0 of ${keys.length}, ` +
      `1 request every ${INTERVAL_MS / 1000}s, max ${MAX_REQUESTS} each.\n`
  );

  const ai = new GoogleGenAI({ apiKey: keys[0] });
  const results: Array<[string, Outcome]> = [];

  for (const model of MODELS) {
    console.log(`\n${model}`);
    results.push([model, await probe(ai, model)]);
  }

  console.log(`\n\n${"=".repeat(78)}\nSUMMARY\n${"=".repeat(78)}`);
  console.log(
    `${"model".padEnd(24)} ${"result".padEnd(13)} ${"n".padStart(3)}  quota metric / detail`
  );

  for (const [model, r] of results) {
    const n = String(r.successes).padStart(3);
    if (r.kind === "exhausted") {
      console.log(
        `${model.padEnd(24)} ${"429".padEnd(13)} ${n}  ${r.metric} (limit ${r.limit})`
      );
    } else if (r.kind === "unavailable") {
      console.log(
        `${model.padEnd(24)} ${"UNAVAILABLE".padEnd(13)} ${n}  status ${r.status}`
      );
    } else if (r.kind === "capped") {
      console.log(
        `${model.padEnd(24)} ${`>=${MAX_REQUESTS}`.padEnd(13)} ${n}  no 429 within cap`
      );
    } else {
      console.log(
        `${model.padEnd(24)} ${`ERR ${r.status}`.padEnd(13)} ${n}  ${r.detail.slice(0, 60)}`
      );
    }
  }

  const unavailable = results.filter(([, r]) => r.kind === "unavailable");
  const limited = results.filter(([, r]) => r.kind === "exhausted");
  console.log(
    `\nUnavailable models error differently from rate-limited ones: ` +
      `${unavailable.length > 0 && limited.length > 0 ? "CONFIRMED" : "not observable in this run"}` +
      `${unavailable.length > 0 ? ` (unavailable -> status ${(unavailable[0][1] as { status: string }).status}, rate-limited -> 429)` : ""}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
