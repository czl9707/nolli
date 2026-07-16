import { type Sql } from "@worker/lib/data/db"
import {
  submissionPayloadSchema,
  type SubmissionPayload,
  type SubmissionStatus,
  slugify,
} from "@nolli/data/server"
import { applySubmissionPayload } from "@worker/lib/apply-submissions"
import { copyToProd, deleteStaging, deleteProd, newProdKey, type R2Context } from "@worker/lib/data/r2"

export type SubmissionRow = {
  id: number
  architecture_id: number | null
  submitter_id: number
  status: SubmissionStatus
  payload: SubmissionPayload
  created_at: string
  reviewed_at: string | null
  submitter_name: string | null
}

export class ValidationError extends Error {}
export class NotFoundOrLocked extends Error {}

function validatePayload(raw: unknown): SubmissionPayload {
  const parsed = submissionPayloadSchema.safeParse(raw)
  if (!parsed.success) throw new ValidationError(parsed.error.message)
  return parsed.data
}

export async function listQueue(
  sql: Sql
): Promise<
  {
    id: number
    name: string
    architect: string
    city: string
    submitter_name: string | null
    created_at: string
  }[]
> {
  return sql`
    select
      s.id,
      s.payload->'metadata'->>'name'      as name,
      s.payload->'metadata'->>'architect' as architect,
      s.payload->'metadata'->>'city'      as city,
      u.display_name                       as submitter_name,
      s.created_at
    from public.submissions s
    join public.users u on u.id = s.submitter_id
    where s.status = 'pending'
    order by s.created_at asc
  `
}

export async function getSubmission(
  sql: Sql,
  id: number
): Promise<SubmissionRow | null> {
  const rows = await sql<SubmissionRow[]>`
    select
      s.id, s.architecture_id, s.submitter_id, s.status,
      s.payload, s.created_at, s.reviewed_at,
      u.display_name as submitter_name
    from public.submissions s
    join public.users u on u.id = s.submitter_id
    where s.id = ${id}
  `
  return rows.length ? rows[0] : null
}

export async function listMine(
  sql: Sql,
  submitterId: number
): Promise<
  { id: number; status: SubmissionStatus; name: string; created_at: string }[]
> {
  return sql`
    select id, status, payload->'metadata'->>'name' as name, created_at
    from public.submissions
    where submitter_id = ${submitterId}
    order by created_at desc
  `
}

export async function createSubmission(
  sql: Sql,
  submitterId: number,
  rawPayload: unknown
): Promise<number> {
  const payload = validatePayload(rawPayload)
  for (const p of payload.photos) {
    if (!p.staging_key.startsWith(`staging/${submitterId}/`)) {
      throw new ValidationError("photo staging_key not owned by submitter")
    }
  }
  const [row] = await sql<{ id: number }[]>`
    insert into public.submissions (submitter_id, payload)
    values (${submitterId}, ${sql.json(payload)})
    returning id
  `
  return row.id
}

export async function updateSubmission(
  sql: Sql,
  id: number,
  rawPayload: unknown,
  editorId: number,
  isModerator: boolean
): Promise<void> {
  const payload = validatePayload(rawPayload)
  const result = await sql`
    update public.submissions
    set payload = ${sql.json(payload)}
    where id = ${id}
      and status = 'pending'
      and (${isModerator} or submitter_id = ${editorId})
  `
  if ((result as unknown as { count: number }).count === 0)
    throw new NotFoundOrLocked()
}

async function requirePending(sql: Sql, id: number): Promise<SubmissionRow> {
  const sub = await getSubmission(sql, id)
  if (!sub || sub.status !== "pending") throw new NotFoundOrLocked()
  return sub
}

export async function rejectSubmission(
  sql: Sql,
  r2: R2Context,
  id: number,
  moderatorId: number,
  note: string | null
): Promise<void> {
  const sub = await requirePending(sql, id)
  for (const p of sub.payload.photos) {
    await deleteStaging(r2, p.staging_key).catch(() => {})
  }
  await sql`
    update public.submissions
    set status = 'rejected', moderator_id = ${moderatorId},
        moderator_note = ${note}, reviewed_at = now()
    where id = ${id}
  `
}

export async function approveSubmission(
  sql: Sql,
  r2: R2Context,
  id: number,
  moderatorId: number,
  note: string | null
): Promise<void> {
  const sub = await requirePending(sql, id)
  const slug = slugify(sub.payload.metadata.name)
  const prodKeys: string[] = []
  const imageUrls = new Map<string, string>()
  for (const p of sub.payload.photos) {
    const prodKey = newProdKey(slug, p.staging_key)
    await copyToProd(r2, p.staging_key, prodKey)
    prodKeys.push(prodKey)
    imageUrls.set(p.staging_key, `${r2.publicImagesUrl}/${prodKey}`)
  }

  try {
    await sql.begin(async (tx) => {
      const aid = await applySubmissionPayload(tx, sub.payload, (sk) => imageUrls.get(sk)!)
      await tx`
        update public.submissions
        set status = 'approved', architecture_id = ${aid},
            moderator_id = ${moderatorId}, moderator_note = ${note},
            reviewed_at = now()
        where id = ${id}
      `
    })
    for (const p of sub.payload.photos) {
      await deleteStaging(r2, p.staging_key).catch(() => {})
    }
  } catch (err) {
    for (const prodKey of prodKeys) {
      await deleteProd(r2, prodKey).catch(() => {})
    }
    throw err
  }
}
