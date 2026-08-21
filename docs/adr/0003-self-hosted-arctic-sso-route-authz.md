# 3. Self-hosted Arctic Google SSO; authz in route code

**Status:** Accepted (decided 2026-06-22, recorded retroactively 2026-08-20)
**Sources:** PR #23 (Supabase Auth login flow), PR #40 (arctic auth tables), PR #44 (drop @supabase/supabase-js), migration `20260622000001_arctic_auth.sql`, `apps/nolli/worker/lib/auth/`, `apps/nolli/worker/middleware/auth.ts`

## Context

Authentication started as Supabase Auth behind a feature flag (login flow,
2026-06-07, PR #23). Two weeks later the project pivoted to owning auth
outright: own `users` / `user_accounts` / `sessions` tables plus Google OAuth
via the arctic library running inside the worker (2026-06-22, PRs #40 and #44).
The exact motivation for the pivot is not recorded in any surviving artifact;
the destination is unambiguous in the code.

## Decision

- AuthN: Google OAuth via arctic, handled by worker routes (`/auth/login-google`,
  `/auth/callback-google`, `/auth/me`, `/auth/sign-out`). Server-side sessions
  in the `sessions` table; browser holds an HttpOnly session cookie.
- Users carry a rank-ordered `role`: `user` < `moderator` < `admin`.
- AuthZ: entirely in worker route code — `requireAuth` / `requireRole`
  middleware and `roleRank` comparisons. RLS is enabled on tables with **no
  policies** = default-deny for any non-service-role connection; the worker's
  service-role connection bypasses it regardless.
- Explicitly rejected: authorization via `request.jwt.claims` / `auth.uid()`.
  That is the Supabase-Auth model this project left behind; there are no JWTs.

## Consequences

- The worker owns the whole auth surface: OAuth client secrets, redirect URIs,
  session issuance. That operational configuration lives outside the repo and
  its current deploy state is not recorded here.
- Database-level enforcement is a backstop, not the mechanism — a bug in route
  code is a bug in authorization.
- Permission changes are code changes, not policy changes.
