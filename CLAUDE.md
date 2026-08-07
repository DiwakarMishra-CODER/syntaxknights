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
- Planner     → gemini-3.6-flash        thinking_level "high"     (1x per session)
- Interviewer → gemini-3.6-flash        thinking_level "medium"   (every turn)
- Evaluator   → gemini-3.5-flash-lite   thinking_level "minimal"  (every turn)
- Reporter    → gemini-3.6-flash        thinking_level "high"     (1x at end)

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
- Never send the full transcript. Send the last 4 turns plus the claim
  ledger, which already summarises everything earlier.
- Keep the system prompt byte-identical across turns so it can be cached.

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
