import { useMemo, type ComponentProps } from "react"
import { MapMarker, MarkerContent } from "../map-core/map"
import type { ArchSummary } from "@nolli/data"
import { hashId, jitter } from "@nolli/board"
import { Note } from "@nolli/ui"
import styles from "./photo-marker.module.css"

// Cap the cover image so oversized photos don't dominate the map — both
// dimensions are bounded, fitting the intrinsic aspect ratio inside the box.
export function PhotoMarker({
  building,
  maxWidth = 160,
  maxHeight = 175,
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  noCaption,
  ...rest
}: {
  building: ArchSummary
  maxWidth?: number
  maxHeight?: number
  /** Extra class on the marker content — lets consumers target it (e.g. fades). */
  className?: string
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  /** Drop the caption strip — photo only (e.g. small hover cards). */
  noCaption?: boolean
} & Omit<ComponentProps<"div">, "className" | "onClick" | "onMouseEnter" | "onMouseLeave">) {
  const { lng, lat } = building.coordinates

  const { rotate, width, height } = useMemo(() => {
    const s = hashId(building.slug)
    const ratio = building.cover.width / building.cover.height
    let w = maxWidth
    let h = Math.round(w / ratio)
    if (h > maxHeight) {
      h = maxHeight
      w = Math.round(h * ratio)
    }
    return {
      rotate: jitter(s + 50, 4) - 2, // −2..+2°, like a board item
      width: w,
      height: h,
    }
  }, [building.slug, building.cover.width, building.cover.height, maxWidth, maxHeight])

  return (
    <MapMarker
      longitude={lng}
      latitude={lat}
      anchor="top"
      style={{ zIndex: Math.round(lat * 1000) }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <MarkerContent className={className} {...rest}>
        <div
          className={styles.wrap}
          style={{ transform: `rotate(${rotate}deg)` }}
        >
          <div className={styles.card}>
            <img
              className={styles.photo}
              src={building.cover.image}
              alt={building.name}
              width={width}
              height={height}
              crossOrigin="anonymous"
            />
            {!noCaption && (
              <figcaption className={styles.caption} style={{ width }}>
                <Note className={styles.name}>{building.name}</Note>
                <Note className={styles.architect}>{building.architect}</Note>
              </figcaption>
            )}
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
