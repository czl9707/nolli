import type { RouteHandler } from "@worker/routes/route.type"
import { connect } from "@worker/lib/data/db"
import { json, unauthorized, methodNotAllowed } from "@worker/lib/data/http"
import { getAuthenticatedUser } from "@worker/lib/auth/sessions"
import { listMine } from "@worker/lib/submissions"

// GET /api/submissions/mine — list the authenticated user's own submissions across all statuses
export default {
  async fetch(request, _url, env) {
    if (request.method !== "GET") {
      return methodNotAllowed()
    }
    await using sql = connect(env.DATABASE_URL)
    const user = await getAuthenticatedUser(sql, request)
    if (!user) return unauthorized()
    return json({ submissions: await listMine(sql, user.id) })
  },
} satisfies RouteHandler
