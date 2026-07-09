import type { RouteHandler } from "@worker/routes/route.type"
import { connect } from "@worker/lib/data/db"
import { json, unauthorized, methodNotAllowed } from "@worker/lib/data/http"
import { getAuthenticatedUser } from "@worker/lib/auth/sessions"
import {
  ALLOWED_CONTENT_TYPES,
  MAX_IMAGE_BYTES,
  extFor,
  newStagingKey,
  putStaging,
} from "@worker/lib/data/r2"

// POST /api/submissions/uploads — proxy-upload one image to the staging bucket; returns its content-addressed key (any authenticated user)
export default {
  async fetch(request, _url, env) {
    await using sql = connect(env.DATABASE_URL)
    const user = await getAuthenticatedUser(sql, request)
    if (!user) return unauthorized()
    if (request.method !== "POST") {
      return methodNotAllowed()
    }

    const contentType = request.headers.get("content-type") ?? ""
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return json({ error: "unsupported content-type" }, 415)
    }
    const body = await request.arrayBuffer()
    if (body.byteLength > MAX_IMAGE_BYTES) {
      return json({ error: "image too large" }, 413)
    }
    const key = await newStagingKey(user.id, extFor(contentType), body)
    await putStaging(env, key, body, contentType)
    return json({ staging_key: key }, 201)
  },
} satisfies RouteHandler
