// Stats hold on the spine — the closer, on the page grid: the hero card
// merges the veiled map, the architecture count and the photo deck into
// one 2×2 pane — the frame at the map scale, the text over it; countries
// and architects are paper cells with badge marquees; the CTA cell is one
// LandingButton. The card sticks for the hold — the map converges onto
// its shape and the pair holds still while the count-ups play — then the
// hold ends and the card leaves with the spine's map frame, the footer
// (outside the spine, after it) covering from below.
import { useEffect, useRef } from "react"
import { motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion"
import { Badge, H2, H3, H6, Note, PaperPhoto, useIsMobile } from "@nolli/ui"
import type { ArchSummary } from "@/lib/landing-data"
import { worldCamera } from "@/lib/world-camera"
import { MAP_APP_URL } from "@/lib/constants"
import type { HoldScene } from "@/spine/timeline"
import type { CollectionStats, LandingData } from "@/lib/landing-data"
import { LandingButton } from "@/components/landing-button"
import { ArrowUpRight } from "lucide-react"
import { Pane, Rule, Screen } from "./page-layout"
import styles from "./stats.module.css"

const SCENE_ID = "stats"

/** Hold height in scene vh — the card's viewport plus the runway the
 * count-ups and the reading play over. */
const SCENE_VH = 120

// country badge list — real ISO codes + Intl.DisplayNames once the cities
// data flows in; placeholder set until
const COUNTRY_BADGES = [
  "France", "Japan", "Brazil", "Portugal", "Italy",
  "Spain", "Switzerland", "Germany", "United States", "China",
]

export const statsHold = (data: LandingData): HoldScene => ({
  kind: "hold",
  id: SCENE_ID,
  shape: "[data-spine-shape='stats']",
  heightVh: SCENE_VH,
  // same world view the architect hold parks on — this scene only verifies it
  camera: worldCamera,
  Component: () => (
    <StatsScene
      stats={data.stats}
      photoPool={data.stats.worldArchs}
      architectNames={data.architectLedger.map((e) => e.name)}
    />
  ),
})

type StatsProps = {
  stats: CollectionStats
  photoPool: ArchSummary[]
  architectNames: string[]
}

function StatsScene({ stats, photoPool, architectNames }: StatsProps) {
  const mobile = useIsMobile()
  return (
    <>
      <div className={styles.stickWrap}>
        <div className={styles.stick}>
          <Screen className={styles.screen} height="auto">
        {/* the hero card — map, architecture count and photo deck merged
         * into one 2×2 pane, the original top-card layout: the frame is a
         * paper ring with a mask window (the sticky subtree paints
         * atomically above the spine's map frame, so the map behind shows
         * through the window instead of the pane diving under it), and
         * everything else lives at the text level in a twin pane over the
         * map */}
        <Pane className={styles.mapPane} style={{ gridArea: "hero" }}>
          <div className={styles.shape} aria-hidden data-spine-shape="stats" />
        </Pane>
        <Pane className={styles.heroPane} style={{ gridArea: "hero" }}>
          <H2 className={styles.statementText}>
            A Map. A Collection.
            <br />
            A <span className={styles.accent}>Growing Community</span>.
          </H2>
          <div className={styles.heroFoot}>
            <NumberBlock
              value={stats.buildings} label="Has Collected" delay={0} size="l"
              sub="Architectures"
            />
          </div>
          <div className={styles.heroStack} aria-hidden>
            <PhotoStack archs={photoPool} />
          </div>
        </Pane>
        <Pane filled className={styles.cellPane} style={{ gridArea: "ctry" }}>
          <NumberBlock
            value={stats.countries} label="Located across" delay={0.3} size="m"
            sub="Countries"
          />
          <BadgeRows items={COUNTRY_BADGES} />
        </Pane>
        <Pane filled className={styles.cellPane} style={{ gridArea: "dsg" }}>
          <NumberBlock
            value={stats.architects} label="Designed by" delay={0.15} size="m"
            sub="Architects"
          />
          <BadgeRows items={architectNames} />
        </Pane>
        {!mobile && (
          <Pane style={{ gridArea: "cta" }}>
            <LandingButton variant="ghost" className={styles.ctaButton} asChild>
              <a href={MAP_APP_URL} target="_blank" rel="noopener noreferrer">
                <Note>Open the map</Note>
                <ArrowUpRight size={16} aria-hidden />
              </a>
            </LandingButton>
          </Pane>
        )}
        <Rule col="1 / -1" style={{ gridRow: 2, alignSelf: "end" }} />
          </Screen>
        </div>
      </div>
    </>
  )
}

/* ── pieces ───────────────────────────────────────────────────────────── */

/** Time-based count-up when scrolled into view — spring physics (no fixed
 *  duration, natural settle), text rendered via useTransform so ticks don't
 *  re-render the tree. Reduced motion reads the raw source value, no spring. */
function CountUp({ to, delay = 0, className }: {
  to: number
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const on = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { damping: 14, stiffness: 60 })
  const text = useTransform(reduce ? mv : spring, (v) => Math.round(v).toLocaleString("en-US"))
  useEffect(() => {
    if (!on) return
    if (reduce) {
      mv.set(to)
      return
    }
    const t = window.setTimeout(() => mv.set(to), delay * 1000)
    return () => window.clearTimeout(t)
  }, [on, to, delay, reduce, mv])
  return <motion.span ref={ref} className={className}>{text}</motion.span>
}

function NumberBlock({ value, label, sub, delay, size }: {
  value: number
  label: string
  sub: React.ReactNode
  delay: number
  size: "m" | "l"
}) {
  return (
    <div className={styles.block}>
      <H3 className={styles.label}>{label}</H3>
      <div className={styles.statsLine}>
        <CountUp to={value} delay={delay} className={`${styles.num} ${styles[size]}`} />
        <H6 className={styles.sub}>{sub}</H6>
      </div>
    </div>
  )
}

/** Corner deck of paper photos — landscape covers preferred (the tile crops
 *  to landscape, portrait shots would get re-cropped anyway), portrait
 *  covers only fill gaps. Piles into the card's bottom-right corner and
 *  bounces toward the top-left — the original fan. */
function PhotoStack({ archs }: { archs: ArchSummary[] }) {
  const landscape = archs.filter((a) => a.cover.width > a.cover.height)
  const portrait = archs.filter((a) => a.cover.width <= a.cover.height)
  return (
    <div className={styles.stack}>
      {[...landscape, ...portrait].slice(0, 5).map((a) => (
        <PaperPhoto
          key={a.slug}
          className={styles.stackPhoto}
          src={a.cover.image}
          alt={a.name}
          width={a.cover.width}
          height={a.cover.height}
          seed={a.slug}
          tilt={4}
          crossOrigin={null}
        />
      ))}
    </div>
  )
}

/** Two marquee rows of badges, opposite directions; static wrap under
 *  reduced motion. */
function BadgeRows({ items }: { items: string[] }) {
  const rows = [items, [...items].reverse()]
  return (
    <div className={styles.badges} aria-hidden>
      {rows.map((row, r) => (
        <div className={styles.badgeTrack} data-dir={r === 1 ? "rev" : ""} key={r}>
          {[...row, ...row].map((label, i) => (
            <Badge key={i} variant="outline" className={styles.badgeItem}>{label}</Badge>
          ))}
        </div>
      ))}
    </div>
  )
}

