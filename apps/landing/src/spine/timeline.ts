import type { ReactNode } from "react"
import type { SceneCamera } from "@nolli/map"

/** Selector for the pane whose measured rect defines a map shape. Shapes are
 * always measured from the DOM, never declared as coordinates. */
export type ShapeRef = string

export type PxRect = { left: number; top: number; width: number; height: number }

export type HoldScene = {
  id: string
  shape: ShapeRef
  /** wrapper total in vh; must be >= the component's own height */
  heightVh: number
  /** camera this hold settles into; a function computes at fire time
   * (measured panes) and a null return defers to the next trigger */
  camera: SceneCamera | (() => SceneCamera | null)
  /** how early (vh) this hold's boundary fires — the runway it carves out
   * of the PREVIOUS scene's tail. Default TRIGGER_LEAD_VH. */
  leadVh?: number
  /** hairlines over the map (default) or the map over the hairlines —
   * applied as a z-index jump on the map layer at the boundary fire */
  rulesOverMap?: boolean
  Component: () => ReactNode
}

export type SpineScene = HoldScene

export type SpineTimeline = {
  totalVh: number
  segments: Array<{ scene: SpineScene; startVh: number; heightVh: number }>
}

/** A boundary fires this many vh before the next hold starts. */
export const TRIGGER_LEAD_VH = 45
/** Hysteresis: after firing on a boundary, the scroll must clear the
 * threshold by this much before the same boundary can fire again. */
export const REARM_VH = 10

/** Chains the scene list and validates the trigger geometry. Fail loud at
 * build time, not mid-scroll. */
export function buildTimeline(scenes: SpineScene[]): SpineTimeline {
  const segments: SpineTimeline["segments"] = []
  let acc = 0
  for (const scene of scenes) {
    segments.push({ scene, startVh: acc, heightVh: scene.heightVh })
    acc += scene.heightVh
  }
  for (let i = 0; i < scenes.length - 1; i++) {
    const lead = scenes[i + 1].leadVh ?? TRIGGER_LEAD_VH
    if (scenes[i].heightVh < lead)
      throw new Error(
        `hold '${scenes[i].id}': heightVh ${scenes[i].heightVh} < lead ${lead} — its tail needs runway for the next boundary's trigger`,
      )
  }
  return { totalVh: acc, segments }
}

/** The hold the spine should be animating toward at a scroll position:
 * steps at each hold's start − its own lead. */
export function targetHoldAt(tl: SpineTimeline, vh: number): string {
  let id = tl.segments[0].scene.id
  for (const s of tl.segments) {
    if (vh >= s.startVh - (s.scene.leadVh ?? TRIGGER_LEAD_VH)) id = s.scene.id
    else break
  }
  return id
}

/** The boundary a fire crossed, keyed on the hold PAIR (the later hold's
 * start − the later hold's lead) rather than the target, so forward and
 * reverse fires on the same edge report the same vh and hysteresis can
 * match them. */
export function crossedBoundary(
  tl: SpineTimeline,
  fromId: string | null,
  toId: string,
): { boundaryVh: number; dir: 1 | -1 } {
  const idx = (id: string | null) =>
    tl.segments.findIndex((s) => s.scene.id === (id ?? tl.segments[0].scene.id))
  const to = idx(toId)
  const from = Math.max(idx(fromId), 0)
  const later = tl.segments[Math.max(to, from)]
  return { boundaryVh: later.startVh - (later.scene.leadVh ?? TRIGGER_LEAD_VH), dir: to > from ? 1 : -1 }
}
