import dotenv from "dotenv"
dotenv.config({ path: [".env.local", ".env"] })
import postgres from "postgres"
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { createHash } from "crypto"
import { readdir, readFile, stat } from "fs/promises"
import { join, extname } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))

const DATA_DIR = join(__dirname, "data")

const DRY_RUN = process.argv.includes("--dry-run")

// One client for the whole run; same connection settings as the worker.
const sql = postgres(process.env.DATABASE_URL!, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
})

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const R2_BUCKET = process.env.R2_BUCKET_IMAGES!
const R2_PUBLIC_IMAGES_URL = process.env.R2_PUBLIC_IMAGES_URL!

interface Meta {
  name: string
  architect: string
  architectCountry: string
  year: number
  address: string
  city: string
  country: string
  latitude: number
  longitude: number
  googleMapsUrl: string
  coverImage?: string
  notes?: string[]
  links?: { type: string; url: string; label: string }[]
}

interface Stats {
  countries: { skipped: number; missing: number }
  cities: { created: number; skipped: number }
  architects: { created: number; skipped: number }
  architectures: { created: number; updated: number }
  photos: { uploaded: number; skipped: number }
  notes: { inserted: number }
  links: { inserted: number }
}

const stats: Stats = {
  countries: { skipped: 0, missing: 0 },
  cities: { created: 0, skipped: 0 },
  architects: { created: 0, skipped: 0 },
  architectures: { created: 0, updated: 0 },
  photos: { uploaded: 0, skipped: 0 },
  notes: { inserted: 0 },
  links: { inserted: 0 },
}

function log(msg: string) {
  console.log(`[${DRY_RUN ? "DRY-RUN" : "SEED"}] ${msg}`)
}

// `db` is the request/connection-scoped sql (the module-level `sql`, or the `tx`
// inside a per-slug transaction). Helpers run on whichever is passed in.
type Db = postgres.Sql

// Countries must already exist in the DB (seeded from supabase/seeds/countries.sql).
// Look up by ISO `code`; never insert. A missing code is a data error we surface,
// not silently paper over with a new row.
async function getCountryId(db: Db, code: string): Promise<number> {
  const [row] = await db<{ id: number }>`
    SELECT id FROM countries WHERE code = ${code} LIMIT 1
  `

  if (row) {
    stats.countries.skipped++
    return row.id
  }

  stats.countries.missing++
  throw new Error(
    `Country code not found in DB: ${code}. Add it to supabase/seeds/countries.sql before seeding.`
  )
}

async function getOrCreateCity(
  db: Db,
  name: string,
  countryId: number
): Promise<number> {
  const [row] = await db<{ id: number }>`
    SELECT id FROM cities WHERE name = ${name} AND country_id = ${countryId} LIMIT 1
  `

  if (row) {
    stats.cities.skipped++
    return row.id
  }

  if (DRY_RUN) {
    log(`Would create city: ${name}`)
    stats.cities.created++
    return -1
  }

  const [inserted] = await db<{ id: number }>`
    INSERT INTO cities (name, country_id) VALUES (${name}, ${countryId}) RETURNING id
  `

  stats.cities.created++
  log(`Created city: ${name}`)
  return inserted.id
}

async function getOrCreateArchitect(
  db: Db,
  name: string,
  countryId: number
): Promise<number> {
  const [row] = await db<{ id: number }>`
    SELECT id FROM architects WHERE name = ${name} LIMIT 1
  `

  if (row) {
    stats.architects.skipped++
    return row.id
  }

  if (DRY_RUN) {
    log(`Would create architect: ${name}`)
    stats.architects.created++
    return -1
  }

  const [inserted] = await db<{ id: number }>`
    INSERT INTO architects (name, country_id) VALUES (${name}, ${countryId}) RETURNING id
  `

  stats.architects.created++
  log(`Created architect: ${name}`)
  return inserted.id
}

const MAX_DIMENSION = 1280

async function prepareImage(filePath: string): Promise<Buffer> {
  const sharp = (await import("sharp")).default
  const meta = await sharp(filePath).metadata()
  const w = meta.width ?? 0
  const h = meta.height ?? 0

  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    log(`  Resizing ${filePath.split("/").pop()} (${w}x${h})`)
    return sharp(filePath)
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer()
  }

  return readFile(filePath)
}

async function uploadImage(
  slug: string,
  filePath: string,
  fileName: string
): Promise<{ url: string; width: number; height: number }> {
  const sharp = (await import("sharp")).default
  const ext = extname(fileName)
  const body = await prepareImage(filePath)
  const hash = createHash("sha256").update(body).digest("hex")
  const key = `architectures/${slug}/${hash}${ext}`

  const meta = await sharp(body).metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0

  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    stats.photos.skipped++
    log(`  R2 exists, skipped: ${key}`)
  } catch {
    if (DRY_RUN) {
      log(`  Would upload: ${key} (${width}x${height})`)
      stats.photos.uploaded++
    } else {
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: body,
          ContentType: `image/${ext.replace(".", "")}`,
        })
      )
      stats.photos.uploaded++
      log(`  Uploaded: ${key} (${width}x${height})`)
    }
  }

  return {
    url: `${R2_PUBLIC_IMAGES_URL}/${key}`,
    width,
    height,
  }
}

