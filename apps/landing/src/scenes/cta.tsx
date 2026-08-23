import styles from "./cta.module.css"
import { APP_URL } from "@/lib/constants"
import type { LandingData } from "@/lib/landing-data"

/** CTA overlay (prototype A, hero-mirror grade) — the stage's map layer is the background. */
export function CtaScene({ data }: { data: LandingData }) {
  return (
    <section className={styles.bookend}>
      <div className={styles.grade} />
      <div className={styles.copy}>
        <p className={`hand ${styles.overline}`}>
          {data.stats.architectures} works · {data.stats.architects} architects
        </p>
        <h2 className={styles.h2}>Open the Map.</h2>
        <p className={styles.sub}>free</p>
        <a className={styles.btn} href={APP_URL}>
          Open Nolli →
        </a>
      </div>
    </section>
  )
}
