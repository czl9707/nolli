import { ArrowUpRight } from "lucide-react"
import { Note, useIsMobile } from "@nolli/ui"
import { ABOUT_PATH, MAP_APP_URL, POSTER_URL } from "@/lib/constants"
import { LandingButton } from "./landing-button"
import {
  LandingDropdown,
  LandingDropdownContent,
  LandingDropdownItem,
  LandingDropdownSeparator,
  LandingDropdownTrigger,
} from "./landing-dropdown"
import { VSplit, Pane, Screen } from "@/scenes/grid"
import styles from "./site-header.module.css"

/** One header button pane's width, in grid cols. */
const BUTTON_PANE = "calc(var(--grid-col) * 2)"

/** Site header — a row of grid panes on a frosted strip: the brand fills
 * the left pane, three button panes close the right on desktop; mobile
 * folds every button into one dropdown pane. The bar itself never eats
 * map clicks (pointer-events pass-through; interactive children opt back
 * in). Fades out approaching the footer (stage drives the wrapper). */
export function SiteHeader() {
  const mobile = useIsMobile()
  return (
    <Screen className={styles.bar}>
      <VSplit>
        <Pane className={styles.brandPane} blurred filled>
          <a className={styles.brand} href="/" aria-label="Nolli home">
            <img className={styles.mark} src="/favicon.svg" alt="" width={24} height={24} />
            <Note className={styles.wordmark}>Nolli</Note>
          </a>
        </Pane>
        {mobile ? (
          <Pane size="calc(var(--grid-col) * 4)" blurred>
            <LandingDropdown>
              <LandingDropdownTrigger size="pane" variant="ghost">
                <Note>Menu</Note>
              </LandingDropdownTrigger>
              <LandingDropdownContent align="end" sideOffset={0} className={styles.dropdownConent}>
                <LandingDropdownItem asChild className={styles.dropdownItem}>
                  <a href={MAP_APP_URL}><Note>Explore Nolli</Note></a>
                </LandingDropdownItem>
                <LandingDropdownSeparator />
                <LandingDropdownItem asChild className={styles.dropdownItem}>
                  <a href={POSTER_URL} target="_blank" rel="noopener noreferrer">
                    <Note>Poster</Note>
                  </a>
                </LandingDropdownItem>
                <LandingDropdownSeparator />
                <LandingDropdownItem asChild className={styles.dropdownItem}>
                  <a href={ABOUT_PATH}><Note>About</Note></a>
                </LandingDropdownItem>
              </LandingDropdownContent>
            </LandingDropdown>
          </Pane>
        ) : (
          <>
            <Pane size={BUTTON_PANE} blurred>
              <LandingButton size="pane" variant="ghost" asChild>
                <a href={POSTER_URL} target="_blank" rel="noopener noreferrer">
                  <Note>Poster</Note>
                </a>
              </LandingButton>
            </Pane>
            <Pane size={BUTTON_PANE} blurred>
              <LandingButton size="pane" variant="ghost" asChild>
                <a href={ABOUT_PATH}><Note>About</Note></a>
              </LandingButton>
            </Pane>
            <Pane size={BUTTON_PANE} blurred>
              <LandingButton size="pane" variant="accent" asChild>
                <a href={MAP_APP_URL}>
                  <Note>Explore Nolli</Note>
                  <ArrowUpRight size={16} aria-hidden />
                </a>
              </LandingButton>
            </Pane>
          </>
        )}
      </VSplit>
    </Screen>
  )
}
