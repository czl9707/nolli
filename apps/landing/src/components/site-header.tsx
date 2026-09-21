import { ArrowUpRight, Menu } from "lucide-react"
import { Note, useIsMobile } from "@nolli/ui"
import { ABOUT_PATH, MAP_APP_URL, POSTER_URL } from "@/lib/constants"
import { Pane, Rule, Screen } from "@/scenes/page-layout"
import {
  LandingDropdown,
  LandingDropdownContent,
  LandingDropdownItem,
  LandingDropdownSeparator,
  LandingDropdownTrigger,
} from "./landing-dropdown"
import { LandingButton } from "./landing-button"
import { BootFade, phaseAtLeast, useBootPhase } from "@/lib/boot"
import styles from "./site-header.module.css"

/** Site header — a full-width strip under the viewport top, delimited by
 * Rules on its top and bottom edges and cut into blurred column panes with
 * --border on their sides (desktop: brand | Poster | About+CTA; mobile:
 * brand | menu). The strip never eats map clicks — interactive children opt
 * back in. Fades out approaching the footer (stage drives the wrapper). */
export function SiteHeader() {
  const mobile = useIsMobile()
  const shown = phaseAtLeast(useBootPhase(), "furniture")

  const menu = (
    <LandingDropdown>
      <LandingDropdownTrigger variant="ghost" size="pane" className={styles.menuTrigger}>
        <Note>Menu</Note>
        <Menu size={16} aria-hidden />
      </LandingDropdownTrigger>
      <LandingDropdownContent align="end" className={styles.menuContent}>
        <LandingDropdownItem variant="accent" asChild>
          <a href={MAP_APP_URL}>
            <Note>Explore Nolli</Note>
          </a>
        </LandingDropdownItem>
        <LandingDropdownSeparator />
        <LandingDropdownItem asChild>
          <a href={POSTER_URL} target="_blank" rel="noopener noreferrer">
            <Note>Poster</Note>
          </a>
        </LandingDropdownItem>
        <LandingDropdownSeparator />
        <LandingDropdownItem asChild>
          <a href={ABOUT_PATH}>
            <Note>About</Note>
          </a>
        </LandingDropdownItem>
      </LandingDropdownContent>
    </LandingDropdown>
  )

  return (
    <Screen className={styles.bar} height="var(--size-header-height)">
      <BootFade at="furniture" style={{ gridColumn: "1 / -1", height: 0 }}>
        <Rule col="1 / -1" />
      </BootFade>
      <Pane blurred col={mobile ? "1" : "1 / span 2"} className={styles.cell} data-in={shown ? "" : undefined}>
        <a className={styles.brand} href="/" aria-label="Nolli home">
          <img className={styles.mark} src="/favicon.svg" alt="" width={24} height={24} />
          <Note className={styles.wordmark}>Nolli</Note>
        </a>
      </Pane>
      {mobile ? (
        <Pane blurred col="2" className={`${styles.cell} ${styles.menuCell}`} data-in={shown ? "" : undefined}>
          {menu}
        </Pane>
      ) : (
        <>
          <Pane blurred col="3" className={styles.cell} data-in={shown ? "" : undefined}>
            <div className={styles.half} aria-hidden />
            <div className={styles.half}>
              <LandingButton variant="ghost" size="pane" asChild>
                <a href={POSTER_URL} target="_blank" rel="noopener noreferrer">
                  <Note>Poster</Note>
                </a>
              </LandingButton>
            </div>
          </Pane>
          <Pane blurred col="4" className={styles.cell} data-in={shown ? "" : undefined}>
            <div className={styles.half}>
              <LandingButton variant="ghost" size="pane" asChild>
                <a href={ABOUT_PATH}>
                  <Note>About</Note>
                </a>
              </LandingButton>
            </div>
            <div className={styles.half}>
              <LandingButton variant="accent" size="pane" asChild>
                <a href={MAP_APP_URL}>
                  <Note>Explore Nolli</Note>
                  <ArrowUpRight size={16} aria-hidden />
                </a>
              </LandingButton>
            </div>
          </Pane>
        </>
      )}
      <BootFade at="furniture" style={{ gridColumn: "1 / -1", height: 0 }}>
        <Rule col="1 / -1" />
        <Rule col="1 / -1" className={styles.lastRule}/>
      </BootFade>
    </Screen>
  )
}
