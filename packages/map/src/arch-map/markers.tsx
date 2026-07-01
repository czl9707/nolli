import {
  memo,
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from "react"
import { AnimatePresence, motion, usePresence } from "framer-motion"
import { MapPin } from "lucide-react"
import { MapMarker, MarkerContent } from "../map-core/map"
import { useMap } from "../map-core/map-context"
import { flyToArchCinematic } from "../map-flyto"
import {
  useMapClustering,
  type ClusterPoint,
  type MarkerTransitions,
} from "../map-core/use-map-clustering"
import { Caption, TRANSITION_SHORT } from "@nolli/ui"
import type { ArchSummary } from "@nolli/data"
import styles from "./arch-map.module.css"

const CLUSTER_SPREAD_EASE: [number, number, number, number] = [
  0.22, 1, 0.36, 1,
]

type LngLat = [number, number]

/**
 * Owns a marker's enter/exit animation, shared by individual pins and clusters.
 * Reads its enter origin (`from`) on mount and slides from there to `ownCoords`;
 * on AnimatePresence exit, reads its exit target (`to`), slides there, fades, and
 * calls `safeToRemove` when it lands. `key` matches the marker's React key
 * (slug, or `cluster-${id}`) into `transitions`.
 */
function useMarkerPresence(
  key: string,
  ownCoords: LngLat,
  transitions: RefObject<MarkerTransitions>
) {
  const [isPresent, safeToRemove] = usePresence()

  const [from] = useState<LngLat | undefined>(
    () => transitions.current[key]?.from
  )
  const [entered, setEntered] = useState(false)
  const [exitTo, setExitTo] = useState<LngLat | undefined>(undefined)

  const delay = useMemo(() => Math.random() * 0.15, [])

  useEffect(() => {
    setEntered(true)
  }, [])

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
      (TRANSITION_SHORT + delay) * 1000 + 60
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
    selectedSlug,
    onArchClick,
  }: {
    point: Extract<ClusterPoint, { type: "point" }>
    transitions: RefObject<MarkerTransitions>
    selectedSlug?: string
    onArchClick?: (slug: string) => void
  }) {
    const { isPresent, from, coords, delay } = useMarkerPresence(
      point.slug,
      point.coordinates,
      transitions
    )
    const isSelected = selectedSlug === point.slug

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
            data-selected={isSelected}
            initial={{ opacity: from ? 0 : 1 }}
            animate={{ opacity: isPresent ? 1 : 0 }}
            transition={{
              duration: TRANSITION_SHORT,
              ease: CLUSTER_SPREAD_EASE,
              delay,
            }}
            onClick={() => onArchClick?.(point.slug)}
          >
            <div className={styles.pins}>
              <MapPin
                data-selected={isSelected}
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
    prev.transitions === next.transitions &&
    prev.selectedSlug === next.selectedSlug
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
      transitions
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
    prev.transitions === next.transitions
)

function ArchMarkers({
  architectures,
  selectedSlug,
  onArchClick,
}: {
  architectures: ArchSummary[]
  selectedSlug?: string
  onArchClick?: (slug: string) => void
}) {
  const { map } = useMap()
  const { clusters, getExpansionZoom, transitions } = useMapClustering(
    map,
    architectures
  )

  return (
    <AnimatePresence presenceAffectsLayout={false}>
      {clusters.map((point) =>
        point.type === "point" ? (
          <IndividualMarker
            key={point.slug}
            point={point}
            transitions={transitions}
            selectedSlug={selectedSlug}
            onArchClick={onArchClick}
          />
        ) : (
          <ClusterMarkerComp
            key={`cluster-${point.id}`}
            point={point}
            transitions={transitions}
            onExpand={() => {
              if (!map) return
              const zoom = getExpansionZoom(point.id, point.coordinates)
              flyToArchCinematic(
                map,
                point.coordinates[0],
                point.coordinates[1],
                zoom
              )
            }}
          />
        )
      )}
    </AnimatePresence>
  )
}

export { ArchMarkers }
