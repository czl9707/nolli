// Scene-owned photo markers portalled into the spine's map layer — one
// component for every scene's set. Visibility is the `on` class
// (photo-markers.module.css transitions the flip) and useLinger holds the
// mount across the exit fade. `className` carries any scene discriminator
// (the hero's clip driver matches its set by it).
import { createPortal } from "react-dom"
import type { ArchSummary } from "@nolli/data"
import { MapContext, PhotoMarker } from "@nolli/map"
import { useMapPortal, useSpineMap } from "@/spine/spine"
import { useLinger } from "@/lib/use-linger"
import styles from "./photo-markers.module.css"

export function PhotoMarkers({
  picks,
  on,
  className = "",
}: {
  picks: ArchSummary[]
  on: boolean
  className?: string
}) {
  const [mounted, visible] = useLinger(on, 400)
  const map = useSpineMap()
  const mapPortal = useMapPortal()
  if (!map || !mapPortal || !mounted) return null
  const cls = [styles.photoMarker, className, visible ? styles.on : ""].filter(Boolean).join(" ")
  return createPortal(
    <MapContext.Provider value={{ map, isLoaded: !!map }}>
      {picks.map((a) => (
        <PhotoMarker key={a.slug} building={a} className={cls} />
      ))}
    </MapContext.Provider>,
    mapPortal,
  )
}
