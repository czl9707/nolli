import { getCookie, setCookie, clearCookie } from "@worker/lib/cookies"
import { randomToken, sha256Hex } from "@worker/lib/crypto"
import { type Sql, type User } from "@worker/lib/db"

export const SESSION_COOKIE = "nolli_session"
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

export async function createSession(
  sql: Sql,
  userId: number
): Promise<{ token: string; cookie: string }> {
  const token = randomToken()
  const tokenHash = await sha256Hex(token)
  await sql`
    insert into public.sessions (user_id, token_hash, expires_at)
    values (${userId}, ${tokenHash}, now() + interval '30 days')
  `
  return {
    token,
    cookie: setCookie(SESSION_COOKIE, token, { maxAge: SESSION_TTL_SECONDS }),
  }
}

export async function getAuthenticatedUser(
  sql: Sql,
  request: Request
): Promise<User | null> {
  const token = getCookie(request, SESSION_COOKIE)
  if (!token) return null
  const tokenHash = await sha256Hex(token)
  const rows = await sql<User[]>`
    select u.id, u.email, u.display_name, u.avatar_url, u.role
    from public.sessions s
    join public.users u on u.id = s.user_id
    where s.token_hash = ${tokenHash} and s.expires_at > now()
  `
  return rows.length ? rows[0] : null
}

export async function deleteSession(sql: Sql, request: Request): Promise<void> {
  const token = getCookie(request, SESSION_COOKIE)
  if (!token) return
  await sql`delete from public.sessions where token_hash = ${await sha256Hex(token)}`
}

export async function deleteAllSessions(
  sql: Sql,
  request: Request
): Promise<void> {
  const token = getCookie(request, SESSION_COOKIE)
  if (!token) return
  const tokenHash = await sha256Hex(token)
  const rows = await sql<{ user_id: number }[]>`
    select user_id from public.sessions where token_hash = ${tokenHash}
  `
  if (!rows.length) return
  await sql`delete from public.sessions where user_id = ${rows[0].user_id}`
}

export function sessionCookieClear(): string {
  return clearCookie(SESSION_COOKIE)
}
