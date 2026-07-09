import type { RouteHandler } from "@worker/routes/route.type"
import { startOAuth } from "@worker/lib/auth/google"

export default {
  fetch(_request, _url, env) {
    const { url, stateCookie, codeVerifierCookie } = startOAuth(env)
    const headers = new Headers()
    headers.set("Location", url)
    headers.append("set-cookie", stateCookie)
    headers.append("set-cookie", codeVerifierCookie)
    return new Response(null, { status: 302, headers })
  },
} satisfies RouteHandler
