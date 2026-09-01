// Cursor-plate reveal over the spine's map. The veil, plate and crosshair
// lines render in the hero scene's own tree: the hero section is sticky
// for its full 100svh and then scrolls off 1:1 with the page, so the
// reveal pins during the hold and rides up through the transition for
// free. All coordinates are root-local px each frame; the plate clamps to
// `boundsRef` so it stays inside the reveal pane, and the root clips the
// lines at the screen edges.
import { useEffect, useRef, useState, type RefObject } from "react"
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "framer-motion"
import type { MapRef } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import { Caption, Note, useIsMobile } from "@nolli/ui"
import styles from "./hero-reveal.module.css"

export const PLATE = { w: 360, h: 280 }

/** Inert class applied to every photo marker the hero mounts — the clip
 * driver matches on it to crop only the hero's set to the plate. A plain
 * string (not module css) so the shared .photoMarker class stays
 * identical across scenes. */
export const HERO_MARKER_CLASS = "hero-pick"

const OVERHANG = { top: 14, right: 10, bottom: 10, left: 10 }

/** Radius (px, plate-centre to marker) within which a pick counts as revealed. */
const REVEAL_R = 180

export function useCursorSprings() {
  const sx = useSpring(useMotionValue(window.innerWidth * 0.62), { stiffness: 130, damping: 22 })
  const sy = useSpring(useMotionValue(window.innerHeight * 0.42), { stiffness: 130, damping: 22 })
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      sx.set(e.clientX)
      sy.set(e.clientY)
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [sx, sy])
  return { sx, sy }
}

/** Plate rect in viewport px, fully clamped inside the bounds element.
 * `rect` is the SURFACE box — downstream offsets (veil vars, transforms,
 * crosshair lines) are surface-local, while the clamp keeps the plate inside
 * the bounds pane. */
function plateRect(
  bounds: HTMLElement,
  surface: HTMLElement,
  sx: MotionValue<number>,
  sy: MotionValue<number>,
) {
  const b = bounds.getBoundingClientRect()
  const r = surface.getBoundingClientRect()
  const clampAxis = (v: number, start: number, end: number, size: number) =>
    end - start >= size
      ? Math.min(Math.max(v, start + size / 2), end - size / 2)
      : (start + end) / 2
  const cx = clampAxis(sx.get(), b.left, b.right, PLATE.w)
  const cy = clampAxis(sy.get(), b.top, b.bottom, PLATE.h)
  return {
    left: cx - PLATE.w / 2,
    right: cx + PLATE.w / 2,
    top: cy - PLATE.h / 2,
    bottom: cy + PLATE.h / 2,
    rect: r,
  }
}

/** Veil + plate + furniture over the spine map, plus the marker clip driver.
 * Renders in the hero scene's tree (first child of the sticky hero
 * section): pinned during the hold, riding up with the page once the
 * section releases. The plate roams `boundsRef` if given (a pane), else
 * the root. Snap mode (touch / reduced motion) renders nothing — markers
 * show unclipped. */
