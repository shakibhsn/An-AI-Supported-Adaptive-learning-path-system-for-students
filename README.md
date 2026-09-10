# An AI-Supported Adaptive Learning Path System for Students

Turns the existing adaptive learning HTML/JS prototype into a real full-stack
application: real accounts, a real PostgreSQL database, real diagnostic
scoring, a real deterministic adaptive-path engine, and real Claude API
calls — replacing every hardcoded/simulated piece the prototype had.

## Read this first: what's verified vs. what needs your machine

This was built in a sandbox with **no internet access**, so `npm install`,
a live Express/PostgreSQL server, and real Claude API calls were not
possible here. Being precise about what that means:

**Actually run and verified, right here:**
- Core algorithm tests (`backend/tests/core.test.ts`) — 20/20 passing,
  covering topic scoring, mastery classification, and the adaptive
  engine's prerequisite-aware sequencing, checked against this project's
  own worked example (Arrays 80%/Linked Lists 35%/Recursion 40%/Trees 30%
  → correctly sequenced as Arrays→Recursion→Trees→Linked Lists, with
  Arrays flagged as a "revision" step since it's Mastered-but-required).
- **Full frontend integration test** (`test_integration.js`, Playwright +
  real Chromium + mocked API responses) — **16/16 checks passing**,
  proving in an actual browser that: the diagnostic result screen shows
  real computed scores (not the old hardcoded "4/10"), the Learning Gap
  screen shows real ranked weak topics (not the old fake "Trees &
  Binary Search Trees" narrative), the AI Plan and AI Chat screens
  render real backend response content (verified via marker strings
  that only appear if the real code path executed), the Before/After
  screen shows a real computed mastery change (not the hardcoded
  "35% → 85%"), and the Progress screen computes a real average from
  real per-topic data.
- Every backend `.ts` file passes a syntax check; the full embedded
  frontend script passes `node --check`.

**Written correctly but NOT run here** (needs your machine's internet
access): `npm install` actually succeeding, a live PostgreSQL connection,
a real `prisma migrate`/`prisma db seed`, and a real Claude API response.
Follow "Running the project" below — it should take about 10 minutes —
and tell me the exact error if anything fails; I'd rather fix a real
message than guess.

## Architecture

```
Frontend (frontend/index.html - the original prototype, integrated)
   ↓ fetch()
Express Backend (backend/src)
   ↓
PostgreSQL (via Prisma)

Backend
   ↓
Anthropic Claude API (claude-sonnet-5)
```

The Claude API key lives only in `backend/.env` and is never sent to the
browser. Every `/api/ai/*` call happens server-side.

## Engine vs. LLM separation (the core academic contribution)

`backend/src/services/adaptiveEngine.service.ts` is the ONLY thing that
decides topic order. It does a prerequisite-depth-aware topological sort:
every topic's prerequisite is scheduled strictly before it, ties within
the same depth go to already-Mastered "revision" topics first, then to
the weakest score among genuinely-weak topics. The LLM
(`llm.service.ts`) never sees the prerequisite graph and is explicitly
instructed not to reorder anything — it only personalizes explanations
and study guidance around whatever sequence the engine produced. If your
supervisor asks "is the LLM generating the path?" — no, and the tests
prove it.

## What was extracted vs. what's new

**Extracted verbatim from the original prototype** (not rewritten):
- All 75 real questions (30 diagnostic + 30 practice + 15 follow-up)
  across DSA/OOP/SPL — pulled programmatically from the HTML's embedded
  arrays, not retyped by hand.
- The entire visual design (Tailwind classes, layout, colors) — kept
  exactly as-is per your "don't redesign" instruction.

**Consolidated (documented decision, see `backend/src/data/topicMapping.ts`):**
The original prototype used a different topic label on almost every
question (e.g. "Linked List Head Insertion", "Deletion at Head",
"Pointer Traversal" — all really about one concept). These were merged
into a smaller canonical topic list per course so mastery percentages
are meaningful (averaged across multiple real questions, not a single
question's 0%-or-100% score). The mapping is a plain lookup table you
can inspect and adjust.

**Genuinely new:**
- Backend, database, auth, adaptive engine, LLM integration — everything
  under "What was removed" below.

## What was removed (per your explicit "do not fake implementation" instruction)

- The hardcoded email/password check in `handleLogin()`.
- The `aiKnowledgeBase` object (15 canned Q&A pairs) — `handleAiPromptClick`
  and `sendAiCustomMessage` now call `POST /api/ai/chat` for a real
  Claude response.
- The 9 hardcoded question arrays — now real seed data in Postgres.
- The fully hardcoded diagnostic result screens (s06a/b/c) — fixed
  "4/10", "40% Accuracy" etc. regardless of actual answers.
- The fully hardcoded Learning Gap narratives (s07) — including
  specific fabricated explanations like "Confusion between memory
  address references and payload values" that were never derived from
  any real answer pattern.
- The fully hardcoded AI Study Plan (s08) — four fixed steps per course
  regardless of the student's actual weak topics.
- The fully hardcoded Before/After screen (s12) — fixed "35% → 85%"
  narratives per course, including OOP/SPL narratives that didn't even
  match those courses' real follow-up question topics.
- The fully hardcoded Progress screen (s13) and dashboard mastery
  percentages (42%/75%/82%, static regardless of any real activity).

## A correction made mid-build (documenting failure honestly)

The follow-up assessment was initially designed assuming ONE topic per
course (true for DSA — its 5 follow-up questions are all about Linked
Lists). Checking the actual extracted OOP and SPL follow-up questions
showed each covers 5 *different* topics (OOP: Polymorphism, Interfaces,
Constructors, Encapsulation; SPL: Pointers, Dynamic Memory, Deallocation,
Dereferencing, Structures). The backend (`followUp.controller.ts`) was
rewritten to score and update mastery per-topic across however many
topics a submission touches, which is correct for all three courses.

## Folder structure

```
adaptive-learning-path-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       12 models (11 from spec + isFollowUp flag - see below)
│   │   └── seed.ts             Seeds courses/topics/prerequisites/75 questions/demo account
│   ├── src/
│   │   ├── data/
│   │   │   ├── topicMapping.ts     Canonical topics + prerequisite graph + label mapping
│   │   │   └── seedQuestions.ts    The 75 extracted questions, topic-mapped
│   │   ├── services/
│   │   │   ├── mastery.service.ts       Scoring + classification (tested)
│   │   │   ├── adaptiveEngine.service.ts Deterministic path sequencing (tested)
│   │   │   └── llm.service.ts           Real Claude API calls
│   │   ├── controllers/    One per resource (auth, courses, diagnostic, practice, followUp, learningPath, ai, progress)
│   │   ├── routes/         Wires controllers to Express routes
│   │   ├── middleware/     JWT auth guard + error handler
│   │   ├── utils/          bcrypt + JWT helpers
│   │   ├── prisma.ts       Prisma client singleton
│   │   ├── app.ts          Express app (CORS, rate limiting on /api/ai, routes)
│   │   └── server.ts       Entrypoint
│   ├── tests/core.test.ts  20 passing tests
│   ├── package.json / tsconfig.json / .env.example / .gitignore
├── frontend/
│   └── index.html          The original prototype, integrated with the real backend
├── test_integration.js     Playwright test proving the integration works (16/16 passing)
└── README.md                (this file)
```

### Schema deviation, documented

The spec's model list includes `FollowUpAttempt` (a result) but no
separate follow-up *question* table. Since follow-up questions are
structurally identical to practice questions, `PracticeQuestion` got an
`isFollowUp: Boolean` flag instead of inventing an unlisted table — the
30 regular practice questions and 15 follow-up questions share one table,
distinguished by that flag.

## Running the project

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` — generate with `openssl rand -hex 32`
- `ANTHROPIC_API_KEY` — from https://console.anthropic.com
- `UNIVERSITY_EMAIL_DOMAIN` — defaults to `uiu.ac.bd`

```bash
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

The seed script prints a demo account (email + password) at the end —
copy it, it's not stored anywhere in frontend source per Section 22.

Visit `http://localhost:4000/health` to confirm the server is up before
touching the frontend.

### 2. Frontend

No build step. Serve it (don't just double-click the file — same
file:// reasons as before):

```bash
cd frontend
python3 -m http.server 5500
# visit http://localhost:5500
```

`API_BASE` in the `<script>` block is hardcoded to
`http://localhost:4000/api` — change it if your backend runs elsewhere.

### 3. Run the tests

```bash
cd backend
npm test
```

### 4. Run the integration test (optional, needs Node + Playwright)

```bash
node test_integration.js
```

This spins up a real headless browser, mocks every API call, and
verifies the frontend genuinely uses real backend data at every screen
— useful if you modify the frontend further and want to catch
regressions the same way I did.

## Demo flow (matches Section 25 exactly)

1. Sign up or log in (toggle at the top of the login screen).
2. Dashboard → select DSA.
3. Take the diagnostic quiz → submit → **real computed** topic scores
   and weak-topic identification.
4. View Learning Gap Analysis → **real ranked** weak topics.
5. Generate Adaptive Learning Path → **real deterministic** sequencing.
6. View AI Personalized Plan → **real Claude API call**, displayed as-is.
7. Open the AI Assistant → ask a question → **real Claude API call**.
8. Complete practice → complete follow-up assessment.
9. **Real** new mastery calculated and stored.
10. Before/After screen shows the **real** change; path regenerates.

## Known limitations

- CORS is wide open (`*`... actually `cors()` with defaults) — fine for
  local demo, tighten for anything beyond that.
- No refresh-token rotation — JWTs are long-lived (7 days) for demo
  simplicity.
- The dashboard's three course-mastery cards only show real data once a
  diagnostic has been taken for that course; otherwise they show "Take
  diagnostic" placeholders (this is correct behavior, not a bug — there's
  no real data to show yet).
- Rate limiting on `/api/ai/*` is a simple in-memory limiter
  (`express-rate-limit` defaults) — fine for a single-instance demo, not
  for a multi-instance production deployment.

## Future work

- Add refresh tokens / shorter-lived access tokens.
- Add a resource-recommendation table (mentioned in earlier planning
  documents but out of scope for this build).
- Expand the prerequisite graph beyond one-parent-per-topic if a topic
  genuinely needs multiple prerequisites (the current schema and engine
  both assume a single `prerequisiteTopicId`, matching the spec's
  suggested schema).
