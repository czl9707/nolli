import { createContext, useContext, useEffect, useRef } from "react"
import { useTransform, type MotionValue } from "framer-motion"
import type { MapRef, SceneCamera } from "@nolli/map"
import type { LayerKey, SceneKeyframe } from "@/lib/scene"
import type { Timeline } from "./timeline"

export type StageMode = "scrub" | "snap"

type StageCtx = {
  mode: StageMode
  /** global scroll position in vh (snap-quantized in snap mode) */
  scrollVh: MotionValue<number>
  /** the morphing map layer rect — camera flights gate on it settling */
  layer: MotionValue<LayerKey>
  timeline: Timeline
  ranges: Record<string, { startVh: number; heightVh: number }>
  mapRef: () => MapRef | null
  flyTo: (camera: SceneCamera) => void
  mapPortal: HTMLElement | null
  overlayPortal: HTMLElement | null
}

type SceneCtxValue = { id: string }

const StageCtx = createContext<StageCtx | null>(null)
const SceneCtx = createContext<SceneCtxValue | null>(null)

export const StageInternal = {
  StageProvider: StageCtx.Provider,
  SceneProvider: SceneCtx.Provider,
}

export function useStage(): StageCtx {
  const ctx = useContext(StageCtx)
  if (!ctx) throw new Error("stage hooks outside LandingStage")
  return ctx
}

export function useSceneId(): string {
  const ctx = useContext(SceneCtx)
  if (!ctx) throw new Error("scene hooks outside a scene wrapper")
  return ctx.id
}

/** Scene-local scroll in vh, unclamped: negative before the scene starts
 * (fade-in ramps), > height past its end. */
export function useSceneScroll(id?: string): MotionValue<number> {
  const stage = useStage()
  const own = useSceneId()
  const sceneId = id ?? own
  const startVh = stage.ranges[sceneId]?.startVh ?? 0
  return useTransform(stage.scrollVh, (v) => v - startVh)
}

/** Fires a cinematic flight when this scene's keyframe becomes the
 * timeline-wide camera target — the last camera keyframe at or above the
 * current scroll, so reverse scrolls that hand ownership back re-fly too.
 * Keyframes may sit mid-morph (the layer passes through their rect without
 * holding), so the trigger is the scroll crossing itself, debounced to
 * absorb fast pass-throughs. Debounced by camera value — the registry
 * rebuilds (new identities) on data/viewport change without a real change. */
export function useSceneCamera(keyframes: SceneKeyframe[]): void {
  const stage = useStage()
  const own = useSceneId()
  const startVh = stage.ranges[own]?.startVh ?? 0

  const lastCross = useRef<string | null>(null)
  const pending = useRef<{ timer: number; camera: SceneCamera } | null>(null)

  useEffect(() => {
    if (keyframes.length === 0) return
    const clear = () => {
      if (pending.current) window.clearTimeout(pending.current.timer)
      pending.current = null
    }

    const fire = () => {
      const p = pending.current
      if (!p) return
      clear()
      stage.flyTo(p.camera)
    }

    const onScroll = (vh: number) => {
      // the timeline-wide camera target: last camera keyframe at/below vh
      let owner: { atVh: number; camera: SceneCamera } | null = null
      for (const kf of stage.timeline.keyframes) {
        if (kf.atVh > vh) break
        if (kf.camera) owner = { atVh: kf.atVh, camera: kf.camera }
      }
      // this scene owns the target when the owner keyframe is one of its own
      // camera keyframes — inclusive of a terminal keyframe sitting exactly
      // at its end (the cta's south flight at totalVh), and never a claim on
      // the next scene's at:0 keyframe at a shared boundary
      const ownerAt = owner?.atVh
      const mine =
        ownerAt !== undefined &&
        keyframes.some((kf) => kf.at === ownerAt - startVh && !!kf.camera)
      if (!owner || !mine) {
        // another scene's keyframe owns the camera — drop any pending
        // flight (it would fire late and hijack the new owner's) and allow
        // ours to fire the next time ownership returns
        clear()
        lastCross.current = null
        return
      }
      const camera = owner.camera
      const key = `${owner.atVh}:${camera.center[0]}:${camera.center[1]}:${camera.zoom}`
      if (lastCross.current === key) return
      lastCross.current = key
      if (stage.mode === "snap") {
        stage.flyTo(camera)
        return
      }
      clear()
      pending.current = { timer: 0, camera }
      pending.current.timer = window.setTimeout(fire, 150)
    }

    const unScroll = stage.scrollVh.on("change", onScroll)
    onScroll(stage.scrollVh.get())
    return () => {
      unScroll()
      clear()
    }
  }, [keyframes, startVh, stage])
}

export function useMapPortal(): HTMLElement | null {
  return useStage().mapPortal
}

/** The stage's map instance — scenes render outside the ArchMap tree, so
 * they read the map (and re-supply MapContext to portaled marker content)
 * through here instead of useMap(). */
export function useStageMap(): MapRef | null {
  return useStage().mapRef()
}

export function useOverlayPortal(): HTMLElement | null {
  return useStage().overlayPortal
}
