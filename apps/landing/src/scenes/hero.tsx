import styles from "./hero.module.css"

/** Hero overlay (split rails): two mirrored statements at screen left and
 * right, vertically centered — "Map unfolds." / "Architecture lives." The
 * dim gradient over the map lives in the map layer itself (hero-reveal) so
 * the cursor plate reveals a fully bright map. */
export function HeroScene() {
  return (
    <section className={styles.hero}>
      <div className={styles.copyLeft}>
        <h1 className={styles.h1}>Map unfolds.</h1>
      </div>
      <div className={styles.copyRight}>
        <h1 className={styles.h1}>Architecture lives.</h1>
      </div>
    </section>
  )
}
