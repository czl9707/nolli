import type { RouteHandler } from "@worker/routes/route.type"
import { connect } from "@worker/lib/db"
import { json } from "@worker/lib/http"
import {
  deleteSession,
  sessionCookieClear,
  presenceCookieClear,
} from "@worker/lib/sessions"
import { appendSetCookie } from "@worker/lib/cookies"

export default {
  async fetch(request, url, env) {
    if (request.method !== "POST") {
      return json({ error: "method not allowed" }, 405)
    }

    await using sql = connect(env.DATABASE_URL)
    await deleteSession(sql, request)

    const headers = new Headers({ "content-type": "application/json" })
    appendSetCookie(headers, sessionCookieClear())
    appendSetCookie(headers, presenceCookieClear())
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
  },
} satisfies RouteHandler
