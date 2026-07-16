import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { db, r2, resolveUser } from "@worker/middleware"
import { favorites } from "./favorites"
import { submissions } from "./submissions"

export const app = new Hono<AppEnv>()

// Request-scoped DB + R2 client + user resolution, applied to /api only (not
// static assets, which fall through to ASSETS at the top-level notFound handler).
app.use("*", db, r2, resolveUser)
app.route("/favorites", favorites)
app.route("/submissions", submissions)
