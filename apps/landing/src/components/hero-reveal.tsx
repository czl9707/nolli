import { useEffect } from "react"
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from "framer-motion"
import { useMap } from "@nolli/map"
import { useLandingStage } from "./stage"
import markerStyles from "./index-photo-markers.module.css"
import styles from "./hero-reveal.module.css"

/**
 * Hero cursor reveal (prototype winner reveal-D "Plate crop"). The hero's
 * bare Paris map sits under a dim veil punched by the plate that follows the
 * cursor; the photo markers render fully but are clipped to the plate rect
 * (per-marker inset clip-path), so straddling markers crop at the edge.
 * Everything fades with the hero scene fade; the hero→index grade and layer
 * morph are untouched (spine unchanged apart from the hero camera).
 *
 * Snap mode (touch / reduced motion) has no cursor: the component renders
 * nothing and IndexPhotoMarkers shows the picks unclipped as the fallback.
 */

const PLATE = { w: 360, h: 280 }

export function HeroReveal() {
  const { fade, mode } = useLandingStage()
  const heroFade = fade("hero")
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

  const x = useTransform(sx, (v) => v - PLATE.w / 2)
  const y = useTransform(sy, (v) => v - PLATE.h / 2)

  // snap mode (touch / reduced motion) has no cursor — no plate or veil; the
  // markers show unclipped as the static fallback
  if (mode === "snap") return null

  return (
    <motion.div
      className={styles.plate}
      style={{ x, y, width: PLATE.w, height: PLATE.h, opacity: heroFade }}
      aria-hidden
    >
      <HeroClipDriver sx={sx} sy={sy} heroFade={heroFade} />
    </motion.div>
  )
}

/** Clips the photo markers to the plate rect while the hero owns the screen.
 * Below hero fade 0.5 (outgoing transition) clips release — the markers
 * crossfade in via the index fade while the plate dissolves. */
function HeroClipDriver({
  sx,
  sy,
  heroFade,
}: {
  sx: ReturnType<typeof useSpring>
  sy: ReturnType<typeof useSpring>
  heroFade: ReturnType<ReturnType<typeof useLandingStage>["fade"]>
}) {
  const { map } = useMap()

  useEffect(() => {
    if (!map) return
    let raf = 0
    const update = () => {
      raf = 0
      const active = heroFade.get() >= 0.5
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
        if (box.right < l || box.left > r || box.bottom < t || box.top > b) {
          el.style.clipPath = "inset(0 0 100% 0)"
          return
        }
        const ct = Math.max(0, t - box.top)
        const cl = Math.max(0, l - box.left)
        const crr = Math.max(0, box.right - r)
        const cb = Math.max(0, box.bottom - b)
        el.style.clipPath = `inset(${ct}px ${crr}px ${cb}px ${cl}px)`
      })
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
  }, [map, sx, sy, heroFade])

  return null
}
