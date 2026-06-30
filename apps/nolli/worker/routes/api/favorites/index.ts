import type { RouteHandler } from "@worker/routes/route.type"
import { connect } from "@worker/lib/db"
import { json } from "@worker/lib/http"
import { getAuthenticatedUser } from "@worker/lib/sessions"
import {
  listFavorites,
  addFavorite,
  removeFavorite,
} from "@worker/lib/favorites"

export default {
  async fetch(request, url, env) {
    await using sql = connect(env.DATABASE_URL)
    const user = await getAuthenticatedUser(sql, request)
    if (!user) return json({ error: "unauthorized" }, 401)

    const method = request.method
    const tail = url.pathname.replace("/api/favorites", "").replace(/^\//, "")

    if (method === "GET") {
      const favorites = await listFavorites(sql, user.id)
      return json({ favorites })
    }

    if (method === "POST") {
      const body = (await request.json().catch(() => null)) as {
        architectureId?: unknown
      } | null
      const architectureId = Number(body?.architectureId)
      if (!architectureId) {
        return json({ error: "architectureId required" }, 400)
      }
      await addFavorite(sql, user.id, architectureId)
      return json({ ok: true }, 201)
    }

    if (method === "DELETE") {
      const architectureId = Number(tail)
      if (!architectureId) {
        return json({ error: "architectureId required" }, 400)
      }
      await removeFavorite(sql, user.id, architectureId)
      return json({ ok: true })
    }

    return json({ error: "method not allowed" }, 405)
  },
} satisfies RouteHandler
