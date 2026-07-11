import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { db, resolveUser } from "@worker/middleware"
import { favorites } from "./favorites"
import { submissions } from "./submissions"

export const app = new Hono<AppEnv>()

// Request-scoped DB + user resolution, applied to /api only (not static assets,
// which fall through to ASSETS at the top-level notFound handler).
app.use("*", db, resolveUser)
app.route("/favorites", favorites)
app.route("/submissions", submissions)