export function CursorReveal({
  boundsRef,
  map,
  sx,
  sy,
  tagTl = "Architecture",
  tagTr,
}: {
  boundsRef?: RefObject<HTMLDivElement | null>
  map: MapRef | null
  sx: MotionValue<number>
  sy: MotionValue<number>
  tagTl?: string
  tagTr?: string
}) {
  const reduced = useReducedMotion()
  const snap = useIsMobile() || !!reduced
  const rootRef = useRef<HTMLDivElement | null>(null)
  const clampEl = () => boundsRef?.current ?? rootRef.current

  // veil hole vars (root-local) + plate transform + crosshair lines,
  // written per frame so scroll and resize stay correct without listeners
  useEffect(() => {
    if (snap) return
    const root = rootRef.current
    if (!root) return
    let raf = 0
    const write = () => {
      raf = 0
      const el = clampEl()
      if (!el) return
      const p = plateRect(el, root, sx, sy)
      const ox = p.left - p.rect.left
      const oy = p.top - p.rect.top
      root.style.setProperty("--pl", `${ox}px`)
      root.style.setProperty("--pt", `${oy}px`)
      root.style.setProperty("--pr", `${p.right - p.rect.left}px`)
      root.style.setProperty("--pb", `${p.bottom - p.rect.top}px`)
      const plate = root.querySelector<HTMLElement>("[data-plate]")
      if (plate) plate.style.transform = `translate(${ox}px, ${oy}px)`
      const furn = root.querySelector<HTMLElement>("[data-furniture]")
      if (furn) furn.style.transform = `translate(${ox}px, ${oy}px)`
      const setPx = (sel: string, prop: "left" | "top", v: number) => {
        const el2 = root.querySelector<HTMLElement>(sel)
        if (el2) el2.style[prop] = `${v}px`
      }
      setPx("[data-cxvl]", "left", ox)
      setPx("[data-cxvr]", "left", p.right - p.rect.left)
      setPx("[data-cxht]", "top", oy)
      setPx("[data-cxhb]", "top", p.bottom - p.rect.top)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(write)
    }
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    schedule()
    return () => {
      u1()
      u2()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [snap, boundsRef, sx, sy])

  // coords readout — plate-centre lat/lng straight to the DOM
  const coordsRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (snap || !map) return
    const update = () => {
      const el = clampEl()
      const surface = rootRef.current
      if (!el || !surface || !coordsRef.current) return
      const p = plateRect(el, surface, sx, sy)
      const c = map.unproject([(p.left + p.right) / 2, (p.top + p.bottom) / 2])
      coordsRef.current.textContent = `${Math.abs(c.lat).toFixed(4)}° ${c.lat >= 0 ? "N" : "S"}  ${Math.abs(c.lng).toFixed(4)}° ${c.lng >= 0 ? "E" : "W"}`
    }
    const schedule = () => requestAnimationFrame(update)
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    window.addEventListener("scroll", schedule, { passive: true })
    schedule()
    return () => {
      u1()
      u2()
      window.removeEventListener("scroll", schedule)
    }
  }, [snap, map, boundsRef, sx, sy])

  // clip photo markers to the plate rect — the plate rides up with the
  // page during the transition while the markers stay in the pinned map
  // layer, so the clip is re-run on scroll
  useEffect(() => {
    if (snap || !map) return
    let raf = 0
    const update = () => {
      raf = 0
      const el = clampEl()
      const surface = rootRef.current
      if (!el || !surface) return
      const p = plateRect(el, surface, sx, sy)
      // scoped to THIS map — any other map on the page keeps its markers
      // unclipped
      const contents = Array.from(
        map.getContainer().querySelectorAll<HTMLElement>(".maplibregl-marker"),
      )
        .map((root) => root.firstElementChild as HTMLElement | null)
        .filter(
          (el): el is HTMLElement =>
            !!el && el.classList.contains(HERO_MARKER_CLASS) && el.isConnected,
        )
      for (const el of contents) {
        const root = el.parentElement!
        const box = root.getBoundingClientRect()
        if (
          box.right < p.left - OVERHANG.left ||
          box.left > p.right + OVERHANG.right ||
          box.bottom < p.top - OVERHANG.top ||
          box.top > p.bottom + OVERHANG.bottom
        ) {
          el.style.clipPath = "inset(0 0 100% 0)"
          continue
        }
        const ct = Math.max(p.top - box.top, -OVERHANG.top)
        const cl = Math.max(p.left - box.left, -OVERHANG.left)
        const crr = Math.max(box.right - p.right, -OVERHANG.right)
        const cb = Math.max(box.bottom - p.bottom, -OVERHANG.bottom)
        el.style.clipPath = `inset(${ct}px ${crr}px ${cb}px ${cl}px)`
      }
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    map.on("move", schedule)
    window.addEventListener("scroll", schedule, { passive: true })
    schedule()
    return () => {
      u1()
      u2()
      map.off("move", schedule)
      window.removeEventListener("scroll", schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [snap, map, boundsRef, sx, sy])

  if (snap) return null
  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.veil} aria-hidden />
      {/* crosshair guides — full-height verticals at the plate's left/right,
          full-width horizontals at its top/bottom; same styling as pane
          borders */}
      <span data-cxvl className={`${styles.cx} ${styles.cxV}`} aria-hidden />
      <span data-cxvr className={`${styles.cx} ${styles.cxV}`} aria-hidden />
      <span data-cxht className={`${styles.cx} ${styles.cxH}`} aria-hidden />
      <span data-cxhb className={`${styles.cx} ${styles.cxH}`} aria-hidden />
      <div data-plate className={styles.plate} style={{ width: PLATE.w, height: PLATE.h }}>
        <Note asChild>
          <span className={styles.tagTl}>{tagTl}</span>
        </Note>
        {tagTr && (
          <Note asChild>
            <span className={styles.tagTr}>{tagTr}</span>
          </Note>
        )}
        <span className={styles.dot} />
      </div>
      <div data-furniture className={styles.furniture} style={{ width: PLATE.w, height: PLATE.h }}>
        <Caption asChild>
          <span className={styles.north}>N ↑</span>
        </Caption>
        <span ref={coordsRef} className={styles.coords} />
      </div>
    </div>
  )
}

/** Pick nearest the plate centre (caption) + the set inside the reveal
 * radius (pick-list highlight). Samples per frame, re-renders only on
 * membership change. */
export function usePlatePicks(
  sx: MotionValue<number>,
  sy: MotionValue<number>,
  picks: ArchSummary[],
  map: MapRef | null,
) {
  const [nearest, setNearest] = useState<ArchSummary | null>(null)
  const [active, setActive] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    if (!map || !picks.length) return
    let raf = 0
    const update = () => {
      raf = 0
      const cx = sx.get()
      const cy = sy.get()
      let best: ArchSummary | null = null
      let bestD = Infinity
      const inside: string[] = []
      for (const a of picks) {
        const p = map.project([a.coordinates.lng, a.coordinates.lat])
        const d = (p.x - cx) ** 2 + (p.y - cy) ** 2
        if (d < bestD) {
          bestD = d
          best = a
        }
        if (d < REVEAL_R ** 2) inside.push(a.slug)
      }
      setNearest((prev) => (prev?.slug === (best as ArchSummary | null)?.slug ? prev : best))
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
    map.on("move", schedule)
    schedule()
    return () => {
      u1()
      u2()
      map.off("move", schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [map, sx, sy, picks])

  return { nearest, active }
}
