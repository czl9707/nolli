import type { RouteHandler } from "@worker/routes/route.type"
import { connect } from "@worker/lib/db"
import { json } from "@worker/lib/http"
import { getAuthenticatedUser } from "@worker/lib/sessions"

export default {
  async fetch(request, _url, env) {
    if (request.method !== "GET") {
      return json({ error: "method not allowed" }, 405)
    }
    await using sql = connect(env.DATABASE_URL)
    const user = await getAuthenticatedUser(sql, request)
    if (!user) return json({ user: null }, 401)
    // Project only the fields the client needs; don't leak the whole User row
    // (e.g. role) or future DB columns to the browser.
    return json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
      },
    })
  },
} satisfies RouteHandler
