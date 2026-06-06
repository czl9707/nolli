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
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useMapSelectStore } from "@/stores/map-select"
import { useSidebarStore } from "@/stores/sidebar"
import { useLayoutStore } from "@/stores/layout"
import { useDbStore } from "@/stores/db"
import { useFilterStore } from "@/stores/filter"
import { useMapPatterns } from "./use-map-patterns"
import { useMapClustering, type ClusterPoint } from "./use-map-clustering"
import { Box, Boxes } from "lucide-react"
import { TRANSITION_SHORT } from "@/lib/constants"
import { flyToArchCinematic, flyToArchIfNeeded } from "@/lib/map-flyto"
import styles from "./index.module.css"
import { Body2 } from "../ui/typography"

function IndividualMarker({
  point,
}: {
  point: Extract<ClusterPoint, { type: "point" }>
}) {
  const selected = useMapSelectStore((s) => s.selected)
  const selectOnMap = useMapSelectStore((s) => s.select)
  const deselectOnMap = useMapSelectStore((s) => s.deselect)
  const selectArch = useArchDetailStore((s) => s.select)
  const deselectArch = useArchDetailStore((s) => s.deselect)
  const setOpen = useSidebarStore((s) => s.setOpen)
  const dataSource = useDbStore((s) => s.dataSource)
  const filteredArchs = useFilterStore((s) => s.filteredArchs)

  return (
    <MapMarker longitude={point.coordinates[0]} latitude={point.coordinates[1]}>
      <MarkerContent>
        <Box
          data-selected={selected?.slug === point.slug}
          className={styles.individualMarker}
          onClick={() => {
            if (selected?.slug === point.slug) {
              deselectOnMap()
              deselectArch()
            } else if (dataSource) {
              const summary = filteredArchs.find((a) => a.slug === point.slug)
              if (summary) selectOnMap(summary)
              selectArch(point.slug, dataSource).then((arch) => {
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
  const architectures = useFilterStore((s) => s.filteredArchs)
  const { clusters, getExpansionZoom } = useMapClustering(map, architectures)

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
              flyToArchCinematic(map, point.coordinates[0], point.coordinates[1], zoom)
            }}
          />
        )
      )}
    </>
  )
}

function MapSelectNavigator() {
  const selected = useMapSelectStore((s) => s.selected)
  const { map } = useMap()

  useEffect(() => {
    if (!map || !selected) return
    flyToArchIfNeeded(
      map,
      selected.coordinates.lng,
      selected.coordinates.lat,
    )
  }, [map, selected])

  return null
}

function MapNavigator() {
  const selectedArch = useArchDetailStore((s) => s.selected)
  const mode = useLayoutStore((s) => s.mode)
  const { map } = useMap()

  useEffect(() => {
    if (!map || !selectedArch || mode !== "board") return

    const timer = setTimeout(() => {
      flyToArchCinematic(
        map,
        selectedArch.coordinates.lng,
        selectedArch.coordinates.lat,
      )
    }, TRANSITION_SHORT * 1000)

    return () => clearTimeout(timer)
  }, [map, selectedArch, mode])

  return null
}

export function MapCore() {
  const mapRef = useRef<MapRef | null>(null)
  const navigate = useNavigate()
  const { ready, initialize } = useMapPatterns(mapRef)
  const mode = useLayoutStore((s) => s.mode)
  const loading = useDbStore((s) => s.loading)
  const error = useDbStore((s) => s.error)

  const mapStyles = useMemo(
    () => ({
      light: getMapStyle("light"),
      dark: getMapStyle("dark"),
    }),
    [],
  )

  const handleRef = useCallback(
    (ref: MapRef | null) => {
      if (!ref) return
      mapRef.current = ref
      initialize(ref)
    },
    [initialize],
  )

  useEffect(() => {
    if (error) {
      navigate("/error")
    }
  }, [error, navigate])

  const isHome = mode === "home"
  const isLoading = !ready || loading
  console.log("MapCore render", { ready, loading, error })
  return (
    <div className={styles.container}>
      <Map ref={handleRef} styles={mapStyles} loading={isLoading}>
        {isHome && <MapControls showZoom showLocate showFullscreen />}
        <ArchMarkers />
        <MapSelectNavigator />
        <MapNavigator />
      </Map>
    </div>
  )
}
