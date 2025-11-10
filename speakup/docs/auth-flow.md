# Authentication Flow (Supabase + Next.js + TypeScript)

This project uses Supabase Auth with cookie-based sessions across the entire Next.js stack (App Router). Supabase securely hashes passwords and stores user records; the app enforces access via middleware and server-side checks — no custom JWT or MongoDB is used.

## Overview
- Registration and login are handled by Supabase via the JS client in UI components.
- Supabase Auth performs password hashing and user storage.
- Sessions are managed with secure cookies; `@supabase/ssr` bridges cookies to Server Components, Route Handlers, and Middleware.
- Middleware restricts access to protected content; unauthenticated users are redirected to the login page.

## Key Files
- Supabase clients
  - `lib/supabase/client.ts`
  - `lib/supabase/server.ts`
- Middleware (session gate)
  - `lib/supabase/middleware.ts`
  - `middleware.ts`
- Auth UI and routes
  - `components/sign-up-form.tsx`
  - `components/login-form.tsx`
  - `components/forgot-password-form.tsx`
  - `components/update-password-form.tsx`
  - `app/auth/login/page.tsx`
  - `app/auth/sign-up/page.tsx`
  - `app/auth/sign-up-success/page.tsx`
  - `app/auth/forgot-password/page.tsx`
  - `app/auth/update-password/page.tsx`
  - `app/auth/error/page.tsx`
  - `app/auth/confirm/route.ts`
- Protected example
  - `app/protected/layout.tsx`
  - `app/protected/page.tsx`

## Environment Variables
Create `.env.local` and set:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_or_publishable_key
```

Notes:
- The code reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` (ensure this is set). Some docs/tools refer to `NEXT_PUBLIC_SUPABASE_ANON_KEY`; either value can be used as long as the one referenced in code is present.
- Do not commit `.env.local` (already in `.gitignore`).

## Registration Flow
1. User completes the form in `components/sign-up-form.tsx`.
2. Client calls `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })`.
3. Supabase Auth securely hashes the password and stores the user record.
4. Supabase emails a confirmation link (OTP). The link targets `app/auth/confirm/route.ts` with `token_hash`, `type`, and an optional `next` path.
5. `GET /auth/confirm` verifies the OTP via `supabase.auth.verifyOtp`. On success, it redirects to `next` (configured to `/protected`).

ASCII sequence (simplified):

```
User → SignUp form → supabase.auth.signUp → Supabase Auth (hash + store)
     ← Email link
Browser → GET /auth/confirm?token_hash&type&next=/protected
          → verifyOtp (server) → 302 → /protected
```

## Login Flow
1. User completes the form in `components/login-form.tsx`.
2. Client calls `supabase.auth.signInWithPassword({ email, password })`.
3. On success, Supabase sets session cookies. The app navigates to `/protected`.

```
User → Login form → supabase.auth.signInWithPassword
     ← Set session cookies
     → /protected
```

## Session Handling
- `@supabase/ssr` is used in `lib/supabase/server.ts` and `lib/supabase/middleware.ts` to read/set cookies correctly in SSR and Middleware contexts.
- `supabase.auth.getClaims()` returns the current user claims when the session is valid. Missing or invalid claims indicate no active session.

## Route Protection
- Middleware (`middleware.ts` → `lib/supabase/middleware.ts`):
  - Builds a server client and calls `supabase.auth.getClaims()`.
  - If the request path is not publicly allowed and no user claims are present, it redirects to `/auth/login`.
  - The matcher in `middleware.ts` excludes static assets and images.
- Server-side check (defense-in-depth):
  - `app/protected/page.tsx` also checks `getClaims()` and redirects unauthenticated users.

## Password Reset and Update
- Forgot password (`components/forgot-password-form.tsx`):
  - Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: <site>/auth/update-password })`.
  - User receives an email with a link leading to the update page.
- Update password (`components/update-password-form.tsx`):
  - Calls `supabase.auth.updateUser({ password })`.
  - On success, the user is routed to `/protected` with an active session.

## Security Notes
- Password hashing and verification are handled entirely by Supabase Auth.
- Sessions are cookie-based; cookies are managed by Supabase and bridged via `@supabase/ssr`.
- Use HTTPS in production and configure your site URL and redirect URLs in the Supabase Dashboard.
- Keep env keys out of version control; rotate keys from the Supabase Dashboard if needed.

## Mapping to Course Rubric
- Registration hashes passwords and stores user data: Satisfied via Supabase Auth (provider-managed hashing + storage).
- Login verifies hashed password and maintains a session (no JWT required): Satisfied via Supabase session cookies.
- Middleware restricts protected routes: Satisfied via `middleware.ts` using Supabase claims.
- Uses `.env` for secure connection and persists user data: Satisfied with Supabase env vars.
