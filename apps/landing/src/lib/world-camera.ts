import type { SceneCamera } from "@nolli/map"
import { MAP_LEAN_OVERSCAN } from "@/lib/map-lean"

/** World hold camera. renderWorldCopies:false floors the map's zoom where
 *  one world copy spans the map container (log2 of the longer side over
 *  the 512px world tile) — the ledger's full span parks exactly there, so
 *  the world holds (architect, stats) share one literal camera and the
 *  crossing between them never launches a flight to fight the clamp. The
 *  container is the viewport plus the lean wrapper's overscan on every
 *  side, so the fit is computed over the oversized box — a fit to the
 *  bare window parks BELOW the clamp's floor and every world crossing
 *  flies, mis-lands, and visibly snaps. At that zoom the world fills the
 *  container exactly, so longitude has no pan room and rests at 0 — the
 *  whole world is on screen either way. Lives apart from constants.ts so
 *  the bake script can import the decks without pulling @nolli/ui's css
 *  through tsx. */
export function worldCamera(): SceneCamera {
  const center = [0, 15] as [number, number]
  const px = typeof window === "undefined"
    ? 1440 + 2 * MAP_LEAN_OVERSCAN
    : Math.max(window.innerWidth, window.innerHeight) + 2 * MAP_LEAN_OVERSCAN
  return { center, zoom: Math.log2(px / 512) }
}
