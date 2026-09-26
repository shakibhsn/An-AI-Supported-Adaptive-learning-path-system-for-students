#An AI-Supported Adaptive Learning Path System for Students

A real, working full-stack application: a student signs up, takes a diagnostic, gets a
deterministically-computed adaptive learning path, studies curated materials, practices
at a difficulty that adapts to their real performance, chats with a real LLM tutor, and
watches their mastery, learning path, and activity history update from their actual
stored data. Nothing in the running app is hardcoded, simulated, or fabricated — every
number on screen comes from a database query or a live model response.

## 1. Overview

```
Student
  ↓
Diagnostic Assessment (real scoring)
  ↓
Topic Mastery Analysis + Weak Topic Detection (deterministic thresholds)
  ↓
Adaptive Learning Path Engine (prerequisite-aware, deterministic — NOT the LLM)
  ↓
Learning Materials (curated, real links) + Practice (difficulty-adaptive)
  ↓
Follow-up Assessment → Updated Mastery → Path Regenerates
  ↓
Real LLM (Grok via Groq) personalizes, explains, and analyzes progress
```

The core academic contribution: **the LLM never decides anything about the student's
path.** A separate, deterministic, unit-tested engine (`adaptiveEngine.service.ts`)
computes topic order from the prerequisite graph and the student's real mastery scores.
The LLM only explains, personalizes, and analyzes — it is handed the path as ground
truth and is explicitly instructed never to reorder it.

## 2. Architecture

```
frontend/index.html         Single-file SPA (Tailwind CDN, vanilla JS, no build step)
      │ fetch()
      ▼
backend/  Express + TypeScript (tsx watch in dev)
  src/
    app.ts                  helmet, CORS allowlist, rate limiting, routes
    server.ts               entrypoint
    middleware/              JWT auth guard, error handler
    utils/                   bcrypt + JWT helpers
    data/                    canonical topics, prerequisite graph, seed questions,
                             expanded question bank, curated materials
    services/                all business logic — framework/DB-free where possible
      mastery.service.ts            scoring + status classification (tested)
      adaptiveEngine.service.ts     deterministic path sequencing (tested)
      adaptiveQuestion.service.ts   difficulty recommendation (tested)
      learningPath.service.ts       path (re)generation, DB side
      recommendation.service.ts     explainable "why" strings
      activity.service.ts           learning-activity tracking
      llm.service.ts                real LLM calls (provider-agnostic)
    controllers/ + routes/   one pair per resource
PostgreSQL (via Prisma)      16 models
      │
      ▼
Groq (or xAI/Anthropic) — real LLM, called server-side only
```

## 3. What's real (not a prototype anymore)

| Area | Reality |
|---|---|
| Auth | Real bcrypt + JWT, session persists across refresh (`GET /auth/me` on load), real logout |
| Diagnostic / Practice / Follow-up | Real DB-backed questions, real scoring, real `TopicMastery` updates |
| Adaptive Learning Path | Deterministic prerequisite-depth topological sort, regenerates automatically after practice/follow-up, previous versions kept for comparison |
| **Question difficulty** | 187 questions (75 original + 112 newly authored EASY/HARD), real per-question attempt history, adapts up/down based on a real rolling-window accuracy rule — never on one question |
| **Learning Activity Tracking** | Real, event-based, visibility-aware timing (pauses when the tab is hidden) — no countdown timer, no guessed durations. External resource opens are logged as discrete events with `duration: 0`, never a claimed watch time |
| Learning Materials | 86 curated real resources (GeeksforGeeks/Programiz/Oracle articles, Abdul Bari/mycodeschool/Neso Academy/Telusko videos), per-user completion tracking |
| AI (Grok) | Every `/api/ai/*` call is a real API call, server-side only, key never sent to the browser. Includes personalize, contextual chat with 4 explanation styles, and a strict-honesty progress analyzer that refuses to invent a statistic |
| Explainable recommendations | Every weak-topic/path/difficulty recommendation carries a server-computed reason string — the LLM may reword it, never invent it |
| Topic Mastery Map / Learning Profile | Real thresholds, real activity minutes, a "preferred resource type" only declared after ≥3 repeated completions (never a single click) |
| User isolation | Every query is scoped to `req.user.userId` from the verified JWT — never a client-supplied id |

## 4. Technologies

- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** PostgreSQL
- **Frontend:** Single HTML file, Tailwind (CDN), vanilla JS — no build step, no framework
- **LLM:** Groq (default, free tier) via an OpenAI-compatible REST call; xAI/Grok and Anthropic Claude are drop-in alternatives (one env var)
- **Testing:** a framework-free unit test file (`tests/core.test.ts`, run via `tsx`) for the pure-logic services, plus Playwright for end-to-end browser verification

## 5. Installation

### 5.1 PostgreSQL

