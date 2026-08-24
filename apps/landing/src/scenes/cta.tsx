import styles from "./cta.module.css"
import { Body1 } from "@nolli/ui"
import { APP_URL } from "@/lib/constants"
import type { LandingData } from "@/lib/landing-data"

/** CTA overlay (prototype A, hero-mirror grade) — the stage's map layer is
 * the background. The copy rides a sticky sheet (the index copy's pattern):
 * enters from below, pins while the range passes, exits the top; the grade
 * beneath it settles into a dark plateau by the copy's pin height so the
 * pinned copy always sits on dark. */
export function CtaScene({ data }: { data: LandingData }) {
  return (
    <section className={styles.bookend}>
      <div className={styles.grade} />
      <div className={styles.sheet}>
        <div className={styles.copy}>
          <p className={`hand ${styles.overline}`}>
            {data.stats.architectures} works · {data.stats.architects} architects
          </p>
          <h2 className={styles.h2}>Open the Map.</h2>
          <p className={styles.sub}>free</p>
          <Body1 asChild>
            <a className={styles.btn} href={APP_URL}>
              Open Nolli →
            </a>
          </Body1>
        </div>
      </div>
    </section>
  )
}
