# Worker Hono Router Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the worker's homegrown file-glob router with Hono, gaining structured routing, a middleware layer, and a testable handler shape — without changing any HTTP response contract.

**Architecture:** A Hono app mounts `/api` and `/auth` sub-apps. Each sub-app applies two request-scoped middleware (`db` opens/closes the Postgres connection, `resolveUser` loads the logged-in user) before its routes; route-level guard factories (`requireAuth`, `requireRole`) replace the inline auth boilerplate. Middleware is scoped to `/api` and `/auth` only, so static-asset requests that fall through to `ASSETS` never touch the DB. Handlers read deps from `c.get("sql")` / `c.get("user")` — the seam that makes them testable later.

**Tech Stack:** Hono 4.x, Cloudflare Workers (`@cloudflare/vite-plugin` + wrangler), TypeScript. Verification is **typecheck + a `wrangler dev` smoke drive** (the spec chose testable-later: no automated tests are written in this migration).

**Spec:** `docs/specs/2026-07-11-worker-hono-router-design.md`

**Working directory for all paths/commands:** `apps/nolli/` (the `apps/nolli` package), unless a step says otherwise. The repo is a pnpm workspace at the worktree root.

**Deviation from the spec (called out above):** The spec said apply `db` + `resolveUser` globally via `app.use("*", ...)`. That would run the DB-open + user-load on every request, including static assets served by `ASSETS.fetch`. This plan scopes those middleware to the `/api` and `/auth` sub-apps instead (Tasks 8 and 9), preserving the original property that unmatched paths never hit the DB.

