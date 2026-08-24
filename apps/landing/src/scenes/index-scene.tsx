import styles from "./index-scene.module.css"
import { Note } from "@nolli/ui"
import type { LandingData } from "@/lib/landing-data"

/** Index pinned chrome (prototype E "light app mode"): the frame around the
 * card slot, faded per sceneFade inside the sticky stage — the map plate
 * settles into it. The statement copy is the separate flow-mounted
 * IndexCopy. */
export function IndexFrame() {
  return (
    <section className={styles.scene}>
      <div className={styles.frame} />
    </section>
  )
}

/** Index copy, flow-mounted: a sticky fullscreen sheet whose content sits
 * just above the slot — scrolls in from below, dwells pinned over the index
 * range, exits the top. */
export function IndexCopy({ data }: { data: LandingData }) {
  void data
  return (
    <div className={styles.copy}>
      <div className={styles.copyBody}>
        <Note asChild>
          <p className={styles.overline}>The Index</p>
        </Note>
        <h2 className={styles.statement}>
          Google Maps has all the pins.
          <br />
          ArchDaily has all the information.
          <br />
          <strong>Nolli bridges the gap.</strong>
        </h2>
      </div>
    </div>
  )
}
