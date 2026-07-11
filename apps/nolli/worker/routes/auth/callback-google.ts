import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import {
  getStoredState,
  getStoredCodeVerifier,
  clearOAuthCookies,
  validateCallback,
} from "@worker/lib/auth/google"
import { findOrCreateUser } from "@worker/lib/users"
import { createSession } from "@worker/lib/auth/sessions"

export const callbackGoogle = new Hono<AppEnv>()

// GET /auth/callback/google — exchange the OAuth code for a profile, create the
// user + session, set cookies, redirect to "/". Uses the connection opened by
// the db middleware (the old handler opened its own inside the try).
callbackGoogle.get("/", async (c) => {
  const code = c.req.query("code")
  const state = c.req.query("state")
  const storedState = getStoredState(c.req.raw)
  const codeVerifier = getStoredCodeVerifier(c.req.raw)

  if (!code || !state || state !== storedState || !codeVerifier) {
    return new Response("Invalid OAuth state", { status: 400 })
  }

  try {
    const profile = await validateCallback(c.env, code, codeVerifier)
    const sql = c.get("sql")
    const user = await findOrCreateUser(sql, "google", profile)
    const { cookie, presenceCookie } = await createSession(sql, user.id)

    const headers = new Headers()
    headers.set("location", "/")
    headers.append("set-cookie", cookie)
    headers.append("set-cookie", presenceCookie)
    for (const ck of clearOAuthCookies()) headers.append("set-cookie", ck)
    return new Response(null, { status: 302, headers })
  } catch (err) {
    console.error("auth/callback failed", err)
    return new Response("Authentication failed", { status: 502 })
  }
})