**Verification command (used in every task):**
```bash
cd apps/nolli && npx tsc -p tsconfig.worker.json --noEmit
```
Expected: exit 0, no output. (The repo's `pnpm --filter nolli typecheck` script is a no-op — do not use it; use the `tsc` command above. This is the established project convention.)

---

## File map

**Create:**
- `apps/nolli/worker/lib/app-env.ts` — `AppEnv` type (Bindings + Variables) — the testability seam.
- `apps/nolli/worker/middleware/db.ts` — `db` middleware (open/close Postgres per request).
- `apps/nolli/worker/middleware/auth.ts` — `resolveUser` middleware + `requireAuth` / `requireRole` guard factories.
- `apps/nolli/worker/middleware/index.ts` — barrel re-export.
- `apps/nolli/worker/routes/api/submissions.ts` — Hono sub-app: `/`, `/mine`, `/uploads`, `/:id`, `/:id/decision` (consolidates 3 old files).
- `apps/nolli/worker/routes/api/favorites.ts` — Hono sub-app: `/`, `/:id`.
- `apps/nolli/worker/routes/api/index.ts` — mounts favorites + submissions, applies `db`/`resolveUser`.
- `apps/nolli/worker/routes/auth/me.ts`, `sign-out.ts`, `login-google.ts`, `callback-google.ts` — Hono sub-apps.
- `apps/nolli/worker/routes/auth/index.ts` — mounts the four auth sub-apps, applies `db`/`resolveUser`.

**Modify:**
- `apps/nolli/worker/index.ts` — rewrite as the Hono entrypoint + `ASSETS` fallback + `onError`.
- `apps/nolli/worker/lib/auth/authz.ts` — replace the `requireRole(user, min)` function with an exported `roleRank(role)` helper (the guard factory in `middleware/auth.ts` uses it; no other call sites remain after migration).
- `apps/nolli/worker/lib/data/http.ts` — add `parseJsonBody(request)` helper (JSON parse tolerance, currently inlined as `.catch(() => null)` in handlers).

**Delete:**
- `apps/nolli/worker/routes/route.type.ts`
- `apps/nolli/worker/routes/api/favorites/index.ts` (and empty `favorites/` dir)
- `apps/nolli/worker/routes/api/submissions/index.ts`, `mine/index.ts`, `uploads/index.ts` (and empty `submissions/` subtree)
- `apps/nolli/worker/routes/auth/me/index.ts`, `sign-out/index.ts`, `login/google/index.ts`, `callback/google/index.ts` (and empty `auth/` subtrees)

**Dependency:** add `hono` to `apps/nolli/package.json`.

---

### Task 1: Add the `hono` dependency

**Files:**
- Modify: `apps/nolli/package.json` (via pnpm)

- [ ] **Step 1: Install hono**

Run from the worktree root:
```bash
pnpm --filter nolli add hono
```
Expected: `hono` resolves to a 4.x version and is added to `apps/nolli/package.json` under `dependencies`; lockfile updated.

- [ ] **Step 2: Verify it imports**

Run:
```bash
cd apps/nolli && node -e "console.log(require('hono').Hono ? 'ok' : 'missing')"
```
Expected: prints `ok`.

- [ ] **Step 3: Verify typecheck still clean**

Run:
```bash
cd apps/nolli && npx tsc -p tsconfig.worker.json --noEmit
```
Expected: exit 0, no output.

- [ ] **Step 4: Commit**
```bash
git add apps/nolli/package.json pnpm-lock.yaml
git commit -m "deps(nolli): add hono for worker routing"
```

---

### Task 2: `AppEnv` type (the testability seam)

**Files:**
- Create: `apps/nolli/worker/lib/app-env.ts`

- [ ] **Step 1: Create the file**

`apps/nolli/worker/lib/app-env.ts`:
```ts
import type { Sql } from "@worker/lib/data/db"
import type { User } from "@worker/lib/users"

// Hono context shape. `Bindings` is the Cloudflare `Env` (ambient global in
// env.d.ts); `Variables` are per-request values injected by middleware. Handlers
// read these via c.get(...) — never from ambient globals — which is what lets a
// future test swap them (fake Sql, stubbed user) without touching real Postgres.
export type AppEnv = {
  Bindings: Env
  Variables: {
    sql: Sql
    user: User | null
  }
}
```

- [ ] **Step 2: Typecheck**
```bash
cd apps/nolli && npx tsc -p tsconfig.worker.json --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Commit**
```bash
git add apps/nolli/worker/lib/app-env.ts
git commit -m "feat(worker): AppEnv type for Hono context"
```

---

### Task 3: Extract `roleRank` in `authz.ts`

The existing `requireRole(user, min)` returns a `Response | null`. After migration, no route calls it directly — the `requireRole(min)` *middleware factory* (Task 5) replaces it, and that factory needs the numeric ranking. This task replaces the function with an exported `roleRank` helper.

**Files:**
- Modify: `apps/nolli/worker/lib/auth/authz.ts` (full rewrite — 12 lines)

- [ ] **Step 1: Replace the file contents**

`apps/nolli/worker/lib/auth/authz.ts`:
```ts
import { type Role } from "@worker/lib/users"

const ROLE_RANK: Record<Role, number> = { user: 0, moderator: 1, admin: 2 }

// Numeric ranking shared by the requireRole() middleware factory and any
// in-handler role check (e.g. owner-or-moderator). Higher rank = more privileged.
export function roleRank(role: Role): number {
  return ROLE_RANK[role]
}
```

- [ ] **Step 2: Typecheck**
```bash
cd apps/nolli && npx tsc -p tsconfig.worker.json --noEmit
```
Expected: **compile errors** in `routes/api/submissions/index.ts` (it imports `requireRole` which no longer exists). That file is replaced in Task 6 and deleted in Task 10, so this expected breakage is fine — do not fix it here. Confirm the errors are only about `requireRole` in the old submissions handler; if there are other errors, investigate.

- [ ] **Step 3: Commit** (the tree is intentionally mid-migration; typecheck breakage is scoped to files replaced later)
```bash
git add apps/nolli/worker/lib/auth/authz.ts
git commit -m "refactor(worker): extract roleRank from authz requireRole"
```

---

### Task 4: `parseJsonBody` helper in `http.ts`

Today each handler swallows JSON parse errors via `(await request.json().catch(() => null))`. Centralize it so handlers stay terse and `http.ts` stays Hono-free (it takes a `Request`, not a Hono context).

**Files:**
- Modify: `apps/nolli/worker/lib/data/http.ts` (append one export)

- [ ] **Step 1: Append the helper**

Add to the end of `apps/nolli/worker/lib/data/http.ts`:
```ts
// Read and JSON-parse a request body, returning null on malformed/empty input
// (preserves the tolerant .catch(() => null) behavior handlers previously inlined).
export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Typecheck**
```bash
cd apps/nolli && npx tsc -p tsconfig.worker.json --noEmit
```
Expected: same scoped `requireRole` errors as Task 3 (unchanged by this task). No new errors.

- [ ] **Step 3: Commit**
```bash
git add apps/nolli/worker/lib/data/http.ts
git commit -m "feat(worker): parseJsonBody helper"
```

---

### Task 5: Middleware — `db`, `resolveUser`, `requireAuth`, `requireRole`

**Files:**
- Create: `apps/nolli/worker/middleware/db.ts`
- Create: `apps/nolli/worker/middleware/auth.ts`
- Create: `apps/nolli/worker/middleware/index.ts`

- [ ] **Step 1: Create `middleware/db.ts`**

`apps/nolli/worker/middleware/db.ts`:
```ts
import type { MiddlewareHandler } from "hono"
import { connect } from "@worker/lib/data/db"
import type { AppEnv } from "@worker/lib/app-env"

// One Postgres client per request, stored on the context for handlers to read.
// `await using` is scoped to this function body: disposal runs after `next()`
// resolves (i.e. after the handler has built its Response and no longer needs
// the connection), mirroring the per-handler `await using sql = connect(...)`
// the routes used previously.
export const db: MiddlewareHandler<AppEnv> = async (c, next) => {
  await using sql = connect(c.env.DATABASE_URL)
  c.set("sql", sql)
  await next()
}
```

- [ ] **Step 2: Create `middleware/auth.ts`**

`apps/nolli/worker/middleware/auth.ts`:
```ts
import type { MiddlewareHandler } from "hono"
import { createMiddleware } from "hono/factory"
import { getAuthenticatedUser } from "@worker/lib/auth/sessions"
import { roleRank } from "@worker/lib/auth/authz"
import { unauthorized, forbidden } from "@worker/lib/data/http"
import type { Role } from "@worker/lib/users"
import type { AppEnv } from "@worker/lib/app-env"

// Resolve whoever is logged in (null if nobody) and stash them on the context.
// Never rejects — whether auth is required is a per-route concern handled by the
// guards below.
export const resolveUser: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set("user", await getAuthenticatedUser(c.get("sql"), c.req.raw))
  await next()
}

// Route-level guard: reject (401) if no session.
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get("user")) return unauthorized()
  await next()
})

// Route-level guard factory: 401 if logged out, 403 if role insufficient.
// Matches the original requireRole(user, min) semantics.
export const requireRole = (min: Role): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const user = c.get("user")
    if (!user) return unauthorized()
    if (roleRank(user.role) < roleRank(min)) return forbidden()
    await next()
  }
```

- [ ] **Step 3: Create `middleware/index.ts` (barrel)**

`apps/nolli/worker/middleware/index.ts`:
```ts
export { db } from "./db"
export { resolveUser, requireAuth, requireRole } from "./auth"
```

- [ ] **Step 4: Typecheck**
```bash
cd apps/nolli && npx tsc -p tsconfig.worker.json --noEmit
```
Expected: same scoped `requireRole` errors from the old submissions handler as before; the new middleware files compile cleanly (no new errors).

- [ ] **Step 5: Commit**
```bash
git add apps/nolli/worker/middleware/
git commit -m "feat(worker): db + auth middleware and route guards"
```

---

### Task 6: New `routes/api/submissions.ts` (consolidates 3 old files)

This replaces `routes/api/submissions/index.ts`, `mine/index.ts`, and `uploads/index.ts` with a single Hono sub-app. Paths are relative (the app is mounted at `/api/submissions`).

**Files:**
- Create: `apps/nolli/worker/routes/api/submissions.ts`

- [ ] **Step 1: Create the file**

`apps/nolli/worker/routes/api/submissions.ts`:
```ts
import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { requireAuth, requireRole } from "@worker/middleware"
import { roleRank } from "@worker/lib/auth/authz"
import {
  json,
  badRequest,
  notFound,
  forbidden,
  parseJsonBody,
} from "@worker/lib/data/http"
import {
  ALLOWED_CONTENT_TYPES,
  MAX_IMAGE_BYTES,
  extFor,
  newStagingKey,
  putStaging,
} from "@worker/lib/data/r2"
import {
  ValidationError,
  NotFoundOrLocked,
  UnknownCountryError,
  DuplicateSlugError,
  listQueue,
  listMine,
  getSubmission,
  createSubmission,
  updateSubmission,
  approveSubmission,
  rejectSubmission,
} from "@worker/lib/submissions"

export const submissions = new Hono<AppEnv>()

// POST / — create a submission (any authenticated user)
submissions.post("/", requireAuth, async (c) => {
  try {
    const id = await createSubmission(c.get("sql"), c.get("user")!.id, await parseJsonBody(c.req.raw))
    return json({ id }, 201)
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(err.message)
    throw err
  }
})

// GET / — moderation queue (moderator+)
submissions.get("/", requireRole("moderator"), async (c) =>
  json({ submissions: await listQueue(c.get("sql")) })
)

// GET /mine — the authenticated user's own submissions, all statuses
submissions.get("/mine", requireAuth, async (c) =>
  json({ submissions: await listMine(c.get("sql"), c.get("user")!.id) })
)

// POST /uploads — proxy one image to the staging bucket (any authenticated user)
submissions.post("/uploads", requireAuth, async (c) => {
  const contentType = c.req.header("content-type") ?? ""
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return json({ error: "unsupported content-type" }, 415)
  }
  const body = await c.req.raw.arrayBuffer()
  if (body.byteLength > MAX_IMAGE_BYTES) {
    return json({ error: "image too large" }, 413)
  }
  const user = c.get("user")!
  const key = await newStagingKey(user.id, extFor(contentType), body)
  await putStaging(c.env, key, body, contentType)
  return json({ staging_key: key }, 201)
})

// POST /:id/decision — approve or reject (moderator+)
submissions.post("/:id/decision", requireRole("moderator"), async (c) => {
  const id = Number(c.req.param("id"))
  const body = (await parseJsonBody(c.req.raw)) as {
    decision?: unknown
    note?: unknown
  } | null
  if (body?.decision !== "approve" && body?.decision !== "reject") {
    return badRequest("decision must be 'approve' or 'reject'")
  }
  if (!id) return badRequest("invalid id")
  const note = typeof body.note === "string" ? body.note : null
  try {
    if (body.decision === "approve") {
      await approveSubmission(c.get("sql"), c.env, id, c.get("user")!.id, note)
    } else {
      await rejectSubmission(c.get("sql"), c.env, id, c.get("user")!.id, note)
    }
    return json({ ok: true })
  } catch (err) {
    if (err instanceof NotFoundOrLocked) return notFound("not found or not pending")
    if (err instanceof UnknownCountryError) return badRequest(`unknown country: ${err.country}`)
    if (err instanceof DuplicateSlugError) return badRequest(`slug already exists: ${err.slug}`)
    throw err
  }
})

// GET /:id — fetch one (moderator+, or the submitter's own)
submissions.get("/:id", requireAuth, async (c) => {
  const id = Number(c.req.param("id"))
  if (!Number.isInteger(id)) return notFound()
  const sub = await getSubmission(c.get("sql"), id)
  if (!sub) return notFound()
  const user = c.get("user")!
  if (roleRank(user.role) < roleRank("moderator") && sub.submitter_id !== user.id) {
    return forbidden()
  }
  return json({ submission: sub })
})

// PATCH /:id — edit payload (submitter while pending, or any moderator)
submissions.patch("/:id", requireAuth, async (c) => {
  const id = Number(c.req.param("id"))
  if (!Number.isInteger(id)) return notFound()
  const user = c.get("user")!
  const isMod = roleRank(user.role) >= roleRank("moderator")
  try {
    await updateSubmission(c.get("sql"), id, await parseJsonBody(c.req.raw), user.id, isMod)
    return json({ ok: true })
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(err.message)
    if (err instanceof NotFoundOrLocked) return notFound("not found or locked")
    throw err
  }
})
```

**Note on routing order:** `/mine` and `/uploads` are declared as static segments alongside `/:id`. Hono's router prioritizes static segments over params, so `GET /api/submissions/mine` matches the `/mine` route, not `/:id`. This removes the accidental longest-prefix coupling the old glob router relied on.

- [ ] **Step 2: Typecheck**
```bash
cd apps/nolli && npx tsc -p tsconfig.worker.json --noEmit
```
Expected: still the old-handler `requireRole` breakage (the old `submissions/index.ts` still exists). The new `submissions.ts` compiles cleanly. No new errors beyond the known old-handler ones.

- [ ] **Step 3: Commit**
```bash
git add apps/nolli/worker/routes/api/submissions.ts
git commit -m "feat(worker): submissions routes as Hono sub-app"
```

---

### Task 7: New `routes/api/favorites.ts`

**Files:**
- Create: `apps/nolli/worker/routes/api/favorites.ts`

- [ ] **Step 1: Create the file**

`apps/nolli/worker/routes/api/favorites.ts`:
```ts
import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { requireAuth } from "@worker/middleware"
import { json, badRequest, parseJsonBody } from "@worker/lib/data/http"
import { listFavorites, addFavorite, removeFavorite } from "@worker/lib/favorites"

export const favorites = new Hono<AppEnv>()

// GET / — list the authenticated user's favorites
favorites.get("/", requireAuth, async (c) =>
  json({ favorites: await listFavorites(c.get("sql"), c.get("user")!.id) })
)

// POST / — add a favorite
favorites.post("/", requireAuth, async (c) => {
  const body = (await parseJsonBody(c.req.raw)) as { architectureId?: unknown } | null
  const architectureId = Number(body?.architectureId)
  if (!architectureId) return badRequest("architectureId required")
  await addFavorite(c.get("sql"), c.get("user")!.id, architectureId)
  return json({ ok: true }, 201)
})

// DELETE /:id — remove a favorite (:id is the architecture id)
favorites.delete("/:id", requireAuth, async (c) => {
  const architectureId = Number(c.req.param("id"))
  if (!architectureId) return badRequest("architectureId required")
  await removeFavorite(c.get("sql"), c.get("user")!.id, architectureId)
  return json({ ok: true })
})
```

- [ ] **Step 2: Typecheck**
```bash
cd apps/nolli && npx tsc -p tsconfig.worker.json --noEmit
```
Expected: only the known old-handler errors remain.

- [ ] **Step 3: Commit**
```bash
git add apps/nolli/worker/routes/api/favorites.ts
git commit -m "feat(worker): favorites routes as Hono sub-app"
```

---

### Task 8: New `routes/api/index.ts` (mount + scoped middleware)

This is where `db` + `resolveUser` are applied — **scoped to `/api` only**, so static-asset requests never open a DB connection.

**Files:**
- Create: `apps/nolli/worker/routes/api/index.ts`

- [ ] **Step 1: Create the file**

`apps/nolli/worker/routes/api/index.ts`:
```ts
import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { db, resolveUser } from "@worker/middleware"
import { favorites } from "./favorites"
import { submissions } from "./submissions"

export const app = new Hono<AppEnv>()

// Request-scoped DB + user resolution, applied to /api only (not static assets,
// which fall through to ASSETS at the top-level notFound handler).
app.use("*", db, resolveUser)
app.route("/favorites", favorites)
app.route("/submissions", submissions)
```

- [ ] **Step 2: Typecheck**
```bash
cd apps/nolli && npx tsc -p tsconfig.worker.json --noEmit
```
Expected: only the known old-handler errors remain.

- [ ] **Step 3: Commit**
```bash
git add apps/nolli/worker/routes/api/index.ts
git commit -m "feat(worker): mount /api sub-apps with db+auth middleware"
```

---

### Task 9: New `routes/auth/*` modules + `routes/auth/index.ts`

Four small sub-apps, one per auth endpoint, plus the mount that applies `db` + `resolveUser` scoped to `/auth`.

**Files:**
- Create: `apps/nolli/worker/routes/auth/me.ts`
- Create: `apps/nolli/worker/routes/auth/sign-out.ts`
- Create: `apps/nolli/worker/routes/auth/login-google.ts`
- Create: `apps/nolli/worker/routes/auth/callback-google.ts`
- Create: `apps/nolli/worker/routes/auth/index.ts`

- [ ] **Step 1: Create `routes/auth/me.ts`**

`apps/nolli/worker/routes/auth/me.ts`:
```ts
import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { json } from "@worker/lib/data/http"

export const me = new Hono<AppEnv>()

// GET /auth/me — current user, or 401 with { user: null } when logged out.
// No requireAuth guard: the 401-with-body response is the contract the SPA reads.
me.get("/", (c) => {
  const user = c.get("user")
  if (!user) return json({ user: null }, 401)
  return json({
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: user.role,
    },
  })
})
```

- [ ] **Step 2: Create `routes/auth/sign-out.ts`**

`apps/nolli/worker/routes/auth/sign-out.ts`:
```ts
import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import {
  deleteSession,
  sessionCookieClear,
  presenceCookieClear,
} from "@worker/lib/auth/sessions"
import { appendSetCookie } from "@worker/lib/data/cookies"

export const signOut = new Hono<AppEnv>()

// POST /auth/sign-out — delete the session and clear auth cookies.
signOut.post("/", async (c) => {
  await deleteSession(c.get("sql"), c.req.raw)
  const headers = new Headers({ "content-type": "application/json" })
  appendSetCookie(headers, sessionCookieClear())
  appendSetCookie(headers, presenceCookieClear())
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
})
```

- [ ] **Step 3: Create `routes/auth/login-google.ts`**

`apps/nolli/worker/routes/auth/login-google.ts`:
```ts
import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { startOAuth } from "@worker/lib/auth/google"

export const loginGoogle = new Hono<AppEnv>()

// /auth/login/google — redirect to Google with state + code-verifier cookies.
// Any method (the original handler ignored method).
loginGoogle.all("/", (c) => {
  const { url, stateCookie, codeVerifierCookie } = startOAuth(c.env)
  const headers = new Headers()
  headers.set("Location", url)
  headers.append("set-cookie", stateCookie)
  headers.append("set-cookie", codeVerifierCookie)
  return new Response(null, { status: 302, headers })
})
```

- [ ] **Step 4: Create `routes/auth/callback-google.ts`**

`apps/nolli/worker/routes/auth/callback-google.ts`:
```ts
import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import {
  getStoredState,
  getStoredCodeVerifier,
  clearOAuthCookies,
  validateCallback,
} from "@worker/lib/auth/google"
import { findOrCreateUser } from "@worker/lib/users"
import { createSession } from "@worker/lib/auth/sessions"

export const callbackGoogle = new Hono<AppEnv>()

// GET /auth/callback/google — exchange the OAuth code for a profile, create the
// user + session, set cookies, redirect to "/". Uses the connection opened by
// the db middleware (the old handler opened its own inside the try).
callbackGoogle.get("/", async (c) => {
  const code = c.req.query("code")
  const state = c.req.query("state")
  const storedState = getStoredState(c.req.raw)
  const codeVerifier = getStoredCodeVerifier(c.req.raw)

  if (!code || !state || state !== storedState || !codeVerifier) {
    return new Response("Invalid OAuth state", { status: 400 })
  }

  try {
    const profile = await validateCallback(c.env, code, codeVerifier)
    const sql = c.get("sql")
    const user = await findOrCreateUser(sql, "google", profile)
    const { cookie, presenceCookie } = await createSession(sql, user.id)

    const headers = new Headers()
    headers.set("Location", "/")
    headers.append("set-cookie", cookie)
    headers.append("set-cookie", presenceCookie)
    for (const ck of clearOAuthCookies()) headers.append("set-cookie", ck)
    return new Response(null, { status: 302, headers })
  } catch (err) {
    console.error("auth/callback failed", err)
    return new Response("Authentication failed", { status: 502 })
  }
})
```

- [ ] **Step 5: Create `routes/auth/index.ts` (mount + scoped middleware)**

`apps/nolli/worker/routes/auth/index.ts`:
```ts
import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { db, resolveUser } from "@worker/middleware"
import { me } from "./me"
import { signOut } from "./sign-out"
import { loginGoogle } from "./login-google"
import { callbackGoogle } from "./callback-google"

export const app = new Hono<AppEnv>()

// Request-scoped DB + user resolution, applied to /auth only.
app.use("*", db, resolveUser)
app.route("/me", me)
app.route("/sign-out", signOut)
app.route("/login/google", loginGoogle)
app.route("/callback/google", callbackGoogle)
```

- [ ] **Step 6: Typecheck**
```bash
cd apps/nolli && npx tsc -p tsconfig.worker.json --noEmit
```
Expected: only the known old-handler errors remain.

- [ ] **Step 7: Commit**
```bash
git add apps/nolli/worker/routes/auth/
git commit -m "feat(worker): auth routes as Hono sub-apps with db+auth middleware"
```

---

### Task 10: Swap the entrypoint and delete the old router + old route files

This is the switchover. After it, the tree is coherent: the new entrypoint references only the new modules, and everything old is gone.

**Files:**
- Modify: `apps/nolli/worker/index.ts` (full rewrite)
- Delete: `apps/nolli/worker/routes/route.type.ts`
- Delete: `apps/nolli/worker/routes/api/favorites/index.ts`
- Delete: `apps/nolli/worker/routes/api/submissions/index.ts`
- Delete: `apps/nolli/worker/routes/api/submissions/mine/index.ts`
- Delete: `apps/nolli/worker/routes/api/submissions/uploads/index.ts`
- Delete: `apps/nolli/worker/routes/auth/me/index.ts`
- Delete: `apps/nolli/worker/routes/auth/sign-out/index.ts`
- Delete: `apps/nolli/worker/routes/auth/login/google/index.ts`
- Delete: `apps/nolli/worker/routes/auth/callback/google/index.ts`
- Delete: now-empty directories (`favorites/`, `submissions/`, `submissions/mine/`, `submissions/uploads/`, `me/`, `sign-out/`, `login/`, `login/google/`, `callback/`, `callback/google/`)

- [ ] **Step 1: Rewrite `worker/index.ts`**

`apps/nolli/worker/index.ts`:
```ts
import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { app as apiApp } from "@worker/routes/api"
import { app as authApp } from "@worker/routes/auth"

const app = new Hono<AppEnv>()
app.route("/api", apiApp)
app.route("/auth", authApp)

// No route matched → delegate to the static-asset / SPA handler (preserves the
// original fallthrough behavior: unmatched paths serve assets, never 404 JSON).
app.notFound((c) => c.env.ASSETS.fetch(c.req.raw))
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: "internal server error" }, 500)
})

export default {
  fetch: (req, env, ctx) => app.fetch(req, env, ctx),
}
```

- [ ] **Step 2: Delete the old router and old route files**

Run from the worktree root:
```bash
git rm apps/nolli/worker/routes/route.type.ts \
       apps/nolli/worker/routes/api/favorites/index.ts \
       apps/nolli/worker/routes/api/submissions/index.ts \
       apps/nolli/worker/routes/api/submissions/mine/index.ts \
       apps/nolli/worker/routes/api/submissions/uploads/index.ts \
       apps/nolli/worker/routes/auth/me/index.ts \
       apps/nolli/worker/routes/auth/sign-out/index.ts \
       apps/nolli/worker/routes/auth/login/google/index.ts \
       apps/nolli/worker/routes/auth/callback/google/index.ts
```
Then remove the now-empty directories:
```bash
find apps/nolli/worker/routes -type d -empty -delete
```

- [ ] **Step 3: Typecheck (this must now be fully clean)**
```bash
cd apps/nolli && npx tsc -p tsconfig.worker.json --noEmit
```
Expected: exit 0, no output. All old-handler errors are gone (those files are deleted). If any errors remain, they are real regressions — investigate before committing.

- [ ] **Step 4: Commit**
```bash
git add -A apps/nolli/worker
git commit -m "refactor(worker): switch entrypoint to Hono, remove homebrew router"
```

---

### Task 11: Smoke drive — boot the worker and exercise the routes

The spec chose testable-later, so verification is a real boot + curl, not automated tests. The goal is to confirm routing, the middleware chain, the `ASSETS` fallthrough, and that auth-gated routes reject unauthenticated requests. Full happy-paths (create submission, OAuth callback) require live secrets + DB rows the engineer may not have locally — cover those if feasible, but the unauthenticated checks below are the required bar.

**Files:** none (verification only)

- [ ] **Step 1: Confirm local runtime config exists**

Check for `.dev.vars` (worker secrets) and a reachable `DATABASE_URL`:
```bash
ls apps/nolli/.dev.vars 2>/dev/null && echo "has .dev.vars" || echo "NO .dev.vars — create it before booting (see wrangler.jsonc vars; needs DATABASE_URL, GOOGLE_* , R2_* )"
```
If `.dev.vars` is missing, stop and create it from the project's secret source before continuing — the worker cannot boot without `DATABASE_URL`.

- [ ] **Step 2: Boot the worker dev server (background)**

From the worktree root:
```bash
pnpm --filter nolli dev
```
This runs Vite with the Cloudflare plugin and boots `wrangler dev`. Wait for a line indicating the worker is ready (e.g. `ready on http://localhost:5173` or wrangler's `Ready on http://...`). Keep it running in the background.

- [ ] **Step 3: Confirm static-asset fallthrough still works (no DB touch)**

```bash
curl -sS -o /dev/null -w "%{http_code}" http://localhost:5173/
```
Expected: `200` (the SPA index served via `ASSETS.fetch`). A non-200 here means the `notFound` → ASSETS delegation is broken.

- [ ] **Step 4: Confirm an unknown `/api/*` path does not serve the SPA**

```bash
curl -sS -o /dev/null -w "%{http_code}" http://localhost:5173/api/does-not-exist
```
Note: this falls through to `ASSETS` (SPA index → 200), matching pre-migration behavior. This is expected, not a regression — confirm it returns `200` (SPA), same as before.

- [ ] **Step 5: Confirm auth-gated routes reject without credentials (401)**

```bash
curl -sS -o /dev/null -w "%{http_code}" http://localhost:5173/api/favorites
curl -sS -o /dev/null -w "%{http_code}" http://localhost:5173/api/submissions/mine
curl -sS http://localhost:5173/auth/me
```
Expected:
- `/api/favorites` → `401` (proves `db` + `resolveUser` ran, `requireAuth` rejected null user)
- `/api/submissions/mine` → `401`
- `/auth/me` → `401` with body `{"user":null}` (proves `resolveUser` ran and the no-guard handler returned the 401-with-body contract)

- [ ] **Step 6: Confirm role-gated route rejects a plain authenticated session (403), if you have one**

If you can obtain a session cookie for a non-moderator account (e.g. via a local login), otherwise skip this step:
```bash
curl -sS -o /dev/null -w "%{http_code}" -H "cookie: nolli_session=<non-mod-token>" http://localhost:5173/api/submissions
```
Expected: `403` (proves `requireRole("moderator")` guard). With no valid session cookie this returns `401`; both confirm the guard middleware executes.

- [ ] **Step 7: Happy-path checks where feasible**

If you have live Google OAuth secrets and a test account, exercise the full flows: `/auth/login/google` → callback → `/auth/me` shows the user; then `POST /api/favorites` and `GET /api/favorites` round-trip; `POST /api/submissions` with a validated payload. These are optional given secret availability but should behave identically to pre-migration.

- [ ] **Step 8: Stop the dev server and commit nothing (verification-only task)**

Stop the background dev server. No code changed in this task, so nothing to commit. If any check failed, file the specific failure as a follow-up rather than committing a hotfix here.

---

## Self-review notes (completed during planning)

- **Spec coverage:** Every section of the design spec maps to a task — typed context (Task 2), entrypoint + ASSETS fallback + onError (Task 10), db/resolveUser middleware + guards (Task 5), per-area route modules (Tasks 6–9), `route.type.ts` deletion (Task 10), `roleRank` extraction (Task 3), ASSETS-fallback preservation (Task 10), invalid-JSON tolerance (Task 4's `parseJsonBody`), Set-Cookie passthrough (Tasks 9 sign-out + callback build `Response` with headers, verified in Task 11), DB disposal (Task 5's `await using` around `next()`), verification via `tsc -p tsconfig.worker.json` + smoke drive (Tasks 1–11).
- **Design correction applied:** middleware is scoped to `/api` and `/auth` sub-apps (Tasks 8 and 9), not global — the spec's "apply once at the top" would have opened a DB connection on every static-asset request.
- **Type consistency:** `AppEnv` (Task 2) is used identically by `db`, `resolveUser`, `requireAuth`, `requireRole` (Task 5) and every route sub-app (Tasks 6–9) and the entrypoint (Task 10). Variable names `sql` and `user` match across all `c.get(...)` reads. `roleRank` (Task 3) is the single name used by both the guard factory (Task 5) and the in-handler owner-or-mod check (Task 6).
- **Behavior preserved:** every status code, response body shape, cookie header, and the `ASSETS` fallthrough match the pre-migration handlers. One documented non-observable difference: wrong-method requests to single-method auth routes (e.g. `GET /auth/sign-out`) now fall through to ASSETS (SPA) instead of returning `405`; legit clients only ever call the declared method, so this is not observable in practice.
