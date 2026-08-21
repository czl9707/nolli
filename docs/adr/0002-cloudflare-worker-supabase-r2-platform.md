# 2. Platform: Cloudflare Worker (Hono) + Supabase Postgres + R2

**Status:** Accepted (decided 2026-06-01, evolved through 2026-07-11, recorded retroactively 2026-08-20)
**Sources:** PR #11 (Workers config), PR #77 (Hono), `apps/nolli/wrangler.jsonc`, `apps/nolli/worker/`

## Context

One deployable had to serve the SPA, the API, auth, and image uploads, with
minimal ops. Supabase provides the managed Postgres; object storage with public
reads (images, baked db) landed on R2. Workers config first landed 2026-06-01
(PR #11).

## Decision

- Single Cloudflare Worker (`apps/nolli/worker`) serves the built SPA (assets
  binding) plus `/api/*` and `/auth/*`.
- Routing: originally a hand-rolled file-router with tail dispatch; replaced
  2026-07-11 (PR #77) by **Hono** with scoped middleware — `db` puts `sql` on
  the context, `auth` puts `user`, `r2` puts an `R2Context`. Handlers read
  `c.get("sql")` / `c.get("user")`; tests use `app.request()`.
- Database: Supabase Postgres via postgres.js over one **service-role**
  connection (`DATABASE_URL`). There is no per-user database identity — the
  worker is trusted.
- R2: **native bucket bindings** from `wrangler.jsonc` (`IMAGES` =
  nolli-map-images, `IMAGE_STAGING` = nolli-map-images-staging). No S3 client
  and no credentials in the worker; cross-bucket copy is get→put streamed
  through the worker (binding `copy()` is same-bucket only). Node-side scripts
  (bake, seed) still use `@aws-sdk/client-s3` — bindings don't exist outside
  the runtime. Public image URLs resolve via `R2_PUBLIC_IMAGES_URL`.

## Consequences

- The service-role connection means the database does not defend itself:
  all authorization lives in worker route code (ADR 0003), with default-deny
  RLS as a backstop only.
- Native bindings keep the worker secret-light but tie API code to the
  Workers runtime — `wrangler dev` is required for real request-path work.
- One worker = one deploy unit and one blast radius; SPA and API ship together.
