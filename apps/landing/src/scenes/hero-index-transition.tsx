// src/scenes/hero-index-transition.tsx
import type { TransitionScene } from "@/spine/timeline"
import styles from "./hero-index-transition.module.css"

/** Hero → index morph. The spine interpolates the map shape; this overlay
 * continues the hero's veil — ink at the hero edge dissolving to
 * transparent across the transition's height, so the map opens onto the
 * index pane as the page scrolls. Camera flights live in the holds: each
 * scene flies to its own camera when scroll hands it the screen. */
function HeroIndexTransition() {
  return <div className={styles.veil} aria-hidden />
}

export const heroIndexTransition = (): TransitionScene => ({
  kind: "transition",
  id: "hero-index",
  fromShape: "[data-spine-shape='hero']",
  toShape: "[data-spine-shape='index']",
  heightVh: 120,
  Component: () => <HeroIndexTransition />,
})
