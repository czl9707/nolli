import {
  createContext,
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
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion"
import { flyToSceneCinematic, type MapRef, type SceneCamera } from "@nolli/map"
import type { LandingData } from "@/lib/landing-data"
import { cameraTargetAt, sceneFade, SCENES, snap, spineAt, type SceneDef, type SceneId } from "@/lib/spine"
import { CLOSEUP_SLOT, INDEX_SLOT, layerTargetFor } from "@/lib/slots"
import { useIsMobile } from "@/lib/use-is-mobile"
import { LandingMap } from "./landing-map"

type StageCtx = {
  flyTo: (camera: SceneCamera) => void
  mode: "scrub" | "snap"
  fade: (id: SceneId) => MotionValue<number>
}

const Ctx = createContext<StageCtx | null>(null)

export const useLandingStage = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useLandingStage outside LandingStage")
  return ctx
}

/** Slot boxes as unitless viewport fractions on the stage — consuming CSS
 * multiplies by 100vw/100vh; edges via calc(cx - w/2). */
const slotVars = {
  "--slot-index-x": INDEX_SLOT.cx,
  "--slot-index-y": INDEX_SLOT.cy,
  "--slot-index-w": INDEX_SLOT.w,
  "--slot-index-h": INDEX_SLOT.h,
  "--slot-closeup-x": CLOSEUP_SLOT.cx,
  "--slot-closeup-y": CLOSEUP_SLOT.cy,
  "--slot-closeup-w": CLOSEUP_SLOT.w,
  "--slot-closeup-h": CLOSEUP_SLOT.h,
} as CSSProperties

/**
 * Landing spine driver. One sticky dark map layer, scrub-morphed by scroll
 * (clock 1) with cinematic flights fired on target-scene change (clock 2).
 * Mobile/reduced-motion swap scrub for snapped keyframes. Scene overlays
 * mount as absolutely-positioned children faded per sceneFade.
 */
export function LandingStage({ data, scenes }: { data: LandingData; scenes: Record<SceneId, ReactNode> }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapRef | null>(null)
  const reduced = useReducedMotion()
  const snapMode = useIsMobile() || !!reduced

  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // Runtime scene table: merge viewport-dependent slot targets + live hero camera
  const scenesTable: SceneDef[] = useMemo(
    () =>
      SCENES.map((s) => {
        if (s.id === "index") return { ...s, layer: layerTargetFor(INDEX_SLOT, vp.w, vp.h) }
        if (s.id === "closeup") return { ...s, camera: data.heroCamera }
        return s
      }),
    [data, vp],
  )

  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ["start start", "end end"] })

  // Clock 1 — scrub morph (freezes mid-state when scrolling stops)
  const layer = useTransform(scrollYProgress, (p) =>
    spineAt(scenesTable, snapMode ? snap(scenesTable, p) : p),
  )
  const mapTransform = useTransform(
    layer,
    (l) => `translate(${l.x * 100}vw, ${l.y * 100}vh) scale(${l.scale})`,
  )

  // Clock 2 — cinematic flights on target-scene change
  const target = useTransform(scrollYProgress, (p) => cameraTargetAt(scenesTable, p))
  const lastTarget = useRef<SceneDef | null>(null)
  const flyTo = (camera: SceneCamera) => {
    const map = mapRef.current
    if (!map) return
    if (snapMode) map.jumpTo({ center: camera.center, zoom: camera.zoom })
    else flyToSceneCinematic(map, camera)
  }
  useMotionValueEvent(target, "change", (scene) => {
    // Debounce identical targets (cameraTargetAt returns stable refs from the table)
    if (lastTarget.current === scene) return
    lastTarget.current = scene
    flyTo(scene.camera)
  })

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

  const ctx = useMemo<StageCtx>(
    () => ({ flyTo, mode: snapMode ? "snap" : "scrub", fade: (id) => fades[id] }),
    [fades, snapMode],
  )

  return (
    <Ctx.Provider value={ctx}>
      <div ref={wrapperRef} style={{ position: "relative" }}>
        <div
          style={{ position: "sticky", top: 0, height: "100svh", overflow: "hidden", ...slotVars }}
        >
          <motion.div style={{ position: "absolute", inset: 0, willChange: "transform", transform: mapTransform }}>
            <LandingMap ref={mapRef} summaries={data.summaries} initial={data.heroCamera} />
          </motion.div>
          {Object.entries(scenes).map(([id, node]) => (
            <motion.div key={id} style={{ position: "absolute", inset: 0, opacity: fades[id as SceneId] }}>
              {node}
            </motion.div>
          ))}
        </div>
        {/* spacers: scroll length for the spine scenes (footer gets none — its
            heightVh exists only for camera/fade math; the real block follows) */}
        {SCENES.filter((s) => s.id !== "footer").map((s) => (
          <section key={s.id} style={{ height: `${s.heightVh}vh` }} data-scene={s.id} />
        ))}
        {/* footer scene: real block, scrolls up over the pinned stage */}
        {scenes.footer}
      </div>
    </Ctx.Provider>
  )
}
