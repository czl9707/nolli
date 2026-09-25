// Architect ledger hold on the spine. The screen sticks for a full ledger
// pass: the map band (70svh, inside the page padding) rides a slow drift —
// a fraction of scroll speed — while the scroll itself pages the ledger,
// one architect per STEP_VH. The works pin to their true coordinates under
// the veil, the lit architect's works carded; the statement rides the band
// and rolls the name — the scroll is the control, no pointer involved.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion"
import { H2 } from "@nolli/ui"
import { useSceneOwnsMap } from "@/spine/spine"
import { useIsMobile } from "@nolli/ui"
import type { HoldScene } from "@/spine/timeline"
import type { ArchEntry, LandingData } from "@/lib/landing-data"
import { worldCamera } from "@/lib/world-camera"
import { ArchImageMarkers } from "@/components/arch-markers"
import { MapVeil } from "@/components/map-veil"
import { RollText } from "@/components/roll-text"
import styles from "./architect-ledger.module.css"

const SCENE_ID = "architect"

/** Scroll per architect — the ledger pages one name every step. */
const STEP_VH = 20

/** Total map rise across the ledger pass — the band drifts at a fraction
 * of scroll speed instead of sticking, centered on the window's midline
 * (center sweeps 50svh + drift/2 → 50svh − drift/2) so the map never
 * leaves the viewport. */
const MAP_DRIFT_VH = 20

/** Map band height in svh — feeds the css vars that park the band. */
const BAND_MARGIN = 15;
const BAND_VH = 70
const BAND_VH_MOBILE = 55

export const architectHold = (data: LandingData): HoldScene => {
  const entries = data.architectLedger
  const progressVh = entries.length * STEP_VH
  return {
    id: SCENE_ID,
    shape: "[data-spine-shape='architect']",
    heightVh: 100 + progressVh,
    camera: worldCamera,
    Component: () => <ArchitectLedger entries={entries} />,
  }
}

/** Pin-local scroll in DOM svh, measured from the scene wrapper's live
 *  rect. The sticky pin window is DOM geometry (wrapper height minus the
 *  band's margin box), while the spine's scene-local vh is progress over
 *  the whole scroll range and runs faster than DOM svh — a spine-local
 *  driver saturates the drift well before the band unpins, freezing the
 *  pass mid-stick. Measuring keeps the drift and the paging level with
 *  the pin exactly, at any timeline shape. */
function usePinScroll(bandVh: number) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const pinScroll = useMotionValue(0)
  const spanRef = useRef(1)
  const { scrollY } = useScroll()
  const measure = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const vh = window.innerHeight / 100
    const top = el.getBoundingClientRect().top
    // the pin starts when the band's natural top (its margin) crosses the
    // sticky top; it ends one margin box before the wrapper's bottom
    const startPx = (50 + MAP_DRIFT_VH / 2 - bandVh / 2 - BAND_MARGIN) * vh
    const spanPx = el.offsetHeight - (2 * BAND_MARGIN + bandVh) * vh
    spanRef.current = Math.max(spanPx / vh, 1)
    pinScroll.set((startPx - top) / vh)
  }, [bandVh])
  useEffect(() => {
    wrapRef.current = document.querySelector("[data-scene='architect']")
    measure()
  }, [measure])
  useMotionValueEvent(scrollY, "change", measure)
  return { pinScroll, spanSvh: spanRef }
}

function ArchitectLedger({ entries }: { entries: ArchEntry[] }) {
  const ownsMap = useSceneOwnsMap()
  const mobile = useIsMobile()
  const bandVh = mobile ? BAND_VH_MOBILE : BAND_VH
  const { pinScroll, spanSvh } = usePinScroll(bandVh)

  // scroll pages the ledger: one architect per STEP_VH, clamped at both
  // ends (the entry holds the first name, the tail holds the last)
  const selected = useScrollPaged(entries, pinScroll)
  const selectedEntry = entries.find((e) => e.name === selected) ?? entries[0]

  // the band's drift: the full pin window of scroll lifts the map only
  // MAP_DRIFT_VH — the glue loop reads the shape's live rect, so the map
  // layer follows the drift at the band's pace
  const driftY = useTransform(pinScroll, (v) => {
    const p = Math.max(0, Math.min(1, v / spanSvh.current))
    return `${-MAP_DRIFT_VH * p}svh`
  })

  const paneVars = {
    "--band-vh": `${bandVh}svh`,
    "--drift-vh": `${MAP_DRIFT_VH}svh`,
    "--band-margin-vh": `${BAND_MARGIN}svh`
  } as CSSProperties

  return <>
    <MapVeil />
    <ArchImageMarkers entries={entries} selectedId={selectedEntry?.id ?? -1} on={ownsMap} />
    {/* the framed pane and the statement are two sticky panes with
     * IDENTICAL geometry (top, height, margins, drift value) so they
     * stick, unstick and drift as one. The split is forced: one subtree
     * cannot paint partly under and partly over the spine's map layer —
     * the frame sits at the map scale, the text at the item scale */}
    <div className={styles.frameSticky} style={paneVars}>
      <motion.div className={styles.drift} style={{ y: driftY }}>
        <div className={styles.frame} aria-hidden />
        <div className={styles.shape} aria-hidden data-spine-shape="architect" />
      </motion.div>
    </div>
    <div className={styles.textSticky} style={paneVars}>
      <motion.div className={styles.bandText} style={{ y: driftY }}>
        <H2 className={styles.statementText}>
          You can name the works of <RollText text={selectedEntry?.name ?? ""} />.
          <br />
          <span className={styles.accent}>Nolli</span> help you pin them on the map.
        </H2>
      </motion.div>
    </div>
  </>
}

/** Selection as a function of pin-local scroll — the index the scroll has
 * paged to, held at both ends. Initialized from the live position so a
 * deep-link lands on the right name. */
function useScrollPaged(entries: ArchEntry[], local: MotionValue<number>) {
  const idxFor = (v: number) =>
    Math.max(0, Math.min(entries.length - 1, Math.floor(v / STEP_VH)))
  const [selected, setSelected] = useState(entries[idxFor(0)]?.name ?? "")
  const current = useRef(selected)
  useMotionValueEvent(local, "change", (v) => {
    const name = entries[idxFor(v)]?.name
    if (name && name !== current.current) {
      current.current = name
      setSelected(name)
    }
  })
  useEffect(() => {
    const name = entries[idxFor(local.get())]?.name
    if (name) {
      current.current = name
      setSelected(name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return selected
}
