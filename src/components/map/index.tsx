import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from "@/components/ui/map"
import { getMapStyle } from "@/lib/map-style"
import type { MapRef } from "@/components/ui/map"
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react"
import { useNavigate } from "react-router"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useSidebarStore } from "@/stores/sidebar"
import { useLayoutStore } from "@/stores/layout"
import { useDbStore } from "@/stores/db"
import { useFilterStore } from "@/stores/filter"
import { useMapPatterns } from "./use-map-patterns"
import {
  useMapClustering,
  type ClusterPoint,
  type MarkerTransitions,
} from "./use-map-clustering"
import { MapPin } from "lucide-react"
import {
  TRANSITION_SHORT,
  CLUSTER_SPREAD_DURATION,
  CLUSTER_SPREAD_EASE,
  CLUSTER_SPREAD_MAX_DELAY,
} from "@/lib/constants"
import { flyToArchCinematic } from "@/lib/map-flyto"
import { AnimatePresence, motion, usePresence } from "framer-motion"
import styles from "./index.module.css"
import { Caption } from "../ui/typography"

type LngLat = [number, number]

/**
 * A single architecture pin. Owns its enter/exit animation:
 *  - On mount, reads its enter origin (`from`) from the shared transitions ref
 *    and slides from the cluster centroid to its own coord.
 *  - On exit (AnimatePresence removed it), reads its exit target (`to`), slides
 *    into the cluster centroid, fades, and calls `safeToRemove` when it lands —
 *    so the hook never needs to track exit timing.
 * Memoized so a parent list re-render doesn't re-render stable pins.
 */
const IndividualMarker = memo(
  function IndividualMarker({
    point,
    transitions,
  }: {
    point: Extract<ClusterPoint, { type: "point" }>
    transitions: MutableRefObject<MarkerTransitions>
  }) {
    const selectArch = useArchDetailStore((s) => s.select)
    const deselectArch = useArchDetailStore((s) => s.deselect)
    const selectedArch = useArchDetailStore((s) => s.selected)
    const setOpen = useSidebarStore((s) => s.setOpen)

    const [isPresent, safeToRemove] = usePresence()

    // Enter-slide origin, read once on mount. Read-only (no delete) so it's safe
    // under StrictMode double-invocation of the initializer.
    const [from] = useState<LngLat | undefined>(
      () => transitions.current[point.slug]?.from,
    )
    const [entered, setEntered] = useState(false)
    const [exitTo, setExitTo] = useState<LngLat | undefined>(undefined)

    // Stable per-mount random delay — the organic "same speed, different start" burst.
    const delay = useMemo(() => Math.random() * CLUSTER_SPREAD_MAX_DELAY, [])

    // After mount, flip to the own coordinate so MapMarker eases from -> own.
    useEffect(() => {
      setEntered(true)
    }, [])

    // On exit, slide to the collapse target (if any) and unmount once it lands.
    useEffect(() => {
      if (isPresent) return
      const entry = transitions.current[point.slug]
      const to = entry?.to
      if (to) {
        delete entry.to
        setExitTo(to)
      }
      const id = setTimeout(safeToRemove, (CLUSTER_SPREAD_DURATION + delay) * 1000 + 60)
      return () => clearTimeout(id)
    }, [isPresent, safeToRemove, point.slug, delay, transitions])

    const coords: LngLat = !isPresent && exitTo
      ? exitTo
      : !entered && from
        ? from
        : point.coordinates

    return (
      <MapMarker
        longitude={coords[0]}
        latitude={coords[1]}
        transition={{
          duration: CLUSTER_SPREAD_DURATION,
          ease: CLUSTER_SPREAD_EASE,
          delay,
        }}
      >
        <MarkerContent>
          <motion.div
            className={styles.marker}
            data-selected={selectedArch?.slug === point.slug}
            initial={{ opacity: from ? 0 : 1 }}
            animate={{ opacity: isPresent ? 1 : 0 }}
            transition={{
              duration: CLUSTER_SPREAD_DURATION,
              ease: "easeOut",
              delay,
            }}
            onClick={() => {
              if (selectedArch?.slug === point.slug) {
                deselectArch()
              } else {
                selectArch(point.slug, false).then((arch) => {
                  if (arch) setOpen(true)
                })
              }
            }}
          >
            <div className={styles.pins}>
              <MapPin
                data-selected={selectedArch?.slug === point.slug}
                className={styles.pin}
              />
            </div>
            <Caption className={styles.label}>{point.name}</Caption>
          </motion.div>
        </MarkerContent>
      </MapMarker>
    )
  },
  (prev, next) =>
    prev.point.slug === next.point.slug &&
    prev.point.coordinates[0] === next.point.coordinates[0] &&
    prev.point.coordinates[1] === next.point.coordinates[1] &&
    prev.transitions === next.transitions,
)

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
        <motion.div
          className={styles.marker}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: CLUSTER_SPREAD_DURATION, ease: "easeOut" }}
          onClick={onExpand}
        >
          <div className={styles.pins}>
            <MapPin className={styles.pin} />
            <MapPin className={styles.pin} />
            <MapPin className={styles.pin} />
          </div>
          <Caption className={styles.label}>{point.count} Architecture</Caption>
        </motion.div>
      </MarkerContent>
    </MapMarker>
  )
}

function ArchMarkers() {
  const { map } = useMap()
  const architectures = useFilterStore((s) => s.filteredArchs)
  const { clusters, getExpansionZoom, transitions } = useMapClustering(
    map,
    architectures,
  )

  return (
    <AnimatePresence>
      {clusters.map((point) =>
        point.type === "point" ? (
          <IndividualMarker
            key={point.slug}
            point={point}
            transitions={transitions}
          />
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
        ),
      )}
    </AnimatePresence>
  )
}

function MapFlyNavigator() {
  const selected = useArchDetailStore((s) => s.selected)
  const shouldFlyTo = useArchDetailStore((s) => s.shouldFlyTo)
  const mode = useLayoutStore((s) => s.mode)
  const { map } = useMap()

  useEffect(() => {
    if (!map || !selected) return

    if (mode === "board") {
      const timer = setTimeout(() => {
        flyToArchCinematic(
          map,
          selected.coordinates.lng,
          selected.coordinates.lat,
        )
      }, TRANSITION_SHORT * 1000)
      return () => clearTimeout(timer)
    }

    if (shouldFlyTo) {
      flyToArchCinematic(
        map,
        selected.coordinates.lng,
        selected.coordinates.lat,
      )
    }
  }, [map, selected, shouldFlyTo, mode])

  return null
}

export function MapCore() {
  const mapRef = useRef<MapRef | null>(null)
  const navigate = useNavigate()
  const { ready: patternReady, initialize } = useMapPatterns(mapRef)
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
    if (error != null) {
      navigate("/error")
    }
  }, [error, navigate])

  const isHome = mode === "home"
  const isLoading = !patternReady || loading || (!!error);
  return (
    <div className={styles.container}>
      <Map ref={handleRef} styles={mapStyles} loading={isLoading}>
        {isHome && <MapControls showZoom showLocate showFullscreen/>}
        <ArchMarkers />
        <MapFlyNavigator />
      </Map>
    </div>
  )
}
