# SQLite WASM Client Design

**Goal:** Build a client-side SQLite runtime that fetches the baked `.db` file from R2, caches it in OPFS, and exposes a `DataSource` interface for the app to query architectures locally.

**Depends on:** Bake script (`scripts/bake-sqlite.ts`) which produces `latest.db` + `manifest.json` on R2.

**Related issue:** #9 (Static SQLite on CDN for local-first architecture queries)

---

## Architecture

```
Browser
  ├── Main Thread
  │   ├── DbContext (React context)
  │   │   ├── status: "loading" | "ready" | "error"
  │   │   ├── dataSource: DataSource | null
  │   │   └── error: Error | null
  │   └── SqliteDataSource
  │       └── Posts messages to worker, awaits responses via MessageChannel
  │
  └── Web Worker (sqlite-worker.ts)
      ├── DB lifecycle: fetch manifest → check version → download .db to OPFS if stale
      ├── wa-sqlite opens .db from OPFS (page-level reads, not full load into memory)
      └── Handles query messages, returns structured results
```

**App startup flow:**
1. App renders loading screen
2. Worker initializes → open wa-sqlite
3. Check OPFS for existing `nolli-map.db` + local manifest
4. Fetch `manifest.json` from R2 (~200 bytes)
5. Compare sha256 — if match, skip download; if stale, fetch new `.db` and write to OPFS
6. Open DB from OPFS
7. Post "ready" to main thread
8. App renders map and UI

On repeat visits with cached DB, steps 3-5 complete in ~100ms.

**Background updates:** On visibility change (tab focus), re-fetch manifest. If version changed, download new `.db` in background and hot-swap when ready.

## DataSource interface

```ts
type ArchFilter = {
  bbox?: BBox
  architectIds?: readonly number[]
  cityIds?: readonly number[]
  countryCodes?: readonly string[]
}

type FilterOptions = {
  architects: readonly { id: number; name: string }[]
  cities: readonly { id: number; name: string; countryCode: string }[]
  countries: readonly { code: string; name: string }[]
}

interface DataSource {
  getAllArchitectures(filter?: ArchFilter): Promise<ArchSummary[]>
  getArchBySlug(slug: string): Promise<Arch | null>
  searchArchitectures(query: string): Promise<ArchSummary[]>
  getFilterOptions(): Promise<FilterOptions>
}
```

**ArchFilter:** Multi-select on architect, city, country. Empty/undefined arrays = no filter. All filters compose together as SQL `WHERE` clauses.

**FilterOptions:** Returned by `getFilterOptions()` — called once after DB loads. Used to populate filter dropdowns in the UI.

**searchArchitectures:** `LIKE` query on architecture name, architect name, and address. Not FTS5 — can add later.

## SQL queries

### getAllArchitectures

```sql
SELECT a.slug, a.name, a.year, a.latitude, a.longitude,
       arch.name AS architect,
       p.image AS cover_image
FROM architectures a
JOIN architects arch ON a.architect_id = arch.id
LEFT JOIN architecture_photos p ON p.architecture_id = a.id AND p.is_cover = 1
JOIN cities ci ON a.city_id = ci.id
JOIN countries c ON ci.country_id = c.id
WHERE 1=1
  AND (:west IS NULL OR a.longitude >= :west)
  AND (:east IS NULL OR a.longitude <= :east)
  AND (:south IS NULL OR a.latitude >= :south)
  AND (:north IS NULL OR a.latitude <= :north)
  AND (cast(:arch_ids as text) IS NULL OR a.architect_id IN (:arch_ids))
  AND (cast(:city_ids as text) IS NULL OR a.city_id IN (:city_ids))
  AND (cast(:country_codes as text) IS NULL OR c.code IN (:country_codes))
ORDER BY a.name
```

### getArchBySlug

```sql
-- Main row
SELECT a.*, arch.name AS architect
FROM architectures a
JOIN architects arch ON a.architect_id = arch.id
WHERE a.slug = :slug

-- Photos
SELECT id, image, caption, width, height, is_cover
FROM architecture_photos WHERE architecture_id = :id ORDER BY is_cover DESC

-- Notes
SELECT id, text FROM architecture_notes WHERE architecture_id = :id

-- Links
SELECT id, type, url, label, sort_order
FROM architecture_links WHERE architecture_id = :id ORDER BY sort_order
```

Stitched into `Arch` shape in the worker.

### searchArchitectures

```sql
SELECT a.slug, a.name, a.year, a.latitude, a.longitude,
       arch.name AS architect,
       p.image AS cover_image
FROM architectures a
JOIN architects arch ON a.architect_id = arch.id
LEFT JOIN architecture_photos p ON p.architecture_id = a.id AND p.is_cover = 1
WHERE a.name LIKE '%' || :q || '%'
   OR arch.name LIKE '%' || :q || '%'
   OR a.address LIKE '%' || :q || '%'
ORDER BY a.name
```

### getFilterOptions

Three queries:
- `SELECT id, name FROM architects ORDER BY name`
- `SELECT ci.id, ci.name, c.code AS country_code FROM cities ci JOIN countries c ON ci.country_id = c.id ORDER BY ci.name`
- `SELECT code, name FROM countries ORDER BY name`

## File structure

```
src/lib/data/
  ├── data-source.ts          — DataSource interface + ArchFilter + FilterOptions types
  ├── sqlite-source.ts        — SqliteDataSource (main-thread wrapper, posts to worker)
  ├── sqlite-worker.ts        — Web Worker: wa-sqlite + OPFS lifecycle + query handler
  ├── sqlite-queries.ts       — SQL query strings
  ├── db-context.tsx           — React context: provides DataSource + status + error
  ├── types.ts                 — (existing) Zod schemas, unchanged
  ├── architectures.ts         — (existing, to be removed after migration)
  └── supabase-client.ts       — (existing, kept for future writes)
```

## Error handling

| Scenario | Response |
|---|---|
| Worker init fails (no WASM/OPFS) | Show error screen with retry |
| DB download fails (network) | Retry 3x with backoff, then error screen |
| Query fails (corrupt DB) | Delete OPFS file, re-download, retry once |
| Manifest fetch fails | Use cached DB if exists (stale > nothing). Error only if no cache. |

`DbContext` exposes `{ status: "loading" | "ready" | "error", dataSource, error }`. App renders loading spinner → map → error screen accordingly.

## Integration

1. Add `wa-sqlite` to `dependencies`
2. Create worker — Vite supports `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`
3. Wrap app with `<DbProvider>` in `src/vite-app.tsx`
4. Replace consumers:
   - `src/components/map/index.tsx` — `getAllArchitectures()` → `dataSource.getAllArchitectures()`
   - `src/stores/arch.ts` — `getArchBySlug()` → `dataSource.getArchBySlug()`
5. Remove `src/lib/data/architectures.ts` after migration
6. Keep `src/lib/data/supabase-client.ts` for future write operations

## Deferred

- **FTS5 full-text search** — LIKE is fine for now, FTS5 can be added to bake script + worker later
- **Compression** — `.db` on R2 could be gzip/brotli. Browser auto-decompresses with `Content-Encoding`. Add to bake script.
- **Service Worker** — could cache manifest for instant version checks. OPFS handles persistence already.
- **Supabase fallback** — no read fallback, SQLite or nothing. Can add later if needed.
