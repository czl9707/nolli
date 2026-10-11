import type { SceneCamera } from "@nolli/map"
import { isMobile } from "@nolli/ui/use-is-mobile"
import { MAP_LEAN_OVERSCAN } from "@/lib/map-lean"
import { projY, invProjY } from "@/lib/camera"

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
  const w = typeof window === "undefined" ? 1440 : window.innerWidth
  const h = typeof window === "undefined" ? 900 : window.innerHeight
  const px = Math.max(w, h) + 2 * MAP_LEAN_OVERSCAN
  if (typeof window !== "undefined" && isMobile()) {
    // mobile: the world fills the top 80% of the viewport — the minimum
    // screen the map can afford — anchored at the very top, with the band
    // under it left for the docked dossier; longitude crops ±(the rest),
    // which at 80% still spans ~±100°. The center's mercator y sits the
    // world's top edge on the viewport's top: the camera center projects
    // to the container's middle, and the overscan wrapper shifts that
    // middle 24px up the page.
    const worldH = 0.8 * h
    return { center: [0, invProjY(0.5 * h / worldH)], zoom: Math.log2(worldH / 512) }
  }
  return { center: [0, 15], zoom: Math.log2(px / 512) }
}
