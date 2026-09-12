// Hero hold scene on the spine. The spine's map layer IS the hero map; photo
// markers render through the map portal so they ride the layer, while the
// reveal (veil/plate/crosshairs) renders in this tree — first child of the
// sticky section, so it pins during the hold and rides up with the page
// through the transition, unveiling the map. Layout: the big map cell
// carries the lede, vertically centered; the plate column sits on the RIGHT
// — arch list in its growing top cell, the CTA pane below (the whole
// pane is the CTA, sized like the plate; arming rolls the whole cell); the
// mirrored title-block strip closes the scene (Info left, plate-wide, then
// fill, then Scale + Sheet right, under the column). The reveal bounds span
// everything above the strip.
import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, type MotionValue } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { Body2, H1, H3, TRANSITION_SHORT, useIsMobile } from "@nolli/ui"
import { ROLL_EASE } from "@/lib/constants"
import type { MapRef } from "@nolli/map"
import type { ArchSummary } from "@/lib/landing-data"
import type { SceneCamera } from "@nolli/map"
import { useSceneScroll, useSpineMap } from "@/spine/spine"
import { TRANSITION_LEAD_VH, type HoldScene } from "@/spine/timeline"
import { APP_URL, HERO_FIT_PAD } from "@/lib/constants"
import { fitCamera } from "@/lib/camera"
import type { LandingData } from "@/lib/landing-data"
import { PhotoMarkers } from "@/components/photo-markers"
import { CursorReveal, HERO_MARKER_CLASS, PLATE, useCursorSprings, usePlateArchs } from "./hero-reveal"
import { HSplit, Pane, Screen, VSplit } from "./grid"
import { MapTransition } from "./map-transition"
import styles from "./hero.module.css"

export const heroHold = (data: LandingData): HoldScene => ({
  kind: "hold",
  id: "hero",
  shape: "[data-spine-shape='hero']",
  heightVh: SCENE_VH,
  Component: () => <HeroScene data={data} />,
})

/** The hero's camera, fit over its deck pins — single source for the
 * spine's boot placement and the hero's exit transition target. */
export const heroCamera = (data: LandingData): SceneCamera =>
  fitCamera(
    data.heroArchs.map((p) => p.coordinates),
    { width: window.innerWidth, height: window.innerHeight },
    HERO_FIT_PAD,
  )

const SCENE_VH = 100

const BOTTOM_BAR_HEIGHT = "5rem"

const CTA_BUFFER = 90

function HeroScene({ data }: { data: LandingData }) {
  const map = useSpineMap()
  const archs = data.heroArchs
  const { sx, sy } = useCursorSprings()
  const { nearest, active } = usePlateArchs(sx, sy, archs, map)
  // reveal bounds = the whole top area above the strip; the camera fits to
  // the stage alone so pins stay clear of the column
  const boundsRef = useRef<HTMLDivElement | null>(null)
  const cam = useMemo(() => heroCamera(data), [data])

  // the plate IS the cursor while the pointer is inside the scene — plain
  // css on the section (snap mode never hides the system cursor)
  const reduced = useReducedMotion()
  const snap = useIsMobile() || !!reduced

  const localScrollDist = useSceneScroll()
  const [markersOn, setMarkersOn] = useState(() => localScrollDist.get() < SCENE_VH)
  useMotionValueEvent(localScrollDist, "change", (v) => setMarkersOn(v < SCENE_VH))

  const scale = useScaleText(map, sy)

  return (
    <section data-spine-shape="hero" className={snap ? styles.hero : `${styles.hero} ${styles.cursorHide}`}>
      <CursorReveal
        boundsRef={boundsRef}
        sx={sx}
        sy={sy}
        tagTr={data.heroCity.name}
      />
      <PhotoMarkers archs={archs} on={markersOn} className={HERO_MARKER_CLASS} />
      <MapTransition untilVh={SCENE_VH - TRANSITION_LEAD_VH} target={cam} />
      <Screen className={styles.screen}>
        <HSplit>
          <Pane size="var(--size-header-height)" />
          <VSplit ref={boundsRef}>
            <Pane className={styles.heroPane}>
              <Lede />
            </Pane>
            <Pane size={`${PLATE.w}px`}>
              <HSplit>
                <Pane>
                  <ul className={styles.archList}>
                    {archs.map((p, i) => (
                      <li key={p.slug} className={styles.archRow} data-active={`${active.has(p.slug)}`}>
                        <span className={styles.archNum}>{String(i + 1).padStart(2, "0")}</span>
                        <Body2 asChild>
                          <span>{p.name}</span>
                        </Body2>
                      </li>
                    ))}
                  </ul>
                </Pane>
                <Pane size={`${PLATE.h}px`} filled>
                  <CtaPane sx={sx} sy={sy} />
                </Pane>
              </HSplit>
            </Pane>
          </VSplit>
          <Pane size={BOTTOM_BAR_HEIGHT}>
            <VSplit>
              <InfoBlock nearest={nearest} />
              <Pane filled />
              <Pane size={`${PLATE.w / 2}px`} className={styles.blockPane}>
                <span className={styles.monoLabel}>Scale</span>
                <LiveValue>{scale}</LiveValue>
              </Pane>
              <Pane size={`${PLATE.w / 2}px`} className={styles.blockPane}>
                <span className={styles.monoLabel}>Sheet</span>
                <span className={styles.blockValue}>
                  {data.heroCity.country ? `${data.heroCity.country} · ` : ""}
                  {data.heroCity.name}
                </span>
              </Pane>
            </VSplit>
          </Pane>
        </HSplit>
      </Screen>
    </section>
  )
}

