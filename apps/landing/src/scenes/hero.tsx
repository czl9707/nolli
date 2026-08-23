import styles from "./hero.module.css"
import type { LandingData } from "@/lib/landing-data"

/** Hero overlay (prototype D, diagonal grade) — the stage's map layer is the background. */
export function HeroScene({ data }: { data: LandingData }) {
  return (
    <section className={styles.hero}>
      <div className={styles.grade} />
      <div className={styles.copy}>
        <p className={`hand ${styles.overline}`}>
          {data.stats.architectures} works · {data.stats.architects} architects
        </p>
        <h1 className={styles.h1}>A Map Architects Wish For</h1>
        <p className={styles.sub}>
          Nolli is an interactive figure-ground architecture map. Every work pinned where it
          stands.
        </p>
      </div>
    </section>
  )
}
