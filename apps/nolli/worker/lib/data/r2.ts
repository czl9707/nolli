// Per-request R2 handle, built once in middleware from the live request env and
// stashed on the Hono context (mirrors the `db` middleware's `sql`). The two
// R2Bucket bindings are provided by the runtime from wrangler.jsonc — no client
// construction, no credentials, no endpoint. Handlers read `c.get("r2")` and
// never reach for `c.env` for bucket config.
export type R2Context = {
  staging: R2Bucket
  images: R2Bucket
  publicImagesUrl: string
}

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
}

export const ALLOWED_CONTENT_TYPES = Object.keys(EXT_BY_TYPE)
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export function extFor(contentType: string): string {
  return EXT_BY_TYPE[contentType] ?? ".bin"
}

async function hashKey(body: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", body)
  let hex = ""
  for (const b of new Uint8Array(digest)) hex += b.toString(16).padStart(2, "0")
  return hex
}

export async function newStagingKey(
  submitterId: number,
  ext: string,
  body: ArrayBuffer
): Promise<string> {
  return `staging/${submitterId}/${await hashKey(body)}${ext}`
}

export function newProdKey(slug: string, stagingKey: string): string {
  const tail = stagingKey.slice(stagingKey.lastIndexOf("/") + 1)
  return `architectures/${slug}/${tail}`
}

export async function putStaging(
  ctx: R2Context,
  key: string,
  body: ArrayBuffer,
  contentType: string
): Promise<void> {
  await ctx.staging.put(key, body, { httpMetadata: { contentType } })
}

// Cross-bucket copy via get→put: R2Bucket.copy() is same-bucket only, and the
// two buckets are separate bindings. Streams through the worker, fine for
// image-sized objects (≤ MAX_IMAGE_BYTES).
export async function copyToProd(
  ctx: R2Context,
  stagingKey: string,
  prodKey: string
): Promise<void> {
  const obj = await ctx.staging.get(stagingKey)
  if (!obj) throw new Error(`staging object not found: ${stagingKey}`)
  await ctx.images.put(prodKey, obj.body, { httpMetadata: obj.httpMetadata })
}

export async function deleteStaging(ctx: R2Context, key: string): Promise<void> {
  await ctx.staging.delete(key)
}

export async function deleteProd(ctx: R2Context, key: string): Promise<void> {
  await ctx.images.delete(key)
}