Install PostgreSQL 14+ (Windows: `winget install PostgreSQL.PostgreSQL.17`; macOS: `brew install postgresql@16`; Linux: your package manager). Then:

```bash
psql -U postgres
CREATE DATABASE studyguard;
\q
```

### 5.2 Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` — see §6 below for what every variable means.

```bash
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

You should see `StudyGuard backend listening on http://localhost:4000`. Confirm with
`curl http://localhost:4000/health` → `{"status":"healthy"}`.

The seed script prints a demo account (email + password) — copy it down, it's not
stored anywhere in frontend source.

### 5.3 Frontend

No build step. Serve the single HTML file (don't just double-click it — `fetch()` from
`file://` is unreliable in some browsers):

```bash
cd frontend
npx serve -l 3000 .
```

Visit `http://localhost:3000`. `API_BASE` in the `<script>` block is hardcoded to
`http://localhost:4000/api` — change it if your backend runs elsewhere.

## 6. Environment variables (`backend/.env`)

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Random secret for signing JWTs — generate with `openssl rand -hex 32` |
| `LLM_PROVIDER` | `xai` (default — despite the name, this path is OpenAI-compatible and drives Groq/xAI/any compatible gateway) or `anthropic` |
| `XAI_API_KEY` / `XAI_BASE_URL` / `XAI_MODEL` | Provider credentials. Default config points at **Groq's free tier** (`https://api.groq.com/openai/v1`, `openai/gpt-oss-120b`) — get a key at [console.groq.com](https://console.groq.com). To use real xAI/Grok instead, swap in the commented Option B block (needs billing at [console.x.ai](https://console.x.ai)) |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Only used if `LLM_PROVIDER=anthropic` |
| `UNIVERSITY_EMAIL_DOMAIN` | Signup email domain check, defaults to `uiu.ac.bd` |
| `FRONTEND_ORIGIN` | CORS allowlist — comma-separated for multiple origins |
| `PORT` | Backend port, defaults to 4000 |

**Groq model note:** Groq periodically retires/rotates free models. If you see
`model_not_found`, list what's currently available:

```bash
curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer $XAI_API_KEY"
```

and update `XAI_MODEL` in `.env` — no code change needed.

## 7. Database (Prisma)

16 models — see `backend/prisma/schema.prisma` for the full definitions and relations:

`User`, `Course`, `Topic`, `DiagnosticQuestion`, `DiagnosticAttempt`, `DiagnosticAnswer`,
`TopicMastery`, `LearningPath`, `LearningPathItem`, `PracticeQuestion`,
`PracticeAttempt`, `PracticeQuestionAttempt`, `FollowUpAttempt`, `AIInteraction`,
`LearningMaterial`, `MaterialCompletion`, `LearningActivity`.

```bash
npx prisma migrate dev --name <description>   # create + apply a migration after a schema change
npx prisma studio                              # browse the database visually
npx prisma generate                            # regenerate the client after a schema change (migrate does this automatically)
```

**Windows note:** if `prisma generate` fails with an `EPERM` error renaming the query
engine DLL, the dev server (which holds a lock on it) is still running — stop it first,
then generate, then restart.

### Seeding

```bash
npx prisma db seed
```

Safe to re-run — it wipes and recreates all *seeded* data (courses, topics, questions,
materials) but never touches real user accounts or their activity/attempts, except the
one demo account, which is upserted. Seeds:

- 3 courses (DSA, OOP, SPL), their canonical topics, and the prerequisite graph
- 30 diagnostic questions (10/course)
- 187 practice/follow-up questions total: the original 75 (30 practice + 15 follow-up + tagged MEDIUM) plus 112 newly authored EASY/HARD questions (`src/data/expandedQuestions.ts`) across mixed question types (MCQ/TRUE_FALSE/SCENARIO/CODE/CONCEPT)
- 86 curated learning materials (`src/data/learningMaterials.ts`)
- One demo account (credentials printed at the end of the seed run)

## 8. Development commands

```bash
npm run dev         # backend dev server (tsx watch, auto-reload)
npm run build        # tsc -> dist/
npm start            # run the compiled build
npm run typecheck    # tsc --noEmit
npm test             # unit tests for the pure-logic services (tsx tests/core.test.ts)
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio
```

## 9. API overview

All routes below are prefixed `/api`. Every route except `/auth/register` and
`/auth/login` requires `Authorization: Bearer <token>`.

