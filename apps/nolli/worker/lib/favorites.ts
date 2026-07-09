import { type Sql } from "@worker/lib/data/db"

export type Favorite = {
  architecture_id: number
  created_at: string
}

export async function listFavorites(
  sql: Sql,
  userId: number
): Promise<Favorite[]> {
  return sql<Favorite[]>`
    select architecture_id, created_at
    from public.favorites
    where user_id = ${userId}
    order by created_at desc
  `
}

export async function addFavorite(
  sql: Sql,
  userId: number,
  architectureId: number
): Promise<void> {
  await sql`
    insert into public.favorites (user_id, architecture_id)
    values (${userId}, ${architectureId})
    on conflict do nothing
  `
}

export async function removeFavorite(
  sql: Sql,
  userId: number,
  architectureId: number
): Promise<void> {
  await sql`
    delete from public.favorites
    where user_id = ${userId} and architecture_id = ${architectureId}
  `
}
