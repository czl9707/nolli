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
