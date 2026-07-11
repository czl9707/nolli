import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { startOAuth } from "@worker/lib/auth/google"

export const loginGoogle = new Hono<AppEnv>()

// /auth/login/google — redirect to Google with state + code-verifier cookies.
// Any method (the original handler ignored method).
loginGoogle.all("/", (c) => {
  const { url, stateCookie, codeVerifierCookie } = startOAuth(c.env)
  const headers = new Headers()
  headers.set("Location", url)
  headers.append("set-cookie", stateCookie)
  headers.append("set-cookie", codeVerifierCookie)
  return new Response(null, { status: 302, headers })
})
