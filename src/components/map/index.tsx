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
import { useArchStore } from "@/stores/arch"
import { useSidebarStore } from "@/stores/sidebar"
import { useLayoutStore } from "@/stores/layout"
import { useDbContext } from "@/lib/data/db-context"
import type { ArchSummary } from "@/lib/data/architectures"
import { useMapPatterns } from "./use-map-patterns"
import { useMapClustering, type ClusterPoint } from "./use-map-clustering"
import { Box, Boxes } from "lucide-react"
import { TRANSITION_SHORT, TRANSITION_LONG } from "@/lib/animation"
import styles from "./index.module.css"
import { Body2 } from "../ui/typography"

function IndividualMarker({
  point,
}: {
  point: Extract<ClusterPoint, { type: "point" }>
}) {
  const lastSelectedArch = useArchStore((s) => s.lastSelectedArch)
  const selectArch = useArchStore((s) => s.selectArch)
  const deselectArch = useArchStore((s) => s.deselectArch)
  const setOpen = useSidebarStore((s) => s.setOpen)

  return (
    <MapMarker longitude={point.coordinates[0]} latitude={point.coordinates[1]}>
      <MarkerContent>
        <Box
          data-selected={lastSelectedArch?.slug === point.slug}
          className={styles.individualMarker}
          onClick={() => {
            if (lastSelectedArch?.slug === point.slug) {
              deselectArch()
            } else {
              selectArch(point.slug).then((arch) => {
                if (arch) setOpen(true)
              })
            }
          }}
        />
      </MarkerContent>
      <MarkerTooltip>
        <Body2>{point.name}</Body2>
      </MarkerTooltip>
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
      <MarkerTooltip>
        <Body2>{point.count} Architecture</Body2>
      </MarkerTooltip>
    </MapMarker>
  )
}

function ArchMarkers() {
  const { map } = useMap()
  const { dataSource } = useDbContext()
  const [architectures, setArchitectures] = useState<ArchSummary[]>([])
  const { clusters, getExpansionZoom } = useMapClustering(map, architectures)

  useEffect(() => {
    dataSource?.getAllArchitectures().then(setArchitectures)
  }, [dataSource])

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
  const lastSelectedArch = useArchStore((s) => s.lastSelectedArch)
  const flyToTrigger = useArchStore((s) => s.flyToTrigger)
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
  const mode = useLayoutStore((s) => s.mode)

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
      <Map ref={handleRef} styles={mapStyles} loading={!ready}>
        {isHome && <MapControls showZoom showLocate showFullscreen />}
        <ArchMarkers />
        <MapNavigator />
      </Map>
    </div>
  )
}