async function processSlug(slugDir: string) {
  const slug = slugDir.split("/").pop()!
  const metaPath = join(slugDir, "meta.json")

  let meta: Meta
  try {
    const raw = await readFile(metaPath, "utf-8")
    meta = JSON.parse(raw)
  } catch {
    log(`Skipping ${slug}: no valid meta.json`)
    return
  }

  log(`Processing: ${slug}`)

  // Image uploads are pure R2 work. Do them before opening the DB transaction
  // so the single connection isn't held across slow network I/O.
  const files = await readdir(slugDir)
  const imageFiles = files.filter(
    (f) => f !== "meta.json" && /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(f)
  )

  const imageEntries: {
    file: string
    url: string
    width: number
    height: number
  }[] = []
  for (const file of imageFiles) {
    const result = await uploadImage(slug, join(slugDir, file), file)
    imageEntries.push({ file, ...result })
  }

  // One transaction per slug: a slug either fully applies or fully rolls back.
  await sql.begin(async (tx) => {
    const countryId = await getCountryId(tx, meta.country)
    const cityId = await getOrCreateCity(tx, meta.city, countryId)

    let architectCountryId = countryId
    if (meta.architectCountry && meta.architectCountry !== meta.country) {
      architectCountryId = await getCountryId(tx, meta.architectCountry)
    }
    const architectId = await getOrCreateArchitect(
      tx,
      meta.architect,
      architectCountryId
    )

    const [existing] = await tx<{ id: number }>`
      SELECT id FROM architectures WHERE slug = ${slug} LIMIT 1
    `

    let archId: number

    if (existing) {
      if (DRY_RUN) {
        log(`  Would update architecture: ${slug}`)
        archId = existing.id
      } else {
        const [updated] = await tx`
          UPDATE architectures
          SET name = ${meta.name},
              architect_id = ${architectId},
              year = ${meta.year},
              address = ${meta.address},
              city_id = ${cityId},
              latitude = ${meta.latitude},
              longitude = ${meta.longitude},
              google_maps_url = ${meta.googleMapsUrl}
          WHERE slug = ${slug}
          RETURNING id
        `
        archId = updated.id
      }
      stats.architectures.updated++
    } else {
      if (DRY_RUN) {
        log(`  Would create architecture: ${slug}`)
        archId = -1
      } else {
        const [inserted] = await tx`
          INSERT INTO architectures (
            slug, name, architect_id, year, address,
            city_id, latitude, longitude, google_maps_url
          ) VALUES (
            ${slug}, ${meta.name}, ${architectId}, ${meta.year}, ${meta.address},
            ${cityId}, ${meta.latitude}, ${meta.longitude}, ${meta.googleMapsUrl}
          )
          RETURNING id
        `
        archId = inserted.id
      }
      stats.architectures.created++
    }

    if (!DRY_RUN) {
      await tx`DELETE FROM architecture_photos WHERE architecture_id = ${archId}`
      log(`  Cleared old photos for ${slug}`)
    }

    for (const entry of imageEntries) {
      if (DRY_RUN) {
        log(`  Would insert photo: ${entry.file}`)
        continue
      }

      const isCover = meta.coverImage
        ? entry.file === meta.coverImage
        : imageEntries[0]?.file === entry.file

      await tx`
        INSERT INTO architecture_photos (architecture_id, image, is_cover, caption, width, height)
        VALUES (${archId}, ${entry.url}, ${isCover}, null, ${entry.width}, ${entry.height})
      `
    }

    if (meta.notes?.length) {
      if (!DRY_RUN) {
        await tx`DELETE FROM architecture_notes WHERE architecture_id = ${archId}`
      }

      for (const text of meta.notes) {
        if (DRY_RUN) {
          log(`  Would insert note: "${text.slice(0, 40)}..."`)
        } else {
          await tx`
            INSERT INTO architecture_notes (architecture_id, text)
            VALUES (${archId}, ${text})
          `
        }
        stats.notes.inserted++
      }
    }

    if (meta.links?.length) {
      if (!DRY_RUN) {
        await tx`DELETE FROM architecture_links WHERE architecture_id = ${archId}`
      }

      for (let i = 0; i < meta.links.length; i++) {
        const link = meta.links[i]
        if (DRY_RUN) {
          log(`  Would insert link: ${link.type} - ${link.label}`)
        } else {
          await tx`
            INSERT INTO architecture_links (architecture_id, type, url, label, sort_order)
            VALUES (${archId}, ${link.type}, ${link.url}, ${link.label}, ${i})
          `
        }
        stats.links.inserted++
      }
    }
  })
}

async function main() {
  log("Starting seed script")

  let entries: string[]
  try {
    entries = await readdir(DATA_DIR)
  } catch {
    log(`No data directory found at ${DATA_DIR}`)
    process.exitCode = 1
    return
  }

  const slugDirs: string[] = []
  for (const entry of entries) {
    const fullPath = join(DATA_DIR, entry)
    const s = await stat(fullPath)
    if (s.isDirectory()) slugDirs.push(fullPath)
  }

  if (slugDirs.length === 0) {
    log("No slug directories found in data/")
    return
  }

  log(`Found ${slugDirs.length} architecture(s) to process`)

  for (const dir of slugDirs) {
    try {
      await processSlug(dir)
    } catch (err) {
      console.error(`Error processing ${dir}: ${err}`)
    }
  }

  console.log("\n--- Summary ---")
  console.log(
    `Countries:  ${stats.countries.skipped} existing, ${stats.countries.missing} missing`
  )
  console.log(
    `Cities:     ${stats.cities.created} created, ${stats.cities.skipped} existing`
  )
  console.log(
    `Architects: ${stats.architects.created} created, ${stats.architects.skipped} existing`
  )
  console.log(
    `Architectures: ${stats.architectures.created} created, ${stats.architectures.updated} updated`
  )
  console.log(
    `Photos:     ${stats.photos.uploaded} uploaded, ${stats.photos.skipped} unchanged`
  )
  console.log(`Notes:      ${stats.notes.inserted} inserted`)
  console.log(`Links:      ${stats.links.inserted} inserted`)
  log("Done")
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => sql.end({ timeout: 5 }))
