import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion"
import { flyToSceneCinematic, type MapRef, type SceneCamera } from "@nolli/map"
import type { LandingData } from "@/lib/landing-data"
import {
  cameraTargetAt,
  sceneFade,
  SCENES,
  snap,
  spineAt,
  type LayerKey,
  type SceneDef,
  type SceneId,
} from "@/lib/spine"
import { closeupSlot, indexSlot, slotRect, type Slot } from "@/lib/slots"
import { useIsMobile } from "@/lib/use-is-mobile"
import { LandingMap } from "./landing-map"

type StageCtx = {
  flyTo: (camera: SceneCamera) => void
  mode: "scrub" | "snap"
  fade: (id: SceneId) => MotionValue<number>
  /** px offset applied (as a transitioned CSS translate) to the map layer and
   * its paper card — the closeup board relocates the map item per arch. */
  setBoardShift: (x: number, y: number) => void
}

const Ctx = createContext<StageCtx | null>(null)

export const useLandingStage = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useLandingStage outside LandingStage")
  return ctx
}

/** Slot vars as unitless viewport fractions on the stage — consuming CSS
 * multiplies by 100vw/100vh; edges via calc(cx - w/2). */
const FULL_LAYER: LayerKey = { x: 0, y: 0, w: 1, h: 1 }

function slotVarsFor(idxSlot: Slot, cupSlot: Slot) {
  return {
    "--slot-index-x": idxSlot.cx,
    "--slot-index-y": idxSlot.cy,
    "--slot-index-w": idxSlot.w,
    "--slot-index-h": idxSlot.h,
    "--slot-closeup-x": cupSlot.cx,
    "--slot-closeup-y": cupSlot.cy,
    "--slot-closeup-w": cupSlot.w,
    "--slot-closeup-h": cupSlot.h,
  } as CSSProperties
}

/**
 * Landing spine driver. One sticky dark map layer, scrub-morphed by scroll
 * (clock 1) with cinematic flights fired on target-scene change (clock 2).
 * Mobile/reduced-motion swap scrub for snapped keyframes. Map-attached
 * chrome (frames, markers) mounts as faded overlays inside the sticky stage;
 * scene copy lives in flow wrappers after it — each wrapper is a tall scroll
 * range whose sticky content scrolls in from below, dwells while the range
 * passes, and exits the top.
 */
