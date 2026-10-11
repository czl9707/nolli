// Hero photo markers as a fixed overlay ABOVE the map — plain positioned
// divs tracking the map camera. Each marker registers its wrapper in
// `marks`, the registry the brush veil's mask driver targets, so markers
// show only through the brush's erased holes.
import { useCallback, useEffect, useRef, type RefObject } from "react"
import { PaperPhoto } from "@nolli/ui"
import type { MapRef } from "@nolli/map"
import type { ArchSummary } from "@/lib/landing-data"
import { useLinger } from "@/lib/use-linger"
import { useSpineMap } from "@/spine/spine"
import styles from "./photo-markers.module.css"

/** Stacking order from latitude — south stacks under north, the map
 * package's pin order. */
export const pinZ = (lat: number) => Math.round((lat + 90) * 1000)

type Pin = { slug: string; coordinates: { lng: number; lat: number } }

/** Shared camera tracking for the fixed marker overlays — anchors each
 * registered element at its pin's projected point on every map move/resize
 * (styles written straight to the node so camera moves never re-render).
 * `place` overrides the default left/top write for layers that hang extras
 * off the pass (the architect ledger's scroll gap). Returns `update` so
 * scroll-driven callers can re-run the same pass themselves. Re-runs on
 * the mount flip: the elements appear (possibly) after this binds, and a
 * still camera never fires move to catch them up. */
export function useProjectedPins<P extends Pin>(
  map: MapRef | null,
  mounted: boolean,
  pins: P[],
  place?: (el: HTMLElement, pin: P, at: { x: number; y: number }) => void,
) {
  const els = useRef(new Map<string, HTMLElement>())
  const pinsRef = useRef(pins)
  pinsRef.current = pins
  const placeRef = useRef(place)
  placeRef.current = place
  const update = useCallback(() => {
    if (!map) return
    for (const pin of pinsRef.current) {
      const el = els.current.get(pin.slug)
      if (!el) continue
      const p = map.project([pin.coordinates.lng, pin.coordinates.lat])
      if (placeRef.current) placeRef.current(el, pin, p)
      else {
        el.style.left = `${p.x}px`
        el.style.top = `${p.y}px`
      }
    }
  }, [map])
  useEffect(() => {
    if (!map || !mounted) return
    update()
    map.on("move", update)
    map.on("resize", update)
    return () => {
      map.off("move", update)
      map.off("resize", update)
    }
  }, [map, mounted, update])
  return { els, update }
}

export function PhotoMarkers({
  archs,
  on,
  marks,
}: {
  archs: ArchSummary[]
  on: boolean
  /** Registry the brush veil masks against — slug → marker element.
   * Scenes without a brush veil (the city ledger shows every marker
   * outright) omit it. */
  marks?: RefObject<Map<string, HTMLElement>>
}) {
  const [mounted, visible] = useLinger(on, 400)
  const map = useSpineMap()
  const { els } = useProjectedPins(map, mounted, archs)

  if (!mounted) return null
  return (
    <div className={styles.layer}>
      {archs.map((a) => (
        <div
          key={a.slug}
          ref={(el) => {
            if (el) {
              els.current.set(a.slug, el)
              marks?.current.set(a.slug, el)
            } else {
              els.current.delete(a.slug)
              marks?.current.delete(a.slug)
            }
          }}
          className={styles.marker}
          style={{ zIndex: pinZ(a.coordinates.lat) }}
        >
          <div className={styles.photoMarker} data-show={visible || undefined}>
            <MarkerPhoto a={a} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** The marker visual — the photo card with its pin, sized like the map
 * package's photo pin (cover fit inside 160×175). */
export function MarkerPhoto({ a }: { a: ArchSummary }) {
  const ratio = a.cover.width / a.cover.height
  let w = 160
  let h = Math.round(w / ratio)
  if (h > 175) {
    h = 175
    w = Math.round(h * ratio)
  }
  return (
    <PaperPhoto
      src={a.cover.image}
      alt={a.name}
      width={w}
      height={h}
      caption={a.name}
      captionSub={a.architect}
      crossOrigin={null}
      seed={a.slug}
      pin
    />
  )
}
