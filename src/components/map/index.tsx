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
import { getAllArchitectures, getArchBySlug, type ArchSummary, type Arch } from "@/lib/data/architectures"
import { useMapPatterns } from "./use-map-patterns"
import { useMapClustering, type ClusterPoint } from "@/lib/use-map-clustering"
import { ArrowRight, X, Box, Boxes } from "lucide-react"
import { useLayout } from "@/hooks/use-layout"
import { H4, Body1 } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { TRANSITION_SHORT, TRANSITION_LONG } from "@/lib/animation"
import styles from "./index.module.css"

function MapDrawer({
  arch,
  onView,
  onClose,
}: {
  arch: Arch
  onView: () => void
  onClose: () => void
}) {
  const cover = arch.coverImage

  return (
    <motion.div
      className={styles.drawerWrapper}
      initial={{ width: 0, paddingRight: 0 }}
      animate={{ width: 360, paddingRight: "var(--spacing-paragraph)"}}
      exit={{ width: 0, paddingRight: 0}}
      transition={{ duration: TRANSITION_SHORT, ease: "easeInOut" }}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        className={styles.drawerContent}
        initial={{ opacity: 0 }}
        // TRANSITION_SHORT delay works better, because this is countering map zooming.
        animate={{ opacity: 1, transition: { duration: TRANSITION_SHORT, delay: TRANSITION_SHORT }}} 
        exit={{ opacity: 0, transition: { duration: TRANSITION_SHORT }}}
      >
        <div className={styles.coverWrapper}>
          <Button className={styles.closeButton}
            variant="secondary" size="icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
          <img className={styles.cover} src={cover ?? ""} alt={arch.name} />
        </div>
        <div className={styles.card} onClick={onView}>
          <H4 className={styles.heading}>{arch.name}</H4>
          <Body1 className={styles.detail}>
            <span style={{opacity: .5}}>By </span>
            {arch.architect}
            <span style={{opacity: .5}}> in </span>
            {arch.year}
          </Body1>
          <Button variant="link" className={styles.viewLink}>
            Pin Up ! <ArrowRight size={16} />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function IndividualMarker({
  point,
}: {
  point: Extract<ClusterPoint, { type: "point" }>
}) {
  const { setLastSelectedArch, lastSelectedArch } = useSelectedArch()

  return (
    <MapMarker longitude={point.coordinates[0]} latitude={point.coordinates[1]}>
      <MarkerContent>
        <Box
          data-selected={lastSelectedArch?.slug === point.slug}
          className={styles.individualMarker}
          onClick={() => getArchBySlug(point.slug).then(setLastSelectedArch)}
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
      <MarkerTooltip>
        {point.count} architecture
      </MarkerTooltip>
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
        ),
      )}
    </>
  )
}

function MapNavigator() {
  const { lastSelectedArch, flyToTrigger } = useSelectedArch()
  const { map } = useMap()
  const location = useLocation();
  const prevSlugRef = useRef<string | null>(null)
  const prevLocationRef = useRef<string | null>(null)

  useEffect(() => {
    if (!lastSelectedArch || !map) return

    const isSameLocation = 
      prevSlugRef.current === lastSelectedArch.slug && prevLocationRef.current === location.pathname;

    prevSlugRef.current = lastSelectedArch.slug;
    prevLocationRef.current = location.pathname;

    setTimeout(() => map.flyTo({
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
  const { lastSelectedArch, setLastSelectedArch } = useSelectedArch()

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
  const drawerOpen = isHome && lastSelectedArch !== null

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {drawerOpen && lastSelectedArch && (
          <MapDrawer
            key="drawer"
            arch={lastSelectedArch}
            onView={() => navigate(`/arch/${lastSelectedArch.slug}`)}
            onClose={() => setLastSelectedArch(null)}
          />
        )}
      </AnimatePresence>
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
