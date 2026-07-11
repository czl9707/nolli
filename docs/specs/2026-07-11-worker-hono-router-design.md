# Worker routing → Hono migration

**Date:** 2026-07-11
**Branch:** `feat/worker-hono-router` (off `main` @ `9dd15d1`)
**Scope:** `apps/nolli/worker/` only

## Goal

Replace the Cloudflare Worker's homegrown file-glob router with **Hono**, to get structured routing, a middleware layer, and a clean testing seam — ahead of further route growth.

The messiest existing handler (`routes/api/submissions/index.ts`) dispatches `/api/submissions`, `/:id`, and `/:id/decision` via hand-rolled `url.pathname` slicing and `Number(tail)` parsing. Auth (`getAuthenticatedUser` + `requireRole`) and the Postgres connection are re-opened inside every one of the 8 route handlers, because there is no middleware layer. This migration removes all of that.

## Decisions (from brainstorming)

- **Framework:** Hono. (Considered: itty-router — less middleware ergonomics; keep-homebrew + `:id` matcher — no middleware or testability gains.)
- **Rollout:** Big-bang, single PR. All 8 routes + the dispatcher converted at once.
- **Testing ambition:** *Testable-later* — no tests written in this migration. Structure the code so tests are easy to add later (injectable deps on the Hono context, no ambient-global reliance in handlers).
- **Branch:** fresh off `main`, independent of the submission feature.

## Non-goals

- Writing tests now (only leaving the seam for them).
- Touching business logic in `lib/submissions.ts`, `lib/favorites.ts`, etc.
- Changing the DB schema, `wrangler.jsonc`, the frontend, or HTTP response contracts.
- Changing auth semantics (same status codes, same owner-or-moderator rules).
- Introducing a test database or vitest config.

## Architecture

### Typed context — the testability seam

New file `worker/lib/app-env.ts`:

```ts
import type { Sql } from "@worker/lib/data/db";
import type { User } from "@worker/lib/users";

export type AppEnv = {
  Bindings: Env;            // c.env → existing ambient Env type (unchanged)
  Variables: {
    sql: Sql;               // injected by db middleware
    user: User | null;      // injected by resolveUser middleware
  };
};
```

Handlers read `c.get("sql")` / `c.get("user")` instead of constructing them from ambient state. This is what makes a future test able to swap the `Sql` for a fake and stub the user — no real Postgres, no network, invoked in-process via `app.request(...)`.

### Entrypoint

`worker/index.ts` becomes a mounted Hono app with the static-asset fallback preserved:

```ts
import { Hono } from "hono";
import type { AppEnv } from "@worker/lib/app-env";
import { db, resolveUser } from "@worker/middleware";
import { app as apiApp } from "@worker/routes/api";
import { app as authApp } from "@worker/routes/auth";

const app = new Hono<AppEnv>();
app.use("*", db, resolveUser);
app.route("/api", apiApp);
app.route("/auth", authApp);

// No route matched → delegate to static assets / SPA (preserves current fallthrough).
app.notFound((c) => c.env.ASSETS.fetch(c.req.raw));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "internal server error" }, 500);
});

export default {
  fetch: (req, env, ctx) => app.fetch(req, env, ctx),
};
```

### Middleware

New `worker/middleware/` directory. Two global middleware applied once at the top, plus two guard factories used per-route.

**`db`** — opens one Postgres connection per request and auto-closes it after the handler returns. The `await using` (AsyncDisposable) is scoped to the middleware function, so disposal runs after `await next()` completes — this is the behavioral assumption to verify on the real build (see Risks).

```ts
import { connect, type Sql } from "@worker/lib/data/db";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "@worker/lib/app-env";

export const db: MiddlewareHandler<AppEnv> = async (c, next) => {
  await using sql = connect(c.env.DATABASE_URL);
  c.set("sql", sql);
  await next();
};
```

**`resolveUser`** — resolves whoever is logged in (or `null`) and stores them on the context. Never rejects — whether auth is required is a per-route concern.

```ts
import { getAuthenticatedUser } from "@worker/lib/auth/sessions";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "@worker/lib/app-env";

export const resolveUser: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set("user", await getAuthenticatedUser(c.get("sql"), c.req.raw));
  await next();
};
```

**`requireAuth`** and **`requireRole(min)`** — guard factories replacing the inline `if (!user) return unauthorized()` / `requireRole(...)` boilerplate repeated across handlers today. `requireRole` preserves the current `lib/auth/authz.ts` semantics: 401 if logged-out, 403 if role insufficient.

```ts
import { unauthorized, forbidden } from "@worker/lib/data/http";
import { roleRank, type Role } from "@worker/lib/auth/authz";
// requireAuth → 401 when c.get("user") is null
// requireRole(min) → 401 when null, 403 when roleRank(user.role) < roleRank(min)
```

`roleRank` / role ordering is extracted from the existing `requireRole` logic in `lib/auth/authz.ts` so both the guard factory and any in-handler role checks share one source of truth.

### Route module structure

The "one `index.ts` per URL, discovered via `import.meta.glob` longest-prefix match" pattern becomes **per-area modules that each export a Hono sub-app**, mounted explicitly by a parent.

Example — `routes/api/submissions/index.ts` (the messiest handler) collapses from ~35 lines of `tail`-slicing into declarative route declarations:

