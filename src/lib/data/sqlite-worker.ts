import sqlite3InitModule from "@sqlite.org/sqlite-wasm"
import type { Database, SAHPoolUtil, Sqlite3Static, BindingSpec } from "@sqlite.org/sqlite-wasm"
import type { WorkerResponse } from "./worker-protocol.type"
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
type WorkerInbound = { type: "init"; msgId?: number } | { type: string; msgId: number; [key: string]: unknown }

let db: Database
const DB_NAME = "nolli.db"
const MANIFEST_KEY = "nolli-db-sha256"
const BASE_URL = import.meta.env.VITE_R2_PUBLIC_DB_URL as string | undefined

let manifestHash: string | null = null

function query(sql: string, bind?: unknown[]): Row[] {
  return db.exec({
    sql,
    bind: bind as BindingSpec | undefined,
    rowMode: "object",
    returnValue: "resultRows",
  }) as unknown as Row[]
}

function getStoredHash(): string | null {
  try {
    return localStorage.getItem(MANIFEST_KEY)
  } catch {
    return null
  }
}

function setStoredHash(hash: string): void {
  try {
    localStorage.setItem(MANIFEST_KEY, hash)
  } catch {}
}

function post(msg: WorkerResponse): void {
  self.postMessage(msg)
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

async function handleInit(msgId: number): Promise<void> {
  if (db) {
    post({ type: "ready", msgId })
    return
  }

  const sqlite3: Sqlite3Static = await sqlite3InitModule()
  const poolUtil: SAHPoolUtil = await sqlite3.installOpfsSAHPoolVfs({})

  if (BASE_URL) {
    if (await checkManifest()) {
      await downloadDb(poolUtil)
    }
  }

  db = new poolUtil.OpfsSAHPoolDb(DB_NAME)
  db.exec("PRAGMA journal_mode=WAL")

  post({ type: "ready", msgId })
}

async function checkManifest(): Promise<boolean> {
  if (!BASE_URL) return true

  try {
    const res = await fetch(`${BASE_URL}/manifest.json`)
    const manifest = (await res.json()) as { sha256: string }
    manifestHash = manifest.sha256
    return getStoredHash() !== manifest.sha256
  } catch {
    return true
  }
}

async function downloadDb(poolUtil: SAHPoolUtil): Promise<void> {
  if (!BASE_URL) throw new Error("VITE_R2_PUBLIC_DB_URL is not set")

  const res = await fetch(`${BASE_URL}/latest.db`)
  if (!res.ok) throw new Error(`Failed to download DB: ${res.status}`)

  const buffer = await res.arrayBuffer()
  await poolUtil.importDb(DB_NAME, buffer)

  if (manifestHash) setStoredHash(manifestHash)
}

function handleGetAllArchitectures(filter: ArchFilter | undefined): ArchSummary[] {
  let sql = SQL_GET_ALL_ARCHITECTURES
  const conditions: string[] = []
  const params: unknown[] = []

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
  if (filter?.countryCodes?.length) {
    conditions.push(`c.code IN (${filter.countryCodes.map(() => "?").join(", ")})`)
    params.push(...filter.countryCodes)
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

self.onmessage = async (e: MessageEvent<WorkerInbound>) => {
  const { type } = e.data
  const msgId = e.data.msgId ?? 0
  try {
    switch (type) {
      case "init":
        await handleInit(msgId as number)
        break
      case "getAllArchitectures":
        post({ type: "getAllArchitectures", msgId, data: handleGetAllArchitectures(e.data.filter as ArchFilter | undefined) })
        break
      case "getArchBySlug":
        post({ type: "getArchBySlug", msgId, data: handleGetArchBySlug(e.data.slug as string) })
        break
      case "searchArchitectures":
        post({ type: "searchArchitectures", msgId, data: handleSearchArchitectures(e.data.query as string) })
        break
      case "getFilterOptions":
        post({ type: "getFilterOptions", msgId, data: handleGetFilterOptions() })
        break
    }
  } catch (err) {
    post({ type: "error", msgId, error: String(err) })
  }
}
