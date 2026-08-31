// src/spine/spine.tsx
import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from "react"
import { createPortal } from "react-dom"
import {
  motion, useMotionValue, useMotionValueEvent, useScroll, useTransform,
  type MotionValue,
} from "framer-motion"
import type { MapRef, SceneCamera } from "@nolli/map"
import type { ArchSummary } from "@nolli/data"
import { LandingMap } from "@/components/landing-map"
import { SiteHeader } from "@/components/site-header"
import { buildTimeline, shapeAt, type PxRect, type SpineScene } from "./timeline"

type SpineCtx = {
  scrollVh: MotionValue<number>
  ranges: Record<string, { startVh: number; heightVh: number }>
  mapRef: () => MapRef | null
  mapPortal: HTMLElement | null
  overlayPortal: HTMLElement | null
}

const Ctx = createContext<SpineCtx | null>(null)
const SceneIdCtx = createContext<string | null>(null)

export function useSpineMap(): MapRef | null {
  return useContext(Ctx)?.mapRef() ?? null
}

/** Portal target for scene-owned content that must render inside the map
 * layer (markers) — null until the map mounts. */
export function useMapPortal(): HTMLElement | null {
  return useContext(Ctx)?.mapPortal ?? null
}

/** Portal target for scene-owned overlays that must span the sticky
 * viewport instead of riding the morphing map layer — null until the
 * spine mounts. */
export function useOverlayPortal(): HTMLElement | null {
  return useContext(Ctx)?.overlayPortal ?? null
}

/** Scene-local scroll in vh, unclamped: negative before the scene starts
 * (fade-in ramps), > heightVh past its end (exit fades). */
export function useSceneScroll(id?: string): MotionValue<number> {
  const ctx = useContext(Ctx)
  const own = useContext(SceneIdCtx)
  const sceneId = id ?? own ?? ""
  const startVh = ctx?.ranges[sceneId]?.startVh ?? 0
  const fallback = useMotionValue(0) // stable hook order when ctx is absent
  return useTransform(ctx?.scrollVh ?? fallback, (v) => v - startVh)
}

/** Landing spine. One sticky map layer whose rect is measured from scene
 * panes and linearly morphed across transition scenes; hold scenes mount in
 * flow wrappers and own their camera + content. */
export function Spine({
  scenes, summaries, camera, onMapIdle,
}: {
  scenes: SpineScene[]
  summaries: ArchSummary[]
  camera: SceneCamera
  onMapIdle?: () => void
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapRef | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapPortal, setMapPortal] = useState<HTMLElement | null>(null)
  const [overlayPortal, setOverlayPortal] = useState<HTMLElement | null>(null)

  const timeline = useMemo(() => buildTimeline(scenes), [scenes])
  const ranges = useMemo(() => {
    const out: Record<string, { startVh: number; heightVh: number }> = {}
    for (const s of timeline.segments) out[s.scene.id] = { startVh: s.startVh, heightVh: s.heightVh }
    return out
  }, [timeline])

  // measured shape rects, re-measured on resize; re-applied without a
  // scroll event
  const [rects, setRects] = useState<Record<string, PxRect>>({})
  useEffect(() => {
    const measure = () => {
      const out: Record<string, PxRect> = {}
      const seen = new Set<string>()
      for (const s of scenes) {
        const ref = s.kind === "hold" ? s.shape : undefined
        if (ref && !seen.has(ref)) {
          seen.add(ref)
          const el = document.querySelector(ref)
          if (!el) throw new Error(`spine shape selector '${ref}' matched nothing`)
          const r = el.getBoundingClientRect()
          // Sticky-aware top: an anchor measured at scroll 0 sits at its
          // natural flow position, but the anchor itself or an enclosing
          // component being sticky places it elsewhere — its offset WITHIN
          // the sticky box is scroll-independent, so
          // stickyTop + (r.top - s.top) equals its stuck-position top
          // whether measured stuck or not.
          let top = r.top
          for (let a: Element | null = el; a && a !== wrapperRef.current; a = a.parentElement) {
            if (getComputedStyle(a).position === "sticky") {
              const stickyTop = parseFloat(getComputedStyle(a).top)
              const s = a.getBoundingClientRect()
              top = stickyTop + (r.top - s.top)
              break
            }
          }
          out[ref] = { left: r.left, top, width: r.width, height: r.height }
        }
      }
      setRects(out)
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [scenes])

  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ["start start", "end end"] })
  const scrollVh = useTransform(scrollYProgress, (p) => p * timeline.totalVh)

  const layerX = useMotionValue(0)
  const layerY = useMotionValue(0)
  const layerW = useMotionValue(0)
  const layerH = useMotionValue(0)
  const apply = useCallback((vh: number) => {
    if (!Object.keys(rects).length) return
    const r = shapeAt(timeline, vh, rects)
    layerX.set(r.left); layerY.set(r.top); layerW.set(r.width); layerH.set(r.height)
  }, [timeline, rects, layerX, layerY, layerW, layerH])
  useEffect(() => { apply(scrollVh.get()) }, [apply, scrollVh])
  useMotionValueEvent(scrollVh, "change", apply)

  // initial placement: scenes own the camera afterwards. Layout effect so
  // the placement lands before ANY scene's passive fit effect — passive
  // effects run child-first, which would let a scene's jumpTo be clobbered
  // by this one.
  const setRef = useCallback((m: MapRef | null) => {
    mapRef.current = m
    setMapReady(!!m)
  }, [])
  useLayoutEffect(() => {
    if (!mapReady) return
    mapRef.current?.jumpTo({ center: camera.center, zoom: camera.zoom })
  }, [mapReady, camera])

  // boot reveal signal: first idle render, or a fallback if tiles stall
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    if (!map) return
    let done = false
    const fire = () => { if (!done) { done = true; onMapIdle?.() } }
    map.once("idle", fire)
    const t = setTimeout(fire, 4000)
    return () => { clearTimeout(t); map.off("idle", fire) }
  }, [mapReady, onMapIdle])

  const ctx = useMemo(() => ({
    scrollVh, ranges, mapRef: () => mapRef.current, mapPortal, overlayPortal,
  }), [scrollVh, ranges, mapPortal, overlayPortal])

  return (
    <Ctx.Provider value={ctx}>
      <div ref={wrapperRef} style={{ position: "relative", height: `${timeline.totalVh + 100}vh` }}>
        <div style={{ position: "sticky", top: 0, height: "100svh", overflow: "hidden" }}>
          <motion.div style={{
            position: "absolute", left: layerX, top: layerY, width: layerW, height: layerH,
            overflow: "hidden",
          }}>
            <LandingMap ref={setRef} summaries={summaries}>
              <div ref={setMapPortal} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
            </LandingMap>
          </motion.div>
          <div ref={setOverlayPortal} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
          {createPortal(
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 20 }}>
              <SiteHeader />
            </div>,
            document.body,
          )}
        </div>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, pointerEvents: "none" }}>
          {timeline.segments.map(({ scene }) => (
            <SceneIdCtx.Provider key={scene.id} value={scene.id}>
              <div data-scene={scene.id} style={{ height: `${scene.heightVh}vh`, position: "relative", pointerEvents: "none" }}>
                {scene.kind === "hold" ? <scene.Component /> : scene.Component ? <scene.Component /> : null}
              </div>
            </SceneIdCtx.Provider>
          ))}
        </div>
      </div>
    </Ctx.Provider>
  )
}
