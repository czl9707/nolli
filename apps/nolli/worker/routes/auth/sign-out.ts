import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import {
  deleteSession,
  sessionCookieClear,
  presenceCookieClear,
} from "@worker/lib/auth/sessions"
import { appendSetCookie } from "@worker/lib/data/cookies"

export const signOut = new Hono<AppEnv>()

// POST /auth/sign-out — delete the session and clear auth cookies.
signOut.post("/", async (c) => {
  await deleteSession(c.get("sql"), c.req.raw)
  const headers = new Headers({ "content-type": "application/json" })
  appendSetCookie(headers, sessionCookieClear())
  appendSetCookie(headers, presenceCookieClear())
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
})