**Auth**
`POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `POST /auth/logout`

**Courses / Topics**
`GET /courses` · `GET /courses/:id` · `GET /courses/:id/topics`

**Diagnostic**
`GET /courses/:courseId/diagnostic` · `POST /diagnostic/submit`

**Practice**
`GET /courses/:courseId/practice` · `GET /topics/:topicId/practice/next?count=` (adaptive, difficulty-aware) · `POST /practice/submit`

**Follow-up**
`GET /courses/:courseId/follow-up` · `POST /follow-up/submit`

**Learning Path**
`GET /courses/:courseId/gaps` · `POST /learning-path/generate` · `GET /learning-path/:courseId`

**Materials**
`GET /courses/:courseId/materials` · `GET /topics/:topicId/materials` · `POST /materials/:id/complete` · `DELETE /materials/:id/complete`

**AI (Groq)**
`POST /ai/personalize` · `POST /ai/chat` (accepts `style: simple|detailed|example|step_by_step`) · `POST /ai/analyze-progress`

**Activity Tracking**
`POST /activity/start` · `POST /activity/:id/heartbeat` · `POST /activity/:id/end` · `POST /activity/instant` · `GET /activity/summary?courseId=&topicId=&range=today|week|all`

**Insights**
`GET /courses/:courseId/mastery-map` · `GET /learning-profile?courseId=` · `GET /courses/:courseId/path-history` · `GET /courses/:courseId/topics/:topicId/detail`

**Progress**
`GET /progress` · `GET /progress/:courseId`

## 10. Testing

```bash
cd backend
npm test              # 20 unit tests: scoring, mastery classification, adaptive path sequencing
npm run typecheck      # full TypeScript check
```

There's no bundled Playwright suite in the repo (it was used interactively during
development to verify every feature against the live app — signup → diagnostic →
adaptive path → materials → adaptive practice → AI chat/explain-at-level → progress →
mastery map → path history → analyze-progress — all confirmed against real HTTP
responses, not mocks). If you want a regression suite, `npm install -D playwright &&
npx playwright install chromium` and drive `http://localhost:3000` the same way.

## 11. Extending the system

The schema and seed pipeline are designed so none of the following need a code change:

### Add a new course

Insert a `Course` row, its `Topic` rows (with `prerequisiteTopicId` links), and
question/material rows referencing them. The dashboard, adaptive engine, materials
screen, and progress hub all read courses/topics from the database — none of them
hardcode DSA/OOP/SPL. (`src/data/topicMapping.ts` currently defines the canonical topic
list + prerequisites for the 3 demo courses in code for seeding convenience — for a
new course either add an entry there and re-seed, or insert directly with SQL/Prisma
Studio.)

### Add a new topic to an existing course

Insert a `Topic` row with the right `prerequisiteTopicId`. Add `DiagnosticQuestion` /
`PracticeQuestion` rows referencing it (`difficulty` and `questionType` are optional,
default to `MEDIUM`/`MCQ`).

### Add new learning materials

Insert a `LearningMaterial` row (`courseId`, `topicId`, `title`, `type`, `url`, ...) —
or add an entry to `src/data/learningMaterials.ts` and re-seed. Any number of materials
of any type can exist per topic; the Materials screen renders whatever comes back with
no frontend change.

### Add more practice questions / difficulty tiers

Insert `PracticeQuestion` rows with a `difficulty` (`EASY`/`MEDIUM`/`HARD`). The
adaptive endpoint (`GET /topics/:id/practice/next`) automatically picks them up — no
code change. If a topic has zero questions at its recommended tier, the endpoint falls
back through the other tiers and honestly reports which one was actually served.

## 12. Known limitations

- Rate limiting is in-memory (`express-rate-limit` defaults) — fine for a single-instance demo, not for a multi-instance production deployment.
- No refresh-token rotation — JWTs are long-lived (7 days) for demo simplicity.
- The per-course screen layout in the frontend still has some duplicated markup (one block per DSA/OOP/SPL tab in a few screens) rather than being fully templated — functional, just not maximally DRY.
- Adaptive question-difficulty rotation has more room to shine once the question bank grows further per topic (187 questions across 28 topics × 3 tiers means some tiers currently have only 1-2 questions).

## 13. Demo flow

1. Sign up (or use the seeded demo account) → dashboard shows a real time-of-day greeting with your name.
2. Select a course → take the diagnostic → real computed per-topic scores and weak-topic identification.
3. View the Learning Gap Analysis → real ranked weak topics with explainable reasons.
4. Generate the Adaptive Learning Path → real deterministic, prerequisite-ordered sequence.
5. Open AI Study Plan → real Groq-generated plan, recommending only from the seeded materials list.
6. Open Materials → real curated resources per topic; mark some complete; click "Practice (adapts to your level)" on a topic.
7. Ask the AI Assistant a question, or click "Explain Simply / In Detail / With an Example / Step-by-Step".
8. Complete practice and a follow-up assessment → real new mastery, real path regeneration.
9. Open Progress Hub → real Topic Mastery Map, Learning Path History (before/after comparison), Learning Profile (built from real activity), and click "Analyze My Progress" for a real, data-grounded AI insight.
