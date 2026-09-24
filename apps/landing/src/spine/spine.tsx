import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from "react"
import {
  motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform,
  type MotionValue,
} from "framer-motion"
import { SCENE_EASE, type MapRef, type SceneCamera } from "@nolli/map"
import { useIsMobile } from "@nolli/ui"
import { LandingMap } from "@/components/landing-map"
import { applyMapTransition, SNAPSHOT_SHAPE_MS } from "@/lib/map-transition"
import { phaseAtLeast, useBoot, useBootPhase } from "@/lib/boot"
import { buildTimeline, crossedBoundary, targetHoldAt, REARM_VH, type PxRect, type SpineScene } from "./timeline"
import hairlineStyles from "@/scenes/page-layout.module.css"

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

function resolveCamera(scene: SpineScene): SceneCamera | null {
  return typeof scene.camera === "function" ? scene.camera() : scene.camera
}

/** Rules-vs-map layering per hold: the sticky frame jumps z at the fire —
 * a clean cut mid transition, no tween. The frame (map layer + portal)
 * sits at --z-map-behind (0, under the items by DOM order — a negative-z
 * frame blanks the map's WebGL canvas) or at --z-map-above over the rules
 * and items; the site header (z20) stays above either. */
function applyLayering(el: HTMLDivElement | null, scene: SpineScene) {
  if (el) el.style.zIndex = scene.rulesOverMap === false ? "var(--z-map-above)" : "var(--z-map-behind)"
}

/** Landing spine. One map layer GLUED to the active scene's shape pane —
 * stuck while the pane sticks, riding up with it when the pane scrolls
 * away. Crossing a hold's trigger boundary flips allegiance: the layer
 * converges onto the next pane (offset tween on the camera's duration and
 * curve) while its camera transitions. Hold scenes mount in flow wrappers
 * and own their camera + content. */
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
    const seen = new Set<string>()
    for (const s of scenes) {
      if (seen.has(s.shape)) continue
      seen.add(s.shape)
      if (!document.querySelector(s.shape)) throw new Error(`spine shape selector '${s.shape}' matched nothing`)
    }
    setShapesReady(true)
  }, [scenes, isMobile])

  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ["start start", "end end"] })
  const scrollVh = useTransform(scrollYProgress, (p) => p * timeline.totalVh)

  // glue + fire tween, one rAF loop writing the layer's style directly:
  // every frame the layer is placed at the active pane's LIVE rect plus an
  // offset; a boundary fire sets the offset (current layer rect − the new
  // pane's live rect) and eases it to zero over the camera's duration, so
  // the layer converges onto a moving target. No motion values — the
  // layer element is styled by hand here and only here.
  const appliedId = useRef<string | null>(null)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const appliedCam = useRef(false)
  const lastFire = useRef<{ boundaryVh: number; dir: 1 | -1 } | null>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const lastRect = useRef<PxRect | null>(null)
  const tween = useRef<{ from: PxRect; start: number; durationMs: number } | null>(null)
  const off = useRef<PxRect>({ left: 0, top: 0, width: 0, height: 0 })
  const reduced = useReducedMotion()

  useEffect(() => {
    let raf = 0
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      const el = layerRef.current
      const seg = appliedId.current
        ? timeline.segments.find((s) => s.scene.id === appliedId.current)
        : null
      const pane = seg ? document.querySelector(seg.scene.shape) : null
      if (!el || !pane) return
      const tw = tween.current
      if (tw) {
        const e = SCENE_EASE(Math.min((t - tw.start) / tw.durationMs, 1))
        off.current = {
          left: tw.from.left * (1 - e),
          top: tw.from.top * (1 - e),
          width: tw.from.width * (1 - e),
          height: tw.from.height * (1 - e),
        }
        if (t - tw.start >= tw.durationMs) tween.current = null
      }
      const p = pane.getBoundingClientRect()
      // the layer is positioned inside the sticky frame; at the spine's
      // tail the frame itself rides up (wrapper bottom above the frame's),
      // so placement is pane-rect minus the frame's live offset
      const f = frameRef.current!.getBoundingClientRect()
      const r: PxRect = {
        left: p.left + off.current.left,
        top: p.top + off.current.top,
        width: p.width + off.current.width,
        height: p.height + off.current.height,
      }
      lastRect.current = r
      el.style.left = `${r.left - f.left}px`
      el.style.top = `${r.top - f.top}px`
      el.style.width = `${r.width}px`
      el.style.height = `${r.height}px`
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [timeline])

  // boundary trigger: crossing into a hold's lead window flips allegiance
  // — camera transition fires, and the layer converges onto the new pane's
  // live rect over the same duration/curve. Reverse crossings replay it.
  const fire = useCallback((id: string, boundaryVh: number, dir: 1 | -1) => {
    const seg = timeline.segments.find((s) => s.scene.id === id)
    if (!seg) return
    const pane = document.querySelector(seg.scene.shape)
    if (!pane) return
    const live = pane.getBoundingClientRect()
    const map = mapRef.current
    const cam = resolveCamera(seg.scene)
    applyLayering(frameRef.current, seg.scene)
    appliedId.current = id
    setOwnerId(id)
    appliedCam.current = !!cam
    lastFire.current = { boundaryVh, dir }
    if (cam && map) applyMapTransition(map, cam)
    const prev = lastRect.current ?? live
    if (reduced) {
      tween.current = null
      off.current = { left: 0, top: 0, width: 0, height: 0 }
      return
    }
    tween.current = {
      from: {
        left: prev.left - live.left,
        top: prev.top - live.top,
        width: prev.width - live.width,
        height: prev.height - live.height,
      },
      start: performance.now(),
      durationMs: SNAPSHOT_SHAPE_MS,
    }
  }, [timeline, mapRef, reduced])

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
    const seg = timeline.segments.find((s) => s.scene.id === appliedId.current)
    if (seg) applyLayering(frameRef.current, seg.scene)
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
              by the glue loop's rAF, not React — initial values only. */}
          <motion.div ref={layerRef} style={{
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
            boot phases (css below — draws in at the furniture beat) */}
        <div className={hairlineStyles.hairlines} data-boot-phase={bootPhase} />
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
                <scene.Component />
              </div>
            </SceneIdCtx.Provider>
          ))}
        </div>
      </div>
    </Ctx.Provider>
  )
}
