import type { SubmissionPayload, SubmissionStatus } from "@nolli/data"

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized")
    this.name = "UnauthorizedError"
  }
}

async function unwrap<T>(resp: Response): Promise<T> {
  if (resp.status === 401) throw new UnauthorizedError()
  if (!resp.ok) throw new Error(`submissions request failed: ${resp.status}`)
  return (await resp.json()) as T
}

/** POST /api/submissions/uploads — upload a raw image file, returns its staging key. */
export async function uploadImage(file: File): Promise<{ staging_key: string }> {
  const resp = await fetch("/api/submissions/uploads", {
    method: "POST",
    body: file,
    credentials: "same-origin",
  })
  return unwrap(resp)
}

/** POST /api/submissions — create a pending submission from a full payload. */
export async function createSubmission(payload: SubmissionPayload): Promise<{ id: number }> {
  const resp = await fetch("/api/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  })
  return unwrap(resp)
}

/** GET /api/submissions/mine — the authed user's own submissions. */
export async function listMine(): Promise<{
  submissions: { id: number; status: SubmissionStatus; name: string; created_at: string }[]
}> {
  const resp = await fetch("/api/submissions/mine", { credentials: "same-origin" })
  return unwrap(resp)
}

export type SubmissionRow = {
  id: number
  architecture_id: string | null
  submitter_id: number
  status: SubmissionStatus
  payload: SubmissionPayload
  created_at: string
  reviewed_at: string | null
  submitter_name: string | null
}

/** GET /api/submissions/:id — one submission (moderator+, or the owner). */
export async function getSubmission(id: number): Promise<{ submission: SubmissionRow }> {
  const resp = await fetch(`/api/submissions/${id}`, { credentials: "same-origin" })
  return unwrap(resp)
}

/** PATCH /api/submissions/:id — edit a still-pending submission. */
export async function patchSubmission(id: number, payload: SubmissionPayload): Promise<void> {
  const resp = await fetch(`/api/submissions/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  })
  await unwrap(resp)
}

export type QueueEntry = {
  id: number
  name: string
  architect: string
  city: string
  submitter_name: string | null
  created_at: string
}

/** GET /api/submissions — moderator queue (pending only). */
export async function listQueue(): Promise<{ submissions: QueueEntry[] }> {
  const resp = await fetch("/api/submissions", { credentials: "same-origin" })
  return unwrap(resp)
}

/** POST /api/submissions/:id/decision — approve or reject. */
export async function decideSubmission(
  id: number,
  decision: "approve" | "reject",
  note?: string,
): Promise<void> {
  const resp = await fetch(`/api/submissions/${id}/decision`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ decision, note: note ?? null }),
  })
  await unwrap(resp)
}
