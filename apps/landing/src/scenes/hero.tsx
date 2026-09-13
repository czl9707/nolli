// Hero hold scene on the spine. The spine's map layer IS the hero map; photo
// markers render through the map portal so they ride the layer, while the
// reveal (veil/plate/crosshairs) renders in this tree — first child of the
// sticky section, so it pins during the hold and rides up with the page
// through the transition, unveiling the map. Desktop layout: the big map cell
// carries the lede, vertically centered; the plate column sits on the RIGHT
// — arch list in its growing top cell, the CTA pane below; the mirrored
// title-block strip closes the scene. The reveal bounds span everything above
// the strip. Mobile layout (useMobile): statement at the top over the map,
// CTA as a smaller full-width bottom bar; plate column, arch list and the
// strip drop, and the crosshair reveal idles (no pointer to track).
import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type MotionValue } from "framer-motion"
import { Body2, H1, H3 } from "@nolli/ui"
import { BootFade, phaseAtLeast, useBootPhase } from "@/lib/boot"
import type { MapRef } from "@nolli/map"
import type { ArchSummary } from "@/lib/landing-data"
import type { SceneCamera } from "@nolli/map"
import { useSceneScroll, useSpineMap } from "@/spine/spine"
import { TRANSITION_LEAD_VH, type HoldScene } from "@/spine/timeline"
import { HERO_FIT_PAD } from "@/lib/constants"
import { fitCamera } from "@/lib/camera"
import type { LandingData } from "@/lib/landing-data"
import { useMobile } from "@/lib/use-mobile"
import { CtaPane } from "@/components/cta-pane"
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

const MOBILE_CTA_HEIGHT = "4rem"

/** The hold has no stick range (wrapper = scene height), so the statement
 * scrolls under the frosted header from the first pixel — dissolve it over
 * the opening vh instead of letting it smear beneath the bar. */
const MOBILE_LEDE_FADE_VH = 7

function HeroScene({ data }: { data: LandingData }) {
  const mobile = useMobile()
  return mobile ? <HeroMobile data={data} /> : <HeroDesktop data={data} />
}

/** Photo markers show while the hero holds, then linger through the exit. */
function useMarkersOn() {
  const localScrollDist = useSceneScroll()
  const [markersOn, setMarkersOn] = useState(() => localScrollDist.get() < SCENE_VH)
  useMotionValueEvent(localScrollDist, "change", (v) => setMarkersOn(v < SCENE_VH))
  return markersOn
}

function HeroDesktop({ data }: { data: LandingData }) {
  const map = useSpineMap()
  const bootPhase = useBootPhase()
  const archs = data.heroArchs
  const { sx, sy } = useCursorSprings()
  const { nearest, active } = usePlateArchs(sx, sy, archs, map)
  // reveal bounds = the whole top area above the strip; the camera fits to
  // the stage alone so pins stay clear of the column
  const boundsRef = useRef<HTMLDivElement | null>(null)
  const cam = useMemo(() => heroCamera(data), [data])

  // the plate IS the cursor while the pointer is inside the scene — plain
  // css on the section (reduced motion never hides the system cursor)
  const reduced = useReducedMotion()
  const snap = !!reduced

  const markersOn = useMarkersOn()

  const scale = useScaleText(map, sy)

  return (
    <section
      data-spine-shape="hero"
      data-boot-phase={bootPhase}
      className={snap ? styles.hero : `${styles.hero} ${styles.cursorHide}`}
    >
      <CursorReveal
        boundsRef={boundsRef}
        sx={sx}
        sy={sy}
        tagTr={data.heroCity.name}
        on={phaseAtLeast(bootPhase, "reveal")}
      />
      <PhotoMarkers
        archs={archs}
        on={markersOn && phaseAtLeast(bootPhase, "reveal")}
        className={HERO_MARKER_CLASS}
      />
      <MapTransition untilVh={SCENE_VH - TRANSITION_LEAD_VH} target={cam} />
      <Screen className={styles.screen}>
        <HSplit>
          <Pane size="var(--size-header-height)" />
          <VSplit ref={boundsRef}>
            <Pane className={styles.heroPane}>
              <Lede />
            </Pane>
            <Pane size={`${PLATE.w}px`}>
              <BootFade at="furniture" className={styles.furnitureBox} delay={0.12}>
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
              </BootFade>
            </Pane>
          </VSplit>
          <Pane size={BOTTOM_BAR_HEIGHT}>
            <BootFade at="furniture" className={styles.furnitureBox} delay={0.22}>
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
            </BootFade>
          </Pane>
        </HSplit>
      </Screen>
    </section>
  )
}

/** Mobile tree: statement top, open map middle, CTA bottom bar. The veil and
 * reveal bounds render as on desktop, but the plate coordinates are static —
 * nothing tracks a pointer, so the crosshair reveal idles and the cursor
 * springs, plate picking and scale readout never mount. */
function HeroMobile({ data }: { data: LandingData }) {
  const bootPhase = useBootPhase()
  const sx = useMotionValue(window.innerWidth * 0.62)
  const sy = useMotionValue(window.innerHeight * 0.42)
  const boundsRef = useRef<HTMLDivElement | null>(null)
  const cam = useMemo(() => heroCamera(data), [data])
  const markersOn = useMarkersOn()
  const local = useSceneScroll()
  const ledeFade = useTransform(local, [0, MOBILE_LEDE_FADE_VH], [1, 0])

  return (
    <section data-spine-shape="hero" data-boot-phase={bootPhase} className={styles.hero}>
      <CursorReveal
        boundsRef={boundsRef}
        sx={sx}
        sy={sy}
        tagTr={data.heroCity.name}
        on={phaseAtLeast(bootPhase, "reveal")}
      />
      <PhotoMarkers
        archs={data.heroArchs}
        on={markersOn && phaseAtLeast(bootPhase, "reveal")}
        className={HERO_MARKER_CLASS}
      />
      <MapTransition untilVh={SCENE_VH - TRANSITION_LEAD_VH} target={cam} />
      <Screen className={`${styles.screen} ${styles.mobileScreen}`}>
        <HSplit ref={boundsRef} className={styles.mobileWork}>
          <Pane size="calc(var(--size-header-height) + 1px)" />
          <Pane className={styles.mobileLedePane}>
            <motion.div style={{ opacity: ledeFade }}>
              <Lede />
            </motion.div>
          </Pane>
          <Pane filled />
        </HSplit>
        <Pane size={MOBILE_CTA_HEIGHT} filled className={styles.mobileCtaBar}>
          <CtaPane />
        </Pane>
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
  const bootPhase = useBootPhase()
  // entrance waits for the boot sequence's headline beat, not React mount
  const on = phaseAtLeast(bootPhase, "headline")
  const hidden = { opacity: 0, y: 10, filter: "blur(4px)" }
  const shown = { opacity: 1, y: 0, filter: "blur(0px)" }

  return (
    <motion.div
      className={styles.lede}
      initial={reduced ? false : hidden}
      animate={on ? shown : hidden}
      transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
    >
      <h1>
        {HEADLINE_LINES.map((line, i) => (
          <motion.div
          key={i}
          initial={reduced ? false : hidden}
          animate={on ? shown : hidden}
          transition={{ duration: 0.5, delay: 0.15 + i * 0.35, ease: "easeOut" }}
          >
            <span className={styles.headlineLine}>{line}</span>
          </motion.div>
        ))}
      </h1>
      <BootFade at="furniture">
        <Body2 asChild>
          <p className={styles.secondary}>{SECONDARY}</p>
        </Body2>
      </BootFade>
    </motion.div>
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
