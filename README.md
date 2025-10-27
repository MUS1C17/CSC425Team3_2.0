# Auth with Supabase — Summary

- Signup: client form posts to /api/auth/signup which uses SUPABASE_SERVICE_ROLE_KEY to create a user.
- Login: client posts to /api/auth/login, server calls Supabase signInWithPassword and sets httpOnly cookies sb-access-token and sb-refresh-token.
- Logout: POST /api/auth/logout clears auth cookies.
- Middleware: Next.js middleware uses @supabase/auth-helpers-nextjs createMiddlewareClient to read cookies and protect /protected routes.
- Dashboard: server component uses createServerComponentClient to get user and render protected UI.

Env vars (local .env):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Run locally:
1. npm install
2. npm run dev
Or with Docker:
1. docker compose up --build