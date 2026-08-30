import type { BuildingRow } from "./manifest";

const R_KM = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two lat/lng points, in kilometers. */
export function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** The building farthest (great-circle) from the origin building. Used to pick
 *  the most dramatic flyTo target for the journey. Falls back to the first row
 *  if the origin slug isn't found; ties break by array order. */
export function farthestFrom(rows: BuildingRow[], originSlug: string): BuildingRow {
  if (rows.length === 0) throw new Error("farthestFrom: empty rows");
  const origin = rows.find((r) => r.slug === originSlug) ?? rows[0];
  let best = rows[0];
  let bestD = -1;
  for (const r of rows) {
    const d = haversine(origin.latitude, origin.longitude, r.latitude, r.longitude);
    if (d > bestD) {
      bestD = d;
      best = r;
    }
  }
  return best;
}
