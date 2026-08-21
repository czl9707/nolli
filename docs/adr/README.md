# Architecture Decision Records

Recorded retroactively on 2026-08-20 from git history and surviving local
artifacts — see each record's Status and Sources lines. Numbered for reading
order (foundation → platform → data), not by decision date.

| # | Decision |
|---|----------|
| [0001](0001-pnpm-monorepo-layout.md) | pnpm-workspace monorepo: `apps/` deployables + `packages/` shared code |
| [0002](0002-cloudflare-worker-supabase-r2-platform.md) | Single Cloudflare Worker (Hono) + Supabase Postgres service-role + R2 native bindings |
| [0003](0003-self-hosted-arctic-sso-route-authz.md) | Self-hosted Arctic Google SSO, cookie sessions, authz in route code, no JWT/RLS-claims |
| [0004](0004-baked-sqlite-map-read-path.md) | Writes to Postgres, map reads from baked SQLite on R2; bake is manual |
| [0005](0005-submission-moderation-backend.md) | Submission flow: R2 staging → moderation queue → transactional apply on approve |
