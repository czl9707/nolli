// Architect → stats morph: the spine interpolates the map shape; no
// overlay of its own.
import type { TransitionScene } from "@/spine/timeline"
import styles from "./architect-stats-transition.module.css"

export const architectStatsTransition = (): TransitionScene => ({
  kind: "transition",
  id: "architect-stats",
  fromShape: "[data-spine-shape='architect']",
  toShape: "[data-spine-shape='stats']",
  heightVh: 60,
  Component: () => <div className={styles.veil} aria-hidden />
})
