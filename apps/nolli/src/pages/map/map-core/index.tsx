import { useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { ArchMap } from "@nolli/map"
import {
  flyToArchCinematic,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from "@nolli/map"
import { TRANSITION_SHORT } from "@nolli/ui"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useLayout } from "@/hooks/use-layout"
import { useDbStore } from "@/stores/db"
import { useFilterStore } from "@nolli/data"
import { useSidebarStore } from "@/stores/sidebar"
import { useArchNavigate } from "@/hooks/use-arch-navigate"
import { useUserLocation } from "./use-user-location"
import userLocationStyles from "./user-location.module.css"
import controlsStyles from "./map-controls.module.css"
import { useIsMobile } from "@/hooks/use-is-mobile"

/**
 * Flies the map to the selected architecture. Rendered as a child of <ArchMap>
 * so it can use the useMap() context. Reads nolli stores directly.
 */
function MapFlyNavigator() {
  const selected = useArchDetailStore((s) => s.selected)
  const shouldFlyTo = useArchDetailStore((s) => s.shouldFlyTo)
  const { isBoard } = useLayout()
  const { map } = useMap()

  useEffect(() => {
    if (!map || !selected) return

    if (isBoard) {
      const timer = setTimeout(() => {
        flyToArchCinematic(
          map,
          selected.coordinates.lng,
          selected.coordinates.lat
        )
      }, TRANSITION_SHORT * 1000)
      return () => clearTimeout(timer)
    }

    if (shouldFlyTo) {
      flyToArchCinematic(map, selected.coordinates.lng, selected.coordinates.lat)
    }
  }, [map, selected, shouldFlyTo, isBoard])

  return null
}

/**
 * Thin wrapper around the shared <ArchMap>. Reads nolli stores and feeds them
 * as props; passes MapFlyNavigator as a child. Owns db-error navigation.
 */
export function MapCore() {
  const navigate = useNavigate()
  const filteredArchs = useFilterStore((s) => s.filteredArchs)
  const selected = useArchDetailStore((s) => s.selected)
  // Lift the selected architecture onto the map even when a filter has excluded it,
  // so picking a recommendation always leaves a pin to fly to. `Arch` is a
  // superset of `ArchSummary`, so it satisfies the marker shape directly.
  const architectures = useMemo(() => {
    if (!selected) return filteredArchs
    if (filteredArchs.some((a) => a.slug === selected.slug)) return filteredArchs
    return [...filteredArchs, selected]
  }, [filteredArchs, selected])
  const navigateArch = useArchNavigate()
  const { isMap } = useLayout()
  const loading = useDbStore((s) => s.loading)
  const error = useDbStore((s) => s.error)
  const userLocation = useUserLocation()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (error != null) {
      navigate("/error")
    }
  }, [error, navigate])

  return (
    <>
      <MapControlsOffset />
      <ArchMap
        architectures={architectures}
        selectedSlug={selected?.slug}
        onArchClick={(slug) => {
          navigateArch(slug, false, "replace")
        }}
        ready={!loading}
      >
        {isMap && (
          <MapControls
            showZoom
            showLocate
            showFullscreen
            className={
              isMobile ? controlsStyles.sheetAwareControls : undefined
            }
          />
        )}
        <MapFlyNavigator />
      {userLocation && (
        <MapMarker
          longitude={userLocation.longitude}
          latitude={userLocation.latitude}
          transition={{ duration: 0.8, ease: "easeOut" }}
          // GPS dot stacks above every architecture pin/cluster and never
          // captures pointer events, so the map stays fully interactive.
          style={{ zIndex: 999, pointerEvents: "none" }}
        >
          <MarkerContent className={userLocationStyles.locationMarker}>
            <span
              className={userLocationStyles.locationHalo}
              aria-hidden="true"
            />
            <span
              className={userLocationStyles.locationDot}
              role="img"
              aria-label="Your current location"
            />
          </MarkerContent>
        </MapMarker>
      )}
      </ArchMap>
    </>
  )
}

/**
 * Injects a <style> that floats the map controls just above the mobile bottom sheet. 
 */
function MapControlsOffset() {
  const sheetY = useSidebarStore((s) => s.sheetY)
  const isMobile = useIsMobile()
  if (!isMobile) return null

  const gap = "0.5rem"
  const controlsHeight = 144 // ~4 icon buttons; only consulted at the clamp
  return (
    <style>
      {`.${controlsStyles.sheetAwareControls}{
--map-controls-bottom:min(${sheetY}px + ${gap},100vh - var(--size-header-height) - ${controlsHeight}px);
}`}
    </style>
  )
}