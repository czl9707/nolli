import { siInstagram, siThreads, type SimpleIcon } from "simple-icons"
import { Body1, Body3, Button, H4, H6, Note, PaperPhoto } from "@nolli/ui"
import {
  ABOUT_PATH,
  MAP_APP_URL,
  POSTER_URL,
  PRIVACY_PATH,
  TERMS_PATH,
  WORLD_CAMERA,
} from "@/lib/constants"
import type { HoldScene } from "@/spine/timeline"
import type { ArchSummary, LandingData } from "@/lib/landing-data"
import { useIsMobile } from "@nolli/ui"
import { HSplit, Pane, Screen, VSplit } from "./grid"
import styles from "./footer.module.css"

const LINK_GROUPS: Array<{
  label: string
  links: Array<{ label: string; href: string; arrow?: boolean }>
}> = [
  {
    label: "Explore",
    links: [
      { label: "Nolli", href: MAP_APP_URL },
      { label: "Poster", href: POSTER_URL },
    ],
  },
  {
    label: "Resources",
    links: [
      { label: "About", href: ABOUT_PATH },
      { label: "Privacy", href: PRIVACY_PATH },
      { label: "Terms", href: TERMS_PATH },
      { label: "Contact", href: `mailto:nolli.map@gmail.com` }
    ],
  },
]

const SCENE_VH = 100

export function footerHold(data: LandingData): HoldScene {
  return {
    id: "footer",
    shape: "[data-spine-shape='footer']",
    heightVh: SCENE_VH,
    camera: WORLD_CAMERA,
    Component: () => <FooterScene data={data} />,
  }
}

function FooterScene({ data }: { data: LandingData }) {
  const mobile = useIsMobile()
  return (
    <Screen className={`${styles.veil} ${styles.screen}`}>
      <div className={styles.shape} data-spine-shape="footer" aria-hidden />
      {mobile ? <FooterMobile data={data}/> : <FooterDesktop data={data} />}
    </Screen>
  )
}

/** Mobile re-composition — the cards stack: brand block, Explore column,
 * Resources column, inside the grid margins. */
function FooterMobile({ data }: { data: LandingData }) {
  return (
    <HSplit>
      <Pane size="calc(var(--size-header-height) + 10svh)" />
      <Pane className={styles.footer}>
        <HSplit>
          <Pane>
            <VSplit>
              <Pane size="var(--grid-padding)" filled/>
              <Pane>
                <HSplit>
                  <Pane size="fit-content" className={styles.commonPane}>
                    <BrandBlock />
                  </Pane >
                  <Pane>
                    <VSplit>
                      <Pane size="50%" className={styles.commonPane}>
                        <NavColumn group={LINK_GROUPS[0]} />
                      </Pane>
                      <Pane size="50%" className={styles.commonPane}>
                        <NavColumn group={LINK_GROUPS[1]} />
                      </Pane>
                    </VSplit>
                  </Pane>
                </HSplit>
              </Pane>
              <Pane size="var(--grid-padding)" filled/>
            </VSplit>
          </Pane>
          <PhotoDock pool={dockPool(data, 9)} />
        </HSplit>
      </Pane>
    </HSplit>
  )
}

/** Desktop tree — brand + nav columns over the photo dock. */
function FooterDesktop({ data }: { data: LandingData }) {
  return (
    <HSplit>
      <Pane size="45svh" />
      <Pane className={styles.footer}>
        <HSplit>
          <Pane>
            <VSplit>
              <Pane size="var(--grid-padding)" />
              <Pane>
                <VSplit>
                  <Pane size="calc(var(--grid-col) * 7)" className={styles.commonPane}>
                    <BrandBlock withSpacer />
                  </Pane>
                  <Pane size="calc(var(--grid-col) * 2.5)" className={styles.commonPane}>
                    <NavColumn group={LINK_GROUPS[0]} />
                  </Pane>
                  <Pane size="calc(var(--grid-col) * 2.5)" className={styles.commonPane}>
                    <NavColumn group={LINK_GROUPS[1]} />
                  </Pane>
                </VSplit>
              </Pane>
              <Pane size="var(--grid-padding)" />
            </VSplit>
          </Pane>
          <PhotoDock pool={dockPool(data, 9)} />
        </HSplit>
      </Pane>
    </HSplit>
  )
}

/** Brand block shared by both trees — wordmark, statement, socials, legal
 * meta. Desktop stretches it with the spacer before the meta. */
function BrandBlock({ withSpacer = false }: { withSpacer?: boolean }) {
  return (
    <>
      <a className={styles.brand} href="#" aria-label="Nolli home">
        <img className={styles.mark} src="/favicon.svg" alt="" width={24} height={24} />
        <Note className={styles.wordMark}>Nolli</Note>
      </a>
      <H4 className={styles.statement}>
        The Map Where Architectures Lives.
      </H4>
      <div className={styles.social}>
        <SocialLink icon={siInstagram} label="Instagram" href="https://www.instagram.com/nolli.map/" />
        <SocialLink icon={siThreads} label="Threads" href="https://www.threads.net/@nolli.map" />
      </div>
      {withSpacer && <span className={styles.spacer}/>}
      <div className={styles.meta}>
        <Body3 className={styles.legalMark}>© 2026-present Zane Chen</Body3>
        <Body3 className={styles.legalMark}>New York, United States</Body3>
      </div>
    </>
  )
}

/** Photo dock - pinned to the screen's bottom edge. The Screen's overflow
 *  clips the pile past the fold; each card jumps on its own. */
function PhotoDock({ pool }: { pool: ArchSummary[] }) {
  return (
    <div className={styles.dock}>
      {pool.map((a) => (
        <PaperPhoto
          key={a.slug}
          className={styles.dockPhoto}
          src={a.cover.image}
          alt={a.name}
          width={a.cover.width}
          height={a.cover.height}
          seed={a.slug}
          tilt={36}
          crossOrigin={null}
        />
      ))}
    </div>
  )
}

/** Photo pool for the dock: the stats deck first, city-ledger covers
 * filling in behind it. */
function dockPool(data: LandingData, n: number): ArchSummary[] {
  const seen = new Set<string>()
  const out: ArchSummary[] = []
  const push = (a: ArchSummary) => {
    if (!seen.has(a.slug)) {
      seen.add(a.slug)
      out.push(a)
    }
  }
  data.stats.worldArchs.forEach(push)
  Object.values(data.cityLedger).forEach((list) => list.forEach(push))
  return out.slice(0, n)
}

/** Social link — brand glyph (simple-icons path) in a default ghost icon
 *  Button; the anchor is the button via asChild. */
function SocialLink({ icon, label, href }: { icon: SimpleIcon; label: string; href: string }) {
  return (
    <Button asChild variant="ghost" size="icon-sm">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} opacity="0.75" fill="currentColor" aria-hidden>
          <path d={icon.path} />
        </svg>
      </a>
    </Button>
  )
}

function NavColumn({ group }: { group: (typeof LINK_GROUPS)[number] }) {
  return (
    <>
      <Body1 className={styles.navLabel}>{group.label}</Body1>
      <div className={styles.navList}>
        {group.links.map((l) => (
          <Button key={l.label}  variant="link" size="default" asChild>
            <a href={l.href}>
              {l.label}
            </a>
          </Button>
        ))}
      </div>
    </>
  )
}