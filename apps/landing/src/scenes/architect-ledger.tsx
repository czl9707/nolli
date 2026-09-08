// Architect ledger hold on the spine. The map owns the screen under a dark
// veil — the works pin to their true coordinates, the lit architect's works
// carded — and the ledger closes the scene as one block of equal cells
// along the bottom. Selection proves the statement: you can name an
// architect's works; the map can place them.
import { useEffect, useRef, useState } from "react"
import { useMotionValueEvent } from "framer-motion"
import { Body1, H3 } from "@nolli/ui"
import type { SceneCamera } from "@nolli/map"
import { flyToSceneCinematic } from "@nolli/map"
import { useSceneScroll, useSpineMap } from "@/spine/spine"
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
  kind: "hold",
  id: SCENE_ID,
  shape: "[data-spine-shape='architect']",
  heightVh: SCENE_VH,
  Component: () => <ArchitectLedger entries={data.architectLedger} />,
})

function ArchitectLedger({ entries }: { entries: ArchEntry[] }) {
  const local = useSceneScroll(SCENE_ID)
  const map = useSpineMap()
  const flied = useRef(false)
  const [selected, setSelected] = useState(entries[0]?.name ?? "")
  const selectedEntry = entries.find((e) => e.name === selected) ?? entries[0]

  // markers own the map band across the same window the flight parks in
  const [markersOn, setMarkersOn] = useState(() => {
    const v = local.get()
    return v >= 0 && v < VEIL_VISIBLE_VH
  })
  useMotionValueEvent(local, "change", (v) => setMarkersOn(v >= 0 && v < VEIL_VISIBLE_VH))

  // the entry flight parks the camera at the world view when scroll hands
  // the scene the screen; the map layer may still be resizing out of the
  // shape morph, which mis-lands the ease — verify and snap if off
  useMotionValueEvent(local, "change", (v) => {
    if (v >= 0 && v < VEIL_VISIBLE_VH && map) {
      if (flied.current) return
      flied.current = true
      flyToSceneCinematic(map, WORLD)
      map.once("moveend", () => {
        const c = map.getCenter()
        if (Math.abs(c.lng - WORLD.center[0]) > 1 || Math.abs(map.getZoom() - WORLD.zoom) > 0.05) {
          map.jumpTo({ center: WORLD.center, zoom: WORLD.zoom })
        }
      })
    } else {
      flied.current = false
    }
  })

  const rows: ArchEntry[][] = []
  const perRow = Math.ceil(entries.length / 2)
  for (let i = 0; i < entries.length; i += perRow) rows.push(entries.slice(i, i + perRow))

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
                      <div className={styles.shape} aria-hidden data-spine-shape="architect" />
                      <MapVeil on={markersOn} />
                      <ArchImageMarkers entries={entries} selectedId={selectedEntry?.id ?? -1} on={markersOn} />
                      {selectedEntry && (
                        <div className={styles.bandText}>
                          <H3>
                            You can name the works of <RollText text={selectedEntry.name} />.
                            <br />
                            <span className={styles.accent}>Nolli</span> help you pin them on the map.
                          </H3>
                        </div>
                      )}
                    </Pane>
                    {rows.map((row, r) => (
                      <Pane key={r} size="3.5rem">
                        <VSplit>
                          {row.map((e) => (
                            <RollButton
                              key={e.id}
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
                    ))}
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
