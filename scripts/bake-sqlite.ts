import { createClient } from "@supabase/supabase-js"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import Database from "better-sqlite3"
import { createHash } from "crypto"
import { readFile, unlink } from "fs/promises"
import { join } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))

const DB_PATH = join(__dirname, "..", "nolli-map.db")
const PAGE_SIZE = 1000

const DRY_RUN = process.argv.includes("--dry-run")

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_MAP_DB_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_MAP_DB_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_MAP_DB_SECRET_ACCESS_KEY!,
  },
})

const R2_BUCKET = "nolli-map-db"

function log(msg: string) {
  console.log(`[${DRY_RUN ? "DRY-RUN" : "BAKE"}] ${msg}`)
}

interface RowCounts {
  [table: string]: number
}

const rowCounts: RowCounts = {}

function createSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS countries (
      id INTEGER PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      country_id INTEGER NOT NULL REFERENCES countries(id)
    );

    CREATE TABLE IF NOT EXISTS architects (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      country_id INTEGER NOT NULL REFERENCES countries(id)
    );

    CREATE TABLE IF NOT EXISTS architectures (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      architect_id INTEGER NOT NULL REFERENCES architects(id),
      year INTEGER,
      address TEXT,
      city_id INTEGER REFERENCES cities(id),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      google_maps_url TEXT
    );

    CREATE TABLE IF NOT EXISTS architecture_photos (
      id INTEGER PRIMARY KEY,
      architecture_id INTEGER NOT NULL REFERENCES architectures(id),
      image TEXT NOT NULL,
      caption TEXT,
      width INTEGER,
      height INTEGER,
      is_cover INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS architecture_notes (
      id INTEGER PRIMARY KEY,
      architecture_id INTEGER NOT NULL REFERENCES architectures(id),
      text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS architecture_links (
      id INTEGER PRIMARY KEY,
      architecture_id INTEGER NOT NULL REFERENCES architectures(id),
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_cities_country_id ON cities(country_id);
    CREATE INDEX IF NOT EXISTS idx_architects_country_id ON architects(country_id);
    CREATE INDEX IF NOT EXISTS idx_architectures_architect_id ON architectures(architect_id);
    CREATE INDEX IF NOT EXISTS idx_architectures_city_id ON architectures(city_id);
    CREATE INDEX IF NOT EXISTS idx_architectures_coordinates ON architectures(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_architecture_photos_architecture_id ON architecture_photos(architecture_id);
    CREATE INDEX IF NOT EXISTS idx_architecture_notes_architecture_id ON architecture_notes(architecture_id);
    CREATE INDEX IF NOT EXISTS idx_architecture_links_architecture_id ON architecture_links(architecture_id);
  `)
}

async function fetchAllRows<T extends Record<string, unknown>>(
  table: string,
  select: string = "*"
): Promise<T[]> {
  const allRows: T[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(offset, offset + PAGE_SIZE - 1)
      .order("id")

    if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`)
    if (!data || data.length === 0) break

    allRows.push(...(data as T[]))
    offset += PAGE_SIZE

    if (data.length < PAGE_SIZE) break
  }

  return allRows
}

type CountryRow = { id: number; code: string; name: string }
type CityRow = { id: number; name: string; country_id: number }
type ArchitectRow = { id: number; name: string; country_id: number }

async function bakeCountries(db: Database.Database) {
  const rows = await fetchAllRows<CountryRow>("countries")
  const insert = db.prepare(
    "INSERT OR REPLACE INTO countries (id, code, name) VALUES (?, ?, ?)"
  )
  db.transaction(() => {
    for (const r of rows) insert.run(r.id, r.code, r.name)
  })()
  rowCounts.countries = rows.length
  log(`Countries: ${rows.length}`)
}

async function bakeCities(db: Database.Database) {
  const rows = await fetchAllRows<CityRow>("cities")
  const insert = db.prepare(
    "INSERT OR REPLACE INTO cities (id, name, country_id) VALUES (?, ?, ?)"
  )
  db.transaction(() => {
    for (const r of rows) insert.run(r.id, r.name, r.country_id)
  })()
  rowCounts.cities = rows.length
  log(`Cities: ${rows.length}`)
}

async function bakeArchitects(db: Database.Database) {
  const rows = await fetchAllRows<ArchitectRow>("architects")
  const insert = db.prepare(
    "INSERT OR REPLACE INTO architects (id, name, country_id) VALUES (?, ?, ?)"
  )
  db.transaction(() => {
    for (const r of rows) insert.run(r.id, r.name, r.country_id)
  })()
  rowCounts.architects = rows.length
  log(`Architects: ${rows.length}`)
}

type ArchRow = {
  id: number
  slug: string
  name: string
  architect_id: number
  year: number | null
  address: string | null
  city_id: number | null
  latitude: number
  longitude: number
  google_maps_url: string | null
}

async function bakeArchitectures(db: Database.Database) {
  const rows = await fetchAllRows<ArchRow>("architectures")
  const insert = db.prepare(
    `INSERT OR REPLACE INTO architectures
      (id, slug, name, architect_id, year, address, city_id, latitude, longitude, google_maps_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  db.transaction(() => {
    for (const r of rows)
      insert.run(
        r.id,
        r.slug,
        r.name,
        r.architect_id,
        r.year,
        r.address,
        r.city_id,
        r.latitude,
        r.longitude,
        r.google_maps_url
      )
  })()
  rowCounts.architectures = rows.length
  log(`Architectures: ${rows.length}`)
}

type PhotoRow = {
  id: number
  architecture_id: number
  image: string
  caption: string | null
  width: number | null
  height: number | null
  is_cover: boolean
}

async function bakePhotos(db: Database.Database) {
  const rows = await fetchAllRows<PhotoRow>("architecture_photos")
  const insert = db.prepare(
    `INSERT OR REPLACE INTO architecture_photos
      (id, architecture_id, image, caption, width, height, is_cover)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  db.transaction(() => {
    for (const r of rows)
      insert.run(
        r.id,
        r.architecture_id,
        r.image,
        r.caption,
        r.width,
        r.height,
        r.is_cover ? 1 : 0
      )
  })()
  rowCounts.architecture_photos = rows.length
  log(`Photos: ${rows.length}`)
}

type NoteRow = {
  id: number
  architecture_id: number
  text: string
}

async function bakeNotes(db: Database.Database) {
  const rows = await fetchAllRows<NoteRow>("architecture_notes")
  const insert = db.prepare(
    `INSERT OR REPLACE INTO architecture_notes
      (id, architecture_id, text)
     VALUES (?, ?, ?)`
  )
  db.transaction(() => {
    for (const r of rows) insert.run(r.id, r.architecture_id, r.text)
  })()
  rowCounts.architecture_notes = rows.length
  log(`Notes: ${rows.length}`)
}

type LinkRow = {
  id: number
  architecture_id: number
  type: string
  url: string
  label: string
  sort_order: number
}

async function bakeLinks(db: Database.Database) {
  const rows = await fetchAllRows<LinkRow>("architecture_links")
  const insert = db.prepare(
    `INSERT OR REPLACE INTO architecture_links
      (id, architecture_id, type, url, label, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
  db.transaction(() => {
    for (const r of rows)
      insert.run(
        r.id,
        r.architecture_id,
        r.type,
        r.url,
        r.label,
        r.sort_order
      )
  })()
  rowCounts.architecture_links = rows.length
  log(`Links: ${rows.length}`)
}

async function uploadToR2() {
  const dbBuffer = await readFile(DB_PATH)
  const version = createHash("sha256").update(dbBuffer).digest("hex")

  const manifest = JSON.stringify({
    version,
    generatedAt: new Date().toISOString(),
    rowCounts,
  })

  if (DRY_RUN) {
    log(`Would upload latest.db (${dbBuffer.length} bytes, sha256: ${version.slice(0, 12)}...)`)
    log(`Would upload manifest.json (${manifest.length} bytes)`)
    return
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: "latest.db",
      Body: dbBuffer,
      ContentType: "application/x-sqlite3",
    })
  )
  log(`Uploaded latest.db (${dbBuffer.length} bytes)`)

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: "manifest.json",
      Body: manifest,
      ContentType: "application/json",
    })
  )
  log("Uploaded manifest.json")

  await unlink(DB_PATH)
  log("Cleaned up local db file")
}

async function main() {
  log("Starting bake")
  log(`DB path: ${DB_PATH}`)

  if (DRY_RUN) {
    log("Dry run — no writes to R2")
  }

  const db = new Database(DB_PATH)
  db.pragma("journal_mode = WAL")
  db.pragma("synchronous = NORMAL")

  createSchema(db)

  log("Schema created")

  await bakeCountries(db)
  await bakeCities(db)
  await bakeArchitects(db)
  await bakeArchitectures(db)
  await bakePhotos(db)
  await bakeNotes(db)
  await bakeLinks(db)

  db.close()
  log("SQLite closed")

  await uploadToR2()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
