import type { RouteHandler } from "./routes/route.type"

const modules = import.meta.glob<{ default: RouteHandler }>(
  "./routes/**/index.ts",
  {
    eager: true,
  }
)

function matchRoute(pathname: string): RouteHandler | null {
  let best: { handler: RouteHandler; length: number } | null = null
  for (const [file, mod] of Object.entries(modules)) {
    const prefix = file.replace("./routes/", "").replace("/index.ts", "")
    const path = `/${prefix}`
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      if (!best || path.length > best.length) {
        best = { handler: mod.default, length: path.length }
      }
    }
  }
  return best?.handler ?? null
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const handler = matchRoute(url.pathname)

    if (handler) return handler.fetch(request, url, env)

    return env.ASSETS.fetch(request)
  },
} satisfies { fetch: (request: Request, env: Env) => Promise<Response> }
