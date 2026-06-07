import sqlite3InitModule from "@sqlite.org/sqlite-wasm"
import type { Database, Sqlite3Static, BindingSpec, BindableValue } from "@sqlite.org/sqlite-wasm"
import type { WorkerRequest } from "./worker-protocol.type"
import type { ArchFilter, FilterOptions } from "./data-source.type"
import type { Arch, ArchLinks, ArchPhoto, ArchSummary } from "./architectures.type"
import {
  SQL_GET_ALL_ARCHITECTURES,
  SQL_GET_ARCHITECTS,
  SQL_GET_ARCHITECTURE_ID_BY_SLUG,
  SQL_GET_ARCH_BY_SLUG,
  SQL_GET_CITIES,
  SQL_GET_COUNTRIES,
  SQL_GET_LINKS,
  SQL_GET_NOTES,
  SQL_GET_PHOTOS,
  SQL_SEARCH_ARCHITECTURES,
} from "./sqlite-queries"

type Row = Record<string, unknown>

let db: Database
let sqlite3: Sqlite3Static
const DB_NAME = "nolli.db"

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
    slug: row.slug as string,
    name: row.name as string,
    architect: row.architect as string,
    year: row.year as number,
    coordinates: {
      lat: row.latitude as number,
      lng: row.longitude as number,
    },
    coverImage: row.cover_image as string | null,
  }
}

async function handleInit(msgId: number, download: boolean): Promise<void> {
  if (db) {
    self.postMessage({ type: "ready", msgId, message: "Database already initialized" })
    return
  }

  sqlite3 = await sqlite3InitModule()

  const OpfsDb = sqlite3.oo1.OpfsDb
  if (!OpfsDb) {
    throw new Error("OPFS VFS is not available in this environment")
  }

  let message: string | undefined = undefined;
  if (download) {
    message = await downloadDb(OpfsDb)
  }

  try {
    db = new OpfsDb(DB_NAME, "r")
  } catch {
    throw new Error(`Database file "${DB_NAME}" not found in OPFS.`)
  }

  self.postMessage({ type: "ready", msgId, message })
}

async function downloadDb(OpfsDb: NonNullable<Sqlite3Static["oo1"]["OpfsDb"]>): Promise<string> {
  const baseUrl = import.meta.env.VITE_R2_PUBLIC_DB_URL as string
  const res = await fetch(`${baseUrl}/latest.db`)
  if (!res.ok) {
    return "Failed to fetch latest map data, using cached version"
  }

  const buffer = await res.arrayBuffer()
  await OpfsDb.importDb(DB_NAME, buffer)
  return "Latest map data loaded."
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
  let coverImage: string | null = null
  const photos: ArchPhoto[] = photoRows.map((pr) => {
    if (pr.is_cover) coverImage = pr.image as string
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
    slug: row.slug as string,
    name: row.name as string,
    architect: row.architect as string,
    year: row.year as number,
    coordinates: {
      lat: row.latitude as number,
      lng: row.longitude as number,
    },
    coverImage,
    address: (row.address as string) || "",
    photos,
    notes,
    links,
  }
}

function handleSearchArchitectures(q: string): ArchSummary[] {
  return query(SQL_SEARCH_ARCHITECTURES, [q, q, q]).map(mapSummaryRow)
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

self.onmessage = async (e: MessageEvent<WorkerRequest & { msgId: number }>) => {
  const { type } = e.data
  const msgId = e.data.msgId

  if (type === "init") {
    await handleInit(msgId, e.data.download as boolean)
  }

  try {
    switch (type) {
      case "getAllArchitectures":
        self.postMessage({ type: "getAllArchitectures", msgId, data: handleGetAllArchitectures(e.data.filter as ArchFilter | undefined) })
        break
      case "getArchBySlug":
        self.postMessage({ type: "getArchBySlug", msgId, data: handleGetArchBySlug(e.data.slug as string) })
        break
      case "searchArchitectures":
        self.postMessage({ type: "searchArchitectures", msgId, data: handleSearchArchitectures(e.data.query as string) })
        break
      case "getFilterOptions":
        self.postMessage({ type: "getFilterOptions", msgId, data: handleGetFilterOptions() })
        break
    }
  } catch (err) {
    self.postMessage({ type: "error", msgId, error: String(err) })
  }
}
