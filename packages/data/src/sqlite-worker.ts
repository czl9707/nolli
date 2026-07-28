import sqlite3InitModule from "@sqlite.org/sqlite-wasm"
import type { Database, Sqlite3Static, BindingSpec, BindableValue } from "@sqlite.org/sqlite-wasm"
import type { WorkerInbound, WorkerResponse } from "./worker-protocol.type"
import type { ArchFilter, FilterOptions } from "./data-source.type"
import type { Arch, ArchLinks, ArchPhoto, ArchSummary } from "./architectures.type"
import {
  SQL_GET_ALL_ARCHITECTURES,
  SQL_GET_ARCHITECTS,
  SQL_GET_ARCHITECTURE_ID_BY_SLUG,
  SQL_GET_ARCHITECTURES_BY_IDS,
  SQL_GET_ARCHITECTURES_BY_SLUGS,
  SQL_GET_ARCH_BY_SLUG,
  SQL_GET_CITIES,
  SQL_GET_COUNTRIES,
  SQL_GET_LINKS,
  SQL_GET_NOTES,
  SQL_GET_PHOTOS,
} from "./sqlite-queries"

type Row = Record<string, unknown>

const post = (msg: WorkerResponse) => self.postMessage(msg)

let db: Database
let sqlite3: Sqlite3Static
const DB_NAME = "nolli.db"
// Companion to DB_NAME in OPFS: records the manifest version of the db we last
// persisted, so the worker can decide whether to re-download without relying
// on localStorage (unavailable in workers).
const VERSION_FILE = "nolli.version"

function query(sql: string, bind?: BindingSpec): Row[] {
  return db.exec({
    sql,
    bind: bind,
    rowMode: "object",
    returnValue: "resultRows",
  }) as unknown as Row[]
}

function mapSummaryRow(row: Row): ArchSummary {
  return {
    id: row.id as number,
    slug: row.slug as string,
    name: row.name as string,
    architect: row.architect as string,
    year: row.year as number,
    coordinates: {
      lat: row.latitude as number,
      lng: row.longitude as number,
    },
    cover: {
      image: row.cover_image as string,
      width: row.cover_width as number,
      height: row.cover_height as number,
    },
  }
}

async function handleInit(msgId: number): Promise<void> {
  if (db) {
    post({ type: "ready", msgId, message: "Database already initialized" })
    return
  }

  try {
    sqlite3 = await sqlite3InitModule()
  } catch (err) {
    post({ type: "error", msgId, error: String(err) })
    return
  }

  const hasOpfs = "OpfsDb" in sqlite3.oo1

  try {
    const message = hasOpfs ? await openOpfsDb() : await openTransientDb()
    post({ type: "ready", msgId, message })
  } catch (err) {
    post({ type: "error", msgId, error: String(err) })
  }
}

async function openOpfsDb(): Promise<string | undefined> {
  const OpfsDb = sqlite3.oo1.OpfsDb
  const remoteVersion = await fetchManifestVersion()
  const localVersion = await readPersistedVersion()
  const download = !remoteVersion || remoteVersion !== localVersion

  let message: string | undefined
  if (download) {
    try {
      await downloadDb(OpfsDb)
      if (remoteVersion) await writePersistedVersion(remoteVersion)
      message = "Latest map data loaded and stored."
    } catch {
      message = "Failed to fetch latest map data, using cached version"
    }
  }
  else {
    message = "Map data is up to date."
  }

  try {
    db = new OpfsDb(DB_NAME, "r")
  } catch {
    await downloadDb(OpfsDb)
    if (remoteVersion) await writePersistedVersion(remoteVersion)
    db = new OpfsDb(DB_NAME, "r")
  }
  return message
}

