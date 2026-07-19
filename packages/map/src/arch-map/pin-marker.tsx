import { motion, type Easing, type TargetAndTransition } from "framer-motion"
import { MapPin } from "lucide-react"
import { MapMarker, MarkerContent } from "../map-core/map"
import { Caption } from "@nolli/ui"
import styles from "./arch-map.module.css"

type ArchPinTransition = {
  duration?: number
  ease?: Easing
  delay?: number
}

type ArchPinMarkerProps = {
  longitude: number
  latitude: number
  label?: string
  selected?: boolean
  /** Applied to both the MapMarker position ease and the content fade. */
  transition?: ArchPinTransition
  onClick?: () => void
  /** Clustering enter/exit fade; omitted for static markers like the picker. */
  initial?: TargetAndTransition
  animate?: TargetAndTransition | boolean
  /** Merged onto the marker's root alongside the base `.marker` class. */
  className?: string
}

export function ArchPinMarker({
  longitude,
  latitude,
  label,
  selected,
  transition,
  onClick,
  initial,
  animate,
  className,
}: ArchPinMarkerProps) {
  const selectedAttr = selected ? "true" : undefined
  return (
    <MapMarker longitude={longitude} latitude={latitude} transition={transition}>
      <MarkerContent>
        <motion.div
          className={className ? `${styles.marker} ${className}` : styles.marker}
          data-selected={selectedAttr}
          initial={initial}
          animate={animate}
          transition={transition}
          onClick={onClick}
        >
          <div className={styles.pins}>
            <MapPin className={styles.pin} data-selected={selectedAttr} />
          </div>
          {label != null && <Caption className={styles.label}>{label}</Caption>}
        </motion.div>
      </MarkerContent>
    </MapMarker>
  )
}
