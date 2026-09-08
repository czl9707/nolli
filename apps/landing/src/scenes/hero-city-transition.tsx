import type { TransitionScene } from "@/spine/timeline"
import styles from "./hero-city-transition.module.css"

export const heroCityTransition = (): TransitionScene => ({
  kind: "transition",
  id: "hero-city",
  fromShape: "[data-spine-shape='hero']",
  toShape: "[data-spine-shape='city']",
  heightVh: 120,
  Component: () => <div className={styles.veil} aria-hidden />,
})
