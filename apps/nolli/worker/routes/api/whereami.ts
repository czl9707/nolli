import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { methodNotAllowed } from "@worker/lib/data/http"

// GET / — the visitor's country (ISO-2) from Cloudflare request geo. Public
// and CORS-open: the landing site (separate origin) reads it for its
// where-you-are card. The body varies per visitor, so never edge-cache.
// ?country=XX overrides the geo value for dev/testing.
export const whereami = new Hono<AppEnv>()

whereami.get("/", (c) => {
  const country = c.req.query("country") ?? c.req.raw.cf?.country ?? null
  c.header("Access-Control-Allow-Origin", "*")
  c.header("Cache-Control", "no-store")
  return c.json({ country })
})

whereami.all("*", () => methodNotAllowed())
