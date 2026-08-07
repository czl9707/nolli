import type { ReelBuilding } from "./config";

export type MapViewport = { center: [number, number]; zoom: number };

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const BUILDING_ZOOM = 14;
// Cinematic zoom arc: pull back mid-flight, push back in at each building.
const FLY_DIP = 4;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function flyViewport(buildings: ReelBuilding[], i: number, intra: number, maxZoom: number): MapViewport {
  const cur = buildings[i];
  const next = buildings[Math.min(i + 1, buildings.length - 1)];
  const raw = buildings.length === 1 ? 0 : intra;
  const t = easeInOut(raw);
  const center: [number, number] = [
    lerp(cur.coordinates.lng, next.coordinates.lng, t),
    lerp(cur.coordinates.lat, next.coordinates.lat, t),
  ];
  const zoom = Math.min(maxZoom, BUILDING_ZOOM - FLY_DIP * Math.sin(Math.PI * raw));
  return { center, zoom };
}

export function fitViewport(buildings: ReelBuilding[], maxZoom: number): MapViewport {
  if (buildings.length === 1) return { center: [buildings[0].coordinates.lng, buildings[0].coordinates.lat], zoom: maxZoom };
  const lngs = buildings.map((b) => b.coordinates.lng);
  const lats = buildings.map((b) => b.coordinates.lat);
  const west = Math.min(...lngs), east = Math.max(...lngs);
  const south = Math.min(...lats), north = Math.max(...lats);
  const center: [number, number] = [(west + east) / 2, (south + north) / 2];
  const lngSpan = Math.max(east - west, 0.01);
  const zoom = Math.min(maxZoom, Math.max(1, Math.log2(360 / lngSpan)));
  return { center, zoom };
}
