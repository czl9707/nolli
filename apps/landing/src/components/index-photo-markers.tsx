import { useEffect } from "react"
import { PhotoMarker, useMap } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import { useLandingStage } from "@/components/stage"
import styles from "./index-photo-markers.module.css"

/** Photo markers pinned at real coords — MapMarker tracks the camera natively.
 * Marker contents portal into the map container, outside any fade wrapper, so
 * the stage fade is written onto the container as a CSS var the markers
 * consume (see index-photo-markers.module.css). */
export function IndexPhotoMarkers({ picks }: { picks: ArchSummary[] }) {
  const { fade } = useLandingStage()
  const opacity = fade("index")
  const { map } = useMap()

  useEffect(() => {
    if (!map) return
    const el = map.getContainer()
    const apply = (o: number) => {
      el.style.setProperty("--index-photo-o", String(o))
      const state = o > 0 ? "on" : "off"
      if (el.dataset.photoMarkers !== state) el.dataset.photoMarkers = state
    }
    apply(opacity.get())
    const un = opacity.on("change", apply)
    return () => {
      un()
      el.style.removeProperty("--index-photo-o")
      delete el.dataset.photoMarkers
    }
  }, [map, opacity])

  return (
    <>
      {picks.map((a) => (
        <PhotoMarker key={a.slug} building={a} className={styles.marker} />
      ))}
    </>
  )
}
