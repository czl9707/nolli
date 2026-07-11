import { type Role, type User } from "@worker/lib/users"
import { unauthorized, forbidden } from "@worker/lib/data/http"

const ROLE_RANK: Record<Role, number> = { user: 0, moderator: 1, admin: 2 }

export function requireRole(user: User | null, min: Role): Response | null {
  if (!user) return unauthorized()
  if (ROLE_RANK[user.role] < ROLE_RANK[min]) {
    return forbidden()
  }
  return null
}
