import dotenv from "dotenv"
dotenv.config({ path: [".env.local", ".env"] })
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
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const R2_BUCKET = process.env.R2_BUCKET_DB!;

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

const TABLE_COLUMNS: Record<string, string[]> = {
  countries: ["id", "code", "name"],
  cities: ["id", "name", "country_id"],
  architects: ["id", "name", "country_id"],
  architectures: [
    "id",
    "slug",
    "name",
    "architect_id",
    "year",
    "address",
    "city_id",
    "latitude",
    "longitude",
    "google_maps_url",
  ],
  architecture_photos: [
    "id",
    "architecture_id",
    "image",
    "caption",
    "width",
    "height",
    "is_cover",
  ],
  architecture_notes: ["id", "architecture_id", "text"],
  architecture_links: [
    "id",
    "architecture_id",
    "type",
    "url",
    "label",
    "sort_order",
  ],
}

const TABLE_TRANSFORMS: Record<string, (row: Record<string, unknown>) => unknown[]> = {
  architecture_photos: (row) => [
    row.id,
    row.architecture_id,
    row.image,
    row.caption,
    row.width,
    row.height,
    row.is_cover ? 1 : 0,
  ],
}

async function populateTable(
  db: Database.Database,
  table: string,
  columns: string[]
) {
  const rows = await fetchAllRows(table)
  const cols = columns.join(", ")
  const placeholders = columns.map(() => "?").join(", ")
  const insert = db.prepare(
    `INSERT OR REPLACE INTO ${table} (${cols}) VALUES (${placeholders})`
  )
  const transform = TABLE_TRANSFORMS[table]
  db.transaction(() => {
    for (const r of rows) {
      insert.run(...(transform ? transform(r) : columns.map((c) => r[c])))
    }
  })()
  rowCounts[table] = rows.length
  log(`${table}: ${rows.length}`)
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

  const tableOrder = [
    "countries",
    "cities",
    "architects",
    "architectures",
    "architecture_photos",
    "architecture_notes",
    "architecture_links",
  ]

  for (const table of tableOrder) {
    await populateTable(db, table, TABLE_COLUMNS[table])
  }

  db.close()
  log("SQLite closed")

  await uploadToR2()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
