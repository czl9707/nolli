// Node-only: download + query the read-only app DB snapshot. Imported via the
// "@nolli/remotion/db" subpath from the capture scripts — never re-exported
// from the package barrel, so Remotion's bundler (which starts at src/index.ts)
// never pulls better-sqlite3 into a browser bundle.
import Database from "better-sqlite3";
import { existsSync, mkdirSync, createWriteStream, rename, unlink, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DB_URL = "https://db.nolli-map.com/latest.db";
const CACHE_DIR = process.env.NOLLI_DB_DIR ?? join(homedir(), ".nolli");
const CACHE_PATH = join(CACHE_DIR, "latest.db");

export async function ensureDb(fresh = false): Promise<string> {
  if (fresh || !existsSync(CACHE_PATH)) {
    if (existsSync(CACHE_PATH)) rmSync(CACHE_PATH);
    mkdirSync(CACHE_DIR, { recursive: true });
    await downloadDb(CACHE_PATH);
  }
  return CACHE_PATH;
}

// Download to a temp file and rename into place, so a reader never opens a
// partially-written cache.
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
    await new Promise<void>((resolve) => unlink(tmp, () => resolve()));
    throw err;
  }
}

function withDb<T>(dbPath: string, fn: (db: Database.Database) => T): T {
  const db = new Database(dbPath, { readonly: true });
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

// Resolve the architect's DB display name from a lowercase CLI slug.
// The architects table has no slug column, so we match lower(name) against
// the slug with hyphens turned back into spaces ("sanaa" -> "SANAA",
// "tadao-ando" -> "Tadao Ando").
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

/** One architect's buildings as raw shared columns — apps map to their own
 *  row shapes. Ordered by year ascending. */
export type ArchRow = {
  slug: string;
  name: string;
  year: number;
  city: string | null;
  cc: string | null;
  lat: number;
  lng: number;
  cover: string | null;
};

export function queryArchitectBuildings(dbPath: string, architectName: string): ArchRow[] {
  return withDb(dbPath, (db) =>
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
      .all(architectName) as ArchRow[],
  );
}
