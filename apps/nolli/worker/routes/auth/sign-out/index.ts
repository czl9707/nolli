import type { RouteHandler } from "@worker/routes/route.type"
import { connect } from "@worker/lib/data/db"
import { methodNotAllowed } from "@worker/lib/data/http"
import {
  deleteSession,
  sessionCookieClear,
  presenceCookieClear,
} from "@worker/lib/auth/sessions"
import { appendSetCookie } from "@worker/lib/data/cookies"

export default {
  async fetch(request, url, env) {
    if (request.method !== "POST") {
      return methodNotAllowed()
    }

    await using sql = connect(env.DATABASE_URL)
    await deleteSession(sql, request)

    const headers = new Headers({ "content-type": "application/json" })
    appendSetCookie(headers, sessionCookieClear())
    appendSetCookie(headers, presenceCookieClear())
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
  },
} satisfies RouteHandler