// OPFS unavailable (iOS Safari / in-app webviews): there is no persistence
// layer, so fetch the latest build each session and load it into a transient
// in-memory database via sqlite3_deserialize.
async function openTransientDb(): Promise<string | undefined> {
  const buffer = await fetchDbBuffer()
  db = new sqlite3.oo1.DB(":memory:")
  const bytes = new Uint8Array(buffer)
  const ptr = sqlite3.wasm.allocFromTypedArray(bytes)
  const flags =
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
    sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
  const rc = sqlite3.capi.sqlite3_deserialize(
    db.pointer as number,
    "main",
    ptr,
    bytes.byteLength,
    bytes.byteLength,
    flags,
  )
  if (rc !== sqlite3.capi.SQLITE_OK) {
    sqlite3.wasm.dealloc(ptr)
    throw new Error(`Failed to load database into memory (rc=${rc}).`)
  }
  return "Latest map data loaded."
}

async function downloadDb(OpfsDb: NonNullable<Sqlite3Static["oo1"]["OpfsDb"]>): Promise<void> {
  const buffer = await fetchDbBuffer()
  await OpfsDb.importDb(DB_NAME, buffer)
}

async function fetchDbBuffer(): Promise<ArrayBuffer> {
  const baseUrl = import.meta.env.VITE_R2_PUBLIC_DB_URL as string
  const res = await fetch(`${baseUrl}/latest.db`)
  if (!res.ok) {
    throw new Error(`Failed to fetch map data (HTTP ${res.status}).`)
  }
  return res.arrayBuffer()
}

async function fetchManifestVersion(): Promise<string | undefined> {
  const baseUrl = import.meta.env.VITE_R2_PUBLIC_DB_URL as string
  try {
    const res = await fetch(`${baseUrl}/manifest.json`)
    if (!res.ok) return undefined
    const manifest = (await res.json()) as { version: string }
    return manifest.version
  } catch {
    return undefined
  }
}

async function readPersistedVersion(): Promise<string | undefined> {
  try {
    const root = await navigator.storage.getDirectory()
    const handle = await root.getFileHandle(VERSION_FILE).catch(() => null)
    if (!handle) return undefined
    const text = await handle.getFile().then((f) => f.text())
    return text.trim() || undefined
  } catch {
    return undefined
  }
}

async function writePersistedVersion(version: string): Promise<void> {
  const root = await navigator.storage.getDirectory()
  const handle = await root.getFileHandle(VERSION_FILE, { create: true })
  const writable = await handle.createWritable()
  await writable.write(version)
  await writable.close()
}

function handleGetAllArchitectures(filter: ArchFilter | undefined): ArchSummary[] {
  let sql = SQL_GET_ALL_ARCHITECTURES
  const conditions: string[] = []
  const params: BindableValue[] = []

  if (filter?.bbox) {
    conditions.push("a.latitude BETWEEN ? AND ?", "a.longitude BETWEEN ? AND ?")
    params.push(filter.bbox.south, filter.bbox.north, filter.bbox.west, filter.bbox.east)
  }
  if (filter?.architectIds?.length) {
    conditions.push(`a.architect_id IN (${filter.architectIds.map(() => "?").join(", ")})`)
    params.push(...filter.architectIds)
  }
  if (filter?.cityIds?.length) {
    conditions.push(`a.city_id IN (${filter.cityIds.map(() => "?").join(", ")})`)
    params.push(...filter.cityIds)
  }
  if (filter?.query?.trim()) {
    const q = filter.query.trim()
    conditions.push(
      "(a.name LIKE '%' || ? || '%' OR arch.name LIKE '%' || ? || '%')",
    )
    params.push(q, q)
  }

  if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ")

  return query(sql, params).map(mapSummaryRow)
}

