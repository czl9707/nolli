# SQLite WASM Client Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a client-side SQLite runtime that fetches the baked `.db` file from R2, caches it in OPFS, and exposes a `DataSource` interface for the app to query architectures locally.

**Architecture:** A Web Worker initializes `@sqlite.org/sqlite-wasm` with the `opfs-sahpool` VFS (no COOP/COEP headers needed). On startup, it checks a `manifest.json` on R2 for version changes, downloads the `.db` file to OPFS only if stale, then opens it for page-level queries. The main thread communicates with the worker via `postMessage` / `MessageChannel`. A React context (`DbContext`) wraps the worker, exposing a `DataSource` interface and a loading/ready/error status. The app shows a loading screen until the DB is ready.

**Tech Stack:** `@sqlite.org/sqlite-wasm` (official SQLite WASM build, `opfs-sahpool` VFS), Web Worker (Vite native worker support), React context.

**Design doc:** `docs/plans/2026-06-01-sqlite-wasm-client.md`

**No test framework is configured.** Each task includes manual verification — `npm run dev` and checking browser console.

---

### Task 1: Install `@sqlite.org/sqlite-wasm`

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

```bash
npm install @sqlite.org/sqlite-wasm
```

**Step 2: Verify it installed**

```bash
node -e "require('@sqlite.org/sqlite-wasm'); console.log('ok')"
```

Expected: `ok`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @sqlite.org/sqlite-wasm dependency"
```

---

### Task 2: Create the `DataSource` interface

**Files:**
- Create: `src/lib/data/data-source.ts`

**Step 1: Create the file**

```ts
import type { ArchSummary, Arch, BBox } from "./types"

export type ArchFilter = {
  bbox?: BBox
  architectIds?: readonly number[]
  cityIds?: readonly number[]
  countryCodes?: readonly string[]
}

export type FilterOptions = {
  architects: readonly { id: number; name: string }[]
  cities: readonly { id: number; name: string; countryCode: string }[]
  countries: readonly { code: string; name: string }[]
}

export interface DataSource {
  getAllArchitectures(filter?: ArchFilter): Promise<ArchSummary[]>
  getArchBySlug(slug: string): Promise<Arch | null>
  searchArchitectures(query: string): Promise<ArchSummary[]>
  getFilterOptions(): Promise<FilterOptions>
}
```

**Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: clean

**Step 3: Commit**

```bash
git add src/lib/data/data-source.ts
git commit -m "feat: add DataSource interface with ArchFilter and FilterOptions types"
```

---

### Task 3: Create the SQL query strings

**Files:**
- Create: `src/lib/data/sqlite-queries.ts`

**Step 1: Create the file**

This file contains all SQL used by the worker. Keeping SQL in one place makes it easy to review and modify.

The queries must handle:
- `getAllArchitectures`: JOIN architectures + architects + cover photo + cities + countries. Filters applied as optional WHERE clauses. IN clauses built dynamically by the worker since `@sqlite.org/sqlite-wasm` doesn't support array params.
- `getArchBySlug`: Main query + 3 sub-queries (photos, notes, links) stitched in the worker.
- `searchArchitectures`: LIKE on name, architect name, address.
- `getFilterOptions`: 3 simple SELECT DISTINCT queries.

```ts
export const SQL_GET_ALL_ARCHITECTURES = `
SELECT a.slug, a.name, a.year, a.latitude, a.longitude,
       arch.name AS architect,
       p.image AS cover_image
FROM architectures a
JOIN architects arch ON a.architect_id = arch.id
LEFT JOIN architecture_photos p ON p.architecture_id = a.id AND p.is_cover = 1
JOIN cities ci ON a.city_id = ci.id
JOIN countries c ON ci.country_id = c.id
`

export const SQL_GET_ARCH_BY_SLUG = `
SELECT a.slug, a.name, a.year, a.address, a.latitude, a.longitude,
       a.google_maps_url,
       arch.name AS architect,
       ci.name AS city,
       c.code AS country_code
FROM architectures a
JOIN architects arch ON a.architect_id = arch.id
LEFT JOIN cities ci ON a.city_id = ci.id
LEFT JOIN countries c ON ci.country_id = c.id
WHERE a.slug = ?
`

export const SQL_GET_PHOTOS = `
SELECT image, caption, width, height, is_cover
FROM architecture_photos
WHERE architecture_id = ?
ORDER BY is_cover DESC
`

