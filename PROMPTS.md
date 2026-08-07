# PROMPTS

A live log of the prompts used to build this project. Written as we go,
not reconstructed at the end.

---

## Entry 1 — Project skeleton

**Prompt:**

```
Read CLAUDE.md first.

Set up the project skeleton only. No interview logic, no LLM calls yet.

1. Initialise a Next.js 15 app in the current directory: TypeScript,
   Tailwind, App Router, src/ directory, no ESLint prompt, no Turbopack
   prompt. Use the current directory, do not create a subfolder.

2. Install @google/genai and @supabase/supabase-js.

3. Create .env.local.example containing:
     GEMINI_API_KEYS=key1,key2,key3
     NEXT_PUBLIC_SUPABASE_URL=
     SUPABASE_SERVICE_ROLE_KEY=
   Verify .env.local is in .gitignore. If not, add it.

4. Create a /data folder. I will drop curriculum.json and candidates.json
   in there myself — do not create placeholder versions.

5. Create app/api/interview/route.ts with a POST handler that:
   - parses the JSON body
   - returns { reply: "not implemented", done: false }
   - returns a 400 with valid JSON if the body is missing or unparseable
   Nothing else. No state, no AI.

6. Create PROMPTS.md with a heading and a first entry logging this exact
   prompt.

7. Create README.md with the project name and one line of description.

8. git init, add everything, make the first commit with a real message.

Then verify: start the dev server, POST a test body to /api/interview
with curl, and show me the actual response.

Finally, give me the exact commands to deploy this to Vercel, and list
which environment variables I need to set in the Vercel dashboard.
```

**Outcome:** Next.js 15.5.23 scaffolded (TypeScript, Tailwind v4, App
Router, `src/`, no ESLint, no Turbopack). `@google/genai` and
`@supabase/supabase-js` installed. Stub `POST /api/interview` returning
`{ reply: "not implemented", done: false }`, with a JSON 400 on an
unparseable or non-object body.

**Notes:**
- `create-next-app` refuses the folder name `SyntaxKnights` (npm forbids
  capitals in package names), so the app was scaffolded under the name
  `ai-interview-agent` and its contents moved into the repo root.
- With `--src-dir`, the route lives at `src/app/api/interview/route.ts`.
  The URL path is still `/api/interview`.
- The stock `.gitignore` ships `.env*`, which covers `.env.local` but
  would also have ignored `.env.local.example`. Added an explicit
  `.env.local` line plus `!.env.local.example`.
- `/data` is intentionally empty — `curriculum.json` and
  `candidates.json` are supplied by hand.

---

## Entry 2 — Data layer

**Prompt:**

```
Read CLAUDE.md first.

Build the data layer only. No LLM calls, no network, no API routes.

1. Read /data/curriculum.json and /data/candidates.json and inspect their
   ACTUAL structure. Do not assume — these files have several traps:
   [curriculum: { cohort, modules, days }; modules[].days is a [start, end]
   PAIR; days[] has 31 entries { day, title, type, tools[], objectives[] };
   type is SETUP|BUILD|LEARN|AI_CORE|SHIP_IT|OPTIMIZE|CAPSTONE; 15 of the 31
   days reference one enterprise healthcare chatbot — the cohort is ONE
   continuous build, which matters for question framing.]
   [candidates: { candidates: [...] }, 20 entries, each { member, missions[],
   signals }; member.status is always "COMPLETED" and is useless; missions[]
   is a SUBSET (~10), NOT all 31 — signals.missionsCompleted is the real
   total; skipped missions are { day, title, skipped: true } with NO attempts
   and NO passed key; passed: false is a genuine failure, different from
   skipped and modelled separately.]

2. Write src/lib/types.ts — model the mission variants as a discriminated
   union so skipped vs attempted is type-safe.
3. Write src/lib/curriculum.ts — loadCurriculum, getDay, getObjectives,
   interviewableDays (all days except SETUP).
4. Write src/lib/signals.ts — deriveSignals(candidate) returning
   firstTryRate, engagement, coverage, skippedDays, failedDays,
   struggledDays, cleanDays, profileNote.
5. Write vitest tests against CAND-018, CAND-017, CAND-011, CAND-010,
   CAND-008 and print the output for each.
6. Write supabase/schema.sql — sessions, turns, reports, index on
   turns(session_id, turn_number).
7. Write src/lib/db.ts — typed helpers, every one taking sessionId.

Run the tests and show me the deriveSignals output for all five
candidates. Then commit.
```

**Outcome:** All seven files written and typechecking clean. The mission
union uses `skipped: true` vs `skipped?: false` as the discriminant, so
reading `.attempts` on a possibly-skipped mission is a compile error;
`isSkipped()` / `isAttempted()` guards are exported.

**BLOCKED — `data/curriculum.json` and `data/candidates.json` do not
exist yet.** Only `.gitkeep` is in `/data`. The structure above was taken
from the prompt's own description rather than from the files, and the
five candidate assertions could not be run. All 10 tests currently fail
with `Could not read .../candidates.json. Drop candidates.json into
/data.` The `deriveSignals` arithmetic was instead proved against
synthetic fixtures built to the described shapes.

**Notes:**
- Loaders validate on read and throw named errors (day count ≠ 31,
  unknown `type`, `module.days` not a 2-element pair) so a shape mismatch
  surfaces loudly instead of silently producing wrong signals.
- `member`'s internal key names are not specified, so `candidateId()`,
  `candidateName()` and `candidateExperience()` probe a few likely keys.
  One place to fix once the real file lands.
- Data files are read with `fs` at runtime, so `next.config.ts` sets
  `outputFileTracingIncludes` — without it Vercel omits `/data` from the
  bundle and it works locally but 404s in production.
- Static curriculum/candidate JSON is cached at module scope. That is
  immutable reference data, not session state — the CLAUDE.md ban is on
  per-session data, which only ever round-trips through Supabase.
- `appendTurn` derives the next `turn_number` from the table when the
  caller omits it, so nothing has to hold a counter in memory.

---

## Entry 3 — LLM wrapper

**Prompt:**

