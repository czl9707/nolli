import type { RouteHandler } from "@worker/routes/route.type"
import { connect } from "@worker/lib/db"
import {
  getStoredState,
  getStoredCodeVerifier,
  clearOAuthCookies,
  validateCallback,
} from "@worker/lib/google"
import { findOrCreateUser } from "@worker/lib/users"
import { createSession } from "@worker/lib/sessions"

export default {
  async fetch(request, url, env) {
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    const storedState = getStoredState(request)
    const codeVerifier = getStoredCodeVerifier(request)

    if (!code || !state || state !== storedState || !codeVerifier) {
      return new Response("Invalid OAuth state", { status: 400 })
    }

    try {
      const profile = await validateCallback(env, code, codeVerifier)
      await using sql = connect(env.DATABASE_URL)
      const user = await findOrCreateUser(sql, profile)
      const { cookie } = await createSession(sql, user.id)

      const headers = new Headers()
      headers.set("Location", "/")
      headers.append("set-cookie", cookie)
      for (const c of clearOAuthCookies()) headers.append("set-cookie", c)
      return new Response(null, { status: 302, headers })
    } catch (err) {
      console.error("auth/callback failed", err)
      return new Response("Authentication failed", { status: 502 })
    }
  },
} satisfies RouteHandler