export const SQL_GET_NOTES = `
SELECT text
FROM architecture_notes
WHERE architecture_id = ?
`

export const SQL_GET_LINKS = `
SELECT type, url, label, sort_order
FROM architecture_links
WHERE architecture_id = ?
ORDER BY sort_order
`

export const SQL_SEARCH_ARCHITECTURES = `
SELECT a.slug, a.name, a.year, a.latitude, a.longitude,
       arch.name AS architect,
       p.image AS cover_image
FROM architectures a
JOIN architects arch ON a.architect_id = arch.id
LEFT JOIN architecture_photos p ON p.architecture_id = a.id AND p.is_cover = 1
WHERE a.name LIKE '%' || ? || '%'
   OR arch.name LIKE '%' || ? || '%'
   OR a.address LIKE '%' || ? || '%'
ORDER BY a.name
`

export const SQL_GET_ARCHITECTS = `
SELECT id, name FROM architects ORDER BY name
`

export const SQL_GET_CITIES = `
SELECT ci.id, ci.name, c.code AS country_code
FROM cities ci
JOIN countries c ON ci.country_id = c.id
ORDER BY ci.name
`

export const SQL_GET_COUNTRIES = `
SELECT code, name FROM countries ORDER BY name
`

export const SQL_GET_ARCHITECTURE_ID_BY_SLUG = `
SELECT id FROM architectures WHERE slug = ?
`
```

**Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: clean

**Step 3: Commit**

```bash
git add src/lib/data/sqlite-queries.ts
git commit -m "feat: add SQL query strings for SQLite worker"
```

---

### Task 4: Create the Web Worker

**Files:**
- Create: `src/lib/data/sqlite-worker.ts`

This is the largest task. The worker:
1. Initializes `@sqlite.org/sqlite-wasm` with `opfs-sahpool` VFS
2. Checks manifest for version changes, downloads `.db` if stale
3. Handles query messages from the main thread
4. Returns structured results matching the `DataSource` interface shapes

**Step 1: Create the worker file**

```ts
import sqlite3InitModule from "@sqlite.org/sqlite-wasm"
import type { Database } from "@sqlite.org/sqlite-wasm"
import type { ArchFilter } from "./data-source"
import type { ArchSummary, Arch, ArchPhoto, ArchLinks } from "./types"
import {
  SQL_GET_ALL_ARCHITECTURES,
  SQL_GET_ARCH_BY_SLUG,
  SQL_GET_PHOTOS,
  SQL_GET_NOTES,
  SQL_GET_LINKS,
  SQL_GET_ARCHITECTURE_ID_BY_SLUG,
  SQL_SEARCH_ARCHITECTURES,
  SQL_GET_ARCHITECTS,
  SQL_GET_CITIES,
  SQL_GET_COUNTRIES,
} from "./sqlite-queries"

const DB_NAME = "/nolli-map.db"
const MANIFEST_URL = import.meta.env.VITE_R2_DB_MANIFEST_URL
const DB_URL = import.meta.env.VITE_R2_DB_URL

type WorkerMessage =
  | { type: "init" }
  | { type: "getAllArchitectures"; filter?: ArchFilter }
  | { type: "getArchBySlug"; slug: string }
  | { type: "searchArchitectures"; query: string }
  | { type: "getFilterOptions" }

type WorkerResponse =
  | { type: "ready" }
  | { type: "error"; error: string }
  | { type: "result"; data: unknown }

let db: Database | null = null

