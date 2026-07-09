import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"

export function r2(env: Env): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  })
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
  env: Env,
  key: string,
  body: ArrayBuffer,
  contentType: string
): Promise<void> {
  const client = r2(env)
  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_STAGING,
      Key: key,
      Body: new Uint8Array(body),
      ContentType: contentType,
    })
  )
}

export async function copyToProd(
  env: Env,
  stagingKey: string,
  prodKey: string
): Promise<void> {
  const client = r2(env)
  await client.send(
    new CopyObjectCommand({
      Bucket: env.R2_BUCKET_IMAGES,
      Key: prodKey,
      CopySource: `${env.R2_BUCKET_STAGING}/${stagingKey}`,
    })
  )
}

export async function deleteStaging(env: Env, key: string): Promise<void> {
  const client = r2(env)
  await client.send(
    new DeleteObjectCommand({ Bucket: env.R2_BUCKET_STAGING, Key: key })
  )
}

export async function deleteProd(env: Env, key: string): Promise<void> {
  const client = r2(env)
  await client.send(
    new DeleteObjectCommand({ Bucket: env.R2_BUCKET_IMAGES, Key: key })
  )
}
