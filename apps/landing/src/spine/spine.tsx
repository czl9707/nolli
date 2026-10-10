import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from "react"
import {
  motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform,
  type MotionValue,
} from "framer-motion"
import { type MapRef, type SceneCamera } from "@nolli/map"
import { useIsMobile } from "@nolli/ui"
import { LandingMap } from "@/components/landing-map"
import { applyMapTransition } from "@/lib/map-transition"
import { phaseAtLeast, useBoot, useBootPhase } from "@/lib/boot"
import { buildTimeline, shapeAt, crossedBoundary, targetHoldAt, REARM_VH, type PxRect, type ShapeRef, type SpineScene } from "./timeline"
import { Hairlines } from "@/scenes/page-layout"

// boot map arrival: the layer starts placed at a wide zoom and glides into
// the hero fit as the map beat opens, developing from blurred/dim to sharp
// alongside its fade-in (reduced motion places at the fit directly)
const BOOT_GLIDE = { startZoom: 7.5, glideMs: 2400 }
const BOOT_FOCUS = { blur: 16, dim: 0.65, developMs: 1600 }
const FOCUS_PULL = `blur(${BOOT_FOCUS.blur}px) brightness(${BOOT_FOCUS.dim})`

type SpineCtx = {
  scrollVh: MotionValue<number>
  ranges: Record<string, { startVh: number; heightVh: number }>
  ownerId: string | null
  mapRef: () => MapRef | null
  mapPortal: HTMLElement | null
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

/** True while the spine's map allegiance is this scene (the consumer's,
 * or `id` when given). Markers fade at this edge: ownership flips on the
 * boundary fire, so a departing scene's markers never ride the next
 * scene's map. */
export function useSceneOwnsMap(id?: string): boolean {
  const ctx = useContext(Ctx)
  const own = useContext(SceneIdCtx)
  return ctx?.ownerId === (id ?? own)
}

/** Static vh placement of a scene on the spine — its segment window, for
 * scroll arithmetic that must know where the scene sits without measuring
 * the DOM. */
export function useSceneRange(id?: string): { startVh: number; heightVh: number } {
  const ctx = useContext(Ctx)
  const own = useContext(SceneIdCtx)
  return ctx?.ranges[(id ?? own) ?? ""] ?? { startVh: 0, heightVh: 0 }
}

function resolveCamera(scene: SpineScene): SceneCamera | null {
  if (scene.kind !== "hold") return null
  return typeof scene.camera === "function" ? scene.camera() : scene.camera
}

/** Landing spine. One map layer whose rect is a pure function of scroll —
 * holds take their shape pane's live rect, transition scenes lerp between
 * the two panes' live rects across their own scroll span, both
 * directions. Hold scenes mount in flow wrappers; crossing a boundary
 * flips allegiance and transitions the camera. */
export function Spine({
  scenes, camera,
}: {
  scenes: SpineScene[]
  camera: SceneCamera
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapRef | null>(null)
  const [mapMounted, setMapMounted] = useState(false)
  const [mapPortal, setMapPortal] = useState<HTMLElement | null>(null)

  const timeline = useMemo(() => buildTimeline(scenes), [scenes])
  const shapeRefs = useMemo<ShapeRef[]>(
    () => [...new Set(timeline.segments.flatMap((s) =>
      s.scene.kind === "hold" ? [s.scene.shape] : [s.scene.fromShape, s.scene.toShape]))],
    [timeline],
  )
  const ranges = useMemo(() => {
    const out: Record<string, { startVh: number; heightVh: number }> = {}
    for (const s of timeline.segments) out[s.scene.id] = { startVh: s.startVh, heightVh: s.heightVh }
    return out
  }, [timeline])

  // shape selectors validated once (fail loud at mount, not mid-scroll);
  // the glue reads live rects so nothing is cached to re-measure
  const isMobile = useIsMobile()
  const [shapesReady, setShapesReady] = useState(false)
  useEffect(() => {
    for (const ref of shapeRefs) {
      if (!document.querySelector(ref)) throw new Error(`spine shape selector '${ref}' matched nothing`)
    }
    setShapesReady(true)
  }, [shapeRefs, isMobile])

  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ["start start", "end end"] })
  const scrollVh = useTransform(scrollYProgress, (p) => p * timeline.totalVh)

  // glue, one rAF loop writing the layer's style directly: every frame the
  // layer is placed at shapeAt(scroll) — holds take their pane's live rect,
  // transitions lerp between the panes' stuck rects. No motion values — the
  // layer element is styled by hand here and only here.
  const appliedId = useRef<string | null>(null)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const appliedCam = useRef(false)
  const lastFire = useRef<{ boundaryVh: number; dir: 1 | -1 } | null>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    let raf = 0
    const frame = () => {
      const el = layerRef.current
      // live rects for every shape — holds read their own, transitions
      // lerp between the pair
      const live: Record<string, PxRect> = {}
      let ready = !!el
      for (const ref of shapeRefs) {
        const pane = document.querySelector(ref)
        if (!el || !pane) { ready = false; break }
        const r = pane.getBoundingClientRect()
        live[ref] = { left: r.left, top: r.top, width: r.width, height: r.height }
      }
      if (!ready || !el) {
        raf = requestAnimationFrame(frame)
        return
      }
      const r = shapeAt(timeline, scrollVh.get(), live)
      // the layer is positioned inside the sticky frame; at the spine's
      // tail the frame itself rides up (wrapper bottom above the frame's),
      // so placement is shape-rect minus the frame's live offset
      const f = frameRef.current!.getBoundingClientRect()
      const layer = el
      layer.style.left = `${r.left - f.left}px`
      layer.style.top = `${r.top - f.top}px`
      layer.style.width = `${r.width}px`
      layer.style.height = `${r.height}px`
      // re-registered at the END of the loop body: rAF callbacks run in
      // registration order, so the glue stays after the wheel smoother's
      // (Lenis) scroll write each frame — the layer then reads the
      // position the page settles into this frame, not the previous one
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [timeline, shapeRefs, scrollVh])

  // boundary trigger: crossing a boundary flips allegiance — the camera
  // transition fires and the shape morph plays across the transition's
  // scroll span (the glue loop's shapeAt). Reverse crossings replay it.
  const fire = useCallback((id: string, boundaryVh: number, dir: 1 | -1) => {
    const seg = timeline.segments.find((s) => s.scene.id === id)
    if (!seg || seg.scene.kind !== "hold") return
    const map = mapRef.current
    const cam = resolveCamera(seg.scene)
    appliedId.current = id
    setOwnerId(id)
    appliedCam.current = !!cam
    lastFire.current = { boundaryVh, dir }
    if (cam && map) applyMapTransition(map, cam)
  }, [timeline, mapRef])

  useMotionValueEvent(scrollVh, "change", (vh) => {
    if (!shapesReady) return
    const id = targetHoldAt(timeline, vh)
    if (id === appliedId.current) {
      // deferred camera retry: the fire found no camera (pane unmeasured)
      if (appliedCam.current || !mapRef.current) return
      const seg = timeline.segments.find((s) => s.scene.id === id)!
      const cam = resolveCamera(seg.scene)
      if (!cam) return
      appliedCam.current = true
      applyMapTransition(mapRef.current, cam)
      return
    }
    const { boundaryVh, dir } = crossedBoundary(timeline, appliedId.current, id)
    // hysteresis: ignore a direction flip on the boundary we just fired on
    // until scroll clears it by REARM_VH
    const lf = lastFire.current
    if (lf && lf.boundaryVh === boundaryVh && lf.dir !== dir && Math.abs(vh - boundaryVh) < REARM_VH) return
    fire(id, boundaryVh, dir)
  })

  // allegiance starts at the scroll position the page loads at — the glue
  // loop takes placement from there. At the top the boot glide has already
  // landed the first hold's camera; a deeper restore still needs the
  // deferred camera retry, so only the first hold marks it applied.
  useEffect(() => {
    if (!shapesReady || appliedId.current) return
    appliedId.current = targetHoldAt(timeline, scrollVh.get())
    appliedCam.current = appliedId.current === timeline.segments[0].scene.id
    setOwnerId(appliedId.current)
  }, [shapesReady, timeline, scrollVh])

  // initial placement: scenes own the camera afterwards. Layout effect so
  // the placement lands before ANY scene's passive fit effect — passive
  // effects run child-first, which would let a scene's jumpTo be clobbered
  // by this one. The boot glide starts wide; reduced motion places at the fit.
  const { setMapReady } = useBoot()
  const bootPhase = useBootPhase()
  const glides = !reduced
  const setRef = useCallback((m: MapRef | null) => {
    mapRef.current = m
    setMapMounted(!!m)
  }, [])
  useLayoutEffect(() => {
    if (!mapMounted) return
    mapRef.current?.jumpTo(
      glides
        ? { center: camera.center, zoom: BOOT_GLIDE.startZoom }
        : { center: camera.center, zoom: camera.zoom },
    )
  }, [mapMounted, camera, glides])

  // the camera glide itself: fires as the map beat opens. easeTo only
  // (flyTo on this map mis-lands flights — see the easeTo/moveend notes)
  useEffect(() => {
    if (bootPhase !== "map" || !glides) return
    mapRef.current?.easeTo(
      { center: camera.center, zoom: camera.zoom },
      { duration: BOOT_GLIDE.glideMs, easing: (t: number) => 1 - (1 - t) ** 3, essential: true },
    )
  }, [bootPhase, camera, glides])

  // boot reveal signal: the map's first idle render pings the boot sequence
  // (which owns all timing); the map layer's own fade is driven by the phase
  useEffect(() => {
    if (!mapMounted) return
    const map = mapRef.current
    if (!map) return
    map.once("idle", setMapReady)
    return () => { map.off("idle", setMapReady) }
  }, [mapMounted, setMapReady])

  const ctx = useMemo(() => ({
    scrollVh, ranges, ownerId, mapRef: () => mapRef.current, mapPortal,
  }), [scrollVh, ranges, ownerId, mapPortal])

  return (
    <Ctx.Provider value={ctx}>
      <div ref={wrapperRef} style={{ position: "relative", height: `${timeline.totalVh}svh` }}>
        <div
          ref={frameRef}
          style={{ position: "sticky", top: 0, height: "100svh", overflow: "hidden", zIndex: "var(--z-map-behind)" }}
        >
          {/* focus pull: the layer develops from blurred/dim to sharp
              alongside its fade-in at the map beat. Rect styles are written
              by the glue loop's rAF, not React — initial values only.
              data-owner names the holding scene. */}
          <motion.div ref={layerRef} className="spine-map-layer" data-owner={ownerId} style={{
            position: "absolute",
            left: 0, top: 0, width: window.innerWidth, height: window.innerHeight,
            overflow: "hidden",
          }}
            initial={reduced ? false : { opacity: 0, filter: FOCUS_PULL }}
            animate={{
              opacity: phaseAtLeast(bootPhase, "map") ? 1 : 0,
              filter: phaseAtLeast(bootPhase, "map") ? "none" : FOCUS_PULL,
            }}
            transition={{ duration: BOOT_FOCUS.developMs / 1000, ease: "easeOut" }}
          >
            <LandingMap ref={setRef}>
              <div ref={setMapPortal} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
            </LandingMap>
          </motion.div>
        </div>
        {/* the hairline column field — one fixed overlay at --z-rules:
            above the map frame, below every scene item (z0); it follows the
            boot phases (draws in at the furniture beat) */}
        <Hairlines phase={bootPhase} />
        {/* scene flow — z auto, NOT a stacking context: scene items join the
            global z scale directly (reveal drops below the rules, panes and
            content sit at 0 over them) */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, pointerEvents: "none" }}>
          {timeline.segments.map(({ scene }) => (
            <SceneIdCtx.Provider key={scene.id} value={scene.id}>
              <div
                data-scene={scene.id}
                style={{
                  height: `${scene.heightVh}svh`,
                  position: "relative",
                  pointerEvents: "none",
                }}
              >
                {scene.kind === "hold" ? <scene.Component /> : scene.Component ? <scene.Component /> : null}
              </div>
            </SceneIdCtx.Provider>
          ))}
        </div>
      </div>
    </Ctx.Provider>
  )
}
