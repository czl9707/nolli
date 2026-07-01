import { MapMarker, MarkerContent } from "@nolli/map"
import type { PosterBuilding } from "@/types"
import styles from "./photo-marker.module.css"

export function PhotoMarker({ building }: { building: PosterBuilding }) {
  const { lng, lat } = building.coordinates
  return (
    <MapMarker longitude={lng} latitude={lat}>
      <MarkerContent>
        <div className={styles.wrap}>
          <img
            className={styles.photo}
            src={building.cover.image}
            alt={building.name}
            style={{ aspectRatio: `${building.cover.width} / ${building.cover.height}` }}
          />
          <img className={styles.pin} src="/images/pin.png" alt="" />
        </div>
      </MarkerContent>
    </MapMarker>
  )
}
