// Footer — the last part of the page, in normal flow after the spine (no
// hold, no map of its own: the map rides the stats card off-screen). Brand
// block and the two nav columns sit on the page grid; the photo dock piles
// along the bottom edge.
import { siInstagram, siThreads, type SimpleIcon } from "simple-icons"
import { Body1, Body3, Button, H4, Note, PaperPhoto } from "@nolli/ui"
import {
  ABOUT_PATH,
  MAP_APP_URL,
  POSTER_URL,
  PRIVACY_PATH,
  TERMS_PATH,
} from "@/lib/constants"
import type { ArchSummary, LandingData } from "@/lib/landing-data"
import { Pane, Screen } from "./page-layout"
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

export function Footer({ data }: { data: LandingData }) {
  return (
    <Screen className={styles.screen} height="auto">
      <Pane className={styles.brandPane} style={{ gridArea: "brand" }}>
        <BrandBlock />
      </Pane>
      <Pane className={styles.navPane} style={{ gridArea: "explore" }}>
        <NavColumn group={LINK_GROUPS[0]} />
      </Pane>
      <Pane className={styles.navPane} style={{ gridArea: "resources" }}>
        <NavColumn group={LINK_GROUPS[1]} />
      </Pane>
      <div className={styles.dockWrap} aria-hidden>
        <PhotoDock pool={dockPool(data, 9)} />
      </div>
    </Screen>
  )
}

/** Brand block — wordmark, statement, socials, legal meta. */
function BrandBlock() {
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
      <div className={styles.meta}>
        <Body3 className={styles.legalMark}>© 2026-present Zane Chen</Body3>
        <Body3 className={styles.legalMark}>New York, United States</Body3>
      </div>
    </>
  )
}

/** Photo dock - pinned to the footer's bottom edge. The wrap clips the
 *  pile past the fold - only the foot of each card shows. Each card jumps
 *  on its own: resting depth is uneven, the hovered card springs up */
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
 *  filling in behind it. */
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
            {/* external links leave the page; paths and mailto stay here */}
            <a href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {l.label}
            </a>
          </Button>
        ))}
      </div>
    </>
  )
}
