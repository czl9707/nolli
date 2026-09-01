// Index ledge on the spine (prototype variant A "Ledger" index). The map is
// the spine's layer landing on the empty shape pane; photo markers portal
// into it and gate through a container flag, while the flow tree carries
// the city dossier + 2x3 city-button grid and fades out over the hold's
// tail.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { motion, useTransform } from "framer-motion"
import { Body1, H1 } from "@nolli/ui"
import { MapContext, PhotoMarker, flyToSceneCinematic } from "@nolli/map"
import { useDbStore, type ArchSummary } from "@nolli/data"
import { useMapPortal, useSceneScroll, useSpineMap } from "@/spine/spine"
import type { HoldScene, PxRect } from "@/spine/timeline"
import type { LandingData } from "@/lib/landing-data"
import { fitCamera } from "@/lib/camera"
import { cityIdByName, pickIndexPhotos } from "@/lib/shape"
import { HSplit, Pane, Screen, VSplit } from "./grid"
import markerStyles from "@/components/photo-markers.module.css"
import styles from "./index-ledge.module.css"

/** Hand-picked city index — Paris leads (continuity with the hero dwell). */
const CITIES = ["Paris", "New York", "Tokyo", "London", "Chicago", "Berlin"] as const

const PICKS_PER_CITY = 8

/** Marker visibility window in scene-local vh: flag on at the landing
 * run-in, off again at the exit window (fade length lives in
 * photo-markers.module.css). EXIT_END_VH bounds the content fade below. */
const RAMP_VH = 30
const EXIT_START_VH = 170
const EXIT_END_VH = 199

/** Fit padding in pane px: photo cards hang below the pin, so the
 * south-most pick needs far more room below it than the north-most above. */
const FIT_PADDING = { x: 100, top: 100, bottom: 240 }

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

  // restoration path only: deep-linked or reloaded into the hold jumps to
  // the city camera; entering forward, the transition's flight has already
  // landed close to it, and a jumpTo here would snip that flight. Paris is
  // filtered through HERO_EXCLUDE so the restoration fit matches the one
  // the transition landed on (all 10 vs the fitted 8 would jump the zoom)
  const picksRef = useRef(picks)
  picksRef.current = picks
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

  return (
    <Screen className={styles.index}>
      <IndexPhotoMarkers picks={picks} />
      <motion.div className={styles.splits} style={{ opacity: fade }}>
        <HSplit>
          <Pane size="var(--size-header-height)" />
          <Pane>
            <VSplit>
              <Pane size="var(--grid-padding)" />
              <Pane size="calc(var(--grid-col) * 4)">
                <HSplit>
                  <Pane size="55%" className={styles.cityBody}>
                    <H1 asChild>
                      <h2 className={styles.city}>{selected}</h2>
                    </H1>
                    <Statement />
                  </Pane>
                  <Pane>
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

/** One column of the 2x3 city grid — three panes, each pane IS the button. */
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
    <HSplit>
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
          <Pane key={name}>
            <div
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
          </Pane>
        )
      })}
    </HSplit>
  )
}

/** Photo markers pinned at real coords — MapMarker tracks the camera natively.
 * Marker contents portal into the spine's map layer, outside any fade
 * wrapper, so visibility is a binary container flag (photo-markers.module
 * css transitions the flip): on at the landing run-in, off at the exit
 * window or scrolled back above the run-in. While ours are on screen the
 * container also keeps the normal pin/cluster markers stood down (the
 * spine sets data-arch-markers="off"; our class exempts us from that
 * sweep). */
function IndexPhotoMarkers({ picks }: { picks: ArchSummary[] }) {
  const map = useSpineMap()
  const mapPortal = useMapPortal()
  const local = useSceneScroll()

  useEffect(() => {
    if (!map) return
    const el = map.getContainer()
    const apply = () => {
      const v = local.get()
      if (v >= -RAMP_VH && v < EXIT_START_VH) el.dataset.photoMarkers = "on"
      else el.removeAttribute("data-photo-markers")
    }
    apply()
    const un = local.on("change", apply)
    return () => {
      un()
      el.removeAttribute("data-photo-markers")
    }
  }, [map, local])

  if (!mapPortal || !map) return null
  // markers mount from the scene tree (outside the spine's map), so
  // re-supply MapContext at the portal source for the MapMarker internals
  return createPortal(
    <MapContext.Provider value={{ map, isLoaded: !!map }}>
      {picks.map((a) => (
        <PhotoMarker key={a.slug} building={a} className={markerStyles.indexMarker} />
      ))}
    </MapContext.Provider>,
    mapPortal,
  )
}
