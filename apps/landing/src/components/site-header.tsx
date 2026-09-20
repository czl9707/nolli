import { ArrowUpRight } from "lucide-react"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Note,
  useIsMobile,
} from "@nolli/ui"
import { ABOUT_PATH, MAP_APP_URL, POSTER_URL } from "@/lib/constants"
import { Card } from "@/components/card/card"
import { phaseAtLeast, useBootPhase } from "@/lib/boot"
import styles from "./site-header.module.css"

/** Site header — a vellum card bar floating under the viewport top: brand
 * left, nav buttons right; mobile folds the nav into one dropdown. The
 * bar never eats map clicks (pointer-events pass-through; interactive
 * children opt back in). Fades out approaching the footer (stage drives
 * the wrapper). Entrance is self-driven (see .bar css): an ancestor
 * opacity fade would form a backdrop root and kill the card's frost
 * until it ended. */
export function SiteHeader() {
  const mobile = useIsMobile()
  const shown = phaseAtLeast(useBootPhase(), "furniture")
  return (
    <Card variant="vellum" data-in={shown ? "" : undefined} className={styles.bar}>
      <a className={styles.brand} href="/" aria-label="Nolli home">
        <img className={styles.mark} src="/favicon.svg" alt="" width={24} height={24} />
        <Note className={styles.wordmark}>Nolli</Note>
      </a>
      {mobile ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="link">
              <Note>Menu</Note>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={styles.menuContent}>
            <DropdownMenuItem asChild>
              <a href={MAP_APP_URL}>Explore Nolli</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={POSTER_URL} target="_blank" rel="noopener noreferrer">
                Poster
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={ABOUT_PATH}>About</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <nav className={styles.nav} aria-label="site">
          <Button variant="link" asChild>
            <a href={POSTER_URL} target="_blank" rel="noopener noreferrer">
              <Note>Poster</Note>
            </a>
          </Button>
          <Button variant="link" asChild>
            <a href={ABOUT_PATH}>
              <Note>About</Note>
            </a>
          </Button>
          <Button className={styles.cta} asChild>
            <a href={MAP_APP_URL}>
              <Note>Explore Nolli</Note>
              <ArrowUpRight size={16} aria-hidden />
            </a>
          </Button>
        </nav>
      )}
    </Card>
  )
}