```
Read CLAUDE.md first, especially the Gemini 3.x section.

Build the LLM wrapper only. No interview logic yet.

STEP 1 — Fetch the docs before writing any code. Do not write Gemini API
code from memory. Fetch and read latest-model, structured-output, and
rate-limits. Tell me what you find about: the current SDK call shape,
thinking_level, which sampling parameters are removed, and how
schema-enforced JSON output is specified. Then write the code to match.

STEP 2 — Build src/lib/llm.ts, the single place any model is ever called:
  type Role = 'planner' | 'interviewer' | 'evaluator' | 'reporter'
  callLLM<T>({ role, system, input, schema }): Promise<T>
  Role -> model + thinking_level mapping in one config object at the top.
  `schema` uses Gemini's native schema enforcement; return parsed + typed.
  Keep `system` byte-identical across calls so it can be cached.

STEP 3 — Key rotation and resilience: comma-separated GEMINI_API_KEYS,
round-robin, 429 -> next key immediately, all keys limited -> exponential
backoff max 3 rounds, malformed output or other error -> retry once then
throw a typed LLMError. Never crash on a rate limit. Log role, model, key
index, token counts, latency.

STEP 4 — scripts/test-llm.ts: one text call, one schema-enforced JSON
call with shape validation, printing model, latency and token usage.
Run it against my real keys and show me the output.

Then commit.
```

**STEP 1 findings** (docs cross-checked against the installed
`@google/genai@2.16.0` type definitions, which are authoritative for the
pinned version):

- **Call shape** is `ai.interactions.create()`, not `generateContent`,
  and its parameters are **snake_case**: `model`, `input`,
  `system_instruction`, `generation_config`, `response_format`. The
  reply is `interaction.output_text`; usage is `interaction.usage`.
- **`thinking_level`** lives *inside* `generation_config`, not at top
  level. The SDK type is `"minimal" | "low" | "medium" | "high"`, so all
  four levels CLAUDE.md specifies are valid, including `"minimal"` for
  the evaluator. It replaced `thinking_budget`, which errors on 3.5+.
- **Removed sampling params** — `temperature`, `top_p` and `top_k` are
  absent from the `GenerationConfig` type entirely; there is no field to
  set. Docs: "In future model generations, supplying these parameters
  returns an HTTP 400 error. Remove these parameters from all requests."
- **Schema-enforced JSON** — `response_format: { type: "text",
  mime_type: "application/json", schema }` where `schema` is a JSON
  Schema object. The older `responseSchema` / `responseMimeType` fields
  still exist on the legacy surface but are marked deprecated in favour
  of `response_format`.
- **Rate limits** — the docs page no longer publishes free-tier numbers
  (it points at AI Studio). It confirms `429 RESOURCE_EXHAUSTED` and
  advises wait-and-retry, so the rotation policy is ours to design.

**Outcome:** `src/lib/llm.ts` written to match, with `ROLE_CONFIG` at the
top as the only place models or thinking levels are named. Round-robin
rotation, 429 → immediate next key, all-keys-limited → 1s/2s/4s backoff
across max 3 rounds, one soft retry for malformed JSON or transient API
errors, then a typed `LLMError` carrying
`kind: config | rate_limited | malformed_output | api_error`.

**BLOCKED — `.env.local` does not exist, so `npm run test:llm` could not
be run against real keys.** Verified without them: pool parsing (1 key
and 6 keys, tolerating whitespace and a trailing comma), the `config`
error path, and that two bad keys rotate and terminate in a typed
`LLMError[api_error]` rather than a crash — the request does reach
`https://generativelanguage.googleapis.com/v1beta/interactions`, so the
call shape is structurally accepted by the SDK.

**Notes:**
- The round-robin cursor is a module-level integer. That is not session
  state — a cold start simply restarts the rotation at key 0.
- One `GoogleGenAI` client is memoised per key index.
- `callLLM` is overloaded: with `schema` it returns parsed `T`, without
  it returns `string`.

---

## Entry 4 — Publish to GitHub

**Prompt:**

```
push to this repo https://github.com/DiwakarMishra-CODER/syntaxknights
and dont credit yourself just me
```

**Outcome:** History rewritten to strip the `Co-Authored-By` trailer from
all three commits, then pushed to a fresh `main`. Verified with
`git log --format='%B' | grep -i claude` returning nothing.

**Notes:**
- The scaffold branch was `master`; renamed to `main` before pushing
  since the remote was empty and GitHub defaults to `main`.
- Checked before pushing that no key-shaped strings were in tracked
  files and that only `.env.local.example` was tracked, never
  `.env.local`.
- `gh` is not installed on this machine; pushed over HTTPS using the
  existing `osxkeychain` credential helper.
- The data files landed in the working tree mid-push, which unblocked
  the five candidate tests that Entry 2 recorded as blocked. They were
  left untracked at this point pending a decision on publishing them —
  resolved in Entry 6.

---

## Entry 5 — Wiring up real credentials

**Prompt:** redacted — the message contained a live Gemini API key, and
this repo is public. In substance: supplied one Gemini API key and asked
what else the env needed, then asked where to paste `supabase/schema.sql`
in the Supabase dashboard, then confirmed it ran with "Success. No rows
returned". The Supabase project URL and service role key were pasted
into `.env.local` directly.

**Outcome:** `.env.local` created (gitignored, never committed). Both
smoke tests now pass against live services:

- `npm run test:llm` — `gemini-3.6-flash` 5576ms (in 29 / out 1 /
  thought 89) and `gemini-3.5-flash-lite` 3668ms (in 58 / out 55 /
  thought 0). The thought-token split confirms `thinking_level` is
  actually being applied per role. Schema-enforced JSON returned a
  correctly shaped object with no parse fallback.
- `npm run test:db` — new `scripts/test-db.ts` round-trips every helper
  in `db.ts` against the real tables (15 checks), then deletes the test
  session so `turns` and `reports` cascade. All pass; all three tables
  verified back at 0 rows afterwards.

**Notes:**
- `NEXT_PUBLIC_SUPABASE_URL` was first set to the REST endpoint
  (`.../rest/v1/`). `supabase-js` appends `/rest/v1/` itself, so that
  doubles the path and 404s every query. It must be the bare project URL.
- `supabase-js` constructs a Realtime client eagerly, and Node 20 has no
  global `WebSocket` (it landed in Node 22), so `createClient` threw
  before any query ran. Fixed by passing `ws` as the realtime transport
  in both `db.ts` and the script. We never use realtime — the
  constructor just has to not throw.
