import { createContext, useContext, useEffect, useRef } from "react"
import { useTransform, type MotionValue } from "framer-motion"
import { flyToSceneCinematic, type MapRef, type SceneCamera } from "@nolli/map"
import type { LayerKey, SceneKeyframe } from "@/lib/scene"

export type StageMode = "scrub" | "snap"

type StageCtx = {
  mode: StageMode
  /** global scroll position in vh (snap-quantized in snap mode) */
  scrollVh: MotionValue<number>
  /** the morphing map layer rect — camera flights gate on it settling */
  layer: MotionValue<LayerKey>
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

/** Fires a cinematic flight when local scroll crosses a camera keyframe.
 * A flight started while the layer is still morphing lands off-target, so it
 * waits until the layer rect has arrived at the keyframe's layer (or is
 * superseded by a newer cross). Debounced by camera value — the registry
 * rebuilds (new identities) on data/viewport change without a real cross. */
export function useSceneCamera(keyframes: SceneKeyframe[]): void {
  const stage = useStage()
  const own = useSceneId()
  const startVh = stage.ranges[own]?.startVh ?? 0

  const lastCross = useRef<string | null>(null)
  const pending = useRef<{ timer: number; camera: SceneCamera; layer: LayerKey } | null>(null)
  const layerRef = useRef(stage.layer)
  layerRef.current = stage.layer

  useEffect(() => {
    const clear = () => {
      if (pending.current) window.clearTimeout(pending.current.timer)
      pending.current = null
    }

    const rectsClose = (a: LayerKey, b: LayerKey) =>
      Math.abs(a.x - b.x) < 0.002 &&
      Math.abs(a.y - b.y) < 0.002 &&
      Math.abs(a.w - b.w) < 0.002 &&
      Math.abs(a.h - b.h) < 0.002

    const fire = () => {
      const p = pending.current
      if (!p) return
      if (!rectsClose(layerRef.current.get(), p.layer)) {
        p.timer = window.setTimeout(fire, 150)
        return
      }
      clear()
      stage.flyTo(p.camera)
    }

    const onScroll = (vh: number) => {
      const local = vh - startVh
      let target: SceneKeyframe | null = null
      for (const kf of keyframes) {
        if (kf.camera && local >= kf.at) target = kf
      }
      if (!target?.camera) return
      const camera = target.camera
      const key = `${target.at}:${camera.center[0]}:${camera.center[1]}:${camera.zoom}`
      if (lastCross.current === key) return
      lastCross.current = key
      if (stage.mode === "snap") {
        stage.flyTo(camera)
        return
      }
      clear()
      pending.current = { timer: 0, camera, layer: target.layer }
      pending.current.timer = window.setTimeout(fire, 150)
    }

    const unScroll = stage.scrollVh.on("change", onScroll)
    const unLayer = layerRef.current.on("change", () => {
      // re-evaluate as geometry writes land: fires the moment the rect arrives
      if (pending.current) {
        window.clearTimeout(pending.current.timer)
        pending.current.timer = window.setTimeout(fire, 150)
      }
    })
    onScroll(stage.scrollVh.get())
    return () => {
      unScroll()
      unLayer()
      clear()
    }
  }, [keyframes, startVh, stage])
}

export function useMapPortal(): HTMLElement | null {
  return useStage().mapPortal
}

export function useOverlayPortal(): HTMLElement | null {
  return useStage().overlayPortal
}
