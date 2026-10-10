// src/spine/timeline.ts
import type { ReactNode } from "react"
import type { SceneCamera } from "@nolli/map"

/** Selector for the pane whose measured rect defines a map shape. Shapes are
 * always measured from the DOM, never declared as coordinates. */
export type ShapeRef = string

export type PxRect = { left: number; top: number; width: number; height: number }

export type HoldScene = {
  kind: "hold"
  id: string
  shape: ShapeRef
  /** wrapper total in vh; must be >= the component's own height */
  heightVh: number
  /** camera this hold settles into; a function computes at fire time
   * (measured panes) and a null return defers to the next trigger */
  camera: SceneCamera | (() => SceneCamera | null)
  Component: () => ReactNode
}

export type TransitionScene = {
  kind: "transition"
  id: string
  fromShape: ShapeRef
  toShape: ShapeRef
  /** the scroll runway the morph plays over — the shape is a pure function
   * of scroll across it, so both directions replay it */
  heightVh: number
  /** scroll vh of morph tail that plays over the following hold's opening —
   * the morph ends late, inside the next scene's domain */
  overrunVh?: number
  /** visual overlay for the morph; the shape interpolation is the spine's */
  Component?: () => ReactNode
}

export type SpineScene = HoldScene | TransitionScene

export type SpineTimeline = {
  totalVh: number
  segments: Array<{ scene: SpineScene; startVh: number; heightVh: number }>
}

/** Chains the scene list: every transition must reference the shapes of its
 * neighbours, and holds with differing shapes need a transition between
 * them. Fail loud at build time, not mid-scroll. */
export function buildTimeline(scenes: SpineScene[]): SpineTimeline {
  const segments: SpineTimeline["segments"] = []
  let acc = 0
  for (const scene of scenes) {
    segments.push({ scene, startVh: acc, heightVh: scene.heightVh })
    acc += scene.heightVh
  }
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i]
    if (s.kind === "transition") {
      const prev = scenes[i - 1]
      const next = scenes[i + 1]
      const fromErr = `transition '${s.id}': fromShape '${s.fromShape}' must match the preceding hold's shape`
      const toErr = `transition '${s.id}': toShape '${s.toShape}' must match the following hold's shape`
      if (prev?.kind === "hold" && prev.shape !== s.fromShape) throw new Error(fromErr)
      if (next?.kind === "hold" && next.shape !== s.toShape) throw new Error(toErr)
      if (prev?.kind !== "hold") throw new Error(fromErr)
      if (next?.kind !== "hold") throw new Error(toErr)
    } else {
      const next = scenes[i + 1]
      if (next?.kind === "hold" && next.shape !== s.shape)
        throw new Error(`holds '${s.id}' and '${next.id}' differ in shape — put a transition between them`)
    }
  }
  return { totalVh: acc, segments }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const lerpRect = (a: PxRect, b: PxRect, t: number): PxRect => ({
  left: lerp(a.left, b.left, t),
  top: lerp(a.top, b.top, t),
  width: lerp(a.width, b.width, t),
  height: lerp(a.height, b.height, t),
})

/** Map rect at a scroll position. Holds are constant; transitions lerp
 * linearly between the two measured rects, at one rate across the band
 * and any overrun tail into the next hold. */
export function shapeAt(tl: SpineTimeline, vh: number, rects: Record<ShapeRef, PxRect>): PxRect {
  const segs = tl.segments
  let seg = segs[0]
  let idx = 0
  for (let k = 1; k < segs.length; k++) {
    if (vh >= segs[k].startVh) {
      seg = segs[k]
      idx = k
    } else break
  }
  const scene = seg.scene
  if (scene.kind === "transition") {
    const span = seg.heightVh + (scene.overrunVh ?? 0)
    const t = Math.min(Math.max((vh - seg.startVh) / span, 0), 1)
    return lerpRect(rects[scene.fromShape], rects[scene.toShape], t)
  }
  // a preceding transition's tail keeps morphing over this hold's opening
  const prev = idx > 0 ? segs[idx - 1] : null
  if (prev?.scene.kind === "transition" && prev.scene.overrunVh) {
    const span = prev.heightVh + prev.scene.overrunVh
    if (vh < prev.startVh + span)
      return lerpRect(rects[prev.scene.fromShape], rects[prev.scene.toShape], (vh - prev.startVh) / span)
  }
  return rects[scene.shape]
}

/** The hold the spine's allegiance belongs to at a scroll position —
 * camera, layering and scene-owned map content follow it. A hold is its
 * own; a transition belongs to the hold it is morphing toward once past
 * its middle, to the one it came from before. */
export function ownerHoldAt(tl: SpineTimeline, vh: number): string {
  let seg = tl.segments[0]
  for (const s of tl.segments) {
    if (vh >= s.startVh) seg = s
    else break
  }
  if (seg.scene.kind === "hold") return seg.scene.id
  const i = tl.segments.indexOf(seg)
  return vh >= seg.startVh + seg.heightVh / 2
    ? (tl.segments[i + 1].scene as HoldScene).id
    : (tl.segments[i - 1].scene as HoldScene).id
}
