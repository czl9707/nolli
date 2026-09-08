// The city hold's marker set — every arch carries a pin by default; one
// arch is ALWAYS carded (the selection, first of the city by default) and
// hovering a row or marker MOVES the card. The outgoing card fades out in
// place while the incoming fades in; its pin crossfades back underneath.
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import type { ArchSummary } from "@nolli/data"
import { ArchPinMarker, MapContext, ArchPhotoPinMarker } from "@nolli/map"
import { useMapPortal, useSpineMap } from "@/spine/spine"
import { useLinger } from "@/lib/use-linger"
import styles from "./photo-markers.module.css"

export function CityMarkers({
  archs,
  on,
  selected,
  onSelect,
}: {
  archs: ArchSummary[]
  on: boolean
  /** Slug of the carded arch — always set once the scene has data. */
  selected: string | null
  onSelect: (slug: string) => void
}) {
  const [mounted, visible] = useLinger(on, 400)

  // mounted cards, newest last; only the newest is `on`, older ones are
  // mid-fade and unmount after the exit transition
  const [cards, setCards] = useState<string[]>([])
  const [onSlug, setOnSlug] = useState<string | null>(null)
  useEffect(() => {
    if (!selected) return
    setCards((cs) => (cs[cs.length - 1] === selected ? cs : [...cs.filter((c) => c !== selected), selected]))
    const t = setTimeout(() => setOnSlug(selected), 20)
    return () => clearTimeout(t)
  }, [selected])
  useEffect(() => {
    if (cards.length <= 1) return
    const t = setTimeout(() => setCards((cs) => cs.filter((c) => c === onSlug)), 400)
    return () => clearTimeout(t)
  }, [onSlug, cards])

  const map = useSpineMap()
  const mapPortal = useMapPortal()
  if (!map || !mapPortal || !mounted) return null

  return createPortal(
    <MapContext.Provider value={{ map, isLoaded: !!map }}>
      {archs.map((p) => (
        <ArchPinMarker
          key={p.slug}
          longitude={p.coordinates.lng}
          latitude={p.coordinates.lat}
          className={styles.cityPin}
          animate={{ opacity: visible && p.slug !== onSlug ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          onMouseEnter={() => onSelect(p.slug)}
        />
      ))}
      {cards.map((slug) => {
        const b = archs.find((p) => p.slug === slug)
        if (!b) return null
        return (
          <ArchPhotoPinMarker
            key={slug}
            building={b}
            className={styles.photoMarker}
            data-show={slug === onSlug || undefined}
            crossOrigin={"anonymous"}
            onMouseEnter={() => onSelect(slug)}
          />
        )
      })}
    </MapContext.Provider>,
    mapPortal,
  )
}
