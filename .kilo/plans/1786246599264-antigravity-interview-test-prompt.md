# Antigravity prompt: test the AI interviewer in the browser

This file is the artifact you paste into **Antigravity** (Google's browser-based
agentic dev environment). It drives a live, realistic interview end-to-end and
judges whether it "feels like a real interview."

> Copy the fenced `ANTIGRAVITY PROMPT` block below into Antigravity.

---

## Context it needs (so the prompt is self-contained)

- Stack: Next.js 15 (App Router), `@google/genai`, Supabase Postgres.
- Endpoint under test: `POST /api/interview` (single endpoint, no auth).
  - First request: `{ "sessionId": "test-1", "candidate": "CAND-017" }`
  - Subsequent: `{ "sessionId": "test-1", "message": "<candidate answer>" }`
  - Response while live: `{ "reply": string, "done": false }`
  - Final: `{ "reply": string, "done": true, "feedback": { "summary": string, "strengths": string[], "gaps": string[], "next": string[] } }`
- UI entry: `http://localhost:3000/interview?candidate=CAND-017` (redirects to a
  minted `/interview/ui-<uuid>?candidate=CAND-017`). The composer at the bottom
  is how the candidate answers.
- Candidate CAND-017 (Sarah Johnson, Senior Data Engineer) completed missions on
  RAG/embeddings (day 7), vector DBs (8), retrieval engine (10), prompt
  engineering (12), chatbot backend (16), multi-agent orchestration (22),
  MCP (23), Docker/K8s (28), capstone (31); skipped monitoring/observability (29).
- Required env (`.env.local`, gitignored, NEVER commit):
  `GEMINI_API_KEYS` (comma-separated), `NEXT_PUBLIC_SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`.
- Zero-call fallback exists: `FIXTURE_REPLAY=fixtures/session-CAND-017.json npm run interview CAND-017`.

---

## ANTIGRAVITY PROMPT

```
You are testing a running Next.js app that conducts an AI technical interview.
Goal: prove the live interviewer works in the browser and "feels like a real
interview", then verify the API contract. Work step by step.

1. ENV CHECK. Look for `.env.local` in the repo root.
   - It MUST define GEMINI_API_KEYS (comma-separated), NEXT_PUBLIC_SUPABASE_URL,
     and SUPABASE_SERVICE_ROLE_KEY.
   - If any are missing or empty, STOP and tell the user in plain language:
     "The browser interview cannot run without .env.local containing
     GEMINI_API_KEYS, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY.
     Please paste a valid .env.local (do NOT commit it). Once present, re-run."
     Do not invent keys. Do not continue to step 2 until they exist.

2. START SERVER. Run `npm run dev` in the background and wait until it logs
   "Ready" on http://localhost:3000. Report the URL when up.

3. OPEN BROWSER. In your browser tool, open
   http://localhost:3000/interview?candidate=CAND-017
   Confirm it redirects to /interview/ui-<uuid>?candidate=CAND-017 and that an
   opening interviewer line (a question/intro, NOT a day number) appears in the
   center panel.

4. RUN A REALISTIC INTERVIEW. You ARE the candidate (Sarah Johnson, Senior Data
   Engineer). For each interviewer question, TYPE a substantive, first-person
   answer grounded in her completed work — RAG/embeddings, vector DBs, retrieval,
   prompt engineering, chatbot backend, multi-agent orchestration, MCP,
   Docker/Kubernetes, capstone — and her skipped monitoring/observability day.
   Make answers realistic but imperfect (occasionally brief or hedging) so the
   adaptive behavior is exercised. Use the on-screen composer to submit.
   Continue answering every question the interviewer asks until the session ends
   (a closing line + a structured report panel, or a response with done:true).
   Do NOT end it early via "End Interview" unless it is clearly stuck.

5. JUDGE "REAL INTERVIEW" QUALITY. While going, note:
   - Does it ask follow-ups that build on YOUR previous answers (not a checklist)?
   - Does it maintain context across turns (references earlier things you said)?
   - Does it ever say "Day 7" / "Day 22" or reveal whether you were right
     (no leaking of day numbers or correctness)? It should not.
   - Are questions consequence/why-style rather than pure inventory?
   - Does depth increase when you answer well and ease when you struggle?
   Report a short verdict: PASS / PARTIAL / FAIL with 2-3 specific examples.

6. VERIFY THE CONTRACT. After the session ends, fetch the final API exchange.
   Using curl or the browser network tool, confirm the last POST
   /api/interview returned JSON shaped exactly as:
   { "reply": string, "done": true,
     "feedback": { "summary": string, "strengths": [string], "gaps": [string], "next": [string] } }
   Confirm `reply` is a plain string and no extra keys (rubric, claims, state)
   leaked into the response. Also confirm the report panel shows summary,
   strengths, gaps, next.

7. ZERO-CALL SMOKE (optional but recommended). Run
   `FIXTURE_REPLAY=fixtures/session-CAND-017.json npm run interview CAND-017`
   to prove the engine replays a full session with ZERO API calls (no keys
   needed) and prints the same feedback shape.

8. SUMMARY. Report back: env status, server status, number of questions asked
   and distinct curriculum days touched, the realism verdict from step 5, the
   contract check from step 6, and any errors (500s, blank replies, stuck loops).
   End with a one-line "READY FOR JUDGING: yes/no".
```

---

## Notes / risks

- If `.env.local` can't be supplied, the live browser path is blocked; fall back
  to `FIXTURE_REPLAY` (step 7) to demonstrate the interview engine without keys.
- The planner and reporter run on `gemini-3.6-flash` (20 req/day/key cap) and the
  turn loop on `gemini-3.5-flash-lite`. A single live interview ≈ 11 calls; one
  key supports only a few live runs per day — prefer replay for repeated tests.
- `npm run conformance -- --dry` (0 calls) and `npm test` (97 unit tests, 0
  calls) are extra, fast correctness checks you can run alongside.
