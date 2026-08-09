# PROMPTS

Every prompt used to build MockMate, grouped by what it was working on.
Prompts are reproduced verbatim, in the order they were sent within each section.

To add one: append it under the section it belongs to, not to the end of the file.

1. [Foundations & project setup](#1-foundations-project-setup)
2. [Model routing, quota & the LLM wrapper](#2-model-routing-quota-the-llm-wrapper)
3. [Grounding & anti-invention](#3-grounding-antiinvention)
4. [The interview engine & orchestrator](#4-the-interview-engine-orchestrator)
5. [Landing page — content & layout](#5-landing-page-content-layout)
6. [The 3D hero](#6-the-3d-hero)
7. [Light & dark theme](#7-light-dark-theme)
8. [The interview experience](#8-the-interview-experience)
9. [The end-of-interview report](#9-the-endofinterview-report)
10. [Testing & judging readiness](#10-testing-judging-readiness)
11. [Housekeeping](#11-housekeeping)

---

## 1. Foundations & project setup

### 1

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

### 2

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

### 3

```
push to this repo https://github.com/DiwakarMishra-CODER/syntaxknights
and dont credit yourself just me
```

### 4

```
[redacted — this message contained a live Gemini API key, and this repo is public]
```

### 5

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

### 6

```
confirm everything is pushed, then update CLAUDE.md.
```

---

## 2. Model routing, quota & the LLM wrapper

### 7

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

### 8

```
add a per-call `thinking` override to `callLLM`, sweep the
interviewer role across high/medium/low/minimal on a realistic ~2000-token
input and report latency + thought tokens; then build the Planner
(`src/lib/prompts/planner.ts`), `scripts/plan.ts`, and run it for
CAND-018, CAND-017, CAND-011, CAND-010 and CAND-008.
```

### 9

```
(0) invert role→model routing on the hypothesis that
gemini-3.6-flash's 20 RPD is a new-model restriction while GA models are
far more generous, and add passive quota telemetry instead of spending
quota to probe; (1) fix the Planner fabricating Harold's day-25 record by
restricting focusDays to the candidate's own missions[] and adding a
grounding rule; (2) merge Evaluator + Interviewer into one call; (3) A/B
both paths on the same model.
```

### 10

```
make `llm.ts` consult `.quota-log.json` before picking a key —
skip any key that has already 429'd today for the requested model, prefer
the key with fewest successes, and throw a clear
`LLMError[quota_exhausted]` naming the model and reset time rather than
cycling the pool for more 429s. Add `GEMINI_KEY_INDEX=n` pinning for
scripts. Extend `quota-report.ts` with per-key per-model AVAILABLE /
EXHAUSTED verdicts. No API calls; test with mocked log data.
```

### 11

```
proceed with 3(a) and 3(b). Use automatic key selection for
3(a) rather than pinning, since that is the production code path. Confirm
the planner runs at thinking_level "high" per config.
```

### 12

```
raise the reporter ceiling and audit every other role's;
make writeReport degrade on EVERY callLLM failure path, not just
validation; stop `clarify` resetting the follow-up counter; tighten
never-reveal-correctness with the two leaking questions as bad examples
and enforce the omit-reaction rule; add severity ranking when one answer
contains two weaknesses; then regenerate the report from the fixture.
```

### 13

```
solve the timeout risk first (check Vercel's real limit, try
reporter at thinking "medium"), then wire the orchestrator into
`app/api/interview/route.ts` with the exact contract, stateless via
Supabase, never returning an invalid response; build a conformance script
and run its `--dry` failure cases.
```

---

## 3. Grounding & anti-invention

### 14

```
treat the two invention failures as one systemic risk — extract
the rule into `src/lib/prompts/shared.ts`, apply it to every prompt that
converts input into a structured record, and back it with code-level
validation the way `validateBlueprint` already backs focus days. Then
build `src/lib/orchestrator.ts` as a pure state machine enforcing the
graded hard requirements, with thorough mocked tests. No API calls.
```

### 15

```
the Reporter never receives the transcript, which defeats its
purpose — strengths and gaps are meant to quote the candidate's own words,
and verbatim validation has nothing to validate against. Pass the full
transcript in and keep every guard: ANTI_INVENTION, verbatim checking with
one retry, claims from the filtered ledger. Add a test that a strength
quoting words the candidate never said is rejected. Confirm the prompt
requires at least one direct quote in each strength and each gap.
```

### 16

```
never return no feedback. On a second validation failure, drop
the offending strengths and gaps, keep what validated, and return the
report; if that leaves strengths empty, emit one honest unquoted line.
Log the degradation. Never throw on the request path. Add a test that a
report where 2 of 3 strengths fail returns the surviving one. Keep the
gaps rule as a warning.
```

### 17

```
fix the six issues diagnosed from the CAND-017 log plus the
dangling end, in order, no API calls. Fix the off-by-one architecturally
rather than by relabelling; fix multi-line input; never end on an
unanswered question; make the follow-up cap quality-aware; fix depth and
non-substantive scoring; fix question quality in TURN_SYSTEM; loosen the
planner. Then the user re-runs the session.
```

---

## 4. The interview engine & orchestrator

### 18

```
build `scripts/interview.ts` wiring orchestrator + turn +
reporter, loading Tyler's saved blueprint from `/fixtures` rather than
re-planning; print a state panel after each turn; print the full
transcript and final report at the end. Run it for CAND-017 with
FIXTURE_RECORD=1.
```

### 19

```
build the interview screen with zero API calls — server-side
fixture replay first, a separate state endpoint, then an "instrument"
visual direction with a depth trace as the signature element. Write a
design plan and self-critique it before building.
```

---

## 5. Landing page — content & layout

### 20

```
pull the teammate's changes, then make both pages intact and
connected.
```

### 21

```
make "Start Practicing" go to /interview too. Also: from now
on, commit and push only when asked.
```

### 22

```
"still cant see the glass effect in the containers on landing
page add that. and bg was also not all black" → "there is still no glass
effect on localhost 3k" → "STILL NOT THERE" → "and start pracising doesnt
go anywhere"
```

### 23

```
"so..changes have been amde to the repo. we have a new
landing page... i wanna preserve all the ui of landing page ALL ok. and
interview page will be what i have now."
```

### 24

```
landing page is fine. what is the fix for the duplicated next steps section?
```

### 25

````
Create a premium landing page for an intelligent mock interview platform called MockMate.

MockMate is a next-generation technical interview platform that conducts realistic, adaptive mock interviews. Unlike traditional interview preparation tools that ask static questions, MockMate listens, understands responses, adapts follow-up questions in real time, evaluates reasoning, communication, and technical depth, and generates detailed interview feedback with personalized improvement recommendations.

The core philosophy of the product is:

"Every mock interview asks everyone the same questions.
MockMate conducts a conversation that evolves with you."

The website should immediately communicate that MockMate is not another AI chatbot or interview question bank. It should feel like a premium interview experience designed by engineers for engineers.

## Brand Personality

Premium

Confident

Minimal

Intelligent

Calm

Modern

Human

Trustworthy

Sophisticated

The experience should feel handcrafted, not AI-generated.

## Design Aesthetic

Create a luxurious glassmorphism interface inspired by:

Apple VisionOS

Linear

Stripe

Arc Browser

The Browser Company

Nothing

Use a cohesive visual language throughout the entire website.

Avoid generic SaaS templates.

Avoid feature-grid overload.

Avoid excessive glow.

Avoid cyberpunk aesthetics.

Avoid robot illustrations and AI avatars.

Avoid dashboard-heavy layouts.

The website should feel like one continuous premium experience.

## Color Theme

Use one consistent visual system.

Background:
Deep midnight navy (#0B1220)

Glass surfaces:
Semi-transparent dark glass with realistic blur and subtle reflections.

Accent Colors:

Emerald (#4ADEB5)

Ice Blue (#8FDFFF)

Warm Champagne (#F4E8C1)

Use enormous blurred aurora lights only around the corners and edges of the page.

The center should remain calm, clean and highly readable.

The gradients should feel like ambient lighting rather than colorful blobs.

## Typography

Large editorial headlines.

Minimal supporting text.

Generous whitespace.

Excellent readability.

Typography should become the primary design element.

## Landing Page Structure

1. Floating Navigation

Minimal transparent glass navigation.

Logo

Platform

How It Works

Reports

For Teams

Pricing

Primary CTA:
Start Mock Interview

----------------------------------------------------

2. Hero

Large editorial headline:

Technical Interviews,
That Actually Think.

Supporting copy explaining that MockMate understands your reasoning, adapts naturally, and evaluates how you solve problems rather than how well you memorize answers.

Primary CTA:
Start Interview

Secondary CTA:
Watch Demo

On the right, create a premium floating conversation interface where an interview unfolds naturally.

The interviewer asks thoughtful questions.

The candidate responds.

The interviewer pauses.

A subtle thinking state appears.

An adaptive follow-up question is generated.

Avoid code editors, terminal windows, dashboards and AI avatars.

The conversation itself should become the visual centerpiece.

----------------------------------------------------

3. Why MockMate Feels Different

Create a clean comparison between traditional mock interviews and MockMate.

Traditional:

Static questions

Memorized answers

One-size-fits-all

Keyword-based evaluation

MockMate:

Natural conversation

Adaptive questioning

Context awareness

Reasoning-first evaluation

Meaningful feedback

----------------------------------------------------

4. How MockMate Thinks

Represent the interview process visually using elegant flowing glass components.

Ask

Listen

Understand

Reason

Adapt

Evaluate

Avoid generic feature cards.

Focus on storytelling.

----------------------------------------------------

5. Experience The Interview

Show a beautiful conversation experience.

Streaming messages.

Typing indicators.

Thinking state.

Adaptive follow-up.

Context memory.

Elegant animations.

Everything should feel alive.

----------------------------------------------------

6. Actionable Report

Show a premium interview report.

Conversation timeline.

Strengths.

Areas for improvement.

Communication insights.

Technical reasoning.

Personalized learning recommendations.

Avoid score-heavy dashboards.

Design it like a premium design review.

----------------------------------------------------

7. Who It's Built For

Students

Software Engineers

Job Seekers

Hiring Teams

Universities

Placement Programs

Minimal elegant cards.

----------------------------------------------------

8. Final CTA

Large cinematic glass panel.

Generous whitespace.

Headline:

Ready For Interviews
That Actually Think?

Primary CTA:

Start Your Mock Interview

## Motion

Elegant and restrained.

Glass reflections.

Soft floating movement.

Streaming conversations.

Gentle transitions.

No flashy animations.

## Overall Goal

The landing page should feel like a premium product launch rather than a SaaS marketing page.

Visitors should instantly understand that MockMate delivers realistic technical interview conversations that adapt naturally, challenge thinking, and provide meaningful feedback.

The final design should feel timeless, luxurious, memorable, and cohesive, with exceptional typography, beautiful glassmorphism, and a calm, premium visual identity.
````

### 26

````
need to create this kind of design but as per our details and requirements(reference)
````

### 27

````
Redesign this landing page with the philosophy of Apple, Stripe and Linear.

The current design feels like an AI-generated SaaS template.

Remove approximately 50% of the visible UI.

Remove approximately 70% of the written copy.

Every section should communicate only ONE idea.

Do not explain features.

Instead tell a visual story.

Use typography as the primary design element.

Use whitespace aggressively.

Avoid repeated card layouts.

Avoid repeating "heading + paragraph + card."

Alternate between:

• Huge typography
• Full-width product showcase
• One elegant comparison
• Minimal quote
• Large report preview

The page should have rhythm.

Every scroll should feel different.

The product should feel luxurious, calm and handcrafted.

Replace feature lists with product moments.

Replace generic marketing copy with memorable statements.

Examples of tone:

"The interview doesn't stop listening."

"Every answer changes what comes next."

"Not another question bank."

"Think out loud."

"Practice like it's real."

"Know what to improve."

The visual hierarchy should resemble Apple product pages rather than SaaS websites.

The page should feel like a premium product launch, not a marketing website.

Prioritize elegance, storytelling, whitespace, restraint, and emotional impact over quantity of information.


Apart from this , we need to plan this well. Premium looking , glassmorphic design, light color shadows at the corner, etc which feels crazy looking, superb designed
````

### 28

````
MockMate should feel like the world's most premium interview room.

Every interaction should reduce noise rather than add it.

Every section should communicate one idea.

Every animation should reinforce intelligence.

Every sentence should be memorable enough to stand alone.

The website should feel like a product launch, not a SaaS landing page.

Visitors should finish the page remembering how MockMate made them feel, not how many features it listed.
````

### 29

````
We need to now plan to add animations in landing page, a beautiful loader, better and more professional texts, consistent design
````

### 30

````
Implementation Plan - MockMate Premium Product Experience

Transform MockMate from a polished SaaS landing page into a premium product launch experience. Every interaction, animation, and piece of copy should reinforce intelligence, craftsmanship, and calm confidence rather than visual complexity.

User Review Required

[!IMPORTANT]
Core Design Objectives

Remove Visual Noise
Reduce visible UI elements by approximately 40–50%.
Merge related components instead of creating multiple cards.
Every section should communicate exactly one idea.
Motion With Purpose
Every animation must reinforce the interview experience.
Avoid decorative animations, excessive glows, floating particles, and unnecessary hover effects.
Motion should feel calm, premium, and almost invisible.
Product-Led Storytelling
Replace feature explanations with product demonstrations.
Let users experience MockMate through interaction instead of reading about it.
Design System Consistency
Use one unified visual language throughout the page.
Maintain consistent spacing, corner radius, glass materials, lighting direction, typography, and motion timing.
Proposed Changes
Global Design System
[MODIFY] globals.css
Create a unified motion system instead of multiple unrelated animations.
Standardize animation timing using three durations:
Fast (150ms)
Medium (300ms)
Slow (600ms)
Standardize glass material:
backdrop blur
subtle inner border
soft edge highlight
consistent shadow
Strengthen typography scale and whitespace.
Reduce glow intensity throughout the website.
Motion Philosophy

Instead of adding many animations, define only three animation systems.

1. Conversation Motion

Used only inside the interview showcase.

Typing indicator
Streaming responses
Thinking state
Follow-up question reveal
2. Material Motion

Used for premium glass.

Soft reflections
Subtle depth shifts
Mouse-responsive lighting
Gentle elevation
3. Scroll Motion

Used only when sections enter the viewport.

Fade
Slight translateY
Opacity transition

Avoid bounce animations.

Avoid large parallax.

Avoid decorative floating.

Preloader
[NEW] Preloader.tsx

Replace the traditional loading screen with a short product introduction.

Duration:

Maximum 1 second.

Instead of:

Initializing Cognitive Engine...

Use the product itself.

Example sequence:

Interviewer

Let's begin.

...

Thinking...

Question generated.

The loading experience should immediately introduce the interview instead of showing system initialization.

Hero
[MODIFY] Hero.tsx

Reduce copy significantly.

Replace descriptive marketing language with memorable statements.

Possible headline:

Practice Against Intelligence.

Supporting text:

MockMate doesn't ask better questions.

It asks better follow-up questions.

Only one primary CTA.

Remove unnecessary supporting UI.

Product Showcase
[MODIFY] ProductShowcase.tsx

This becomes the centerpiece of the website.

The conversation should tell the story.

Sequence:

Question

↓

Candidate answers

↓

Thinking...

↓

Adaptive follow-up

↓

Conversation continues

Avoid dashboards.

Avoid unnecessary metrics.

Avoid fake analytics.

Why Different
[MODIFY] WhyDifferent.tsx

Replace multiple feature cards with one premium comparison.

Traditional Mock Interview

↓

Same questions

↓

Same ending

versus

MockMate

↓

Conversation

↓

Reasoning

↓

Adaptive follow-ups

Minimal copy.

Maximum visual clarity.

Philosophy Section
[MODIFY] PhilosophyQuote.tsx

Large editorial statement.

Example:

Every answer changes what comes next.

This section should contain almost no other content.

Whitespace should become part of the design.

Product Moments
[MODIFY] ProductMoments.tsx

Avoid generic AI terminology.

Replace:

Listen
Reason
Adapt

with more human product moments.

Examples:

Keeps Context

Challenges Assumptions

Knows When To Push

Use storytelling instead of feature explanations.

Report Showcase
[MODIFY] ActionableReport.tsx

Treat the report like a premium design review.

Reduce visual complexity.

One elegant report.

One timeline.

One recommendation panel.

One strengths panel.

Avoid dashboard aesthetics.

CTA
[MODIFY] FinalCTA.tsx

Minimal.

Large typography.

One sentence.

One button.

Suggested copy:

Your next interview shouldn't be your first real one.

Primary CTA:

Start Practicing

Copy Refinement

Every sentence should satisfy one rule:

If it sounds like SaaS marketing, rewrite it.

Replace phrases like:

"AI-powered adaptive interview platform"

with memorable product language such as:

"Questions evolve."

"Think out loud."

"Keeps listening."

"Never loses the thread."

"Knows what to ask next."

"Leave knowing what to improve."

Verification Plan
Visual Review
Verify every section communicates exactly one idea.
Ensure typography leads the experience.
Ensure whitespace creates rhythm.
Remove any decorative component that does not strengthen the story.
Motion Review
Verify every animation has a functional purpose.
Remove animations that exist only for decoration.
Confirm prefers-reduced-motion provides a fully accessible experience.
Final Experience Review

After scrolling from top to bottom, the visitor should remember:

MockMate conducts interviews differently.
The conversation adapts naturally.
The report provides meaningful feedback.
The product feels premium and trustworthy.

The success metric is not how many features the user remembers—it is whether they finish the page wanting to start an interview.
````

### 31

````
we need to add crazy animations to the landing page elements , add glassmorphic shades of color at corners or wherever feels premium. Lets create a detailed plan for this
````

### 32

`````
# How to use this

Paste everything below the divider into Antigravity as one task, pointed at your existing MockMate repo. It's written as a single agentic brief: design tokens → tech setup → section rebuilds → motion spec → verification. Antigravity's agent can plan, execute, and self-verify against the checklist at the end using its live browser.

---

## Context

MockMate is an adaptive AI mock-interview platform. The current landing page (dark theme, teal accent, italic serif headline "Practice Against Intelligence.") is functionally fine but visually generic — flat single-hue glow, default font pairing, static cards, no signature moment. Redesign it into a premium, glassmorphic marketing site that feels like a real product from a well-funded engineering-tools company (think Linear, Vercel, Raycast) — not a templated AI-generated theme.

Keep the existing copy, section order, and content structure. This is a visual and motion rebuild, not a content rewrite.

## Non-negotiables

- Keep teal/emerald as the primary brand accent — do not replace it, extend it.
- Keep dark theme as the base.
- Keep all existing sections in order: Nav → Hero → Live interview demo → Contrast (Static vs Adaptive) → Quote → "How intelligence behaves" (3 cards) → Dossier → Final CTA → Footer.
- Every animation must respect `prefers-reduced-motion` with a graceful static fallback.

## Design tokens

### Color

```css
:root {
  /* base */
  --bg-void: #05070D;         /* page background */
  --bg-elevated: #0B111F;     /* section alternation */

  /* glass */
  --glass-fill: rgba(148, 178, 200, 0.06);
  --glass-fill-hover: rgba(148, 178, 200, 0.10);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-border-hover: rgba(255, 255, 255, 0.16);

  /* accents */
  --accent-teal: #2FE6C0;     /* primary brand signal, keep */
  --accent-violet: #7C6EF2;   /* secondary — aurora depth, hover glows */
  --accent-gold: #F0C879;     /* tertiary — quote/emphasis only, use sparingly */
  --accent-rose: #F2637A;     /* "static/bad option" contrast tint */

  /* text */
  --text-primary: #F3F6FA;
  --text-muted: #8C97AC;
}
```

### Type

- **Display / headlines / italic emphasis:** `Fraunces` (variable, optical sizing on, weights 300–600, italic axis). Load via `next/font/google`.
- **Body / UI / nav / buttons:** `Geist Sans` (fallback: Inter).
- **Eyebrows, badges, timestamps, transcript UI, mono stats:** `Geist Mono` (fallback: JetBrains Mono). This ties directly to the "engineering interview" subject matter.

### Signature element

The hero's live interview demo becomes a floating **glass terminal**: cursor-reactive light refraction on the panel border, a slow-drifting aurora-gradient mesh (teal + violet + gold blobs) behind it, and a real "thinking" animation on the "Analyzing trade-offs..." status line. This is the one place to spend the visual budget — keep every other panel quieter by comparison.

## Tech stack to use

- Next.js (App Router) + TypeScript + Tailwind CSS
- shadcn/ui: Button, Badge, Card, Tabs, Separator, Tooltip, HoverCard, ScrollArea, Dialog, NavigationMenu
- `motion` (Framer Motion's current package) for `whileInView`, stagger, `useScroll`/`useTransform`, `layoutId` shared transitions
- `lenis` for smooth scroll, wired through Motion's scroll utilities, initialized in the root layout
- `next/font` for all three typefaces (avoid FOUT/layout shift)

## Global systems to build first

1. **`<AuroraBackground />`** — fixed, full-bleed, blurred gradient blobs in teal/violet/gold, drifting via CSS `@keyframes` on 60–90s loops, low opacity so content stays legible. Denser behind the hero, subtler elsewhere. Freeze animation under `prefers-reduced-motion`.
2. **`.glass` utility** (Tailwind plugin or `@layer utilities`): `background: var(--glass-fill); backdrop-filter: blur(20px) saturate(140%); border: 1px solid var(--glass-border); border-radius: 1.25rem;` plus a soft outer glow shadow in the panel's accent color at low opacity.
3. **Grain overlay** — a subtle SVG turbulence noise layer at ~3% opacity, `mix-blend-mode: overlay`, fixed across the whole page. This is what keeps the gradients from reading as flat AI-slop.
4. **Cursor-reactive glass sheen** — on desktop/pointer devices, glass panels track pointer position via a CSS custom property (`--mx`, `--my`) updated on `pointermove`, driving a radial-gradient highlight that follows the cursor across the panel surface.
5. **Lenis smooth scroll** at root layout; skip entirely (native scroll) when `prefers-reduced-motion: reduce`.

## Section-by-section rebuild

**Nav** — transparent over the hero, becomes a glass panel with blur after ~40px scroll. Nav links get an animated underline-glow on hover. CTA button is magnetic (shifts slightly toward the cursor within a bounded radius) with a pulsing glow ring on hover; disable the magnetic effect on touch devices.

**Hero** — Eyebrow badge as a glass pill with a soft pulsing live-dot. Headline reveals line-by-line on load: blur-to-focus + translateY, ~60ms stagger per line. The italic word "Intelligence." gets a slow shimmer/gradient-sweep (teal → violet) instead of flat color, since it's the page's thesis word. Subtext fades in after the headline; CTA appears last, magnetic + glow.

**Live demo panel (signature element)** — Rebuild as the floating glass terminal described above. Convert the System/Distributed/Async switcher to real shadcn `Tabs` with an animated pill indicator sliding between tabs (`layoutId` shared transition). Chat bubbles stagger-fade-in via `whileInView`. The "Analyzing trade-offs..." line gets a real typing/shimmer animation, not static text. Give the panel a subtle scroll-linked tilt (`useScroll` + `useTransform` on `rotateX`) that settles flat as it centers in viewport. "Next Sequence" button: hover glow + `active:scale-95` press feedback.

**Contrast section (Static vs Adaptive)** — Use shadcn `Card`. On hover, the Adaptive card lifts (`translateY(-6px)`), border glows teal, scales to 1.02, shadow deepens. Keep the Static card visually flatter/muted on hover (or non-reactive) — let the motion itself encode which option is better, not just the copy.

**Quote section** — Words fade up on scroll; trail a soft gold glow behind the final word ("what comes next.") to justify the tertiary accent color.

**"How intelligence behaves" cards** — Bento-style glass cards, numerals/icons in mono font. On hover, a thin glowing top border draws left-to-right like a trace/progress line. Stagger the scroll-in across the three cards.

**Dossier section** — Style as a real evaluation document. Use shadcn `Tabs` or `Accordion` for timeline / strengths / refinement / reading sections, mono font for timestamps and durations. "View Full Sample Dossier" opens a shadcn `Dialog` (glass modal, not a new page) with an expanded mock report; background blurs further while open.

**Final CTA** — Aurora glow intensifies here. Headline gets the same shimmer treatment as the hero's emphasis word. This button gets the strongest magnetic + glow treatment on the page — it's the last conversion moment.

**Footer** — Keep it minimal as-is; add underline-grow on link hover and a glass hairline divider. Keep the existing monospace meta line — it's a nice detail already.

## Motion & interaction spec (summary)

- **Load sequence:** nav → eyebrow → headline (staggered lines) → subtext → CTA → hero panel.
- **Scroll reveals:** `whileInView` with `staggerChildren` on every card group, threshold ~0.2, `once: true`.
- **Hover:** cards lift + glow; buttons are magnetic + glow + press-scale; links underline-grow.
- **Scroll-linked:** hero panel tilt/parallax, nav blur-on-scroll, aurora blobs drift independently of scroll position.
- **Text:** word/line-stagger reveal on headlines; shimmer sweep on emphasis words only (don't overuse); real typing indicator in the demo panel.
- **Reduced motion:** all of the above degrade to simple opacity fades — no parallax, no tilt, no blob drift, no magnetic buttons.

## Responsive & accessibility requirements

- Reduce blur intensity on mobile/low-end devices for performance — test on a throttled mobile viewport.
- Maintain WCAG AA text contrast over glass panels, checked against the busiest part of the aurora background, not just the calmest.
- Visible keyboard focus rings (accent color) on every interactive element.
- Tap targets ≥44px on mobile; disable magnetic/cursor-sheen effects on touch devices entirely rather than faking them.

## Verification checklist (run before calling this done)

- [ ] Screenshot every section at desktop (1440px), tablet (768px), and mobile (390px)
- [ ] Toggle `prefers-reduced-motion` and confirm every animation has a static, non-jarring fallback
- [ ] Confirm smooth scroll and anchor nav links work end to end
- [ ] Confirm hover states on nav links, all buttons, cards, and tabs
- [ ] Confirm the Dossier dialog opens, traps focus, and closes cleanly
- [ ] Confirm no layout shift from font loading (fonts should be loaded via `next/font`)
- [ ] Confirm blur/backdrop-filter performance is acceptable on a throttled mobile profile
`````

### 33

````
Context

MockMate is an adaptive AI mock-interview platform. Redesign its marketing landing page into something that feels like a category-defining product launch (Linear, Arc, Stripe, Nothing) — not an AI-startup template. Keep the existing copy tone and section order; this is a visual/motion system rebuild.

Brand personality (hold this while building)

Confident, quiet, technical, sophisticated, human. Never playful, never futuristic-for-its-own-sake, never loud. The design should demonstrate MockMate's core idea — that it's genuinely adapting to the person, not running a script — through restraint and precision, not visual noise.

Explicitly excluded
No candidate personalization on the landing page (no named profiles, no candidate-select UI). The hero demo panel keeps one anonymous illustrative exchange.
No AI-cliché imagery: no robot avatars, no brain icons, no circuit-board textures, no neural-network graphics, no chatbot-face bubbles, no device frames around the report.
No warm cream background and no terracotta/clay accent. That combination is as much a default AI-generated look right now as dark-navy-glass is — avoid it explicitly while going light.
No preloader. Page is interactive immediately.
No analytics-dashboard aesthetic in the hero — one or two elegant live readouts inside the demo panel, not a stats panel.
Design constraints
Maximum 6 primary sections (Nav/Footer excluded from this count).
One visual focal point per section.
Never more than 3 visual elements competing for attention at once.
No side-by-side glass cards unless they're one continuous story.
One primary CTA visible per screen.
Design tokens — "Glass & Ink" (light)
css
:root {
  /* base — cool, not cream */
  --bg-base: #F6F8F7;
  --bg-elevated: #FFFFFF;

  /* ink (text) — near-black with a faint green cast, not pure grey */
  --ink-primary: #0E1913;
  --ink-muted: #5C6B64;

  /* glass — depth via shadow, not glow */
  --glass-fill: rgba(255, 255, 255, 0.60);
  --glass-fill-hover: rgba(255, 255, 255, 0.78);
  --glass-border: rgba(14, 25, 19, 0.08);
  --glass-border-hover: rgba(14, 25, 19, 0.14);
  --glass-shadow: rgba(14, 25, 19, 0.10);

  /* accents */
  --accent-emerald: #0E9E76;       /* primary — deep enough to hold contrast on white */
  --accent-emerald-soft: #BFEDDD;  /* pale wash, backgrounds only */
  --accent-ice: #3E8FBF;           /* secondary, deepened for light-bg legibility */
  --accent-champagne: #B98A2E;     /* tertiary, quote/emphasis only */
  --accent-rose: #D2495E;          /* "static/bad option" contrast tint only */
}

Why the accent values are deeper than a dark-theme version would use: on a light background, pale mint/aqua (the kind that glows nicely on navy) loses almost all contrast. Every accent here needs to hold its own as ink-level contrast against white, not as a glow.

Glass, reworked for light: on dark backgrounds glass reads as glass because of the glow behind it. On light backgrounds there's no glow to lean on, so the panel has to do more work itself — higher fill opacity (55–75%, not the 6–10% you'd use on dark), a visible hairline border, and a soft ambient drop shadow for depth instead of a colored glow. Add a subtle 1px inner highlight along the top edge of each panel (a faint white inset) to read as light catching a glass edge.

Background washes, not glowing blobs: replace the earlier "aurora glow in corners" with large, heavily-blurred, low-opacity (8–14%) radial washes in --accent-emerald-soft and a pale version of --accent-ice, placed asymmetrically in section corners. Think diffuse morning light through glass, not a neon gradient blob. Never let a wash get saturated enough to read as a "hero gradient background."

Type
Display / headlines: Fraunces, ink-primary color, italic axis for emphasis words.
Body / UI: Geist Sans (fallback Inter), ink-muted for secondary text.
Labels, timestamps, transcript UI: Geist Mono.

Optional direction worth considering: the light, ink-on-paper feel actually pairs more naturally with an "annotated manuscript" register (thin rule lines, margin-style callouts for the reasoning/telemetry readout) than the instrument-panel metaphor did on dark. Not required, but if Antigravity's first pass has room for one more considered detail, that's where to spend it.

Tech stack
Next.js (App Router) + TypeScript + Tailwind CSS
shadcn/ui: Button, Badge, Card, Tabs, Separator, Tooltip, Dialog
motion for scroll reveals and the conversation-streaming sequence
lenis for smooth scroll, respecting prefers-reduced-motion
next/font for all typefaces
Motion system — exactly three

1. Conversation motion (hero demo panel only): typing indicator, streaming question text, a real ~600ms thinking pause between acknowledgment and question, follow-up fading in.

2. Material motion (glass panels): on hover, shadow deepens slightly, panel lifts 4–6px, border darkens toward --glass-border-hover. No tilt, no magnetic buttons, no shimmer text.

3. Scroll motion: fade + slight translateY on entry via whileInView, staggered for card groups, threshold ~0.2, once true.

Under prefers-reduced-motion: conversation motion keeps working (it's content), material motion drops to a plain border-color change, scroll motion becomes a plain opacity fade.

Section-by-section

Nav — transparent over hero, becomes a glass bar on scroll (fill + shadow appear, no color shift).

Hero — Eyebrow, headline, one line of subtext, one CTA. The demo panel carries all the visual weight — no stat chips, no badges. Conversation begins automatically ~500ms after load.

Live demo panel (signature element) — Real shadcn Tabs with a sliding indicator in --accent-emerald. "Analyzing trade-offs..." is a real typing/thinking state. Keep any live readout to one clean line, not a stats panel.

Contrast section — One clean two-column comparison. Adaptive side gets the material-motion hover; Static side stays flatter — use --accent-rose sparingly here, only as a small marker, not a fill color.

Quote section — Large editorial statement in --accent-champagne for the emphasis phrase only, otherwise near-empty.

"How intelligence behaves" cards — Three cards, plain-language titles, simple scroll-in stagger.

Dossier/Report section — One large report preview, edge-to-edge, minimal color, one or two circular gauges at most. "View Full Sample Dossier" opens a shadcn Dialog.

Final CTA — Near-empty, one sentence, one button, a soft --accent-emerald-soft wash behind it — calmest section on the page.

Footer — Minimal, unchanged.

Copy check

Every line should pass: if it sounds like SaaS marketing, rewrite it.

Verification checklist
 Count primary sections — confirm ≤6
 Confirm no section has more than one clear visual focal point
 Confirm no candidate names/profiles or comparison UI anywhere
 Confirm no AI-cliché imagery, and no cream+terracotta creep
 Check WCAG AA contrast for ink text over every glass panel, including where panels sit on top of the color washes — this is the main failure risk in a light glass theme
 Confirm glass panels are visually distinct from the base background at rest, not just on hover
 Screenshot at 1440px, 768px, 390px
 Toggle prefers-reduced-motion
 Confirm hero conversation starts automatically, no preloader
 Confirm Dossier dialog opens, traps focus, closes cleanly
````

### 34

````
MockMate Landing Page — Premium Interactive Recreation

Use the attached reference image as the primary visual and layout reference for the MockMate landing page.

Recreate the overall visual direction, spacing, hierarchy, typography, colors, composition, and premium feel — but implement it as a real production-quality interactive website, not a static mockup.

Core philosophy

The landing page should communicate one idea:

MockMate is an adaptive technical interviewer, not a question bank.

The design must feel:

premium
minimal
sophisticated
technical
calm
intentional
highly polished

Avoid the typical "AI SaaS" aesthetic.

Absolutely avoid
excessive gradients
excessive glowing effects
floating random cards
unnecessary glassmorphism
excessive animations
huge amounts of text
generic AI brain graphics
robot/AI imagery
stock illustrations
excessive rounded cards
visual clutter
fake statistics
fake testimonials
unnecessary feature grids

Whitespace is a feature.

Tech Stack

Use:

Next.js
React
TypeScript
Tailwind CSS
shadcn/ui where appropriate
Three.js
React Three Fiber
Drei
GSAP or Framer Motion for UI animations

Use Three.js only where it adds meaningful visual storytelling.

Do not use Three.js for ordinary UI elements.

Overall Page Structure

Keep the landing page concise.

Use approximately:

Navbar
Hero
How It Works
Interactive Interview Preview
Assessment / Readiness
Final CTA
Footer

Do not add unnecessary sections.

1. NAVBAR

Recreate the reference's minimal navigation.

Left:

MockMate logo

Center:

How it works
Why it's different
Sample report
For teams

Right:

Start Interview

Keep the navbar extremely clean.

Use a transparent/dark background that blends into the hero.

Add subtle backdrop blur only when scrolling.

Navbar animation

On page load:

logo fades/slides in
navigation items stagger in
CTA appears last

On scroll:

navbar becomes slightly more opaque
subtle backdrop blur
smooth transition

No exaggerated animations.

2. HERO — MOST IMPORTANT SECTION

Use a two-column layout.

Left side

Small eyebrow:

ADAPTIVE AI INTERVIEWS

Large editorial headline:

An interviewer
that thinks.

Make "thinks." the accent/italic treatment similar to the reference.

Supporting copy:

MockMate adapts to your answers, asks smarter follow-ups, and helps you improve where it matters most.

Primary CTA:

Start your interview →

Secondary CTA:

See how it works

Keep typography large and elegant.

Use a sophisticated serif display font paired with a clean modern sans-serif.

Do not overuse the serif font.

3. HERO THREE.JS EXPERIENCE

This should NOT simply be a static 3D logo.

Create an actual interactive Three.js scene inspired by the reference.

Central object

Create a minimal 3D MockMate "M" object:

dark translucent/ceramic material
subtle teal emission
soft lighting
rounded geometry
floating slightly above a platform

Around it create several very subtle orbital paths.

Nodes represent:

Retrieval
RAG
Prompting
Agents
MCP
Production

However, the nodes should not feel like a generic AI diagram.

They should feel like a sophisticated technical visualization.

Animation

The central object:

slowly floats
subtly rotates
reacts to cursor movement

Orbital nodes:

slowly move along their paths
have subtle depth/parallax
occasionally emit a soft pulse

Connections:

animate very slowly
use extremely subtle opacity changes
Mouse interaction

When the cursor moves:

camera subtly follows cursor
central object shifts slightly
orbital system responds with subtle parallax

When hovering a node:

node becomes slightly brighter
camera subtly focuses toward it
label becomes more prominent
connected path becomes visible
other nodes slightly fade

Do NOT create aggressive zooming.

4. Hero entrance animation

The entire hero should animate in sequentially.

Order:

navbar
eyebrow
headline
description
CTA
3D scene
orbital nodes

Use smooth spring/ease-out motion.

Everything should settle quickly.

The page should never make the user wait for animations.

5. HOW IT WORKS

Transition from the dark hero into a much lighter section.

Use a soft off-white / very light cool-gray background.

Heading:

Every answer changes what comes next.

Then create a horizontal four-step flow:

01

You answer

Share your thinking in your own words.

02

AI evaluates

Understands context and depth.

03

It adapts

Chooses the best follow-up.

04

You improve

Get clearer insights and build confidence.

Do NOT make these four generic SaaS cards.

Use a connected visual timeline.

Animation

As the user scrolls into the section:

each node appears sequentially
connecting line draws itself
icons fade/scale in
text appears afterward

Use GSAP/Framer Motion.

6. INTERACTIVE INTERVIEW PREVIEW

This is extremely important.

Create a large premium interview interface.

It should look like a real product, not a marketing screenshot.

Example conversation:

Interviewer

Suppose the correct document exists in your knowledge base but isn't being retrieved. How would you debug this?

Candidate

I'd first verify the embedding model and check whether the query is being embedded correctly...

Then the interviewer responds:

Good start. What else would you investigate before changing the embedding model?

This demonstrates the core product:

Answer → understanding → follow-up

7. Make the interview preview genuinely interactive

Do not make it a static image.

Implement a small simulated conversation.

When the section enters the viewport:

interviewer question appears
typing indicator appears
candidate answer appears
brief thinking indicator
follow-up appears
subtle connection/highlight indicates that the follow-up came from the previous answer

The sequence should run once.

Allow the user to replay it.

Button:

Replay interview

Keep it subtle.

8. Add a subtle adaptive visualization

Beside or behind the interview preview, create a minimal Three.js/Canvas visualization.

Represent:

Candidate Answer
       ↓
    Evaluate
       ↓
   Understand
       ↓
    Adapt
       ↓
 Follow-up

As the conversation progresses, the active node moves through the graph.

This is the second meaningful Three.js visual.

It should be extremely subtle.

Do not turn the page into a technical diagram.

9. READINESS / ASSESSMENT SECTION

Use a lighter background.

Headline:

A clear map of your readiness.

Supporting copy:

Detailed, evidence-backed feedback across the skills that matter.

Create one beautiful assessment card.

Example:

Overall Readiness

82 / 100

Strong

Skill Breakdown

Retrieval       ━━━━━━━━━ 88
RAG             ━━━━━━━━  84
Agents          ━━━━━━━━━ 92
MCP             ━━━━━━    71
Security        ━━━━━     64
Production      ━━━━━━━━  81

On the right:

Top strengths

Retrieval
Agents
RAG

Areas to improve

MCP
Security

Do not make this overly colorful.

Use one primary teal accent and one restrained warning accent.

10. Assessment animation

When the assessment enters the viewport:

card fades upward
readiness number counts from 0 → 82
progress bar fills smoothly
skill bars animate sequentially
strength tags fade in
improvement tags follow

Keep the animation under approximately 1.5 seconds.

11. FINAL CTA

Use a dark full-width CTA card.

Headline:

Your next interview shouldn't be your first real one.

CTA:

Start your interview →

Use a very subtle Three.js/WebGL background:

dark horizon
extremely subtle light
slow movement

No giant 3D object.

12. FOOTER

Extremely minimal.

Left:

MockMate

Center:

Privacy
Terms
Contact

Right:

© 2026 MockMate

Do not add unnecessary footer columns.

Visual System
Colors

Primary background:

Deep near-black.

Use:

charcoal
deep navy
muted teal
extremely subtle purple
extremely subtle warm accent

The teal should be the primary brand accent.

Do not use rainbow gradients.

Typography

Use a premium serif for major headlines.

Recommended:

Instrument Serif
Cormorant Garamond
Playfair Display

Pair with:

Inter
Geist
Manrope

Prefer Instrument Serif + Geist/Inter if available.

Typography should be one of the strongest visual elements.

Animation philosophy

The website should feel alive, but never busy.

Use:

scroll reveals
staggered entrances
subtle parallax
cursor interaction
Three.js floating motion
path drawing
number counters
progress animations
subtle hover states

Avoid:

constant particle effects
excessive floating objects
aggressive zooms
infinite text animations
bouncing elements
flashy transitions
animation everywhere
Rule:

If an animation doesn't communicate something, remove it.

Three.js architecture

Keep the 3D components isolated.

Create:

/components/three/
    MockMateOrbital.tsx
    AdaptiveInterviewGraph.tsx
    CTAHorizon.tsx

The main page should not contain Three.js implementation details.

Use:

React Three Fiber
Drei
optimized geometry
instancing where appropriate
lazy loading
Suspense
reduced-motion fallback

The website must remain fast even without WebGL.

Responsive behavior

Desktop:

full Three.js experience
two-column hero

Tablet:

reduce 3D complexity
reduce node count

Mobile:

stack hero
keep a simplified 3D centerpiece
remove unnecessary orbital labels
preserve the core visual
maintain strong typography and whitespace

Never allow Three.js to compromise usability.

Interaction quality

Everything should feel deliberate.

Buttons:

subtle hover lift
slight brightness change
arrow movement

Cards:

subtle border transitions
minimal shadow

Links:

smooth underline/opacity transitions

Scroll:

smooth but not artificially slow
Important implementation constraint

Do not copy the screenshot pixel-for-pixel.

Use it as the design reference for:

composition
spacing
typography hierarchy
color palette
section structure
visual density
overall aesthetic

But make the implementation feel like a real MockMate product, especially through the interactive interview experience and meaningful Three.js animations.

The result should feel like:

A premium technical product website — not an AI landing-page template.

Most importantly:

Prioritize whitespace, hierarchy, typography, and product storytelling over adding more visual elements.
````

### 35

````
# MockMate — Premium Landing Page Implementation

Use the attached reference image as the PRIMARY visual reference.

Rebuild the MockMate landing page as a production-quality React/Next.js experience.

Do NOT treat the image as a static screenshot to copy pixel-for-pixel.
Recreate its visual language, composition, hierarchy, spacing, typography, lighting,
and storytelling while making every important element a real interactive component.

The final result should feel like a premium product from a serious design studio.

==================================================
CORE PRODUCT
==================================================

MockMate is an adaptive technical interviewer.

Core positioning:

"An interviewer that thinks."

MockMate conducts conversational technical interviews, evaluates candidate responses,
asks contextual follow-ups, maintains conversation context, adapts its questioning,
and produces evidence-backed feedback.

The landing page should make one thing immediately obvious:

THIS IS NOT A QUESTION BANK.
THIS IS AN ADAPTIVE INTERVIEWER.

==================================================
DESIGN DIRECTION
==================================================

Follow the attached reference closely.

The visual language should be:

- cinematic
- premium
- editorial
- minimal
- sophisticated
- technical
- calm
- slightly futuristic
- highly polished

Use a carefully balanced dark/light composition.

IMPORTANT:

Do NOT make the entire website dark.

Do NOT make the entire website white.

The intended visual rhythm is:

DARK CINEMATIC HERO
        ↓
WARM LIGHT INFORMATION SECTION
        ↓
LIGHT / DARK PRODUCT DEMO
        ↓
WARM LIGHT ASSESSMENT
        ↓
DARK PREMIUM CTA
        ↓
MINIMAL FOOTER

The transition between sections should feel intentional and cohesive.

==================================================
COLOR SYSTEM
==================================================

Primary dark:

#0A0D10

Dark surface:

#12171B

Deep glass:

rgba(255,255,255,0.055)

Warm light background:

#F5F3EE

Secondary light:

#ECEAE4

Primary text on dark:

#F7F4EE

Primary text on light:

#15181B

Muted dark text:

#A6AAA9

Muted light text:

#686D6D

Primary accent:

Soft mint / teal

#48D8BE

Secondary accent:

Warm champagne / ivory

#E6CDA8

Very subtle violet/blue can be used ONLY for depth
inside Three.js visualizations.

Do not use rainbow gradients.

Do not make the page neon.

The champagne/ivory accent should be used sparingly.

==================================================
TYPOGRAPHY
==================================================

Use a premium editorial serif for major headlines.

Preferred:

Instrument Serif

Fallback:

Cormorant Garamond

Pair it with:

Geist / Inter / Manrope

Rules:

- Serif = major editorial statements
- Sans = UI, navigation, body copy
- Small uppercase labels = section metadata
- Do not overuse italics
- Italic serif should be used as an accent

Hero typography should be large and confident.

==================================================
PAGE STRUCTURE
==================================================

Create exactly these sections:

1. Navbar
2. Hero
3. Adaptive Flow
4. Interactive Interview Demo
5. Readiness Report
6. Final CTA
7. Footer

Do not add generic feature grids.

Do not add testimonials.

Do not invent social proof.

Do not add fake user counts.

Do not add unnecessary sections.

==================================================
1. NAVBAR
==================================================

Dark transparent navbar over the hero.

Left:

MockMate logo + wordmark

Center navigation:

How it works
Why it's different
Sample report
For teams

Right:

Start Interview →

Style:

- minimal
- small
- premium
- generous spacing

Navbar should initially blend into the hero.

On scroll:

- subtle glass background
- backdrop blur
- slightly stronger border
- smooth transition

No heavy navbar container.

==================================================
2. HERO
==================================================

Hero should closely follow the reference composition.

Desktop:

Two-column layout.

LEFT:
large typography and CTA.

RIGHT:
large Three.js visualization.

Eyebrow:

ADAPTIVE AI INTERVIEWER

Headline:

An interviewer
that thinks.

Use serif typography.

"thinks." should use a subtle champagne/ivory or mint accent.

Supporting copy:

MockMate listens, understands, and adapts
in real time — so you focus on what matters.

Primary CTA:

Start an interview →

Secondary CTA:

See how it works

Keep the copy concise.

Do not add ratings or fake learner statistics.

==================================================
3. HERO THREE.JS EXPERIENCE
==================================================

THIS IS THE MOST IMPORTANT VISUAL COMPONENT.

Do not create a generic AI orb.

Do not use a random floating cube.

Do not create a giant glowing brain.

Create a sophisticated physical 3D "interview intelligence" object.

Central object:

A floating rounded-square MockMate "M".

Material:

- dark smoked glass
- subtle metallic edges
- soft translucent highlights
- champagne rim lighting
- tiny mint reflections

It should feel like a premium physical object.

Place it above a dark circular platform.

The platform should have:

- subtle reflections
- thin concentric rings
- soft shadow
- restrained light

==================================================
ADAPTIVE ORBIT SYSTEM
==================================================

Around the central M create several thin orbital paths.

Nodes should represent the interview process:

Your Answer
Understand
Evaluate
Adapt
Follow-up
Go Deeper

Do NOT use:

RAG
MCP
Agents
Prompting
Production

Those are technical curriculum concepts and should not be the hero's visual metaphor.

The hero is about ADAPTATION.

Each node should be a small glass/metal sphere with subtle internal light.

Colors:

Mostly ivory/champagne/soft white.

Mint can highlight the active state.

Avoid rainbow colors.

==================================================
THREE.JS ANIMATION
==================================================

The 3D scene must actually be interactive.

Initial state:

- central M slowly floats
- orbital paths move extremely slowly
- nodes gently travel along their paths
- subtle light pulses
- camera has tiny movement

Mouse movement:

- subtle camera parallax
- central object reacts slightly
- orbit system shifts in depth

Hover node:

- node becomes brighter
- connected path becomes slightly brighter
- label becomes more visible
- other nodes subtly reduce opacity

Click node:

- smoothly focus the selected node
- animate the connected path
- show a tiny contextual label

Do NOT use aggressive camera movement.

Do NOT make the object spin continuously.

Do NOT use excessive bloom.

Do NOT use particle storms.

The Three.js scene should feel expensive, not flashy.

==================================================
HERO LIGHTING
==================================================

Use cinematic lighting.

Recommended:

- large soft key light
- warm rim light
- subtle cool fill
- restrained emissive accents
- realistic ambient occlusion
- subtle bloom

The warm light should create the premium feeling.

Teal should appear mostly as interaction/accent lighting.

==================================================
3. ADAPTIVE FLOW SECTION
==================================================

Switch into the warm light background.

Background:

#F5F3EE

Headline:

Every answer changes what
comes next.

Use serif typography for the final phrase.

Create a single connected process:

01
You answer

02
AI understands

03
It adapts

04
You improve

Each stage should have:

- minimal circular icon
- short title
- one short description

Connect the stages with a very thin animated line.

DO NOT create four large cards.

The section should feel editorial and spacious.

==================================================
FLOW ANIMATION
==================================================

When entering viewport:

1. headline fades upward
2. connecting line draws
3. nodes appear sequentially
4. icons scale subtly
5. descriptions fade in

Use Framer Motion or GSAP.

Keep animation under approximately 1 second per stage.

==================================================
4. INTERACTIVE INTERVIEW DEMO
==================================================

This section should bring the actual product to life.

Use a large dark glass panel against the light background.

Section label:

LIVE INTERVIEW PREVIEW

Heading:

See adaptation
in action.

Supporting copy:

This isn't a question bank.
It's a real conversation.

Right/center:

Interactive interview interface.

==================================================
INTERVIEW UI
==================================================

Build a real-looking conversation interface.

Interviewer:

"Suppose the correct document exists in your knowledge base
but isn't being retrieved. How would you debug this?"

Candidate:

"I'd first verify the embedding model and check whether the query
is being embedded correctly. Then I'd inspect similarity thresholds
and check for chunking issues."

Interviewer follow-up:

"Good start. What else would you investigate before changing
the embedding model?"

The follow-up should appear as a consequence of the answer.

Do not make this look like a generic ChatGPT window.

Make it feel like a technical interview product.

Use:

- subtle glass bubbles
- restrained borders
- interviewer indicator
- candidate indicator
- timestamps
- typing state
- small status indicators

==================================================
INTERVIEW DEMO ANIMATION
==================================================

When visible:

1. interviewer question appears
2. candidate response types in
3. "evaluating..." briefly appears
4. follow-up appears
5. adaptive graph updates

Add:

Replay interview

button.

Replay should restart the sequence.

==================================================
SECOND THREE.JS COMPONENT
==================================================

Beside the interview interface, create a small adaptive visualization.

Represent:

Your Answer
      ↓
Evaluate
      ↓
Understand
      ↓
Adapt
      ↓
Next Question

Use a subtle vertical 3D structure.

Each state should activate as the simulated interview progresses.

The visualization should communicate:

"The next question is generated from what you just said."

This is more important than decorative 3D.

==================================================
5. READINESS REPORT
==================================================

Move back to the warm light background.

Section label:

YOUR READINESS

Headline:

A clear map of your
readiness.

Supporting text:

Detailed, evidence-backed feedback
across the skills that matter.

Create ONE large premium assessment card.

==================================================
ASSESSMENT UI
==================================================

Overall Readiness

82 / 100

Strong

Skill Breakdown:

Retrieval       88
RAG             84
Agents          92
MCP             71
Security        64
Production      81

Top Strengths:

Retrieval
Agents
RAG

Areas to Improve:

MCP
Security

Add a small evidence section:

WHY

"You missed edge cases in retrieval failures
and metadata filtering."

This is important because it makes the report feel
evidence-backed rather than just a score dashboard.

==================================================
ASSESSMENT DESIGN
==================================================

The card should be:

- clean
- mostly neutral
- lightly glassmorphic
- subtle shadow
- thin border
- lots of whitespace

Do not make it look like an admin dashboard.

==================================================
ASSESSMENT ANIMATION
==================================================

On scroll:

- card fades upward
- 82 counts from 0
- readiness progress animates
- skill bars fill sequentially
- strengths appear
- improvement tags appear

Keep everything subtle.

==================================================
6. FINAL CTA
==================================================

Return to a dark cinematic section.

Create a large rounded dark panel.

Headline:

Don't just prepare.
Be genuinely ready.

CTA:

Start your interview →

Add a subtle Three.js visual behind the CTA.

Use a flowing field / wave / light trajectory.

It should resemble a very subtle representation
of conversation flow.

Do NOT add a giant 3D object here.

Keep it atmospheric.

==================================================
7. FOOTER
==================================================

Minimal.

Left:

MockMate

Center:

Privacy
Terms
Contact

Right:

© 2026 MockMate Inc.

Keep the footer small and quiet.

==================================================
VISUAL TRANSITIONS
==================================================

This is critical.

Although some sections are dark and some are light,
they must feel like ONE visual system.

Use consistent:

- typography
- border radius
- accent colors
- spacing
- shadows
- animation curves
- component language

Dark sections:

cinematic / immersive / product

Light sections:

editorial / analytical / explanatory

The light sections should NOT look like a separate website.

Use subtle warm undertones rather than pure white.

==================================================
GLASSMORPHISM
==================================================

Use glass only where it adds depth.

Good:

- interview panel
- 3D object
- assessment card
- buttons
- small status elements

Avoid:

glass everywhere.

The page should not look like a collection of translucent cards.

==================================================
MOTION SYSTEM
==================================================

Use a consistent motion language.

Entrance:

opacity + translateY

Hover:

small translateY
subtle brightness

3D:

smooth interpolation
slow movement
cursor parallax

Scroll:

section reveals
line drawing
progressive activation

Use spring/ease-out curves.

Never make the page feel like a motion demo.

==================================================
RESPONSIVENESS
==================================================

Desktop:

Full experience.

Tablet:

Reduce Three.js complexity.

Mobile:

Stack content.

Simplify 3D.

Keep the central M and adaptive flow.

Remove unnecessary node labels.

Do not let WebGL interfere with performance.

Provide a static/fallback visual if WebGL is unavailable.

==================================================
PERFORMANCE
==================================================

Three.js must be optimized.

Use:

- React Three Fiber
- Drei
- lazy loading
- Suspense
- optimized geometries
- limited lights
- device pixel ratio limits
- reduced animation on mobile

Do not sacrifice page performance for visual effects.

==================================================
COMPONENT ARCHITECTURE
==================================================

Use clean reusable components:

components/
  landing/
    Navbar.tsx
    Hero.tsx
    AdaptiveFlow.tsx
    InterviewDemo.tsx
    ReadinessReport.tsx
    FinalCTA.tsx
    Footer.tsx

components/
  three/
    MockMateHeroScene.tsx
    AdaptiveInterviewGraph.tsx
    CTAFlowField.tsx

Keep Three.js isolated from normal UI.

==================================================
IMPORTANT DESIGN RULES
==================================================

DO:

- preserve generous whitespace
- use strong typography
- create real interaction
- make Three.js meaningful
- keep colors restrained
- use warm light sections
- use cinematic dark sections
- maintain consistent component language
- make the interview demo feel real

DO NOT:

- add more sections
- add fake testimonials
- add fake statistics
- add random AI terminology
- add rainbow gradients
- add excessive particles
- add giant glowing objects
- use generic AI illustrations
- overuse glassmorphism
- animate everything
- make every section a card grid
- blindly copy AI-generated visual artifacts

==================================================
FINAL QUALITY BAR
==================================================

The result should feel like:

"An expensive, experimental technical product."

Not:

"Another AI SaaS landing page."

The visual hierarchy should be:

TYPOGRAPHY
     ↓
PRODUCT STORY
     ↓
3D EXPERIENCE
     ↓
INTERACTION
     ↓
SUPPORTING UI

The Three.js components should be the memorable part,
but the page must still look excellent with the 3D turned off.

Most importantly:

The visitor should understand within 5 seconds:

MockMate is an interviewer that listens to your answer
and changes what it asks next.

Build the experience around that idea.
````

### 36

````
Turn the current landing page into like Switch to coding in parakeet.ai page and then see the theme, I want that one.
````

### 37

````
Blend the div completely improving consistency and remove div borders. Improve the details present on the landing page, feels too much noise-make them simple. Use stylish fonts like parakeet.ai
````

### 38

````
some div borders are still there. Improve the content of the landing page. Put your full creativity into it. Be professional. Don't make it overwhelming. I am attaching all details about the platform for your help. Don't add big dashboards or something like now which feels shitty.

# Landing Page — Design Brief

## The job

A hackathon judge opens this URL with 28 other projects still to review. You have about 15 seconds to make them curious and about 60 to make them click "start an interview."

So: the page must make one argument, make it fast, and get out of the way. Beauty that delays the point is worse than plain that lands it.

---

## The argument

Every AI mock interview tool guesses what you're weak at by reading your CV.

This one doesn't guess. It read your cohort record before you said a word — which of 31 days you finished, how many attempts each took, what you skipped. Two people who both "completed the course" get completely different interviews.

**Diane Foster** finished 31/31 days, every single one first try.
**Tyler Brooks** finished 31/31 days, and needed multiple attempts on 30 of them.

On any conventional summary those two look identical. That gap — 100% first-try versus 3% — is the entire product.

---

## The hero: show, don't say

Do not build a hero of headline + subhead + gradient + screenshot. That's the template answer and a judge has seen it four times already this morning.

**The hero is a live interview replaying.** Not a video, not a static mockup — the actual interface, replaying a real recorded session at readable speed. The conversation on one side, the machine's reasoning ticking alongside it: depth climbing, coverage filling, the rationale for each question appearing as it's asked.

A judge watching a chat window has to take your word that the AI is adapting. A judge watching the depth line respond to a weak answer does not.

The replay data is real and already recorded. Use it.

**Rules for the hero replay:**
- Autoplays, no sound, loops
- Readable pace — this is being scanned, not studied
- A "Try it yourself" control that's available immediately, never gated behind the animation finishing
- Respects `prefers-reduced-motion`: falls back to a static frame at the most interesting moment
- Must not be the only thing above the fold — one line of copy has to carry the point for anyone who doesn't watch

---

## Real content to design with

No lorem ipsum. All of this is from the actual system.

**Headline options** (pick or write better — but keep the specificity):
- "Two people finished all 31 days. Only one of them can explain it."
- "It read your record before you said a word."
- "Every mock interview guesses what you're weak at. This one already knows."

**A real exchange, from Tyler's session:**

> **Interviewer:** Walk me through what happens when someone asks your chatbot about their coverage.
>
> **Tyler:** It searches the vector database and sends what it finds to the LLM.
>
> **Interviewer:** Okay. How many results does it pull back?
>
> **Tyler:** I think five. That was the default.
>
> **Interviewer:** What happens if the right answer is in the sixth?

**A real rationale, from the reasoning panel:**
> *"Correct but generic — he's describing the diagram, not his build. Pushing for a number he should know."*

**A real next step, from a report:**
> *"Redo Day 23 (MCP server build), then Day 24. You passed both, but on the second attempt, and the interview showed the gap is in tool schema design."*

**Real curriculum days:** Day 7 Embeddings Explained · Day 11 RAG End-to-End · Day 20 Conversation Memory · Day 23 Model Context Protocol · Day 27 Security, Privacy & Guardrails · Day 28 Docker & Kubernetes · Day 31 Capstone

All 31 days build one thing: an enterprise healthcare chatbot.

**Real candidate records:**

| | Completed | First try | The story |
|---|---|---|---|
| Diane Foster | 31/31 | 100% | Nothing left to prove |
| Tyler Brooks | 31/31 | 3% | Got there, but ground it out |
| Gerald Combs | 23/31 | 4% | 20 years experience, 3 outright failures |
| Mia Alvarez | 14/31 | 36% | Checked out early |
| Harold Whitfield | 27/31 | 56% | 28 years experience, skipped fine-tuning |

---

## Sections

**1. Hero** — the replay + one line of argument + start button.

**2. The divergence.** Diane and Tyler side by side. Same cohort, same completion, two interviews that fork immediately — hers opening at depth 4 with a pressure test, his at depth 1 rebuilding confidence. This is the proof section. Consider animating the fork: one origin, two paths.

**3. The three moments.** Reads your record → interviews you → tells you what to redo. This genuinely is a sequence, so sequential structure is honest here rather than decorative.

**4. Inside the interview.** The reasoning panel, explained. Depth ladder 1–5: recall → application → tradeoff → edge case → redesign. The claim ledger. Contradiction detection. This is where a technical judge leans in.

**5. The report.** Annotated transcript, not a score. Two separate signals — conceptual knowledge and communication. Next steps mapped to specific curriculum days.

**6. How it's built.** Your audience is AI engineers judging an AI engineering hackathon. Show the decisions:
- Four prompts, no agent framework
- Model routing by role, with reasoning
- Hard requirements enforced in code, not trusted to the model
- **"Why we didn't use a vector database"** — 31 documents, ~17KB, exact filtering beats semantic similarity. A deliberate rejection reads as better engineering than a decorative inclusion.

**7. Start.** One clear action. Candidate picker or straight into Tyler's session.

---

## Visual direction

Free choice, with two hard constraints.

### Avoid the machine-made defaults

AI-generated design currently clusters around three looks, and judges have seen all of them:

1. Warm cream background near `#F4F1EA`, high-contrast serif display, terracotta accent near `#D97757`
2. Near-black background, single acid-green or vermilion accent
3. Broadsheet layout, hairline rules, zero border-radius, dense newspaper columns

Any of these can be right for some brief. They are wrong here because they appear regardless of subject — they're defaults, not decisions. Spend the freedom elsewhere.

### Ground it in this subject's world

The materials here are interview transcripts, cohort telemetry, attempt logs, annotated margins, instrument panels. Notably, Day 29 of the curriculum is *Monitoring, Logging & Observability* — there's something apt about a tool that is itself visibly instrumented, in the way the thing they built was supposed to be.

**Two directions worth sketching before committing:**

**A — Telemetry.** The interview as a monitored system. Precise, technical, dense with legible data. Depth as a live signal, coverage as a filling gauge, the rationale as a log stream. Speaks the audience's own language. Risk: reads cold if the human warmth is lost.

**B — Marginalia.** The interview as a manuscript being annotated. The conversation is the text; the reasoning is editor's marks in the gutter. Warm, literary, human. Makes the report section almost design itself. Risk: reads soft for a technical audience.

They pull opposite ways. Pick one and execute it fully — a blend of both will read as neither.

### Typography

The type is doing real work here because there are two distinct voices on the page:

- **Questions** are short, spoken, human. Under 30 words. Give them air and weight.
- **Reasoning** is dense, technical, machine. Small, precise, monospaced or near it.

That contrast between the two voices is the design. Make it deliberate rather than incidental. Pick a display face with actual character used sparingly, a body face that's comfortable at length, and a utility face for the data.

### Motion

One orchestrated moment beats scattered effects. Candidates:

- **The fork** — two interviews diverging from one origin
- **The depth line** climbing and dipping in response to answers
- **The claim ledger** accumulating, then one entry flagging red as a contradiction fires
- **Coverage** filling toward the 4-day minimum

The depth line is the strongest, because it's the only element that *shows* adaptation rather than asserting it. Whatever you pick, spend the boldness there and keep everything else quiet.

Scattered animation is the fastest way to look AI-generated. Restraint reads as confidence.

---

## Constraints

- **Next.js + Tailwind**, buildable in a few hours
- **Desktop first** — judged on a laptop, likely over a shared screen. Small grey text on white will disappear over video compression
- **Fast** — a heavy hero that takes 4s to paint loses the judge before it lands
- **Zero API calls** — the replay is recorded fixture data
- **Accessibility floor:** visible keyboard focus, reduced-motion respected, real contrast ratios. Clear the bar, don't announce it
- **Never blocks the CTA** — a judge who wants to skip straight to trying it must always be able to

---

## Self-check before building

Write the design plan first — palette as 4–6 named hex values, typefaces for two or three roles, layout concept, and the one signature element. Then read it back and ask: *would I have produced this same plan for any other AI product?*

If yes, that part is a default rather than a choice. Change it, and say what you changed and why.

Then build to the revised plan exactly.

---

## The one sentence

If the page communicates nothing else:

**Every other mock interview tool guesses what you're weak at from your CV. This one knows, because it watched you learn.**

How the site works, end to end

  The shape of it

  Two halves sharing one Next.js app.

  / — the MockMate landing page. Static marketing. Explains the product, then hands off.

  /interview — the actual working product. A live adaptive interview.

  Everything between them is one API endpoint and one read-only state endpoint.

  ---
  1. Landing → interview

  You land on /. Every "Start Practicing" button — in the header, the hero, and the final CTA — calls the same handler in src/app/page.tsx:

  const startInterview = () => router.push("/interview");

  Client-side navigation, no page reload. There's also a "The Interview" nav link doing the same thing.

  ---
  2. The interview screen boots

  /interview renders InterviewScreen.tsx. On mount it does two things:

  1. Generates a session id — ui-{timestamp} — held in a useRef
  2. Immediately POSTs to /api/interview with { sessionId, candidate: "CAND-017" }

  The candidate is hardcoded to Tyler Brooks for the demo. He's real data from data/candidates.json: Junior Developer, 0 years' experience,
  31/31 cohort days completed, 3% first-try rate — he finished everything but almost nothing worked the first time.

  The screen shows opening while it waits.

  ---
  3. The very first request — the Planner runs

  src/app/api/interview/route.ts sees candidate in the body, so it takes the startSession path.

  The Planner (src/lib/prompts/planner.ts) runs once per session on gemini-3.6-flash at thinking_level: "high". It receives:

  - Tyler's member record (role, years, education)
  - His derived signals — coverage, first-try rate, engagement, and which days he skipped, failed, struggled on (3+ attempts), or passed clean
  - A compact curriculum: day number, title, type — not the objectives, which would be ~155 lines of wasted tokens
  - His mission record: the ~10 days we actually have outcomes for

  It returns a blueprint: a persona for the interviewer, an opening line, a target question count (8–12), an arc (warmup/build/stress/land), and
  4–6 focus days, each with a reason, a starting depth, and a strategy — verify_depth, probe_gap, rebuild_confidence, or pressure_test.

  validateBlueprint() then rejects it in code if it: picks a SETUP day, uses fewer than 4 focus days, uses only one strategy, or claims how
  Tyler performed on a day his record doesn't cover. That last check exists because the model once invented that a candidate "passed day 25 on a
  standard attempt" when day 25 wasn't in his record at all.

  The session row is written to Supabase, the opening line is stored as turn 1, and the response comes back:

  { "reply": "Hi Tyler, welcome! …", "done": false }

  ---
  4. The two-part reveal

  The client splits reply on a short leading sentence. "Okay. What happens when a pod restarts?" becomes:

  - "Okay." — appended immediately, small, grey
  - 600ms pause
  - "What happens when a pod restarts?" — appended large, in the serif

  That beat is deliberate. Instant text reads as machine output; the pause reads as thought. It's a heuristic — the API returns one string and
  the split isn't stored — so if the pattern doesn't match, the whole reply renders as the question. Safe failure.

  ---
  5. Every turn after that — the loop

  You type an answer (multi-line, explicit Send, visible character count) and it POSTs { sessionId, message }.

  The route now does this, in this order:

  a. Load state from Supabase

  Session row, plus the last 4 turns only and the full claim ledger. Never the whole transcript — the ledger already summarises everything
  earlier, and this is a free-tier budget.

  b. Compute constraints before calling the model

  nextDirective(state, blueprint) in src/lib/orchestrator.ts decides what's allowed this turn:

  - must we move to a new topic? (3 follow-ups used, or running out of questions)
  - may we conclude? (only if ≥8 questions and ≥4 days covered)
  - what depth should the next question sit at?
  - should the acknowledgement be omitted this turn?

  This is the architectural centre of the whole thing. The directive is rendered into the prompt as instruction — "You MUST move on to X now — 3
  follow-ups already used" — so the model writes its question for the correct topic. Nothing is rewritten afterwards.

  An earlier version overrode targetDay after generation. The result: a question written about one topic got filed under another, and coverage
  counted topics no question had been asked about. The "4 days covered" claim was false. Now the model's own targetDay is what gets recorded,
  and if it disobeys, that's logged as a violation rather than silently relabelled.

  c. One model call does both jobs

  runTurn() on gemini-3.5-flash-lite at thinking: "medium" returns:

  rubric      knowledge / communication / specificity, 1-5, plus objectives touched
  claims      every factual assertion, in the candidate's own words
  reaction    "Okay." / "Right." / "" — never praise, never reveals correctness
  question    one question, under 30 words
  action      follow_up | clarify | next_topic | conclude
  targetDay   which part of the system this is about
  depth       1 recall → 5 redesign
  rationale   why this question, given that answer
  substantive false for a greeting or non-answer

  Evaluator and interviewer were originally two calls. Merging them halved requests per interview — 10 instead of 20 — which on a per-day quota
  is what decides how many interviews a key supports.

  d. Filter the claims

  filterInventedClaims() checks each claim against what you actually said. If it names a technical term you never used, it's dropped before it
  enters the ledger. The model once recorded "configured termination grace period" from a candidate who only said "we set it up properly" — and
  every later turn would have probed a fact that didn't exist.

  e. Fold it into state

  recordTurn() updates: question count, days covered (crediting the day actually asked about), follow-up count, ability estimate (weighted
  toward recent answers), and mode:

  - two weak answers in a row → recovery — drop a depth level, scaffold, never pile on
  - a strong answer → back to normal, and it earns 2 extra follow-ups on that thread
  - consistently high → pressure
  4. The two-part reveal

  The client splits reply on a short leading sentence. "Okay. What happens when a pod restarts?" becomes:

  - "Okay." — appended immediately, small, grey
  - 600ms pause
  - "What happens when a pod restarts?" — appended large, in the serif

  That beat is deliberate. Instant text reads as machine output; the pause reads as thought. It's a heuristic — the API returns one string and
  the split isn't stored — so if the pattern doesn't match, the whole reply renders as the question. Safe failure.

  ---
  5. Every turn after that — the loop

  You type an answer (multi-line, explicit Send, visible character count) and it POSTs { sessionId, message }.

  The route now does this, in this order:

  a. Load state from Supabase

  Session row, plus the last 4 turns only and the full claim ledger. Never the whole transcript — the ledger already summarises everything
  earlier, and this is a free-tier budget.

  b. Compute constraints before calling the model

  nextDirective(state, blueprint) in src/lib/orchestrator.ts decides what's allowed this turn:

  - must we move to a new topic? (3 follow-ups used, or running out of questions)
  - may we conclude? (only if ≥8 questions and ≥4 days covered)
  - what depth should the next question sit at?
  - should the acknowledgement be omitted this turn?

  Every quoted span is checked: it must appear verbatim in something you said. If not, the report is rejected and retried once with the
  offending strings named. If it fails twice, degradeReport() keeps everything that validated and drops only what didn't — it never throws,
  because the contract requires a feedback object and someone who answered ten questions has earned a response.

  The final response is the only one with a third field:

  { "reply": "…", "done": true,
    "feedback": { "summary": "…", "strengths": [], "gaps": [], "next": [] } }

  ---
  8. Where state lives — and why that matters

  Everything is in Supabase. Three tables: sessions, turns, reports. Loaded at the top of every request, saved at the bottom.

  Nothing survives in memory between requests — not a Map, not a module variable. On Vercel each request may hit a cold instance, so in-memory
  state works perfectly on localhost and silently fails during judging. Even consecutiveReactions (which decides when to omit an
  acknowledgement) lives in the session row for this reason.

  ---
  9. Fixture replay

  Set FIXTURE=1 and the same route serves a recorded session instead of calling Gemini — same contract, same response shape, recorded latency
  simulated. src/lib/engine.ts is the only seam: the orchestrator, state machine, Supabase persistence and response builder all still run for
  real. Only the three model calls are substituted.

  That's how the UI was built and tested at zero API cost, and switching to live is one environment variable.

  ---
  10. The guards, in one place

  ┌──────────────────────────────────┬──────────────────────────────────────────────────────────────────────┐
  │              guard               │                             enforced by                              │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ ≥8 questions, ≥4 days            │ orchestrator.ts, in TypeScript — the model is never trusted to count │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ No invented performance claims   │ validateBlueprint() rejects them                                     │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ No invented claims in the ledger │ filterInventedClaims() drops them                                    │

  A greeting scores nothing — substantive: false skips the rubric entirely so "hello" can't seed the ability estimate.

  f. Persist and respond

  Turn row written, state saved, response returned:

  { "reply": "Right. What happens to a policy detail split across that boundary?", "done": false }

  Only reply and done. The rubric, claims, rationale and state all persist to Supabase but never appear in the response — the contract is frozen
  and judges may run an automated shape check.

  ---
  6. The instrument panel

  The panel is fed by a separate endpoint: GET /api/session/[sessionId]/state. It exists precisely so the frozen contract stays frozen.

  After every turn the client fetches it and gets: depth history, coverage against the 4-day floor, question count against the 8-question floor,
  ability estimate, follow-up count, mode, the live rationale, and the claim ledger.

  The depth trace is the signature element — a chart-recorder line plotting depth 1–5 across turns. It's the only thing on screen that shows
  adaptation rather than asserting it. While a turn is in flight the pen hovers and drifts; when the answer resolves it drops to the new depth
  and the segment strokes in. It's the only animation on the page.

  Hovering a question in the transcript marks its segment on the trace, and vice versa — so you can connect this answer to that depth change.

  ---
  7. Ending

  When the floors are met (≥8 questions, ≥4 days) and the model chooses conclude, question becomes a closing beat rather than a probe — thanks,
  one specific true thing, an invitation to ask something back. You get the last word before the report.

  Then the Reporter runs on gemini-3.6-flash at thinking: "high" — the only prompt that receives the full transcript, because feedback has to
  quote you back to yourself to be worth reading.

  Every quoted span is checked: it must appear verbatim in something you said. If not, the report is rejected and retried once with the
  offending strings named. If it fails twice, degradeReport() keeps everything that validated and drops only what didn't — it never throws,
  because the contract requires a feedback object and someone who answered ten questions has earned a response.

  The final response is the only one with a third field:

  { "reply": "…", "done": true,
    "feedback": { "summary": "…", "strengths": [], "gaps": [], "next": [] } }

  ---
  8. Where state lives — and why that matters

  Everything is in Supabase. Three tables: sessions, turns, reports. Loaded at the top of every request, saved at the bottom.

  Nothing survives in memory between requests — not a Map, not a module variable. On Vercel each request may hit a cold instance, so in-memory
  state works perfectly on localhost and silently fails during judging. Even consecutiveReactions (which decides when to omit an
  acknowledgement) lives in the session row for this reason.

  ---
  9. Fixture replay

  Set FIXTURE=1 and the same route serves a recorded session instead of calling Gemini — same contract, same response shape, recorded latency
  simulated. src/lib/engine.ts is the only seam: the orchestrator, state machine, Supabase persistence and response builder all still run for
  real. Only the three model calls are substituted.

  That's how the UI was built and tested at zero API cost, and switching to live is one environment variable.

  ---
  10. The guards, in one place

  ┌──────────────────────────────────┬──────────────────────────────────────────────────────────────────────┐
  │              guard               │                             enforced by                              │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ ≥8 questions, ≥4 days            │ orchestrator.ts, in TypeScript — the model is never trusted to count │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ No invented performance claims   │ validateBlueprint() rejects them                                     │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ No invented claims in the ledger │ filterInventedClaims() drops them                                    │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ No invented quotes in the report │ verbatim check, retry, then degrade                                  │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ Response shape                   │ typed union with no room for extra fields                            │
  ├──────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ Never returns a 500              │ every path returns contract-shaped JSON                              │
  └──────────────────────────────────┴──────────────────────────────────────────────────────────────────────┘

  ---
  File map

  src/app/page.tsx                     landing page
  src/app/interview/page.tsx           the interview screen
  src/app/api/interview/route.ts       THE endpoint (frozen contract)
  src/app/api/session/[id]/state       panel data (separate, on purpose)

  src/lib/orchestrator.ts              the state machine — floors, depth, modes
  src/lib/engine.ts                    live-vs-fixture seam
  src/lib/llm.ts                       every model call, key rotation, quota awareness
  src/lib/db.ts                        Supabase helpers, all take a sessionId
  src/lib/prompts/planner.ts           once per session
  src/lib/prompts/turn.ts              every turn
  src/lib/prompts/reporter.ts          once at the end
  src/lib/prompts/shared.ts            ANTI_INVENTION + claim verification

  src/components/DepthTrace.tsx        the signature element
  src/components/Panel.tsx             instrument panel
  supabase/schema.sql                  three tables

  ---
  Want me to save this as docs/ARCHITECTURE.md? It'd be useful for the hackathon submission — judges reading the repo get the whole picture
  without running anything. Nothing is committed yet either way; the landing-page cleanup is still sitting uncommitted in the working tree.
````

### 39

````
We need to improve the current content and layout of the landing page. Add animations, Preloader, scroll trigger animations, smooth scroll and some 3d components which will make the landing page look more crazy and appealing. Be careful with the three js components, I want good ones not just fractured ones. Make it professional and premium. Improve fonts wherever needed and will make it better.
````

### 40

````
Now the hero section feels good. We need to fix the title of hero section. There is too much text at the left side. Shorten it and don't use -Diane Foster and Tyler Brooks both finished the same 31 days. One can explain it cleanly. The other has to earn every answer, instead use any better text which don't use names explitly. We can extend the journey shown via hero three js section to justify our moto. Use a combination of different fonts style for hero section to make it cool. Improve the glass like look of complete page.
````

### 41

````
The text content in hero section still feels too much like noise, keep it minimalistic and appealing. I have attached a reference which uses different fonts effectively. Why don't you do something like that.
````

### 42

````
wire the landing page elements with backend and other elements which are related
````

### 43

````
As we used a combination of font styles for hero section, use similar different combinations to make other parts also engaging.
````

### 44

````
Don't copy the same font combination of hero section for all other sections. Use your mind and use something else.
````

### 45

````
We need to improve the text and font on the landing page. We are using a lot of font styles which feel inconsistent and use shadcn ui components only. Make the landing page loading fast. Check the current landing page design and look for improvements
````

### 46

````
The fonts feel big somewhere and don't fit in the screen, the alignment is also not good. The animations were totally removed. I want complete user experience. Animations, user journey and that premium feel. The fonts still not feeling professional. Analyze how other big ai interview platforms are built, their ui, design, layout, take design friendly decisons.
````

### 47

````
Implement the plan above.
````

---

## 6. The 3D hero

### 48

````
# MockMate Hero — Rebuild the Three.js Scene

Replace the current Three.js hero visualization with a significantly more polished,
premium and cinematic interactive 3D experience.

Use the attached reference image as the visual target.

The current implementation looks unfinished:
- the central M is almost black and unreadable
- the geometry looks like primitive placeholder objects
- orbital paths are too flat
- nodes feel randomly placed
- labels overlap each other
- lighting has very little depth
- the whole scene feels like a prototype

Do NOT simply add more glow or particles.

The goal is to create a sophisticated 3D product visualization that feels
like it belongs to a premium technical product.

==================================================
CORE VISUAL CONCEPT
==================================================

The scene represents:

"How MockMate thinks through an interview."

The central object is MockMate.

The surrounding system represents the conversation adapting around the candidate's answer.

Visual flow:

Your Answer
     ↓
Understand
     ↓
Evaluate
     ↓
Adapt
     ↓
Follow-up
     ↓
Go Deeper

This should be communicated spatially rather than as a boring flowchart.

==================================================
1. CENTRAL MOCKMATE OBJECT
==================================================

Create a premium floating rounded-square object.

It should NOT look like a basic BoxGeometry cube.

Use:

- RoundedBoxGeometry
- substantial bevel
- smooth edges
- dark smoked glass body
- slightly transparent material
- metallic/chrome outer edge
- subtle roughness variation
- realistic reflections

Inside the object:

A large "M".

The M should be:

- warm ivory/champagne
- slightly emissive
- physically integrated into the object
- softly glowing
- clearly readable

The M must be visible even against the dark background.

Do NOT make the object completely black.

The reference should feel like:

dark smoked glass + polished metal + soft champagne light.

==================================================
2. CENTRAL PLATFORM
==================================================

Place the M above a premium floating platform.

Create 3–4 concentric layers.

Each layer should have:

- different thickness
- subtle bevel
- dark metallic material
- very soft reflections

Add extremely thin accent rings.

Use:

- champagne highlight
- subtle mint highlight

The platform should have a soft contact shadow beneath the M.

The M should feel physically suspended above the platform.

Add subtle vertical floating motion.

==================================================
3. ORBITAL SYSTEM
==================================================

Create 2–3 elegant elliptical orbital paths around the M.

IMPORTANT:

Do NOT make all paths perfectly horizontal.

Give them different:

- rotations
- inclinations
- scales
- depths

This should create a proper 3D spatial composition.

The orbits should be extremely thin.

Use:

- dark metallic lines
- subtle champagne lines
- very subtle mint lines

Some sections of the path can become slightly brighter
near the active node.

Do not use thick neon tubes.

==================================================
4. NODES
==================================================

Create 5–6 premium 3D nodes.

Nodes:

1. Your answer
2. Understand
3. Evaluate
4. Adapt
5. Follow-up
6. Go deeper

Each node should be a small polished glass sphere.

Material:

- transparent glass
- internal soft light
- subtle metallic rim
- realistic reflection

Color system:

DEFAULT:
warm ivory / champagne

ACTIVE:
soft mint

SECONDARY:
very subtle warm gold

Do NOT use rainbow colors.

Do NOT make every node a different color.

==================================================
5. NODE POSITIONING
==================================================

Do NOT place nodes randomly.

Create a balanced spatial composition.

Example:

                    Understand
                        ●

          Your Answer ●       ● Evaluate


               ┌───────────┐
               │     M     │
               └───────────┘

          Go Deeper ●       ● Adapt

                    ●
                 Follow-up

But distribute them in actual 3D space.

Some should be:

- slightly closer to camera
- slightly behind
- slightly above
- slightly below

This creates depth.

Avoid overlapping labels.

==================================================
6. NODE LABELS
==================================================

Do NOT use large floating pills for every label.

The current implementation has too many overlapping pill-shaped labels.

Instead:

Use minimal glass callouts.

Example:

● Your answer

or

● Understand

For the currently active node:

Show a slightly larger glass tooltip:

UNDERSTAND

Extracts context and meaning
from your answer.

Inactive nodes should only show their short label.

Only one detailed tooltip should be visible at a time.

==================================================
7. CONNECTOR LINES
==================================================

Connect each active node to the next stage.

The connector should visually communicate direction.

Use:

- very thin curved line
- small moving light particle
- subtle gradient from champagne → mint

When the interview state changes:

the active connection should illuminate and the light particle
should travel along the path.

This creates the feeling of information moving through the system.

==================================================
8. ADAPTIVE STATE MACHINE
==================================================

Do not make the visualization purely decorative.

Create an internal state:

type InterviewStage =
  | "answer"
  | "understand"
  | "evaluate"
  | "adapt"
  | "follow-up"
  | "deeper";

The scene should support changing the active stage.

Example:

stage = "answer"

→ Your Answer node becomes active.

stage = "understand"

→ Understand activates.

stage = "evaluate"

→ Evaluate activates.

stage = "adapt"

→ Adapt activates.

stage = "follow-up"

→ Follow-up activates.

stage = "deeper"

→ Go Deeper activates.

The visual state should change accordingly.

==================================================
9. ANIMATION
==================================================

Initial entrance:

1. platform fades in
2. platform rises slightly
3. central M appears
4. orbit paths draw themselves
5. nodes appear sequentially
6. labels fade in
7. system reaches idle state

Keep this elegant and fast.

Do not make the user wait.

Idle animation:

- M floats vertically by a few pixels
- tiny rotation
- orbital system moves extremely slowly
- nodes gently pulse
- tiny light particles travel occasionally

The scene should never look static.

But it should also never look busy.

==================================================
10. MOUSE PARALLAX
==================================================

Mouse movement should control subtle camera movement.

Use smooth interpolation.

Example:

cursor moves right
→ camera shifts slightly right

cursor moves up
→ camera moves slightly upward

The central object should also react subtly.

Do NOT make the entire scene follow the cursor aggressively.

The effect should feel like depth perception.

==================================================
11. HOVER INTERACTION
==================================================

Hovering a node should:

- increase node brightness
- increase node scale by ~5–8%
- brighten its connector
- slightly reduce opacity of unrelated nodes
- display its detailed tooltip
- subtly shift camera focus

Use smooth easing.

No sudden movements.

==================================================
12. CLICK INTERACTION
==================================================

Clicking a node should transition the visualization
to that interview stage.

Example:

Click "Evaluate"

→ Evaluate becomes active
→ connector illuminates
→ light particle travels toward Evaluate
→ M subtly reacts
→ tooltip updates

This gives the visitor a sense that the visualization is actually interactive.

==================================================
13. LIGHTING
==================================================

Use cinematic lighting.

Suggested setup:

- large soft key light
- warm rim light
- subtle cool fill
- soft point lights near active nodes
- ambient light kept low

Central M:

champagne rim light

Active node:

soft mint light

Platform:

very subtle reflected light

Avoid:

- huge bloom
- neon outlines
- overexposure
- multiple colored spotlights

The scene should feel physically lit.

==================================================
14. MATERIAL QUALITY
==================================================

Avoid default MeshStandardMaterial everywhere.

Use appropriate materials.

Central object:

MeshPhysicalMaterial

with:

- transmission
- thickness
- roughness
- metalness where appropriate
- clearcoat

M:

MeshPhysicalMaterial / emissive material

Platform:

dark metallic physical material

Nodes:

glass-like MeshPhysicalMaterial

The materials should respond naturally to the lighting.

==================================================
15. BACKGROUND
==================================================

Keep the background very dark:

#080B0D

But NOT pure black.

Add an extremely subtle radial light behind the M.

The background should have almost no visible texture.

Do NOT add:

- star fields
- particle backgrounds
- random dots
- noisy shaders
- huge gradients

The 3D object is the focus.

==================================================
16. CAMERA
==================================================

Use a perspective camera.

Keep the composition optimized for the hero.

The M should occupy roughly 25–30%
of the available visualization area.

Leave enough breathing room for labels.

Do not zoom too close.

Do not let the platform dominate.

==================================================
17. RESPONSIVE BEHAVIOR
==================================================

Desktop:

Full experience.

Tablet:

Reduce orbital complexity.

Mobile:

Keep:

M
platform
2–3 nodes
basic orbit

Remove:

detailed labels
complex secondary paths

The scene must remain readable.

==================================================
18. PERFORMANCE
==================================================

Optimize aggressively.

Use:

- React Three Fiber
- Drei
- Suspense
- lazy loading
- limited lights
- optimized geometries
- capped devicePixelRatio
- efficient animation loops

Avoid unnecessary post-processing.

Use bloom only very subtly.

The 3D scene should not destroy page performance.

==================================================
19. COMPONENT ARCHITECTURE
==================================================

Create:

MockMateHeroScene.tsx

Inside:

MockMateCore
InterviewPlatform
OrbitSystem
InterviewNode
InterviewPath
NodeTooltip
CameraController
Lighting

Keep state separate from rendering where possible.

Expose:

<MockMateHeroScene
  activeStage={stage}
  onStageChange={setStage}
/>

Do not hardcode the entire scene into one giant component.

==================================================
20. VISUAL QUALITY CHECK
==================================================

Before finishing, compare the result against the reference.

The final scene should have:

✓ clearly visible M
✓ premium glass/metal materials
✓ strong depth
✓ realistic lighting
✓ clean orbit composition
✓ readable labels
✓ no overlapping labels
✓ meaningful node positions
✓ elegant motion
✓ subtle interaction
✓ adaptive state transitions
✓ restrained colors
✓ no visual noise

It should NOT look like:

✗ primitive geometry
✗ black cube
✗ random orbiting spheres
✗ generic AI graphic
✗ neon cyberpunk visualization
✗ excessive glow
✗ floating pill soup
✗ unfinished prototype

==================================================
MOST IMPORTANT DESIGN PRINCIPLE
==================================================

Do not try to make this component impressive by adding MORE.

Make it impressive through:

GEOMETRY
MATERIALS
LIGHTING
DEPTH
MOTION
INTERACTION
COMPOSITION

The viewer should immediately think:

"That is a real 3D product visualization."

Not:

"That is a Three.js demo."

The Three.js scene should communicate the core MockMate idea:

YOUR ANSWER
changes
WHAT COMES NEXT.
````

### 49

````
# MockMate Hero — Final Three.js Visual Refinement

We are keeping the current hero layout.

DO NOT redesign the hero layout.
DO NOT change the typography.
DO NOT change the CTA.
DO NOT change the overall dark cinematic theme.

ONLY improve the Three.js visualization on the right side.

The current 3D scene has the correct general concept, but it still looks like
an unfinished prototype.

==================================================
CURRENT PROBLEMS
==================================================

1. The central M looks like a crude solid polygon/cube.
2. The M is too large and visually heavy.
3. The M has almost no material depth.
4. The platform looks like a flat black disk.
5. Orbit lines feel random and flat.
6. Nodes feel randomly positioned.
7. Labels overlap and some are clipped.
8. The 3D scene is too dark.
9. The bottom "HOW IT ADAPTS" panel overlaps the scene.
10. There is too much empty visual space between the M and the useful interaction.
11. The scene doesn't feel like one coherent physical object.
12. The lighting doesn't communicate premium materials.

Fix these problems without adding visual noise.

==================================================
DESIRED VISUAL
==================================================

The final scene should feel like:

A premium physical glass object floating inside
a sophisticated spatial interview system.

Think:

smoked glass
+
polished ceramic
+
champagne reflections
+
subtle mint illumination
+
dark cinematic environment

NOT:

black cube
+
neon spheres
+
random orbit lines.

==================================================
CENTRAL MOCKMATE OBJECT
==================================================

Completely replace the current central geometry.

The current blocky M is unacceptable.

Create a premium rounded-square / capsule-like 3D object.

It should have:

- rounded corners
- bevelled edges
- smooth curvature
- slightly translucent smoked-glass body
- subtle metallic/chrome edge
- clear internal depth
- realistic reflections
- subtle clearcoat
- soft roughness variation

Use RoundedBoxGeometry or an equivalent custom bevelled geometry.

The object should be approximately 25–30% smaller
than the current central object.

It should float naturally above the platform.

==================================================
THE "M"
==================================================

The M must NOT be a giant extruded block.

Create a clean, elegant M logo inside the glass object.

The M should feel embedded inside the object.

Use:

warm ivory/champagne material
+
very subtle emissive lighting.

The M should be:

- thin
- elegant
- clearly readable
- centered
- slightly recessed or floating inside the glass

The M should NOT touch the edges of the glass object.

Add a very subtle inner glow around the M.

The M is the visual identity of MockMate.

It must look intentional and premium.

==================================================
GLASS MATERIAL
==================================================

Use MeshPhysicalMaterial.

Suggested properties:

transmission: high
roughness: 0.12–0.22
thickness: moderate
ior: realistic glass value
clearcoat: moderate
metalness: very low

The object should NOT become completely transparent.

We need to see:

glass surface
+
M inside
+
reflections
+
edge highlights.

Use environment reflections where appropriate.

==================================================
LIGHTING
==================================================

The current object is too dark.

Create cinematic three-point lighting:

1. Warm champagne key light
2. Soft cool/neutral fill
3. Subtle mint rim light

The warm key light should create a beautiful highlight
along one side of the glass.

The mint rim should barely appear around the opposite edge.

Do NOT use neon lighting.

Do NOT overexpose.

The object should be readable against #080B0D.

==================================================
PLATFORM
==================================================

Replace the current flat black disk with a premium floating pedestal.

Use 2–3 layers:

Top:
dark smoked glass / ceramic

Middle:
slightly metallic surface

Bottom:
soft shadow / ambient light

Create one thin champagne ring
and one extremely subtle mint ring.

The platform should support the M visually,
not compete with it.

Add a soft contact shadow beneath the object.

==================================================
ORBIT SYSTEM
==================================================

Keep the orbital concept.

But make it much cleaner.

Use only 3 major orbital paths.

Each path should have:

- different inclination
- different rotation
- subtle depth
- extremely thin geometry

Avoid perfect circles.

The orbits should wrap naturally around the central object.

Use:

90% subtle neutral/champagne
10% mint accent.

No rainbow colors.

No thick glowing tubes.

==================================================
NODE SYSTEM
==================================================

Use exactly 5 nodes.

Stages:

Your answer
Understand
Evaluate
Adapt
Follow-up

Optional sixth state:

Go deeper

but only show it when relevant.

Nodes should be small.

Current nodes are too visually dominant.

Use small glass spheres with:

- transparent shell
- tiny internal light
- soft reflection
- subtle shadow

Default:

champagne / warm ivory

Active:

mint

Inactive:

very dim neutral.

==================================================
NODE POSITIONING
==================================================

The nodes need intentional composition.

DO NOT randomly distribute them.

Create a clear spatial progression:

                  Understand
                      ●

        Your answer       ● Evaluate

                   [ M ]

                 ● Adapt

                   ●
               Follow-up

But use actual 3D depth.

Some nodes should be:

slightly behind the M
some beside it
some closer to the camera.

Maintain clear separation.

Never allow two labels to overlap.

==================================================
LABELS
==================================================

This is currently one of the biggest problems.

Remove the large pill labels around every node.

Use minimal labels.

Example:

● Understand

● Evaluate

● Adapt

For inactive nodes:
just show the text.

For the active node:
show a slightly larger contextual glass label.

Example:

UNDERSTAND

Extracts context
from your answer.

Only ONE detailed tooltip may exist at a time.

==================================================
TOOLTIP BOUNDARIES
==================================================

Never allow tooltips to leave the hero container.

The current "Understand" tooltip is clipped by the right edge.

Implement a safe positioning system.

If a node approaches the viewport edge:

automatically reposition its tooltip inward.

The tooltip must always remain fully visible.

==================================================
ADAPTIVE FLOW BAR
==================================================

The current bottom bar is useful conceptually,
but visually it is too large and overlaps the scene.

Redesign it as a subtle overlay.

Use:

transparent dark glass
+
thin border
+
small typography.

Height:

approximately 56–64px.

It should sit below the 3D centerpiece,
not cover the platform or nodes.

Flow:

Your answer
→ Understand
→ Evaluate
→ Adapt
→ Follow-up

Current stage should use mint.

Everything else should be muted.

Do NOT make the flow bar compete with the M.

==================================================
ANIMATION
==================================================

Create a polished idle animation.

M:

very slow floating motion
+
tiny rotation

Platform:

almost completely static.

Orbit paths:

extremely slow movement.

Nodes:

subtle movement along their orbit.

Do not make everything move independently.

The scene should feel like ONE physical system.

==================================================
ADAPTIVE STATE ANIMATION
==================================================

The visualization must communicate the interview process.

When stage changes:

1. active node brightens
2. previous node fades
3. connection line illuminates
4. small light travels along the connection
5. M briefly reacts with a subtle pulse
6. tooltip updates

Example:

Your answer
     ↓
Understand
     ↓
Evaluate
     ↓
Adapt
     ↓
Follow-up

The light traveling through the system
is the primary animation.

This should visually communicate:

"Your answer changes what comes next."

==================================================
MOUSE INTERACTION
==================================================

Keep the existing mouse interaction,
but make it much more subtle.

Cursor movement:

- camera parallax
- slight M movement
- tiny orbital depth shift

Maximum movement should be small.

Do not let the scene feel like it is attached to the cursor.

==================================================
HOVER
==================================================

Hover node:

- scale 1.05
- increase brightness
- illuminate connection
- show tooltip
- dim unrelated nodes slightly

Use smooth interpolation.

No abrupt scaling.

==================================================
CAMERA
==================================================

The current camera composition feels too flat.

Move to a slightly elevated three-quarter view.

We should see:

- front face of M
- right/side face
- platform depth
- orbital depth

The camera should not be perfectly centered.

Use a subtle perspective.

==================================================
COMPOSITION
==================================================

The 3D scene should occupy approximately:

45–50% of the hero width.

The M should remain the focal point.

Leave breathing room around the scene.

Do NOT allow nodes to reach the hero edges.

Maintain safe margins.

==================================================
COLOR BALANCE
==================================================

The current scene has too much black.

Introduce controlled highlights:

Central M:
warm ivory

Glass edges:
soft champagne

Active node:
mint

Orbit paths:
dark champagne / neutral

Background:
deep charcoal

This creates contrast without turning the scene neon.

==================================================
DO NOT ADD
==================================================

Absolutely do NOT add:

- particle storms
- stars
- random floating objects
- extra nodes
- rainbow lighting
- purple neon
- giant bloom
- holographic grids
- sci-fi HUD graphics
- more labels
- more orbit paths
- extra cards
- giant glowing M

The scene should become MORE sophisticated
by removing things, not adding things.

==================================================
TECHNICAL REQUIREMENTS
==================================================

Use:

React Three Fiber
Three.js
Drei

Recommended components:

MockMateHeroScene
MockMateCore
MockMateLogo
InterviewPlatform
OrbitSystem
InterviewNode
InterviewPath
AdaptiveFlowBar
CameraController
SceneLighting

Keep each responsibility separate.

Use:

MeshPhysicalMaterial
RoundedBoxGeometry
CatmullRomCurve3
TubeGeometry only where appropriate
soft shadows
environment lighting

Limit post-processing.

Use subtle bloom only if genuinely necessary.

==================================================
FINAL VISUAL TARGET
==================================================

The final result should communicate:

                    UNDERSTAND
                         ●
                        /
          ●────────────
     YOUR ANSWER       \
                        [ M ]
                          \
                           ●
                         ADAPT
                           \
                            ●
                        FOLLOW-UP

But it should feel like a beautiful physical 3D sculpture,
not a diagram.

The central M should be the hero.

The adaptive conversation should be the story.

Everything else should support those two things.

==================================================
SUCCESS CRITERIA
==================================================

Do not consider this complete until:

✓ M looks premium and recognizable
✓ M is not a primitive cube
✓ glass material is clearly visible
✓ M has depth and reflections
✓ platform feels physical
✓ lighting creates depth
✓ orbit paths feel intentional
✓ nodes are spatially balanced
✓ labels never overlap
✓ tooltips never clip
✓ adaptive flow bar doesn't cover the scene
✓ active state is obvious
✓ animations feel coordinated
✓ cursor interaction is subtle
✓ scene works at different screen sizes
✓ no visual noise has been added

The final scene should make someone say:

"That's a premium 3D product experience."

Not:

"That's a bunch of Three.js primitives."
````

### 50

````
Build thus kind of hero three js element:
I would build this sequence:

1. CV enters the system

A tiny floating document/card appears briefly:

RAHUL_KUMAR.pdf
       ↓
   ANALYZING

It dissolves into particles.

2. The system builds a candidate map

Those particles become nodes:

           PROJECTS
              ●
             / \
            /   \
     SKILLS ●────● EXPERIENCE
            \
             \
           BEHAVIOR
              ●

But don't make this a literal diagram. The connections should form organically in 3D.

3. Interview question appears

One small glass panel emerges:

"Tell me about your most difficult project."

A connection from the question travels toward the relevant PROJECTS node.

Then another tiny label appears:

CV → Project 03 → Backend

This would make the visual directly connected to your product.

4. It remembers the previous answer

The node pulses and a tiny fragment appears:

Previous answer detected

Then the next question can emerge.

That is a much stronger visual metaphor than a random Three.js network.
````

### 51

````
The AI Cohort is a 31-day enterprise AI engineering program covering modern AI topics including:

Retrieval-Augmented Generation (RAG)
Vector Databases
Prompt Engineering
Agentic AI
Model Context Protocol (MCP)
AI Deployment
Production AI Systems
After completing the cohort, learners should be able to confidently explain the systems they built and the engineering decisions behind them.

However, preparing for technical interviews and effectively communicating this knowledge remains one of the biggest challenges.

Your task is to build an AI Interview Agent that conducts personalized technical interviews based on a candidate's learning journey throughout the cohort.

Your Challenge
Design and build an AI agent capable of conducting a realistic, multi-turn technical interview.

The interview should:

Assess the candidate's understanding of the concepts they have completed.
Adapt naturally throughout the conversation.
Ask intelligent follow-up questions.
Maintain context across the interview.
Provide actionable feedback at the end.
The overall experience should resemble a real technical interview rather than a scripted questionnaire.

What You're Given
Every team will receive the following resources:

1. Curriculum
A structured JSON containing the complete 31-day AI Cohort curriculum, including:

Modules
Daily topics
Learning objectives
Tools used throughout the program
2. Candidate Profiles
A collection of candidate profiles describing each participant's progress through the cohort, including:

Completed missions
Attempts
Skipped topics
Learning signals
3. Technical Specification
A separate document defining:

Required API contract
Submission requirements
Request/response formats
Minimum Requirements
Your solution must:

Conduct a conversational technical interview.
Ask a minimum of 8 questions covering at least 4 different curriculum days.
Generate follow-up questions based on previous responses.
Maintain conversation context throughout the interview.
Produce structured feedback at the end of the interview.
Expose the required HTTP endpoint defined in the Technical Specification.
You are free to choose any:

AI models
Frameworks
Agent orchestration strategy
Retrieval pipeline
System architecture
Out of Scope
The following are not required:

Voice interaction
User authentication
Persistent user accounts
Long-term conversation history
Mobile applications
Notes
All curriculum and candidate data provided for this challenge are synthetic and intended solely for the hackathon.
Teams may use any AI models, agent frameworks, vector databases, or supporting technologies.
Creativity in interview flow, reasoning, interaction design, and overall user experience is highly encouraged.
Attached Resources
Curriculum JSON
Candidate Profiles
Technical Specification


This is the hackathon problem statement. Now customize the hero three js section according to this. Current one looks good but not aligned with the problem statement. Create a engaging story though 3d elements asked in the problem statement
````

### 52

````
Instead of candidate.json , use 31 day AI Cohort and for the texts that show up during animation, place them at different places or near different 3d elements not at the same place which will make it more engaging. and at the end , insteading of vanishing everything -put a 3d element saying "Interview Ready" and along with that put something which feels like celebration.
````

### 53

````
The texts which show up during 3d object animation overlaps with the 3d orbitals and hero text. Move the complete three js component a little right. Most importantly, the Interview ready 3d component along with celebration effect doesn't appear in the end of animation.
````

### 54

````
The 3d hero component got screwed completely, badly aligned. Redesign it completely and much better than earlier. Install frontend and design skills from-https://github.com/addyosmani/agent-skills and use them and create fab outputs. There are too much dashboards on the landing page, can we replace them , use something even better
````

### 55

```
so..i had fixed the collision in animation on the landing page hero section. you know the on on right hand side. and commited locally on this machine..then while merging with other commits that were pushed by my friends the collsion fix was lost. can you fix it again?from that commit or spertley... i dont know i just want it fixed
```

### 56

```
theres still this collision on my localhost
```

---

## 7. Light & dark theme

### 57

````
add a toggle to switch between light and dark themes and make sure it works completely fine
````

### 58

```
hey ishan pushed something have a look. light dark dont work in that toiggle though. i want what light dark tioggle i had made before merging botth their commits. you know that collding animation and light mode aniation+ text fixes
```

### 59

```
fix the light dark mode we spent so much time on it. we should have that.
```

### 60

```
first fix bg on light mode and also the text what we had decided before the merge.and in candidate page these green boxes not visiable. the light mode colour is good there. but on landing page is weird. fix all that first
```

### 61

```
i told you to fix this. the hover no text. and in gren boxes no text you couldnt fking do it
```

---

## 8. The interview experience

### 62

```
"my friends will do frontend work. we gotta make the main
part the interview better. how to do it. use ml or what"
```

### 63

```
"can you verify here what happens when interview ends. like
what is shown the result of the interiview" → "should we give
scores?improvemnts? etc"
```

### 64

```
"keep an end interview button? and then we the results on a
new page?"
```

### 65

```
"the scrolling stll not good or working. and also cant see
the below text in side panel and cant scroll to see either" → "it still
dosnt scroll...wtf are you doing you cant fix it?"
```

### 66

```
"now wtf would somneone understand what the graph is about
cause we only see lines when responses come... those 5 things written
redisgn etc and claims wtf are those" → "should we show those 5 qs on
left side?"
```

### 67

```
"ok so is it faster now? intial load and also after givig a
response?" · "i wanna use pinecone db. i heard its faster and better." ·
"what about if we use pgvector too in supabase" · "are we wasting any api
calls uselessly somehwere"
```

### 68

```
"i want to keep the ui of what ishan pushed in interview. and
keep the logic and functioning to what i built. see properly and tell me
how we will do that. properly"
```

### 69

```
"the response doesnt feel human. like i wrote rubbish and it
just moved on like a chatbot didnt say nothing" → "i want it to feel more
human . like the interviwer tells us how our prev response was. relly
good, something missing... like in internshala interviews"
```

### 70

````
lets implement your suggestions and fix loopholes we found out. Also Improve the UI/UX of the interview experience , keep it minimalisitc and simple and engaging so user doesn't loose intrest
````

### 71

````
such a odd response for the answer. too much noise in the interview interface. No need of this three grid system, the UI feels dull, mathc the theme with the landing page theme, make the UI look like a professional cheat interface and keep it simple and minimalistic, interview related all details and a replay will be provided post interview. I told you to analyze how big ai interviewer work in the market and make ours like them
````

### 72

````
There is so much blank spaca at both sides. Remove the border around the chat space and blend it completely. Add some sounds to differentiate between question asked and response sent. Make it more interactive and engaging
````

---

## 9. The end-of-interview report

### 73

```
we could show timeline in end report and all the question wise analysis everything too? and keep the score? and fix that 80% bug?
```

### 74

```
ok.. so...the interview after giving the interview if i write useless stuff too it said nice response . even if it wasnt good. fix that. there was nothing good and it said good response
```

### 75

```
what xactly did you do?
```

### 76

```
so what change in response?
```

### 77

```
but verdict should be there i think? was it there before? just the ngative one like maintain language or something like that?
```

### 78

```
the problem is in the end report of interview not while the person is being interviewd fix there. not what you did
```

### 79

```
can we make report making faster? like report keeps making in bg while the user is giving interview and fastly gives us final reprt? and give option to download reprt as pdf
```

### 80

```
before we go forward with this..when ending interview on rubbish ans... we still se topic name and good understanding beside it even though i didnt ans anything fix that. and any more issues in report see first that
```

### 81

```
now do the report faster and pdf thing
```

### 82

````
Give me improvement suggestions. Assume yourself as the judge. As you have also tested it, you are good to go. It aslo don't give good and engaging responses during the interview when user answers a question, look for more such improvements then give the new implementation plan
````

### 83

````
Lets now work on the end report given after interview. It should be detailed, simple , easy to understand, enagaging and useful. There should be a reply option to check all the questions and my responses on them and a marking or something how well i answered them, etc. Suggest better changes how we can improve the end report and make it more useful for a user
````

### 84

````
give the action plan based on the cohort curriculum and his previous learning experience and mistakes what they did earlier and what to no commit
````

### 85

````
Keep the language used very simple such that even a child could understand
````

---

## 10. Testing & judging readiness

### 86

```
a numbered list of ten defects from the Sarah Johnson
interview, grouped by priority, "No API calls needed for any of this."
```

### 87

```
so it works right the interview?
```

### 88

`````
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
`````

### 89

````
Check every aspect of it, UI and all. Try giving wrong answers AND THEN check the response for better loophole finding
````

### 90

````
What things can be improved to outperform other candidates in the hackathon. This is my problem statement:

The Interview Agent
Build the interviewer, not the interview.

The Situation
The AI Cohort is a 31-day enterprise AI engineering program covering modern AI topics including:

Retrieval-Augmented Generation (RAG)
Vector Databases
Prompt Engineering
Agentic AI
Model Context Protocol (MCP)
AI Deployment
Production AI Systems
After completing the cohort, learners should be able to confidently explain the systems they built and the engineering decisions behind them.

However, preparing for technical interviews and effectively communicating this knowledge remains one of the biggest challenges.

Your task is to build an AI Interview Agent that conducts personalized technical interviews based on a candidate's learning journey throughout the cohort.

Your Challenge
Design and build an AI agent capable of conducting a realistic, multi-turn technical interview.

The interview should:

Assess the candidate's understanding of the concepts they have completed.
Adapt naturally throughout the conversation.
Ask intelligent follow-up questions.
Maintain context across the interview.
Provide actionable feedback at the end.
The overall experience should resemble a real technical interview rather than a scripted questionnaire.

What You're Given
Every team will receive the following resources:

1. Curriculum
A structured JSON containing the complete 31-day AI Cohort curriculum, including:

Modules
Daily topics
Learning objectives
Tools used throughout the program
2. Candidate Profiles
A collection of candidate profiles describing each participant's progress through the cohort, including:

Completed missions
Attempts
Skipped topics
Learning signals
3. Technical Specification
A separate document defining:

Required API contract
Submission requirements
Request/response formats
Minimum Requirements
Your solution must:

Conduct a conversational technical interview.
Ask a minimum of 8 questions covering at least 4 different curriculum days.
Generate follow-up questions based on previous responses.
Maintain conversation context throughout the interview.
Produce structured feedback at the end of the interview.
Expose the required HTTP endpoint defined in the Technical Specification.
You are free to choose any:

AI models
Frameworks
Agent orchestration strategy
Retrieval pipeline
System architecture
Out of Scope
The following are not required:

Voice interaction
User authentication
Persistent user accounts
Long-term conversation history
Mobile applications
Notes
All curriculum and candidate data provided for this challenge are synthetic and intended solely for the hackathon.
Teams may use any AI models, agent frameworks, vector databases, or supporting technologies.
Creativity in interview flow, reasoning, interaction design, and overall user experience is highly encouraged.
Attached Resources
Curriculum JSON
Candidate Profiles
Technical Specification
````

---

## 11. Housekeeping

### 91

```
can you keep updating prompts.md properly? are we doing it rn?
```

### 92

```
update promots.md it should ONLY have my promot not hat that prompt did. ONLUY PROMPTS
```

### 93

```
pull the changes made.
```

### 94

```
run dev do it
```

### 95

```
want this image as favicon. we have that next js logo rn in broswer
```

### 96

````
From now onwards, create a file named "Rahul Prompts.md" and keep adding all the exact prompts we will be using in that file and keep notifying me that you are adding and keeping track
````