export function LandingStage({
  data,
  scenes,
  flows,
  mapChildren,
  underMap,
}: {
  data: LandingData
  /** Pinned overlays inside the sticky stage (map-attached chrome), faded per
   * sceneFade. Omitted scenes have no pinned part. */
  scenes: Partial<Record<SceneId, ReactNode>>
  /** Scene copy blocks in spine order. heightVh wraps the node in a flow
   * range of that height (the node itself makes sticky/dwell decisions);
   * without heightVh the node is rendered bare (the hero owns its block). */
  flows: { id: SceneId; heightVh?: number; node: ReactNode }[]
  /** Extra content inside the map layer (ArchMap children) — e.g. overlays
   * pinned to map coords. Renders after the map mounts. */
  mapChildren?: ReactNode
  /** Pinned overlay rendered BENEATH the map layer (e.g. the closeup paper
   * card the map window sits on), faded per its scene. */
  underMap?: { id: Exclude<SceneId, "hero" | "footer">; node: ReactNode }
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapRef | null>(null)
  const reduced = useReducedMotion()
  const snapMode = useIsMobile() || !!reduced

  // Index plate capped like the app's content container; recompute on resize
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  const { w: vw, h: vh } = vp
  const idxSlot = useMemo(() => indexSlot(vw), [vw])
  const cupSlot = useMemo(() => closeupSlot(vw, vh), [vw, vh])
  const slotVars = useMemo(() => slotVarsFor(idxSlot, cupSlot), [idxSlot, cupSlot])

  // board shift: per-arch map-item relocation inside the closeup scene (px
  // translate on the layer + paper card; the scroll-driven rect is untouched)
  const [boardShift, setBoardShiftState] = useState({ x: 0, y: 0 })
  const setBoardShift = useCallback(
    (x: number, y: number) =>
      setBoardShiftState((prev) => (prev.x === x && prev.y === y ? prev : { x, y })),
    [],
  )

  // Runtime scene table: index camera fit to the photo-marker picks and the
  // index layer at the capped slot; closeup camera from data.heroCamera with
  // the layer at the pin-board's site-map slot
  const scenesTable: SceneDef[] = useMemo(
    () =>
      SCENES.map((s) =>
        s.id === "index"
          ? { ...s, camera: data.indexCamera, layer: slotRect(idxSlot) }
          : s.id === "closeup"
            ? { ...s, camera: data.heroCamera, layer: slotRect(cupSlot) }
            : s,
      ),
    [data, idxSlot, cupSlot],
  )

  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ["start start", "end end"] })

  // Clock 1 — scrub morph (freezes mid-state when scrolling stops). Rect
  // written as real container geometry (% of the sticky stage = viewport);
  // MapLibre's trackResize re-renders the canvas natively. Written manually
  // (not useTransform) so a slot change on resize re-applies without needing
  // a scroll event to recompute.
  const layer = useMotionValue<LayerKey>(FULL_LAYER)
  const applyLayer = useCallback(
    (p: number) => {
      layer.set(spineAt(scenesTable, snapMode ? snap(scenesTable, p) : p))
    },
    [layer, scenesTable, snapMode],
  )
  useMotionValueEvent(scrollYProgress, "change", applyLayer)
  useEffect(() => {
    applyLayer(scrollYProgress.get())
  }, [applyLayer])
  const layerLeft = useTransform(layer, (l) => `${l.x * 100}%`)
  const layerTop = useTransform(layer, (l) => `${l.y * 100}%`)
  const layerWidth = useTransform(layer, (l) => `${l.w * 100}%`)
  const layerHeight = useTransform(layer, (l) => `${l.h * 100}%`)

  // Clock 2 — cinematic flights on target-scene change. Quantized in snap
  // mode so the camera holds the same keyframe the (snapped) layer shows.
  const target = useTransform(scrollYProgress, (p) =>
    cameraTargetAt(scenesTable, snapMode ? snap(scenesTable, p) : p),
  )
  const lastTarget = useRef<SceneDef | null>(null)
  const flightSeq = useRef(0)
  const flyTo = (camera: SceneCamera) => {
    const map = mapRef.current
    if (!map) return
    if (snapMode) {
      map.jumpTo({ center: camera.center, zoom: camera.zoom })
      return
    }
    flyToSceneCinematic(map, camera)
  }
  // A flight started while clock 1 is still morphing the container lands
  // off-target (see flyTo) — so a flight fires ONLY once the layer rect has
  // arrived at the target scene's slot: shape settles first, then the camera
  // flies on a static container. If the user stops mid-transition the flight
  // simply waits; it leaves when the morph is completed (or is superseded by
  // a newer target).
  const pendingFlight = useRef<{
    token: number
    timer: number | null
    targetLayer: LayerKey
    camera: SceneCamera
  } | null>(null)
  const layerRef = useRef(layer)
  layerRef.current = layer
  const clearPendingFlight = () => {
    if (pendingFlight.current?.timer) window.clearTimeout(pendingFlight.current.timer)
    pendingFlight.current = null
  }
  useEffect(() => clearPendingFlight, [])
  const rectsClose = (a: LayerKey, b: LayerKey) =>
    Math.abs(a.x - b.x) < 0.002 &&
    Math.abs(a.y - b.y) < 0.002 &&
    Math.abs(a.w - b.w) < 0.002 &&
    Math.abs(a.h - b.h) < 0.002
  const tryFirePendingFlight = useCallback(() => {
    const pending = pendingFlight.current
    if (!pending) return
    if (!rectsClose(layerRef.current.get(), pending.targetLayer)) {
      pending.timer = window.setTimeout(tryFirePendingFlight, 150)
      return
    }
    const camera = pending.camera
    clearPendingFlight()
    flyTo(camera)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapMode])
  const armPendingFlight = useCallback(
    (scene: SceneDef) => {
      flightSeq.current++
      clearPendingFlight()
      pendingFlight.current = {
        token: flightSeq.current,
        timer: null,
        targetLayer: scene.layer,
        camera: scene.camera,
      }
      pendingFlight.current.timer = window.setTimeout(tryFirePendingFlight, 150)
    },
    [tryFirePendingFlight],
  )
  useMotionValueEvent(layer, "change", () => {
    // re-evaluate on each geometry write: fires the moment the rect lands
    const pending = pendingFlight.current
    if (!pending) return
    if (pending.timer) window.clearTimeout(pending.timer)
    pending.timer = window.setTimeout(tryFirePendingFlight, 150)
  })
  useMotionValueEvent(target, "change", (scene) => {
    // Debounce by camera VALUE: the table rebuilds (new identity) on data change
    const last = lastTarget.current
    if (
      last &&
      last.camera.center[0] === scene.camera.center[0] &&
      last.camera.center[1] === scene.camera.center[1] &&
      last.camera.zoom === scene.camera.zoom
    ) {
      lastTarget.current = scene
      return
    }
    lastTarget.current = scene
    // leaving closeup resets the map-item relocation (other scenes' rects are
    // scroll-driven — a leftover shift would offset them)
    if (scene.id !== "closeup" && boardShift.x !== 0) setBoardShift(0, 0)
    if (snapMode) {
      flyTo(scene.camera)
      return
    }
    armPendingFlight(scene)
  })
  // Initial placement: jump (not fly) to the camera the spine targets right now,
  // so a fresh load starts on the hero camera and a mid-page reload lands on
  // the current scene. Gated on map readiness — the MapLibre instance arrives
  // asynchronously inside Map.
  const [mapReady, setMapReady] = useState(false)
  const setMapRef = useCallback((m: MapRef | null) => {
    mapRef.current = m
    setMapReady(!!m)
  }, [])
  useEffect(() => {
    if (!mapReady) return
    const p = scrollYProgress.get()
    const scene = cameraTargetAt(scenesTable, snapMode ? snap(scenesTable, p) : p)
    lastTarget.current = scene
    mapRef.current?.jumpTo({ center: scene.camera.center, zoom: scene.camera.zoom })
    // fire once per map instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady])

  // Per-scene fade MotionValues for overlays
  const fadeHero = useTransform(scrollYProgress, (p) => sceneFade(scenesTable, "hero", p))
  const fadeIndex = useTransform(scrollYProgress, (p) => sceneFade(scenesTable, "index", p))
  const fadeCloseup = useTransform(scrollYProgress, (p) => sceneFade(scenesTable, "closeup", p))
  const fadeCta = useTransform(scrollYProgress, (p) => sceneFade(scenesTable, "cta", p))
  const fadeFooter = useTransform(scrollYProgress, (p) => sceneFade(scenesTable, "footer", p))
  const fades: Record<SceneId, MotionValue<number>> = {
    hero: fadeHero,
    index: fadeIndex,
    closeup: fadeCloseup,
    cta: fadeCta,
    footer: fadeFooter,
  }
  // Faded overlays must not eat clicks meant for the scene below them
  // (footer is flow-mounted, not an overlay — no binding needed)
  const heroPe = useTransform(fadeHero, (v): string => (v < 0.5 ? "none" : "auto"))
  const indexPe = useTransform(fadeIndex, (v): string => (v < 0.5 ? "none" : "auto"))
  const closeupPe = useTransform(fadeCloseup, (v): string => (v < 0.5 ? "none" : "auto"))
  const ctaPe = useTransform(fadeCta, (v): string => (v < 0.5 ? "none" : "auto"))
  const pointerEvents: Record<Exclude<SceneId, "footer">, MotionValue<string>> = {
    hero: heroPe,
    index: indexPe,
    closeup: closeupPe,
    cta: ctaPe,
  }

  const ctx = useMemo<StageCtx>(
    () => ({
      flyTo,
      mode: snapMode ? "snap" : "scrub",
      fade: (id) => fades[id],
      setBoardShift,
    }),
    [fades, snapMode, setBoardShift],
  )

  // the shift rides on CSS translate (not left/top) so MapLibre never sees a
  // container resize and mid-flight cameras stay intact
  const shiftStyle = {
    translate: `${boardShift.x}px ${boardShift.y}px`,
    transition: "translate 0.65s cubic-bezier(0.22, 0.9, 0.3, 1)",
  } as const

  return (
    <Ctx.Provider value={ctx}>
      <div
        ref={wrapperRef}
        style={{
          position: "relative",
          ...slotVars,
          "--board-shift-x": `${boardShift.x}px`,
          "--board-shift-y": `${boardShift.y}px`,
        } as CSSProperties}
      >
        <div style={{ position: "sticky", top: 0, height: "100svh", overflow: "hidden" }}>
          {underMap && (
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                ...shiftStyle,
                opacity: fades[underMap.id],
                pointerEvents: "none",
              }}
            >
              {underMap.node}
            </motion.div>
          )}
          <motion.div
            style={{
              position: "absolute",
              left: layerLeft,
              top: layerTop,
              width: layerWidth,
              height: layerHeight,
              ...shiftStyle,
              borderRadius: "var(--size-border-radius)",
              overflow: "hidden",
            }}
          >
            <LandingMap ref={setMapRef} summaries={data.summaries}>
              {mapChildren}
            </LandingMap>
          </motion.div>
          {Object.entries(scenes)
            .filter(([id, node]) => node && id !== "hero" && id !== "footer")
            .map(([id, node]) => (
              <motion.div
                key={id}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: fades[id as SceneId],
                  pointerEvents: pointerEvents[id as Exclude<SceneId, "footer" | "hero">],
                }}
              >
                {node}
              </motion.div>
            ))}
        </div>
        {/* scene copy in flow: wrappers are the scenes' scroll ranges (same
            heights the spacers used to have, so the spine's total scroll
            length and every scene boundary are unchanged). Each scene's own
            CSS makes its content sticky inside the range — it scrolls in
            from below, dwells while the range passes, exits the top. */}
        {flows.map((f) =>
          f.heightVh === undefined ? (
            <Fragment key={f.id}>{f.node}</Fragment>
          ) : (
            <div
              key={f.id}
              data-scene={f.id}
              style={{
                height: `${f.heightVh}vh`,
                position: "relative",
                zIndex: 2,
                pointerEvents: "none",
              }}
            >
              {f.node}
            </div>
          ),
        )}
        {/* the hero block nets +100svh of flow, so its spacer gives back
            100vh to keep the spine's scroll budget where sceneRange expects */}
        <section style={{ height: `${SCENES[0].heightVh - 100}vh` }} data-scene="hero" />
        {/* footer scene: real block, scrolls up over the pinned stage */}
        {scenes.footer}
      </div>
    </Ctx.Provider>
  )
}
