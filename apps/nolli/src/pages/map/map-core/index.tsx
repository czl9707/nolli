import { useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router"
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
 * Under `?capture=1`, exposes the live MapLibre instance on `window.__nolliMap`
 * so the motion capture scripts can drive the camera (`easeTo`/`panBy`) and poll
 * tile-readiness (`areTilesLoaded`/`isMoving`) directly — the synthetic-mouse
 * approach can't await tile loads, which left the map's fill-pattern looking
 * coarse after a zoom. No-op outside capture.
 */
function MapCaptureBridge() {
  const { map } = useMap()
  useEffect(() => {
    if (!map) return
    const w = window as unknown as { __nolliMap?: unknown }
    w.__nolliMap = map
    return () => {
      delete w.__nolliMap
    }
  }, [map])
  return null
}

/**
 * Under `?capture=1`, exposes the same nav the sidebar suggestion cards use
 * (select + `/arch/:slug` push → MapFlyNavigator flies), so the motion capture
 * can drive a real arch→arch transition deterministically — identical sidebar
 * (selection panel) update and camera flight a user gets clicking an "Also by"
 * card. Unlike the shared navigateArch, this PRESERVES the current ?search
 * (notably ?capture=1): navigateArch drops it, which would flip `capture` false,
 * unmount MapCaptureBridge, and lose window.__nolliMap mid-journey (breaking the
 * #2 map pan after the hop). No-op outside capture.
 */
function ArchNavCaptureBridge() {
  const select = useArchDetailStore((s) => s.select)
  const navigate = useNavigate()
  useEffect(() => {
    const w = window as unknown as {
      __nolliNavigateArch?: (slug: string, shouldFlyTo?: boolean) => void
    }
    w.__nolliNavigateArch = (slug, shouldFlyTo = true) => {
      const search = window.location.search
      void select(slug, shouldFlyTo).then((loaded) => {
        if (loaded) navigate(`/arch/${slug}${search}`)
      })
    }
    return () => {
      delete w.__nolliNavigateArch
    }
  }, [select, navigate])
  return null
}

/**
 * Thin wrapper around the shared <ArchMap>. Reads nolli stores and feeds them
 * as props; passes MapFlyNavigator as a child. Owns db-error navigation.
 */
export function MapCore() {
  const navigate = useNavigate()
  // Opt-in WebGL readback for screenshot/video capture (?capture=1). Sets
  // preserveDrawingBuffer so the map canvas isn't blank when screenshotted.
  const [searchParams] = useSearchParams()
  const capture = searchParams.get("capture") === "1"
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
        capture={capture}
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
        {capture && <MapCaptureBridge />}
        {capture && <ArchNavCaptureBridge />}
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