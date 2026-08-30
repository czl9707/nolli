import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { motion, useTransform } from "framer-motion"
import { Body1, Body2, H1 } from "@nolli/ui"
import { MapContext, PhotoMarker } from "@nolli/map"
import { useDbStore, type ArchSummary } from "@nolli/data"
import type { SceneFactory, SceneKeyframe } from "@/lib/scene"
import type { LandingData } from "@/lib/landing-data"
import { indexPlate } from "@/lib/slots"
import { fitCamera } from "@/lib/camera"
import { cityIdByName, pickIndexPhotos } from "@/lib/shape"
import {
  useSceneCamera,
  useSceneId,
  useSceneScroll,
  useStage,
  useMapPortal,
  useOverlayPortal,
  useStageMap,
} from "@/stage/hooks"
import styles from "./index.module.css"
import markerStyles from "./index.markers.module.css"

/** Hand-picked city index — Paris leads (continuity with the hero dwell). */
const CITIES = ["Paris", "New York", "Tokyo", "London", "Chicago", "Berlin"] as const

const PICKS_PER_CITY = 8

/** Explicit flyTo duration keeps the full arc inside a fixed time budget
 * (maxDuration would clamp the arc shape instead). */
const FLY_MS = 4000

/** Index: the map settles into a standalone plate right of a city-list
 * column. Selecting a city flies the plate there and swaps its photo
 * markers — the "don't miss the masterpiece" demo. Long dwell (stable
 * plate 0→DWELL_VH, most of it after the landing flight ends ~70vh) so the
 * interactive window is easy to land on and sit in. */
const HEIGHT_VH = 220
const DWELL_VH = 140
const EXIT_VH = 40

/** How far before the scene starts (in vh) the landing flight fires. The
 * flight keyframe sits mid-morph: the hero handoff shape change is already
 * underway, the markers ride in with the flight, and the morph, the marker
 * fade, and the column all arrive together at scene start. */
export const FLY_EARLY_VH = 50

/** How far into the hero handoff morph the flight fires (0.35 = the layer
 * is 35% of the way from full screen to the plate). */
const FLIGHT_AT_MORPH = 0.35

export const indexScene: SceneFactory = ({ data, viewport }) => {
  const { rect, px, column } = indexPlate(viewport.w, viewport.h)
  // first city = Paris: the hero hands over a bare Paris map
  const camera = fitCamera(
    data.indexPhotos.map((p) => p.coordinates),
    px,
  )
  // the morph runs hero-dwell-end (108vh global) → scene start: a linear
  // head to the flight point, then an easeOut tail into the plate
  const full: SceneKeyframe["layer"] = { x: 0, y: 0, w: 1, h: 1 }
  const midway = {
    x: full.x + (rect.x - full.x) * FLIGHT_AT_MORPH,
    y: full.y + (rect.y - full.y) * FLIGHT_AT_MORPH,
    w: full.w + (rect.w - full.w) * FLIGHT_AT_MORPH,
    h: full.h + (rect.h - full.h) * FLIGHT_AT_MORPH,
  }
  const keyframes: SceneKeyframe[] = [
    { at: -FLY_EARLY_VH, layer: midway, camera, ease: (t) => t },
    { at: 0, layer: rect, ease: (t) => 1 - Math.pow(1 - t, 3) },
    { at: DWELL_VH, layer: rect },
  ]
  return {
    id: "index",
    heightVh: HEIGHT_VH,
    keyframes,
    Component: () => (
      <IndexScene
        data={data}
        platePx={px}
        column={column}
        keyframes={keyframes}
        rect={rect}
      />
    ),
  }
}

function IndexScene({
  data,
  platePx,
  column,
  keyframes,
  rect,
}: {
  data: LandingData
  platePx: { width: number; height: number }
  column: ReturnType<typeof indexPlate>["column"]
  keyframes: SceneKeyframe[]
  rect: ReturnType<typeof indexPlate>["rect"]
}) {
  useSceneCamera(keyframes)
  const stage = useStage()
  const dataSource = useDbStore((s) => s.dataSource)

  // Paris comes free with the landing data; the other cities preload once
  const [byCity, setByCity] = useState<Record<string, ArchSummary[]>>(() => ({
    Paris: data.cluster,
  }))
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
        // cities that didn't load stay dim in the list
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
        out.Paris = data.indexPhotos
        continue
      }
      const items = byCity[name]
      if (!items?.length) continue
      out[name] = pickIndexPhotos(items, items[0].coordinates, PICKS_PER_CITY)
    }
    return out
  }, [byCity, data.indexPhotos])

  const [selected, setSelected] = useState<string>("Paris")
  const onSelect = (name: string) => {
    setSelected(name)
    const picks = picksByCity[name]
    const map = stage.mapRef()
    if (!picks || !map) return
    const camera = fitCamera(picks.map((p) => p.coordinates), platePx)
    // spot-to-spot clicks ride MapLibre's native flyTo — the arced move
    map.flyTo({ ...camera, essential: true, duration: FLY_MS })
  }

  return (
    <>
      <IndexFrame rect={rect} />
      <IndexPanel
        column={column}
        selected={selected}
        onSelect={onSelect}
        loaded={Object.keys(picksByCity)}
      />
      <IndexPhotoMarkers picks={picksByCity[selected] ?? data.indexPhotos} />
    </>
  )
}

