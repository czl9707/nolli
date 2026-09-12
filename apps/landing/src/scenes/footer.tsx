import { siInstagram, siThreads, type SimpleIcon } from "simple-icons"
import { Body1, Body3, Button, H3, H5, H6, Note, PaperPhoto } from "@nolli/ui"
import { APP_URL, ABOUT_URL, POSTER_URL, WORLD_CAMERA } from "@/lib/constants"
import { TRANSITION_LEAD_VH, type HoldScene, type SpineScene, type TransitionScene } from "@/spine/timeline"
import type { ArchSummary, LandingData } from "@/lib/landing-data"
import { HSplit, Pane, Screen, VSplit } from "./grid"
import { MapTransition } from "./map-transition"
import styles from "./footer.module.css"

const LINK_GROUPS: Array<{
  label: string
  links: Array<{ label: string; href: string; arrow?: boolean }>
}> = [
  {
    label: "Explore",
    links: [
      { label: "Nolli", href: APP_URL },
      { label: "Poster", href: POSTER_URL },
    ],
  },
  {
    label: "Resources",
    links: [
      { label: "About", href: ABOUT_URL },
      { label: "Privacy", href: `${APP_URL}/privacy` },
      { label: "Terms", href: `${APP_URL}/terms` },
      { label: "Contact", href: `mailto:nolli.map@gmail.com` }
    ],
  },
]

export function footerScenes(data: LandingData): SpineScene[] {
  return [statsFullTransition(), footerHold(data)]
}

const SCENE_VH = 100;

export function statsFullTransition(): TransitionScene {
  return {
    kind: "transition",
    id: "stats-full",
    fromShape: "[data-spine-shape='stats']",
    toShape: "[data-spine-shape='footer']",
    heightVh: 0
  }
}

export function footerHold(data: LandingData): HoldScene {
  return {
    kind: "hold",
    id: "footer",
    shape: "[data-spine-shape='footer']",
    heightVh: SCENE_VH,
    Component: () => <FooterScene data={data} />,
  }
}


function FooterScene({ data }: { data: LandingData }) {
  return (
    <>
      <MapTransition target={WORLD_CAMERA} untilVh={SCENE_VH - TRANSITION_LEAD_VH} />
      <Screen className={`${styles.veil} ${styles.screen}`}>
        <div className={styles.shape} data-spine-shape="footer" aria-hidden />
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
                        <a className={styles.brand} href="#" aria-label="Nolli home">
                          <img className={styles.mark} src="/favicon.svg" alt="" width={24} height={24} />
                          <H3>Nolli</H3>
                        </a>
                        <H5 className={styles.statement}>
                          The Map Where Architectures Lives.
                        </H5>
                        <div className={styles.social}>
                          <SocialLink icon={siInstagram} label="Instagram" href="https://www.instagram.com/nolli.map/" />
                          <SocialLink icon={siThreads} label="Threads" href="https://www.threads.net/@nolli.map" />
                        </div>
                        <span className={styles.spacer}/>
                        <div className={styles.meta}>
                          <Body3 className={styles.legalMark}>© 2026-present Zane Chen</Body3>
                          <Body3 className={styles.legalMark}>New York, United States</Body3> 
                        </div>
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
              {/* <Pane size="40svh" /> */}
              <PhotoDock pool={dockPool(data, 9)} />
            </HSplit>
          </Pane>
        </HSplit>
      </Screen>
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
      <Note className={styles.navLabel}>{group.label}</Note>
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