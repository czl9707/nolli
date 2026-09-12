import postgres from "postgres"
import dotenv from "dotenv"
import { mkdir, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { ARCHITECT_DECK, CITY_DECK, STATS_DECK_SLUGS } from "../src/lib/constants"

export type ArchSummary = {
  id: number
  slug: string
  name: string
  architect: string
  year: number
  coordinates: { lat: number; lng: number }
  cover: { image: string; width: number; height: number }
}

export type LandingJson = {
  architects: { id: number; name: string }[]
  cities: { id: number; name: string; countryCode: string }[]
  /** Only the curated decks' slugs — everything else stays in the DB */
  all: ArchSummary[]
  /** Whole-collection count; `all` is a curated subset */
  buildingCount: number
  countryCounts: { code: string; count: number }[]
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, "..", "src", "data", "landing.json")
const ENV_PATH = join(__dirname, "..", "..", "nolli", ".env.local")

// Local dev convenience — build pipelines inject env directly.
try {
  dotenv.config({ path: ENV_PATH })
} catch {
  // no .env.local reachable; rely on injected env
}

if (!process.env.DATABASE_URL) {
  console.error(`DATABASE_URL not set (checked ${ENV_PATH})`)
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
})

type SummaryRow = {
  id: number
  slug: string
  name: string
  year: number | null
  latitude: number | null
  longitude: number | null
  architect: string
  cover_image: string | null
  cover_width: number | null
  cover_height: number | null
}

function mapSummaryRow(row: SummaryRow): ArchSummary {
  // Landing renders these unconditionally — fail the bake rather than ship nulls.
  if (
    row.year == null ||
    row.latitude == null ||
    row.longitude == null ||
    row.cover_image == null ||
    row.cover_width == null ||
    row.cover_height == null
  ) {
    throw new Error(`architecture "${row.slug}" is missing year/coordinates/cover`)
  }
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    architect: row.architect,
    year: row.year,
    coordinates: {
      lat: row.latitude,
      lng: row.longitude,
    },
    cover: {
      image: row.cover_image,
      width: row.cover_width,
      height: row.cover_height,
    },
  }
}

/** Union of every curated deck — the only architectures baked */
const wantedSlugs = [
  ...new Set([
    ...STATS_DECK_SLUGS,
    ...Object.values(CITY_DECK).flat(),
    ...Object.values(ARCHITECT_DECK).flat(),
  ]),
]

async function main(): Promise<void> {
  // Same queries as packages/data sqlite-queries, adjusted for Postgres:
  // is_cover is boolean; explicit ORDER BY keeps output deterministic.
  const [architects, cities, summaryRows, countRows, buildingCount] = await Promise.all([
    sql<{ id: number; name: string }[]>`
      SELECT id, name FROM architects ORDER BY name
    `,
    sql<{ id: number; name: string; country_code: string }[]>`
      SELECT ci.id, ci.name, c.code AS country_code
      FROM cities ci
      JOIN countries c ON ci.country_id = c.id
      ORDER BY ci.name
    `,
    sql<SummaryRow[]>`
      SELECT a.id, a.slug, a.name, a.year, a.latitude, a.longitude,
             arch.name AS architect,
             p.image AS cover_image,
             p.width AS cover_width,
             p.height AS cover_height
      FROM architectures a
      JOIN architects arch ON a.architect_id = arch.id
      LEFT JOIN architecture_photos p ON p.architecture_id = a.id AND p.is_cover = true
      JOIN cities ci ON a.city_id = ci.id
      JOIN countries c ON ci.country_id = c.id
      WHERE a.slug IN ${sql(wantedSlugs)}
      ORDER BY a.id
    `,
    sql<{ code: string; count: string | number }[]>`
      SELECT c.code, COUNT(*) AS count
      FROM architectures a
      JOIN cities ci ON a.city_id = ci.id
      JOIN countries c ON ci.country_id = c.id
      GROUP BY c.code
      ORDER BY c.code
    `,
    sql<{ count: string | number }>`SELECT COUNT(*) AS count FROM architectures`,
  ])

  const all = summaryRows.map(mapSummaryRow)
  const countryCounts = countRows.map((r) => ({
    code: r.code,
    count: Number(r.count),
  }))

  const missing = wantedSlugs.filter(
    (slug) => !all.some((a) => a.slug === slug),
  )
  for (const slug of missing) console.warn(`warn: curated slug not in DB: ${slug}`)

  const json: LandingJson = {
    architects,
    cities: cities.map((c) => ({
      id: c.id,
      name: c.name,
      countryCode: c.country_code,
    })),
    all,
    buildingCount: Number(buildingCount[0].count),
    countryCounts,
  }

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, JSON.stringify(json, null, 2) + "\n")

  console.log(`architects: ${architects.length}`)
  console.log(`cities: ${json.cities.length}`)
  console.log(`all: ${all.length} of ${json.buildingCount} (curated decks)`)
  console.log(`countryCounts: ${countryCounts.length}`)
  console.log(`wrote ${OUT_PATH}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => sql.end({ timeout: 5 }))
