// Index → architect-scene morph: the spine interpolates the map shape; no
// overlay of its own.
import type { TransitionScene } from "@/spine/timeline"

export const indexArchTransition = (): TransitionScene => ({
  kind: "transition",
  id: "index-arch",
  fromShape: "[data-spine-shape='index']",
  toShape: "[data-spine-shape='arch']",
  heightVh: 100,
})
