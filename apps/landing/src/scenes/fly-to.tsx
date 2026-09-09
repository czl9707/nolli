// Scroll-gated camera flight shared by the spine scenes: fire
// flyToSceneCinematic once while local scroll is in [0, untilVh), re-arm
// when it leaves, and verify the landing on moveend — the map layer may
// still be settling out of a shape morph, which mis-lands the ease.
import { useRef } from "react"
import { useMotionValueEvent } from "framer-motion"
import { flyToSceneCinematic, type SceneCamera } from "@nolli/map"
import { useSceneScroll, useSpineMap } from "@/spine/spine"

/** `target` may compute the camera at fire time (measured panes); a null
 *  return defers the flight to the next scroll event. */
export function FlyTo({ sceneId, untilVh, target }: {
  sceneId?: string
  untilVh: number
  target: SceneCamera | (() => SceneCamera | null)
}) {
  const map = useSpineMap()
  const local = useSceneScroll(sceneId)
  const flied = useRef(false)
  useMotionValueEvent(local, "change", (v) => {
    if (!map) return
    if (v >= 0 && v < untilVh) {
      if (flied.current) return
      const cam = typeof target === "function" ? target() : target
      if (!cam) return
      flied.current = true
      flyToSceneCinematic(map, cam)
      map.once("moveend", () => {
        const c = map.getCenter()
        if (Math.abs(c.lng - cam.center[0]) > 1 || Math.abs(map.getZoom() - cam.zoom) > 0.05) {
          map.jumpTo({ center: cam.center, zoom: cam.zoom })
        }
      })
    } else {
      flied.current = false
    }
  })
  return null
}
