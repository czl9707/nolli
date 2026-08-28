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
import type { ArchSummary } from "@nolli/data"
import { MapContext, PhotoMarker } from "@nolli/map"
import { HeroChrome } from "./hero.chrome"
import markerStyles from "./index.markers.module.css"
import revealStyles from "./hero.reveal.module.css"
import styles from "./hero.module.css"

const FULL = { x: 0, y: 0, w: 1, h: 1 }

const DWELL_VH = 108

/** Vertical px offset that rides the veil's 1:1 page exit once the hero's
 * dwell ends — the plate leaves THROUGH THE TOP with the veil instead of
 * lingering at the cursor. Shared by the plate transform, the veil's mask
 * hole, and the marker clip driver so all three stay glued. */
const exitYpx = (scrollY: number) =>
  -Math.max(0, scrollY - (DWELL_VH / 100) * window.innerHeight)

const HERO_KEYFRAMES = [
  { at: 0, layer: FULL, camera: HERO_CAMERA },
  { at: DWELL_VH, layer: FULL },
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
      <HeroPhotoMarkers picks={data.indexPhotos} />
      <HeroChrome data={data} sx={sx} sy={sy} />
    </section>
  )
}

/** Hero-owned photo markers. Each scene owns the markers it shows: the hero
 * mounts its Paris picks (clipped to the cursor plate by HeroClipDriver),
 * fades them out with the veil exit, and hands a BARE map to the index —
 * whose own markers arrive after its landing flight. The fade vars are
 * per-owner (--hero-photo-o here, --index-photo-o in the index scene); the
 * shared container flags are gated on global scroll at the scene seam. */
function HeroPhotoMarkers({ picks }: { picks: ArchSummary[] }) {
  const stage = useStage()
  const local = useSceneScroll()
  // 1 through dwell (108vh), 0 by 126vh — fully gone when the clip driver
  // releases (heroFade 0.5), so the markers never flash unclipped on the
  // bare map during the exit
  const o = useTransform(local, (v) =>
    v <= DWELL_VH ? 1 : Math.max(0, 1 - (v - DWELL_VH) / 18),
  )
  // the index scene takes over the flags at its own start
  const seam = (stage.ranges["index"]?.startVh ?? Infinity) - 5

  const map = useStageMap()
  useEffect(() => {
    if (!map) return
    const el = map.getContainer()
    const apply = () => {
      const v = o.get()
      el.style.setProperty("--hero-photo-o", String(v))
      if (stage.scrollVh.get() > seam) return
      const on = v > 0.001
      const photoState = on ? "on" : "off"
      if (el.dataset.photoMarkers !== photoState) el.dataset.photoMarkers = photoState
      // plate gating releases as the clip does (heroFade 0.5) so the tail
      // fades through the var instead of pinning at opacity 1
      const plateState = v > 0.5 ? "on" : "off"
      if (el.dataset.heroPlate !== plateState) el.dataset.heroPlate = plateState
    }
    apply()
    const un1 = o.on("change", apply)
    const un2 = stage.scrollVh.on("change", apply)
    return () => {
      un1()
      un2()
    }
  }, [map, o, stage, seam])

  const mapPortal = useMapPortal()
  if (!mapPortal || !map) return null
  return createPortal(
    <MapContext.Provider value={{ map, isLoaded: !!map }}>
      {picks.map((a) => (
        <PhotoMarker key={a.slug} building={a} className={markerStyles.heroMarker} />
      ))}
    </MapContext.Provider>,
    mapPortal,
  )
}

// ── cursor-plate reveal ──────────────

/**
 * Hero cursor reveal (prototype winner reveal-D "Plate crop"). The hero's
 * bare Paris map sits under ONE dim layer: a diagonal ink gradient built
 * into the map's upper layer (the old hero grade, moved here) with the
 * plate's rect punched out — so the revealed map is fully bright, no second
 * overlay on top. The hero's photo markers (HeroPhotoMarkers) render fully
 * but are clipped to the plate rect (per-marker inset clip-path), cropping
 * at the edge. Everything fades with the hero scene fade; the hero→index
 * handoff keeps the gradient (now here) and the layer morph, and hands over
 * a BARE map — the index mounts its own markers after its landing flight.
 *
 * Snap mode (touch / reduced motion) has no cursor: the component renders
 * nothing and the markers show unclipped as the fallback.
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
    v <= DWELL_VH ? 1 : Math.max(0, 1 - (v - DWELL_VH) / 36),
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
  // past the dwell the plate rides the veil's exit 1:1 — up through the top
  const y = useTransform(
    [sy, scrollY],
    ([cy, s]: number[]) => cy - PLATE.h / 2 + exitYpx(s),
  )

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
    // veil-local vertical = viewport + scrollY, minus the plate's exit ride
    const ey = exitYpx(s)
    el.style.setProperty("--pl", `${sx.get() - PLATE.w / 2}px`)
    el.style.setProperty("--pt", `${sy.get() + ey - PLATE.h / 2 + s}px`)
    el.style.setProperty("--pr", `${sx.get() + PLATE.w / 2}px`)
    el.style.setProperty("--pb", `${sy.get() + ey + PLATE.h / 2 + s}px`)
  }
  useMotionValueEvent(sx, "change", write)
  useMotionValueEvent(sy, "change", write)
  useMotionValueEvent(scrollY, "change", write)
  useEffect(write)
  return <div ref={ref} aria-hidden style={{ display: "none" }} />
}

/** Clips the hero's photo markers to the plate rect while the hero owns the
 * screen. Below hero fade 0.5 (outgoing transition) clips release — the
 * markers fade out through the shared var while the plate dissolves. */
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
      const ey = exitYpx(window.scrollY)
      const contents = Array.from(
        document.querySelectorAll<HTMLElement>(".maplibregl-marker"),
      )
        .map((root) => root.firstElementChild as HTMLElement | null)
        .filter((el): el is HTMLElement => !!el && el.classList.contains(markerStyles.heroMarker))
      contents.forEach((el) => {
        if (!active) {
          if (el.style.clipPath) el.style.clipPath = ""
          return
        }
        const root = el.parentElement!
        const l = sx.get() - PLATE.w / 2
        const r = sx.get() + PLATE.w / 2
        const t = sy.get() + ey - PLATE.h / 2
        const b = sy.get() + ey + PLATE.h / 2
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
