import type { MiddlewareHandler } from "hono"
import type { R2Context } from "@worker/lib/data/r2"
import type { AppEnv } from "@worker/lib/app-env"

// R2 bucket bindings for the request, stored on the context for handlers to
// read via `c.get("r2")`. Mirrors the `db` middleware's treatment of `sql`. The
// bindings come straight from wrangler.jsonc — no client construction, no
// secrets — so there's nothing to build per request, just a reference.
export const r2: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set("r2", {
    staging: c.env.IMAGE_STAGING,
    images: c.env.IMAGES,
    publicImagesUrl: c.env.R2_PUBLIC_IMAGES_URL,
  } satisfies R2Context)
  await next()
}
