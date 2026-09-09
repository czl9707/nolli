// src/spine/timeline.ts
import type { ReactNode } from "react"

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
  Component: () => ReactNode
}

export type TransitionScene = {
  kind: "transition"
  id: string
  fromShape: ShapeRef
  toShape: ShapeRef
  heightVh: number
  /** Out-cutoff from the PREVIOUS scene: the morph engages this many vh
   * before this segment starts — when that scene's trailing edge is this
   * far below the viewport top. Default TRANSITION_LEAD_VH. */
  leadVh?: number
  /** In-cutoff from the NEXT scene: the morph completes this many vh
   * before the next hold's boundary. Default TRANSITION_TAIL_VH. */
  tailVh?: number
  /** visual overlay for the morph; the shape interpolation is the spine's */
  Component?: () => ReactNode
}

export type SpineScene = HoldScene | TransitionScene

export type SpineTimeline = {
  totalVh: number
  segments: Array<{ scene: SpineScene; startVh: number; heightVh: number }>
}

export const TRANSITION_LEAD_VH = 60;
export const TRANSITION_TAIL_VH = 0
export const transitionLead = (s: TransitionScene) => s.leadVh ?? TRANSITION_LEAD_VH
export const transitionTail = (s: TransitionScene) => s.tailVh ?? TRANSITION_TAIL_VH

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
  for (const s of scenes)
    if (s.kind === "transition" && s.heightVh + transitionLead(s) - transitionTail(s) <= 0)
      throw new Error(
        `transition '${s.id}': heightVh ${s.heightVh} + lead ${transitionLead(s)} - tail ${transitionTail(s)} must stay positive`,
      )
  return { totalVh: acc, segments }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Map rect at a scroll position. Holds are constant; transitions lerp
 * linearly over the window between their two cutoffs — engaging leadVh
 * before the segment (previous scene's out-cutoff) and completing tailVh
 * before its end (next scene's in-cutoff). */
export function shapeAt(tl: SpineTimeline, vh: number, rects: Record<ShapeRef, PxRect>): PxRect {
  const segs = tl.segments
  let seg = segs[0]
  for (const s of segs) {
    const engageAt = s.startVh - (s.scene.kind === "transition" ? transitionLead(s.scene) : 0)
    if (vh >= engageAt) seg = s
    else break
  }
  const scene = seg.scene
  if (scene.kind === "hold") return rects[scene.shape]
  const from = rects[scene.fromShape]
  const to = rects[scene.toShape]
  const t = Math.min(Math.max((vh - (seg.startVh - transitionLead(scene))) / (seg.heightVh + transitionLead(scene) - transitionTail(scene)), 0), 1)
  return {
    left: lerp(from.left, to.left, t),
    top: lerp(from.top, to.top, t),
    width: lerp(from.width, to.width, t),
    height: lerp(from.height, to.height, t),
  }
}