const HEADLINE_LINES = [
  <>The <span className={styles.accent}>Map</span> Where</>,
  <><span className={styles.accent}>Architectures</span> Lives.</>,
]

const SECONDARY = "You likely can name hundreds of Architectures, but can you pin them on map? Nolli is the map for Architectures."

function Lede() {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={styles.lede}
      initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
    >
      <H1>
        {HEADLINE_LINES.map((line, i) => (
          <motion.div
            className={styles.headlineLine}
            key={i}
            initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.35, ease: "easeOut" }}
          >
            {line}
          </motion.div>
        ))}
      </H1>
      <Body2 asChild>
        <p className={styles.secondary}>{SECONDARY}</p>
      </Body2>
    </motion.div>
  )
}

/** The CTA — the pane itself.
 * On the cursor-less screen the plate is the pointer: when it sweeps deep enough
 * into the pane, the whole cell rolls — the resting face (label + hint
 * over the sheet tile) slides out, the armed face (accent ground, arrow)
 * slides in. The cursor arrives from the big cell to the LEFT, so the
 * arming buffer guards the pane's left and top edges. */
function CtaPane({ sx, sy }: { sx: MotionValue<number>; sy: MotionValue<number> }) {
  const ref = useRef<HTMLAnchorElement | null>(null)
  const [deep, setDeep] = useState(false)
  const [focused, setFocused] = useState(false)
  const reduced = useReducedMotion()
  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const x = sx.get()
      const y = sy.get()
      const inDistance =
        x >= r.left + CTA_BUFFER &&
        x <= r.right &&
        y >= r.top + CTA_BUFFER &&
        y <= r.bottom
      setDeep(inDistance)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    const u1 = sx.on("change", schedule)
    const u2 = sy.on("change", schedule)
    window.addEventListener("scroll", schedule, { passive: true })
    schedule()
    return () => {
      u1()
      u2()
      window.removeEventListener("scroll", schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [sx, sy])
  const armed = deep || focused
  // entry delay is for the boot roll only; later face swaps run immediately
  const booted = useRef(false)
  useEffect(() => {
    booted.current = true
  }, [])
  return (
    <motion.a
      ref={ref}
      data-armed={armed}
      className={styles.ctaPane}
      href={APP_URL}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={armed ? "armed" : "rest"}
          className={styles.ctaFace}
          data-armed={armed}
          initial={
            reduced
              ? false
              : booted.current
                ? { y: "100%" }
                : { opacity: 0, y: 10, filter: "blur(4px)" }
          }
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={reduced ? undefined : { y: "-100%" }}
          transition={
            booted.current
              ? { duration: TRANSITION_SHORT, ease: ROLL_EASE }
              : { duration: TRANSITION_SHORT, delay: 0.85, ease: "easeOut" }
          }
        >
          <H3 className={styles.ctaText}>
            Explore Nolli
            <ArrowUpRight className={styles.ctaIcon} size={24} aria-hidden />
          </H3>
        </motion.span>
      </AnimatePresence>
    </motion.a>
  )
}

/** Info block — the plate's nearest work rolls through the cell as the
 * plate moves to a new arch. Plate-wide, flush with the column's edge. */
function InfoBlock({ nearest }: { nearest: ArchSummary | null }) {
  const reduced = useReducedMotion()
  return (
    <Pane size={`${PLATE.w}px`} className={styles.blockPane}>
      <span className={styles.monoLabel}>Info</span>
      <div className={styles.rollClip}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={nearest?.slug ?? "none"}
            initial={reduced ? false : { y: "70%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? undefined : { y: "-70%", opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className={`${styles.blockValue} ${styles.blockValueBig}`}>
              {nearest?.name ?? ""}
            </div>
            <div className={styles.blockValue}>
              {nearest ? `${nearest.architect}, ${nearest.year}` : ""}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Pane>
  )
}

/** Instrument cells blink on change — value swap reads as a readout, not an
 * animation. */
function LiveValue({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      className={styles.blockValue}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12 }}
    >
      {children}
    </motion.span>
  )
}

/** Nominal map scale at the plate ("1:23 000"), live from zoom + latitude. */
function useScaleText(map: MapRef | null, sy: MotionValue<number>) {
  const [text, setText] = useState("")
  useEffect(() => {
    if (!map) return
    let last = ""
    const update = () => {
      const c = map.unproject([0, sy.get()])
      const mpp = (156543.03392 * Math.cos((c.lat * Math.PI) / 180)) / 2 ** map.getZoom()
      const denom = Math.round((mpp * 3779.5) / 1000) * 1000
      const t = `1:${denom.toLocaleString("en-US").replace(/,/g, " ")}`
      if (t !== last) {
        last = t
        setText(t)
      }
    }
    const u = sy.on("change", update)
    map.on("move", update)
    update()
    return () => {
      u()
      map.off("move", update)
    }
  }, [map, sy])
  return text
}
