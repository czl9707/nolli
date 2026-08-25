import { Button, H6 } from "@nolli/ui"
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
          <img className={styles.mark} src="/favicon.svg" alt="" width={24} height={24} />
          <H6 className={`${styles.wordmark}`}>Nolli</H6>
        </a>
        <div className={styles.right}>
          <nav className={styles.links} aria-label="site">
            <a href="#">Poster</a>
            <a href="#">About</a>
          </nav>
          <Button variant="outline" size="default" asChild>
            <a href={APP_URL}>Explore Nolli</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
