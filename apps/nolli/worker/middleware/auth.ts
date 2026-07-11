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