- Tables are created with RLS off. The only access path is the
  server-side service_role key, which bypasses RLS anyway, and the
  project has no auth or anon access by design.

---

## Entry 6 — Reconcile types against the real data; static imports

**Prompt:**

```
Steps 1-5 from earlier are still unverified — you only reported on step 6.
Also two housekeeping items first.

A. Commit data/curriculum.json and data/candidates.json. They are NOT
   real people — the hackathon brief states all candidate and curriculum
   data is synthetic and provided solely for this challenge. Judges need
   these files to run the project; a repo missing its own inputs fails
   eligibility. Keep docs/technical-spec.md committed too — that's the
   hackathon's own spec document.

B. Now do steps 1-5 and report each one SEPARATELY:

1. Read data/curriculum.json and data/candidates.json. Reconcile my types
   against the real structure. Report any mismatch with what you built
   from my description.

2. Remove the candidateId()/candidateName()/candidateExperience() probing
   helpers. member is exactly:
     { id: string, name: string, jobRole: string,
       yearsExperience: number, education: string, status: "COMPLETED" }
   Direct typed access. Delete the fallback key guessing.

3. Switch from fs reads to static JSON imports:
     import curriculumData from '@/data/curriculum.json'
   Remove outputFileTracingIncludes from next.config.ts. Confirm it still
   typechecks.

4. Replace the synthetic fixtures in the deriveSignals tests with the five
   REAL candidates. Assert these exact values (3dp):

   CAND-018 Diane   firstTryRate 1.000  coverage 1.000  skipped []
   CAND-017 Tyler   firstTryRate 0.032  coverage 1.000  skipped []
   CAND-011 Mia     firstTryRate 0.357  coverage 0.452  skipped [7,8,12,16,22]
   CAND-010 Gerald  firstTryRate 0.043  coverage 0.742  failed  [8,10,22]
   CAND-008 Harold  firstTryRate 0.556  coverage 0.871  skipped [14,15]

   If any assertion fails, the parsing is wrong. Tell me — do NOT adjust
   the expected values to match your output.

5. Run npm run test:llm against the real Gemini key. Show the actual
   output: model, latency, token counts, and the parsed JSON from the
   schema-enforced call. A 400 here is almost certainly deprecated Gemini
   3.x params (temperature/top_p/top_k must be absent), not a bad key —
   re-read https://ai.google.dev/gemini-api/docs/latest-model.

Skip step 6 — check-db.ts already passed 15/15.

Then commit and push. There are unpushed commits (ebb861e and earlier).
```

**Outcome:** Three mismatches found between the types built from the
written description and the real files. All five 3dp assertions passed
on the first run with no adjustment. 11 tests green, typecheck clean,
`next build` succeeds.

**Mismatches found:**
- `curriculum.cohort` is a plain string
  (`"AI Cohort · 31 days · 8 modules"`), not an unknown/object. Typed as
  `string`.
- `CurriculumModule` is `{ n, title, days }`. The description only
  mentioned `days`, so the guessed `name?` field did not exist and the
  module number `n` was missing. Both corrected.
- `member` is
  `{ id, name, jobRole, yearsExperience, education, status }`. The
  guessed optional `experience?: string` did not exist.

**Consequence of that last one:** the probing `candidateExperience()`
matched `yearsExperience` and stringified it, so `profileNote` was
comparing a *number of years* against a regex written for phrases like
"senior" or "8 years". `"4"` and `"20"` both failed that regex, so Diane
read as junior and Gerald's 20 years never registered. This is the
source of the odd `stated experience ("4")` line flagged in the previous
session. With `yearsExperience: number` typed directly the clause now
uses a numeric threshold, and Gerald (20y, 4% first try) and Harold
(28y, 56%) both surface the mismatch correctly.

**Notes:**
- `@/*` maps to `./src/*`, so `@/data/curriculum.json` would have
  resolved to `src/data/`. Added a more specific `"@/data/*":
  ["./data/*"]` mapping ahead of it, mirrored in `vitest.config.ts`
  since Vitest does not read tsconfig paths.
- TypeScript widens the imported JSON's `type` field to `string`, so the
  `DayType` union cannot be enforced statically on a JSON import. The
  existing runtime `validateCurriculum()` still enforces it on first
  access, which is where a bad value would matter anyway.
- Static imports mean no filesystem access at runtime, so
  `outputFileTracingIncludes` is no longer needed and was removed.
  Confirmed with a real `next build`.

---

## Entry 7 — PROMPTS.md audit

**Prompt:**

```
can you keep updating prompts.md properly? are we doing it rn?
```

**Outcome:** Audited. An entry had been committed alongside every code
commit from the start, so the log is genuinely live rather than
reconstructed. Three gaps found and fixed in this entry:

- The GitHub publish turn had no entry at all. Added as Entry 4, which
  renumbered the two that followed.
- Entry 5 (credentials) had a paraphrased prompt. Kept paraphrased, but
  now says explicitly *why*: the original message contained a live API
  key and this repo is public.
- Entry 6 had a summarised prompt where entries 1-3 were verbatim. Now
  verbatim.

**Convention going forward:** one entry per work session, appended
before the commit that carries the work, with the prompt verbatim in a
fenced block. Redact only credentials, and say so when redacting.

---

## Entry 8 — Latency experiment and the Planner

**Prompt:** add a per-call `thinking` override to `callLLM`, sweep the
interviewer role across high/medium/low/minimal on a realistic ~2000-token
input and report latency + thought tokens; then build the Planner
(`src/lib/prompts/planner.ts`), `scripts/plan.ts`, and run it for
CAND-018, CAND-017, CAND-011, CAND-010 and CAND-008.

**STEP 0 — the sweep did not support picking a thinking level.**

At ~1500 input tokens, 2 trials each on gemini-3.6-flash:

| level | mean | trials | thought tokens |
|---|---|---|---|
| high | 19066ms | 24070, 14062 | 622 |
| medium | 12841ms | 13045, 12636 | 488 |
| low | 17934ms | 10882, 24985 | 123 |
| minimal | 17543ms | 18167, 16918 | 0 |

