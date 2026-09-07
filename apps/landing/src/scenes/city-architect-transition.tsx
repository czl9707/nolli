// City → architect morph: the spine interpolates the map shape; no
// overlay of its own.
import type { TransitionScene } from "@/spine/timeline"

export const cityArchitectTransition = (): TransitionScene => ({
  kind: "transition",
  id: "city-architect",
  fromShape: "[data-spine-shape='city']",
  toShape: "[data-spine-shape='architect']",
  heightVh: 60,
})
