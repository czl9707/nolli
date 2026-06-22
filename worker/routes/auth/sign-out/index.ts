import type { RouteHandler } from "@worker/routes/route.type"
import { connect } from "@worker/lib/db"
import { json } from "@worker/lib/http"
import {
  deleteSession,
  deleteAllSessions,
  sessionCookieClear,
} from "@worker/lib/sessions"
import { appendSetCookie } from "@worker/lib/cookies"

export default {
  async fetch(request, url, env) {
    if (request.method !== "POST") {
      return json({ error: "method not allowed" }, 405)
    }

    const everywhere = url.pathname === "/auth/sign-out-everywhere"
    await using sql = connect(env.DATABASE_URL)
    if (everywhere) {
      await deleteAllSessions(sql, request)
    } else {
      await deleteSession(sql, request)
    }

    const headers = new Headers({ "content-type": "application/json" })
    appendSetCookie(headers, sessionCookieClear())
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
  },
} satisfies RouteHandler
