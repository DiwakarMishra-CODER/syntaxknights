/**
 * Runs the Planner for one or more candidates and prints the blueprint.
 *
 *   npm run plan CAND-018
 *   npm run plan CAND-018 CAND-017 CAND-011
 *   npm run plan            (defaults to the five reference candidates)
 */
import type { CallUsage } from "../src/lib/llm";
import { LLMError } from "../src/lib/llm";
import { BlueprintError, planInterview } from "../src/lib/prompts/planner";
import { deriveSignals, getCandidate } from "../src/lib/signals";

const DEFAULT_IDS = [
  "CAND-018",
  "CAND-017",
  "CAND-011",
  "CAND-010",
  "CAND-008",
];

async function planOne(id: string): Promise<boolean> {
  const candidate = getCandidate(id);
  if (!candidate) {
    console.error(`${id}: not found in data/candidates.json`);
    return false;
  }

  const m = candidate.member;
  const s = deriveSignals(candidate);
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  console.log(`\n${"=".repeat(72)}`);
  console.log(`${id}  ${m.name} — ${m.jobRole}, ${m.yearsExperience}y`);
  console.log(
    `coverage ${pct(s.coverage)} · first-try ${pct(s.firstTryRate)} · ` +
      `engagement ${pct(s.engagement)}`
  );
  console.log(
    `skipped [${s.skippedDays.join(", ")}] · failed [${s.failedDays.join(", ")}] · ` +
      `struggled [${s.struggledDays.join(", ")}]`
  );
  console.log("=".repeat(72));

  let usage: CallUsage | null = null;
  const started = Date.now();

  try {
    const blueprint = await planInterview(candidate, {
      onUsage: (u) => {
        usage = u;
      },
      // Offline script: the free tier resets per minute, so waiting out a
      // 429 is far better than failing the run.
      maxWaitMs: 70_000,
      // Escape hatch: gemini-3.6-flash is capped at 20 requests/day on the
      // free tier. Set PLAN_MODEL to fall back when that budget is spent.
      model: process.env.PLAN_MODEL,
    });
    const elapsed = Date.now() - started;
    const u = usage as CallUsage | null;

    console.log(JSON.stringify(blueprint, null, 2));

    const arcSum =
      blueprint.arc.warmup +
      blueprint.arc.build +
      blueprint.arc.stress +
      blueprint.arc.land;

    console.log(
      `\nfocusDays: ${blueprint.focusDays.length}  ` +
        `targetQuestions: ${blueprint.targetQuestions}  ` +
        `arc sums to: ${arcSum}${arcSum === blueprint.targetQuestions ? "" : "  <-- MISMATCH"}`
    );
    console.log(
      `latency: ${elapsed}ms  ` +
        `in=${u?.input ?? "?"} out=${u?.output ?? "?"} ` +
        `thought=${u?.thought ?? "?"} total=${u?.total ?? "?"}`
    );
    return true;
  } catch (err) {
    if (err instanceof BlueprintError) {
      console.error(`\nBlueprintError: ${err.message}`);
    } else if (err instanceof LLMError) {
      console.error(`\nLLMError [${err.kind}]: ${err.message}`);
    } else {
      console.error(`\nUnexpected:`, err);
    }
    return false;
  }
}

async function main() {
  const ids = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const targets = ids.length > 0 ? ids : DEFAULT_IDS;

  let ok = 0;
  for (const id of targets) {
    if (await planOne(id)) ok++;
  }

  console.log(`\n${ok}/${targets.length} blueprints generated.`);
  if (ok < targets.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
