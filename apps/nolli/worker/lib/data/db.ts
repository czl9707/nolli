import postgres from "postgres"

export type Sql = ReturnType<typeof postgres>
export type Tx = postgres.TransactionSql<{}>

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

// Postgres SQLSTATE for unique_violation.
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  )
}
