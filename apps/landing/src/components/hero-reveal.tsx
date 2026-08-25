import { useEffect, useRef, useState } from "react"
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from "framer-motion"
import { useMap } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import { useLandingStage } from "./stage"
import markerStyles from "./index-photo-markers.module.css"
import styles from "./hero-reveal.module.css"

/**
 * Hero cursor reveal (prototype winner reveal-D "Plate crop"). The hero's
 * bare Paris map sits under ONE dim layer: a diagonal ink gradient built
 * into the map's upper layer (the old hero grade, moved here) with the
 * plate's rect punched out — so the revealed map is fully bright, no second
 * overlay on top. The photo markers render fully but are clipped to the
 * plate rect (per-marker inset clip-path), cropping at the edge.
 * Everything fades with the hero scene fade; the hero→index handoff keeps
 * the gradient (now here) and the layer morph.
 *
 * Snap mode (touch / reduced motion) has no cursor: the component renders
 * nothing and IndexPhotoMarkers shows the picks unclipped as the fallback.
 */

const PLATE = { w: 360, h: 280 }

/** The photo marker's pin and drop-shadow paint OUTSIDE the marker content's
 * border box (pin at top: -10px, tilt + shadow a few px each side) — inset()
 * accepts negative values, so let the clip expand past the box by the
 * overhang instead of shaving the pin. */
const OVERHANG = { top: 14, right: 10, bottom: 10, left: 10 }

export function HeroReveal({
  picks,
  city,
}: {
  picks: ArchSummary[]
  city: string
}) {
  const { fade, mode } = useLandingStage()
  const heroFade = fade("hero")
  const sx = useSpring(useMotionValue(window.innerWidth * 0.62), { stiffness: 130, damping: 22 })
  const sy = useSpring(useMotionValue(window.innerHeight * 0.42), { stiffness: 130, damping: 22 })
  const [inside, setInside] = useState(0)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      sx.set(e.clientX)
      sy.set(e.clientY)
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [sx, sy])

  const x = useTransform(sx, (v) => v - PLATE.w / 2)
  const y = useTransform(sy, (v) => v - PLATE.h / 2)

  // snap mode (touch / reduced motion) has no cursor — no plate or veil; the
  // markers show unclipped as the static fallback
  if (mode === "snap") return null

  return (
    <div className={styles.root}>
      <PlateVars sx={sx} sy={sy} heroFade={heroFade} />
      <motion.div className={styles.veil} style={{ opacity: heroFade }} aria-hidden />
      <motion.div
        className={styles.plate}
        style={{ x, y, width: PLATE.w, height: PLATE.h, opacity: heroFade }}
      >
        <span className={`hand ${styles.tagCity}`}>{city}</span>
        <span className={styles.tagCount}>
          {inside} / {picks.length}
        </span>
      </motion.div>
      <HeroClipDriver sx={sx} sy={sy} heroFade={heroFade} onInside={setInside} />
    </div>
  )
}

/** Writes the plate rect edges as CSS vars (px) for the veil's clip-path
 * hole (a transform can't drive a polygon). */
function PlateVars({
  sx,
  sy,
}: {
  sx: ReturnType<typeof useSpring>
  sy: ReturnType<typeof useSpring>
  heroFade: ReturnType<ReturnType<typeof useLandingStage>["fade"]>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const write = () => {
    const el = ref.current?.parentElement
    if (!el) return
    el.style.setProperty("--pl", `${sx.get() - PLATE.w / 2}px`)
    el.style.setProperty("--pt", `${sy.get() - PLATE.h / 2}px`)
    el.style.setProperty("--pr", `${sx.get() + PLATE.w / 2}px`)
    el.style.setProperty("--pb", `${sy.get() + PLATE.h / 2}px`)
  }
  useMotionValueEvent(sx, "change", write)
  useMotionValueEvent(sy, "change", write)
  useEffect(write)
  return <div ref={ref} aria-hidden style={{ display: "none" }} />
}

/** Clips the photo markers to the plate rect while the hero owns the screen.
 * Below hero fade 0.5 (outgoing transition) clips release — the markers
 * crossfade in via the index fade while the plate dissolves. */
function HeroClipDriver({
  sx,
  sy,
  heroFade,
  onInside,
}: {
  sx: ReturnType<typeof useSpring>
  sy: ReturnType<typeof useSpring>
  heroFade: ReturnType<ReturnType<typeof useLandingStage>["fade"]>
  onInside: (n: number) => void
}) {
  const { map } = useMap()

  useEffect(() => {
    if (!map) return
    let raf = 0
    const update = () => {
      raf = 0
      const active = heroFade.get() >= 0.5
      let insideCount = 0
      const contents = Array.from(
        document.querySelectorAll<HTMLElement>(".maplibregl-marker"),
      )
        .map((root) => root.firstElementChild as HTMLElement | null)
        .filter((el): el is HTMLElement => !!el && el.classList.contains(markerStyles.marker))
      contents.forEach((el) => {
        if (!active) {
          if (el.style.clipPath) el.style.clipPath = ""
          return
        }
        const root = el.parentElement!
        const l = sx.get() - PLATE.w / 2
        const r = sx.get() + PLATE.w / 2
        const t = sy.get() - PLATE.h / 2
        const b = sy.get() + PLATE.h / 2
        const box = root.getBoundingClientRect()
        // fully-outside test against the overhang-extended box
        if (
          box.right < l - OVERHANG.left ||
          box.left > r + OVERHANG.right ||
          box.bottom < t - OVERHANG.top ||
          box.top > b + OVERHANG.bottom
        ) {
          el.style.clipPath = "inset(0 0 100% 0)"
          return
        }
        insideCount++
        // negative insets grow the clip past the content box (pin, shadow)
        const ct = Math.max(t - box.top, -OVERHANG.top)
        const cl = Math.max(l - box.left, -OVERHANG.left)
        const crr = Math.max(box.right - r, -OVERHANG.right)
        const cb = Math.max(box.bottom - b, -OVERHANG.bottom)
        el.style.clipPath = `inset(${ct}px ${crr}px ${cb}px ${cl}px)`
      })
      onInside(active ? insideCount : 0)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    const u3 = heroFade.on("change", schedule)
    map.on("move", schedule)
    schedule()
    return () => {
      u1()
      u2()
      u3()
      map.off("move", schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [map, sx, sy, heroFade, onInside])

  return null
}
