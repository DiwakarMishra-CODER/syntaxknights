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
