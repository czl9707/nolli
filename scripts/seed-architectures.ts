import dotenv from "dotenv"
dotenv.config({ path: [".env.local", ".env"] })
import { createClient } from "@supabase/supabase-js"
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

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const R2_BUCKET = process.env.R2_BUCKET_IMAGES!
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!

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
  countries: { created: number; skipped: number }
  cities: { created: number; skipped: number }
  architects: { created: number; skipped: number }
  architectures: { created: number; updated: number }
  photos: { uploaded: number; skipped: number }
  notes: { inserted: number }
  links: { inserted: number }
}

const stats: Stats = {
  countries: { created: 0, skipped: 0 },
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

async function getOrCreateCountry(code: string, name: string): Promise<number> {
  const { data } = await supabase
    .from("countries")
    .select("id")
    .eq("code", code)
    .single()

  if (data) {
    stats.countries.skipped++
    return data.id
  }

  if (DRY_RUN) {
    log(`Would create country: ${code} (${name})`)
    stats.countries.created++
    return -1
  }

  const { data: inserted, error } = await supabase
    .from("countries")
    .insert({ code, name })
    .select("id")
    .single()

  if (error)
    throw new Error(`Failed to create country ${code}: ${error.message}`)
  stats.countries.created++
  log(`Created country: ${code} (${name})`)
  return inserted.id
}

async function getOrCreateCity(
  name: string,
  countryId: number
): Promise<number> {
  const { data } = await supabase
    .from("cities")
    .select("id")
    .eq("name", name)
    .eq("country_id", countryId)
    .single()

  if (data) {
    stats.cities.skipped++
    return data.id
  }

  if (DRY_RUN) {
    log(`Would create city: ${name}`)
    stats.cities.created++
    return -1
  }

  const { data: inserted, error } = await supabase
    .from("cities")
    .insert({ name, country_id: countryId })
    .select("id")
    .single()

  if (error) throw new Error(`Failed to create city ${name}: ${error.message}`)
  stats.cities.created++
  log(`Created city: ${name}`)
  return inserted.id
}

async function getOrCreateArchitect(
  name: string,
  countryId: number
): Promise<number> {
  const { data } = await supabase
    .from("architects")
    .select("id")
    .eq("name", name)
    .single()

  if (data) {
    stats.architects.skipped++
    return data.id
  }

  if (DRY_RUN) {
    log(`Would create architect: ${name}`)
    stats.architects.created++
    return -1
  }

  const { data: inserted, error } = await supabase
    .from("architects")
    .insert({ name, country_id: countryId })
    .select("id")
    .single()

  if (error)
    throw new Error(`Failed to create architect ${name}: ${error.message}`)
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
    url: `${R2_PUBLIC_URL}/${key}`,
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

  const countryId = await getOrCreateCountry(meta.country, meta.country)
  const cityId = await getOrCreateCity(meta.city, countryId)

  let architectCountryId = countryId
  if (meta.architectCountry && meta.architectCountry !== meta.country) {
    architectCountryId = await getOrCreateCountry(
      meta.architectCountry,
      meta.architectCountry
    )
  }
  const architectId = await getOrCreateArchitect(
    meta.architect,
    architectCountryId
  )

  const { data: existing } = await supabase
    .from("architectures")
    .select("id")
    .eq("slug", slug)
    .single()

  let archId: number

  if (existing) {
    if (DRY_RUN) {
      log(`  Would update architecture: ${slug}`)
      archId = existing.id
    } else {
      const { data: updated, error } = await supabase
        .from("architectures")
        .update({
          name: meta.name,
          architect_id: architectId,
          year: meta.year,
          address: meta.address,
          city_id: cityId,
          latitude: meta.latitude,
          longitude: meta.longitude,
          google_maps_url: meta.googleMapsUrl,
        })
        .eq("slug", slug)
        .select("id")
        .single()

      if (error)
        throw new Error(
          `Failed to update architecture ${slug}: ${error.message}`
        )
      archId = updated.id
    }
    stats.architectures.updated++
  } else {
    if (DRY_RUN) {
      log(`  Would create architecture: ${slug}`)
      archId = -1
    } else {
      const { data: inserted, error } = await supabase
        .from("architectures")
        .insert({
          slug,
          name: meta.name,
          architect_id: architectId,
          year: meta.year,
          address: meta.address,
          city_id: cityId,
          latitude: meta.latitude,
          longitude: meta.longitude,
          google_maps_url: meta.googleMapsUrl,
        })
        .select("id")
        .single()

      if (error)
        throw new Error(
          `Failed to insert architecture ${slug}: ${error.message}`
        )
      archId = inserted.id
    }
    stats.architectures.created++
  }

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

  if (!DRY_RUN) {
    await supabase
      .from("architecture_photos")
      .delete()
      .eq("architecture_id", archId)
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

    const { error } = await supabase.from("architecture_photos").insert({
      architecture_id: archId,
      image: entry.url,
      is_cover: isCover,
      caption: null,
      width: entry.width,
      height: entry.height,
    })

    if (error)
      throw new Error(`Failed to insert photo ${entry.file}: ${error.message}`)
  }

  if (meta.notes?.length) {
    if (!DRY_RUN) {
      await supabase
        .from("architecture_notes")
        .delete()
        .eq("architecture_id", archId)
    }

    for (const text of meta.notes) {
      if (DRY_RUN) {
        log(`  Would insert note: "${text.slice(0, 40)}..."`)
      } else {
        const { error } = await supabase.from("architecture_notes").insert({
          architecture_id: archId,
          text,
        })
        if (error) throw new Error(`Failed to insert note: ${error.message}`)
      }
      stats.notes.inserted++
    }
  }

  if (meta.links?.length) {
    if (!DRY_RUN) {
      await supabase
        .from("architecture_links")
        .delete()
        .eq("architecture_id", archId)
    }

    for (let i = 0; i < meta.links.length; i++) {
      const link = meta.links[i]
      if (DRY_RUN) {
        log(`  Would insert link: ${link.type} - ${link.label}`)
      } else {
        const { error } = await supabase.from("architecture_links").insert({
          architecture_id: archId,
          type: link.type,
          url: link.url,
          label: link.label,
          sort_order: i,
        })
        if (error)
          throw new Error(
            `Failed to insert link ${link.type}: ${error.message}`
          )
      }
      stats.links.inserted++
    }
  }
}

async function main() {
  log("Starting seed script")

  let entries: string[]
  try {
    entries = await readdir(DATA_DIR)
  } catch {
    log(`No data directory found at ${DATA_DIR}`)
    process.exit(1)
  }

  const slugDirs: string[] = []
  for (const entry of entries) {
    const fullPath = join(DATA_DIR, entry)
    const s = await stat(fullPath)
    if (s.isDirectory()) slugDirs.push(fullPath)
  }

  if (slugDirs.length === 0) {
    log("No slug directories found in data/")
    process.exit(0)
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
    `Countries:  ${stats.countries.created} created, ${stats.countries.skipped} existing`
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
