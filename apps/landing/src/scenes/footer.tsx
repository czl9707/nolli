import styles from "./footer.module.css"
import { Body1, Body2, Caption } from "@nolli/ui"
import { APP_URL } from "@/lib/constants"
import type { LandingData } from "@/lib/landing-data"

/** Footer (prototype G "edge of the map") — normal-flow cream block after the
 * stage spacers, rising over the cta grade's dark tail. Excluded from the
 * stage's overlay loop: it has no pinned copy, only this in-flow block. */
export function FooterScene({ data }: { data: LandingData }) {
  return (
    <section className={styles.scene}>
      <div className={`hand ${styles.annotation}`}>
        <span>oops — edge of the map</span>
        <Body2 asChild>
          <span className={styles.coords}>no architectures pinned here</span>
        </Body2>
      </div>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={`hand ${styles.wordmark}`}>Nolli</span>
          <Body2 asChild>
            <span className={styles.tagline}>the architecture map</span>
          </Body2>
        </div>
        <nav className={styles.cols}>
          <div>
            <Caption className={styles.colhead}>explore</Caption>
            <Body1 asChild>
              <a href={APP_URL}>the map</a>
            </Body1>
            <Body1 asChild>
              <a href="#">the reel</a>
            </Body1>
          </div>
          <div>
            <Caption className={styles.colhead}>elsewhere</Caption>
            <Body1 asChild>
              <a href="#">instagram</a>
            </Body1>
            <Body1 asChild>
              <a href="#">contact</a>
            </Body1>
          </div>
        </nav>
      </div>
      <Body2 asChild>
        <div className={styles.legal}>
          <span>
            © 2026 Nolli · {data.stats.architectures} works · {data.stats.architects} architects
          </span>
          <span>one map, many roles</span>
        </div>
      </Body2>
    </section>
  )
}
