// Cursor-plate reveal over the spine's map layer. The veil, plate and
// marker clips render THROUGH the spine's map portal (they ride the map
// layer, not the scrolling flow wrapper); the portal root doubles as the
// surface every offset is written against. All coordinates are
// surface-local / viewport px each frame; the plate clamps to `boundsRef`
// so it stays inside the reveal pane. Past the hero hold the whole reveal
// rides up with the page 1:1 (exitYpx), unveiling the map from the top.
import { useEffect, useRef, useState, type RefObject } from "react"
import { createPortal } from "react-dom"
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "framer-motion"
import type { MapRef } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import { Caption, Note } from "@nolli/ui"
import { useMapPortal } from "@/spine/spine"
import { useIsMobile } from "@/lib/use-is-mobile"
import markerStyles from "./index.markers.module.css"
import styles from "./hero-reveal.module.css"

export const PLATE = { w: 360, h: 280 }

/** Hero hold height in vh — the reveal rides up with the page from here. */
const HOLD_VH = 100

/** Vertical px the reveal root rides up with the page once the hero hold
 * ends (scene-local vh past the hold): the veil, plate and crosshairs leave
 * THROUGH THE TOP with the page instead of lingering at the cursor — 1:1
 * with scroll, clamped below at 0, no easing. */
const exitYpx = (localVh: number) =>
  -Math.max(0, localVh - HOLD_VH) * (window.innerHeight / 100)

/** Class applied to every photo marker the hero mounts — the clip driver
 * matches on it (and it exempts the markers from the spine's
 * cluster stand-down). */
export const PHOTO_MARKER_CLASS = markerStyles.heroMarker

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
 * Renders into the spine's map portal; the portal root is the surface. The
 * plate roams `boundsRef` if given (a pane), else the surface. `local` is the
 * hero scene's local scroll in vh — past the hold (100vh) the whole reveal
 * rides up with the page, unveiling the map from the top. Snap mode (touch /
 * reduced motion) renders nothing — markers show unclipped. */
export function CursorReveal({
  boundsRef,
  map,
  sx,
  sy,
  local,
  tagTl = "Architecture",
  tagTr,
}: {
  boundsRef?: RefObject<HTMLDivElement | null>
  map: MapRef | null
  sx: MotionValue<number>
  sy: MotionValue<number>
  local: MotionValue<number>
  tagTl?: string
  tagTr?: string
}) {
  const reduced = useReducedMotion()
  const snap = useIsMobile() || !!reduced
  const mapPortal = useMapPortal()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const clampEl = () => boundsRef?.current ?? rootRef.current

  // veil hole vars (surface-local) + plate transform + crosshair lines +
  // the page-exit ride, written per frame so scroll and resize stay correct
  // without listeners
  useEffect(() => {
    if (snap || !mapPortal) return
    const root = rootRef.current
    if (!root) return
    let raf = 0
    const write = () => {
      raf = 0
      const el = clampEl()
      if (!el) return
      const ey = exitYpx(local.get())
      root.style.transform = ey ? `translateY(${ey}px)` : ""
      const p = plateRect(el, root, sx, sy)
      // rect is measured WITH the exit ride applied — un-translate it so
      // every offset below is surface-local and rides the root for free
      const top0 = p.rect.top - ey
      const ox = p.left - p.rect.left
      const oy = p.top - top0
      root.style.setProperty("--pl", `${ox}px`)
      root.style.setProperty("--pt", `${oy}px`)
      root.style.setProperty("--pr", `${p.right - p.rect.left}px`)
      root.style.setProperty("--pb", `${p.bottom - top0}px`)
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
      setPx("[data-cxhb]", "top", p.bottom - top0)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(write)
    }
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    const u3 = local.on("change", schedule)
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    schedule()
    return () => {
      u1()
      u2()
      u3()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      if (raf) cancelAnimationFrame(raf)
    }
    // mapPortal: the effect re-arms when the portal mounts the root
  }, [snap, mapPortal, boundsRef, sx, sy, local])

  // coords readout — plate-centre lat/lng straight to the DOM (the plate's
  // ridden position once the exit ride has begun)
  const coordsRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (snap || !map || !mapPortal) return
    const update = () => {
      const el = clampEl()
      const surface = rootRef.current
      if (!el || !surface || !coordsRef.current) return
      const p = plateRect(el, surface, sx, sy)
      const ey = exitYpx(local.get())
      const c = map.unproject([(p.left + p.right) / 2, (p.top + p.bottom) / 2 + ey])
      coordsRef.current.textContent = `${Math.abs(c.lat).toFixed(4)}° ${c.lat >= 0 ? "N" : "S"}  ${Math.abs(c.lng).toFixed(4)}° ${c.lng >= 0 ? "E" : "W"}`
    }
    const schedule = () => requestAnimationFrame(update)
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    const u3 = local.on("change", schedule)
    schedule()
    return () => {
      u1()
      u2()
      u3()
    }
  }, [snap, map, mapPortal, boundsRef, sx, sy, local])

  // clip photo markers to the plate rect (ridden up with the exit ride —
  // the markers stay in the map layer, only the plate moves)
  useEffect(() => {
    if (snap || !map || !mapPortal) return
    let raf = 0
    const update = () => {
      raf = 0
      const el = clampEl()
      const surface = rootRef.current
      if (!el || !surface) return
      const p = plateRect(el, surface, sx, sy)
      const ey = exitYpx(local.get())
      const top = p.top + ey
      const bottom = p.bottom + ey
      // scoped to THIS map — any other map on the page keeps its markers
      // unclipped
      const contents = Array.from(
        map.getContainer().querySelectorAll<HTMLElement>(".maplibregl-marker"),
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
          box.bottom < top - OVERHANG.top ||
          box.top > bottom + OVERHANG.bottom
        ) {
          el.style.clipPath = "inset(0 0 100% 0)"
          continue
        }
        const ct = Math.max(top - box.top, -OVERHANG.top)
        const cl = Math.max(p.left - box.left, -OVERHANG.left)
        const crr = Math.max(box.right - p.right, -OVERHANG.right)
        const cb = Math.max(box.bottom - bottom, -OVERHANG.bottom)
        el.style.clipPath = `inset(${ct}px ${crr}px ${cb}px ${cl}px)`
      }
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    const u3 = local.on("change", schedule)
    map.on("move", schedule)
    window.addEventListener("scroll", schedule, { passive: true })
    schedule()
    return () => {
      u1()
      u2()
      u3()
      map.off("move", schedule)
      window.removeEventListener("scroll", schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [snap, map, mapPortal, boundsRef, sx, sy, local])

  if (snap) return null
  if (!mapPortal) return null
  return createPortal(
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
    </div>,
    mapPortal,
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
