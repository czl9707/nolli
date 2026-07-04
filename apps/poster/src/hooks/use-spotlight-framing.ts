import { useEffect, useRef } from "react"
import { flyToArchCinematic } from "@nolli/map"
import { useMapInstanceStore } from "@/stores/map-instance"
import { useRouteStore } from "@/stores/route"
import type { Route } from "@/stores/route"
import type { Side } from "@/lib/url-state"
import { useSelectionStore } from "@/stores/selection"
import { parseMapParams } from "@/lib/url-state"
import { MAP_TRANSITION_SHORT } from "@nolli/ui"
import type { ArchSummary } from "@nolli/data"

const DEFAULT_SPOTLIGHT_ZOOM = 14
const EASE_DURATION = MAP_TRANSITION_SHORT * 1000
type FrameMode = "fly" | "ease"

/**
 * In spotlight, owns the viewport: center on the selected building, offset so
 * its marker lands centered in the quadrant opposite the hero photo.
 *
 * - Entering spotlight or changing the spotlighted building (a sidebar card or
 *   marker click) → the shared cinematic fly (adaptive duration, default zoom),
 *   with the hero offset so the marker lands in the opposite quadrant.
 * - Changing the photo corner → easeTo (smooth pan to the new offset).
 *
 * On entry the target zoom is the deepest of the current zoom, an explicit URL
 * `zoom`, and DEFAULT_SPOTLIGHT_ZOOM; otherwise clicks floor at the default.
 * The user's manual zoom above the floor is preserved.
 *
 * Resize is left to MapLibre (trackResize) — it keeps the center coordinate, so
 * the marker may drift slightly from its exact quadrant slot on window resize,
 * accepted as a rare case.
 *
 * No-op outside spotlight — the overview viewport is owned by useMapUrlState.
 */
export function useSpotlightFraming(
  buildings: ArchSummary[],
  buildingsReady: boolean
) {
  const map = useMapInstanceStore((s) => s.map)
  const route = useRouteStore((s) => s.route)
  const side = useRouteStore((s) => s.side)
  // Select only the first selected slug so the effect re-runs when the
  // spotlighted building changes, NOT on every selection toggle or buildings
  // array identity change.
  const slug = useSelectionStore((s) => (s.selected.size === 0 ? null : Array.from(s.selected)[0]))

  const prevRouteRef = useRef<Route | undefined>(undefined)
  const prevSlugRef = useRef<string | null>(undefined)
  const prevSideRef = useRef<Side | undefined>(undefined)

  useEffect(() => {
    if (route !== "spotlight") {
      prevRouteRef.current = route // record that we left spotlight
      return
    }
    if (!map || !buildingsReady || !slug) return // wait; don't mark as entered yet

    const justEntered = prevRouteRef.current !== "spotlight"
    const slugChanged = prevSlugRef.current !== slug
    const sideChanged = prevSideRef.current !== side
    prevRouteRef.current = route
    prevSlugRef.current = slug
    prevSideRef.current = side
    // Animate the "go to building" moments (entry + selection change) with a
    // cinematic fly arc, and corner-only changes with a smooth ease. Anything
    // else (e.g. a no-op re-run) leaves the camera alone.
    const mode: FrameMode | null =
      justEntered || slugChanged ? "fly" : sideChanged ? "ease" : null
    if (!mode) return

    const building = buildings.find((b) => b.slug === slug)
    if (!building) return

    const canvas = map.getCanvas()
    // Entry honors an explicit URL zoom (deep-links); clicks floor at the
    // default. flyToArchCinematic/easeTo never zoom out below the current zoom,
    // so a deeper manual zoom is preserved.
    const targetZoom = justEntered
      ? Math.max(
          map.getZoom(),
          parseMapParams(window.location.search).zoom ?? -Infinity,
          DEFAULT_SPOTLIGHT_ZOOM
        )
      : DEFAULT_SPOTLIGHT_ZOOM
    // The pan vector shifts the camera toward the photo corner; negating it as
    // an `offset` lands the building centered in the opposite quadrant.
    const [dx, dy] = spotlightPanVector(side, canvas.width, canvas.height)
    const center = [building.coordinates.lng, building.coordinates.lat] as [number, number]
    const offset = [-dx, -dy] as [number, number]
    if (mode === "fly") {
      flyToArchCinematic(map, center[0], center[1], targetZoom, offset)
    } else {
      map.easeTo({ center, zoom: map.getZoom(), offset, duration: EASE_DURATION })
    }
  }, [map, route, side, slug, buildingsReady])
}

export function spotlightPanVector(
  side: Side,
  width: number,
  height: number
): [number, number] {
  const qx = Math.round(width * 0.1)
  const qy = Math.round(height * 0.1)
  switch (side) {
    case "top-right":
      return [qx, -qy]
    case "top-left":
      return [-qx, -qy]
    case "bottom-right":
      return [qx, qy]
    case "bottom-left":
      return [-qx, qy]
  }
}
