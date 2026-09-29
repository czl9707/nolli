// Brush reveal over the spine's map. A canvas veil covers the map at the
// depth the plate veil had; the pointer's recent history stamps soft
// holes into it (destination-out radial gradients) that dissolve over
// TRAIL_MS — the revealed region is literally the cursor's last moment of
// movement. The canvas + marker clips repaint from ONE persistent rAF
// loop (expiry animates without pointer input; no event plumbing needed).
// A full-root catch layer owns touch: pan-y keeps vertical scroll native
// while other drags paint instead of panning the map. The veil lives
// exactly while the scene owns the spine's map (useSceneOwnsMap): the
// ownership flip at the scene boundary is its cut in and out. Scrolling
// away stops the brush COLLECTING — the live stroke still dissolves on
// its own clock. All trail coordinates are client px; the root sits at
// (0,0) so they are canvas-local too.
import { useEffect, useRef, useState, type RefObject } from "react"
import { useMotionValue, useReducedMotion, type MotionValue } from "framer-motion"
import type { MapRef } from "@nolli/map"
import type { ArchSummary } from "@/lib/landing-data"
import { useSceneOwnsMap, useSpineMap } from "@/spine/spine"
import styles from "./hero-reveal.module.css"

/** Brush stroke lifetime — a stamped point dissolves over this window. */
export const TRAIL_MS = 750

/** Soft hole radius (px) around each stamped point. */
const BRUSH_R = 160

/** Marker/clip hit radius — inside the gradient's fade so markers surface
 * only where the veil is mostly erased. */
const HIT_R = BRUSH_R * 0.7

/** Scene-local scroll (vh) under which the scene counts as at rest — the
 * brush only takes movement while the hold is parked at its top. */
export const AT_REST_VH = 0.5

const HIDDEN_CLIP = "inset(0 0 100% 0)"

export type TrailPoint = { x: number; y: number; t: number }

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

/** Inert class applied to every photo marker the hero mounts — the clip
 * driver matches on it to crop only the hero's set to the trail. A plain
 * string (not module css) so the shared .photoMarker class stays
 * identical across scenes. */
export const HERO_MARKER_CLASS = "hero-pick"

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

/** The hero's marker contents in the map — the clip driver's set. */
function heroMarkerContents(map: MapRef): HTMLElement[] {
  return Array.from(map.getContainer().querySelectorAll<HTMLElement>(".maplibregl-marker"))
    .map((root) => root.firstElementChild as HTMLElement | null)
    .filter((el): el is HTMLElement => !!el && el.classList.contains(HERO_MARKER_CLASS) && el.isConnected)
}

/** Canvas veil + brush holes over the spine map, plus the marker clip
 * driver — ONE persistent rAF loop writes all of it per frame: veil fill,
 * trail stamps (aged, soft, destination-out), and the hero markers'
 * clip-paths (hidden outside the trail, clear inside). The veil lives
 * exactly while this scene owns the spine's map — the ownership flip at
 * the scene boundary is its cut in and out, so any hold scene can reuse
 * it. Reduced motion renders nothing — markers show unclipped. */
export function BrushReveal({
  trail,
  on = true,
}: {
  trail: RefObject<TrailStore>
  /** Boot gate: before the reveal beat the veil stays solid (stamps are
   * still gathered but not painted), matching the plate's covered hole. */
  on?: boolean
}) {
  const reduced = useReducedMotion()
  const snap = !!reduced
  const map = useSpineMap()
  const ownsMap = useSceneOwnsMap()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const onRef = useRef(on)
  onRef.current = on

  useEffect(() => {
    if (snap) return
    // the off→on flip unmounts and re-creates the subtree, so every
    // frame re-reads the refs and re-binds the context when the canvas
    // element swapped — a canvas captured here would go zombie
    let ctx: CanvasRenderingContext2D | null = null
    let bound: HTMLCanvasElement | null = null
    let veil = ""

    const frame = () => {
      raf = requestAnimationFrame(frame)
      const root = rootRef.current
      const canvas = canvasRef.current
      if (!root || !canvas) return
      if (canvas !== bound) {
        bound = canvas
        ctx = canvas.getContext("2d")
        // resolved per canvas from a node INSIDE the tree — the theme
        // declares its tokens on body[data-theme], so reading off
        // documentElement misses them; the token is an "r g b" triplet
        const cs = getComputedStyle(root)
        const triplet = cs.getPropertyValue("--color-primary-background").trim()
        const bodyBg = getComputedStyle(document.body).backgroundColor
        veil = triplet
          ? `rgb(${triplet} / 0.92)`
          : bodyBg !== "rgba(0, 0, 0, 0)"
            ? bodyBg
            : "rgba(23, 23, 23, 0.92)"
      }
      if (!ctx) return
      const now = performance.now()
      trail.current.points = pruneTrail(trail.current.points, now, TRAIL_MS)

      const w = root.clientWidth
      const h = root.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== Math.round(w * dpr)) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

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
          const a = Math.max(1 - (now - p.t) / TRAIL_MS, 0)
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, BRUSH_R)
          g.addColorStop(0, `rgba(0, 0, 0, ${a})`)
          g.addColorStop(1, "rgba(0, 0, 0, 0)")
          ctx.fillStyle = g
          ctx.fillRect(p.x - BRUSH_R, p.y - BRUSH_R, BRUSH_R * 2, BRUSH_R * 2)
        }
      }

      // markers crop to the trail; outside it they stay hidden under the
      // held veil, surfacing only at the ownership cut
      if (map) {
        const clip = onRef.current
        const points = trail.current.points
        for (const el of heroMarkerContents(map)) {
          if (!clip) {
            el.style.clipPath = ""
            continue
          }
          const box = el.getBoundingClientRect()
          const hit = trailHit(
            points,
            box.left + box.width / 2,
            box.top + box.height / 2,
            HIT_R,
            now,
            TRAIL_MS,
          )
          el.style.clipPath = hit ? "" : HIDDEN_CLIP
        }
      }
    }
    let raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      if (map) for (const el of heroMarkerContents(map)) el.style.clipPath = ""
    }
  }, [snap, map, trail])

  if (snap || !ownsMap) return null
  return (
    <div className={styles.stickyWrapper}>
      <div ref={rootRef} className={styles.root}>
        <canvas ref={canvasRef} className={styles.canvas} />
        <div className={styles.catch} aria-hidden />
      </div>
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
