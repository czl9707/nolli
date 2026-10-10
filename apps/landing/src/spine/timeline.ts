import type { ReactNode } from "react"
import type { SceneCamera } from "@nolli/map"

/** Selector for the pane whose measured rect defines a map shape. Shapes are
 * always measured from the DOM, never declared as coordinates. */
export type ShapeRef = string

/** The fullscreen holds' shared shape — every fixed-viewport hold anchors
 * the same selector, so adjacent fullscreen holds need no transition. */
export const SCREEN_SHAPE: ShapeRef = "[data-spine-shape='screen']"

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
  /** the scroll span (vh) the morph spends — it plays across this range,
   * scroll-driven, both directions */
  heightVh: number
  /** visual overlay for the morph; the shape interpolation is the spine's */
  Component?: () => ReactNode
}

export type SpineScene = HoldScene | TransitionScene

export type SpineTimeline = {
  totalVh: number
  segments: Array<{ scene: SpineScene; startVh: number; heightVh: number }>
}

/** Hysteresis: after firing on a boundary, the scroll must clear the
 * threshold by this much before the same boundary can fire again. */
export const REARM_VH = 10

/** Chains the scene list: every transition must reference the shapes of its
 * neighbours, and holds with differing shapes need a transition between
 * them. Fail loud at build time, not mid-scroll. */
export function buildTimeline(scenes: SpineScene[]): SpineTimeline {
  if (scenes[0]?.kind !== "hold")
    throw new Error("the spine must open with a hold")
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
      if (prev?.kind !== "hold" || prev.shape !== s.fromShape) throw new Error(fromErr)
      if (next?.kind !== "hold" || next.shape !== s.toShape) throw new Error(toErr)
    } else {
      const next = scenes[i + 1]
      if (next?.kind === "hold" && next.shape !== s.shape)
        throw new Error(`holds '${s.id}' and '${next.id}' differ in shape — put a transition between them`)
    }
  }
  return { totalVh: acc, segments }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Map rect at a scroll position. Holds take their pane's live rect (the
 * stats card's dwell parks it, its ride-out carries the map); transitions
 * lerp linearly between the two panes' live rects — both seams are
 * continuous by construction, and the morph lands on the card as it
 * travels, whatever the scroll-to-vh conversion does between them. */
export function shapeAt(
  tl: SpineTimeline,
  vh: number,
  live: Record<ShapeRef, PxRect>,
): PxRect {
  const segs = tl.segments
  let seg = segs[0]
  for (const s of segs) {
    if (vh >= s.startVh) seg = s
    else break
  }
  const scene = seg.scene
  if (scene.kind === "hold") return live[scene.shape]
  const from = live[scene.fromShape]
  const to = live[scene.toShape]
  const t = Math.min(Math.max((vh - seg.startVh) / seg.heightVh, 0), 1)
  return {
    left: lerp(from.left, to.left, t),
    top: lerp(from.top, to.top, t),
    width: lerp(from.width, to.width, t),
    height: lerp(from.height, to.height, t),
  }
}

/** The hold the spine's allegiance sits with at a scroll position: the
 * hold containing the scroll, or — inside a transition — the hold it
 * morphs toward. Derived, not fired: reverse crossings resolve
 * themselves. */
export function targetHoldAt(tl: SpineTimeline, vh: number): string {
  let id = tl.segments[0].scene.id
  for (let i = 0; i < tl.segments.length; i++) {
    const s = tl.segments[i]
    if (vh < s.startVh) break
    id = s.scene.kind === "hold" ? s.scene.id : tl.segments[i + 1].scene.id
  }
  return id
}

/** The boundary a fire crossed, keyed on the hold PAIR — the start of the
 * first segment after the earlier hold (a transition when one sits
 * between) — so forward and reverse fires on the same edge report the same
 * vh and hysteresis can match them. */
export function crossedBoundary(
  tl: SpineTimeline,
  fromId: string | null,
  toId: string,
): { boundaryVh: number; dir: 1 | -1 } {
  const idx = (id: string | null) =>
    tl.segments.findIndex((s) => s.scene.kind === "hold" && s.scene.id === (id ?? tl.segments[0].scene.id))
  const to = idx(toId)
  const from = Math.max(idx(fromId), 0)
  const earlier = Math.min(to, from)
  const next = tl.segments[earlier + 1]
  return { boundaryVh: next ? next.startVh : 0, dir: to > from ? 1 : -1 }
}
