import Database from "better-sqlite3"
import { writeFile } from "fs/promises"
import { mkdtempSync, writeFileSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import {
  SQL_GET_ALL_ARCHITECTURES,
  SQL_GET_PHOTOS,
} from "@nolli/data"
import type { PosterBuilding } from "../src/types"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Public R2 db URL (same artifact Nolli's worker fetches at runtime).
// Overridable via env for local/non-prod dbs.
const DB_URL =
  process.env.VITE_R2_PUBLIC_DB_URL ?? "https://db.nolli-map.com"
const DB_LATEST = `${DB_URL}/latest.db`
const OUT_PATH = join(__dirname, "..", "public", "snapshot.json")

type ArchRow = {
  id: number
  slug: string
  name: string
  year: number
  latitude: number
  longitude: number
  architect: string
  cover_image: string | null
}

type PhotoRow = {
  image: string
  caption: string | null
  width: number
  height: number
  is_cover: number
}

function pickCover(photos: PhotoRow[]): PhotoRow | undefined {
  return photos.find((p) => p.is_cover === 1) ?? photos[0]
}

async function main() {
  const res = await fetch(DB_LATEST)
  if (!res.ok) {
    throw new Error(`Failed to fetch db (${res.status}): ${DB_LATEST}`)
  }
  const dbBuffer = Buffer.from(await res.arrayBuffer())

  // better-sqlite3 v12 cannot open a serialized Buffer in this environment
  // (SQLITE_CANTOPEN at prepare()); write it to a temp file and open that
  // readonly, which is what `readonly: true` is intended for.
  const tmpDir = mkdtempSync(join(tmpdir(), "nolli-snapshot-"))
  const dbPath = join(tmpDir, "latest.db")
  writeFileSync(dbPath, dbBuffer)
  const db = new Database(dbPath, { readonly: true })

  try {
    const archs = db.prepare(SQL_GET_ALL_ARCHITECTURES).all() as ArchRow[]
    const photosStmt = db.prepare(SQL_GET_PHOTOS)

    const buildings: PosterBuilding[] = []
    for (const a of archs) {
      const photos = photosStmt.all(a.id) as PhotoRow[]
      const cover = pickCover(photos)
      if (!cover) continue // skip buildings with no usable photo

      buildings.push({
        id: a.id,
        slug: a.slug,
        name: a.name,
        architect: a.architect,
        year: a.year,
        coordinates: { lng: a.longitude, lat: a.latitude },
        coverImage: a.cover_image,
        cover: {
          image: cover.image,
          width: cover.width,
          height: cover.height,
        },
      })
    }

    await writeFile(OUT_PATH, JSON.stringify(buildings))
    console.log(`Wrote ${buildings.length} buildings → ${OUT_PATH}`)
  } finally {
    db.close()
    rmSync(tmpDir, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