/** Border around the standalone plate, portaled over the map — the layer
 * carries the border radius, the frame draws the hairline. */
function IndexFrame({ rect }: { rect: ReturnType<typeof indexPlate>["rect"] }) {
  const overlay = useOverlayPortal()
  // fades with the markers: 1 through the dwell, linear to 0 over EXIT_VH
  const local = useSceneScroll()
  const opacity = useTransform(local, (v) =>
    v <= DWELL_VH ? 1 : Math.max(0, 1 - (v - DWELL_VH) / EXIT_VH),
  )
  if (!overlay) return null
  return createPortal(
    <motion.div
      className={styles.scene}
      style={
        {
          ...({
            "--plate-x": rect.x,
            "--plate-y": rect.y,
            "--plate-w": rect.w,
            "--plate-h": rect.h,
          } as CSSProperties),
          opacity,
        }
      }
    >
      <div className={styles.frame} />
    </motion.div>,
    overlay,
  )
}

/** City-list column, flow-mounted: a sticky sheet over the left of the
 * plate for the dwell — the selected city leads, the statement sits
 * mid-column, the list anchors the bottom. Plain flow content: it scrolls
 * into view and away with the document, no scroll-driven fade. */
function IndexPanel({
  column,
  selected,
  onSelect,
  loaded,
}: {
  column: ReturnType<typeof indexPlate>["column"]
  selected: string
  onSelect: (name: string) => void
  loaded: string[]
}) {
  return (
    <div
      className={styles.panel}
      style={{
        marginLeft: `${column.left * 100}%`,
        width: `${column.width * 100}%`,
      }}
    >
      <div className={styles.dossier}>
        <H1 asChild>
          <h2 className={styles.city}>{selected}</h2>
        </H1>
      </div>
      <div className={styles.copy}>
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
      </div>
      <ul className={styles.list} role="listbox" aria-label="Cities">
        {CITIES.map((name) => {
          const ready = loaded.includes(name)
          return (
            <Body2 asChild key={name}>
              <li
                className={[
                  styles.row,
                  name === selected ? styles.rowActive : "",
                  ready ? "" : styles.rowPending,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelect(name)}
              >
                {name}
              </li>
            </Body2>
          )
        })}
      </ul>
    </div>
  )
}

/** Photo markers pinned at real coords — MapMarker tracks the camera natively.
 * Marker contents portal into the map container, outside any fade wrapper, so
 * their fade is written onto the container as a CSS var the markers consume
 * (see index.markers.module.css). The hero hands over a bare map; these ride
 * in with the landing flight (ramp -FLY_EARLY_VH→0, completing with the
 * morph), hold through the dwell, and leave by the exit window. While they're
 * on screen the container also flags the normal pin/cluster markers off. */
function IndexPhotoMarkers({ picks }: { picks: ArchSummary[] }) {
  const stage = useStage()
  const own = useSceneId()
  const local = useSceneScroll()
  // with-landing fade: 0 until the flight fires, ramping to 1 across the
  // morph's easeOut tail so the markers complete with the shape change at
  // scene start, out by the scene's exit window
  const opacity = useTransform(local, (v) =>
    v < -FLY_EARLY_VH
      ? 0
      : v < 0
        ? (v + FLY_EARLY_VH) / FLY_EARLY_VH
        : v <= DWELL_VH
          ? 1
          : Math.max(0, 1 - (v - DWELL_VH) / EXIT_VH),
  )
  // flag ownership begins when the ramp begins: the ramp precedes the scene,
  // so a seam at scene start would hold the flag "off" until the fade is
  // already over and the markers would pop in
  const seam = (stage.ranges[own]?.startVh ?? 0) - FLY_EARLY_VH

  const map = useStageMap()
  useEffect(() => {
    if (!map) return
    const el = map.getContainer()
    const apply = () => {
      const o = opacity.get()
      el.style.setProperty("--index-photo-o", String(o))
      if (stage.scrollVh.get() < seam) return
      const state = o > 0.001 ? "on" : "off"
      if (el.dataset.photoMarkers !== state) el.dataset.photoMarkers = state
    }
    apply()
    const un1 = opacity.on("change", apply)
    const un2 = stage.scrollVh.on("change", apply)
    return () => {
      un1()
      un2()
    }
  }, [map, opacity, stage, seam])

  const mapPortal = useMapPortal()
  if (!mapPortal || !map) return null
  // markers mount from the scene tree (outside ArchMap), so re-supply
  // MapContext at the portal source for the MapMarker internals
  return createPortal(
    <MapContext.Provider value={{ map, isLoaded: !!map }}>
      {picks.map((a) => (
        <PhotoMarker key={a.slug} building={a} className={markerStyles.marker} />
      ))}
    </MapContext.Provider>,
    mapPortal,
  )
}
