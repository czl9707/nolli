import Database from "better-sqlite3";
import { existsSync, mkdirSync, createWriteStream } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { BuildingRow } from "./manifest";

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
  const res = await fetch(DB_URL);
  if (!res.ok || !res.body) throw new Error(`fetch ${DB_URL} -> ${res.status}`);
  const file = createWriteStream(dest);
  for await (const chunk of res.body as unknown as AsyncIterable<Buffer>) file.write(chunk);
  file.end();
}

// Resolve the architect's DB display name from a lowercase CLI slug.
// The architects table has no slug column, so we match lower(name) against
// the slug with hyphens turned back into spaces ("sanaa" -> "SANAA",
// "tadao-ando" -> "Tadao Ando").
export function resolveArchitect(dbPath: string, slug: string): string {
  const db = new Database(dbPath, { readonly: true });
  const key = slug.toLowerCase().replace(/-/g, " ");
  const row = db.prepare("SELECT name FROM architects WHERE lower(name) = ?").get(key) as
    | { name: string }
    | undefined;
  db.close();
  if (!row) {
    throw new Error(`No architect matches slug "${slug}" (no architects.name equals "${key}").`);
  }
  return row.name;
}

export function queryArchitectBuildings(dbPath: string, architectName: string): BuildingRow[] {
  const db = new Database(dbPath, { readonly: true });
  const rows = db.prepare(`
    SELECT a.slug, a.name, a.year, ci.name AS city, co.code AS cc, a.latitude, a.longitude
    FROM architectures a
    JOIN architects ar ON a.architect_id = ar.id
    LEFT JOIN cities ci ON a.city_id = ci.id
    LEFT JOIN countries co ON ci.country_id = co.id
    WHERE ar.name = ?
    ORDER BY a.year ASC
  `).all(architectName) as BuildingRow[];
  db.close();
  return rows;
}
