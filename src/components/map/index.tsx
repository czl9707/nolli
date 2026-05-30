import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  useMap,
} from "@/components/ui/map"
import { getMapStyle } from "@/lib/map-style"
import type { MapRef } from "@/components/ui/map"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { useSelectedArch } from "@/contexts/selected-arch"
import { useSidebar } from "@/contexts/sidebar"
import { Sidebar } from "@/components/sidebar/sidebar"
import {
  getAllArchitectures,
  getArchBySlug,
  type ArchSummary,
} from "@/lib/data/architectures"
import { useMapPatterns } from "./use-map-patterns"
import { useMapClustering, type ClusterPoint } from "@/lib/use-map-clustering"
import { Box, Boxes } from "lucide-react"
import { useLayout } from "@/hooks/use-layout"
import { TRANSITION_SHORT, TRANSITION_LONG } from "@/lib/animation"
import styles from "./index.module.css"

function IndividualMarker({
  point,
}: {
  point: Extract<ClusterPoint, { type: "point" }>
}) {
  const { setLastSelectedArch, lastSelectedArch } = useSelectedArch()
  const { setSidebarOpen } = useSidebar()

  return (
    <MapMarker longitude={point.coordinates[0]} latitude={point.coordinates[1]}>
      <MarkerContent>
        <Box
          data-selected={lastSelectedArch?.slug === point.slug}
          className={styles.individualMarker}
          onClick={() => {
            if (lastSelectedArch?.slug === point.slug) {
              setLastSelectedArch(null)
            } else {
              getArchBySlug(point.slug).then((arch) => {
                setLastSelectedArch(arch)
                setSidebarOpen(true)
              })
            }
          }}
        />
      </MarkerContent>
      <MarkerTooltip>{point.name}</MarkerTooltip>
    </MapMarker>
  )
}

function ClusterMarkerComp({
  point,
  onExpand,
}: {
  point: Extract<ClusterPoint, { type: "cluster" }>
  onExpand: () => void
}) {
  return (
    <MapMarker longitude={point.coordinates[0]} latitude={point.coordinates[1]}>
      <MarkerContent>
        <Boxes className={styles.clusterMarker} onClick={onExpand} />
      </MarkerContent>
      <MarkerTooltip>{point.count} architecture</MarkerTooltip>
    </MapMarker>
  )
}

function ArchMarkers() {
  const { map } = useMap()
  const [architectures, setArchitectures] = useState<ArchSummary[]>([])
  const { clusters, getExpansionZoom } = useMapClustering(architectures)

  useEffect(() => {
    getAllArchitectures().then(setArchitectures)
  }, [])

  return (
    <>
      {clusters.map((point) =>
        point.type === "point" ? (
          <IndividualMarker key={point.slug} point={point} />
        ) : (
          <ClusterMarkerComp
            key={`cluster-${point.id}`}
            point={point}
            onExpand={() => {
              if (!map) return
              const zoom = getExpansionZoom(point.id, point.coordinates)
              map.flyTo({ center: point.coordinates, zoom })
            }}
          />
        )
      )}
    </>
  )
}

function MapNavigator() {
  const { lastSelectedArch, flyToTrigger } = useSelectedArch()
  const { map } = useMap()
  const location = useLocation()
  const prevSlugRef = useRef<string | null>(null)
  const prevLocationRef = useRef<string | null>(null)

  useEffect(() => {
    if (!lastSelectedArch || !map) return

    const isSameLocation =
      prevSlugRef.current === lastSelectedArch.slug &&
      prevLocationRef.current === location.pathname

    prevSlugRef.current = lastSelectedArch.slug
    prevLocationRef.current = location.pathname

    setTimeout(
      () =>
        map.flyTo({
          center: [
            lastSelectedArch.coordinates.lng,
            lastSelectedArch.coordinates.lat,
          ],
          zoom: 16,
          duration: TRANSITION_LONG * 1000,
        }),
      isSameLocation ? 0 : TRANSITION_SHORT * 1000
    )
  }, [lastSelectedArch, map, flyToTrigger, location.pathname])

  return null
}

export function MapCore() {
  const mapRef = useRef<MapRef | null>(null)
  const navigate = useNavigate()
  const { ready, initialize } = useMapPatterns(mapRef)
  const mode = useLayout()

  const mapStyles = useMemo(
    () => ({
      light: getMapStyle("light"),
      dark: getMapStyle("dark"),
    }),
    []
  )

  const handleRef = useCallback(
    (map: MapRef | null) => {
      if (!map) return
      mapRef.current = map
      initialize(map)
    },
    [navigate, initialize]
  )

  const isHome = mode === "home"

  return (
    <div className={styles.container}>
      {isHome && <Sidebar />}
      <div className={styles.mapWrapper}>
        <Map ref={handleRef} styles={mapStyles} loading={!ready}>
          {isHome && <MapControls showZoom showLocate showFullscreen />}
          <ArchMarkers />
          <MapNavigator />
        </Map>
      </div>
    </div>
  )
}
