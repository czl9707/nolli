// Hero hold scene on the spine. The spine's map layer IS the hero map; photo
// markers render through the map portal so they ride the layer, while the
// reveal (veil/plate/crosshairs) renders in this tree — first child of the
// sticky section, so it pins during the hold and rides up with the page
// through the transition, unveiling the map. Layout: lede bottom-left,
// info block top-right (Note labels, serif values, live scale, the arch
// list whose highlight follows the reveal plate). The reveal bounds span
// the workarea, and the cursor hides inside it only — the header keeps the
// system cursor.
import { useEffect, useRef, useState } from "react"
import { motion, useMotionValueEvent, useReducedMotion, type MotionValue } from "framer-motion"
import { Body2, H5, Note, TRANSITION_INSTANT, TRANSITION_SHORT } from "@nolli/ui"
import { BootFade, phaseAtLeast, useBootPhase } from "@/lib/boot"
import type { MapRef, SceneCamera } from "@nolli/map"
import type { ArchSummary } from "@/lib/landing-data"
import { useSceneOwnsMap, useSceneScroll, useSpineMap } from "@/spine/spine"
import type { HoldScene } from "@/spine/timeline"
import { HERO_FIT_PAD } from "@/lib/constants"
import { fitCamera } from "@/lib/camera"
import type { LandingData } from "@/lib/landing-data"
import { PhotoMarkers } from "@/components/photo-markers"
import { CursorReveal, HERO_MARKER_CLASS, useCursorSprings, usePlateArchs, type PlateRect } from "./hero-reveal"
import { Pane, Screen } from "./page-layout"
import styles from "./hero.module.css"

export const heroHold = (data: LandingData): HoldScene => ({
  id: "hero",
  shape: "[data-spine-shape='hero']",
  heightVh: SCENE_VH,
  camera: heroCamera(data),
  rulesOverMap: true,
  Component: () => <HeroScene data={data} />,
})

export const heroCamera = (data: LandingData): SceneCamera => {
  const cs = getComputedStyle(document.documentElement)
  const header = parseFloat(cs.getPropertyValue("--size-header-height")) * parseFloat(cs.fontSize)
  return fitCamera(
    data.heroArchs.map((p) => p.coordinates),
    {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    {
      ...HERO_FIT_PAD,
      top: HERO_FIT_PAD.top + (Number.isFinite(header) ? header : 0),
    },
  )
}

const SCENE_VH = 200

/** Shared hero state. Springs, plate activity, scale readout and boot
 * gating live here; the tree only composes panes. */
function HeroScene({ data }: { data: LandingData }) {
  const map = useSpineMap()
  const bootPhase = useBootPhase()
  const archs = data.heroArchs
  const { sx, sy } = useCursorSprings()
  // reveal bounds = the workarea pane
  const boundsRef = useRef<HTMLDivElement | null>(null)
  // the reveal's live plate rect (viewport px), written by the reveal's
  // frame loop — drives the arch list's active highlight
  const plateRef = useRef<PlateRect | null>(null)
  const reduced = useReducedMotion()

  const localScrollDist = useSceneScroll()
  const { active } = usePlateArchs(sx, sy, archs, map, plateRef, localScrollDist)
  const ownsMap = useSceneOwnsMap()
  const [markersOn, setMarkersOn] = useState(() => localScrollDist.get() < SCENE_VH)
  useMotionValueEvent(localScrollDist, "change", (v) => setMarkersOn(v < SCENE_VH))

  const scale = useScaleText(map, sy)

  return (
    <>
      <CursorReveal
        boundsRef={boundsRef}
        plateRef={plateRef}
        sx={sx}
        sy={sy}
        on={phaseAtLeast(bootPhase, "reveal")}
        growVh={SCENE_VH - 100}
        tagTr={data.heroCity.name}
      />
      <section
        data-spine-shape="hero"
        data-boot-phase={bootPhase}
        className={styles.hero}
      >
        <PhotoMarkers
          archs={archs}
          on={markersOn && ownsMap && phaseAtLeast(bootPhase, "reveal")}
          className={HERO_MARKER_CLASS}
        />
        <Screen className={reduced ? "" : styles.cursorHide}>
          <div className={styles.boundingBox} ref={boundsRef} />
          <HeroTree
            archs={archs}
            active={active}
            scale={scale}
            city={data.heroCity}
          />
        </Screen>
      </section>
    </>
  )
}

type HeroTreeProps = {
  archs: ArchSummary[]
  active: ReadonlySet<string>
  scale: string
  city: LandingData["heroCity"]
}

/** One tree, desktop and mobile: info block top-right (Note labels, serif
 * values) with the arch list under it, lede bottom-left. */
function HeroTree({ archs, active, scale, city }: HeroTreeProps) {
  return (
    <>
      <Pane className={styles.infoPane}>
        <BootFade at="furniture" className={styles.infoColumn} delay={0.12}>
          <Note className={styles.infoLabel}>Where are We?</Note>
          <span className={styles.infoValue}>
            {city.country ? `${city.country} · ` : ""}
            {city.name}
          </span>
          <Note className={styles.infoLabel}>At Which Scale?</Note>
          <LiveValue>{scale}</LiveValue>
          <Note className={styles.infoLabel}>How Many Mapped Here?</Note>
          <span className={styles.infoValue}>
            {city.architecturesCount.toLocaleString("en-US").replace(/,/g, " ")} Architectures
          </span>
          <Note className={styles.infoLabel}>What's Visible?</Note>
          <ul className={styles.archList}>
            {archs.map((p, n) => (
              <li className={styles.archRow} data-active={`${active.has(p.slug)}`} key={p.slug}>
                <Body2>{p.name}</Body2>
                <span className={styles.archNum}>{String(n).padStart(2, "0")}</span>
              </li>
            ))}
          </ul>
        </BootFade>
      </Pane>
      <Pane className={styles.ledePane}>
        <Lede />
      </Pane>
    </>
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
      className={styles.ledeColumn}
      initial={reduced ? false : hidden}
      animate={on ? shown : hidden}
      transition={{ duration: TRANSITION_SHORT, delay: TRANSITION_INSTANT, ease: "easeOut" }}
    >
      <h1>
        {HEADLINE_LINES.map((line, i) => (
          <motion.div
          key={i}
          initial={reduced ? false : hidden}
          animate={on ? shown : hidden}
          transition={{ duration: TRANSITION_SHORT, delay: TRANSITION_INSTANT + i * 0.35, ease: "easeOut" }}
        >
          <span className={styles.headlineLine}>{line}</span>
          </motion.div>
        ))}
      </h1>
      <BootFade at="furniture">
        <H5 className={styles.secondary}>
          {SECONDARY}
        </H5>
      </BootFade>
    </motion.div>
  )
}

/** Instrument cells blink on change — value swap reads as a readout, not an
 * animation. */
function LiveValue({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      className={styles.infoValue}
      initial={{ opacity: 0 }}
      animate={{ opacity: .75 }}
      transition={{ duration: TRANSITION_INSTANT }}
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
