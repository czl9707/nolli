export type MapViewport = { center: [number, number]; zoom: number };

/** Cruise zoom held on each building; the composition's `maxZoom` clamps to this. */
export const BUILDING_ZOOM = 15;

/** Fixed opener framing: the whole-globe world view held across the HOOK beat
 *  (and the origin the first flight flies out of). The reel centers on a static
 *  world map, not the architect's building centroid. */
export const WORLD_VP: MapViewport = { center: [0, 0], zoom: 1 };

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
// Clamp the flight arc so it never zooms out past this (maplibre's `minZoom`).
// Kept at 6 (not lower) to limit how many remote vector tiles each hop sweeps —
// at z4 a long hop pulls a continental tile set every frame and trips the tile
// source's rate limit, stalling the render.
const FLIGHT_MIN_ZOOM = 6;
// maplibre defaults: ρ (curve) and the larger render dimension of the map panel.
const FLIGHT_CURVE = 1.42;
const MAP_PANEL_W0 = 1032;
const TILE_SIZE = 512;

export function lerp2(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number },
  t: number,
): { lng: number; lat: number } {
  return { lng: lerp(a.lng, b.lng, t), lat: lerp(a.lat, b.lat, t) };
}

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Great-circle distance between two lng/lat points, in km. */
export function haversine(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number },
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// maplibre's default flyTo easing = CSS `ease` (cubic-bezier(0.25, 0.1, 0.25, 1)).
function unitBezier(p1x: number, p1y: number, p2x: number, p2y: number): (t: number) => number {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const solveX = (x: number): number => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = sampleDX(t);
      if (Math.abs(d) < 1e-6) break;
      const next = t - (sampleX(t) - x) / d;
      if (Math.abs(next - t) < 1e-6) return next;
      t = next;
    }
    let lo = 0;
    let hi = 1;
    let tt = x;
    for (let i = 0; i < 24; i++) {
      const xv = sampleX(tt);
      if (Math.abs(xv - x) < 1e-6) return tt;
      if (x > xv) lo = tt;
      else hi = tt;
      tt = (lo + hi) / 2;
    }
    return tt;
  };
  return (t) => sampleY(solveX(t));
}
export const FLIGHT_EASE = unitBezier(0.25, 0.1, 0.25, 1);

/** Project lng/lat to CSS pixels at the given world size (Web Mercator). */
function projectPixel(lng: number, lat: number, worldSize: number): [number, number] {
  const phi = toRad(lat);
  const x = (lng / 360 + 0.5) * worldSize;
  const y = ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * worldSize;
  return [x, y];
}

const sinh = Math.sinh;
const cosh = Math.cosh;
const tanh = Math.tanh;

/**
 * maplibre's flyTo flight path (Van Wijk et al. 2003), ported from
 * maplibre-gl's camera.ts. Given start/end center+zoom and an eased progress
 * `t` in [0,1], returns the interpolated {center, zoom} along the arc.
 *
 * The zoom-out depth is determined NATURALLY by the path length (so it's
 * distance-aware without a hand-tuned floor) and clamped by `minZoom`.
 */
export function flightPath(opts: {
  from: { lng: number; lat: number };
  to: { lng: number; lat: number };
  startZoom: number;
  endZoom: number;
  t: number;
}): { center: { lng: number; lat: number }; zoom: number } {
  const { from, to, startZoom, endZoom, t } = opts;
  const worldSize = TILE_SIZE * Math.pow(2, startZoom);
  const w0 = MAP_PANEL_W0;
  const scaleOfZoom = Math.pow(2, endZoom - startZoom);
  const w1 = w0 / scaleOfZoom;

  const [x0, y0] = projectPixel(from.lng, from.lat, worldSize);
  const [x1, y1] = projectPixel(to.lng, to.lat, worldSize);
  const u1 = Math.hypot(x1 - x0, y1 - y0);

  let rho = FLIGHT_CURVE;
  const scaleOfMinZoom = Math.pow(2, FLIGHT_MIN_ZOOM - startZoom);
  const wMax = w0 / scaleOfMinZoom;
  if (isFinite(wMax) && u1 > 0) {
    rho = Math.min(rho, Math.sqrt((wMax / u1) * 2));
  }
  const rho2 = rho * rho;

  const zoomOutFactor = (descent: boolean): number => {
    const denom = 2 * (descent ? w1 : w0) * rho2 * u1;
    if (denom === 0) return 0;
    const b =
      (w1 * w1 - w0 * w0 + (descent ? -1 : 1) * rho2 * rho2 * u1 * u1) / denom;
    return Math.log(Math.sqrt(b * b + 1) - b);
  };
  const r0 = zoomOutFactor(false);
  const r1 = zoomOutFactor(true);

  let S = (r1 - r0) / rho;
  let wAt = (s: number) => cosh(r0) / cosh(r0 + rho * s);
  let uAt = (s: number) =>
    u1 > 0 ? (w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0))) / (rho2 * u1) : 0;

  // Degenerate / short-path fallback (no horizontal motion).
  if (Math.abs(u1) < 0.000002 || !isFinite(S)) {
    const k = w1 < w0 ? -1 : 1;
    S = Math.abs(Math.log(w1 / w0)) / rho;
    uAt = () => 0;
    wAt = (s) => Math.exp(k * rho * s);
  }

  const s = t * S;
  const scale = 1 / wAt(s);
  const centerFactor = Math.min(1, Math.max(0, uAt(s)));
  return {
    center: lerp2(from, to, centerFactor),
    zoom: startZoom + Math.log2(scale),
  };
}
