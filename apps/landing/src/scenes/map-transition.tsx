// Scroll-gated map transition shared by the spine scenes: fire once while
// local scroll is in [0, untilVh), re-arm when it leaves. The motion lives
// in lib/map-transition.ts.
import { useRef } from "react"
import { useMotionValueEvent } from "framer-motion"
import type { SceneCamera } from "@nolli/map"
import { applyMapTransition } from "@/lib/map-transition"
import { useSceneScroll, useSpineMap } from "@/spine/spine"

/** `target` may compute the camera at fire time (measured panes); a null
 *  return defers the transition to the next scroll event. */
export function MapTransition({ sceneId, untilVh, target }: {
  sceneId?: string
  untilVh: number
  target: SceneCamera | (() => SceneCamera | null)
}) {
  const map = useSpineMap()
  const local = useSceneScroll(sceneId)
  const ran = useRef(false)
  useMotionValueEvent(local, "change", (v) => {
    if (!map) return
    if (v >= 0 && v < untilVh) {
      if (ran.current) return
      const cam = typeof target === "function" ? target() : target
      if (!cam) return
      ran.current = true
      applyMapTransition(map, cam)
    } else {
      ran.current = false
    }
  })
  return null
}
