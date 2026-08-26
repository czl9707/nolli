import type { ReactNode } from "react"
import type { SceneCamera } from "@nolli/map"
import type { SlotRect } from "./slots"
import type { LandingData } from "./landing-data"

export type LayerKey = SlotRect

export type SceneKeyframe = {
  /** vh from scene start */
  at: number
  layer: LayerKey
  /** flight target fired via useSceneCamera when crossed */
  camera?: SceneCamera
  /** ease of the segment INTO this keyframe; default easeInOutCubic */
  ease?: (t: number) => number
}

export type Scene = {
  id: string
  keyframes: SceneKeyframe[]
  /** default: last keyframe.at + TAIL_VH */
  heightVh?: number
  Component: () => ReactNode
}

export type SceneFactory = (ctx: {
  data: LandingData
  viewport: { w: number; h: number }
}) => Scene

export const TAIL_VH = 20

export function sceneHeight(s: Scene): number {
  return s.heightVh ?? s.keyframes.at(-1)!.at + TAIL_VH
}