function handleGetArchBySlug(slug: string): Arch | null {
  const idRows = query(SQL_GET_ARCHITECTURE_ID_BY_SLUG, [slug])
  if (!idRows.length) return null

  const archId = idRows[0].id as number
  const rows = query(SQL_GET_ARCH_BY_SLUG, [slug])
  if (!rows.length) return null

  const row = rows[0]

  const photoRows = query(SQL_GET_PHOTOS, [archId])
  let cover: { image: string; width: number; height: number } = {
    image: "",
    width: 0,
    height: 0,
  }
  const photos: ArchPhoto[] = photoRows.map((pr) => {
    if (pr.is_cover) {
      cover = {
        image: pr.image as string,
        width: pr.width as number,
        height: pr.height as number,
      }
    }
    return {
      image: pr.image as string,
      caption: (pr.caption as string | null) ?? undefined,
      width: pr.width as number,
      height: pr.height as number,
    }
  })

  const notes = query(SQL_GET_NOTES, [archId]).map((nr) => ({
    text: nr.text as string,
  }))

  const links: ArchLinks = { googleMaps: (row.google_maps_url as string) || "" }
  const custom: { url: string; label: string }[] = []

  for (const lr of query(SQL_GET_LINKS, [archId])) {
    switch (lr.type as string) {
      case "google_maps":
        links.googleMaps = lr.url as string
        break
      case "wikipedia":
        links.wikipedia = lr.url as string
        break
      case "archdaily":
        links.archdaily = lr.url as string
        break
      default:
        custom.push({ url: lr.url as string, label: lr.label as string })
        break
    }
  }

  if (custom.length > 0) links.custom = custom

  return {
    id: row.id as number,
    slug: row.slug as string,
    name: row.name as string,
    architect: row.architect as string,
    year: row.year as number,
    coordinates: {
      lat: row.latitude as number,
      lng: row.longitude as number,
    },
    cover,
    address: (row.address as string),
    city: (row.city as string),
    country: (row.country as string),
    photos,
    notes,
    links,
  }
}

function handleGetArchSummariesByIds(ids: number[]): ArchSummary[] {
  if (ids.length === 0) return []
  const placeholders = ids.map(() => "?").join(", ")
  const sql = SQL_GET_ARCHITECTURES_BY_IDS.replace("__IDS__", placeholders)
  return query(sql, ids).map(mapSummaryRow)
}

function handleGetArchSummariesBySlugs(slugs: string[]): ArchSummary[] {
  if (slugs.length === 0) return []
  const placeholders = slugs.map(() => "?").join(", ")
  const sql = SQL_GET_ARCHITECTURES_BY_SLUGS.replace("__SLUGS__", placeholders)
  return query(sql, slugs).map(mapSummaryRow)
}

function handleGetFilterOptions(): FilterOptions {
  const architects = query(SQL_GET_ARCHITECTS).map((r) => ({
    id: r.id as number,
    name: r.name as string,
  }))
  const cities = query(SQL_GET_CITIES).map((r) => ({
    id: r.id as number,
    name: r.name as string,
    countryCode: r.country_code as string,
  }))
  const countries = query(SQL_GET_COUNTRIES).map((r) => ({
    code: r.code as string,
    name: r.name as string,
  }))
  return { architects, cities, countries }
}

self.onmessage = async (e: MessageEvent<WorkerInbound>) => {
  const { type, msgId } = e.data

  try {
    switch (type) {
      case "init":
        await handleInit(msgId)
        break
      case "getAllArchitectures":
        post({ type: "getAllArchitectures", msgId, data: handleGetAllArchitectures(e.data.filter) })
        break
      case "getArchBySlug":
        post({ type: "getArchBySlug", msgId, data: handleGetArchBySlug(e.data.slug) })
        break
      case "getArchSummariesByIds":
        post({ type: "getArchSummariesByIds", msgId, data: handleGetArchSummariesByIds(e.data.ids) })
        break
      case "getArchSummariesBySlugs":
        post({ type: "getArchSummariesBySlugs", msgId, data: handleGetArchSummariesBySlugs(e.data.slugs) })
        break
      case "getFilterOptions":
        post({ type: "getFilterOptions", msgId, data: handleGetFilterOptions() })
        break
    }
  } catch (err) {
    post({ type: "error", msgId, error: String(err) })
  }
}
