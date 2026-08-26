import { useEffect, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { motion, useTransform } from "framer-motion"
import { Note } from "@nolli/ui"
import { MapContext, PhotoMarker } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import type { SceneFactory, SceneKeyframe } from "@/lib/scene"
import type { LandingData } from "@/lib/landing-data"
import { indexSlot, slotRect, type Slot } from "@/lib/slots"
import { useSceneCamera, useSceneScroll, useMapPortal, useOverlayPortal, useStageMap } from "@/stage/hooks"
import styles from "./index.module.css"
import markerStyles from "./index.markers.module.css"

/** Index: the plate settles into the photo slot; pinned frame + sticky copy. */
export const indexScene: SceneFactory = ({ data, viewport }) => {
  const slot = indexSlot(viewport.w)
  const keyframes: SceneKeyframe[] = [
    { at: 0, layer: slotRect(slot), camera: data.indexCamera },
    { at: 120, layer: slotRect(slot) },
  ]
  return {
    id: "index",
    heightVh: 200,
    keyframes,
    Component: () => (
      <IndexScene
        data={data}
        indexPhotos={data.indexPhotos}
        slot={slot}
        keyframes={keyframes}
      />
    ),
  }
}

function IndexScene({
  data,
  indexPhotos,
  slot,
  keyframes,
}: {
  data: LandingData
  indexPhotos: ArchSummary[]
  slot: Slot
  keyframes: SceneKeyframe[]
}) {
  useSceneCamera(keyframes)
  return (
    <>
      <IndexFrame slot={slot} />
      <IndexCopy data={data} slot={slot} />
      <IndexPhotoMarkers picks={indexPhotos} />
    </>
  )
}

/** Index pinned chrome (prototype E "light app mode"): the frame around the
 * card slot, portaled over the map — the plate resizes into the slot at
 * dwell, so the frame only draws its border; the cream page behind is the
 * surround. The slot vars are this scene's own concern now. */
function IndexFrame({ slot }: { slot: Slot }) {
  const overlay = useOverlayPortal()
  if (!overlay) return null
  return createPortal(
    <div
      className={styles.scene}
      style={
        {
          "--slot-index-x": slot.cx,
          "--slot-index-y": slot.cy,
          "--slot-index-w": slot.w,
          "--slot-index-h": slot.h,
        } as CSSProperties
      }
    >
      <div className={styles.frame} />
    </div>,
    overlay,
  )
}

/** Index copy, flow-mounted: a sticky fullscreen sheet whose content sits
 * just above the slot — scrolls in from below, dwells pinned over the index
 * range, exits the top. The slot vars live on the frame's portal element,
 * which the flow-mounted sheet can't inherit — set them here too. */
function IndexCopy({ data, slot }: { data: LandingData; slot: Slot }) {
  const local = useSceneScroll()
  // 1 through dwell at 120vh, linear to 0 by 160vh
  const opacity = useTransform(local, (v) =>
    v <= 120 ? 1 : Math.max(0, 1 - (v - 120) / 40),
  )
  void data
  return (
    <motion.div
      className={styles.copy}
      style={
        {
          ...({
            "--slot-index-x": slot.cx,
            "--slot-index-y": slot.cy,
            "--slot-index-w": slot.w,
            "--slot-index-h": slot.h,
          } as CSSProperties),
          opacity,
        }
      }
    >
      <div className={styles.copyBody}>
        <Note asChild>
          <p className={styles.overline}>The Index</p>
        </Note>
        <h2 className={styles.statement}>
          Google Map has all the pins.
          <br />
          ArchDaily has all the information.
          <br />
          <strong>Nolli bridges the gap.</strong>
        </h2>
      </div>
    </motion.div>
  )
}

/** Photo markers pinned at real coords — MapMarker tracks the camera natively.
 * Marker contents portal into the map container, outside any fade wrapper, so
 * their fade is written onto the container as a CSS var the markers consume
 * (see index.markers.module.css). While the photo markers are on screen (index
 * dwell, or the hero where the cursor plate clips them), the container also
 * flags the normal pin/cluster markers off. */
function IndexPhotoMarkers({ picks }: { picks: ArchSummary[] }) {
  const local = useSceneScroll()
  // index fade: ramp in from -50vh, 1 through the dwell, out by 160vh
  const opacity = useTransform(local, (v) =>
    v < -50 ? 0 : v < 0 ? (v + 50) / 50 : v <= 120 ? 1 : Math.max(0, 1 - (v - 120) / 40),
  )
  // hero fade: 1 through 108vh, linear to 0 by 144vh
  const heroLocal = useSceneScroll("hero")
  const heroO = useTransform(heroLocal, (v) =>
    v <= 108 ? 1 : Math.max(0, 1 - (v - 108) / 36),
  )
  const map = useStageMap()

  useEffect(() => {
    if (!map) return
    const el = map.getContainer()
    // reads both sources fresh: opacity and heroO both subscribe this, and a
    // subscriber's own value must not win just because it fired last
    const apply = () => {
      const o = opacity.get()
      const heroOn = heroO.get() > 0.001
      el.style.setProperty("--index-photo-o", String(o))
      // photo markers own the screen during the index dwell AND the hero
      // (there the cursor plate clips them — see hero.tsx)
      const state = o > 0 || heroOn ? "on" : "off"
      if (el.dataset.photoMarkers !== state) el.dataset.photoMarkers = state
      // while the photo markers own the screen, the normal pins stand down
      const archState = state === "on" ? "off" : "on"
      if (el.dataset.archMarkers !== archState) el.dataset.archMarkers = archState
      // hero mode: markers render fully visible; the plate clip gates them
      const heroState = heroOn ? "on" : "off"
      if (el.dataset.heroPlate !== heroState) el.dataset.heroPlate = heroState
    }
    apply()
    const un1 = opacity.on("change", apply)
    const un2 = heroO.on("change", apply)
    return () => {
      un1()
      un2()
      el.style.removeProperty("--index-photo-o")
      delete el.dataset.photoMarkers
      delete el.dataset.archMarkers
      delete el.dataset.heroPlate
    }
  }, [map, opacity, heroO])

  const mapPortal = useMapPortal()
  if (!mapPortal) return null
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
