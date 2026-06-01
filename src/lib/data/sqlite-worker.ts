import sqlite3InitModule from "@sqlite.org/sqlite-wasm"
import type {
  Database,
  SAHPoolUtil,
  SqlValue,
  Sqlite3Static,
} from "@sqlite.org/sqlite-wasm"
import type { ArchFilter, FilterOptions } from "./data-source.type"
import type { Arch, ArchLinks, ArchSummary } from "./architectures.type"
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

type Row = Record<string, SqlValue>

let sqlite3: Sqlite3Static
let poolUtil: SAHPoolUtil
let db: Database

const DB_NAME = "nolli.db"
const MANIFEST_KEY = "nolli-db-sha256"

let currentManifestHash: string | null = null

function mapRowToSummary(row: Row): ArchSummary {
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

async function handleInit() {
  if (db) {
    self.postMessage({ type: "ready" } as WorkerResponse)
    return
  }

  sqlite3 = await sqlite3InitModule()
  poolUtil = await sqlite3.installOpfsSAHPoolVfs({})

  const baseUrl = import.meta.env.VITE_R2_PUBLIC_DB_URL

  if (baseUrl) {
    const needsDownload = await checkManifest()
    if (needsDownload) {
      await downloadDb()
    }
  }

  db = new poolUtil.OpfsSAHPoolDb(DB_NAME)
  db.exec("PRAGMA journal_mode=WAL")

  self.postMessage({ type: "ready" } as WorkerResponse)
}

async function checkManifest(): Promise<boolean> {
  const baseUrl = import.meta.env.VITE_R2_PUBLIC_DB_URL as string
  const manifestUrl = `${baseUrl}/manifest.json`
  try {
    const response = await fetch(manifestUrl)
    const manifest = (await response.json()) as { sha256: string }
    currentManifestHash = manifest.sha256

    const stored =
      (globalThis as unknown as { localStorage: Storage }).localStorage?.getItem(
        MANIFEST_KEY,
      ) ?? null

    return stored !== manifest.sha256
  } catch {
    return true
  }
}

async function downloadDb(): Promise<void> {
  const baseUrl = import.meta.env.VITE_R2_PUBLIC_DB_URL as string
  if (!baseUrl) throw new Error("VITE_R2_PUBLIC_DB_URL is not set")

  const dbUrl = `${baseUrl}/latest.db`

  const response = await fetch(dbUrl)
  if (!response.ok) {
    throw new Error(`Failed to download DB: ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  await poolUtil.importDb(DB_NAME, buffer)

  if (currentManifestHash) {
    try {
      ;(
        globalThis as unknown as { localStorage: Storage }
      ).localStorage?.setItem(MANIFEST_KEY, currentManifestHash)
    } catch {}
  }
}

function queryAllArchitectures(filter?: ArchFilter): ArchSummary[] {
  let sql = SQL_GET_ALL_ARCHITECTURES
  const conditions: string[] = []
  const params: SqlValue[] = []

  if (filter?.bbox) {
    conditions.push("a.latitude BETWEEN ? AND ?")
    conditions.push("a.longitude BETWEEN ? AND ?")
    params.push(
      filter.bbox.south,
      filter.bbox.north,
      filter.bbox.west,
      filter.bbox.east,
    )
  }
  if (filter?.architectIds?.length) {
    const placeholders = filter.architectIds.map(() => "?").join(", ")
    conditions.push(`a.architect_id IN (${placeholders})`)
    params.push(...filter.architectIds)
  }
  if (filter?.cityIds?.length) {
    const placeholders = filter.cityIds.map(() => "?").join(", ")
    conditions.push(`a.city_id IN (${placeholders})`)
    params.push(...filter.cityIds)
  }
  if (filter?.countryCodes?.length) {
    const placeholders = filter.countryCodes.map(() => "?").join(", ")
    conditions.push(`c.code IN (${placeholders})`)
    params.push(...filter.countryCodes)
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ")
  }

  const rows = db.exec({
    sql,
    bind: params,
    rowMode: "object",
    returnValue: "resultRows",
  })

  return rows.map(mapRowToSummary)
}

function queryArchBySlug(slug: string): Arch | null {
  const idRows = db.exec({
    sql: SQL_GET_ARCHITECTURE_ID_BY_SLUG,
    bind: [slug],
    rowMode: "object",
    returnValue: "resultRows",
  })

  if (!idRows.length) return null

  const archId = idRows[0].id as number

  const archRows = db.exec({
    sql: SQL_GET_ARCH_BY_SLUG,
    bind: [slug],
    rowMode: "object",
    returnValue: "resultRows",
  })

  if (!archRows.length) return null

  const row = archRows[0]

  const photoRows = db.exec({
    sql: SQL_GET_PHOTOS,
    bind: [archId],
    rowMode: "object",
    returnValue: "resultRows",
  })

  let coverImage: string | null = null
  const photos = photoRows.map((pr) => {
    if (pr.is_cover) {
      coverImage = pr.image as string
    }
    return {
      image: pr.image as string,
      caption: (pr.caption as string | null) ?? undefined,
      width: pr.width as number,
      height: pr.height as number,
    }
  })

  const noteRows = db.exec({
    sql: SQL_GET_NOTES,
    bind: [archId],
    rowMode: "object",
    returnValue: "resultRows",
  })

  const notes = noteRows.map((nr) => ({
    text: nr.text as string,
  }))

  const linkRows = db.exec({
    sql: SQL_GET_LINKS,
    bind: [archId],
    rowMode: "object",
    returnValue: "resultRows",
  })

  const links: ArchLinks = {
    googleMaps: (row.google_maps_url as string) || "",
  }
  const custom: { url: string; label: string }[] = []

  for (const lr of linkRows) {
    const linkType = lr.type as string
    const linkUrl = lr.url as string

    switch (linkType) {
      case "google_maps":
        links.googleMaps = linkUrl
        break
      case "wikipedia":
        links.wikipedia = linkUrl
        break
      case "archdaily":
        links.archdaily = linkUrl
        break
      default:
        custom.push({ url: linkUrl, label: lr.label as string })
        break
    }
  }

  if (custom.length > 0) {
    links.custom = custom
  }

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

function querySearchArchitectures(query: string): ArchSummary[] {
  const rows = db.exec({
    sql: SQL_SEARCH_ARCHITECTURES,
    bind: [query, query, query],
    rowMode: "object",
    returnValue: "resultRows",
  })

  return rows.map(mapRowToSummary)
}

function queryFilterOptions(): FilterOptions {
  const architects = db
    .exec({
      sql: SQL_GET_ARCHITECTS,
      rowMode: "object",
      returnValue: "resultRows",
    })
    .map((r) => ({
      id: r.id as number,
      name: r.name as string,
    }))

  const cities = db
    .exec({
      sql: SQL_GET_CITIES,
      rowMode: "object",
      returnValue: "resultRows",
    })
    .map((r) => ({
      id: r.id as number,
      name: r.name as string,
      countryCode: r.country_code as string,
    }))

  const countries = db
    .exec({
      sql: SQL_GET_COUNTRIES,
      rowMode: "object",
      returnValue: "resultRows",
    })
    .map((r) => ({
      code: r.code as string,
      name: r.name as string,
    }))

  return { architects, cities, countries }
}

self.onmessage = async (e: MessageEvent<WorkerMessage & { msgId?: number }>) => {
  const msgId = e.data.msgId
  try {
    const msg = e.data
    switch (msg.type) {
      case "init":
        await handleInit()
        break
      case "getAllArchitectures":
        self.postMessage({
          type: "result",
          msgId,
          data: queryAllArchitectures(msg.filter),
        } as WorkerResponse & { msgId?: number })
        break
      case "getArchBySlug":
        self.postMessage({
          type: "result",
          msgId,
          data: queryArchBySlug(msg.slug),
        } as WorkerResponse & { msgId?: number })
        break
      case "searchArchitectures":
        self.postMessage({
          type: "result",
          msgId,
          data: querySearchArchitectures(msg.query),
        } as WorkerResponse & { msgId?: number })
        break
      case "getFilterOptions":
        self.postMessage({
          type: "result",
          msgId,
          data: queryFilterOptions(),
        } as WorkerResponse & { msgId?: number })
        break
    }
  } catch (err) {
    self.postMessage({
      type: "error",
      msgId,
      error: String(err),
    } as WorkerResponse & { msgId?: number })
  }
}
