# AI Interview Agent (Hackathon)

## What this is
An AI agent that conducts a realistic, adaptive, multi-turn technical
interview with a graduate of a 31-day AI engineering cohort, then gives
structured feedback. This is a LEARNING tool, not a hiring screen.
Nobody is being rejected — they are practising to explain what they built.

## Stack
Next.js 15 (App Router, TypeScript, Tailwind) · Supabase Postgres ·
Gemini API via @google/genai · deployed on Vercel

## Models (use exactly these IDs)
- Turn        → gemini-3.5-flash-lite   thinking_level "medium"   (every turn, ~10x)
- Planner     → gemini-3.6-flash        thinking_level "high"     (1x per session)
- Reporter    → gemini-3.6-flash        thinking_level "high"     (1x at end)

Interviewer and Evaluator are merged into a single Turn call. Both roles
remain in ROLE_CONFIG (on flash-lite) so the merge can be reverted.

### Why the high-volume role is on the WEAKER model
gemini-3.6-flash is capped at **20 requests per DAY per key** on the free
tier. Measured, not guessed: the 429 body reports
`metric: generativelanguage.googleapis.com/generate_content_free_tier_requests,
limit: 20`, waiting out its stated retry delay still 429s, and
flash-lite succeeds at the same moment — so the quota is per model and
daily. We believe this is because 3.6-flash is brand new; GA models like
flash-lite appear far more generous.

**This is a hypothesis pending real data.** Every call now writes to
`.quota-log.json` (gitignored); run `npm run quota:report` to see actual
per-model per-day counts and any limits Gemini has reported. Re-route if
the numbers say otherwise.

At 20 RPD, putting the turn loop on 3.6-flash would allow ~1.5 interviews
per key per day. On flash-lite the turn loop is limited by whatever that
model's real ceiling is, while planner + reporter consume only 2 of the
20 daily 3.6-flash calls — roughly 10 interviews per key per day from
that side.

## Gemini 3.x API — DO NOT WRITE FROM MEMORY
Your training data likely predates these breaking changes:
- temperature, top_p, top_k are REMOVED. Do not include them.
- thinking_budget is replaced by thinking_level: "minimal"|"medium"|"high"
- The surface is `ai.interactions.create()` and its params are snake_case:
  `system_instruction`, `generation_config.thinking_level`,
  `response_format: { type, mime_type, schema }`. Read is `output_text`.

### maxOutputTokens is a THOUGHT + OUTPUT budget
This cost us a whole interview. The reporter at 4096 with thinking "high"
spent 3597 tokens thinking and had 482 left for JSON, so the response
truncated mid-object and failed to parse — twice. It looked like the
model ignoring the schema. It was a truncated buffer.

Whenever a role's input grows or its thinking level rises, re-check the
ceiling against observed `thought + output`, not output alone. An audit
at the time found planner at 85% of its cap and turn at 74%, both heading
for the same silent failure. Ceilings now sit far above observed peaks;
unused headroom costs nothing.
Always fetch https://ai.google.dev/gemini-api/docs/latest-model and the
structured-output docs before writing any API code. Write ONE working
call, verify it, then reuse that pattern everywhere.

## API keys and the REAL quota shape
GEMINI_API_KEYS in .env.local — a COMMA-SEPARATED LIST of keys.
NEVER commit .env.local. The repo is public.

Measured, not guessed. The original "~5-15 RPM per project" note was
wrong in both directions:
- The binding limit on gemini-3.6-flash is **20 requests per DAY**, not
  per minute. The 429 body says so:
  `metric: .../generate_content_free_tier_requests, limit: 20`.
- It is **per key AND per model**, NOT per project. Verified: key #0 was
  429ing on 3.6-flash while key #1 succeeded on the same model in the
  same minute, and key #0 stayed fine on flash-lite throughout.
- Waiting out the API's own stated retry delay does NOT clear a daily
  budget. Treat `Please retry in Xs` as a lower bound, not a promise.

So pooling keys genuinely multiplies capacity. With planner + reporter
being the only 3.6-flash calls (2 per interview), one key supports ~10
interviews/day and a 6-key pool ~60.

`llm.ts` consults `.quota-log.json` before choosing a key: any key that
has already 429'd today for the requested model is skipped, and the one
with fewest successes wins. `npm run quota:report` shows AVAILABLE /
EXHAUSTED per key per model. `GEMINI_KEY_INDEX=n` pins a key for scripts.
On Vercel the log cannot be written, so selection degrades to plain
round-robin — quota awareness is a local instrument.

## Token discipline (we are on free tiers)
- Never send the full 31-day curriculum in a turn prompt. Send only the
  target day's objectives.
- Never send the full transcript **in a per-turn prompt**. Send the last 4
  turns plus the claim ledger, which already summarises everything earlier.
- Keep the system prompt byte-identical across turns so it can be cached.

### Documented exception: the Reporter gets the full transcript
Feedback has to quote the candidate back to themselves to be worth
reading, and the verbatim check has nothing to validate against without
the source text. Withholding the transcript never made the reporter safe;
ANTI_INVENTION plus verbatim validation does. This is one call per
session, so the cost is paid once, not per turn.

