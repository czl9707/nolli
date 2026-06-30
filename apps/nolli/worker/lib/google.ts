import { Google, generateState, generateCodeVerifier } from "arctic"
import { clearCookie, getCookie, setCookie } from "@worker/lib/cookies"
import type { GoogleProfile } from "@worker/lib/users"

const STATE_COOKIE = "nolli_oauth_state"
const CODE_VERIFIER_COOKIE = "nolli_oauth_pkce"
const SCOPES = ["openid", "email", "profile"]

function createGoogle(env: Env): Google {
  return new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.OAUTH_REDIRECT_URI
  )
}

export function startOAuth(env: Env): {
  url: string
  stateCookie: string
  codeVerifierCookie: string
} {
  const google = createGoogle(env)
  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const url = google.createAuthorizationURL(state, codeVerifier, SCOPES)
  return {
    url: url.toString(),
    stateCookie: setCookie(STATE_COOKIE, state, { maxAge: 600 }),
    codeVerifierCookie: setCookie(CODE_VERIFIER_COOKIE, codeVerifier, {
      maxAge: 600,
    }),
  }
}

export function getStoredState(request: Request): string | undefined {
  return getCookie(request, STATE_COOKIE)
}

export function getStoredCodeVerifier(request: Request): string | undefined {
  return getCookie(request, CODE_VERIFIER_COOKIE)
}

export function clearOAuthCookies(): string[] {
  return [clearCookie(STATE_COOKIE), clearCookie(CODE_VERIFIER_COOKIE)]
}

export async function validateCallback(
  env: Env,
  code: string,
  codeVerifier: string
): Promise<GoogleProfile> {
  const google = createGoogle(env)
  const tokens = await google.validateAuthorizationCode(code, codeVerifier)
  const resp = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.accessToken()}` },
  })
  if (!resp.ok) throw new Error(`userinfo failed: ${resp.status}`)
  const p = (await resp.json()) as {
    sub: string
    email?: string
    name?: string
    picture?: string
  }
  if (!p.sub || !p.email) {
    throw new Error("incomplete userinfo from google")
  }
  return { sub: p.sub, email: p.email, name: p.name, picture: p.picture }
}
