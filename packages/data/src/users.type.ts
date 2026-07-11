import { z } from "zod"

// Authorization role shared between worker and SPA. The worker enforces it
// server-side (lib/auth/authz); the SPA reads it from /auth/me to gate UI
// like /moderate. Keep this list in lock-step with the users.role column.
export const roleSchema = z.enum(["user", "moderator", "admin"])
export type Role = z.infer<typeof roleSchema>
