import { useEffect, useRef } from "react"
import { useMapInstanceStore } from "@/stores/map-instance"
import { useRouteStore } from "@/stores/route"
import type { Route } from "@/stores/route"
import { useSelectionStore } from "@/stores/selection"
import { spotlightPanVector } from "@/lib/spotlight-framing"
import { parseMapParams } from "@/lib/url-state"
import type { PosterBuilding } from "@/types"

/** Minimum zoom when entering spotlight, so a single building reads as the
 *  subject rather than a dot on a world map. A deeper current or URL zoom is
 *  preserved; only zoomed-out entries are bumped up. */
const DEFAULT_SPOTLIGHT_ZOOM = 14

/**
 * In spotlight, owns the viewport: center on the selected building, then pan
 * toward the photo side so its marker lands centered in the opposite half.
 * Re-applies on side / selection[0] / route change, and on window resize.
 *
 * On entering spotlight it picks a building-level zoom: the deepest of the
 * current zoom, an explicit URL `zoom`, and DEFAULT_SPOTLIGHT_ZOOM. After that
 * the user's manual zoom is preserved across side/selection changes.
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
  // array identity change (which would needlessly re-center/pan).
  const slug = useSelectionStore((s) => (s.selected.size === 0 ? null : Array.from(s.selected)[0]))

  // undefined so the first spotlight run (incl. a fresh deep-link that boots
  // straight into /spotlight) counts as an entry and applies the entry zoom.
  const prevRouteRef = useRef<Route | undefined>(undefined)

  useEffect(() => {
    if (route !== "spotlight") {
      prevRouteRef.current = route // record that we left spotlight
      return
    }
    if (!map || !buildingsReady || !slug) return // wait; don't mark as entered yet
    const justEntered = prevRouteRef.current !== "spotlight"
    prevRouteRef.current = route

    const building = buildings.find((b) => b.slug === slug)
    if (!building) return

    const apply = () => {
      const canvas = map.getCanvas()
      let zoom = map.getZoom()
      if (justEntered) {
        const urlZoom = parseMapParams(window.location.search).zoom
        zoom = Math.max(zoom, urlZoom ?? -Infinity, DEFAULT_SPOTLIGHT_ZOOM)
      }
      map.jumpTo({
        center: [building.coordinates.lng, building.coordinates.lat],
        zoom,
      })
      const [dx, dy] = spotlightPanVector(side, canvas.width, canvas.height)
      map.panBy([dx, dy], { animate: false })
    }
    apply()
    const onResize = () => apply()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
    // `buildings` is read only to resolve the slug's coordinate, which is stable
    // per slug — a data refresh must not trigger a re-frame, so it's excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, route, side, slug, buildingsReady])
}
