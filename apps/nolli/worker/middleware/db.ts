import type { MiddlewareHandler } from "hono"
import { connect } from "@worker/lib/data/db"
import type { AppEnv } from "@worker/lib/app-env"

// One Postgres client per request, stored on the context for handlers to read.
// `await using` is scoped to this function body: disposal runs after `next()`
// resolves (i.e. after the handler has built its Response and no longer needs
// the connection), mirroring the per-handler `await using sql = connect(...)`
// the routes used previously.
export const db: MiddlewareHandler<AppEnv> = async (c, next) => {
  await using sql = connect(c.env.DATABASE_URL)
  c.set("sql", sql)
  await next()
}
