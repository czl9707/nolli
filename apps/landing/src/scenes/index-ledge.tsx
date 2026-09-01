// Index ledge on the spine (prototype variant A "Ledger" index). The map is
// the spine's layer landing on the empty shape pane; photo markers portal
// into it and gate through a container flag, while the flow tree carries
// the city dossier + 2x3 city-button grid and fades out over the hold's
// tail.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, useMotionValueEvent, useTransform } from "framer-motion"
import { Body1, H1 } from "@nolli/ui"
import { flyToSceneCinematic } from "@nolli/map"
import { useDbStore, type ArchSummary } from "@nolli/data"
import { useSceneScroll, useSpineMap } from "@/spine/spine"
import type { HoldScene, PxRect } from "@/spine/timeline"
import type { LandingData } from "@/lib/landing-data"
import { fitCamera } from "@/lib/camera"
import { cityIdByName, pickIndexPhotos } from "@/lib/shape"
import { PhotoMarkers } from "@/components/photo-markers"
import { HSplit, Pane, Screen, VSplit } from "./grid"
import styles from "./index-ledge.module.css"

/** Hand-picked city index — Paris leads (continuity with the hero dwell). */
const CITIES = ["Paris", "New York", "Tokyo", "London", "Chicago", "Berlin"] as const

const PICKS_PER_CITY = 8

/** Marker visibility window in scene-local vh: flag on at the landing
 * run-in, off again at the exit window (fade length lives in
 * photo-markers.module.css). EXIT_END_VH bounds the content fade below.
 * The entry flight fires at our own top edge (scene-local 0) so the scene
 * owns the screen when it starts; ENTRY_REARM_VH is hysteresis only. */
const ENTRY_VH = 0
const ENTRY_REARM_VH = -10
const RAMP_VH = 30
const EXIT_START_VH = 170
const EXIT_END_VH = 199

/** Fit padding in pane px: photo cards hang below the pin, so the
 * south-most pick needs far more room below it than the north-most above. */
const FIT_PADDING = { left: 100, right: 100, top: 100, bottom: 240 }

export const indexHold =
  (data: LandingData, indexPane: PxRect): HoldScene => ({
    kind: "hold",
    id: "index",
    shape: "[data-spine-shape='index']",
    heightVh: 200,
    Component: () => <IndexLedge data={data} indexPane={indexPane} />,
  })

