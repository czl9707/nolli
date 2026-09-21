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
import { Pane, Rule, Screen } from "@/scenes/page-layout"
import { BootFade, phaseAtLeast, useBootPhase } from "@/lib/boot"
import styles from "./site-header.module.css"

/** Site header — a full-width strip under the viewport top, delimited by
 * Rules on its top and bottom edges. Brand left, buttons right (mobile
 * folds them into one dropdown). The strip is transparent — map and
 * hairlines read straight through it; it never eats map clicks (interactive
 * children opt back in). Fades out approaching the footer (stage drives the
 * wrapper). */
export function SiteHeader() {
  const mobile = useIsMobile()
  const shown = phaseAtLeast(useBootPhase(), "furniture")
  return (
    <Screen className={styles.bar} height="var(--size-header-height)">
      <BootFade at="furniture" style={{ gridColumn: "1 / -1", height: 0 }}>
        <Rule col="1 / -1" />
      </BootFade>
      <Pane blurred col="1 / -1" className={styles.row} data-in={shown ? "" : undefined} >
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
      </Pane>
      <BootFade at="furniture" style={{ gridColumn: "1 / -1", height: 0 }}>
        <Rule col="1 / -1" />
        <Rule col="1 / -1" className={styles.lastRule}/>
      </BootFade>
    </Screen>
  )
}
