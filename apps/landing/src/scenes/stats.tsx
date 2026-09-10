// Stats hold on the spine — the closer before the footer. The map lands as
// the background of the whole workarea (not a single pane) behind a veil.
// A big buildings card heads the scene (statement riding its top, photo
// fan at its foot); architects, countries and the where-you-are count
// stand in a row beneath — badge marquees under the first two, the map
// CTA closing the last.
import { useEffect, useRef, useState } from "react"
import { motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform, type Transition } from "framer-motion"
import { Badge, H2, H4, H6, PaperPhoto, TRANSITION_SHORT } from "@nolli/ui"
import type { ArchSummary } from "@nolli/data"
import { type SceneCamera } from "@nolli/map"
import { APP_URL, ROLL_EASE } from "@/lib/constants"
import { useWhereami } from "@/lib/whereami"
import { TRANSITION_LEAD_VH, type HoldScene, type TransitionScene } from "@/spine/timeline"
import type { CollectionStats, LandingData } from "@/lib/landing-data"
import { HSplit, Pane, Screen, VSplit } from "./grid"
import { MapTransition } from "./map-transition"
import styles from "./stats.module.css"

const SCENE_ID = "stats"
const SCENE_VH = 160

// landing tail for the count-ups' completion rules
const SETTLE_DURATION = 1.4
const SETTLE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

// same world view the architect hold parks on — this scene only verifies it
const WORLD: SceneCamera = { center: [12, 25], zoom: 1.05 }

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
  Component: () => (
    <StatsScene
      stats={data.stats}
      photoPool={data.stats.worldArchs}
      architectNames={data.architectLedger.map((e) => e.name)}
    />
  ),
})

// Architect → stats morph: the spine interpolates the map shape; no
// overlay of its own.
export const architectStatsTransition = (): TransitionScene => ({
  kind: "transition",
  id: "architect-stats",
  fromShape: "[data-spine-shape='architect']",
  toShape: "[data-spine-shape='stats']",
  heightVh: 20,
  Component: () => <div className={styles.veil} aria-hidden />,
})

function StatsScene({ stats, photoPool, architectNames }: {
  stats: CollectionStats
  photoPool: ArchSummary[]
  architectNames: string[]
}) {
  return (
    <Screen className={styles.screen}>
      <HSplit>
        <Pane size="12svh"/>
        <Pane>
          <VSplit>
            <div className={styles.shape} aria-hidden data-spine-shape="stats" />
            <Pane size="var(--grid-padding)" filled/>
            <Pane>
              <HSplit>
                <Pane>
                  <MapTransition sceneId={SCENE_ID} untilVh={SCENE_VH - TRANSITION_LEAD_VH} target={WORLD} />
                  <HSplit>
                    <Pane className={`${styles.statementPane} ${styles.cell}`}>
                      <H2>
                        A Map. A Collection.
                        <br />
                        A <span className={styles.accent}>Growing Community</span>.
                      </H2>
                      <span className={styles.spacer} />
                      <NumberBlock
                        value={stats.buildings} label="Has Collected" delay={0} size="l"
                        sub="Architectures"
                      />
                      <PhotoStack archs={photoPool} />
                    </Pane>
                    <Pane size="40%">
                      <VSplit>
                        <Pane size={`calc(var(--grid-col) * 4)`} className={styles.cell}>
                          <NumberBlock
                            value={stats.architects} label="Designed by" delay={0.15} size="m"
                            sub="Architects"
                          />
                          <BadgeRows items={architectNames} />
                        </Pane>
                        <Pane size={`calc(var(--grid-col) * 4)`} className={styles.cell}>
                          <NumberBlock
                            value={stats.countries} label="Located across" delay={0.3} size="m"
                            sub="Countries"
                          />
                          <BadgeRows items={COUNTRY_BADGES} />
                        </Pane>
                        <Pane size={`calc(var(--grid-col) * 4)`} className={styles.cell}>
                          <WhereCta>
                            <WhereBlock stats={stats} />
                          </WhereCta>
                        </Pane>
                      </VSplit>
                    </Pane>
                  </HSplit>
                </Pane>
              </HSplit>
            </Pane>
            <Pane size="var(--grid-padding)" filled/>
          </VSplit>
        </Pane>
        <Pane size="8svh"/>
      </HSplit>
    </Screen>
  )
}

/* ── pieces ───────────────────────────────────────────────────────────── */

/** The where-you-are number — visitor's country from /api/whereami, count
 *  from the same DB snapshot as the neighboring numbers. Unknown country
 *  (or zero works) falls back to the worldwide total. CountUp re-targets
 *  when the geo lands, rolling between the two. */
function WhereBlock({ stats }: { stats: CollectionStats }) {
  const code = useWhereami()
  const count = code ? stats.countryArchCounts[code] : undefined
  return (
    <NumberBlock
      value={count ?? stats.buildings}
      label="There are"
      delay={0.45}
      size="m"
      sub={count ? `in ${code} !` : "Worldwide !"}
    />
  )
}

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

/** Hairline that lands when the count-up lands — own in-view trigger, kept
 *  in lockstep via the shared delay. */
function CompletionRule({ delay = 0, duration = SETTLE_DURATION }: { delay?: number; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const on = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      className={styles.rule}
      initial={false}
      animate={on ? { scaleX: 1 } : { scaleX: 0 }}
      transition={reduce ? { duration: 0 } : { duration, delay, ease: SETTLE_EASE }}
    />
  )
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
      <H4 className={styles.label}>{label}</H4>
      <div className={styles.statsLine}>
        <CountUp to={value} delay={delay} className={`${styles.num} ${styles[size]}`} /> 
        <H6 className={styles.sub}>{sub}</H6>
      </div>
      <CompletionRule delay={delay} />      
    </div>
  )
}

/** Corner deck of paper photos — landscape covers preferred (the tile crops
 *  to landscape, portrait shots would get re-cropped anyway), portrait
 *  covers only fill gaps. */
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

/** The where-you-are cell is the CTA — the whole pane, hero-CTA pattern.
 * Hover/focus anywhere in the cell rolls it: the resting face (count
 * block + underscored hint label) slides out the top, the armed face
 * (accent ground, arrow) rolls up from below. The hint is inert text —
 * the pane is the link. Faces stay mounted so the count-up never
 * re-runs. */
function WhereCta({ children }: { children: React.ReactNode }) {
  const [armed, setArmed] = useState(false)
  const reduced = useReducedMotion()
  const roll: Transition = reduced ? { duration: 0 } : { duration: TRANSITION_SHORT, ease: ROLL_EASE }
  return (
    <a
      className={styles.whereCta}
      href={APP_URL}
      onMouseEnter={() => setArmed(true)}
      onMouseLeave={() => setArmed(false)}
      onFocus={() => setArmed(true)}
      onBlur={() => setArmed(false)}
    >
      <motion.div className={styles.whereFace} animate={{ y: armed ? "-100%" : 0 }} transition={roll}>
        {children}
        <span className={styles.whereHint}>Open the map <span aria-hidden>→</span></span>
      </motion.div>
      <motion.div
        className={`${styles.whereFace} ${styles.whereArmed}`}
        initial={false}
        animate={{ y: armed ? 0 : "100%" }}
        transition={roll}
      >
        <H4>Open the map <span aria-hidden>→</span></H4>
      </motion.div>
    </a>
  )
}
