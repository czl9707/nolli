/**
 * Bakes public/landing-data.json from the live DB. Static JSON on purpose:
 * no sqlite-wasm worker, no COEP, tiny LCP payload for the landing.
 *
 * Usage:
 *   pnpm --filter landing gen:data              # bake
 *   pnpm --filter landing gen:data -- --fresh   # re-download DB, then bake
 *   pnpm --filter landing gen:data -- --discover pompidou
 */
import Database from "better-sqlite3"
import { createWriteStream, existsSync, mkdirSync, rename, rmSync, unlink, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const DB_URL = "https://db.nolli-map.com/latest.db"
const CACHE_DIR = process.env.NOLLI_DB_DIR ?? join(homedir(), ".nolli")
const CACHE_PATH = join(CACHE_DIR, "latest.db")
const DEST_PATH = join(import.meta.dirname, "..", "public", "landing-data.json")

/** Slug of the board-scene architecture. Verify first with --discover. */
const HERO_SLUG = "centre-pompidou"
/** City whose cluster the index scene flies to (hero's city). */
const CLUSTER_CITY = "Paris"
/** Closeup board rotation set (cluster provenance, distinct architects). */
const BOARD_SLUGS = [
  "centre-pompidou",
  "cite-de-refuge",
  "musee-du-quai-branly",
  "french-communist-party-headquarters",
  "fondation-louis-vuitton",
]

async function ensureDb(fresh = false): Promise<string> {
  if (!fresh && existsSync(CACHE_PATH)) return CACHE_PATH
  if (existsSync(CACHE_PATH)) rmSync(CACHE_PATH)
  mkdirSync(CACHE_DIR, { recursive: true })
  await downloadDb(CACHE_PATH)
  return CACHE_PATH
}

async function downloadDb(dest: string): Promise<void> {
  const tmp = `${dest}.tmp-${process.pid}`
  try {
    const res = await fetch(DB_URL)
    if (!res.ok || !res.body) throw new Error(`fetch ${DB_URL} -> ${res.status}`)
    const file = createWriteStream(tmp)
    for await (const chunk of res.body as unknown as AsyncIterable<Buffer>) file.write(chunk)
    file.end()
    await new Promise<void>((resolve, reject) => {
      file.on("finish", resolve)
      file.on("error", reject)
    })
    await new Promise<void>((resolve, reject) =>
      rename(tmp, dest, (err) => (err ? reject(err) : resolve())),
    )
  } catch (err) {
    await new Promise<void>((resolve) => unlink(tmp, () => resolve()))
    throw err
  }
}

const summarySql = `
  SELECT a.id, a.slug, a.name, a.year, a.latitude AS lat, a.longitude AS lng,
         arch.name AS architect,
         p.image AS cover_image, p.width AS cover_width, p.height AS cover_height
  FROM architectures a
  JOIN architects arch ON a.architect_id = arch.id
  LEFT JOIN architecture_photos p ON p.architecture_id = a.id AND p.is_cover = 1
  ORDER BY a.id ASC
`

function main() {
  const args = process.argv.slice(2)
  const fresh = args.includes("--fresh")
  const discover = args.indexOf("--discover")
  return ensureDb(fresh).then(() => {
    const db = new Database(CACHE_PATH, { readonly: true })
    try {
      if (discover !== -1) {
        const term = args[discover + 1]
        if (!term) {
          console.log("usage: gen-landing-data.ts --discover <term>")
          return
        }
        const like = `%${term}%`
        const rows = db
          .prepare("SELECT slug, name FROM architectures WHERE slug LIKE ? OR name LIKE ?")
          .all(like, like) as { slug: string; name: string }[]
        for (const r of rows) console.log(`${r.slug}  ${r.name}`)
        return
      }

      const summaries = (db.prepare(summarySql).all() as Record<string, unknown>[]).map((r) => ({
        id: r.id as number,
        slug: r.slug as string,
        name: r.name as string,
        architect: r.architect as string,
        year: r.year as number,
        coordinates: { lng: r.lng as number, lat: r.lat as number },
        cover: {
          image: (r.cover_image ?? "") as string,
          width: (r.cover_width ?? 1) as number,
          height: (r.cover_height ?? 1) as number,
        },
      }))

      const detailStmt = db.prepare(
        `SELECT a.id, a.slug, a.name, a.year, a.address, a.google_maps_url,
                a.latitude AS lat, a.longitude AS lng,
                arch.name AS architect,
                ci.name AS city, co.name AS country
         FROM architectures a
         JOIN architects arch ON a.architect_id = arch.id
         LEFT JOIN cities ci ON a.city_id = ci.id
         LEFT JOIN countries co ON ci.country_id = co.id
         WHERE a.slug = ?`,
      )
      const detail = (slug: string) => {
        const row = detailStmt.get(slug) as Record<string, unknown>
        if (!row) throw new Error(`slug "${slug}" not found — run --discover`)
        const photos = db
          .prepare(
            "SELECT image, caption, width, height FROM architecture_photos WHERE architecture_id = ? ORDER BY is_cover DESC",
          )
          .all(row.id as number) as Record<string, unknown>[]
        const notes = db
          .prepare("SELECT text FROM architecture_notes WHERE architecture_id = ?")
          .all(row.id as number) as { text: string }[]
        const linkRows = db
          .prepare("SELECT type, url, label FROM architecture_links WHERE architecture_id = ? ORDER BY sort_order ASC")
          .all(row.id as number) as { type: string; url: string; label: string | null }[]
        const links: Record<string, unknown> = { googleMaps: (row.google_maps_url as string) || "" }
        const custom: { url: string; label: string }[] = []
        for (const l of linkRows) {
          if (l.type === "wikipedia") links.wikipedia = l.url
          else if (l.type === "archdaily") links.archdaily = l.url
          else custom.push({ url: l.url, label: l.label ?? l.url })
        }
        if (custom.length) links.custom = custom
        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          architect: row.architect,
          year: row.year,
          address: row.address ?? "",
          city: row.city ?? "",
          country: row.country ?? "",
          coordinates: { lng: row.lng, lat: row.lat },
          cover: summaries.find((s) => s.slug === slug)?.cover ?? { image: "", width: 1, height: 1 },
          photos: photos.map((p) => ({
            image: p.image as string,
            caption: (p.caption ?? undefined) as string | undefined,
            width: p.width as number,
            height: p.height as number,
          })),
          notes,
          links,
        }
      }

      const hero = detail(HERO_SLUG)

      const clusterSlugs = new Set(
        (db
          .prepare(
            "SELECT a.slug FROM architectures a LEFT JOIN cities ci ON a.city_id = ci.id WHERE ci.name = ?",
          )
          .all(CLUSTER_CITY) as { slug: string }[]).map((r) => r.slug),
      )
      const cluster = summaries.filter((s) => clusterSlugs.has(s.slug))

      const stats = {
        architectures: (db.prepare("SELECT COUNT(*) AS n FROM architectures").get() as { n: number }).n,
        architects: (
          db.prepare("SELECT COUNT(DISTINCT architect_id) AS n FROM architectures").get() as { n: number }
        ).n,
      }

      const out = {
        summaries,
        cluster,
        hero,
        boardSet: BOARD_SLUGS.map(detail),
        stats,
        heroCamera: { center: [hero.coordinates.lng, hero.coordinates.lat] as [number, number], zoom: 15.6 },
      }
      mkdirSync(join(DEST_PATH, ".."), { recursive: true })
      writeFileSync(DEST_PATH, JSON.stringify(out))
      console.log(
        `wrote ${DEST_PATH}: ${summaries.length} summaries, ${cluster.length} cluster, hero ${hero.slug}, boardSet ${BOARD_SLUGS.length}, ${stats.architectures} archs / ${stats.architects} architects`,
      )
    } finally {
      db.close()
    }
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
