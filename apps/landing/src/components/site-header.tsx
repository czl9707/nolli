import { Button } from "@nolli/ui"
import { APP_URL } from "@/lib/constants"
import styles from "./site-header.module.css"

/** Site header (prototype winner header-A "Topline"): mark + hand wordmark
 * left, future-app links + app-styled CTA right. The bar itself never eats
 * map clicks (pointer-events pass-through; interactive children opt back
 * in). Fades out approaching the footer (stage drives the wrapper). */
export function SiteHeader() {
  return (
    <header className={styles.bar}>
      <div className={styles.row}>
        <a className={styles.brand} href="#" aria-label="Nolli home">
          <img className={styles.mark} src="/favicon.svg" alt="" width={28} height={28} />
          <span className={`hand ${styles.wordmark}`}>Nolli</span>
        </a>
        <div className={styles.right}>
          <nav className={styles.links} aria-label="site">
            <a href="#">Poster</a>
            <a href="#">About</a>
          </nav>
          <Button variant="default" size="lg" asChild>
            <a href={APP_URL}>Open Nolli</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
