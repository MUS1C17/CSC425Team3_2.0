# CSC425Team3_2.0

## Features

- Works across the entire [Next.js](https://nextjs.org) stack
  - App Router
  - Pages Router
  - Middleware
  - Client
  - Server
  - It just works!
- supabase-ssr. A package to configure Supabase Auth to use cookies
- Password-based authentication block installed via the [Supabase UI Library](https://supabase.com/ui/docs/nextjs/password-based-auth)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)
- Optional deployment with [Supabase Vercel Integration and Vercel deploy](#deploy-your-own)
  - Environment variables automatically assigned to Vercel project

## Clone and run locally

1. Navigate to `.env.local` and update the following:

   ```
   NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=[INSERT SUPABASE PUBLISHABLE (ANON) KEY]
   ```

   Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true). This project reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`; if you're used to `NEXT_PUBLIC_SUPABASE_ANON_KEY`, set the publishable key variable instead.

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   Should now be running on [localhost:3000](http://localhost:3000/).

6. Shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Authentication Flow

See `speakup/docs/auth-flow.md` for a diagram and description of:

- Sign-up and login with Supabase (password hashing + storage)
- Session cookies and SSR access via `@supabase/ssr`
- Middleware route protection and redirects
- Password reset and update flow
- Required environment variables

## Testing (Story 1.7)

- Install deps in `speakup`: `cd speakup && npm install`
- Run tests: `npm test`
- What’s covered:
  - `POST /api/auth/signup` success and duplicate user
  - `POST /api/auth/login` valid and invalid credentials
  - `POST /api/auth/logout` success

Notes:
- Tests mock the Supabase server client so they run offline and fast.
- Handlers are exercised over HTTP via Supertest using a lightweight test server adapter.

## Docker Compose (Story 1.8)

- Prerequisites: Docker + Docker Compose installed.
- From repo root, start everything: `docker-compose up --build`
- Services:
  - `db`: Postgres 15 on `http://localhost:3000/api/db/health` (user/password: `postgres`)
  - `web`: Next.js app on `http://localhost:3000`
- Environment:
  - The `web` service reads `speakup/.env.local` for Supabase envs.
  - Database URL is prewired as `DATABASE_URL=postgres://postgres:postgres@db:5432/appdb`.

Verify DB connectivity:
- Visit `http://localhost:3000/api/db/health` to see `{ ok: true }` when the app reaches the DB.

Using Supabase locally (optional):
- This project uses Supabase Auth. For a fully local stack, use the Supabase CLI (`supabase start`) which launches the Supabase services via Docker. Then point `NEXT_PUBLIC_SUPABASE_URL` and the publishable key to your local Supabase instance.
