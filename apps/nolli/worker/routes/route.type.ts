export type RouteHandler = {
  fetch: (request: Request, url: URL, env: Env) => Promise<Response> | Response
}
