import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { requireAuth, requireRole } from "@worker/middleware"
import { roleRank } from "@worker/lib/users"
import {
  json,
  badRequest,
  notFound,
  forbidden,
  methodNotAllowed,
  parseJsonBody,
} from "@worker/lib/data/http"
import {
  ALLOWED_CONTENT_TYPES,
  MAX_IMAGE_BYTES,
  extFor,
  newStagingKey,
  putStaging,
} from "@worker/lib/data/r2"
import {
  ValidationError,
  NotFoundOrLocked,
  listQueue,
  listMine,
  getSubmission,
  createSubmission,
  updateSubmission,
  approveSubmission,
  rejectSubmission,
} from "@worker/lib/submissions"
import { UnknownCountryError, DuplicateSlugError } from "@worker/lib/apply-submissions"

export const submissions = new Hono<AppEnv>()

// POST / — create a submission (any authenticated user)
submissions.post("/", requireAuth, async (c) => {
  try {
    const id = await createSubmission(c.get("sql"), c.get("user")!.id, await parseJsonBody(c.req.raw))
    return json({ id }, 201)
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(err.message)
    throw err
  }
})

// GET / — moderation queue (moderator+)
submissions.get("/", requireRole("moderator"), async (c) =>
  json({ submissions: await listQueue(c.get("sql")) })
)

// GET /mine — the authenticated user's own submissions, all statuses
submissions.get("/mine", requireAuth, async (c) =>
  json({ submissions: await listMine(c.get("sql"), c.get("user")!.id) })
)

// POST /uploads — proxy one image to the staging bucket (any authenticated user)
submissions.post("/uploads", requireAuth, async (c) => {
  const contentType = c.req.header("content-type") ?? ""
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return json({ error: "unsupported content-type" }, 415)
  }
  const body = await c.req.raw.arrayBuffer()
  if (body.byteLength > MAX_IMAGE_BYTES) {
    return json({ error: "image too large" }, 413)
  }
  const user = c.get("user")!
  const key = await newStagingKey(user.id, extFor(contentType), body)
  await putStaging(c.env, key, body, contentType)
  return json({ staging_key: key }, 201)
})

// POST /:id/decision — approve or reject (moderator+). Body is validated before
// the role check so a malformed decision returns 400 (not 403), matching the
// original handler's ordering.
submissions.post("/:id/decision", requireAuth, async (c) => {
  const id = Number(c.req.param("id"))
  const body = (await parseJsonBody(c.req.raw)) as {
    decision?: unknown
    note?: unknown
  } | null
  if (body?.decision !== "approve" && body?.decision !== "reject") {
    return badRequest("decision must be 'approve' or 'reject'")
  }
  const user = c.get("user")!
  if (roleRank(user.role) < roleRank("moderator")) return forbidden()
  if (!id) return badRequest("invalid id")
  const note = typeof body.note === "string" ? body.note : null
  try {
    if (body.decision === "approve") {
      await approveSubmission(c.get("sql"), c.env, id, user.id, note)
    } else {
      await rejectSubmission(c.get("sql"), c.env, id, user.id, note)
    }
    return json({ ok: true })
  } catch (err) {
    if (err instanceof NotFoundOrLocked) return notFound("not found or not pending")
    if (err instanceof UnknownCountryError) return badRequest(`unknown country: ${err.country}`)
    if (err instanceof DuplicateSlugError) return badRequest(`slug already exists: ${err.slug}`)
    throw err
  }
})

// GET /:id — fetch one (moderator+, or the submitter's own)
submissions.get("/:id", requireAuth, async (c) => {
  const id = Number(c.req.param("id"))
  if (!Number.isInteger(id)) return notFound()
  const sub = await getSubmission(c.get("sql"), id)
  if (!sub) return notFound()
  const user = c.get("user")!
  if (roleRank(user.role) < roleRank("moderator") && sub.submitter_id !== user.id) {
    return forbidden()
  }
  return json({ submission: sub })
})

// PATCH /:id — edit payload (submitter while pending, or any moderator)
submissions.patch("/:id", requireAuth, async (c) => {
  const id = Number(c.req.param("id"))
  if (!Number.isInteger(id)) return notFound()
  const user = c.get("user")!
  const isMod = roleRank(user.role) >= roleRank("moderator")
  try {
    await updateSubmission(c.get("sql"), id, await parseJsonBody(c.req.raw), user.id, isMod)
    return json({ ok: true })
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(err.message)
    if (err instanceof NotFoundOrLocked) return notFound("not found or locked")
    throw err
  }
})

// Any other method/path under /api/submissions → 405 (matches the old handler's
// trailing methodNotAllowed, so wrong-method requests don't fall through to SPA).
submissions.all("*", () => methodNotAllowed())
