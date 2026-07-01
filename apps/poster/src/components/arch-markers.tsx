import { MapMarker, MarkerContent, useMap, useMapClustering } from "@nolli/map"
import { flyToArchCinematic } from "@nolli/map"
import { MapPin } from "lucide-react"
import type { PosterBuilding } from "@/types"
import { useUiStore } from "@/stores/ui"
import styles from "./arch-markers.module.css"

export function ArchMarkers({ buildings }: { buildings: PosterBuilding[] }) {
  const { map } = useMap()
  const { clusters, getExpansionZoom } = useMapClustering(map, buildings)
  const captureMode = useUiStore((s) => s.captureMode)

  // Capture mode hides the entire scaffolding layer.
  if (captureMode) return null

  return (
    <>
      {clusters.map((point) =>
        point.type === "point" ? (
          <MapMarker
            key={point.slug}
            longitude={point.coordinates[0]}
            latitude={point.coordinates[1]}
          >
            <MarkerContent>
              <div className={styles.marker}>
                <MapPin className={styles.pin} />
                <span className={styles.label}>{point.name}</span>
              </div>
            </MarkerContent>
          </MapMarker>
        ) : (
          <MapMarker
            key={`cluster-${point.id}`}
            longitude={point.coordinates[0]}
            latitude={point.coordinates[1]}
          >
            <MarkerContent>
              <div
                className={styles.marker}
                onClick={() => {
                  if (!map) return
                  const zoom = getExpansionZoom(point.id, point.coordinates)
                  flyToArchCinematic(
                    map,
                    point.coordinates[0],
                    point.coordinates[1],
                    zoom
                  )
                }}
              >
                <MapPin className={styles.pin} />
                <MapPin className={styles.pin} />
                <span className={styles.label}>{point.count} Architecture</span>
              </div>
            </MarkerContent>
          </MapMarker>
        )
      )}
    </>
  )
}
