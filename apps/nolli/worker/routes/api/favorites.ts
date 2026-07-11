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
