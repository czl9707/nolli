// Hero hold scene on the spine (prototype variant A "Ledger" hero). The
// spine's map layer IS the hero map; photo markers render through the map
// portal so they ride the layer, while the reveal (veil/plate/crosshairs)
// renders in this tree — first child of the sticky section, so it pins
// during the hold and rides up with the page through the transition,
// unveiling the map. The hold's height equals the component's, so the
// pane-split content scrolls off naturally with it.
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { motion, useMotionValueEvent, useReducedMotion } from "framer-motion"
import { Body1, Body2, Body3, H1, useIsMobile } from "@nolli/ui"
import type { ArchSummary } from "@nolli/data"
import { MapContext, PhotoMarker } from "@nolli/map"
import { useSceneScroll, useSpineMap, useMapPortal } from "@/spine/spine"
import type { HoldScene } from "@/spine/timeline"
import { CLUSTER_CITY } from "@/lib/constants"
import { fitCamera } from "@/lib/camera"
import { useLinger } from "@/lib/use-linger"
import type { LandingData } from "@/lib/landing-data"
import { CursorReveal, useCursorSprings, usePlatePicks } from "./hero-reveal"
import markerStyles from "@/components/photo-markers.module.css"
import { HSplit, Pane, Screen, VSplit } from "./grid"
import styles from "./hero-ledge.module.css"

/** Far outliers excluded from the hero fit (still rendered, just not fitted
 * — they'd pull the camera out until the rest clutters). */

export const heroHold = (data: LandingData): HoldScene => ({
  kind: "hold",
  id: "hero",
  shape: "[data-spine-shape='hero']",
  heightVh: 100,
  Component: () => <HeroLedge data={data} />,
})

/** Hold end in scene-local vh — marker visibility flips here (fade length
 * lives in photo-markers.module.css). */
const SCENE_REAL_HEIGHTVH = 100

/** Inner fit padding inside the reveal pane (px). */
const FIT_PAD = { x: 100, top: 50, bottom: 240 }

function HeroLedge({ data }: { data: LandingData }) {
  const map = useSpineMap()
  const picks = data.heroPicks
  const { sx, sy } = useCursorSprings()
  const { nearest, active } = usePlatePicks(sx, sy, picks, map)
  const boundsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const pane = boundsRef.current
    if (!map || !pane) return

    const b = pane.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const cam = fitCamera(
      picks.map((p) => p.coordinates),
      { width: vw, height: vh },
      {
        left: b.left + FIT_PAD.x,
        right: vw - b.right + FIT_PAD.x,
        top: b.top + FIT_PAD.top,
        bottom: vh - b.bottom + FIT_PAD.bottom,
      },
    )
    map.jumpTo({ center: cam.center, zoom: cam.zoom })
  }, [map, picks])

  // the plate IS the cursor while the pointer is inside the scene — plain
  // css on the section (snap mode never hides the system cursor)
  const reduced = useReducedMotion()
  const snap = useIsMobile() || !!reduced
  
  const localScrollDist = useSceneScroll()
  const [markersOn, setMarkersOn] = useState(() => localScrollDist.get() < SCENE_REAL_HEIGHTVH)
  useMotionValueEvent(localScrollDist, "change", (v) => setMarkersOn(v < SCENE_REAL_HEIGHTVH))

  return (
    <section data-spine-shape="hero" className={snap ? styles.hero : `${styles.hero} ${styles.cursorHide}`}>
      <CursorReveal
        boundsRef={boundsRef}
        sx={sx}
        sy={sy}
        tagTr={CLUSTER_CITY}
      />
      <HeroPhotoMarkers picks={picks} on={markersOn} />
      <Screen className={styles.screen}>
        <HSplit>
          <Pane size="var(--size-header-height)" />
          <Pane>
            <VSplit>
              <Pane size="calc(100vw - var(--grid-col) - max(var(--grid-padding), calc(var(--grid-col) * 2)))">
                <HSplit>
                  <Pane size="80%">
                    <div ref={boundsRef} className={styles.revealBoundsCell} />
                  </Pane>
                  <Pane className={styles.headlineCell}>
                    <HeroHeadline />
                  </Pane>
                </HSplit>
              </Pane>
              <Pane size="calc(var(--grid-col) + max(var(--grid-padding), calc(var(--grid-col) * 2)))">
                <HSplit>
                  <Pane size="80%" className={styles.pickCell}>
                    <PickList picks={picks} active={active} />
                  </Pane>
                  <Pane className={styles.captionCell}>
                    <NearestCaption nearest={nearest} />
                  </Pane>
                </HSplit>
              </Pane>
            </VSplit>
          </Pane>
        </HSplit>
      </Screen>
    </section>
  )
}

function HeroPhotoMarkers({ picks, on }: { picks: ArchSummary[]; on: boolean }) {
  const [mounted, visible] = useLinger(on, 400)
  const map = useSpineMap()
  const mapPortal = useMapPortal()
  if (!map || !mapPortal || !mounted) return null
  const cls = visible ? `${markerStyles.photoMarker} ${markerStyles.on}` : markerStyles.photoMarker
  return createPortal(
    <MapContext.Provider value={{ map, isLoaded: !!map }}>
      {picks.map((a) => (
        <PhotoMarker key={a.slug} building={a} className={cls} data={{ "photo-marker": "hero" }} />
      ))}
    </MapContext.Provider>,
    mapPortal,
  )
}

const HEADLINE_LINES = [
  <>
    <span className={styles.accent}>Nolli</span> is a map
  </>,
  <>for architectures.</>,
]

function HeroHeadline() {
  const reduced = useReducedMotion()
  return (
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
  )
}

function PickList({ picks, active }: { picks: ArchSummary[]; active: ReadonlySet<string> }) {
  const reduced = useReducedMotion()
  return (
    <motion.ul
      className={styles.pickList}
      initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
    >
      {picks.map((p) => (
        <Body2 asChild key={p.slug}>
          <li className={`${styles.pick}`} data-picked={`${active.has(p.slug)}`}>
            {p.name}
          </li>
        </Body2>
      ))}
    </motion.ul>
  )
}

function NearestCaption({ nearest }: { nearest: ArchSummary | null }) {
  return (
    <motion.div
      key={nearest?.slug ?? "none"}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <Body1 className={styles.captionName}>
        {nearest?.name ?? ""}
      </Body1>
      <Body2 className={styles.captionMeta}>
        {nearest ? `${nearest.architect}, ${nearest.year}` : ""}
      </Body2>
    </motion.div>
  )
}
