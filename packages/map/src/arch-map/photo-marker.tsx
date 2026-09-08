import { useMemo, type ComponentProps } from "react"
import { MapMarker, MarkerContent } from "../map-core/map"
import type { ArchSummary } from "@nolli/data"
import { PaperPhoto } from "@nolli/ui"

// Cap the cover image so oversized photos don't dominate the map — both
// dimensions are bounded, fitting the intrinsic aspect ratio inside the box.
export function ArchPhotoPinMarker({
  building,
  maxWidth = 160,
  maxHeight = 175,
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  crossOrigin = "anonymous",
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
  /** Pass null on pages without COOP/COEP — the attribute forces a CORS
   * fetch, which image hosts may not allow for that page's origin. */
  crossOrigin?: "anonymous" | null
} & Omit<ComponentProps<"div">, "className" | "onClick" | "onMouseEnter" | "onMouseLeave">) {
  const { lng, lat } = building.coordinates

  const { width, height } = useMemo(() => {
    const ratio = building.cover.width / building.cover.height
    let w = maxWidth
    let h = Math.round(w / ratio)
    if (h > maxHeight) {
      h = maxHeight
      w = Math.round(h * ratio)
    }
    return { width: w, height: h }
  }, [building.cover.width, building.cover.height, maxWidth, maxHeight])

  return (
    <MapMarker
      longitude={lng}
      latitude={lat}
      anchor="top"
      style={{ zIndex: Math.round((lat + 90) * 1000) }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <MarkerContent className={className} {...rest}>
        <PaperPhoto
          src={building.cover.image}
          alt={building.name}
          width={width}
          height={height}
          caption={building.name}
          captionSub={building.architect}
          crossOrigin={crossOrigin}
          seed={building.slug}
          pin
        />
      </MarkerContent>
    </MapMarker>
  )
}
