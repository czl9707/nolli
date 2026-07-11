export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  })
}

// Canonical responses reused across routes — fixed body, fixed status.
export const unauthorized = (): Response => json({ error: "unauthorized" }, 401)
export const forbidden = (): Response => json({ error: "forbidden" }, 403)
export const notFound = (message = "not found"): Response => json({ error: message }, 404)
export const methodNotAllowed = (): Response => json({ error: "method not allowed" }, 405)
export const badRequest = (message: string): Response => json({ error: message }, 400)

// Read and JSON-parse a request body, returning null on malformed/empty input
// (preserves the tolerant .catch(() => null) behavior handlers previously inlined).
export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
