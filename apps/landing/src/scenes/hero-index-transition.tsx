// src/scenes/hero-index-transition.tsx
import { useMemo, useRef } from "react"
import { useMotionValueEvent } from "framer-motion"
import { flyToSceneCinematic } from "@nolli/map"
import type { LandingData } from "@/lib/landing-data"
import { fitCamera } from "@/lib/camera"
import { useSceneScroll, useSpineMap } from "@/spine/spine"
import type { PxRect, TransitionScene } from "@/spine/timeline"

/** Hero → index morph. Pure camera choreography: entering fires the flight
 * to the index camera (Paris picks fitted to the index pane), crossing back
 * fires the reverse flight to the hero camera. Shape morph itself is the
 * spine's linear interpolation — nothing to do here. */
function HeroIndexTransition({ data, indexPane }: { data: LandingData; indexPane: PxRect }) {
  const map = useSpineMap()
  const local = useSceneScroll()
  const direction = useRef<"none" | "forward" | "back">("none")
  const cameras = useMemo(() => {
    const pts = data.heroPicks.map((p) => p.coordinates)
    return {
      to: fitCamera(pts, { width: indexPane.width, height: indexPane.height }, { x: 100, top: 100, bottom: 240 }),
      back: fitCamera(pts, { width: window.innerWidth, height: window.innerHeight }, { x: 100, top: 100, bottom: 240 }),
    }
  }, [data, indexPane])

  useMotionValueEvent(local, "change", (vh) => {
    if (!map) return
    if (vh > 8 && direction.current !== "forward") {
      direction.current = "forward"
      flyToSceneCinematic(map, cameras.to)
    } else if (vh <= 2 && direction.current === "forward") {
      direction.current = "back"
      flyToSceneCinematic(map, cameras.back)
    }
  })
  return null
}

export const heroIndexTransition =
  (data: LandingData, indexPane: PxRect): TransitionScene => ({
    kind: "transition",
    id: "hero-index",
    fromShape: "[data-spine-shape='hero']",
    toShape: "[data-spine-shape='index']",
    heightVh: 120,
    Component: () => <HeroIndexTransition data={data} indexPane={indexPane} />,
  })
