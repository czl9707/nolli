import type { TransitionScene } from "@/spine/timeline"
import styles from "./hero-city-transition.module.css"

/** Hero → city morph. The spine interpolates the map shape; this overlay
 * continues the hero's veil — ink at the hero edge dissolving to
 * transparent across the transition's height, so the map opens onto the
 * city pane as the page scrolls. Camera flights live in the holds: each
 * scene flies to its own camera when scroll hands it the screen. */
function HeroCityTransition() {
  return <div className={styles.veil} aria-hidden />
}

export const heroCityTransition = (): TransitionScene => ({
  kind: "transition",
  id: "hero-city",
  fromShape: "[data-spine-shape='hero']",
  toShape: "[data-spine-shape='city']",
  heightVh: 120,
  Component: () => <HeroCityTransition />,
})
