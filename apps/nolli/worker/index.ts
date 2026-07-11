import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { app as apiApp } from "@worker/routes/api"
import { app as authApp } from "@worker/routes/auth"

const app = new Hono<AppEnv>()
app.route("/api", apiApp)
app.route("/auth", authApp)

// No route matched → delegate to the static-asset / SPA handler (preserves the
// original fallthrough behavior: unmatched paths serve assets, never 404 JSON).
app.notFound((c) => c.env.ASSETS.fetch(c.req.raw))
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: "internal server error" }, 500)
})

export default {
  fetch: (req, env, ctx) => app.fetch(req, env, ctx),
} satisfies ExportedHandler<Env>
