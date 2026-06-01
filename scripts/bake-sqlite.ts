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

  db.close()
  log("SQLite closed")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