Thought tokens scale cleanly with the level, so `thinking_level` is
definitely being applied. Latency does not follow it at all — `minimal`
(0 thought tokens) averaged slower than `medium`. Within-level spread
reached 14s while between-level differences were ~5s, so the ranking is
noise. The actionable finding is that **no thinking level gets a call
under ~11s**, so thinking_level is not the lever for the latency problem.
A follow-up 5-trial run on the two contenders was rate-limited before it
could finish.

**THE REAL BLOCKER — gemini-3.6-flash is capped at 20 requests per DAY.**

The 429 body is explicit: `Quota exceeded for metric:
generate_content_free_tier_requests, limit: 20, model: gemini-3.6-flash`.
Honouring the API's own `Please retry in 58.7s` and waiting it out still
returned 429, and a same-moment probe of gemini-3.5-flash-lite succeeded
— so the quota is per model and daily, not per minute. Planner,
Interviewer and Reporter all use gemini-3.6-flash. One 10-turn interview
is ~12 calls on that model, so a single key allows roughly one and a half
interviews per day.

**Two wrapper fixes this exposed:**
- The backoff guessed 1s/2s/4s and gave up after 7s, while the API was
  stating exactly how long to wait. It now parses `Please retry in Xs`
  and honours it, falling back to exponential when absent.
- Waiting ~59s is fine offline but impossible in a serverless handler, so
  `maxWaitMs` was added — default 8s so request paths fail fast and
  degrade, with offline scripts passing 70s to wait the window out.
- Added a per-call `model` override alongside `thinking`, since free-tier
  quota is per model and having a fallback beats having no answer.

**Outcome:** Planner built and 5/5 blueprints generated. Every one
satisfied the hard requirements: 4-5 focus days, targetQuestions 10, arc
summing exactly to targetQuestions, no SETUP days.

The strategy rules held against the real records. Tyler (3% first-try)
got startDepth 1-2 and rebuild_confidence throughout. Diane (100%
first-try) got startDepth 4-5 and pressure_test. Mia's day-10 reason
correctly cited her skipped days 7 and 8; Gerald's day-10 reason
correctly identified it as one of his three genuine failures; Harold's
day-15 pick correctly targeted his skipped 14/15 as a probe_gap.

**CAVEAT — these blueprints were generated on gemini-3.5-flash-lite, not
the configured gemini-3.6-flash**, because that model's daily quota was
exhausted by the sweep. They must be regenerated on the real model before
this is considered verified.

**Known weakness:** `missions[]` is a ~10-day subset, so for a focus day
outside that subset the model infers the record rather than reading it.
For Diane (100% coverage, 100% first-try) the inference is sound; for
Harold (56% first-try) the day-25 claim that he "passed this on a
standard attempt" is not supported by his record. Worth constraining in
the prompt, or restricting focus days to those present in `missions[]`.

---

## Entry 9 — Invert the routing, ground the Planner, merge the turn

**Prompt:** (0) invert role→model routing on the hypothesis that
gemini-3.6-flash's 20 RPD is a new-model restriction while GA models are
far more generous, and add passive quota telemetry instead of spending
quota to probe; (1) fix the Planner fabricating Harold's day-25 record by
restricting focusDays to the candidate's own missions[] and adding a
grounding rule; (2) merge Evaluator + Interviewer into one call; (3) A/B
both paths on the same model.

A `scripts/probe-quota.ts` run was started and then cancelled to stop it
spending quota. It salvaged two facts before being killed:
gemini-3.6-flash returned 429 at 0 successes with `limit: 20`, and
gemini-3.5-flash-lite reached 17 consecutive successes with no 429 on a
key that had already served many calls that day.

**0 — Routing inverted.** `turn` → flash-lite "medium"; `planner` and
`reporter` → 3.6-flash "high". `interviewer` and `evaluator` kept, both
moved to flash-lite so an A/B against `turn` varies only the merge.
Marked in llm.ts and CLAUDE.md as a hypothesis pending telemetry.

Telemetry lands in `.quota-log.json` (gitignored, JSON Lines despite the
name so appends are O(1)) via `src/lib/quota-log.ts`, with
`npm run quota:report` for per-model per-day totals. It is
fire-and-forget: on Vercel the filesystem is read-only outside /tmp, so
the first failed write disables it permanently rather than throwing.

**Interviews per day, 6-key pool:** the binding constraint is
gemini-3.6-flash at 20 RPD/key. Planner + Reporter = 2 calls per
interview, so 10 interviews per key per day, **60 across 6 keys**. Under
the old routing the turn loop also sat on 3.6-flash — 12 calls per
interview, 1.6 interviews per key per day, 10 across 6 keys. The
inversion is a 6x improvement. flash-lite at 10 calls per interview is
not binding at any plausible GA ceiling.

**1 — Hallucination fixed, but regeneration is BLOCKED.** The root cause
was that the prompt listed all 29 non-SETUP days while the record covers
only ~10, so the model filled the gaps. `buildPlannerInput` now sends a
MISSION RECORD of only the candidate's own missions with real outcomes,
plus an explicit selectable-days list, and the system prompt forbids
referencing any absent day. `validateBlueprint` now hard-rejects
out-of-record days in code, so a fabrication cannot survive even if the
model attempts one.

Regenerating on gemini-3.6-flash returned 0/5 — that model's daily quota
was already spent. `src/lib/prompts/planner.test.ts` proves the fix
without API calls: Harold's selectable days are 4, 5, 14, 15, 21, 22, 23,
27, 28, 31 — day 25, the exact day previously fabricated, is absent and
is now rejected with `focus day 25 is not in this candidate's mission
record`. 20 tests pass. **The five blueprints still need regenerating on
gemini-3.6-flash once quota resets.**

**2 — Turn merged.** `src/lib/prompts/turn.ts`, one flash-lite call
returning rubric + claims + reaction + question + action + targetDay +
depth + rationale. `evaluator.ts` and `interviewer.ts` written as the
separate path and kept for reversion.

**3 — A/B, one run, 3 calls, both paths on flash-lite:**

| path | calls | latency | in | out | thought | total |
|---|---|---|---|---|---|---|
| A separate | 2 | 11521ms | 1184 | 200 | 605 | 1989 |
| B merged | 1 | 6973ms | 1154 | 209 | 632 | 1995 |

B halves the requests and is 39% faster. Tokens are a wash — the merged
prompt is bigger, so the saving is in REQUESTS, which is exactly the
scarce resource.

