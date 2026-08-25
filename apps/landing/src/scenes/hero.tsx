import styles from "./hero.module.css"
import type { LandingData } from "@/lib/landing-data"

/** Hero overlay (copy-A "split rails"): the statement splits into two chunks
 * at screen left and right, vertically centered. The dim gradient over the
 * map lives in the map layer itself (hero-reveal) so the cursor plate
 * reveals a fully bright map. */
export function HeroScene({ data }: { data: LandingData }) {
  return (
    <section className={styles.hero}>
      <div className={styles.copyLeft}>
        <p className={`hand ${styles.overline}`}>
          {data.stats.architectures} works · {data.stats.architects} architects
        </p>
        <h1 className={styles.h1}>A map for architecture.</h1>
      </div>
      <div className={styles.copyRight}>
        <h1 className={styles.h1}>Every work pinned where it stands.</h1>
      </div>
    </section>
  )
}
