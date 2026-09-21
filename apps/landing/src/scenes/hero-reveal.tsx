// Cursor-plate reveal over the spine's map. The veil, plate and crosshair
// lines render in the hero scene's own tree: the hero section is sticky
// for its full 100svh and then scrolls off 1:1 with the page, so the
// reveal pins during the hold and rides up through the transition for
// free. All coordinates are root-local px each frame; the plate clamps
// to `boundsRef` so it stays inside the reveal pane, and the root clips
// the lines at the screen edges.
import { useEffect, useRef, useState, type RefObject } from "react"
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "framer-motion"
import type { MapRef } from "@nolli/map"
import type { ArchSummary } from "@/lib/landing-data"
import { useSceneScroll, useSpineMap } from "@/spine/spine"
import styles from "./hero-reveal.module.css"

/** The plate's rest dimensions. */
const PLATE = { w: 480, h: 280 }

/** Plate size at a viewport width — full size on wide screens, shrinking
 * with narrow ones so the plate always keeps roam room inside its bounds
 * (at rest size it would pin centred and stop moving). */
export function plateSize(innerWidth: number) {
  const w = Math.min(PLATE.w, Math.max(240, innerWidth - 96))
  return { w, h: Math.round((w * PLATE.h) / PLATE.w) }
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/** True on coarse pointers (touch) — no proxy cursor exists there. */
const coarsePointer = () => window.matchMedia("(pointer: coarse)").matches

/** Plate size grown by scroll progress: rest plate → covers the whole
 * root. The end size is measured against the root while the clamp centres
 * oversized plates on the BOUNDS (which sit below the header): a plain
 * viewport-sized plate centred on the bounds leaves the header strip
 * veiled, and the unmount at full progress would flip it to map in one
 * jump. Overshoot past the root is harmless — the root clips it. */
function grownSize(p: number, b: DOMRect, r: DOMRect) {
  const rest = plateSize(window.innerWidth)
  const e = easeInOut(p)
  const bcx = (b.left + b.right) / 2
  const bcy = (b.top + b.bottom) / 2
  const end = {
    w: 2 * Math.max(bcx - r.left, r.right - bcx),
    h: 2 * Math.max(bcy - r.top, r.bottom - bcy),
  }
  return {
    w: rest.w + (end.w - rest.w) * e,
    h: rest.h + (end.h - rest.h) * e,
  }
}

/** Inert class applied to every photo marker the hero mounts — the clip
 * driver matches on it to crop only the hero's set to the plate. A plain
 * string (not module css) so the shared .photoMarker class stays
 * identical across scenes. */
export const HERO_MARKER_CLASS = "hero-pick"

const OVERHANG = { top: 14, right: 10, bottom: 10, left: 10 }

/** Radius (px, plate-centre to marker) within which a pick counts as revealed. */
const REVEAL_R = 180

/** The plate's live rect in viewport px — written by the reveal's frame
 * loop each frame, read wherever plate membership matters. */
export type PlateRect = { left: number; top: number; right: number; bottom: number }

export function useCursorSprings() {
  const sx = useSpring(useMotionValue(window.innerWidth * 0.62), { stiffness: 130, damping: 22 })
  const sy = useSpring(useMotionValue(window.innerHeight * 0.42), { stiffness: 130, damping: 22 })
  useEffect(() => {
    // coarse pointers (touch): no proxy cursor — the plate stays idle; a
    // mouse keeps driving it at any window size, mobile tree included
    if (coarsePointer()) return
    const onMove = (e: PointerEvent) => {
      sx.set(e.clientX)
      sy.set(e.clientY)
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [sx, sy])
  return { sx, sy }
}

/** Plate rect in viewport px, fully clamped inside the bounds rect. `root`
 * is the ROOT box — every offset the frame writes is root-local, while
 * the clamp keeps the plate inside the bounds pane. `cx`/`cy` are the
 * wanted plate centre in viewport px (cursor springs, or the bounds'
 * centre when there is no proxy cursor). */
function plateRect(
  b: DOMRect,
  root: HTMLElement,
  cx: number,
  cy: number,
  size: { w: number; h: number },
) {
  const r = root.getBoundingClientRect()
  const clampAxis = (v: number, start: number, end: number, size: number) =>
    end - start >= size
      ? Math.min(Math.max(v, start + size / 2), end - size / 2)
      : (start + end) / 2
  const x = clampAxis(cx, b.left, b.right, size.w)
  const y = clampAxis(cy, b.top, b.bottom, size.h)
  return {
    left: x - size.w / 2,
    right: x + size.w / 2,
    top: y - size.h / 2,
    bottom: y + size.h / 2,
    rect: r,
  }
}

/** Clip a photo-marker content div to the plate rect (px viewport coords).
 * The clip is a pure function of the hole: markers fully outside get
 * collapsed, straddling ones crop to the hole (OVERHANG lets the card
 * bleed a little past the edge while sliding in/out), and markers fully
 * inside carry no clip at all — so a hole that covers the screen clears
 * every clip on its last frame, no separate cleanup pass needed. */
function clipToPlate(el: HTMLElement, p: { left: number; top: number; right: number; bottom: number }) {
  const root = el.parentElement!
  const box = root.getBoundingClientRect()
  if (
    box.right < p.left - OVERHANG.left ||
    box.left > p.right + OVERHANG.right ||
    box.bottom < p.top - OVERHANG.top ||
    box.top > p.bottom + OVERHANG.bottom
  ) {
    el.style.clipPath = "inset(0 0 100% 0)"
    return
  }
  const ct = Math.max(p.top - box.top, -OVERHANG.top)
  const cl = Math.max(p.left - box.left, -OVERHANG.left)
  const cr = Math.max(box.right - p.right, -OVERHANG.right)
  const cb = Math.max(box.bottom - p.bottom, -OVERHANG.bottom)
  el.style.clipPath =
    ct <= 0 && cl <= 0 && cr <= 0 && cb <= 0
      ? ""
      : `inset(${ct}px ${cr}px ${cb}px ${cl}px)`
}

/** Veil + plate + furniture over the spine map, plus the marker clip driver
 * and the coords readout — ONE rAF loop writes all of it per frame:
 * geometry first (veil hole vars, plate/furniture transforms, crosshair
 * guides), then the coords text, then the hero markers' clip-paths.
 * Renders in the hero scene's tree (first child of the sticky hero
 * section): pinned during the hold, riding up with the page once the
 * section releases. The plate roams `boundsRef` if given (a pane), else
 * the root; on coarse pointers it sits at the bounds' centre instead.
 * With a `growVh` runway, the plate size grows with scene scroll until
 * the hole covers the whole map — then the reveal unmounts; the last
 * frame's clips already resolved to "none" since every marker sits inside
 * the hole. Reduced motion renders nothing — markers show unclipped. */
export function CursorReveal({
  boundsRef,
  plateRef,
  sx,
  sy,
  tagTl = "Architecture",
  tagTr,
  on = true,
  growVh,
}: {
  boundsRef?: RefObject<HTMLDivElement | null>
  /** Receives the live plate rect (viewport px) every frame — the arch
   * list's active highlight follows it, grown plate included. */
  plateRef?: RefObject<PlateRect | null>
  sx: MotionValue<number>
  sy: MotionValue<number>
  tagTl?: string
  tagTr?: string
  /** Boot gate for the reveal: the plate's veil-colored fill fades out (it
   * IS the hole cover), showing the map through the plate, while the tags
   * and accessories fade in. The veil itself is bg-colored from frame one —
   * the map fades in under it, the hole stays covered until this flips. */
  on?: boolean
  /** Scene-local scroll runway (vh) over which the plate grows to cover
   * the map. Omit for the static roving plate. */
  growVh?: number
}) {
  const reduced = useReducedMotion()
  const snap = !!reduced
  const map = useSpineMap()
  const local = useSceneScroll()
  const coarse = useRef(coarsePointer()).current
  const rootRef = useRef<HTMLDivElement | null>(null)
  const coordsRef = useRef<HTMLSpanElement>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (snap) return
    let raf = 0

    const frame = () => {
      raf = 0
      // grow progress first — before any root bail, so scrolling back up
      // re-mounts the veil
      const p = growVh ? Math.min(Math.max(local.get() / growVh, 0), 1) : 1
      setDone(growVh ? p >= 1 : false)
      // re-read each frame: after a scroll-back remount a captured root
      // would be a detached node
      const root = rootRef.current
      if (!root) return
      const b = (boundsRef?.current ?? root).getBoundingClientRect()
      const r = root.getBoundingClientRect()
      // no proxy cursor on touch: the plate rests at the bounds' centre
      const size = grownSize(p, b, r)
      const cx = coarse ? b.left + b.width / 2 : sx.get()
      const cy = coarse ? b.top + b.height / 2 : sy.get()
      const pr = plateRect(b, root, cx, cy, size)
      if (plateRef) plateRef.current = { left: pr.left, top: pr.top, right: pr.right, bottom: pr.bottom }
      const ox = pr.left - pr.rect.left
      const oy = pr.top - pr.rect.top

      // veil hole + plate/furniture position + size (all frame-owned)
      root.style.setProperty("--pl", `${ox}px`)
      root.style.setProperty("--pt", `${oy}px`)
      root.style.setProperty("--pr", `${pr.right - pr.rect.left}px`)
      root.style.setProperty("--pb", `${pr.bottom - pr.rect.top}px`)
      const setTf = (sel: string, x: number, y: number) => {
        const el = root.querySelector<HTMLElement>(sel)
        if (el) {
          el.style.transform = `translate(${x}px, ${y}px)`
          el.style.width = `${size.w}px`
          el.style.height = `${size.h}px`
        }
      }
      setTf("#" + styles["hero-plate"], ox, oy)
      setTf("#" + styles["hero-reveal-furniture"], ox, oy)
      // crosshair guides — full-height verticals at the plate's left/right,
      // full-width horizontals at its top/bottom
      const setPx = (sel: string, prop: "left" | "top", v: number) => {
        const el = root.querySelector<HTMLElement>(sel)
        if (el) el.style[prop] = `${v}px`
      }
      setPx("#hero-cxvl", "left", ox)
      setPx("#hero-cxvr", "left", pr.right - pr.rect.left)
      setPx("#hero-cxht", "top", oy)
      setPx("#hero-cxhb", "top", pr.bottom - pr.rect.top)

      // coords readout — plate-centre lat/lng straight to the DOM
      if (map && coordsRef.current) {
        const c = map.unproject([(pr.left + pr.right) / 2, (pr.top + pr.bottom) / 2])
        coordsRef.current.textContent = `${Math.abs(c.lat).toFixed(4)}° ${c.lat >= 0 ? "N" : "S"}  ${Math.abs(c.lng).toFixed(4)}° ${c.lng >= 0 ? "E" : "W"}`
      }

      // hero markers crop to the plate — the plate rides up with the page
      // during the transition while the markers stay in the pinned map
      // layer, so scroll re-runs this too. Scoped to THIS map's markers
      // carrying our class; any other map keeps its markers unclipped.
      if (map) {
        const contents = Array.from(
          map.getContainer().querySelectorAll<HTMLElement>(".maplibregl-marker"),
        )
          .map((root) => root.firstElementChild as HTMLElement | null)
          .filter(
            (el): el is HTMLElement =>
              !!el && el.classList.contains(HERO_MARKER_CLASS) && el.isConnected,
          )
        for (const el of contents) clipToPlate(el, pr)
      }
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    const u3 = local.on("change", schedule)
    // markers mount when their scene flips them on (PhotoMarkers lingers
    // in on the reveal) — a fresh marker carries no clip until a frame
    // runs, which otherwise waits for the first pointer move. Watch for
    // insertions so every marker is clipped the frame it arrives
    let mo: MutationObserver | null = null
    if (map) {
      mo = new MutationObserver(schedule)
      mo.observe(map.getContainer(), { childList: true, subtree: true })
      map.on("move", schedule)
    }
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    schedule()
    return () => {
      u1()
      u2()
      u3()
      mo?.disconnect()
      if (map) map.off("move", schedule)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [snap, map, boundsRef, plateRef, sx, sy, local, growVh, on])

  if (snap || done) return null
  return (
    <div className={styles.stickyWrapper}>
      <div ref={rootRef} className={styles.root} data-on={on ? "" : undefined}>
        <div className={styles.veil} aria-hidden />
        <span id={"hero-cxvl"} className={`${styles.cx} ${styles.cxV}`} aria-hidden />
        <span id={"hero-cxvr"} className={`${styles.cx} ${styles.cxV}`} aria-hidden />
        <span id={"hero-cxht"} className={`${styles.cx} ${styles.cxH}`} aria-hidden />
        <span id={"hero-cxhb"} className={`${styles.cx} ${styles.cxH}`} aria-hidden />
        <div id={styles["hero-plate"]}>
          <span className={`${styles.frame} ${styles.tagTl}`}>{tagTl}</span>
          {tagTr && <span className={`${styles.frame} ${styles.tagTr}`}>{tagTr}</span>}
          <span className={`${styles.frame} ${styles.dot}`} />
        </div>
        <div id={styles["hero-reveal-furniture"]}>
          <span className={`${styles.frame} ${styles.north}`}>N ↑</span>
          <span ref={coordsRef} className={`${styles.frame} ${styles.coords}`} />
        </div>
      </div>
    </div>
  )
}

/** Picks currently inside the reveal plate. With a live plate rect the
 * test is plate membership — a pick goes active exactly when its marker
 * shows through the hole, the grown plate revealing the whole deck as it
 * covers the map. Without one (reduced motion renders no plate) it falls
 * back to a fixed radius around the cursor. */
export function usePlateArchs(
  sx: MotionValue<number>,
  sy: MotionValue<number>,
  archs: ArchSummary[],
  map: MapRef | null,
  plateRef?: RefObject<PlateRect | null>,
  local?: MotionValue<number>,
) {
  const [active, setActive] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    if (!map || !archs.length) return
    let raf = 0
    const update = () => {
      raf = 0
      const plate = plateRef?.current
      const box = map.getContainer().getBoundingClientRect()
      const cx = sx.get()
      const cy = sy.get()
      const inside: string[] = []
      for (const a of archs) {
        const p = map.project([a.coordinates.lng, a.coordinates.lat])
        const x = p.x + box.left
        const y = p.y + box.top
        const hit = plate
          ? x > plate.left && x < plate.right && y > plate.top && y < plate.bottom
          : (x - cx) ** 2 + (y - cy) ** 2 < REVEAL_R ** 2
        if (hit) inside.push(a.slug)
      }
      setActive((prev) => {
        const same = prev.size === inside.length && inside.every((s) => prev.has(s))
        return same ? prev : new Set(inside)
      })
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    const u3 = local?.on("change", schedule)
    map.on("move", schedule)
    schedule()
    return () => {
      u1()
      u2()
      u3?.()
      map.off("move", schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [map, sx, sy, archs, plateRef, local])

  return { active }
}