**Honest read: B is better on economics and rubric, worse on claim
fidelity.** B's rubric (2/2/1) is better calibrated than A's flat 1/1/1
for an answer that was vague rather than absent. But B extracted the
claim "configured termination grace period to handle active streaming
sessions" when the candidate only said "we set it up properly so sessions
keep working" — a fabricated mechanism, the same failure class as the
Planner's day 25. A's claim quoted the hand-wave faithfully. B's question
then presupposed that invented mechanism. A's question was honest but a
weak yes/no.

The fabrication is a prompt problem, not an argument against merging, so
TURN_SYSTEM gained an EXTRACT-NEVER-INVENT rule using this exact failure
as the worked example, plus a bar on questions presupposing unmentioned
mechanisms. **That fix is unverified** — re-running would have exceeded
the one-run budget.

---

## Entry 10 — Generalise anti-invention; build the orchestrator

**Prompt:** treat the two invention failures as one systemic risk — extract
the rule into `src/lib/prompts/shared.ts`, apply it to every prompt that
converts input into a structured record, and back it with code-level
validation the way `validateBlueprint` already backs focus days. Then
build `src/lib/orchestrator.ts` as a pure state machine enforcing the
graded hard requirements, with thorough mocked tests. No API calls.

**1 — Anti-invention generalised.** `ANTI_INVENTION` is now a single
constant carrying both real failures as worked examples (Harold's day 25,
and "termination grace period" from "we set it up properly"), interpolated
into `PLANNER_SYSTEM` and `TURN_SYSTEM`. A test asserts both prompts
contain it, so a future prompt cannot quietly drop it.

The code-level half is `verifyClaims` / `filterInventedClaims`. A claim may
paraphrase freely in ordinary English, but if it names a term from a
technical glossary, the candidate must have used that term. The glossary is
seeded from the curriculum's own `tools` arrays so it tracks the real
syllabus, plus ~70 curated infra and ML terms. `runTurn` now filters claims
against the candidate's own words before returning, so an invented claim
can never enter the ledger — which matters because every later turn probes
against that ledger.

Deliberately narrow: policing only glossary terms keeps "they ship a new
build and swap it in gradually" legal while rejecting "configured
termination grace period". Precision over recall, because a false positive
silently drops a real claim.

A test caught a genuine bug in `normalise`: it preserved `.` so version
numbers like `3.5` survive, which meant a sentence-final period glued
itself to the word and `"health checks."` never matched the term
`"health check"`. Dots now survive only between digits.

**2 — Orchestrator.** Pure state machine, no I/O, no clock, no randomness.
The model proposes; this decides what is allowed. Every rule is
deterministic because "covered at least 4 days" is graded and must not
depend on an LLM remembering to count.

`SessionState` was rewritten to the orchestrator's shape and is entirely
JSON-serialisable — `daysCovered` is an array, not a Set, precisely because
it round-trips through a jsonb column on every request. `db.ts` and
`scripts/test-db.ts` were updated to match.

49 tests pass. The adversarial suite runs a full interview against four
pathological models — one that always concludes, one that never leaves day
28, one always weak, one always strong — and asserts all four still reach
8 questions and 4 days.

**A real bug the adversarial tests caught:** `daysCovered` was crediting
the day the model *proposed*, not the day an override actually redirected
to. So a forced topic switch never counted toward coverage, and the 4-day
floor was unreachable by override — exactly the scenario the override
exists for. The floors were enforced in name only until this was fixed.

**3 — Queued for quota reset (~12:30pm IST), not run:**
- a) Regenerate five blueprints on gemini-3.6-flash — **5 calls of the
  20/day budget**, leaving 15.
- b) Re-run the A/B once to verify the claim-fidelity fix — **3 calls on
  gemini-3.5-flash-lite** (2 for path A, 1 for path B), none on 3.6-flash.

---

## Entry 11 — Quota-aware key selection and pinning

**Prompt:** make `llm.ts` consult `.quota-log.json` before picking a key —
skip any key that has already 429'd today for the requested model, prefer
the key with fewest successes, and throw a clear
`LLMError[quota_exhausted]` naming the model and reset time rather than
cycling the pool for more 429s. Add `GEMINI_KEY_INDEX=n` pinning for
scripts. Extend `quota-report.ts` with per-key per-model AVAILABLE /
EXHAUSTED verdicts. No API calls; test with mocked log data.

**Outcome:** 63 tests pass, typecheck clean, no API calls made.

- `orderKeysByQuota()` is a pure function over mocked tallies, so the
  selection policy is unit-testable without touching the network. Keys
  that 429'd today for that model are dropped; the rest sort by fewest
  successes with a rotating tie-break so load does not pile onto key 0.
- Exhaustion is per model per key. A key spent on gemini-3.6-flash is
  still AVAILABLE for flash-lite, and the tests assert exactly that.
- `GEMINI_KEY_INDEX` pins a key for scripts and bypasses selection
  entirely. It validates rather than silently falling back to key 0, and
  errors if the index exceeds the configured pool.
- The retry loop now recomputes the key order after any round that saw a
  429, so a key that dies mid-call drops out of subsequent attempts.

**Pacific-day accounting:** RPD resets at midnight Pacific, so events are
grouped by their Pacific calendar date via `Intl` rather than by a UTC
offset — DST would break a hardcoded offset twice a year. Tested at the
boundary: 06:59Z on 8 Aug counts as 7 Aug Pacific, 07:00Z as 8 Aug.

**On Vercel this degrades to plain round-robin.** The filesystem is
read-only outside /tmp, so there is no log to read and the tally map is
empty — which `orderKeysByQuota` treats as "all keys unused". A test
covers that case. Quota-aware selection is a local development
instrument; production still relies on rotation plus honouring 429s.

**Current availability:**

```
gemini-3.5-flash-lite      #0     3 ok     0 429  AVAILABLE
gemini-3.6-flash           #0     0 ok    15 429  EXHAUSTED (limit 20)
```

**Only ONE key is configured.** There is no key #1 to pin to yet.

**Note:** a `str.replace` patch to quota-report.ts silently no-opped
because it was applied without an assert, unlike the earlier patches in
this session. Caught by the missing section in the output. Guard every
scripted edit with an assertion.

---

## Entry 12 — Queued runs executed: blueprints and A/B re-run