Guards on that call, all enforced in code:
- every quoted span must appear verbatim in a CANDIDATE turn
- every strength must carry at least one quote
- a failing report is rejected and retried once with the offending
  strings named; on a second failure it DEGRADES rather than throwing —
  offending strengths/gaps/next items are dropped, a fabricated summary is
  replaced with a factual line, and if nothing survives, one honest
  unquoted line is emitted. The degradation is logged.
- **the reporter never throws on validation.** The contract requires a
  feedback object, and a candidate who answered ten questions has earned
  a response. A thinner honest report beats an error.
- claims come from the already-filtered ledger

A gap may legitimately carry no quote — it can describe something that
never came up, and silence cannot be quoted. That is warned, not
rejected: forcing a quote there would manufacture the invention the
guard exists to prevent.

## Non-negotiable API contract
POST /api/interview  (single endpoint, no auth)
First request:  { sessionId, candidate }
Then:           { sessionId, message }
Response:       { reply: string, done: boolean }
Final:          { reply, done: true,
                  feedback: { summary, strengths[], gaps[], next[] } }
Do NOT add fields to the response. `reply` is a plain string. Judges may
run an automated conformance check.

## Vercel duration — not the constraint we feared
With fluid compute (on by default) the limits are Hobby 300s default AND
300s maximum; Pro 300s default, 800s maximum. The old 10s Hobby ceiling
is gone. The heaviest request is the final one — a turn call (~7s) plus
the reporter (~19s), about 30s — which fits with ~10x margin.

`export const maxDuration = 120` is set explicitly in the route rather
than trusting a default that could change.

## THE #1 FAILURE MODE
Vercel serverless is stateless. NEVER store session state in an in-memory
Map, module global, or variable. It works locally, then silently fails
during judging. ALL state goes to Supabase keyed by sessionId — load at
the top of the handler, save at the bottom, every single request.

## Architecture rules learned the hard way

### Constraints go IN to the model, never on top of its output
The orchestrator computes a `TurnDirective` BEFORE the turn call and
renders it into the prompt ("You MUST move on to X now — 3 follow-ups
already used"). The model then writes its question for the right topic
and `recordTurn` files it under the model's own targetDay.

Do NOT reintroduce a post-hoc override. The first version rewrote
`targetDay` after generation, so a question written about one topic was
filed under another and coverage counted topics no question had been
asked about. If the model ignores a directive, record what it actually
did and log a violation — never relabel.

### The model is never trusted to count
Question count, day coverage, follow-up limits and the conclude gate are
all enforced in TypeScript in `orchestrator.ts` and unit-tested against
adversarial models. "Covered at least 4 days" is graded; it must not
depend on an LLM remembering.

### Anti-invention is a shared rule plus code enforcement
`ANTI_INVENTION` in `prompts/shared.ts` goes into every prompt that turns
input into a structured record. A prompt rule is a request; validation is
the guarantee:
- claims are filtered against the candidate's own words
  (`filterInventedClaims`)
- planner reasons may only assert performance for days in `missions[]`
- reporter quotes must appear verbatim in a CANDIDATE turn

### Interviewer voice
Never say "Day 22" or any day number — a real interviewer has not seen
the syllabus. Objectives are context, never a checklist. Prefer
consequence questions over inventory ones. Chasing a revealed weakness
outranks the plan, and when one answer holds two weaknesses, take the
more severe (patient data and privacy above architecture). Never reveal
correctness — including by stating the risk inside the question.

## Do NOT build
Vector DB / embeddings / RAG — the curriculum is 31 days, ~17KB, filter
in JavaScript. This is a deliberate documented decision.
No voice, WebRTC, auth, user accounts, or proctoring — all out of scope.
No LangChain or any agent framework. Hand-rolled orchestration.

## Code style
Prompts live in /lib/prompts/*.ts, never inlined in route handlers.
All LLM calls go through one wrapper in /lib/llm.ts so provider and model
are config, not scattered call sites.
No file over ~300 lines.

## Scripts, and what each costs
| command | cost |
|---|---|
| `npm test` | 0 — 97 unit tests |
| `npm run conformance -- --dry` | 0 — contract failure cases |
| `npm run quota:report` | 0 — per-key availability |
| `npm run report:fixture <f>` | 1 — regenerate a report from a saved session |
| `npm run plan CAND-0XX` | 1 per candidate |
| `npm run compare:turn` | 3 — merged vs split A/B |
| `npm run interview CAND-0XX` | ~11 — full live interview |
| `npm run conformance` | ~11 — full contract run |

`FIXTURE_RECORD=1` saves a replay; `FIXTURE_REPLAY=<path>` re-runs a
session with ZERO calls. The recording is written BEFORE the report, so a
reporter failure cannot discard the interview.

## Commit discipline
Commit every 20-30 min with real messages. The hackathon disqualifies
repos whose first commit contains most of the project, or that show one
large final commit. This is graded.
Maintain PROMPTS.md as we go — written live, not reconstructed at the end.
It is grouped by feature, not chronological: file each new prompt under the
section it belongs to rather than appending to the end, or the grouping decays
back into a flat tail. Prompts only, verbatim, no commentary.
