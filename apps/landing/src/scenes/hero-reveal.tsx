// Brush reveal over the spine's map. The veil is the map component's own
// canvas (landing-map.tsx, picked by id); the pointer's recent history
// stamps soft holes into it (destination-out radial gradients) that
// dissolve over TRAIL_MS — the revealed region is literally the cursor's
// last moment of movement. The hero's photo markers (photo-markers.tsx)
// sit above the veil in the scene flow, so each carries a CSS mask
// mirroring the trail (same gradients, marker-local px): a marker shows
// only through the erased region, partially — without the mask it would
// ghost at 8% like the map does. ONE persistent rAF loop repaints the
// veil and rebuilds the masks per frame (expiry animates without pointer
// input; no event plumbing needed), reading the marker elements from the
// marks registry the overlay fills. A full-root catch layer owns touch:
// pan-y keeps vertical scroll native while other drags paint instead of
// panning the map. The brush only COLLECTS while the hold is parked at
// its top; a stroke left behind dissolves on its own clock. All trail
// coordinates are client px; the veil sits in the map layer, which is
// fullscreen and parked at (0,0) while the hold is parked, so stamps
// taken there are canvas-local too.
import { useEffect, useRef, useState, type RefObject } from "react"
import { useMotionValue, useReducedMotion, type MotionValue } from "framer-motion"
import type { MapRef } from "@nolli/map"
import type { ArchSummary } from "@/lib/landing-data"
import { MAP_VEIL_ID, paintVeil, veilFill } from "@/components/landing-map"
import { useSceneOwnsMap } from "@/spine/spine"
import styles from "./hero-reveal.module.css"

/** Brush stroke lifetime — a stamped point dissolves over this window. */
export const TRAIL_MS = 750

/** Soft hole radius (px) around each stamped point. */
const BRUSH_R = 160

/** Highlight hit radius — inside the gradient's fade so a pick lights up
 * only where the veil is mostly erased over it. */
const HIT_R = BRUSH_R * 0.7

/** Scene-local scroll (vh) under which the scene counts as at rest — the
 * brush only takes movement while the hold is parked at its top. */
export const AT_REST_VH = 0.5

/** A mask that shows nothing — mask-image: none means fully visible. */
const MASK_HIDDEN = "linear-gradient(transparent, transparent)"

export type TrailPoint = { x: number; y: number; t: number }

/** Marker elements the veil masks, keyed by slug — filled by the hero's
 * marker overlay and read (never written) by the veil's rAF loop. */
export type MarkRegistry = RefObject<Map<string, HTMLElement>>

/** Points still inside the brush window, oldest first. Returns the input
 * array untouched when nothing expires (the per-frame common case). */
export function pruneTrail(points: TrailPoint[], now: number, ttl: number): TrailPoint[] {
  const first = points.findIndex((p) => now - p.t > ttl)
  return first === -1 ? points : points.filter((p) => now - p.t <= ttl)
}

/** True when (x, y) sits within `r` of any unexpired point. */
export function trailHit(
  points: TrailPoint[],
  x: number,
  y: number,
  r: number,
  now: number,
  ttl: number,
): boolean {
  const r2 = r * r
  for (const p of points) {
    if (now - p.t > ttl) continue
    if ((x - p.x) ** 2 + (y - p.y) ** 2 <= r2) return true
  }
  return false
}

export type TrailStore = {
  points: TrailPoint[]
  sx: MotionValue<number>
  sy: MotionValue<number>
}

/** Pointer history for the brush: raw positions (no springs — the trail
 * IS the cursor's history) plus the latest x/y as motion values for
 * readouts. Fine pointers paint on every move; coarse pointers paint only
 * while a finger is down (pointercancel just stops — the browser claimed
 * the gesture for scroll). With a scene-local scroll value, collection
 * stops once the hold leaves its top — points already gathered keep
 * dissolving on their own clock. */
export function useTrail(localScroll?: MotionValue<number>): RefObject<TrailStore> {
  const sx = useMotionValue(window.innerWidth * 0.62)
  const sy = useMotionValue(window.innerHeight * 0.42)
  const store = useRef<TrailStore>({ points: [], sx, sy })
  useEffect(() => {
    // "not coarse" rather than "fine": environments with no pointer at all
    // (headless) still get the move-paints behavior
    const fine = !window.matchMedia("(pointer: coarse)").matches
    let down = false
    const stamp = (e: PointerEvent) => {
      if (!fine && !down) return
      if (localScroll && localScroll.get() >= AT_REST_VH) return
      store.current.points.push({ x: e.clientX, y: e.clientY, t: performance.now() })
      sx.set(e.clientX)
      sy.set(e.clientY)
    }
    const onDown = (e: PointerEvent) => {
      down = true
      stamp(e)
    }
    const onUp = () => {
      down = false
    }
    window.addEventListener("pointermove", stamp, { passive: true })
    if (!fine) {
      window.addEventListener("pointerdown", onDown, { passive: true })
      window.addEventListener("pointerup", onUp, { passive: true })
      window.addEventListener("pointercancel", onUp, { passive: true })
    }
    return () => {
      window.removeEventListener("pointermove", stamp)
      if (!fine) {
        window.removeEventListener("pointerdown", onDown)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onUp)
      }
    }
  }, [store, sx, sy, localScroll])
  return store
}

/** The brush over the map component's veil canvas — ONE persistent rAF
 * loop repaints it per frame: solid wash, then trail stamps (aged, soft,
 * destination-out). The loop runs exactly while this scene owns the
 * spine's map — the ownership flip at the scene boundary is its cut in
 * and out, and the way out hands the veil back plain (paintVeil), so the
 * next hold never inherits dissolving stamps. Reduced motion skips the
 * loop — the veil stands as the component painted it. */
