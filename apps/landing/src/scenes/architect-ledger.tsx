// Architect ledger hold on the spine. The screen sticks for a full ledger
// pass: the map band (70svh, inside the page padding) rides a slow drift —
// a fraction of scroll speed — while the scroll itself pages the ledger,
// one architect per STEP_VH. The works pin to their true coordinates under
// the veil, the lit architect's works carded; the statement rides the band
// and rolls the name — the scroll is the control, no pointer involved.
//
// The drift is scroll-driven css, not framer: the scene's invisible
// subject names a view timeline, the band rides it, and the spine's map
// layer rides the same curve (see global.css) — pane and layer move in
// lockstep on the compositor, no rAF chase. All geometry is svh
// arithmetic on constants; nothing measures the DOM. The shape anchor is
// the pane's untransformed twin, so the rect glue's base stays valid
// through the whole hold.
import { useEffect, useRef, useState, type CSSProperties } from "react"
import { useMotionValueEvent, useTransform, type MotionValue } from "framer-motion"
import { H2 } from "@nolli/ui"
import { useSceneOwnsMap, useSceneRange, useSceneScroll } from "@/spine/spine"
import { useIsMobile } from "@nolli/ui"
import type { HoldScene } from "@/spine/timeline"
import type { ArchEntry, LandingData } from "@/lib/landing-data"
import { worldCamera } from "@/lib/world-camera"
import { ArchImageMarkers } from "@/components/arch-markers"
import { MapVeil } from "@/components/map-veil"
import { RollText } from "@/components/roll-text"
import "./architect-ledger.css"
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
  // the pin spans one STEP per HOP (n−1), not per architect — the last
  // name rides the release instead of holding a dead extra step
  const progressVh = (entries.length - 1) * STEP_VH
  return {
    id: SCENE_ID,
    shape: "[data-spine-shape='architect']",
    heightVh: 100 + progressVh,
    camera: worldCamera,
    Component: () => <ArchitectLedger entries={entries} />,
  }
}

function ArchitectLedger({ entries }: { entries: ArchEntry[] }) {
  const ownsMap = useSceneOwnsMap()
  const mobile = useIsMobile()
  const bandVh = mobile ? BAND_VH_MOBILE : BAND_VH
  const { heightVh } = useSceneRange(SCENE_ID)

  // pin geometry, pure svh: the band parks its center at 50svh + drift/2;
  // the pin starts when the band's margin-top crosses the sticky top and
  // releases exactly when the wrapper's tail margin catches the band's
  // bottom (the margins are chosen so pin end == release)
  const startOff = 50 + MAP_DRIFT_VH / 2 - bandVh / 2 - BAND_MARGIN
  const span = heightVh - (2 * BAND_MARGIN + bandVh)

  // the drift's slice of the subject's cover travel, as percentages —
  // published on :root so the spine's map layer (a different subtree)
  // rides the same range
  const cover = heightVh + 100
  const fromPct = ((100 - startOff) / cover) * 100
  const toPct = ((100 - startOff + span) / cover) * 100
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty("--arch-drift-vh", `${MAP_DRIFT_VH}svh`)
    root.setProperty("--arch-drift-from", `${fromPct}%`)
    root.setProperty("--arch-drift-to", `${toPct}%`)
  }, [fromPct, toPct])

  // scroll pages the ledger: pin-local vh (scroll into the hold, zero at
  // the pin), one architect per STEP_VH, clamped at both ends
  const local = useSceneScroll(SCENE_ID)
  const pinLocal = useTransform(local, (v) => v + startOff)
  const selected = useScrollPaged(entries, pinLocal)
  const selectedEntry = entries.find((e) => e.name === selected) ?? entries[0]

  const paneVars = {
    "--band-vh": `${bandVh}svh`,
    "--drift-vh": `${MAP_DRIFT_VH}svh`,
    "--band-margin-vh": `${BAND_MARGIN}svh`
  } as CSSProperties

  return <>
    <MapVeil />
    <ArchImageMarkers entries={entries} selectedId={selectedEntry?.id ?? -1} on={ownsMap} />
    {/* the timeline subject — an invisible twin of the wrapper that names
     * the view timeline everything drifts on (see global.css) */}
    <div className="arch-view-subject" aria-hidden />
    {/* the framed pane and the statement are two sticky panes with
     * IDENTICAL geometry (top, height, margins, drift value) so they
     * stick, unstick and drift as one. The split is forced: one subtree
     * cannot paint partly under and partly over the spine's map layer —
     * the frame sits at the map scale, the text at the item scale. The
     * anchor is the shape's untransformed twin: the rect glue's base. */}
    <div className={styles.frameSticky} style={paneVars}>
      <div className={styles.anchor} aria-hidden data-spine-shape="architect" />
      <div className={`${styles.drift} arch-drift-ride`}>
        <div className={styles.frame} aria-hidden />
        <div className={styles.shape} aria-hidden />
      </div>
    </div>
    <div className={styles.textSticky} style={paneVars}>
      <div className={`${styles.bandText} arch-drift-ride`}>
        <H2 className={styles.statementText}>
          You can name the works of <RollText text={selectedEntry?.name ?? ""} />.
          <br />
          <span className={styles.accent}>Nolli</span> help you pin them on the map.
        </H2>
      </div>
    </div>
  </>
}

/** Selection as a function of pin-local scroll — the index the scroll has
 * paged to, held at both ends. Initialized from the live position so a
 * deep-link lands on the right name. */
function useScrollPaged(entries: ArchEntry[], local: MotionValue<number>) {
  const idxFor = (v: number) =>
    Math.max(0, Math.min(entries.length - 1, Math.floor((v - BAND_MARGIN) / STEP_VH)))
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
