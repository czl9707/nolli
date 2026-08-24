import type { SceneCamera } from "@nolli/map"
import { CLUSTER_CAMERA, HERO_CAMERA, SOUTH_CAMERA, WORLD_CAMERA } from "@/lib/constants"
import { INDEX_SLOT, slotRect, type SlotRect } from "./slots"

/**
 * Scroll spine (clock 1): maps container scroll progress (0..1) to layer
 * state. Pure timeline, no snap. Each scene's range splits into:
 *   [0, DWELL_RATIO)   — hold the scene's keyframes (composition dwells)
 *   [DWELL_RATIO, 1)   — eased transition toward the NEXT scene's keyframes
 * The last scene dwells to the end.
 */

/** Layer geometry: viewport fractions, x/y = top-left edges. The stage writes
 * these as % left/top/width/height — real container geometry, MapLibre
 * resizes natively. */
export type LayerKey = SlotRect

export type SceneId = "hero" | "index" | "cta" | "footer"

export type SceneDef = {
  id: SceneId
  heightVh: number
  camera: SceneCamera
  layer: LayerKey
}

export const DWELL_RATIO = 0.6

const FULL: LayerKey = { x: 0, y: 0, w: 1, h: 1 }

export const SCENES: SceneDef[] = [
  { id: "hero", heightVh: 180, camera: HERO_CAMERA, layer: FULL },
  { id: "index", heightVh: 200, camera: CLUSTER_CAMERA, layer: slotRect(INDEX_SLOT) },
  { id: "cta", heightVh: 160, camera: WORLD_CAMERA, layer: FULL },
  { id: "footer", heightVh: 80, camera: SOUTH_CAMERA, layer: FULL },
]

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpLayer(a: LayerKey, b: LayerKey, t: number): LayerKey {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    w: lerp(a.w, b.w, t),
    h: lerp(a.h, b.h, t),
  }
}

type SceneRange = { start: number; end: number }

function sceneRange(scenes: SceneDef[], id: SceneId): SceneRange {
  const total = scenes.reduce((sum, s) => sum + s.heightVh, 0)
  let acc = 0
  for (const s of scenes) {
    const len = s.heightVh / total
    if (s.id === id) return { start: acc / total, end: acc / total + len }
    acc += s.heightVh
  }
  throw new Error(`unknown scene ${id}`)
}

export function spineAt(scenes: SceneDef[], progress: number): LayerKey {
  const total = scenes.reduce((sum, s) => sum + s.heightVh, 0)
  let acc = 0
  for (let i = 0; i < scenes.length; i++) {
    const len = scenes[i].heightVh / total
    const start = acc / total
    const end = start + len
    if (progress < end || i === scenes.length - 1) {
      const local = Math.min(Math.max((progress - start) / len, 0), 1)
      if (i === scenes.length - 1 || local < DWELL_RATIO) {
        return scenes[i].layer
      }
      const u = easeInOutCubic((local - DWELL_RATIO) / (1 - DWELL_RATIO))
      return lerpLayer(scenes[i].layer, scenes[i + 1].layer, u)
    }
    acc += scenes[i].heightVh
  }
  return scenes.at(-1)!.layer
}

/** Clock 2 target: during scene i's dwell -> scene i; during its transition
 * -> scene i + 1. The last scene holds itself to the end. */
export function cameraTargetAt(scenes: SceneDef[], p: number): SceneDef {
  const total = scenes.reduce((sum, s) => sum + s.heightVh, 0)
  let acc = 0
  for (let i = 0; i < scenes.length; i++) {
    const start = acc / total
    const end = start + scenes[i].heightVh / total
    if (p < end || i === scenes.length - 1) {
      const local = Math.min(Math.max((p - start) / (end - start), 0), 1)
      return local < DWELL_RATIO || i === scenes.length - 1 ? scenes[i] : scenes[i + 1]
    }
    acc += scenes[i].heightVh
  }
  return scenes.at(-1)!
}

/** Scene copy visibility over the spine: 0 before the approach, fade in over
 * the quarter-scene before the scene starts, 1 through dwell, fade out across
 * the outgoing transition's first half. The first scene is 1 from p=0; the
 * last holds 1 to the end (no fade-out, matching spineAt's last-scene dwell).
 * The LAST-BUT-ONE scene also fades out late — across its whole transition —
 * because the last scene (footer) is flow-mounted: no overlay crossfades
 * against it, and its block arrives at the scene boundary. */
export function sceneFade(scenes: SceneDef[], id: SceneId, p: number): number {
  const idx = scenes.findIndex((s) => s.id === id)
  if (idx === -1) throw new Error(`unknown scene ${id}`)
  const { start, end } = sceneRange(scenes, id)
  const len = end - start
  const dwellEnd = start + len * DWELL_RATIO
  const fadeEnd = idx === scenes.length - 2 ? end : dwellEnd + (len * (1 - DWELL_RATIO)) / 2
  if (idx > 0) {
    const inStart = start - len * 0.25
    if (p < inStart) return 0
    if (p < start) return (p - inStart) / (start - inStart)
  }
  if (idx === scenes.length - 1) return p >= start ? 1 : 0
  if (p <= dwellEnd) return 1
  if (p >= fadeEnd) return 0
  return 1 - (p - dwellEnd) / (fadeEnd - dwellEnd)
}

/**
 * Reduced-motion quantization: map progress to the start of the scene whose
 * heightVh-weighted range contains it, so snaps land on scene keyframes and
 * align with sceneRange-based copy boundaries (not uniform steps).
 */
export function snap(scenes: SceneDef[], p: number): number {
  const total = scenes.reduce((sum, s) => sum + s.heightVh, 0)
  let acc = 0
  for (const s of scenes) {
    const start = acc / total
    acc += s.heightVh
    if (p < acc / total) return start
  }
  return 1
}
