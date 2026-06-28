import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from "./map"
import { getMapStyle } from "@/lib/map-style"
import type { MapRef } from "./map"
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react"
import { useNavigate } from "react-router"
import { useArchDetailStore } from "@/stores/arch-detail"
import { useSidebarStore } from "@/stores/sidebar"
import { useLayout } from "@/hooks/use-layout"
import { useArchNavigate } from "@/hooks/use-arch-navigate"
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
} from "@/lib/constants"
import { flyToArchCinematic } from "@/lib/map-flyto"
import { AnimatePresence, motion, usePresence } from "framer-motion"
import styles from "./index.module.css"
import { Caption } from "@/components/ui/typography"

const CLUSTER_SPREAD_EASE: [number, number, number, number] = [
  0.22, 1, 0.36, 1,
]

type LngLat = [number, number]

/**
 * Owns a marker's enter/exit animation, shared by individual pins and clusters.
 * Reads its enter origin (`from`) on mount and slides from there to `ownCoords`;
 * on AnimatePresence exit, reads its exit target (`to`), slides there, fades, and
 * calls `safeToRemove` when it lands — so the hook never tracks exit timing.
 * `key` matches the marker's React key (slug, or `cluster-${id}`) into `transitions`.
 */
function useMarkerPresence(
  key: string,
  ownCoords: LngLat,
  transitions: RefObject<MarkerTransitions>,
) {
  const [isPresent, safeToRemove] = usePresence()

  // Enter-slide origin, read once on mount. Read-only (no delete) so it's safe
  // under StrictMode double-invocation of the initializer.
  const [from] = useState<LngLat | undefined>(
    () => transitions.current[key]?.from,
  )
  const [entered, setEntered] = useState(false)
  const [exitTo, setExitTo] = useState<LngLat | undefined>(undefined)

  // Stable per-mount random delay — the organic "same speed, different start" burst.
  const delay = useMemo(() => Math.random() * 0.15, [])

  // After mount, flip to the own coordinate so MapMarker eases from -> own.
  useEffect(() => {
    setEntered(true)
  }, [])

  // On exit, slide to the target (if any) and unmount once it lands.
  useEffect(() => {
    if (isPresent) return
    const entry = transitions.current[key]
    const to = entry?.to
    if (to) {
      delete entry.to
      setExitTo(to)
    }
    const id = setTimeout(
      safeToRemove,
      (TRANSITION_SHORT + delay) * 1000 + 60,
    )
    return () => clearTimeout(id)
  }, [isPresent, safeToRemove, key, delay, transitions])

  const coords: LngLat = !isPresent && exitTo
    ? exitTo
    : !entered && from
      ? from
      : ownCoords

  return { isPresent, from, coords, delay }
}

const IndividualMarker = memo(
  function IndividualMarker({
    point,
    transitions,
  }: {
    point: Extract<ClusterPoint, { type: "point" }>
    transitions: RefObject<MarkerTransitions>
  }) {
    const selectedArch = useArchDetailStore((s) => s.selected)
    const setOpen = useSidebarStore((s) => s.setOpen)
    const navigateArch = useArchNavigate()

    const { isPresent, from, coords, delay } = useMarkerPresence(
      point.slug,
      point.coordinates,
      transitions,
    )

    return (
      <MapMarker
        longitude={coords[0]}
        latitude={coords[1]}
        transition={{
          duration: TRANSITION_SHORT,
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
              duration: TRANSITION_SHORT,
              ease: CLUSTER_SPREAD_EASE,
              delay,
            }}
            onClick={() => {
              setOpen(true)
              navigateArch(point.slug, false, "replace")
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

const ClusterMarkerComp = memo(
  function ClusterMarkerComp({
    point,
    onExpand,
    transitions,
  }: {
    point: Extract<ClusterPoint, { type: "cluster" }>
    onExpand: () => void
    transitions: RefObject<MarkerTransitions>
  }) {
    const { isPresent, from, coords, delay } = useMarkerPresence(
      `cluster-${point.id}`,
      point.coordinates,
      transitions,
    )

    return (
      <MapMarker
        longitude={coords[0]}
        latitude={coords[1]}
        transition={{
          duration: TRANSITION_SHORT,
          ease: "easeOut",
          delay,
        }}
      >
        <MarkerContent>
          <motion.div
            className={styles.marker}
            initial={{ opacity: from ? 0 : 1 }}
            animate={{ opacity: isPresent ? 1 : 0 }}
            transition={{
              duration: TRANSITION_SHORT,
              ease: "easeOut",
              delay,
            }}
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
  },
  (prev, next) =>
    prev.point.id === next.point.id &&
    prev.point.coordinates[0] === next.point.coordinates[0] &&
    prev.point.coordinates[1] === next.point.coordinates[1] &&
    prev.transitions === next.transitions,
)

function ArchMarkers() {
  const { map } = useMap()
  const architectures = useFilterStore((s) => s.filteredArchs)
  const { clusters, getExpansionZoom, transitions } = useMapClustering(
    map,
    architectures,
  )

  return (
    // presenceAffectsLayout defaults to true, which makes AnimatePresence re-render
    // every child (new presence-context identity) on any add/remove — blinking stable
    // pins. We use no layout animations, so opt out.
    <AnimatePresence presenceAffectsLayout={false}>
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
            transitions={transitions}
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
  const { isBoard } = useLayout()
  const { map } = useMap()

  useEffect(() => {
    if (!map || !selected) return

    if (isBoard) {
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
  }, [map, selected, shouldFlyTo, isBoard])

  return null
}

export function MapCore() {
  const mapRef = useRef<MapRef | null>(null)
  const navigate = useNavigate()
  const { ready: patternReady, initialize } = useMapPatterns(mapRef)
  const { isMap } = useLayout()
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

  const isHome = isMap
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
