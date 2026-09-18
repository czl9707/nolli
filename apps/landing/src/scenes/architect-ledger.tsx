// Architect ledger hold on the spine. The map owns the screen under a dark
// veil — the works pin to their true coordinates, the lit architect's works
// carded — and the ledger closes the scene as one block of equal cells
// along the bottom. Selection proves the statement: you can name an
// architect's works; the map can place them.
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useMotionValueEvent } from "framer-motion"
import { H2 } from "@nolli/ui"
import type { SceneCamera } from "@nolli/map"
import { useSceneOwnsMap, useSceneScroll, useSpineMap } from "@/spine/spine"
import { useIsMobile } from "@nolli/ui"
import { useLinger } from "@/lib/use-linger"
import type { HoldScene } from "@/spine/timeline"
import type { ArchEntry, LandingData } from "@/lib/landing-data"
import { ArchImageMarkers } from "@/components/arch-markers"
import { HSplit, Pane, Screen, VSplit } from "./grid"
import { RollButton } from "@/components/roll-button"
import { RollText } from "@/components/roll-text"
import styles from "./architect-ledger.module.css"

const SCENE_ID = "architect"
const SCENE_VH = 160
const VEIL_VISIBLE_VH = SCENE_VH - 80

// world view widened so renderWorldCopies:false doesn't crop the ledger's
// buildings (bounds ≈ −133°..157°)
const WORLD: SceneCamera = { center: [12, 25], zoom: 1.05 }

export const architectHold = (data: LandingData): HoldScene => ({
  id: SCENE_ID,
  shape: "[data-spine-shape='architect']",
  heightVh: SCENE_VH,
  camera: WORLD,
  Component: () => <ArchitectLedger entries={data.architectLedger} />,
})

/** Shared architect state + the router between the two trees. Selection,
 * the marker window and the shared pieces (map band, statement, ledger
 * rows) live here; the trees only compose panes. */
function ArchitectLedger({ entries }: { entries: ArchEntry[] }) {
  const local = useSceneScroll(SCENE_ID)
  const mobile = useIsMobile()
  const [selected, setSelected] = useState(entries[0]?.name ?? "")
  const selectedEntry = entries.find((e) => e.name === selected) ?? entries[0]

  const ownsMap = useSceneOwnsMap()
  // markers own the map band across the same window the flight parks in —
  // and only while the scene owns the map (fade at the fire edge)
  const [markersOn, setMarkersOn] = useState(() => {
    const v = local.get()
    return ownsMap && v >= 0 && v < VEIL_VISIBLE_VH
  })
  useMotionValueEvent(local, "change", (v) => setMarkersOn(ownsMap && v >= 0 && v < VEIL_VISIBLE_VH))
  // ownership can flip without a scroll change after it (deep-link load)
  useEffect(() => {
    const v = local.get()
    setMarkersOn(ownsMap && v >= 0 && v < VEIL_VISIBLE_VH)
  }, [ownsMap, local])

  const rows: ArchEntry[][] = []
  const perRow = Math.ceil(entries.length / 2)
  for (let i = 0; i < entries.length; i += perRow) rows.push(entries.slice(i, i + perRow))

  const statement = selectedEntry && (
    <H2 className={styles.statementText}>
      You can name the works of <RollText text={selectedEntry.name} />.
      <br />
      <span className={styles.accent}>Nolli</span> help you pin them on the map.
    </H2>
  )

  const mapBand = (
    <div className={styles.shape} aria-hidden data-spine-shape="architect" />
  )

  const ledgerRows = rows.map((row, r) => (
    <Pane key={r} size="3.5rem">
      <VSplit>
        {row.map((e) => (
          <RollButton
            key={e.id}
            className={styles.cell}
            size="calc(var(--grid-col) * 3)"
            state={e.name === selected ? "focused" : "default"}
            onClick={() => setSelected(e.name)}
            onMouseEnter={() => setSelected(e.name)}
            onFocus={() => setSelected(e.name)}
            aria-pressed={e.name === selected}
            >
            {e.name}
          </RollButton>
        ))}
      </VSplit>
    </Pane>
  ))
  
  return <>
    <MapVeil on={markersOn} />
    <ArchImageMarkers entries={entries} selectedId={selectedEntry?.id ?? -1} on={markersOn} />
    {
      mobile ? (
        <ArchitectMobile mapBand={mapBand} statement={statement} ledgerRows={ledgerRows} />
      ) : (
        <ArchitectDesktop mapBand={mapBand} statement={statement} ledgerRows={ledgerRows} />
      )
    }
  </>
}

type ArchitectTreeProps = {
  mapBand: ReactNode
  statement: ReactNode
  ledgerRows: ReactNode
}

/** Mobile re-composition: full-width map band top, statement under it,
 * ledger rows closing the screen — same pieces, re-cut vertically. */
function ArchitectMobile({ mapBand, statement, ledgerRows }: ArchitectTreeProps) {
  return (
    <Screen className={styles.screen}>
      <HSplit>
        <Pane size="calc(var(--size-header-height) + 10svh)">
          <VSplit>
            <Pane size="var(--grid-padding)" filled/>
            <Pane />
            <Pane size="var(--grid-padding)" filled/>
          </VSplit>
        </Pane>
        <Pane size="55svh">
          {mapBand}
          <VSplit>
            <Pane size="var(--grid-padding)" filled/>
            <Pane>
              <div className={styles.bandText}>{statement}</div>
            </Pane>
            <Pane size="var(--grid-padding)" filled/>
          </VSplit>
        </Pane>
        <Pane>
          <VSplit>
            <Pane size="var(--grid-padding)" filled/>
            <Pane>
              <HSplit>
                {ledgerRows}
              </HSplit>
            </Pane>
            <Pane size="var(--grid-padding)" filled/>
          </VSplit>
        </Pane>
        <Pane size="20svh"/>
      </HSplit>
    </Screen>
  )
}

/** Desktop tree — map band with the statement riding it, ledger block
 * along the right. */
function ArchitectDesktop({ mapBand, statement, ledgerRows }: ArchitectTreeProps) {
  return (
    <Screen className={styles.screen}>
      <HSplit>
        <Pane>
          <VSplit>
            <Pane size="var(--grid-padding)" filled/>
            <Pane>
              <HSplit>
                <Pane size="12svh" />
                <Pane>
                  <HSplit>
                    <Pane>
                      {mapBand}
                      <div className={styles.bandText}>{statement}</div>
                    </Pane>
                    {ledgerRows}
                  </HSplit>
                </Pane>
              </HSplit>
            </Pane>
            <Pane size="var(--grid-padding)" filled/>
          </VSplit>

        </Pane>
        <Pane size="8svh"/>
      </HSplit>
    </Screen>
  )
}

/** The dark veil over the map band. Photo markers are maplibre markers in
 * the canvas container, so the veil is inserted there imperatively, right
 * after the canvas — above the tiles, under every marker (a scene-DOM or
 * portal veil would paint over the cards). Fades with the same window the
 * markers use. */
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
