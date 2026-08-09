# PROMPTS

The prompts used to build this project, in order.

## 1

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

## 2

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

## 3

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

## 4

```
push to this repo https://github.com/DiwakarMishra-CODER/syntaxknights
and dont credit yourself just me
```

## 5

```
[redacted — this message contained a live Gemini API key, and this repo is public]
```

## 6

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

## 7

```
can you keep updating prompts.md properly? are we doing it rn?
```

## 8

```
add a per-call `thinking` override to `callLLM`, sweep the
interviewer role across high/medium/low/minimal on a realistic ~2000-token
input and report latency + thought tokens; then build the Planner
(`src/lib/prompts/planner.ts`), `scripts/plan.ts`, and run it for
CAND-018, CAND-017, CAND-011, CAND-010 and CAND-008.
```

## 9

```
(0) invert role→model routing on the hypothesis that
gemini-3.6-flash's 20 RPD is a new-model restriction while GA models are
far more generous, and add passive quota telemetry instead of spending
quota to probe; (1) fix the Planner fabricating Harold's day-25 record by
restricting focusDays to the candidate's own missions[] and adding a
grounding rule; (2) merge Evaluator + Interviewer into one call; (3) A/B
both paths on the same model.
```

## 10

```
treat the two invention failures as one systemic risk — extract
the rule into `src/lib/prompts/shared.ts`, apply it to every prompt that
converts input into a structured record, and back it with code-level
validation the way `validateBlueprint` already backs focus days. Then
build `src/lib/orchestrator.ts` as a pure state machine enforcing the
graded hard requirements, with thorough mocked tests. No API calls.
```

## 11

```
make `llm.ts` consult `.quota-log.json` before picking a key —
skip any key that has already 429'd today for the requested model, prefer
the key with fewest successes, and throw a clear
`LLMError[quota_exhausted]` naming the model and reset time rather than
cycling the pool for more 429s. Add `GEMINI_KEY_INDEX=n` pinning for
scripts. Extend `quota-report.ts` with per-key per-model AVAILABLE /
EXHAUSTED verdicts. No API calls; test with mocked log data.
```

## 12

```
proceed with 3(a) and 3(b). Use automatic key selection for
3(a) rather than pinning, since that is the production code path. Confirm
the planner runs at thinking_level "high" per config.
```

## 13

```
build `scripts/interview.ts` wiring orchestrator + turn +
reporter, loading Tyler's saved blueprint from `/fixtures` rather than
re-planning; print a state panel after each turn; print the full
transcript and final report at the end. Run it for CAND-017 with
FIXTURE_RECORD=1.
```

## 14

```
the Reporter never receives the transcript, which defeats its
purpose — strengths and gaps are meant to quote the candidate's own words,
and verbatim validation has nothing to validate against. Pass the full
transcript in and keep every guard: ANTI_INVENTION, verbatim checking with
one retry, claims from the filtered ledger. Add a test that a strength
quoting words the candidate never said is rejected. Confirm the prompt
requires at least one direct quote in each strength and each gap.
```

## 15

```
never return no feedback. On a second validation failure, drop
the offending strengths and gaps, keep what validated, and return the
report; if that leaves strengths empty, emit one honest unquoted line.
Log the degradation. Never throw on the request path. Add a test that a
report where 2 of 3 strengths fail returns the surviving one. Keep the
gaps rule as a warning.
```

## 16

```
fix the six issues diagnosed from the CAND-017 log plus the
dangling end, in order, no API calls. Fix the off-by-one architecturally
rather than by relabelling; fix multi-line input; never end on an
unanswered question; make the follow-up cap quality-aware; fix depth and
non-substantive scoring; fix question quality in TURN_SYSTEM; loosen the
planner. Then the user re-runs the session.
```

## 17

```
raise the reporter ceiling and audit every other role's;
make writeReport degrade on EVERY callLLM failure path, not just
validation; stop `clarify` resetting the follow-up counter; tighten
never-reveal-correctness with the two leaking questions as bad examples
and enforce the omit-reaction rule; add severity ranking when one answer
contains two weaknesses; then regenerate the report from the fixture.
```

## 18

```
solve the timeout risk first (check Vercel's real limit, try
reporter at thinking "medium"), then wire the orchestrator into
`app/api/interview/route.ts` with the exact contract, stateless via
Supabase, never returning an invalid response; build a conformance script
and run its `--dry` failure cases.
```

## 19

```
confirm everything is pushed, then update CLAUDE.md.
```

## 20

```
build the interview screen with zero API calls — server-side
fixture replay first, a separate state endpoint, then an "instrument"
visual direction with a depth trace as the signature element. Write a
design plan and self-critique it before building.
```

## 21

```
pull the teammate's changes, then make both pages intact and
connected.
```

## 22

```
make "Start Practicing" go to /interview too. Also: from now
on, commit and push only when asked.
```

## 23

```
"still cant see the glass effect in the containers on landing
page add that. and bg was also not all black" → "there is still no glass
effect on localhost 3k" → "STILL NOT THERE" → "and start pracising doesnt
go anywhere"
```

## 24

```
"my friends will do frontend work. we gotta make the main
part the interview better. how to do it. use ml or what"
```

## 25

```
"can you verify here what happens when interview ends. like
what is shown the result of the interiview" → "should we give
scores?improvemnts? etc"
```

## 26

```
"keep an end interview button? and then we the results on a
new page?"
```

## 27

```
a numbered list of ten defects from the Sarah Johnson
interview, grouped by priority, "No API calls needed for any of this."
```

## 28

```
"the scrolling stll not good or working. and also cant see
the below text in side panel and cant scroll to see either" → "it still
dosnt scroll...wtf are you doing you cant fix it?"
```

## 29

```
"now wtf would somneone understand what the graph is about
cause we only see lines when responses come... those 5 things written
redisgn etc and claims wtf are those" → "should we show those 5 qs on
left side?"
```

## 30

```
"so..changes have been amde to the repo. we have a new
landing page... i wanna preserve all the ui of landing page ALL ok. and
interview page will be what i have now."
```

## 31

```
"ok so is it faster now? intial load and also after givig a
response?" · "i wanna use pinecone db. i heard its faster and better." ·
"what about if we use pgvector too in supabase" · "are we wasting any api
calls uselessly somehwere"
```

## 32

```
"i want to keep the ui of what ishan pushed in interview. and
keep the logic and functioning to what i built. see properly and tell me
how we will do that. properly"
```

## 33

```
"the response doesnt feel human. like i wrote rubbish and it
just moved on like a chatbot didnt say nothing" → "i want it to feel more
human . like the interviwer tells us how our prev response was. relly
good, something missing... like in internshala interviews"
```

## 34

```
we could show timeline in end report and all the question wise analysis everything too? and keep the score? and fix that 80% bug?
```

## 35

```
hey ishan pushed something have a look. light dark dont work in that toiggle though. i want what light dark tioggle i had made before merging botth their commits. you know that collding animation and light mode aniation+ text fixes
```

## 36

```
fix the light dark mode we spent so much time on it. we should have that.
```

## 37

```
first fix bg on light mode and also the text what we had decided before the merge.and in candidate page these green boxes not visiable. the light mode colour is good there. but on landing page is weird. fix all that first
```

## 38

```
i told you to fix this. the hover no text. and in gren boxes no text you couldnt fking do it
```

## 39

```
so it works right the interview?
```

## 40

```
landing page is fine. what is the fix for the duplicated next steps section?
```

## 41

```
update promots.md it should ONLY have my promot not hat that prompt did. ONLUY PROMPTS
```
