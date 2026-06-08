import type { RouteHandler } from "./routes/route.type"

const modules = import.meta.glob<{ default: RouteHandler }>("./routes/**/index.ts", {
  eager: true,
})

function matchRoute(pathname: string): RouteHandler | null {
  for (const [file, mod] of Object.entries(modules)) {
    const prefix = file
      .replace("./routes/", "")
      .replace("/index.ts", "")
    if (pathname.startsWith(`/${prefix}`)) return mod.default
  }
  return null
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const handler = matchRoute(url.pathname)

    if (handler) return handler.fetch(request, url, env)

    return env.ASSETS.fetch(request)
  },
} satisfies { fetch: (request: Request, env: Env) => Promise<Response> }
