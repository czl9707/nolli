import { useMemo } from "react"
import { MapMarker, MarkerContent } from "@nolli/map"
import type { PosterBuilding } from "@/types"
import { hashId, jitter } from "./paper-clip"
import styles from "./photo-marker.module.css"
import { Body1, Body2 } from "@nolli/ui"

// Cap the cover image so oversized photos don't dominate the poster — both
// dimensions are bounded, fitting the intrinsic aspect ratio inside the box.
const MAX_PHOTO_W = 160
const MAX_PHOTO_H = 175

export function PhotoMarker({ building }: { building: PosterBuilding }) {
  const { lng, lat } = building.coordinates

  const { rotate, width, height } = useMemo(() => {
    const s = hashId(building.slug)
    const ratio = building.cover.width / building.cover.height
    let w = MAX_PHOTO_W
    let h = Math.round(w / ratio)
    if (h > MAX_PHOTO_H) {
      h = MAX_PHOTO_H
      w = Math.round(h * ratio)
    }
    return {
      rotate: jitter(s + 50, 4) - 2, // −2..+2°, like a board item
      width: w,
      height: h,
    }
  }, [building.slug, building.cover.width, building.cover.height])

  return (
    <MapMarker
      longitude={lng}
      latitude={lat}
      anchor="top"
      /* North (higher lat) paints on top, so lower images are covered by
         upper ones — the poster cascade. */
      zIndex={Math.round(lat * 1000)}
    >
      <MarkerContent>
        <div
          className={styles.wrap}
          style={{ transform: `rotate(${rotate}deg)` }}
        >
          <div className={styles.card} style={{ }}>
            <img
              className={styles.photo}
              src={building.cover.image}
              alt={building.name}
              width={width}
              height={height}
            />
            <figcaption className={styles.caption} style={{ width }}>
              <Body2 className={styles.name}>{building.name}</Body2>
              <Body2 className={styles.architect}>{building.architect}</Body2>
            </figcaption>
          </div>
          <img
            className={styles.pin}
            src="/images/pin.png"
            alt=""
          />
        </div>
      </MarkerContent>
    </MapMarker>
  )
}
