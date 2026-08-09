# MockMate — The Interview Agent

**Every mock interview tool guesses what you're weak at from your CV. This one knows, because it watched you learn.**

MockMate reads a candidate's 31-day cohort record *before the first question* — which days they finished, how many attempts each took, what they skipped — and builds an interview around it. Two people who both "completed the course" get completely different interviews.

> **Diane Foster** — 31/31 days, 100% first try.
> **Tyler Brooks** — 31/31 days, 3% first try.
>
> On any conventional summary those two are identical. That gap is the entire product.

It's a practice tool for learning to explain what you built. Nobody is being rejected.

---

## 📹 Watch this first

### ▶ **[3-minute demo walkthrough](data/VN20260809_194517.mp4)**

**The video is in this repo** — no external link to chase, nothing to expire.
`data/VN20260809_194517.mp4` · 3:04 · 1920×752 · 29 MB

If it doesn't play in the browser, use the **Download** / **View raw** button on that page, or after cloning:

```bash
open data/VN20260809_194517.mp4        # macOS
xdg-open data/VN20260809_194517.mp4    # Linux
```

🔗 **Live:** **https://syntaxknightsai.vercel.app**

Prefer to just run it? [Skip to Run it](#run-it) — `FIXTURE=1 npm run dev` gives you a full interview with **no API keys**.

---

## Run it

```bash
npm install
cp .env.local.example .env.local     # add your keys
npm run dev                          # → http://localhost:3000
```

`.env.local` needs:

```
GEMINI_API_KEYS=key1,key2,key3       # comma-separated pool; one key works
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### No keys? Run the whole thing anyway

```bash
FIXTURE=1 npm run dev
```

Serves a **recorded session** through the real route — same contract, same response shape, recorded latency simulated. The orchestrator, state machine, persistence and response builder all still execute; only the three model calls are substituted. This is how the UI was built and tested at **zero API cost**, and switching to live is one environment variable.

---

## The API contract

One endpoint, no auth. `POST /api/interview`

```jsonc
// first request
{ "sessionId": "abc-123", "candidate": { /* candidate.json */ } }

// every turn after
{ "sessionId": "abc-123", "message": "..." }

// response
{ "reply": "...", "done": false }

// final response — and only this one — carries feedback
{ "reply": "...", "done": true,
  "feedback": { "summary": "...", "strengths": [], "gaps": [], "next": [] } }
```

`reply` is always a plain string. **No extra keys ever leak** — the rubric, claim ledger, rationale and session state all persist to Supabase but never appear in the response. The return type is a closed union with no room for extra fields, and `npm run conformance` checks the shape end to end.

Two supporting endpoints exist so the frozen contract can *stay* frozen:
`GET /api/session/[id]/state` (drives the live panel) and `POST /api/session/[id]/end`.

---

## How it works

```
candidate record ──► PLANNER ──► blueprint (persona, arc, 4–6 focus days, strategy per day)
                                     │
                    ┌────────────────┴────────────────┐
                    │  per turn:                      │
   your answer ──►  │  orchestrator computes a        │  ──► question
                    │  directive  ►  ONE model call   │
                    │  ►  validate  ►  fold to state  │
                    └────────────────┬────────────────┘
                                     │  floors met + model concludes
                                     ▼
                                  REPORTER ──► feedback
```

**Three prompts, no agent framework.** Hand-rolled orchestration in TypeScript.

| Role | Model | Calls/interview | Why |
|---|---|---|---|
| Planner | `gemini-3.6-flash` | 1 | Selects focus days from the cohort record |
| Turn | `gemini-3.5-flash-lite` | ~10 | Assess + ask, merged into one call |
| Reporter | `gemini-3.6-flash` | 1 | The only prompt that sees the full transcript |

The high-volume role sits on the *weaker* model on purpose — see [Model routing](#model-routing-is-a-quota-decision) below.

---

## The decisions worth defending

### Constraints go *into* the model, never on top of its output

Before each turn the orchestrator computes a `TurnDirective` — must we change topic, may we conclude, what depth — and renders it into the prompt as instruction: *"You MUST move on to X now — 3 follow-ups already used."* The model then writes its question for the right topic and we record the topic **it** chose.

An earlier version rewrote `targetDay` *after* generation. A question written about one topic got filed under another, and "4 days covered" counted topics no question had been asked about. The claim was false. Now, if the model disobeys, that's logged as a violation rather than silently relabelled.

### The model is never trusted to count

Question count, day coverage, follow-up limits and the conclude gate are enforced in `orchestrator.ts` — `MIN_QUESTIONS = 8`, `MIN_DAYS_COVERED = 4`, `MAX_FOLLOW_UPS = 3`. The minimum requirements are graded; they must not depend on an LLM remembering. Unit tests run adversarial models — one that always tries to conclude, one that never leaves a topic — and assert the floors still hold.

### Anti-invention is a prompt rule *plus* code enforcement

A prompt rule is a request; validation is the guarantee. Three separate guards, each added after a real failure:

- **Blueprint** — `validateBlueprint()` rejects performance claims about days absent from the record. The model once invented that a candidate "passed day 25 on a standard attempt". Day 25 wasn't in his record at all.
- **Claim ledger** — `filterInventedClaims()` drops any claim naming a technical term the candidate never used. It once recorded *"configured termination grace period"* from someone who said only *"we set it up properly"* — and every later turn would have probed a fact that didn't exist.
- **Report** — every quoted span must appear verbatim in a candidate turn. Fails → retry once with the offending strings named → then degrade, keeping what validated. **It never throws:** the contract requires a feedback object, and someone who answered ten questions has earned a response.

### The report is allowed to say nothing good

`strengths` has **no minimum**. It used to have `minItems: 1`, which meant a transcript with nothing quotable left the model no legal way to say so — so it invented one. Turning up, answering everything, and being honest about not knowing are explicitly *not* strengths. A candidate scored generously for saying nothing learns nothing.

### Why we didn't use a vector database

The curriculum is 31 days and **17 KB**. Exact filtering in JavaScript beats semantic similarity on a corpus that small, with no embedding cost, no index, no drift, and no chance of retrieving the wrong day. A deliberate rejection is better engineering than a decorative inclusion.

### Model routing is a quota decision

`gemini-3.6-flash` is capped at **20 requests per day per key** on the free tier — measured, not guessed: the 429 body names the metric and limit, waiting out the stated retry delay still 429s, and flash-lite succeeds at the same moment. So the ~10-call turn loop runs on flash-lite, while planner + reporter spend only 2 of the 20 daily calls. Roughly **10 interviews per key per day** instead of 1.5.

Merging the evaluator and interviewer into one call halved requests per interview — 10 instead of 20. On a per-day quota that is what decides how many interviews a key supports.

`llm.ts` also consults `.quota-log.json` before choosing a key: any key that has already 429'd today *for that model* is skipped, and the one with fewest successes wins.

### Never store session state in memory

Vercel is stateless. An in-memory `Map` works perfectly on localhost and silently fails during judging when a request hits a cold instance. **Everything** lives in Supabase — three tables, loaded at the top of every request, saved at the bottom — down to the counter that decides when to omit an acknowledgement.

### Interviewer voice

Never says "Day 22" or any day number — a real interviewer hasn't seen the syllabus. Never reveals correctness, including by stating the risk inside the question. Prefers consequence questions over inventory ones. Chasing a revealed weakness outranks the plan, and when one answer holds two weaknesses it takes the more severe — patient data and privacy above architecture.

---

## The interface

The **depth trace** is the signature element: a chart-recorder line plotting question depth 1–5 across turns.

```
recall → application → tradeoff → edge case → redesign
```

It's the only thing on screen that *shows* adaptation rather than asserting it. A judge watching a chat window has to take your word for it; a judge watching the depth line dip after a weak answer does not. Hovering a question marks its segment on the trace, and vice versa — so you can connect *this answer* to *that depth change*.

Two weak answers in a row drops the interview into **recovery**: a depth level down, scaffolded, never piling on. A strong answer earns extra follow-ups on that thread.

After the interview: an annotated transcript with per-answer scoring, topic breakdown derived from the answers (not from how hard the questions were), the claims you asserted without backing, and next steps mapped to specific curriculum days. Printable to PDF.

---

## Testing

| command | API cost |
|---|---|
| `npm test` | **0** — 259 unit tests |
| `npm run conformance -- --dry` | **0** — contract failure cases |
| `npm run typecheck` | **0** |
| `npm run quota:report` | **0** — per-key availability |
| `FIXTURE=1 npm run dev` | **0** — full session replay |
| `npm run report:fixture <f>` | 1 |
| `npm run interview CAND-0XX` | ~11 — full live interview in the terminal |
| `npm run conformance` | ~11 — full contract run |

259 tests cover the orchestrator against adversarial models, every anti-invention guard, the depth ladder, blueprint validation, report degradation, and the response contract.

---

## Layout

```
src/app/api/interview/route.ts       THE endpoint (frozen contract)
src/app/api/session/[id]/state       panel data — separate, on purpose

src/lib/orchestrator.ts              state machine: floors, depth, modes
src/lib/engine.ts                    live-vs-fixture seam
src/lib/llm.ts                       every model call, key rotation, quota awareness
src/lib/db.ts                        Supabase helpers, all take a sessionId
src/lib/prompts/planner.ts           once per session
src/lib/prompts/turn.ts              every turn
src/lib/prompts/reporter.ts          once at the end
src/lib/prompts/shared.ts            ANTI_INVENTION + claim verification

src/components/DepthTrace.tsx        the signature element
supabase/schema.sql                  three tables
```

**Stack** — Next.js 15 (App Router, TypeScript, Tailwind) · Supabase Postgres · Gemini via `@google/genai` · Vercel

---

## Also in this repo

- **[PROMPTS.md](PROMPTS.md)** — all 96 prompts used to build this, verbatim, grouped by feature. Written live, not reconstructed at the end.
- **[CLAUDE.md](CLAUDE.md)** — the working agreement: measured quota facts, architecture rules, and the failures that produced each one.
- **[docs/technical-spec.md](docs/technical-spec.md)** — the required API contract.

---

<sub>Built for The Interview Agent hackathon. Curriculum and candidate data are synthetic and supplied by the organisers.</sub>
