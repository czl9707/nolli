import { useEffect } from "react"
import { PhotoMarker, useMap } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import { useLandingStage } from "@/components/stage"
import styles from "./index-photo-markers.module.css"

/** Photo markers pinned at real coords — MapMarker tracks the camera natively.
 * Marker contents portal into the map container, outside any fade wrapper, so
 * the stage fade is written onto the container as a CSS var the markers
 * consume (see index-photo-markers.module.css). While the photo markers are
 * on screen (index dwell, or the hero where the cursor plate clips them),
 * the container also flags the normal pin/cluster markers off. */
export function IndexPhotoMarkers({ picks }: { picks: ArchSummary[] }) {
  const { fade } = useLandingStage()
  const opacity = fade("index")
  const heroO = fade("hero")
  const { map } = useMap()

  useEffect(() => {
    if (!map) return
    const el = map.getContainer()
    const apply = (o: number) => {
      const heroOn = heroO.get() > 0.001
      el.style.setProperty("--index-photo-o", String(o))
      // photo markers own the screen during the index dwell AND the hero
      // (there the cursor plate clips them — see hero-reveal.tsx)
      const state = o > 0 || heroOn ? "on" : "off"
      if (el.dataset.photoMarkers !== state) el.dataset.photoMarkers = state
      // while the photo markers own the screen, the normal pins stand down
      const archState = state === "on" ? "off" : "on"
      if (el.dataset.archMarkers !== archState) el.dataset.archMarkers = archState
      // hero mode: markers render fully visible; the plate clip gates them
      const heroState = heroOn ? "on" : "off"
      if (el.dataset.heroReveal !== heroState) el.dataset.heroReveal = heroState
    }
    apply(opacity.get())
    const un1 = opacity.on("change", apply)
    const un2 = heroO.on("change", apply)
    return () => {
      un1()
      un2()
      el.style.removeProperty("--index-photo-o")
      delete el.dataset.photoMarkers
      delete el.dataset.archMarkers
      delete el.dataset.heroReveal
    }
  }, [map, opacity, heroO])

  return (
    <>
      {picks.map((a) => (
        <PhotoMarker key={a.slug} building={a} className={styles.marker} />
      ))}
    </>
  )
}
