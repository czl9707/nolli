import { type Role } from "@worker/lib/users"

const ROLE_RANK: Record<Role, number> = { user: 0, moderator: 1, admin: 2 }

// Numeric ranking shared by the requireRole() middleware factory and any
// in-handler role check (e.g. owner-or-moderator). Higher rank = more privileged.
export function roleRank(role: Role): number {
  return ROLE_RANK[role]
}