export function BrushReveal({
  trail,
  on = true,
  marks,
}: {
  trail: RefObject<TrailStore>
  /** Boot gate: before the reveal beat the veil stays solid (stamps are
   * still gathered but not painted), matching the plate's covered hole. */
  on?: boolean
  /** The hero's marker registry — the mask driver's set. */
  marks: MarkRegistry
}) {
  const reduced = useReducedMotion()
  const snap = !!reduced
  const owns = useSceneOwnsMap()
  const onRef = useRef(on)
  onRef.current = on

  useEffect(() => {
    if (snap || !owns) return
    // the veil canvas mounts with the map (gated on the client instance)
    // and can be re-created under us, so every frame re-picks it by id
    // and re-binds the context when the element swapped — a canvas
    // captured here would go zombie
    let ctx: CanvasRenderingContext2D | null = null
    let bound: HTMLCanvasElement | null = null
    let veil = ""

    const frame = () => {
      raf = requestAnimationFrame(frame)
      const canvas = document.getElementById(MAP_VEIL_ID)
      if (!(canvas instanceof HTMLCanvasElement)) return
      if (canvas !== bound) {
        bound = canvas
        ctx = canvas.getContext("2d")
        veil = veilFill(canvas)
      }
      if (!ctx) return
      const now = performance.now()
      trail.current.points = pruneTrail(trail.current.points, now, TRAIL_MS)

      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== Math.round(w * dpr)) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // canvas px = client px minus the layer's live offset — the layer
      // is parked at (0,0) while stamps are taken (collection stops at
      // rest), so this is identity at rest.
      const rb = canvas.getBoundingClientRect()

      // stamps paint from whatever history remains — collection already
      // stopped at scroll (useTrail), so the live stroke dissolves on its
      // own clock while the veil holds solid
      ctx.globalCompositeOperation = "source-over"
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = veil
      ctx.fillRect(0, 0, w, h)
      if (onRef.current) {
        ctx.globalCompositeOperation = "destination-out"
        for (const p of trail.current.points) {
          const x = p.x - rb.left
          const y = p.y - rb.top
          const a = Math.max(1 - (now - p.t) / TRAIL_MS, 0)
          const g = ctx.createRadialGradient(x, y, 0, x, y, BRUSH_R)
          g.addColorStop(0, `rgba(0, 0, 0, ${a})`)
          g.addColorStop(1, "rgba(0, 0, 0, 0)")
          ctx.fillStyle = g
          ctx.fillRect(x - BRUSH_R, y - BRUSH_R, BRUSH_R * 2, BRUSH_R * 2)
        }
      }

      // the veil is 0.92 — photo markers under it would ghost at 8%, so
      // each one carries a mask mirroring the trail: the same radial
      // gradients in marker-local px, add-composited (≈ the canvas's
      // accumulated erase). Markers with no stroke in reach get a fully
      // transparent mask; set via JS so the build pipeline never rewrites
      // the -webkit- twins
      const live = onRef.current
      const points = trail.current.points
      for (const el of marks.current.values()) {
        if (!el.isConnected) continue
        let layers = MASK_HIDDEN
        if (live && points.length) {
          const box = el.getBoundingClientRect()
          const near: string[] = []
          for (const p of points) {
            const lx = p.x - box.left
            const ly = p.y - box.top
            if (lx < -BRUSH_R || lx > box.width + BRUSH_R || ly < -BRUSH_R || ly > box.height + BRUSH_R)
              continue
            const a = Math.max(1 - (now - p.t) / TRAIL_MS, 0)
            near.push(
              `radial-gradient(circle at ${lx}px ${ly}px, rgba(0, 0, 0, ${a}) 0px, rgba(0, 0, 0, 0) ${BRUSH_R}px)`,
            )
          }
          if (near.length) layers = near.join(", ")
        }
        el.style.maskImage = layers
        el.style.webkitMaskImage = layers
        el.style.maskComposite = "add"
        el.style.webkitMaskComposite = "source-over"
      }
    }
    let raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      // hand the veil back plain — the loop's last frame may carry
      // stamps still dissolving, and the next hold takes the veil as-is
      const canvas = document.getElementById(MAP_VEIL_ID)
      if (canvas instanceof HTMLCanvasElement) paintVeil(canvas)
      for (const el of marks.current.values()) {
        el.style.maskImage = ""
        el.style.webkitMaskImage = ""
      }
    }
  }, [snap, owns, marks, trail])

  if (snap) return null
  return (
    <div className={styles.veilWrap}>
      <div className={styles.catch} aria-hidden />
    </div>
  )
}

/** Picks currently inside the brush's live region — a pick goes active
 * exactly when its marker shows through a stroke. The loop idles (and the
 * set clears) while `on` is false, so it costs nothing past the hold. */
export function useTrailArchs(
  trail: RefObject<TrailStore>,
  archs: ArchSummary[],
  map: MapRef | null,
  on: boolean,
) {
  const [active, setActive] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    if (!map || !archs.length || !on) {
      setActive(new Set())
      return
    }
    let raf = 0
    const update = () => {
      raf = requestAnimationFrame(update)
      const now = performance.now()
      const points = trail.current.points
      const box = map.getContainer().getBoundingClientRect()
      const inside: string[] = []
      for (const a of archs) {
        const p = map.project([a.coordinates.lng, a.coordinates.lat])
        if (trailHit(points, p.x + box.left, p.y + box.top, HIT_R, now, TRAIL_MS)) inside.push(a.slug)
      }
      setActive((prev) => {
        const same = prev.size === inside.length && inside.every((s) => prev.has(s))
        return same ? prev : new Set(inside)
      })
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [map, trail, archs, on])

  return { active }
}
