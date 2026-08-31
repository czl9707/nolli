// PROTOTYPE — cursor-plate reveal, ported from scenes/hero.tsx without the
// scroll-spine coupling: no dwell/exit ramps, the plate simply owns the
// surface while mounted. Veil hole + plate + marker clips are all written in
// surface-local / viewport coords each frame; the plate clamps to the
// surface so a cell-confined map (variant B) keeps its plate inside.
import { useEffect, useRef, useState, type RefObject } from "react"
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "framer-motion"
import type { MapRef } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import { Caption, Note } from "@nolli/ui"
import { useIsMobile } from "@/lib/use-is-mobile"
import { PHOTO_MARKER_CLASS } from "./map-surface"
import styles from "./reveal.module.css"

export const PLATE = { w: 360, h: 280 }

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

/** Plate rect in viewport px, centre clamped inside the surface. */
function plateRect(surface: HTMLElement, sx: MotionValue<number>, sy: MotionValue<number>) {
  const r = surface.getBoundingClientRect()
  const cx = Math.min(Math.max(sx.get(), r.left), r.right)
  const cy = Math.min(Math.max(sy.get(), r.top), r.bottom)
  return {
    left: cx - PLATE.w / 2,
    right: cx + PLATE.w / 2,
    top: cy - PLATE.h / 2,
    bottom: cy + PLATE.h / 2,
    rect: r,
  }
}

/** Veil + plate + furniture over one map surface, plus the marker clip
 * driver. Render inside the MapSurface (absolute, inset 0). Snap mode
 * (touch / reduced motion) renders nothing — markers show unclipped. */
export function CursorReveal({
  surfaceRef,
  map,
  sx,
  sy,
  tagTl = "Architecture",
  tagTr,
}: {
  surfaceRef: RefObject<HTMLDivElement | null>
  map: MapRef | null
  sx: MotionValue<number>
  sy: MotionValue<number>
  tagTl?: string
  tagTr?: string
}) {
  const reduced = useReducedMotion()
  const snap = useIsMobile() || !!reduced
  const rootRef = useRef<HTMLDivElement | null>(null)

  // veil hole vars (surface-local) + plate transform, written per frame so
  // scroll and resize stay correct without extra listeners
  useEffect(() => {
    if (snap) return
    const surface = surfaceRef.current
    const root = rootRef.current
    if (!surface || !root) return
    let raf = 0
    const write = () => {
      raf = 0
      const p = plateRect(surface, sx, sy)
      root.style.setProperty("--pl", `${p.left - p.rect.left}px`)
      root.style.setProperty("--pt", `${p.top - p.rect.top}px`)
      root.style.setProperty("--pr", `${p.right - p.rect.left}px`)
      root.style.setProperty("--pb", `${p.bottom - p.rect.top}px`)
      const plate = root.querySelector<HTMLElement>("[data-plate]")
      if (plate) {
        plate.style.transform = `translate(${p.left - p.rect.left}px, ${p.top - p.rect.top}px)`
      }
      const furn = root.querySelector<HTMLElement>("[data-furniture]")
      if (furn) {
        furn.style.transform = `translate(${p.left - p.rect.left}px, ${p.top - p.rect.top}px)`
      }
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
  }, [snap, surfaceRef, sx, sy])

  // coords readout — plate-centre lat/lng straight to the DOM
  const coordsRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (snap || !map) return
    const surface = surfaceRef.current
    if (!surface) return
    const update = () => {
      if (!coordsRef.current) return
      const p = plateRect(surface, sx, sy)
      const c = map.unproject([(p.left + p.right) / 2, (p.top + p.bottom) / 2])
      coordsRef.current.textContent = `${Math.abs(c.lat).toFixed(4)}° ${c.lat >= 0 ? "N" : "S"}  ${Math.abs(c.lng).toFixed(4)}° ${c.lng >= 0 ? "E" : "W"}`
    }
    const schedule = () => requestAnimationFrame(update)
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    schedule()
    return () => {
      u1()
      u2()
    }
  }, [snap, map, surfaceRef, sx, sy])

  // clip photo markers to the plate rect
  useEffect(() => {
    if (snap || !map) return
    const surface = surfaceRef.current
    if (!surface) return
    let raf = 0
    const update = () => {
      raf = 0
      const p = plateRect(surface, sx, sy)
      const contents = Array.from(
        document.querySelectorAll<HTMLElement>(".maplibregl-marker"),
      )
        .map((root) => root.firstElementChild as HTMLElement | null)
        .filter(
          (el): el is HTMLElement =>
            !!el && el.classList.contains(PHOTO_MARKER_CLASS) && el.isConnected,
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
  }, [snap, map, surfaceRef, sx, sy])

  if (snap) return null
  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.veil} aria-hidden />
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
        <span className={`${styles.tick} ${styles.tickTl}`} />
        <span className={`${styles.tick} ${styles.tickTr}`} />
        <span className={`${styles.tick} ${styles.tickBl}`} />
        <span className={`${styles.tick} ${styles.tickBr}`} />
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
