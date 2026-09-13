// Scene-owned photo markers portalled into the spine's map layer — one
// component for every scene's set. Visibility is data-show
// (photo-markers.module.css transitions the fade) and useLinger holds the
// mount across the exit fade. `className` carries any scene discriminator
// (the hero's clip driver matches its set by it).
import { createPortal } from "react-dom"
import { useEffect } from "react"
import type { ArchSummary } from "@/lib/landing-data"
import { MapContext, ArchPhotoPinMarker } from "@nolli/map"
import { useMapPortal, useSpineMap } from "@/spine/spine"
import { useLinger } from "@/lib/use-linger"
import { useMobile } from "@/lib/use-mobile"
import styles from "./photo-markers.module.css"

export function PhotoMarkers({
  archs,
  on,
  className = "",
}: {
  archs: ArchSummary[]
  on: boolean
  className?: string
}) {
  const [mounted, visible] = useLinger(on, 400)
  const mobile = useMobile()
  const map = useSpineMap()
  const mapPortal = useMapPortal()

  // Mobile: the set is scenery (spec — markers are not tap targets), but
  // maplibre stamps role="button" + a generic label on every marker root at
  // addTo time. Demote our roots to presentational so they stop reading as
  // (sub-44px) buttons. Runs after the marker children's addTo effects.
  useEffect(() => {
    if (!mobile || !map || !mounted) return
    for (const el of map.getCanvasContainer().querySelectorAll<HTMLElement>(`.${styles.photoMarker}`)) {
      const root = el.closest(".maplibregl-marker")
      if (root) {
        root.setAttribute("role", "presentation")
        root.removeAttribute("aria-label")
      }
    }
  }, [mobile, map, mounted])

  if (!map || !mapPortal || !mounted) return null
  const cls = [styles.photoMarker, className].filter(Boolean).join(" ")
  return createPortal(
    <MapContext.Provider value={{ map, isLoaded: !!map }}>
      {archs.map((a) => (
        // data-show with || undefined — a literal false would still render
        // the attribute and match [data-show]
        <ArchPhotoPinMarker key={a.slug} building={a} className={cls} crossOrigin={null} data-show={visible || undefined} />
      ))}
    </MapContext.Provider>,
    mapPortal,
  )
}
