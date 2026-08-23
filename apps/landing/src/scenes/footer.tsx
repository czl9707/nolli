import styles from "./footer.module.css"
import { APP_URL } from "@/lib/constants"
import type { LandingData } from "@/lib/landing-data"

/** Footer (prototype G "end of the map") — normal-flow cream block after the
 * stage spacers, rising over the pinned south ocean. Excluded from the
 * stage's overlay loop: it has no pinned copy, only this in-flow block. */
export function FooterScene({ data }: { data: LandingData }) {
  return (
    <section className={styles.scene}>
      <div className={`hand ${styles.annotation}`}>
        <span>end of the map · 世界的尽头</span>
        <span className={styles.coords}>74° S · no pins from here on</span>
      </div>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={`hand ${styles.wordmark}`}>Nolli</span>
          <span className={styles.tagline}>the architecture map</span>
        </div>
        <nav className={styles.cols}>
          <div>
            <p className={styles.colhead}>explore</p>
            <a href={APP_URL}>the map</a>
            <a href="#">the reel</a>
          </div>
          <div>
            <p className={styles.colhead}>elsewhere</p>
            <a href="#">instagram</a>
            <a href="#">contact</a>
          </div>
        </nav>
      </div>
      <div className={styles.legal}>
        <span>
          © 2026 Nolli · {data.stats.architectures} works · {data.stats.architects} architects
        </span>
        <span>one map, many roles</span>
      </div>
    </section>
  )
}
