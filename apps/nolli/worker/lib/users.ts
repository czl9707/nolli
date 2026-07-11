import { type Sql, isUniqueViolation } from "@worker/lib/data/db"
import { type Role } from "@nolli/data/server"
export type { Role }

export type User = {
  id: number
  email: string
  display_name: string | null
  avatar_url: string | null
  role: Role
}

export type GoogleProfile = {
  sub: string
  email: string
  name?: string
  picture?: string
}

// Find user by (provider, provider_sub), or create both a users row and a
// user_accounts row. Provider comes from the route, so adding a provider only
// requires its own OAuth adapter + route dir — this stays unchanged.
export async function findOrCreateUser(
  sql: Sql,
  provider: string,
  profile: GoogleProfile
): Promise<User> {
  const existing = await sql<{ id: number }[]>`
    select u.id
    from public.user_accounts ua
    join public.users u on u.id = ua.user_id
    where ua.provider = ${provider} and ua.provider_sub = ${profile.sub}
  `
  if (existing.length) {
    const userId = existing[0].id
    await sql`
      update public.users
      set email = ${profile.email},
          display_name = ${profile.name ?? null},
          avatar_url = ${profile.picture ?? null},
          updated_at = now()
      where id = ${userId}
    `
    return fetchUser(sql, userId)
  }

  // Create. A concurrent first-login may win the unique(provider, provider_sub)
  // race — in that case roll back our orphan users row and return the winner.
  const [created] = await sql<{ id: number }[]>`
    insert into public.users (email, display_name, avatar_url)
    values (${profile.email}, ${profile.name ?? null}, ${profile.picture ?? null})
    returning id
  `
  try {
    await sql`
      insert into public.user_accounts (user_id, provider, provider_sub)
      values (${created.id}, ${provider}, ${profile.sub})
    `
  } catch (err) {
    if (isUniqueViolation(err)) {
      await sql`delete from public.users where id = ${created.id}`
      const [winner] = await sql<{ id: number }[]>`
        select u.id
        from public.user_accounts ua
        join public.users u on u.id = ua.user_id
        where ua.provider = ${provider} and ua.provider_sub = ${profile.sub}
      `
      return fetchUser(sql, winner.id)
    }
    throw err
  }
  return fetchUser(sql, created.id)
}

export async function fetchUser(sql: Sql, userId: number): Promise<User> {
  const [user] = await sql<User[]>`
    select id, email, display_name, avatar_url, role
    from public.users
    where id = ${userId}
  `
  if (!user) throw new Error(`user ${userId} not found`)
  return user
}