```ts
import { Hono } from "hono";
import type { AppEnv } from "@worker/lib/app-env";
import { requireAuth, requireRole } from "@worker/middleware";
import { json, badRequest, notFound } from "@worker/lib/data/http";
import { ValidationError, NotFoundOrLocked, /* … */ } from "@worker/lib/submissions";

export const app = new Hono<AppEnv>();

app.post("/",  requireAuth,            async (c) => { /* create */ });
app.get("/",   requireRole("moderator"), async (c) => { /* queue */ });
app.post("/:id/decision", requireRole("moderator"), async (c) => { /* decide */ });
app.get("/:id",                        async (c) => { /* show: owner-or-mod logic stays here */ });
app.patch("/:id", requireAuth,         async (c) => { /* update */ });
```

Mounted by `routes/api/index.ts`:

```ts
import { Hono } from "hono";
import type { AppEnv } from "@worker/lib/app-env";
import { app as favorites } from "./favorites";
import { app as submissions } from "./submissions";

export const app = new Hono<AppEnv>()
  .route("/favorites", favorites)
  .route("/submissions", submissions);
```

…and similarly `routes/auth/index.ts` mounts `login/google`, `callback/google`, `me`, `sign-out`.

#### Subtle correctness win

Today `/api/submissions/mine` works only because the homebrew router's longest-prefix match lets the `mine/` folder *accidentally* win over the numeric-`id` branch. Under Hono, `/submissions/mine` and `/submissions/:id` are explicit sibling routes; Hono matches static segments before params, so `mine` wins **by design**. The accidental coupling is removed.

## Handler mechanics

- **DB + user:** `c.get("sql")`, `c.get("user")` — injected, no per-handler setup.
- **Path params:** `c.req.param("id")` instead of `Number(tail.split("/")[0])`.
- **Body:** `await c.req.json()`. Current handlers swallow JSON parse errors via `.catch(() => null)`; this tolerant behavior is preserved (wrap `c.req.json()` accordingly).
- **Responses:** existing canned helpers (`json`, `badRequest`, `unauthorized`, `forbidden`, `notFound`, `methodNotAllowed`) are kept — they return plain `Response` objects, which Hono handlers and guards may return directly. `c.json(...)` is used where idiomatic (e.g. the error handler).
- **Cookies:** `auth/callback/google` and `auth/sign-out` attach `Set-Cookie` via `appendSetCookie` on a constructed `Response`; verify Hono passes headers through on returned `Response` objects (see Risks).
- **Query params:** `auth/callback/google` reads `code`/`state` via `c.req.query(...)` instead of `url.searchParams` — behavior identical.

## What changes

All inside `apps/nolli/worker/`:

- `worker/index.ts` — rewritten as the Hono entrypoint + asset fallback + error handler.
- New: `lib/app-env.ts`, `middleware/index.ts` (or `middleware/db.ts` + `middleware/auth.ts`).
- All 8 `routes/**/index.ts` → restructured into mounted Hono sub-apps. Glob-discovery removed.
- `routes/route.type.ts` — deleted (Hono's types replace `RouteHandler`).
- `lib/auth/authz.ts` — `roleRank` extracted (or added) so the guard factory shares it. The existing `requireRole(user, min)` function is kept if other call sites still use it, or removed if fully superseded (decide during build).
- New dependency: `hono`.

## What does NOT change

- `lib/submissions.ts`, `lib/favorites.ts`, `lib/users.ts`, `lib/apply-submissions.ts` — pure logic, untouched.
- `lib/data/db.ts` (`connect`), `lib/auth/sessions.ts` (`getAuthenticatedUser`), `lib/data/http.ts`, `lib/data/cookies.ts`, `lib/data/r2.ts`.
- `worker/env.d.ts` (the ambient `Env` is reused as `Bindings`).
- `wrangler.jsonc` (`run_worker_first`, `nodejs_compat`, SPA fallback all unchanged).
- The frontend, the DB schema, and every HTTP response contract.

## Testability outcomes (no tests written now)

- Handlers depend only on the Hono context — no ambient globals, no per-handler connection/auth derivation.
- Any route can be invoked in-process later via `app.request(path, { method, body, headers })`.
- A future test can swap the `db` middleware for one that injects a fake `Sql`, and `resolveUser` for a stub that sets a fixed user — avoiding real Postgres and real auth.
- The seam is what this migration leaves behind; standing up vitest + a test DB is a separate future task.

## Risks / verification

1. **DB connection disposal** — confirm the `await using sql` in the `db` middleware actually disposes after `await next()` completes (AsyncDisposable scoping rules). This is the one behavioral assumption to verify during build, since today each handler scopes its own `await using`.
2. **ASSETS fallback** — must wire `app.notFound` to delegate to `env.ASSETS.fetch(...)`, or the SPA silently breaks.
3. **Invalid JSON tolerance** — preserve the current `.catch(() => null)` behavior around body parsing; don't let `c.req.json()` throw 500s on malformed input.
4. **Set-Cookie passthrough** — verify Hono forwards `Set-Cookie` headers on `Response` objects returned from handlers (the OAuth callback and sign-out depend on it).
5. **Owner-or-moderator checks** — `submissions.show` allows the submitter OR a moderator; this per-route logic stays in the handler, not in a guard.
6. **Verification approach** — typecheck with `tsc -p tsconfig.worker.json --noEmit` (the repo's `typecheck` script is a no-op), plus a `wrangler dev` smoke drive hitting each of the 8 route paths to confirm status codes and response shapes match current behavior.
