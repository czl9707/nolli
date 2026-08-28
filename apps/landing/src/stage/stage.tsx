import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion"
import type { MapRef, SceneCamera } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import { flyToSceneCinematic } from "@nolli/map"
import { sceneHeight, type LayerKey, type Scene } from "@/lib/scene"
import { buildTimeline, cameraAtVh, layerAt, snapVh } from "./timeline"
import { StageInternal } from "./hooks"
import { useIsMobile } from "@/lib/use-is-mobile"
import { LandingMap } from "@/components/landing-map"
import { SiteHeader } from "@/components/site-header"

const FULL_LAYER: LayerKey = { x: 0, y: 0, w: 1, h: 1 }

/** Landing spine driver. One sticky map layer scrub-morphed by scroll across
 * the concatenated scene keyframes; each scene's Component mounts in a flow
 * wrapper of its height and reads its local scroll via the stage hooks. */
export function LandingStage({
  scenes,
  summaries,
  onMapIdle,
}: {
  scenes: Scene[]
  summaries: ArchSummary[]
  /** Fired once the map has finished rendering (tiles settled), or after a
   * fallback window if it never settles. Drives the boot cover fade. */
  onMapIdle?: () => void
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapRef | null>(null)
  const reduced = useReducedMotion()
  const snapMode = useIsMobile() || !!reduced

  const timeline = useMemo(() => buildTimeline(scenes), [scenes])
  const ranges = useMemo(() => {
    const out: Record<string, { startVh: number; heightVh: number }> = {}
    let acc = 0
    for (const s of scenes) {
      out[s.id] = { startVh: acc, heightVh: sceneHeight(s) }
      acc += sceneHeight(s)
    }
    return out
  }, [scenes])

  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ["start start", "end end"] })
  const scrollVh = useTransform(scrollYProgress, (p) => {
    const vh = p * timeline.totalVh
    return snapMode ? snapVh(timeline, vh) : vh
  })

  // layer morph — written manually so a timeline rebuild (viewport change)
  // re-applies without needing a scroll event
  const layer = useMotionValue<LayerKey>(FULL_LAYER)
  useEffect(() => {
    layer.set(layerAt(timeline, scrollVh.get()))
  }, [timeline, snapMode, layer, scrollVh])
  useMotionValueEvent(scrollVh, "change", (vh) => layer.set(layerAt(timeline, vh)))
  const layerLeft = useTransform(layer, (l) => `${l.x * 100}%`)
  const layerTop = useTransform(layer, (l) => `${l.y * 100}%`)
  const layerWidth = useTransform(layer, (l) => `${l.w * 100}%`)
  const layerHeight = useTransform(layer, (l) => `${l.h * 100}%`)

  const flyTo = useCallback(
    (camera: SceneCamera) => {
      const map = mapRef.current
      if (!map) return
      if (snapMode) map.jumpTo({ center: camera.center, zoom: camera.zoom })
      else flyToSceneCinematic(map, camera)
    },
    [snapMode],
  )

  // portals
  const [mapPortal, setMapPortal] = useState<HTMLElement | null>(null)
  const [overlayPortal, setOverlayPortal] = useState<HTMLElement | null>(null)

  // initial placement: jump to the camera the timeline targets right now, so
  // a fresh load starts on the first camera and a mid-page reload lands on
  // the current scene
  const [mapReady, setMapReady] = useState(false)
  const setRef = useCallback((m: MapRef | null) => {
    mapRef.current = m
    setMapReady(!!m)
  }, [])
  useEffect(() => {
    if (!mapReady) return
    const vh = snapMode ? snapVh(timeline, scrollVh.get()) : scrollVh.get()
    const camera = cameraAtVh(timeline, vh)
    if (camera) mapRef.current?.jumpTo({ center: camera.center, zoom: camera.zoom })
    // scene photo-marker fades start at 0 — an unset var would compute as
    // opacity 1 and flash the markers before any scene writer lands
    const c = mapRef.current?.getContainer()
    c?.style.setProperty("--index-photo-o", "0")
    c?.style.setProperty("--hero-photo-o", "0")
    // the landing only ever shows scene photo markers — the normal pins
    // stand down for the whole spine
    c?.setAttribute("data-arch-markers", "off")
    // fire once per map instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady])

  // boot reveal signal: MapLibre fires idle once every pending render is
  // done (style, tiles, patterns), which is the first moment the map looks
  // like itself. A fallback keeps a stalled tile fetch from wedging the
  // cover on. Declared after the camera effect so the initial jumpTo's
  // re-render counts toward the idle we catch.
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    if (!map) return
    let done = false
    const fire = () => {
      if (done) return
      done = true
      onMapIdle?.()
    }
    map.once("idle", fire)
    const t = setTimeout(fire, 4000)
    return () => {
      clearTimeout(t)
      map.off("idle", fire)
    }
  }, [mapReady, onMapIdle])

  const stageValue = useMemo(
    () => ({
      mode: snapMode ? ("snap" as const) : ("scrub" as const),
      scrollVh,
      layer,
      timeline,
      ranges,
      mapRef: () => mapRef.current,
      flyTo,
      mapPortal,
      overlayPortal,
    }),
    [snapMode, scrollVh, layer, timeline, ranges, flyTo, mapPortal, overlayPortal],
  )

  return (
    <StageInternal.StageProvider value={stageValue}>
      <div
        ref={wrapperRef}
        style={{ position: "relative", height: `${timeline.totalVh + 100}vh` } as CSSProperties}
      >
        <div style={{ position: "sticky", top: 0, height: "100svh", overflow: "hidden" }}>
          <motion.div
            style={{
              position: "absolute",
              left: layerLeft,
              top: layerTop,
              width: layerWidth,
              height: layerHeight,
              borderRadius: "var(--size-border-radius)",
              overflow: "hidden",
            }}
          >
            <LandingMap ref={setRef} summaries={summaries}>
              <div
                ref={setMapPortal}
                style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
              />
            </LandingMap>
          </motion.div>
          <div
            ref={setOverlayPortal}
            style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}
          />
          {createPortal(
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 20 }}>
              <SiteHeader />
            </div>,
            document.body,
          )}
        </div>
        {/* scene wrappers overlay the sticky stage from the top of the
            wrapper — they'd otherwise stack after its 100svh of flow and the
            hero copy would only reach the viewport after a full screen of
            scroll. The wrapper keeps totalVh + 100vh of height so the
            scroll-progress mapping (start start / end end) is unchanged. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          {scenes.map((s) => (
            <StageInternal.SceneProvider key={s.id} value={{ id: s.id }}>
              <div
                data-scene={s.id}
                style={{
                  height: `${sceneHeight(s)}vh`,
                  position: "relative",
                  pointerEvents: "none",
                }}
              >
                <s.Component />
              </div>
            </StageInternal.SceneProvider>
          ))}
        </div>
      </div>
    </StageInternal.StageProvider>
  )
}
