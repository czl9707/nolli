export type FavoriteEntry = {
  id: number
  createdAt: string
}

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized")
    this.name = "UnauthorizedError"
  }
}

async function unwrap<T>(resp: Response): Promise<T> {
  if (resp.status === 401) throw new UnauthorizedError()
  if (!resp.ok) throw new Error(`favorites request failed: ${resp.status}`)
  return (await resp.json()) as T
}

/** GET /api/favorites → the authed user's favorites, newest first. */
export async function listFavorites(): Promise<FavoriteEntry[]> {
  const resp = await fetch("/api/favorites", { credentials: "same-origin" })
  const data = await unwrap<{
    favorites: { architecture_id: number; created_at: string }[]
  }>(resp)
  return data.favorites.map((f) => ({ id: f.architecture_id, createdAt: f.created_at }))
}

/** POST /api/favorites { architectureId }. */
export async function addFavorite(id: number): Promise<void> {
  const resp = await fetch("/api/favorites", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ architectureId: id }),
  })
  await unwrap(resp)
}

/** DELETE /api/favorites/:id. */
export async function removeFavorite(id: number): Promise<void> {
  const resp = await fetch(`/api/favorites/${id}`, {
    method: "DELETE",
    credentials: "same-origin",
  })
  await unwrap(resp)
}
