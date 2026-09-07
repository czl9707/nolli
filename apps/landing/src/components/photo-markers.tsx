// Scene-owned photo markers portalled into the spine's map layer — one
// component for every scene's set. Visibility is data-show
// (photo-markers.module.css transitions the fade) and useLinger holds the
// mount across the exit fade. `className` carries any scene discriminator
// (the hero's clip driver matches its set by it).
import { createPortal } from "react-dom"
import type { ArchSummary } from "@nolli/data"
import { MapContext, ArchPhotoPinMarker } from "@nolli/map"
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
  const cls = [styles.photoMarker, className].filter(Boolean).join(" ")
  return createPortal(
    <MapContext.Provider value={{ map, isLoaded: !!map }}>
      {picks.map((a) => (
        // data-show with || undefined — a literal false would still render
        // the attribute and match [data-show]
        <ArchPhotoPinMarker key={a.slug} building={a} className={cls} crossOrigin={null} data-show={visible || undefined} />
      ))}
    </MapContext.Provider>,
    mapPortal,
  )
}
