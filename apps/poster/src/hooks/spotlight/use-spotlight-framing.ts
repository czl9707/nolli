// apps/poster/src/hooks/use-spotlight-framing.ts
import { useEffect, useRef } from "react"
import { flyToArchCinematic } from "@nolli/map"
import { useMapInstanceStore } from "@/stores/map-instance"
import { useRouteStore } from "@/stores/route"
import type { Route } from "@/stores/route"
import { useSpotlightStore } from "@/stores/spotlight"
import { OPPOSITE_EDGE, type Edge } from "@/lib/spotlight-types"
import { spotlightEdgeOffset } from "@/lib/spotlight-geometry"
import { useSelectionStore } from "@/stores/selection"
import { parseMapParams } from "@/lib/url-state"
import { MAP_TRANSITION_SHORT } from "@nolli/ui"
import type { ArchSummary } from "@nolli/data"

const DEFAULT_SPOTLIGHT_ZOOM = 15
const EASE_DURATION = MAP_TRANSITION_SHORT * 1000
type FrameMode = "fly" | "ease"

/**
 * In spotlight, owns the viewport: center on the selected building, offset so
 * its marker lands in the region opposite the image strip.
 *
 * - Entering spotlight or changing the spotlighted building → cinematic fly
 *   (adaptive duration, default zoom) with the strip offset applied.
 * - Changing the caption edge → easeTo (smooth pan to the new offset). The
 *   image docks opposite the caption, so the image edge is derived here.
 *
 * Entry honors the deeper of current zoom, an explicit URL `zoom`, and the
 * default; clicks floor at the default. Manual zoom above the floor is kept.
 * Resize is left to MapLibre (trackResize). No-op outside spotlight.
 */
export function useSpotlightFraming(
  buildings: ArchSummary[],
  buildingsReady: boolean
) {
  const map = useMapInstanceStore((s) => s.map)
  const route = useRouteStore((s) => s.route)
  const captionEdge = useSpotlightStore((s) => s.captionEdge)
  const slug = useSelectionStore((s) =>
    s.selected.size === 0 ? null : Array.from(s.selected)[0]
  )

  const prevRouteRef = useRef<Route | undefined>(undefined)
  const prevSlugRef = useRef<string | null>(undefined)
  const prevEdgeRef = useRef<Edge | undefined>(undefined)

  useEffect(() => {
    if (route !== "spotlight") {
      prevRouteRef.current = route
      return
    }
    if (!map || !buildingsReady || !slug) return

    const justEntered = prevRouteRef.current !== "spotlight"
    const slugChanged = prevSlugRef.current !== slug
    const edgeChanged = prevEdgeRef.current !== captionEdge
    prevRouteRef.current = route
    prevSlugRef.current = slug
    prevEdgeRef.current = captionEdge

    const mode: FrameMode | null =
      justEntered || slugChanged ? "fly" : edgeChanged ? "ease" : null
    if (!mode) return

    const building = buildings.find((b) => b.slug === slug)
    if (!building) return

    const canvas = map.getCanvas()
    const targetZoom = justEntered
      ? Math.max(
          map.getZoom(),
          parseMapParams(window.location.search).zoom ?? -Infinity,
          DEFAULT_SPOTLIGHT_ZOOM
        )
      : DEFAULT_SPOTLIGHT_ZOOM
    // The image docks opposite the caption; spotlightEdgeOffset shifts the
    // marker into the half opposite the (image) edge it's given, i.e. toward
    // the caption. Pass the derived image edge.
    const imageEdge = OPPOSITE_EDGE[captionEdge]
    const [dx, dy] = spotlightEdgeOffset(imageEdge, canvas.width, canvas.height)
    const center = [building.coordinates.lng, building.coordinates.lat] as [number, number]
    const offset = [dx, dy] as [number, number]
    if (mode === "fly") {
      flyToArchCinematic(map, center[0], center[1], targetZoom, offset)
    } else {
      map.easeTo({ center, zoom: map.getZoom(), offset, duration: EASE_DURATION })
    }
  }, [map, route, captionEdge, slug, buildingsReady])
}
