// Architect ledger hold on the spine. The screen sticks for a full ledger
// pass: the map band (70svh, inside the page padding) rides a slow drift —
// a fraction of scroll speed — while the scroll itself pages the ledger,
// one architect per STEP_VH. The works pin to their true coordinates under
// the veil, the lit architect's works carded; the statement rides the band
// and rolls the name — the scroll is the control, no pointer involved.
import { useEffect, useRef, useState, type CSSProperties } from "react"
import { motion, useMotionValueEvent, useTransform } from "framer-motion"
import { H2 } from "@nolli/ui"
import type { SceneCamera } from "@nolli/map"
import { useSceneOwnsMap, useSceneScroll, useSpineMap } from "@/spine/spine"
import { useIsMobile } from "@nolli/ui"
import { useLinger } from "@/lib/use-linger"
import type { HoldScene } from "@/spine/timeline"
import type { ArchEntry, LandingData } from "@/lib/landing-data"
import { ArchImageMarkers } from "@/components/arch-markers"
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
const BAND_MARGIN = 20;
const BAND_VH = 70
const BAND_VH_MOBILE = 55

// world view widened so renderWorldCopies:false doesn't crop the ledger's
// buildings (bounds ≈ −133°..157°)
const WORLD: SceneCamera = { center: [12, 25], zoom: 1.05 }

export const architectHold = (data: LandingData): HoldScene => {
  const entries = data.architectLedger
  const progressVh = entries.length * STEP_VH
  return {
    id: SCENE_ID,
    shape: "[data-spine-shape='architect']",
    heightVh: 100 + progressVh,
    camera: WORLD,
    Component: () => <ArchitectLedger entries={entries} progressVh={progressVh} />,
  }
}

function ArchitectLedger({ entries, progressVh }: { entries: ArchEntry[]; progressVh: number }) {
  const local = useSceneScroll(SCENE_ID)
  const ownsMap = useSceneOwnsMap()
  const mobile = useIsMobile()

  // scroll pages the ledger: one architect per STEP_VH, clamped at both
  // ends (the entry holds the first name, the tail holds the last)
  const selected = useScrollPaged(entries, local)
  const selectedEntry = entries.find((e) => e.name === selected) ?? entries[0]

  // the band's drift: a full ledger pass of scroll lifts the map only
  // MAP_DRIFT_VH — the glue loop reads the shape's live rect, so the map
  // layer follows the drift at the band's pace
  const driftY = useTransform(local, (v) => {
    const p = Math.max(0, Math.min(1, v / progressVh))
    return `${-MAP_DRIFT_VH * p}svh`
  })

  const bandVh = mobile ? BAND_VH_MOBILE : BAND_VH
  const paneVars = {
    "--band-vh": `${bandVh}svh`,
    "--drift-vh": `${MAP_DRIFT_VH}svh`,
    "--band-margin-vh": `${BAND_MARGIN}svh`
  } as CSSProperties

  return <>
    <MapVeil on={ownsMap} />
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

/** Selection as a function of scene-local scroll — the index the scroll
 * has paged to, held at both ends. Initialized from the live position so a
 * deep-link lands on the right name. */
function useScrollPaged(entries: ArchEntry[], local: ReturnType<typeof useSceneScroll>) {
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

/** The dark veil over the map band. Photo markers are maplibre markers in
 * the canvas container, so the veil is inserted there imperatively, right
 * after the canvas — above the tiles, under every marker (a scene-DOM or
 * portal veil would paint over the cards). Fades with map ownership. */
function MapVeil({ on }: { on: boolean }) {
  const [mounted, visible] = useLinger(on, 400)
  const map = useSpineMap()
  const veilRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!mounted || !map) return
    const canvas = map.getCanvas()
    const veil = document.createElement("div")
    veil.className = styles.veil
    veil.setAttribute("aria-hidden", "true")
    canvas.parentElement!.insertBefore(veil, canvas.nextSibling)
    veilRef.current = veil
    return () => {
      veil.remove()
      veilRef.current = null
    }
  }, [mounted, map])
  useEffect(() => {
    if (veilRef.current) veilRef.current.style.opacity = visible ? "1" : "0"
  }, [visible])
  return null
}
