import styles from "./footer.module.css"
import { Body1, Body2, Caption, H1, H3 } from "@nolli/ui"
import { APP_URL } from "@/lib/constants"
import type { LandingData } from "@/lib/landing-data"

/** Footer — static cream block after the stage, rising over the cta grade's
 * dark tail. Not a spine scene: no keyframes, no stage hooks. */
export function FooterScene({ data }: { data: LandingData }) {
  return (
    <section className={styles.scene}>
      <div className={styles.annotation}>
        <H3 asChild>
          <span>oops — edge of the map</span>
        </H3>
        <Body2 asChild>
          <span className={styles.coords}>no architectures pinned here</span>
        </Body2>
      </div>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <H1 asChild>
            <span className={styles.wordmark}>Nolli</span>
          </H1>
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
