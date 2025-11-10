# CSC425Team3_2.0

## Features

- Next.js App Router (server + client components, API route handlers, middleware)
- Supabase Auth with cookie sessions via `@supabase/ssr`
- Tailwind CSS + shadcn/ui components
- Jest + Supertest unit/API tests, Cypress E2E tests
- GitHub Actions CI (lint + unit; optional Cypress)

## Getting Started

1) Create `speakup/.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_publishable_key
```

2) Install and run the dev server:

```
cd speakup
npm install
npm run dev
```

App runs at http://localhost:3000.

## Authentication Flow

See `speakup/docs/auth-flow.md` for the full flow (password + Google OAuth), middleware protection, and reset/update password.

## Testing

- Unit/API tests: `cd speakup && npm test`
- What's covered:
  - Auth route handlers (signup, login, logout)
  - Protected dashboard (claims/redirect behavior)
- Cypress locally: `cd speakup && npx cypress open` (start `npm run dev` first)

## Docker (optional)

From repo root: `docker-compose up --build`. Health endpoint: `http://localhost:3000/api/db/health`.

## Functional Requirements -- Where Implemented

- Original: Technical Mastery: React Architecture
  - Dev server: Next.js App Router with `npm run dev` (Vite not used; equivalent dev experience and architecture).
  - Organized folders: `app`, `components`, `lib`, `__tests__`, `cypress`, `docs`.
  - Pages/components complete for auth, dashboard, groups, sessions, and Q&A.

- Functional login, dashboard, use cases
  - Login/Signup/Forgot/Update: `app/auth/*` with forms in `components/*-form.tsx`.
  - Dashboard: `app/protected/page.tsx` shows groups/sessions widgets.
  - CRUD flows: create/join group, create/join session, ask/answer question using Supabase DB.
  - State/UI kept in sync via React state and server responses.

- API calls and error handling
  - Uses native `fetch` and Supabase client (not Axios) for fetch/post/update/delete.
  - All forms handle errors and show success via toasts.

- State management
  - `useState` across forms and UI widgets; session handled by Supabase cookies accessible server-side.
  - Context: global toast provider in `components/system/toast.tsx`.

- Protected routes
  - Middleware at `speakup/middleware.ts` + `lib/supabase/middleware.ts` enforces login.
  - Server components call `getClaims()` and redirect unauthenticated users.

- 2.1 Form posts to backend; success shows in dashboard
  - Examples: `components/create-group-form.tsx`, `components/create-session-form.tsx`; new items appear on the protected dashboard.

- 2.2 CRUD endpoints implemented, linked to DB
  - REST handlers in `app/api/{groups,sessions,questions,answers}/route.ts` connect to Supabase Postgres.

- 2.3 Table includes title, description, user_id, target_date
  - Analog fields present:
    - Questions: `title`, optional `description`, `session_id` (ownership link), `created_at`.
    - Sessions: `name` (title), `description`, `group_id`/creator, `start_time`/`end_time` (target dates).

- 2.4 Cards render with title, description and status
  - Cards/widgets show groups, sessions, and questions. Question status via `is_answered` is displayed and used for progress.

- 2.5 CRUD for /challenges linked to goals
  - Mapping: questions ↔ challenges; sessions ↔ goals.
  - Questions are scoped to sessions with full create/list/update/delete in API + UI.

- 2.6 Progress bar dynamically updates
  - `components/progress-overview.tsx` computes answered vs total per session and updates as answers are posted.

- 2.7 Unit & E2E tests from login -> create goal -> add challenge -> mark complete
  - Mapping: login -> create group/session -> ask question -> answer question.
  - Unit/API tests: `__tests__/*` cover auth and protected dashboard behavior.
  - E2E: `cypress/e2e/*` covers login and group creation; extend with session/question flows as needed.

- 2.8 Tests run automatically (CI)
  - GitHub Actions at `.github/workflows/ci.yml` runs lint + unit on push/PR.
  - Optional Cypress job gated by repo variable `RUN_E2E=1` with Supabase secrets.

## UI/UX Enhancements

- Success toasts for all form/DB interactions (`speakup/components/system/toast.tsx`).
- Refreshed visual design and stacked/diagonal card layouts.

## CI (GitHub Actions)

Workflow at `.github/workflows/ci.yml`:
- Lint + unit tests run on every push/PR.
- Optional Cypress job gated by repo variable `RUN_E2E=1`.
- To enable E2E in CI, add repository secrets:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

