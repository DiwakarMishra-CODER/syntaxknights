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
Always fetch https://ai.google.dev/gemini-api/docs/latest-model and the
structured-output docs before writing any API code. Write ONE working
call, verify it, then reuse that pattern everywhere.

## API keys
GEMINI_API_KEYS in .env.local — a COMMA-SEPARATED LIST of keys.
We pool several free-tier keys and rotate to spread rate limits.
Free tier is ~5-15 RPM per project, so 429s are expected and must be
handled, never crash on them.
NEVER commit .env.local. The repo is public.

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
  strings named, then throws `ReportError`
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

## THE #1 FAILURE MODE
Vercel serverless is stateless. NEVER store session state in an in-memory
Map, module global, or variable. It works locally, then silently fails
during judging. ALL state goes to Supabase keyed by sessionId — load at
the top of the handler, save at the bottom, every single request.

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

## Commit discipline
Commit every 20-30 min with real messages. The hackathon disqualifies
repos whose first commit contains most of the project, or that show one
large final commit. This is graded.
Maintain PROMPTS.md as we go — written live, not reconstructed at the end.
