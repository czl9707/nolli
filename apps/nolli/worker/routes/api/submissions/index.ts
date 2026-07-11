import type { RouteHandler } from "@worker/routes/route.type"
import { connect, type Sql } from "@worker/lib/data/db"
import { json, unauthorized, forbidden, notFound, methodNotAllowed, badRequest } from "@worker/lib/data/http"
import { getAuthenticatedUser } from "@worker/lib/auth/sessions"
import { requireRole } from "@worker/lib/auth/authz"
import { UnknownCountryError, DuplicateSlugError } from "@worker/lib/apply-submissions"
import { type User } from "@worker/lib/users"
import {
  ValidationError,
  NotFoundOrLocked,
  listQueue,
  getSubmission,
  createSubmission,
  updateSubmission,
  approveSubmission,
  rejectSubmission,
} from "@worker/lib/submissions"

// POST /api/submissions — create a new submission from a validated payload (any authenticated user)
async function create(sql: Sql, user: User, body: unknown) {
  try {
    const id = await createSubmission(sql, user.id, body)
    return json({ id }, 201)
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(err.message)
    throw err
  }
}

// GET /api/submissions — pending queue for the moderation dashboard (moderator+ only)
async function queue(sql: Sql, user: User) {
  const denied = requireRole(user, "moderator")
  if (denied) return denied
  return json({ submissions: await listQueue(sql) })
}

// POST /api/submissions/:id/decision — approve (publish) or reject a submission (moderator+ only)
async function decide(
  sql: Sql,
  env: Env,
  user: User,
  id: number,
  body: { decision?: unknown; note?: unknown } | null
) {
  if (body?.decision !== "approve" && body?.decision !== "reject") {
    return badRequest("decision must be 'approve' or 'reject'")
  }

  const denied = requireRole(user, "moderator")
  if (denied) return denied
  if (!id) return badRequest("invalid id");
  
  const note = typeof body.note === "string" ? body.note : null
  try {
    if (body.decision === "approve") await approveSubmission(sql, env, id, user.id, note)
    else await rejectSubmission(sql, env, id, user.id, note)
    return json({ ok: true })
  } catch (err) {
    if (err instanceof NotFoundOrLocked) return notFound("not found or not pending")
    if (err instanceof UnknownCountryError) return badRequest(`unknown country: ${err.country}`)
    if (err instanceof DuplicateSlugError) return badRequest(`slug already exists: ${err.slug}`)
    throw err
  }
}

// GET /api/submissions/:id — fetch one submission (moderator+, or the submitter's own)
async function show(sql: Sql, user: User, id: number) {
  const sub = await getSubmission(sql, id)
  if (!sub) return notFound()
  const denied = requireRole(user, "moderator")
  if (denied && sub.submitter_id !== user.id) return forbidden()
  return json({ submission: sub })
}

// PATCH /api/submissions/:id — edit the payload (submitter while still pending, or any moderator)
async function update(
  sql: Sql,
  user: User,
  id: number,
  body: unknown
) {
  const isMod = requireRole(user, "moderator") === null
  try {
    await updateSubmission(sql, id, body, user.id, isMod)
    return json({ ok: true })
  } catch (err) {
    if (err instanceof ValidationError) return badRequest(err.message)
    if (err instanceof NotFoundOrLocked) return notFound("not found or locked")
    throw err
  }
}

export default {
  async fetch(request, url, env) {
    await using sql = connect(env.DATABASE_URL)
    const user = await getAuthenticatedUser(sql, request)
    if (!user) return unauthorized()

    const method = request.method
    const tail = url.pathname
      .replace("/api/submissions", "")
      .replace(/^\//, "")
      .replace(/\/$/, "")

    if (tail === "") {
      if (method === "POST") return create(sql, user, await request.json().catch(() => null))
      if (method === "GET") return queue(sql, user)
      return methodNotAllowed()
    }

    if (method === "POST" && tail.endsWith("/decision")) {
      const id = Number(tail.split("/")[0])
      const body = (await request.json().catch(() => null)) as {
        decision?: unknown
        note?: unknown
      } | null
      return decide(sql, env, user, id, body)
    }

    const id = Number(tail)
    if (!Number.isInteger(id)) return notFound()

    if (method === "GET") return show(sql, user, id)
    if (method === "PATCH") return update(sql, user, id, await request.json().catch(() => null))

    return methodNotAllowed()
  },
} satisfies RouteHandler
