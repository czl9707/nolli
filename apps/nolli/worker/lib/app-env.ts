import type { Sql } from "@worker/lib/data/db"
import type { R2Context } from "@worker/lib/data/r2"
import type { User } from "@worker/lib/users"

// Hono context shape. `Bindings` is the Cloudflare `Env` (ambient global in
// env.d.ts); `Variables` are per-request values injected by middleware. Handlers
// read these via c.get(...) — never from ambient globals — which is what lets a
// future test swap them (fake Sql, stubbed user) without touching real Postgres.
export type AppEnv = {
  Bindings: Env
  Variables: {
    sql: Sql
    r2: R2Context
    user: User | null
  }
}
