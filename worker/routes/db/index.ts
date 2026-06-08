import type { RouteHandler } from "../route.type"

const handler: RouteHandler = {
  async fetch(request, url, env) {
    const target = new URL(url.pathname.replace("/db", ""), env.DB_ORIGIN)
    const res = await fetch(target.toString(), {
      headers: request.headers,
      redirect: "follow",
    })
    return new Response(res.body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
        "Cache-Control": res.headers.get("Cache-Control") || "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    })
  },
}

export default handler