async function init() {
  try {
    const sqlite3 = await sqlite3InitModule()

    if (!sqlite3.opfs) {
      throw new Error("OPFS not available in this browser")
    }

    const poolUtil = await sqlite3.installOpfsSAHPoolVfs()

    const needsDownload = await checkManifest(poolUtil)

    if (needsDownload) {
      await downloadDb(poolUtil)
    }

    db = new poolUtil.OpfsSAHPoolDb(DB_NAME)
    db.exec("PRAGMA journal_mode=WAL")
    db.exec("PRAGMA locking_mode=EXCLUSIVE")

    postResponse({ type: "ready" })
  } catch (err) {
    postResponse({
      type: "error",
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

async function checkManifest(
  poolUtil: Record<string, unknown>
): Promise<boolean> {
  if (!MANIFEST_URL) return !dbExists(poolUtil)

  try {
    const res = await fetch(MANIFEST_URL, { cache: "no-store" })
    const manifest = await res.json()

    const localSha = localStorage.getItem("nolli-db-sha256")
    if (localSha === manifest.sha256 && dbExists(poolUtil)) {
      return false
    }

    localStorage.setItem("nolli-db-sha256", manifest.sha256)
    return true
  } catch {
    return !dbExists(poolUtil)
  }
}

function dbExists(poolUtil: Record<string, unknown>): boolean {
  const names = (poolUtil.getFileNames as () => string[])()
  return names.includes(DB_NAME)
}

async function downloadDb(
  poolUtil: Record<string, unknown>
): Promise<void> {
  if (!DB_URL) throw new Error("VITE_R2_DB_URL not configured")

  const res = await fetch(DB_URL, { cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to fetch DB: ${res.status}`)

  const buffer = await res.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  ;(poolUtil.importDb as (name: string, data: Uint8Array) => number)(
    DB_NAME,
    bytes
  )
}

function queryAllArchitectures(filter?: ArchFilter): ArchSummary[] {
  if (!db) throw new Error("DB not initialized")

  let sql = SQL_GET_ALL_ARCHITECTURES
  const params: unknown[] = []
  const conditions: string[] = []

  if (filter?.bbox) {
    conditions.push(
      "a.longitude >= ?",
      "a.longitude <= ?",
      "a.latitude >= ?",
      "a.latitude <= ?"
    )
    params.push(
      filter.bbox.west,
      filter.bbox.east,
      filter.bbox.south,
      filter.bbox.north
    )
  }

  if (filter?.architectIds && filter.architectIds.length > 0) {
    const placeholders = filter.architectIds.map(() => "?").join(",")
    conditions.push(`a.architect_id IN (${placeholders})`)
    params.push(...filter.architectIds)
  }

  if (filter?.cityIds && filter.cityIds.length > 0) {
    const placeholders = filter.cityIds.map(() => "?").join(",")
    conditions.push(`a.city_id IN (${placeholders})`)
    params.push(...filter.cityIds)
  }

  if (filter?.countryCodes && filter.countryCodes.length > 0) {
    const placeholders = filter.countryCodes.map(() => "?").join(",")
    conditions.push(`c.code IN (${placeholders})`)
    params.push(...filter.countryCodes)
  }

  if (conditions.length > 0) {
    sql += "WHERE " + conditions.join(" AND ") + "\n"
  }

  sql += "ORDER BY a.name"

  const rows = db.exec(sql, params, "object") as Record<string, unknown>[]
  return rows.map(mapSummaryRow)
}

function queryArchBySlug(slug: string): Arch | null {
  if (!db) throw new Error("DB not initialized")

  const rows = db.exec(SQL_GET_ARCH_BY_SLUG, [slug], "object") as Record<
    string,
    unknown
  >[]
  if (rows.length === 0) return null

  const row = rows[0]
  const archId = queryArchId(slug)
  if (archId === null) return null

  const photos = (
    db.exec(SQL_GET_PHOTOS, [archId], "object") as Record<string, unknown>[]
  ).map(mapPhotoRow)

  const notes = (
    db.exec(SQL_GET_NOTES, [archId], "object") as Record<string, unknown>[]
  ).map((r) => ({ text: r.text as string }))

  const links = mapLinks(
    db.exec(SQL_GET_LINKS, [archId], "object") as Record<string, unknown>[]
  )

  const coverPhoto = photos.find((p) => p._isCover)
  const displayPhotos = photos.map(({ _isCover, ...rest }) => rest)

  return {
    slug: row.slug as string,
    name: row.name as string,
    architect: row.architect as string,
    year: row.year as number,
    coordinates: {
      lng: row.longitude as number,
      lat: row.latitude as number,
    },
    coverImage: coverPhoto?.image ?? null,
    address: (row.address as string) ?? "",
    photos: displayPhotos,
    notes,
    links,
  }
}

function queryArchId(slug: string): number | null {
  const rows = db!.exec(SQL_GET_ARCHITECTURE_ID_BY_SLUG, [slug], "object") as Record<
    string,
    unknown
  >[]
  return rows.length > 0 ? (rows[0].id as number) : null
}

function querySearchArchitectures(query: string): ArchSummary[] {
  if (!db) throw new Error("DB not initialized")

  const rows = db.exec(SQL_SEARCH_ARCHITECTURES, [query, query, query], "object") as Record<
    string,
    unknown
  >[]
  return rows.map(mapSummaryRow)
}

function queryFilterOptions() {
  if (!db) throw new Error("DB not initialized")

  const architects = (
    db.exec(SQL_GET_ARCHITECTS, [], "object") as Record<string, unknown>[]
  ).map((r) => ({ id: r.id as number, name: r.name as string }))

  const cities = (
    db.exec(SQL_GET_CITIES, [], "object") as Record<string, unknown>[]
  ).map((r) => ({
    id: r.id as number,
    name: r.name as string,
    countryCode: r.country_code as string,
  }))

  const countries = (
    db.exec(SQL_GET_COUNTRIES, [], "object") as Record<string, unknown>[]
  ).map((r) => ({ code: r.code as string, name: r.name as string }))

  return { architects, cities, countries }
}

function mapSummaryRow(row: Record<string, unknown>): ArchSummary {
  return {
    slug: row.slug as string,
    name: row.name as string,
    architect: row.architect as string,
    year: row.year as number,
    coordinates: {
      lng: row.longitude as number,
      lat: row.latitude as number,
    },
    coverImage: (row.cover_image as string) ?? null,
  }
}

type PhotoRow = ArchPhoto & { _isCover: boolean }

function mapPhotoRow(row: Record<string, unknown>): PhotoRow {
  return {
    image: row.image as string,
    caption: (row.caption as string) ?? undefined,
    width: row.width as number,
    height: row.height as number,
    _isCover: row.is_cover === 1,
  }
}

function mapLinks(
  rows: Record<string, unknown>[]
): ArchLinks {
  const result: ArchLinks = {
    googleMaps: "" as string,
  }

  for (const link of rows) {
    const type = link.type as string
    const url = link.url as string
    const label = link.label as string

    if (type === "google_maps") {
      result.googleMaps = url
    } else if (type === "wikipedia" || type === "archdaily") {
      ;(result as Record<string, unknown>)[type] = url
    } else if (type === "custom") {
      if (!result.custom) result.custom = []
      result.custom.push({ url, label })
    }
  }

  return result
}

function postResponse(response: WorkerResponse) {
  self.postMessage(response)
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  try {
    switch (e.data.type) {
      case "init":
        await init()
        break
      case "getAllArchitectures": {
        const result = queryAllArchitectures(e.data.filter)
        postResponse({ type: "result", data: result })
        break
      }
      case "getArchBySlug": {
        const result = queryArchBySlug(e.data.slug)
        postResponse({ type: "result", data: result })
        break
      }
      case "searchArchitectures": {
        const result = querySearchArchitectures(e.data.query)
        postResponse({ type: "result", data: result })
        break
      }
      case "getFilterOptions": {
        const result = queryFilterOptions()
        postResponse({ type: "result", data: result })
        break
      }
    }
  } catch (err) {
    postResponse({
      type: "error",
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
```

**Important note for the implementing agent:** The `@sqlite.org/sqlite-wasm` package's TypeScript types may not export a `Database` type directly, or the `exec` method signature may differ from what's written above. The agent MUST check the actual package types at `node_modules/@sqlite.org/sqlite-wasm/dist/index.d.mts` and adapt the code accordingly. The `opfs-sahpool` API uses `installOpfsSAHPoolVfs()` which returns a `PoolUtil` with `OpfsSAHPoolDb` class and `importDb` method. The DB query API is `oo1.DB`-style: `db.exec(sql, [params], "object")` returns rows as objects. Verify the exact API at runtime by checking `console.log` output in the worker.

The `_isCover` temporary field on `PhotoRow` is used internally to find the cover photo, then stripped before returning. This is a pragmatic approach — the implementing agent may choose a different strategy if preferred.

The `googleMaps` field defaults to `""` (empty string) — this matches the existing `archLinksSchema` which requires it (not optional). If no google_maps link exists, it stays empty.

**Step 2: Verify typecheck**

Note: The worker runs in its own context and may not be included in the main `tsconfig.json` (which only includes `src/**/*.ts`). The agent should verify by running:

```bash
npm run typecheck
```

If the worker is not type-checked, add it to `tsconfig.json` includes. The agent should also check that Vite correctly bundles the worker with the `new Worker(new URL(...))` pattern.

**Step 3: Commit**

```bash
git add src/lib/data/sqlite-worker.ts
git commit -m "feat: add SQLite Web Worker with OPFS lifecycle and queries"
```

---

### Task 5: Create `SqliteDataSource` (main-thread wrapper)

**Files:**
- Create: `src/lib/data/sqlite-source.ts`

**Step 1: Create the file**

This is the main-thread wrapper that creates the worker and provides a typed async API matching `DataSource`. It serializes calls via `postMessage` and awaits responses via `MessageChannel`.

```ts
import type { DataSource, ArchFilter, FilterOptions } from "./data-source"
import type { ArchSummary, Arch } from "./types"

type DbStatus = "loading" | "ready" | "error"

type WorkerResponse =
  | { type: "ready" }
  | { type: "error"; error: string }
  | { type: "result"; data: unknown }

export class SqliteDataSource implements DataSource {
  private worker: Worker
  private status: DbStatus = "loading"
  private initResolve!: () => void
  private initReject!: (err: Error) => void
  private initPromise: Promise<void>
  private msgCounter = 0
  private pending = new Map<number, { resolve: (data: unknown) => void; reject: (err: Error) => void }>()

  constructor() {
    this.worker = new Worker(
      new URL("./sqlite-worker.ts", import.meta.url),
      { type: "module" }
    )
    this.initPromise = new Promise<void>((resolve, reject) => {
      this.initResolve = resolve
      this.initReject = reject
    })

    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data
      if (msg.type === "ready") {
        this.status = "ready"
        this.initResolve()
      } else if (msg.type === "error" && this.status === "loading") {
        this.status = "error"
        this.initReject(new Error(msg.error))
      } else if (msg.type === "error") {
        const id = this.msgCounter
        const pending = this.pending.get(id)
        if (pending) {
          this.pending.delete(id)
          pending.reject(new Error(msg.error))
        }
      } else if (msg.type === "result") {
        const id = this.msgCounter
        const pending = this.pending.get(id)
        if (pending) {
          this.pending.delete(id)
          pending.resolve(msg.data)
        }
      }
    }

    this.worker.onerror = (e) => {
      if (this.status === "loading") {
        this.status = "error"
        this.initReject(new Error(e.message))
      }
    }

    this.worker.postMessage({ type: "init" })
  }

  get ready(): Promise<void> {
    return this.initPromise
  }

  getStatus(): DbStatus {
    return this.status
  }

  private async send<T>(type: string, payload?: Record<string, unknown>): Promise<T> {
    await this.initPromise
    const id = ++this.msgCounter
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (data: unknown) => void, reject })
      this.worker.postMessage({ type, ...payload })
    })
  }

  async getAllArchitectures(filter?: ArchFilter): Promise<ArchSummary[]> {
    return this.send<ArchSummary[]>("getAllArchitectures", { filter })
  }

  async getArchBySlug(slug: string): Promise<Arch | null> {
    return this.send<Arch | null>("getArchBySlug", { slug })
  }

  async searchArchitectures(query: string): Promise<ArchSummary[]> {
    return this.send<ArchSummary[]>("searchArchitectures", { query })
  }

  async getFilterOptions(): Promise<FilterOptions> {
    return this.send<FilterOptions>("getFilterOptions")
  }

  destroy(): void {
    this.worker.terminate()
  }
}
```

**Important note for the implementing agent:** The message correlation in this implementation is intentionally simplified. The `msgCounter` increments per `send()` call, but the worker doesn't echo back the ID. This means if multiple queries are in-flight simultaneously, responses could be misattributed. For the initial implementation (where queries are sequential — map loads, then user clicks), this is acceptable. The agent should verify this is fine for the use case. If proper correlation is needed, add a `msgId` field to both the request and response messages.

**Step 2: Verify typecheck**

```bash
npm run typecheck
```

**Step 3: Commit**

```bash
git add src/lib/data/sqlite-source.ts
git commit -m "feat: add SqliteDataSource main-thread worker wrapper"
```

---

### Task 6: Create `DbContext` (React context + provider)

**Files:**
- Create: `src/lib/data/db-context.tsx`

**Step 1: Create the file**

This React context provides the `DataSource` and DB status to the app tree. It creates the `SqliteDataSource` on mount and exposes loading/ready/error states.

```tsx
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { SqliteDataSource } from "./sqlite-source"
import type { DataSource } from "./data-source"

type DbState = {
  status: "loading" | "ready" | "error"
  dataSource: DataSource | null
  error: Error | null
  retry: () => void
}

const DbContext = createContext<DbState>({
  status: "loading",
  dataSource: null,
  error: null,
  retry: () => {},
})

export function useDbContext(): DbState {
  return useContext(DbContext)
}

export function DbProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DbState>({
    status: "loading",
    dataSource: null,
    error: null,
    retry: () => {},
  })
  const sourceRef = useRef<SqliteDataSource | null>(null)

  function initSource() {
    if (sourceRef.current) {
      sourceRef.current.destroy()
    }
    const source = new SqliteDataSource()
    sourceRef.current = source

    setState({
      status: "loading",
      dataSource: null,
      error: null,
      retry: initSource,
    })

    source.ready
      .then(() => {
        setState({
          status: "ready",
          dataSource: source,
          error: null,
          retry: () => {},
        })
      })
      .catch((err: Error) => {
        setState({
          status: "error",
          dataSource: null,
          error: err,
          retry: initSource,
        })
      })
  }

  useEffect(() => {
    initSource()
    return () => {
      sourceRef.current?.destroy()
    }
  }, [])

  return <DbContext.Provider value={state}>{children}</DbContext.Provider>
}
```

**Step 2: Verify typecheck**

```bash
npm run typecheck
```

**Step 3: Commit**

```bash
git add src/lib/data/db-context.tsx
git commit -m "feat: add DbProvider React context with loading/ready/error states"
```

---

### Task 7: Add loading screen to `ViteApp`

**Files:**
- Modify: `src/vite-app.tsx`
- Create: `src/components/layout/db-loading.module.css`
- Create: `src/components/layout/db-loading.tsx`

**Step 1: Create the loading screen component**

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: var(--spacing-paragraph);
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid rgb(var(--color-primary-foreground) / 0.2);
  border-top-color: rgb(var(--color-accent-foreground));
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  color: rgb(var(--color-destructive));
}
```

```tsx
import { useDbContext } from "@/lib/data/db-context"
import styles from "./db-loading.module.css"

export function DbLoading({ children }: { children: React.ReactNode }) {
  const { status, error, retry } = useDbContext()

  if (status === "loading") {
    return (
      <div className={styles.container}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error?.message ?? "Failed to load database"}</p>
        <button onClick={retry}>Retry</button>
      </div>
    )
  }

  return <>{children}</>
}
```

**Step 2: Wire into ViteApp**

Wrap the app content with `<DbProvider>` and `<DbLoading>`:

In `src/vite-app.tsx`, import and wrap:

```tsx
import { DbProvider } from "@/lib/data/db-context"
import { DbLoading } from "@/components/layout/db-loading"

// ... inside ViteApp:
export function ViteApp() {
  return (
    <BrowserRouter>
      <DbProvider>
        <DbLoading>
          <ThemeSync />
          <RouterSync />
          <Header />
          <div className={styles.appContainer}>
            <Sidebar />
            <PinBoard />
          </div>
          <Footer />
        </DbLoading>
      </DbProvider>
    </BrowserRouter>
  )
}
```

**Step 3: Verify typecheck and lint**

```bash
npm run lint && npm run typecheck
```

**Step 4: Commit**

```bash
git add src/vite-app.tsx src/components/layout/db-loading.module.css src/components/layout/db-loading.tsx
git commit -m "feat: add DB loading screen, wrap app with DbProvider"
```

---

### Task 8: Migrate map component to use `DataSource`

**Files:**
- Modify: `src/components/map/index.tsx`

**Step 1: Update `ArchMarkers` to use `DbContext`**

Replace the direct `getAllArchitectures()` import with the `DataSource` from context.

In `src/components/map/index.tsx`:

Change the imports — remove:
```ts
import {
  getAllArchitectures,
  type ArchSummary,
} from "@/lib/data/architectures"
```

Add:
```ts
import type { ArchSummary } from "@/lib/data/architectures"
import { useDbContext } from "@/lib/data/db-context"
```

In the `ArchMarkers` component, replace:
```ts
const [architectures, setArchitectures] = useState<ArchSummary[]>([])

useEffect(() => {
  getAllArchitectures().then(setArchitectures)
}, [])
```

With:
```ts
const { dataSource } = useDbContext()
const [architectures, setArchitectures] = useState<ArchSummary[]>([])

useEffect(() => {
  dataSource?.getAllArchitectures().then(setArchitectures)
}, [dataSource])
```

**Step 2: Verify typecheck**

```bash
npm run typecheck
```

**Step 3: Commit**

```bash
git add src/components/map/index.tsx
git commit -m "feat: migrate map markers to use DataSource from DbContext"
```

---

### Task 9: Migrate arch store to use `DataSource`

**Files:**
- Modify: `src/stores/arch.ts`

This is the trickiest migration. The Zustand store currently calls `getArchBySlug()` directly. But stores can't use React hooks (like `useDbContext()`). Two approaches:

**Option A (recommended):** Pass the `DataSource` into the store's `selectArch` action from the component that calls it. The component already has access to `DbContext`.

**Option B:** Make the store hold a reference to the `DataSource` via a `setDataSource` action, called once from a component.

The implementing agent should choose Option A since `selectArch` is always called from React components that have `DbContext` access.

**Step 1: Refactor the store**

In `src/stores/arch.ts`:

Change from:
```ts
import { create } from "zustand"
import type { Arch } from "@/lib/data/architectures"
import { getArchBySlug } from "@/lib/data/architectures"

type ArchState = {
  lastSelectedArch: Arch | null
  loading: boolean
  flyToTrigger: number
  selectArch: (slug: string) => Promise<Arch | null>
  deselectArch: () => void
}

export const useArchStore = create<ArchState>((set, get) => ({
  lastSelectedArch: null,
  loading: false,
  flyToTrigger: 0,

  selectArch: async (slug: string) => {
    const current = get().lastSelectedArch
    if (current?.slug === slug) return current
    set({ loading: true })
    const arch = await getArchBySlug(slug)
    if (arch) {
      set((s) => ({
        lastSelectedArch: arch,
        flyToTrigger: s.flyToTrigger + 1,
        loading: false,
      }))
    } else {
      set({ loading: false })
    }
    return arch
  },

  deselectArch: () => {
    set({ lastSelectedArch: null, loading: false })
  },
}))
```

To:
```ts
import { create } from "zustand"
import type { Arch } from "@/lib/data/types"
import type { DataSource } from "@/lib/data/data-source"

type ArchState = {
  lastSelectedArch: Arch | null
  loading: boolean
  flyToTrigger: number
  selectArch: (slug: string, dataSource: DataSource) => Promise<Arch | null>
  deselectArch: () => void
}

export const useArchStore = create<ArchState>((set, get) => ({
  lastSelectedArch: null,
  loading: false,
  flyToTrigger: 0,

  selectArch: async (slug: string, dataSource: DataSource) => {
    const current = get().lastSelectedArch
    if (current?.slug === slug) return current
    set({ loading: true })
    const arch = await dataSource.getArchBySlug(slug)
    if (arch) {
      set((s) => ({
        lastSelectedArch: arch,
        flyToTrigger: s.flyToTrigger + 1,
        loading: false,
      }))
    } else {
      set({ loading: false })
    }
    return arch
  },

  deselectArch: () => {
    set({ lastSelectedArch: null, loading: false })
  },
}))
```

**Step 2: Update all callers of `selectArch` to pass `dataSource`**

There are two callers:

1. `src/components/map/index.tsx` — `IndividualMarker` component
2. `src/components/layout/arch-sync.tsx` — `ArchSync` component

For `IndividualMarker` in `src/components/map/index.tsx`:
```tsx
const { dataSource } = useDbContext()
// ...
selectArch(point.slug, dataSource!).then(...)
```

For `ArchSync` in `src/components/layout/arch-sync.tsx`:
```tsx
import { useDbContext } from "@/lib/data/db-context"

export function ArchSync() {
  const location = useLocation()
  const { dataSource } = useDbContext()
  const selectArch = useArchStore((s) => s.selectArch)
  const prevSlugRef = useRef<string | null>(null)

  useEffect(() => {
    const match = location.pathname.match(/^\/arch\/([^/]+)/)
    if (!match || match[1] === prevSlugRef.current) return
    if (!dataSource) return
    prevSlugRef.current = match[1]
    selectArch(match[1], dataSource)
  }, [location.pathname, selectArch, dataSource])

  return null
}
```

**Step 3: Verify typecheck**

```bash
npm run typecheck
```

**Step 4: Commit**

```bash
git add src/stores/arch.ts src/components/map/index.tsx src/components/layout/arch-sync.tsx
git commit -m "feat: migrate arch store to use DataSource, pass from React context"
```

---

### Task 10: Add env vars and verify the full flow

**Files:**
- Modify: `.env.local` (or `.env`)

**Step 1: Add R2 URL env vars**

Add to `.env.local`:
```
VITE_R2_DB_MANIFEST_URL=https://<your-r2-public-url>/manifest.json
VITE_R2_DB_URL=https://<your-r2-public-url>/latest.db
```

These are `VITE_`-prefixed so Vite exposes them to the client via `import.meta.env`.

**Step 2: Run the dev server and verify**

```bash
npm run dev
```

Open browser. Expected behavior:
1. Loading spinner appears
2. Worker initializes, checks manifest, downloads DB if needed
3. Loading spinner disappears, map renders with architecture markers
4. Clicking a marker loads the detail view with data from SQLite

Check browser console for errors. The worker logs are visible in the browser's worker console (DevTools → Sources → Workers).

**Step 3: Verify lint and typecheck**

```bash
npm run lint && npm run typecheck
```

**Step 4: Commit (env vars example only — do NOT commit real `.env.local`)**

If you created a `.env.example` or similar, commit that:
```bash
git add .env.example
git commit -m "docs: add env var example for R2 DB URLs"
```

---

### Task 11: Remove old Supabase read code

**Files:**
- Modify: `src/lib/data/architectures.ts` (remove or gut)
- Modify: `src/lib/data/supabase-client.ts` (keep, but note it's for writes only)

**Step 1: Check that nothing else imports from `architectures.ts`**

```bash
grep -r "from.*@/lib/data/architectures" src/ --include="*.ts" --include="*.tsx"
```

All imports should be using the new DataSource. If any remain, migrate them first.

**Step 2: Gut `architectures.ts`**

Replace the entire file with re-exports from the new locations (or delete it if no re-exports needed). Keep type exports that might be used elsewhere.

Minimal version:
```ts
export type {
  Arch,
  ArchSummary,
  ArchPhoto,
  ArchNote,
  ArchLinks,
  Coordinates,
  BBox,
} from "./types"
```

**Step 3: Verify**

```bash
npm run lint && npm run typecheck
```

**Step 4: Commit**

```bash
git add src/lib/data/architectures.ts
git commit -m "refactor: remove Supabase read code, keep type re-exports"
```

---

## Post-implementation checklist

After all tasks are complete:

1. `npm run lint` — clean
2. `npm run typecheck` — clean
3. `npm run dev` — app loads, shows spinner, then map with markers
4. Click a marker — detail view loads from SQLite
5. Check browser console — no errors
6. Check worker console — DB initialized, queries running
7. Refresh page — cached DB loads instantly (no re-download)
8. Close and reopen tab — OPFS persists, no re-download

## Notes for the implementing agent

- **`@sqlite.org/sqlite-wasm` API is the source of truth.** The code in this plan is based on the official docs but may have API differences. ALWAYS check the actual types at `node_modules/@sqlite.org/sqlite-wasm/dist/index.d.mts` and adapt.
- **`opfs-sahpool` requires a Web Worker.** The worker file must use `self.onmessage` (not a default export). Vite handles the worker bundling via `new Worker(new URL("./sqlite-worker.ts", import.meta.url), { type: "module" })`.
- **No COOP/COEP headers needed** with `opfs-sahpool`. This is a key advantage over the `opfs` VFS.
- **The `importDb` method** takes a `Uint8Array` — the entire `.db` file. For 100K rows, the file might be 10-50MB. If streaming is needed later, `importDb` also accepts a callback function for chunked writes (see the official persistence docs).
- **Message correlation** in `SqliteDataSource` is simplified. If race conditions appear with concurrent queries, add a `msgId` field to correlate requests and responses.
- **The `Arch` type** uses `archLinksSchema` which requires `googleMaps: z.string()` (not optional). The worker must always provide this field, defaulting to `""` if no google_maps link exists.
