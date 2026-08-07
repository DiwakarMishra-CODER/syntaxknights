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
