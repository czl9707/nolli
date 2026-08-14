import Database from "better-sqlite3";
import { existsSync, mkdirSync, createWriteStream, rename, unlink } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ReelBuilding } from "../src/lib/config";

const DB_URL = "https://db.nolli-map.com/latest.db";
const CACHE_DIR = process.env.NOLLI_DB_DIR ?? join(homedir(), ".nolli");
const CACHE_PATH = join(CACHE_DIR, "latest.db");

export async function ensureDb(): Promise<string> {
  if (!existsSync(CACHE_PATH)) {
    mkdirSync(CACHE_DIR, { recursive: true });
    await downloadDb(CACHE_PATH);
  }
  return CACHE_PATH;
}

async function downloadDb(dest: string): Promise<void> {
  const tmp = `${dest}.tmp-${process.pid}`;
  try {
    const res = await fetch(DB_URL);
    if (!res.ok || !res.body) throw new Error(`fetch ${DB_URL} -> ${res.status}`);
    const file = createWriteStream(tmp);
    for await (const chunk of res.body as unknown as AsyncIterable<Buffer>) file.write(chunk);
    file.end();
    await new Promise<void>((resolve, reject) => {
      file.on("finish", resolve);
      file.on("error", reject);
    });
    await new Promise<void>((resolve, reject) =>
      rename(tmp, dest, (err) => (err ? reject(err) : resolve())),
    );
  } catch (err) {
    await new Promise<void>((resolve) =>
      unlink(tmp, () => resolve()),
    );
    throw err;
  }
}

/** Run a query against a single readonly connection, then close it. */
function withDb<T>(dbPath: string, fn: (db: Database.Database) => T): T {
  const db = new Database(dbPath, { readonly: true });
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

export function resolveArchitectName(dbPath: string, slug: string): string {
  const key = slug.replace(/-/g, " ").toLowerCase();
  const row = withDb(dbPath, (db) =>
    db.prepare("SELECT name FROM architects WHERE lower(name) = ?").get(key) as
      | { name: string }
      | undefined,
  );
  if (!row) throw new Error(`No architect matches slug "${slug}".`);
  return row.name;
}

export type ArchPinRow = { id: number; slug: string; name: string; lng: number; lat: number };

export function queryAllArchPins(dbPath: string): ArchPinRow[] {
  return withDb(dbPath, (db) =>
    db.prepare(`
      SELECT a.id, a.slug, a.name, a.latitude AS lat, a.longitude AS lng
      FROM architectures a
      ORDER BY a.id ASC
    `).all() as ArchPinRow[],
  );
}

type DbRow = {
  slug: string;
  name: string;
  year: number;
  city: string | null;
  cc: string | null;
  lat: number;
  lng: number;
  cover: string | null;
};

export function queryArchitectBuildings(dbPath: string, architectName: string): ReelBuilding[] {
  const rows = withDb(dbPath, (db) =>
    db
      .prepare(
        `
      SELECT a.slug, a.name, a.year,
             ci.name AS city, co.code AS cc,
             a.latitude AS lat, a.longitude AS lng,
             (SELECT p.image FROM architecture_photos p WHERE p.architecture_id = a.id AND p.is_cover = 1) AS cover
      FROM architectures a
      JOIN architects ar ON a.architect_id = ar.id
      LEFT JOIN cities ci ON a.city_id = ci.id
      LEFT JOIN countries co ON ci.country_id = co.id
      WHERE ar.name = ?
      ORDER BY a.year ASC
    `,
      )
      .all(architectName) as DbRow[],
  );
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    year: r.year,
    city: r.city ?? "—",
    countryCode: r.cc ?? "",
    coordinates: { lng: r.lng, lat: r.lat },
    coverImage: r.cover ?? "",
  }));
}
