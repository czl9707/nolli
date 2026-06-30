import postgres from "postgres"

export type Role = "user" | "moderator" | "admin"

export type User = {
  id: number
  email: string
  display_name: string | null
  avatar_url: string | null
  role: Role
}

export type Sql = ReturnType<typeof postgres>

// One client per request. The caller owns it via `await using sql = connect(...)`;
// lib functions receive `sql` as a param so a request never opens more than one.
// Closing is automatic: `await using` calls [Symbol.asyncDispose] at scope exit.
export function connect(connectionString: string): Sql & AsyncDisposable {
  const sql = postgres(connectionString, {
    // Per-request client; queries are sequential, so a single connection suffices.
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  return Object.assign(sql, {
    async [Symbol.asyncDispose]() {
      await sql.end({ timeout: 5 })
    },
  })
}
