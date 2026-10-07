// Hero photo markers as an overlay ABOVE the map — plain positioned divs
// tracking the map camera (left/top from map.project on move/resize; the
// camera barely moves on this page), with no portal into the map layer.
// Each marker registers its wrapper in `marks`, the registry the brush
// veil's mask driver targets, so markers still show only through the
// brush's erased holes.
import { useEffect, useRef, type RefObject } from "react"
import { PaperPhoto } from "@nolli/ui"
import type { ArchSummary } from "@/lib/landing-data"
import { useLinger } from "@/lib/use-linger"
import { useSpineMap } from "@/spine/spine"
import styles from "./photo-markers.module.css"

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
  const els = useRef(new Map<string, HTMLDivElement>())

  // camera tracking: anchor top-center at the projected point — left/top
  // written straight to the node so camera moves never re-render. Re-runs
  // on the mount flip: the elements appear (possibly) after this bound,
  // and a still camera never fires move to catch them up.
  useEffect(() => {
    if (!map || !mounted) return
    const update = () => {
      for (const a of archs) {
        const el = els.current.get(a.slug)
        if (!el) continue
        const p = map.project([a.coordinates.lng, a.coordinates.lat])
        el.style.left = `${p.x}px`
        el.style.top = `${p.y}px`
      }
    }
    update()
    map.on("move", update)
    map.on("resize", update)
    return () => {
      map.off("move", update)
      map.off("resize", update)
    }
  }, [map, archs, mounted])

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
          style={{ zIndex: Math.round((a.coordinates.lat + 90) * 1000) }}
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
