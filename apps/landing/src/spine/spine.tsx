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
import { MapLean } from "@/components/map-lean"
import { MAP_LEAN_OVERSCAN } from "@/lib/map-lean"
import { applyMapTransition } from "@/lib/map-transition"
import { phaseAtLeast, useBoot, useBootPhase } from "@/lib/boot"
import { buildTimeline, shapeAt, ownerHoldAt, type PxRect, type SpineScene } from "./timeline"
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
}

const Ctx = createContext<SpineCtx | null>(null)
const SceneIdCtx = createContext<string | null>(null)

export function useSpineMap(): MapRef | null {
  return useContext(Ctx)?.mapRef() ?? null
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

/** Landing spine. One map layer whose rect is a PURE FUNCTION of scroll —
 * the original spine's shape segments: holds hold their measured shape,
 * transition scenes lerp between the two shapes across their runway, so
 * every morph plays the same both ways and the map is always on screen.
 * Shapes are measured live each frame, clamped to their stuck position:
 * a pane still travelling toward its stick point is measured AT it (the
 * map waits there while the scene approaches) and rides for real once
 * past it. Crossing a transition's middle flips allegiance — camera and
 * scene-owned map content follow. */

/** A shape's measured rect, clamped to its stuck position — the
 * original spine's sticky-aware measure turned into a clamp: a pane
 * approaching its stick point measures AT the stick point, past it the
 * live rect rules (the ride-out). Fixed fullscreen anchors are their own
 * clamp, so they measure identically everywhere. The sticky-ancestor
 * walk is a per-pane decision, so the caller caches it per element. */
function shapeRect(el: Element, clamp: { sticky: Element | null; top: number }): PxRect {
  const r = el.getBoundingClientRect()
  let top = r.top
  if (clamp.sticky) {
    const s = clamp.sticky.getBoundingClientRect()
    top = Math.min(top, clamp.top + (top - s.top))
  }
  return { left: r.left, top, width: r.width, height: r.height }
}

/** The sticky clamp for a shape pane — its nearest sticky ancestor and
 * that ancestor's `top`. Constant while the pane is mounted. */
function stickyClamp(el: Element): { sticky: Element | null; top: number } {
  for (let a: Element | null = el; a; a = a.parentElement) {
    if (getComputedStyle(a).position === "sticky")
      return { sticky: a, top: parseFloat(getComputedStyle(a).top) }
  }
  return { sticky: null, top: 0 }
}
export function Spine({
  scenes, camera,
}: {
  scenes: SpineScene[]
  camera: SceneCamera
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapRef | null>(null)
  const [mapMounted, setMapMounted] = useState(false)

  const timeline = useMemo(() => buildTimeline(scenes), [scenes])
  const ranges = useMemo(() => {
    const out: Record<string, { startVh: number; heightVh: number }> = {}
    for (const s of timeline.segments) out[s.scene.id] = { startVh: s.startVh, heightVh: s.heightVh }
    return out
  }, [timeline])

  // unique shape selectors, holds and transitions alike — validated once
  // (fail loud at mount, not mid-scroll); the glue reads live rects so
  // nothing is cached to re-measure
  const shapeRefs = useMemo(() => {
    const out: string[] = []
    const seen = new Set<string>()
    for (const s of scenes) {
      const refs = s.kind === "hold" ? [s.shape] : [s.fromShape, s.toShape]
      for (const r of refs) {
        if (!seen.has(r)) {
          seen.add(r)
          out.push(r)
        }
      }
    }
    return out
  }, [scenes])
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

  // glue: one rAF loop writing the layer's style directly. Every frame the
  // shapes are measured live (clamped to their stuck positions) and the
  // layer is placed at shapeAt's pure function of scroll — holds hold,
  // transitions lerp. No motion values — the layer element is styled by
  // hand here and only here.
  const appliedId = useRef<string | null>(null)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const appliedCam = useRef(false)
  const layerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    let raf = 0
    // the panes never remount while the spine lives and their sticky
    // clamp is a mount-time fact — both cached; only the rects re-read
    const panes = new Map<string, Element>()
    const clamps = new WeakMap<Element, { sticky: Element | null; top: number }>()
    // placement is a pure function of scroll — an unchanged scroll value
    // (no resize/font reflow since) re-measures nothing
    let lastVh = Number.NaN
    let dirty = true
    const invalidate = () => { dirty = true }
    window.addEventListener("resize", invalidate)
    document.fonts?.ready.then(invalidate)
    const frame = () => {
      const el = layerRef.current
      const frameEl = frameRef.current
      const vh = scrollVh.get()
      if (el && frameEl && (dirty || vh !== lastVh)) {
        lastVh = vh
        dirty = false
        const rects: Record<string, PxRect> = {}
        for (const ref of shapeRefs) {
          let pane = panes.get(ref)
          if (!pane || !pane.isConnected) {
            pane = document.querySelector(ref) ?? undefined
            if (!pane) continue
            panes.set(ref, pane)
          }
          let clamp = clamps.get(pane)
          if (!clamp) {
            clamp = stickyClamp(pane)
            clamps.set(pane, clamp)
          }
          rects[ref] = shapeRect(pane, clamp)
        }
        // the layer is positioned inside the sticky frame; at the spine's
        // tail the frame itself rides up (wrapper bottom above the
        // frame's), so placement is shape-rect minus the frame's live
        // offset
        const r = shapeAt(timeline, vh, rects)
        const f = frameEl.getBoundingClientRect()
        el.style.left = `${r.left - f.left}px`
        el.style.top = `${r.top - f.top}px`
        el.style.width = `${r.width}px`
        el.style.height = `${r.height}px`
      }
      // re-registered at the END of the loop body: rAF callbacks run in
      // registration order, so the glue stays after the wheel smoother's
      // (Lenis) scroll write each frame — the layer then reads the
      // position the page settles into this frame, not the previous one
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", invalidate)
    }
  }, [timeline, shapeRefs, scrollVh])

  // allegiance: crossing a transition's middle hands the map to the next
  // hold — its camera transitions. The shape itself never fires anything;
  // scroll alone drives it, both ways.
  const fire = useCallback((id: string) => {
    const seg = timeline.segments.find((s) => s.scene.id === id)
    if (!seg) return
    const cam = resolveCamera(seg.scene)
    appliedId.current = id
    setOwnerId(id)
    appliedCam.current = !!cam
    if (cam && mapRef.current) applyMapTransition(mapRef.current, cam)
  }, [timeline])

  useMotionValueEvent(scrollVh, "change", (vh) => {
    if (!shapesReady) return
    const id = ownerHoldAt(timeline, vh)
    if (id === appliedId.current) {
      // deferred camera retry: the flip found no camera (hold unmeasured)
      if (appliedCam.current || !mapRef.current) return
      const seg = timeline.segments.find((s) => s.scene.id === id)!
      const cam = resolveCamera(seg.scene)
      if (!cam) return
      appliedCam.current = true
      applyMapTransition(mapRef.current, cam)
      return
    }
    fire(id)
  })

  // allegiance starts at the scroll position the page loads at — the glue
  // loop takes placement from there. At the top the boot glide has already
  // landed the first hold's camera; a deeper restore still needs the
  // deferred camera retry, so only the first hold marks it applied.
  useEffect(() => {
    if (!shapesReady || appliedId.current) return
    const id = ownerHoldAt(timeline, scrollVh.get())
    appliedId.current = id
    appliedCam.current = id === ownerHoldAt(timeline, 0)
    setOwnerId(id)
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
    scrollVh, ranges, ownerId, mapRef: () => mapRef.current,
  }), [scrollVh, ranges, ownerId])

  return (
    <Ctx.Provider value={ctx}>
      <MapLean />
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
            {/* the map leans inside the clip: MapLean publishes --map-lean-x/-y
                from the pointer, the wrapper is oversized past the layer so the
                lean never exposes the canvas edge */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: -MAP_LEAN_OVERSCAN,
                transform:
                  "translate3d(calc(var(--map-lean-x) * 1px), calc(var(--map-lean-y) * 1px), 0)",
              }}
            >
              <LandingMap ref={setRef} />
            </div>
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
                {scene.Component ? <scene.Component /> : null}
              </div>
            </SceneIdCtx.Provider>
          ))}
        </div>
      </div>
    </Ctx.Provider>
  )
}
