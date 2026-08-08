/**
 * Pre-plan candidates so their first real interview costs no planner call.
 *
 *   npm run warm                        the default demo set
 *   npm run warm CAND-003 CAND-010
 *   npm run warm -- --force CAND-017    re-plan even if something is cached
 *
 * The blueprint cache reads plans out of past `sessions` rows, so a fresh
 * database starts cold and every candidate pays 18-63s on the model capped
 * at 20 requests per DAY per key. This pays that once, deliberately, instead
 * of in front of whoever is watching.
 *
 * Costs exactly 1 planner call per candidate that is not already cached.
 */
import { createSession, findCachedBlueprint } from "../src/lib/db";
import { plan } from "../src/lib/engine";
import { validateBlueprint } from "../src/lib/prompts/planner";
import { getCandidate } from "../src/lib/signals";

const DEFAULTS = ["CAND-003", "CAND-010", "CAND-017"];

async function main() {
  const args = process.argv.slice(2);
  // Needed when a cached plan is technically valid but wrong -- a test
  // fixture that leaked into the cache passes validateBlueprint happily.
  const force = args.includes("--force");
  const ids = args.filter((a) => !a.startsWith("-"));
  const targets = ids.length ? ids : DEFAULTS;

  for (const id of targets) {
    const candidate = getCandidate(id);
    if (!candidate) {
      console.log(`  ${id}  SKIP — no such candidate`);
      continue;
    }

    const cached = force ? null : await findCachedBlueprint(id);
    if (cached) {
      try {
        validateBlueprint(cached, candidate);
        console.log(`  ${id}  already warm — 0 calls`);
        continue;
      } catch {
        console.log(`  ${id}  cached plan no longer valid, re-planning`);
      }
    }

    const started = Date.now();
    const blueprint = await plan(candidate);
    // A session row is what findCachedBlueprint reads. It is never played.
    await createSession(`warm-${id}-${Date.now()}`, candidate, blueprint);
    console.log(
      `  ${id}  planned in ${((Date.now() - started) / 1000).toFixed(1)}s — ` +
        `days ${blueprint.focusDays.map((f) => f.day).join(", ")}`
    );
  }
}

main().then(() => process.exit(0));
