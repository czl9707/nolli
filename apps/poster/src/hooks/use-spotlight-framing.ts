import { useEffect, useRef } from "react"
import { useMapInstanceStore } from "@/stores/map-instance"
import { useRouteStore } from "@/stores/route"
import type { Route } from "@/stores/route"
import type { Side } from "@/lib/url-state"
import { useSelectionStore } from "@/stores/selection"
import { spotlightPanVector } from "@/lib/spotlight-framing"
import { parseMapParams } from "@/lib/url-state"
import { MAP_TRANSITION_LONG, MAP_TRANSITION_SHORT } from "@nolli/ui"
import type { PosterBuilding } from "@/types"

/** Minimum zoom when entering spotlight, so a single building reads as the
 *  subject rather than a dot on a world map. A deeper current or URL zoom is
 *  preserved; only zoomed-out entries are bumped up. */
const DEFAULT_SPOTLIGHT_ZOOM = 14

/** Fly duration (ms) — entry / building change. Uses the shared long map
 *  transition (seconds → ms), the same scale as @nolli/map's long flights. */
const FLY_DURATION = MAP_TRANSITION_LONG * 1000

/** Ease duration (ms) — a corner-only change, a smooth pan to the new offset
 *  with no fly arc. Uses the shared short map transition; matches the hero
 *  card's framer-motion layout duration so the map and photo travel together. */
const EASE_DURATION = MAP_TRANSITION_SHORT * 1000

/** How the camera reaches the target frame. */
type FrameMode = "fly" | "ease" | "instant"

/**
 * In spotlight, owns the viewport: center on the selected building, offset so
 * its marker lands centered in the quadrant opposite the hero photo.
 *
 * - Entering spotlight or changing the spotlighted building → flyTo (arc).
 * - Changing the photo corner → easeTo (smooth pan to the new offset).
 * - Resizing → instant recompose.
 *
 * On entry it picks a building-level zoom: the deepest of the current zoom, an
 * explicit URL `zoom`, and DEFAULT_SPOTLIGHT_ZOOM. After that the user's manual
 * zoom is preserved across side/selection changes.
 *
 * No-op outside spotlight — the overview viewport is owned by useMapUrlState.
 */
export function useSpotlightFraming(
  buildings: PosterBuilding[],
  buildingsReady: boolean
) {
  const map = useMapInstanceStore((s) => s.map)
  const route = useRouteStore((s) => s.route)
  const side = useRouteStore((s) => s.side)
  // Select only the first selected slug so the effect re-runs when the
  // spotlighted building changes, NOT on every selection toggle or buildings
  // array identity change.
  const slug = useSelectionStore((s) => (s.selected.size === 0 ? null : Array.from(s.selected)[0]))

  // undefined so the first spotlight run (incl. a fresh deep-link that boots
  // straight into /spotlight) counts as an entry and applies the entry zoom.
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
    // fly arc, and corner-only changes with a smooth ease; resizes snap.
    const mode: FrameMode =
      justEntered || slugChanged ? "fly" : sideChanged ? "ease" : "instant"

    const building = buildings.find((b) => b.slug === slug)
    if (!building) return

    const apply = (m: FrameMode) => {
      const canvas = map.getCanvas()
      let zoom = map.getZoom()
      if (justEntered) {
        const urlZoom = parseMapParams(window.location.search).zoom
        zoom = Math.max(zoom, urlZoom ?? -Infinity, DEFAULT_SPOTLIGHT_ZOOM)
      }
      // The pan vector shifts the camera toward the photo corner; negating it
      // as an `offset` lands the building centered in the opposite quadrant.
      const [dx, dy] = spotlightPanVector(side, canvas.width, canvas.height)
      const center = [building.coordinates.lng, building.coordinates.lat] as [number, number]
      const offset = [-dx, -dy] as [number, number]
      if (m === "fly") {
        map.flyTo({ center, zoom, offset, duration: FLY_DURATION, essential: true })
      } else if (m === "ease") {
        map.easeTo({ center, zoom, offset, duration: EASE_DURATION })
      } else {
        map.jumpTo({ center, zoom, offset })
      }
    }
    apply(mode)
    const onResize = () => apply("instant")
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
    // `buildings` is read only to resolve the slug's coordinate, which is stable
    // per slug — a data refresh must not trigger a re-frame, so it's excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, route, side, slug, buildingsReady])
}
