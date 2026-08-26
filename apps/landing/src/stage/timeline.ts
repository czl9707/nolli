import { sceneHeight, type LayerKey, type Scene } from "@/lib/scene"
import type { SceneCamera } from "@nolli/map"

export type TimelineKeyframe = {
  /** absolute vh from page top */
  atVh: number
  layer: LayerKey
  camera?: SceneCamera
  ease: (t: number) => number
}

export type Timeline = {
  totalVh: number
  keyframes: TimelineKeyframe[]
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function buildTimeline(scenes: Scene[]): Timeline {
  const keyframes: TimelineKeyframe[] = []
  let acc = 0
  for (const s of scenes) {
    for (const kf of s.keyframes) {
      const entry = { atVh: acc + kf.at, layer: kf.layer, camera: kf.camera, ease: kf.ease ?? easeInOutCubic }
      const prev = keyframes.at(-1)
      if (prev && prev.atVh === entry.atVh)
        keyframes[keyframes.length - 1] = entry.camera ? entry : { ...entry, camera: prev.camera }
      else keyframes.push(entry)
    }
    acc += sceneHeight(s)
  }
  return { totalVh: acc, keyframes }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function layerAt(tl: Timeline, vh: number): LayerKey {
  const kfs = tl.keyframes
  if (vh <= kfs[0].atVh) return kfs[0].layer
  for (let i = 1; i < kfs.length; i++) {
    if (vh <= kfs[i].atVh) {
      const a = kfs[i - 1]
      const b = kfs[i]
      const u = b.ease((vh - a.atVh) / (b.atVh - a.atVh))
      return {
        x: lerp(a.layer.x, b.layer.x, u),
        y: lerp(a.layer.y, b.layer.y, u),
        w: lerp(a.layer.w, b.layer.w, u),
        h: lerp(a.layer.h, b.layer.h, u),
      }
    }
  }
  return kfs.at(-1)!.layer
}

export function cameraAtVh(tl: Timeline, vh: number): SceneCamera | undefined {
  let cam: SceneCamera | undefined
  for (const kf of tl.keyframes) {
    if (kf.atVh > vh) break
    if (kf.camera) cam = kf.camera
  }
  return cam
}

export function snapVh(tl: Timeline, vh: number): number {
  let best = tl.keyframes[0].atVh
  for (const kf of tl.keyframes) {
    if (Math.abs(kf.atVh - vh) < Math.abs(best - vh)) best = kf.atVh
  }
  return best
}
