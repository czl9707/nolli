import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion"
import { useMapPortal, useSceneCamera, useSceneScroll, useStage, useStageMap } from "@/stage/hooks"
import { CLUSTER_CITY, HERO_CAMERA } from "@/lib/constants"
import type { LandingData } from "@/lib/landing-data"
import type { SceneFactory } from "@/lib/scene"
import { HeroChrome } from "./hero.chrome"
import markerStyles from "./index.markers.module.css"
import revealStyles from "./hero.reveal.module.css"
import styles from "./hero.module.css"

const FULL = { x: 0, y: 0, w: 1, h: 1 }

const HERO_KEYFRAMES = [
  { at: 0, layer: FULL, camera: HERO_CAMERA },
  { at: 108, layer: FULL },
]

/** Hero: bare Paris map under a cursor-plate reveal; screen chrome (headline,
 * pick list, nearest caption, plate furniture) dwells around it, then the
 * layer morphs into the index slot over the last 72vh. */
export const heroScene: SceneFactory = ({ data }) => ({
  id: "hero",
  heightVh: 180,
  keyframes: HERO_KEYFRAMES,
  Component: () => <HeroScene data={data} />,
})

function HeroScene({ data }: { data: LandingData }) {
  useSceneCamera(HERO_KEYFRAMES)
  // plate springs live here so the chrome can read the plate position
  const sx = useSpring(useMotionValue(window.innerWidth * 0.62), { stiffness: 130, damping: 22 })
  const sy = useSpring(useMotionValue(window.innerHeight * 0.42), { stiffness: 130, damping: 22 })
  return (
    <section className={styles.scene}>
      <HeroReveal sx={sx} sy={sy} />
      <HeroChrome data={data} sx={sx} sy={sy} />
    </section>
  )
}

// ── cursor-plate reveal ──────────────

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

export const PLATE = { w: 360, h: 280 }

/** The photo marker's pin and drop-shadow paint OUTSIDE the marker content's
 * border box (pin at top: -10px, tilt + shadow a few px each side) — inset()
 * accepts negative values, so let the clip expand past the box by the
 * overhang instead of shaving the pin. */
const OVERHANG = { top: 14, right: 10, bottom: 10, left: 10 }

function HeroReveal({
  sx,
  sy,
}: {
  sx: ReturnType<typeof useSpring>
  sy: ReturnType<typeof useSpring>
}) {
  const { mode } = useStage()
  const heroLocal = useSceneScroll()
  // 1 through dwell (108vh), linear to 0 by 144vh
  const heroFade = useTransform(heroLocal, (v) =>
    v <= 108 ? 1 : Math.max(0, 1 - (v - 108) / 36),
  )

  // the veil rides the page like the old flow-mounted grade did: 200svh tall,
  // translated up 1:1 with scroll, so the gradient EXITS THROUGH THE TOP
  // instead of fading in place
  const { scrollY } = useScroll()
  const veilY = useTransform(scrollY, (v) => -v)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      sx.set(e.clientX)
      sy.set(e.clientY)
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [sx, sy])

  // the plate IS the cursor in this scene — hide the system one while the
  // hero owns the screen (links/buttons keep their own UA cursors). Snap
  // mode has no plate, so the system cursor stays.
  useEffect(() => {
    const apply = (v: number) => {
      document.body.style.cursor = v > 0.5 && mode === "scrub" ? "none" : ""
    }
    apply(heroFade.get())
    const un = heroFade.on("change", apply)
    return () => {
      un()
      document.body.style.cursor = ""
    }
  }, [heroFade, mode])

  const x = useTransform(sx, (v) => v - PLATE.w / 2)
  const y = useTransform(sy, (v) => v - PLATE.h / 2)

  const mapPortal = useMapPortal()

  // snap mode (touch / reduced motion) has no cursor — no plate or veil; the
  // markers show unclipped as the static fallback
  if (mode === "snap") return null
  if (!mapPortal) return null
  return createPortal(
    <div className={revealStyles.root}>
      <PlateVars sx={sx} sy={sy} scrollY={scrollY} />
      <motion.div
        className={revealStyles.veil}
        style={{ opacity: heroFade, y: veilY }}
        aria-hidden
      />
      <motion.div
        className={revealStyles.plate}
        style={{ x, y, width: PLATE.w, height: PLATE.h, opacity: heroFade }}
      >
        <span className={`hand ${revealStyles.tagTl}`}>Architecture</span>
        <span className={`hand ${revealStyles.tagTr}`}>{CLUSTER_CITY}</span>
        <span className={revealStyles.dot} />
      </motion.div>
      <HeroClipDriver sx={sx} sy={sy} heroFade={heroFade} />
    </div>,
    mapPortal,
  )
}

/** Writes the plate rect edges as CSS vars (px) for the veil's mask hole.
 * The veil translates up with page scroll, so the hole's VERTICAL position
 * is written in veil-local coords (viewport + scrollY) to stay under the
 * plate; a transform can't drive a mask polygon. */
function PlateVars({
  sx,
  sy,
  scrollY,
}: {
  sx: ReturnType<typeof useSpring>
  sy: ReturnType<typeof useSpring>
  scrollY: MotionValue<number>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const write = () => {
    const el = ref.current?.parentElement
    if (!el) return
    const s = scrollY.get()
    el.style.setProperty("--pl", `${sx.get() - PLATE.w / 2}px`)
    el.style.setProperty("--pt", `${sy.get() - PLATE.h / 2 + s}px`)
    el.style.setProperty("--pr", `${sx.get() + PLATE.w / 2}px`)
    el.style.setProperty("--pb", `${sy.get() + PLATE.h / 2 + s}px`)
  }
  useMotionValueEvent(sx, "change", write)
  useMotionValueEvent(sy, "change", write)
  useMotionValueEvent(scrollY, "change", write)
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
}: {
  sx: ReturnType<typeof useSpring>
  sy: ReturnType<typeof useSpring>
  heroFade: MotionValue<number>
}) {
  const map = useStageMap()

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
        // negative insets grow the clip past the content box (pin, shadow)
        const ct = Math.max(t - box.top, -OVERHANG.top)
        const cl = Math.max(l - box.left, -OVERHANG.left)
        const crr = Math.max(box.right - r, -OVERHANG.right)
        const cb = Math.max(box.bottom - b, -OVERHANG.bottom)
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
