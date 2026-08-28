import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { motion, useTransform } from "framer-motion"
import { H2 } from "@nolli/ui"
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
const DWELL_VH = 200
const EXIT_VH = 40

/** How far before the scene starts (in vh) the landing flight fires. The
 * camera keyframe must precede the scene to own the camera early, which
 * also completes the hero handoff morph over FLY_EARLY_VH fewer vh — the
 * flight is underway by the time the reader arrives. */
const FLY_EARLY_VH = 24

export const indexScene: SceneFactory = ({ data, viewport }) => {
  const { rect, px, column } = indexPlate(viewport.w, viewport.h)
  // first city = Paris: the hero hands over a bare Paris map
  const camera = fitCamera(
    data.indexPhotos.map((p) => p.coordinates),
    px,
  )
  const keyframes: SceneKeyframe[] = [
    { at: -FLY_EARLY_VH, layer: rect, camera },
    { at: DWELL_VH, layer: rect },
  ]
  return {
    id: "index",
    heightVh: 280,
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
  // fades with the panel: 1 through dwell at 120vh, linear to 0 by 160vh
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
 * mid-column, the list anchors the bottom. */
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
  const local = useSceneScroll()
  const opacity = useTransform(local, (v) =>
    v < 0
      ? 0
      : v < 40
        ? v / 40
        : v <= DWELL_VH
          ? 1
          : Math.max(0, 1 - (v - DWELL_VH) / EXIT_VH),
  )
  // entrance rides the scroll: the sheet rises into place over the same
  // 40vh ramp as the fade
  const y = useTransform(local, (v) => (v < 0 ? 48 : v < 40 ? 48 * (1 - v / 40) : 0))
  return (
    <motion.div
      className={styles.panel}
      style={{
        opacity,
        y,
        marginLeft: `${column.left * 100}%`,
        width: `${column.width * 100}%`,
      }}
    >
      <div className={styles.dossier}>
        <H2 className={styles.city}>{selected}</H2>
      </div>
      <div className={styles.copy}>
        <p className={styles.statement}>
          Google Maps treats a masterpiece no differently.
          <br />
          ArchDaily curates everything about it.
          <br />
          <strong>Nolli pins it on the map.</strong>
          <br />
          <strong>Don't miss the masterpiece.</strong>
        </p>
      </div>
      <ul className={styles.list} role="listbox" aria-label="Cities">
        {CITIES.map((name) => {
          const ready = loaded.includes(name)
          return (
            <li
              key={name}
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
          )
        })}
      </ul>
    </motion.div>
  )
}

/** Photo markers pinned at real coords — MapMarker tracks the camera natively.
 * Marker contents portal into the map container, outside any fade wrapper, so
 * their fade is written onto the container as a CSS var the markers consume
 * (see index.markers.module.css). The hero hands over a bare map; these
 * arrive AFTER the landing flight (ramp 30→70vh), hold through the dwell,
 * and leave by 160vh. While they're on screen the container also flags the
 * normal pin/cluster markers off. */
function IndexPhotoMarkers({ picks }: { picks: ArchSummary[] }) {
  const stage = useStage()
  const own = useSceneId()
  const local = useSceneScroll()
  // after-landing fade: 0 until the flight carries (30vh), in by 70vh,
  // 1 through the dwell, out by the scene's exit window
  const opacity = useTransform(local, (v) =>
    v < 30
      ? 0
      : v < 70
        ? (v - 30) / 40
        : v <= DWELL_VH
          ? 1
          : Math.max(0, 1 - (v - DWELL_VH) / EXIT_VH),
  )
  // the hero owns the shared flags before this scene starts (gated seam)
  const seam = (stage.ranges[own]?.startVh ?? 0) - 5

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
      // while the photo markers own the screen, the normal pins stand down
      const archState = state === "on" ? "off" : "on"
      if (el.dataset.archMarkers !== archState) el.dataset.archMarkers = archState
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