**Prompt:** proceed with 3(a) and 3(b). Use automatic key selection for
3(a) rather than pinning, since that is the production code path. Confirm
the planner runs at thinking_level "high" per config.

**Step 0 result (previous turn):** one call on key #1 against
gemini-3.6-flash succeeded while key #0 was 429ing on the same model in
the same minute. **Free-tier quota is per key, not per project** — the
shared `AQ.Ab8RN6...` prefix does not mean a shared budget. CLAUDE.md's
60-interviews/day figure stands.

**Config confirmed before running:** `ROLE_CONFIG.planner` is
gemini-3.6-flash / thinking "high"; `planInterview` passes no thinking
override and `PLAN_MODEL` was unset. Every log line in the run reads
`thinking=high`.

**3(a) — 5/5 blueprints on gemini-3.6-flash, exactly 5 requests.**
Automatic selection alternated keys #2 and #1 by the fewest-successes
rule, which is the production path working as designed. Latency
17.6-34.1s, ~2000-2900 thought tokens each.

**The fabrication is gone.** All 24 focus-day reasons across the five
candidates were cross-checked against the real mission records: every
attempt count, skip and failure matches. Harold's five:

| day | reason claims | record |
|---|---|---|
| 28 | passed on his first attempt | passed first try |
| 27 | passed on his first try | passed first try |
| 21 | required 5 attempts | passed after 5 attempts |
| 15 | skipped Day 14 and Day 15 entirely | both SKIPPED |
| 31 | completed the capstone in 2 attempts | passed after 2 attempts |

Strategy rules also held against the real records: Tyler (3% first-try)
got rebuild_confidence at depth 1-2 throughout; Diane (100%) got
pressure_test at depth 3-4; Gerald's genuine failures got
rebuild_confidence at depth 1 while his skip got probe_gap.

**3(b) — A/B re-run, 3 calls, both paths on flash-lite.**

| path | calls | latency | in | out | thought | total |
|---|---|---|---|---|---|---|
| A separate | 2 | 11792ms | 1207 | 242 | 457 | 1906 |
| B merged | 1 | 7427ms | 1509 | 216 | 963 | 2688 |

**The claim-fidelity fix held, and the prompt did the work — not the
filter.** B's claims came back as direct quotes ("we set it up properly
so sessions keep working", "Kubernetes takes care of most of it"), both
marked unjustified, with `rejectedClaims: []`. Logging pre-filter claims
on both paths is what makes that readable: a clean B would otherwise be
ambiguous between "the prompt worked" and "the filter caught it". The
filter never had to fire.

B's question also stopped presupposing: "Where is the active conversation
state stored when those pods roll?" versus the previous run's "what
termination grace period did you configure", which assumed a mechanism the
candidate never mentioned. B chose `clarify` and dropped depth 4 -> 3,
which is the correct scaffolding response to a vague answer.

**Correction to the earlier A/B read: B is not token-neutral.** This run B
used 2688 tokens against A's 1906 — 41% MORE, driven by a larger merged
prompt and more thought tokens. The first run happened to come out level.
The merge still wins because requests, not tokens, are the scarce resource
on a per-day quota: 10 requests per interview instead of 20. The script
printed "-41% fewer tokens", which reads as a saving; the label now says
"41% MORE" so a future run cannot be misread.

---

## Entry 13 — Full interview loop CLI

**Prompt:** build `scripts/interview.ts` wiring orchestrator + turn +
reporter, loading Tyler's saved blueprint from `/fixtures` rather than
re-planning; print a state panel after each turn; print the full
transcript and final report at the end. Run it for CAND-017 with
FIXTURE_RECORD=1.

**Built:**
- `fixtures/blueprint-CAND-017.json` — Tyler's blueprint saved from the
  3.6-flash run, so a session costs 0 planner calls.
- `src/lib/prompts/reporter.ts` — the fourth role, which had never been
  built. Sends the claim ledger and per-answer rubric scores, never the
  transcript. Carries `ANTI_INVENTION`, so it cannot invent a strength
  the candidate did not show.
- `scripts/interview.ts` — the loop, with `FIXTURE_RECORD=1` to save a
  replay and `FIXTURE_REPLAY=<path>` to re-run a saved session with
  **zero API calls**.

**A type mismatch this surfaced:** `Turn.rubric` was typed
`Record<string, number>` while the real rubric carries
`objectivesHit: string[]`. The rubric is a stored jsonb shape, so
`TurnRubric` moved into `types.ts` and `turn.ts` re-exports it —
prompts should not own a persistence type.

**Verified end to end with zero API calls** by replaying a synthetic
fixture whose model always says `conclude` from question 3 and never
leaves day 3. The real loop overrode it four times in a row —
`conclude blocked at question 3 with 1/4 days covered`, then 2/4, 3/4,
4/4 — walking coverage to `[3, 10, 22, 28, 31]` and finishing with
`questions 8 · floors met: YES`. The orchestrator's guarantees hold in
the assembled system, not just in unit tests.

**NOT RUN — the live session needs a human at the keyboard.** The script
reads the candidate's answers from stdin. I cannot type Tyler's answers:
inventing them would spend the budget on a transcript that is not the
user's, and fabricated input is precisely the failure this project has
spent two sessions eliminating. Handed over as:

```
FIXTURE_RECORD=1 npm run interview CAND-017
```

Budget when they run it: ~10 flash-lite turn calls + 1 reporter call on
3.6-flash, against 34 remaining 3.6-flash calls across keys #1 and #2.

---

## Entry 14 — Reporter gets the transcript, guarded by verbatim validation

**Prompt:** the Reporter never receives the transcript, which defeats its
purpose — strengths and gaps are meant to quote the candidate's own words,
and verbatim validation has nothing to validate against. Pass the full
transcript in and keep every guard: ANTI_INVENTION, verbatim checking with
one retry, claims from the filtered ledger. Add a test that a strength
quoting words the candidate never said is rejected. Confirm the prompt
requires at least one direct quote in each strength and each gap.

**Outcome:** 78 tests pass, typecheck clean, no API calls.

The reporter now receives the full transcript, clearly labelled so only
CANDIDATE lines are quotable. `verifyReport()` extracts every quoted span
(straight or curly) from summary, strengths, gaps and next, and requires
each to appear in the concatenated candidate turns. Words must match in
order; whitespace and case are normalised so a sentence-initial capital
does not fail an otherwise exact quote, but no word may be added, dropped
or changed — `"we build a docker image in CI"` is rejected against
`"We build a container image in CI"`.

