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
import { CLUSTER_CITY, HERO_CAMERA } from "@/lib/constants"
import { fitCamera } from "@/lib/camera"
import type { LandingData } from "@/lib/landing-data"
import { CursorReveal, HERO_MARKER_CLASS, useCursorSprings, usePlatePicks } from "./hero-reveal"
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
const HOLD_END_VH = 100

function HeroLedge({ data }: { data: LandingData }) {
  const map = useSpineMap()
  const picks = data.heroPicks
  const { sx, sy } = useCursorSprings()
  const { nearest, active } = usePlatePicks(sx, sy, picks, map)
  // the reveal roams only the top-left pane
  const boundsRef = useRef<HTMLDivElement | null>(null)

  // content scrolls off naturally (hold height == component height); the
  // veil, plate and crosshairs ride up with the page instead (CursorReveal,
  // in this section's own tree)
  const local = useSceneScroll()

  // fit the picks to the PANE and center them there, so the photo cards land
  // inside the reveal area: outliers excluded, camera fitted to pane px with
  // moderate padding, then shifted so the fitted midpoint projects to the
  // pane center instead of the viewport center
  useEffect(() => {
    const pane = boundsRef.current
    if (!map || !pane) return
    if (!picks.length) {
      map.jumpTo({ center: HERO_CAMERA.center, zoom: HERO_CAMERA.zoom })
      return
    }
    const b = pane.getBoundingClientRect()
    const fit = fitCamera(
      picks.map((p) => p.coordinates),
      { width: b.width, height: b.height },
      { x: 100, top: 100, bottom: 240 },
    )
    map.jumpTo({ center: fit.center, zoom: fit.zoom })
    const c1 = map.unproject([
      window.innerWidth - (b.left + b.width / 2),
      window.innerHeight - (b.top + b.height / 2),
    ])
    map.jumpTo({ center: [c1.lng, c1.lat], zoom: fit.zoom })
  }, [map, picks])

  // the plate IS the cursor while the pointer is inside the scene — plain
  // css on the section (snap mode never hides the system cursor)
  const reduced = useReducedMotion()
  const snap = useIsMobile() || !!reduced

  // hero photo markers stand down at the transition entry (hold end): the
  // on-class flip fades them out early in the transition
  // (photo-markers.module.css), so they don't stack over the index markers
  // during the index hold
  const [markersOn, setMarkersOn] = useState(() => local.get() < HOLD_END_VH)
  useMotionValueEvent(local, "change", (v) => setMarkersOn(v < HOLD_END_VH))

  return (
    <section data-spine-shape="hero" className={snap ? styles.hero : `${styles.hero} ${styles.cursorHide}`}>
      <CursorReveal
        boundsRef={boundsRef}
        map={map}
        sx={sx}
        sy={sy}
        tagTr={CLUSTER_CITY}
      />
      <HeroPhotoMarkers picks={picks} on={markersOn} />
      <Screen>
        <div className={styles.splits}>
          <HSplit>
            <Pane size="var(--size-header-height)" />
            <Pane>
              <VSplit>
                <Pane size="calc(100vw - var(--grid-col) - max(var(--grid-padding), calc(var(--grid-col) * 2)))">
                  <HSplit>
                    <Pane size="75%">
                      <div ref={boundsRef} className={styles.revealBounds} />
                    </Pane>
                    <Pane className={styles.headlineBody}>
                      <HeroHeadline />
                    </Pane>
                  </HSplit>
                </Pane>
                <Pane size="calc(var(--grid-col) + max(var(--grid-padding), calc(var(--grid-col) * 2)))">
                  <HSplit>
                    <Pane size="75%" className={styles.pickBody}>
                      <PickList picks={picks} active={active} />
                    </Pane>
                    <Pane className={styles.captionBody}>
                      <NearestCaption nearest={nearest} />
                    </Pane>
                  </HSplit>
                </Pane>
              </VSplit>
            </Pane>
          </HSplit>
        </div>
      </Screen>
    </section>
  )
}

/** Hero-owned photo markers, portalled into the spine's map layer so they
 * ride the map (clipped to the cursor plate by the reveal). `on` toggles
 * the fade class. */
function HeroPhotoMarkers({ picks, on }: { picks: ArchSummary[]; on: boolean }) {
  const map = useSpineMap()
  const mapPortal = useMapPortal()
  if (!map || !mapPortal) return null
  const base = `${markerStyles.photoMarker} ${HERO_MARKER_CLASS}`
  const cls = on ? `${base} ${markerStyles.on}` : base
  return createPortal(
    <MapContext.Provider value={{ map, isLoaded: !!map }}>
      {picks.map((a) => (
        <PhotoMarker key={a.slug} building={a} className={cls} />
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
    <H1 className={styles.headline}>
      {HEADLINE_LINES.map((line, i) => (
        <motion.div
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
        <Body3 asChild key={p.slug}>
          <li className={`${styles.pick} ${active.has(p.slug) ? styles.pickActive : ""}`}>
            {p.name}
          </li>
        </Body3>
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
      <Body1 asChild>
        <div className={styles.captionName}>{nearest?.name ?? ""}</div>
      </Body1>
      <Body2 asChild>
        <div className={styles.captionMeta}>
          {nearest ? `${nearest.architect}, ${nearest.year}` : ""}
        </div>
      </Body2>
    </motion.div>
  )
}