function IndexLedge({ data, indexPane }: { data: LandingData; indexPane: PxRect }) {
  const map = useSpineMap()
  const local = useSceneScroll()

  // Paris comes free with the landing data; the other cities preload once
  const dataSource = useDbStore((s) => s.dataSource)
  const [byCity, setByCity] = useState<Record<string, ArchSummary[]>>(() => ({}))
  useEffect(() => {
    if (!dataSource) return
    let cancelled = false
    ;(async () => {
      try {
        const options = await dataSource.getFilterOptions()
        const entries = await Promise.all(
          CITIES.filter((c) => c !== "Paris").map(async (name) => {
            const id = cityIdByName(options, name)
            if (!id) throw new Error(`index city "${name}" not found`)
            return [name, await dataSource.getAllArchitectures({ cityIds: [id] })] as const
          }),
        )
        if (!cancelled) setByCity((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
      } catch {
        // cities that didn't load stay dim in the grid
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dataSource])

  const picksByCity = useMemo(() => {
    const out: Record<string, ArchSummary[]> = {}
    for (const name of CITIES) {
      if (name === "Paris") {
        out.Paris = data.heroPicks
        continue
      }
      const items = byCity[name]
      if (!items?.length) continue
      out[name] = pickIndexPhotos(items, items[0].coordinates, PICKS_PER_CITY)
    }
    return out
  }, [byCity, data.heroPicks])

  const [selected, setSelected] = useState<string>("Paris")
  const picks = picksByCity[selected] ?? data.heroPicks

  const cameraFor = useCallback(
    (cityPicks: ArchSummary[]) =>
      fitCamera(
        cityPicks.map((p) => p.coordinates),
        { width: indexPane.width, height: indexPane.height },
        FIT_PADDING,
      ),
    [indexPane],
  )

  // fly in as the transition hands us the screen; hysteresis via ENTRY_REARM_VH
  // keeps a jittering scroll from refiring
  const picksRef = useRef(picks)
  picksRef.current = picks
  const entered = useRef(local.get() >= ENTRY_VH)
  useMotionValueEvent(local, "change", (v) => {
    if (v >= ENTRY_VH) {
      if (entered.current || !map) return
      entered.current = true
      flyToSceneCinematic(map, cameraFor(picksRef.current))
    } else if (v < ENTRY_REARM_VH) {
      entered.current = false
    }
  })

  // restoration path only: deep-linked or reloaded into the hold jumps to
  // the city camera (the entry flight above never fires on mount)
  useEffect(() => {
    if (!map || local.get() < 0) return
    map.jumpTo(cameraFor(picksRef.current))
  }, [map, local, cameraFor])

  const onSelect = useCallback(
    (name: string) => {
      setSelected(name)
      const cityPicks = picksByCity[name]
      if (!map || !cityPicks?.length) return
      flyToSceneCinematic(map, cameraFor(cityPicks))
    },
    [picksByCity, map, cameraFor],
  )

  const fade = useTransform(local, [EXIT_START_VH, EXIT_END_VH], [1, 0])
  // markers own the screen from the landing run-in to the exit window
  const [markersOn, setMarkersOn] = useState(() => {
    const v = local.get()
    return v >= -RAMP_VH && v < EXIT_START_VH
  })
  useMotionValueEvent(local, "change", (v) => setMarkersOn(v >= -RAMP_VH && v < EXIT_START_VH))

  return (
    <Screen className={styles.index}>
      <PhotoMarkers picks={picks} on={markersOn} />
      <motion.div className={styles.splits} style={{ opacity: fade }}>
        <HSplit>
          <Pane size="var(--size-header-height)" />
          <Pane>
            <VSplit>
              <Pane size="var(--grid-padding)" />
              <Pane size="calc(var(--grid-col) * 4)">
                <HSplit>
                  <Pane className={styles.cityBody}>
                    <H1 asChild>
                      <h2 className={styles.city}>{selected}</h2>
                    </H1>
                    <Statement />
                  </Pane>
                  {/* auto = content height: the fixed 4rem rows size this
                      pane, the dossier fills the rest */}
                  <Pane size="auto">
                    <VSplit>
                      <Pane size="calc(var(--grid-col) * 2)">
                        <CityColumn
                          cities={CITIES.slice(0, 3)}
                          selected={selected}
                          loaded={Object.keys(picksByCity)}
                          onSelect={onSelect}
                        />
                      </Pane>
                      <Pane size="calc(var(--grid-col) * 2)">
                        <CityColumn
                          cities={CITIES.slice(3)}
                          selected={selected}
                          loaded={Object.keys(picksByCity)}
                          onSelect={onSelect}
                        />
                      </Pane>
                    </VSplit>
                  </Pane>
                </HSplit>
              </Pane>
              <Pane size="calc(var(--grid-col) * 8)">
                <div data-spine-shape="index" className={styles.mapPane} />
              </Pane>
              <Pane size="var(--grid-padding)" />
            </VSplit>
          </Pane>
        </HSplit>
      </motion.div>
    </Screen>
  )
}

function Statement() {
  return (
    <Body1 asChild>
      <p className={styles.statement}>
        Google Maps treats a masterpiece no differently.
        <br />
        ArchDaily curates everything about it.
        <br />
        <strong>Nolli pins it on the map.</strong>
        <br />
        <strong>Don't miss the masterpiece.</strong>
      </p>
    </Body1>
  )
}

/** One column of the 2x3 city grid — three fixed-height rows, each row IS
 * the button. */
function CityColumn({
  cities,
  selected,
  loaded,
  onSelect,
}: {
  cities: readonly string[]
  selected: string
  loaded: string[]
  onSelect: (name: string) => void
}) {
  return (
    <div className={styles.cityColumn}>
      {cities.map((name) => {
        const ready = loaded.includes(name)
        const cls = [
          styles.cityCell,
          name === selected ? styles.cityCellActive : "",
          ready ? "" : styles.cityCellPending,
        ]
          .filter(Boolean)
          .join(" ")
        return (
          <div
            key={name}
            className={cls}
            onClick={() => ready && onSelect(name)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                if (ready) onSelect(name)
              }
            }}
          >
            {name}
          </div>
        )
      })}
    </div>
  )
}
