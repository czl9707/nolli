import { useEffect } from "react"
import { useMapInstanceStore } from "@/stores/map-instance"
import { useRouteStore } from "@/stores/route"
import { useSelectionStore } from "@/stores/selection"
import { spotlightPanVector } from "@/lib/spotlight-framing"
import type { PosterBuilding } from "@/types"

/**
 * In spotlight, owns the viewport: center on the selected building, then pan
 * toward the photo side so its marker lands centered in the opposite half.
 * Re-applies on side / selection[0] / route change, and on window resize.
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
  const selected = useSelectionStore((s) => s.selected)

  useEffect(() => {
    if (route !== "spotlight" || !map || !buildingsReady) return
    const slug = Array.from(selected)[0]
    if (!slug) return
    const building = buildings.find((b) => b.slug === slug)
    if (!building) return

    const apply = () => {
      const canvas = map.getCanvas()
      map.jumpTo({
        center: [building.coordinates.lng, building.coordinates.lat],
        zoom: map.getZoom(),
      })
      const [dx, dy] = spotlightPanVector(side, canvas.width, canvas.height)
      map.panBy([dx, dy], { animate: false })
    }
    apply()
    const onResize = () => apply()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [map, route, side, selected, buildings, buildingsReady])
}