On failure the report is rejected and retried ONCE, with the offending
strings named in the input — not the system prompt, which stays
byte-identical for caching. A second failure throws `ReportError`.

**Prompt requirement confirmed**, and asserted by a test:
`Every strength MUST contain at least one direct quote of the candidate's
own words, in double quotes, copied EXACTLY as they said it. Every gap
MUST do the same wherever they actually spoke to the topic.`

**One deviation, argued rather than assumed.** Requiring a quote in every
gap can force invention: a gap is often that a topic never came up, and
silence cannot be quoted. Under a hard rule the model's only way to
satisfy it is to manufacture a quote — the exact failure the guard exists
to prevent. So the prompt requires quotes in gaps *wherever they spoke to
the topic* and gives an explicit escape valve ("evaluation never came up
in this conversation"), and the code warns on an unquoted gap instead of
rejecting. Unquoted STRENGTHS are still a hard rejection, because a
strength is by definition something they showed, so a quote always exists.

A test also covers a subtle failure: quoting the INTERVIEWER's words back
as though the candidate said them. Only candidate turns are quotable.

CLAUDE.md's "never send the full transcript" rule now carries this as a
documented exception rather than being silently contradicted by the code.

**Risk worth flagging:** a report that fails validation twice throws, so a
live session could end after ten answered turns with no feedback at all.
Not yet mitigated.

---

## Entry 15 — Reporter degrades instead of throwing

**Prompt:** never return no feedback. On a second validation failure, drop
the offending strengths and gaps, keep what validated, and return the
report; if that leaves strengths empty, emit one honest unquoted line.
Log the degradation. Never throw on the request path. Add a test that a
report where 2 of 3 strengths fail returns the surviving one. Keep the
gaps rule as a warning.

**Outcome:** 84 tests pass, typecheck clean, no API calls. `ReportError`
is gone — `writeReport` no longer throws on validation.

`degradeReport()` is pure and keeps everything that validated:
- strengths with fabricated quotes, or with no quote at all, are dropped
- gaps are dropped ONLY for fabricated quotes; unquoted gaps survive
- next items with fabricated quotes are dropped
- a summary containing a fabricated quote is replaced with a factual line
  built from state alone (`answered N questions across days X, Y, Z`),
  which invents nothing
- if no strength survives, one honest unquoted line is emitted; if no next
  item survives, one grounded suggestion is

**A design tension the tests exposed.** My first attempt asserted the
degraded report satisfies `verifyReport().ok`. It does not, and should
not: the backfilled strength is deliberately unquoted, which that gate
rejects by design. The correct invariant for degraded output is narrower
— **no fabricated quote survives** — and the test now asserts exactly
that, plus a direct check that none of the invented phrases appear
anywhere in the returned object. Writing the loose assertion first is
what made the distinction visible.

**Item 2 confirmed:** the gaps rule stays a warning.
`verifyReport().unquotedGaps` is reported and logged, never a rejection,
and `degradeReport` preserves unquoted gaps untouched.

**Remaining hole, not closed:** `writeReport` can still throw an
`LLMError` if the reporter's API call itself fails (rate limit, network).
That is a different failure from validation and the route will need its
own fallback — `degradeReport` is exported so the route can build a
grounded report from state without a model call.

---

## Entry 16 — Seven fixes from the first live run

**Prompt:** fix the six issues diagnosed from the CAND-017 log plus the
dangling end, in order, no API calls. Fix the off-by-one architecturally
rather than by relabelling; fix multi-line input; never end on an
unanswered question; make the follow-up cap quality-aware; fix depth and
non-substantive scoring; fix question quality in TURN_SYSTEM; loosen the
planner. Then the user re-runs the session.

**Outcome:** 92 tests pass, typecheck clean, no API calls.

**1. Off-by-one removed at the root.** `applyTurn` is gone. The
orchestrator now computes a `TurnDirective` BEFORE the call —
`nextDirective(state, blueprint)` — which is rendered into the prompt as
explicit instruction ("You MUST move on to X now — 3 follow-ups already
used"). The model writes its question for the correct topic, and
`recordTurn` files it under the model's own `targetDay`. Nothing is
rewritten after generation, so there is nothing to be off by one.

Coverage now credits the day a question was ACTUALLY about. A test proves
a directed-but-not-yet-asked day is not credited, and a replay asserts
all ten interviewer stamps match their question text. A model that
ignores the directive is recorded honestly and flagged as a violation
rather than silently relabelled.

**2. Multi-line input.** `readAnswer` accumulates lines until a lone "."
or `/send`, then echoes the captured text with a character count so
truncation is visible immediately. The last run lost a Docker answer at
the first newline and scored it as a non-answer.

**3. No dangling end.** When the floors are met the model's `question`
field becomes a closing beat rather than a probe, and the CLI then reads
one final "last word" from the candidate before the report.

**4. Quality-aware follow-up cap.** `followUpAllowance` starts at 3 and
rises to 5 after an answer scoring knowledge >= 4 on the same thread,
resetting on a topic change. In the last run the cap fired on turn [10],
the best answer of the interview.

**5. Depth and scoring.** New topics take their depth from the current
ability estimate rather than the blueprint's `startDepth`, which is why
depth never exceeded 3 last time. `substantive: false` on the turn output
skips the rubric entirely, leaving ability untouched — "hello" no longer
seeds the estimate at 2.20.

**6. Question quality.** TURN_SYSTEM rewritten: day numbers are banned
outright ("a real interviewer has never seen the syllabus"), objectives
are explicitly context and not a checklist, consequence questions are
preferred over inventory ones with the previous run's own bad questions
as worked examples, cross-topic questions are preferred, acknowledgments
must vary and may be omitted, and **chasing a revealed weakness outranks
the plan** — with the wildcard CORS and the missing query router from the
last run named as the examples that were missed.

**7. Planner loosened.** Focus days may now be ANY curriculum day; only
performance CLAIMS are restricted to days in `missions[]`, enforced by a
regex guard that rejects an off-record reason containing passed/failed/
attempts/skipped. At least two distinct strategies are required — the
last plan was five identical `rebuild_confidence` days with no
`verify_depth` anywhere. Mid-to-late and SHIP_IT/CAPSTONE days are
preferred, and early scaffolding days discouraged: day 3 consumed 4 of 9
questions and produced the trivia.

**Not yet verified live** — step 8 is the user's run.

---

## Entry 17 — Six fixes from the second live run, and the lost report

**Prompt:** raise the reporter ceiling and audit every other role's;
make writeReport degrade on EVERY callLLM failure path, not just
validation; stop `clarify` resetting the follow-up counter; tighten
never-reveal-correctness with the two leaking questions as bad examples
and enforce the omit-reaction rule; add severity ranking when one answer
contains two weaknesses; then regenerate the report from the fixture.

**Root cause of the lost report — arithmetic, not model behaviour.**
`maxOutputTokens` is a budget for THOUGHT + OUTPUT on thinking models.
The reporter at 4096 with thinking "high" spent 3597 thinking and had 482
left for JSON; both attempts landed within ~16 tokens of the cap and were
truncated mid-object, which is why they failed to parse. Giving the
reporter the full transcript is what pushed thinking that high.

The audit found two more heading the same way:

| role | cap | observed peak | used |
|---|---|---|---|
| reporter | 4096 | 4081 | 100% — FAILED |
| planner | 4096 | 3500 | 85% |
| turn | 2048 | 1517 | 74% |
| interviewer | 2048 | 708 | 35% |
| evaluator | 1024 | 142 | 14% |

Ceilings are now 16384 for the 3.6-flash roles and 8192/4096 for
flash-lite. Headroom that goes unused costs nothing.

**writeReport can no longer throw on any path.** Every `callLLM` failure
— rate limit, truncation, unparseable output — is caught and falls
through to `degradeReport`, which now accepts a null report and builds
one from session state alone. `parseJson` in llm.ts repairs markdown
fences and surrounding prose first, but deliberately does NOT try to
repair truncation: a cut-off object is unrecoverable and the fix for that
is headroom, not cleverness. Tested with a mocked reporter that throws
on every attempt.

**A second bug this exposed, not in the original list:** the session
recording was written AFTER the report, so the reporter throwing
discarded the entire 24-turn interview. I had told the user the opposite.
The recording now writes before the report, and includes the transcript.
Run 2 was reconstructed by hand from the terminal output into
`fixtures/session-CAND-017-run2.json`.

**clarify no longer resets the counter.** `followUpCount` incremented
only on `action === "follow_up"` and reset to 0 on anything else, so
alternating follow_up/clarify never tripped the cap — one topic took 6 of
10 questions. It now counts any turn spent on the same thread.

**Verdict-leaking questions.** "In a healthcare app, returning a general
paragraph instead of a precise deductible could cause real confusion" and
"You're relying entirely on a prompt instruction for critical financial
data" both tell the candidate they were wrong. Both are now BAD examples
in the prompt, against GOOD rewrites that carry the same probe with no
verdict. The omit-reaction rule is enforced in code: after two
consecutive acknowledgements the directive requires an empty reaction and
the caller strips it if the model emits one anyway.

**Severity ranking.** In one answer Tyler revealed both a missing query
router and a wildcard CORS origin on a healthcare app. The model chased
the router — the one matching its current topic — and dropped the
wildcard. The prompt now ranks weaknesses by consequence, with patient
data and privacy above architecture, and carries this exact miss as the
worked example.

**Report regenerated, 1 call, no degradation** — it passed verbatim
validation on the first attempt. Notably its NEXT section caught the
wildcard CORS the interviewer itself walked past: "replace the wildcard
in allow_origins for CORS with specific origin URLs." 97 tests pass.

---

## Entry 18 — The HTTP endpoint

**Prompt:** solve the timeout risk first (check Vercel's real limit, try
reporter at thinking "medium"), then wire the orchestrator into
`app/api/interview/route.ts` with the exact contract, stateless via
Supabase, never returning an invalid response; build a conformance script
and run its `--dry` failure cases.

**1a — the timeout risk was based on an outdated assumption.** Vercel's
current docs: with fluid compute, enabled by default, the limits are
**Hobby 300s default AND 300s maximum**; Pro 300s default, 800s maximum.
The old 10s Hobby ceiling is gone. A final request of ~30s (turn ~7s +
reporter ~19s) fits with roughly 10x margin. `export const maxDuration =
120` is set explicitly in the route anyway rather than trusting a default
that could change.

**1b — reporter at thinking "medium": 16.0s vs 18.5s at "high"**, on the
same fixture. 13% faster, 4426 tokens vs 4658, and it passed verbatim
validation on the first attempt with comparable grounding. Since there is
no longer any timeout pressure, the role stays on "high" per CLAUDE.md;
`writeReport` now accepts a `thinking` override so the cheaper setting is
one argument away if that changes.

**2 — the route.** Stateless as specified: `loadSession` at the top,
`saveSessionState` at the bottom, every request, nothing held between
invocations. The response builder can only ever emit `reply`, `done` and
`feedback` — rubric, claims, rationale, violations and state are all
persisted and none of them can reach the client, because the response
type is a union that has no room for them.

`consecutiveReactions` moved into `SessionState`. It drives the
omit-reaction rule, and in a serverless handler there is nowhere else it
could live: a module variable would have worked locally and silently
reset on every cold start during judging.

Re-sending the opening request is idempotent — it replays the stored
opening line rather than spending another planner call.

**3 — no invalid response is reachable.** Client errors return HTTP 400
but still carry the contract shape so a conformance parser never
encounters a surprise body. A failed turn call returns a safe question
with the state untouched, so the next request resumes cleanly rather than
losing the interview to a 500. The reporter path is wrapped even though
`writeReport` already cannot throw.

**4 — conformance `--dry`: 28 passed, 0 failed, 0 LLM calls.** Covers
malformed JSON, empty body, missing sessionId, unknown sessionId, unknown
candidate, empty message, and a message on a finished session. The last
one needed a completed session, so the script creates and marks one
directly through the db helpers rather than running an interview to get
there. Test rows cleaned up afterwards; all three tables verified back to
0.

Day coverage is asserted against the persisted turns rather than the
response, because days are deliberately not observable through the API.

**Not run:** the full interview path. It costs ~11 LLM calls and the user
should decide when to spend them.
