import styles from "./index-scene.module.css"
import type { LandingData } from "@/lib/landing-data"

/** Index overlay (prototype E "light app mode"): light page around the card
 * slot, statement above. The stage's map layer settles into the frame — no
 * backing element here, only the frame itself. */
export function IndexScene({ data }: { data: LandingData }) {
  void data
  return (
    <section className={styles.scene}>
      <div className={styles.frame} />
      <div className={styles.copy}>
        <p className={`hand ${styles.overline}`}>The Index</p>
        <h2 className={styles.statement}>
          Google Maps has all the pins.
          <br />
          ArchDaily has all the information.
          <br />
          <strong>Nolli bridges the gap.</strong>
        </h2>
      </div>
    </section>
  )
}
