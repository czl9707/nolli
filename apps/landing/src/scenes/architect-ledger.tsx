// Architect ledger on the map background — the dealer hold. The map is
// the spine's fullscreen layer at world scale behind the whole hold, a
// static paper veil dims it end to end, and the dossier pane takes the
// first column. Every photo of every ledger architect lives in one loose
// stack docked bottom-right; picking a name deals that architect's works
// out of the stack onto their true pins (a staggered flight per work),
// and the previous pick's works stagger back into the stack. Selection is
// pointer-only — the scroll budget just holds the scene still.
import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion"
import { Body2, H2, useIsMobile } from "@nolli/ui"
import { worldCamera } from "@/lib/world-camera"
import { type ArchEntry, type ArchSummary, type LandingData } from "@/lib/landing-data"
import { useSceneOwnsMap, useSpineMap } from "@/spine/spine"
import type { HoldScene } from "@/spine/timeline"
import { useLinger } from "@/lib/use-linger"
import { MarkerPhoto } from "@/components/photo-markers"
import markerStyles from "@/components/photo-markers.module.css"
import { RollText } from "@/components/roll-text"
import { Pane, Rule, Screen } from "./page-layout"
import styles from "./architect-ledger.module.css"

/** Hold height in scene vh — 100 of sticky scene + 40 of stay-still
 * budget. */
const SCENE_VH = 140

export const architectHold = (data: LandingData): HoldScene => ({
  id: "architect",
  shape: "[data-spine-shape='architect']",
  heightVh: SCENE_VH,
  camera: worldCamera,
  rulesOverMap: true,
  Component: () => <ArchitectLedger entries={data.architectLedger} />,
})

function ArchitectLedger({ entries }: { entries: ArchEntry[] }) {
  const ownsMap = useSceneOwnsMap()
  const [selected, setSelected] = useState(entries[0]?.name ?? "")
  const entry = entries.find((e) => e.name === selected)

  return (
    <>
      <div aria-hidden data-spine-shape="architect" className={styles.mapAnchor} />
      <section className={styles.architect}>
        <div aria-hidden className={styles.veil} />
        <DealerMarkers entries={entries} selected={selected} on={ownsMap} />
        <Screen className={styles.screen}>
          <Pane className={styles.dossierPane} blurred>
            <div className={styles.dossier}>
              <Statement name={selected} works={entry?.works ?? []} />
              <NameList entries={entries} selected={selected} onSelect={setSelected} />
            </div>
          </Pane>
          <Rule full className={styles.closingRule} />
        </Screen>
      </section>
    </>
  )
}

/** The hold's photo markers — every work of every ledger architect, above
 * the veil. A fixed layer over the whole viewport (same trick as the
 * city's): the map never moves, so raw viewport projections are exact and
 * nothing repositions on scroll. Each marker sits at its pin (left/top)
 * and either rests there or is translated into the loose stack docked
 * bottom-right; selection changes rewrite the transforms and the css
 * transition flies the cards, with a per-work stagger on the deal out and
 * on the recall back. The first pass (and the re-style after a resize)
 * lands without transition, so mounting reads as a quiet stack. */
const DEAL_STAGGER_MS = 120
const RECALL_STAGGER_MS = 90

function DealerMarkers({
  entries,
  selected,
  on,
}: {
  entries: ArchEntry[]
  selected: string
  on: boolean
}) {
  const [mounted, visible] = useLinger(on, 400)
  const map = useSpineMap()
  const els = useRef(new Map<string, HTMLDivElement>())
  const all = useMemo(() => entries.flatMap((e) => e.works), [entries])

  // stable loose-stack jitter per photo — offset, spread and tilt from a
  // slug hash, so the pile reads as a heap and never reshuffles
  const jitter = useMemo(() => {
    const m = new Map<string, { x: number; y: number; r: number }>()
    for (const a of all) {
      let h = 0
      for (let i = 0; i < a.slug.length; i++) h = (h * 31 + a.slug.charCodeAt(i)) % 9973
      m.set(a.slug, {
        x: ((h % 100) / 100 - 0.5) * 120,
        y: (((h / 100) | 0) % 100 / 100 - 0.5) * 80,
        r: (((h / 10000) | 0) % 100 / 100 - 0.5) * 30,
      })
    }
    return m
  }, [all])

  // the selection's works, in deal order — and what was dealt last pass,
  // so only the actually-moving cards carry a stagger delay
  const dealOrder = useMemo(
    () => new Map(entries.find((e) => e.name === selected)?.works.map((a, i) => [a.slug, i] as const) ?? []),
    [entries, selected],
  )
  const prevDealt = useRef(new Set<string>())
  // styled at least once — their transitions must never be disabled again
  const styledOnce = useRef(new Set<string>())

  useEffect(() => {
    if (!map || !mounted) return
    const recallOrder = new Map<string, number>()
    for (const e of entries) e.works.forEach((a, i) => recallOrder.set(a.slug, i))

    let anyFresh = false
    const apply = () => {
      const mobile = window.innerWidth < 768
      const sx = window.innerWidth - (mobile ? 110 : 175)
      const sy = window.innerHeight - (mobile ? 120 : 140)
      for (const a of all) {
        const el = els.current.get(a.slug)
        if (!el) continue
        const p = map.project([a.coordinates.lng, a.coordinates.lat])
        el.style.left = `${p.x}px`
        el.style.top = `${p.y}px`
        const dealt = dealOrder.has(a.slug)
        const wasDealt = prevDealt.current.has(a.slug)
        const j = jitter.get(a.slug)!
        if (dealt) {
          el.style.transform = "translate(-50%, 0px) rotate(0deg)"
          el.style.zIndex = "10"
        } else {
          el.style.transform = `translate(calc(-50% + ${sx + j.x - p.x}px), ${sy + j.y - p.y}px) rotate(${j.r}deg)`
          el.style.zIndex = "1"
        }
        // stagger only the cards this change actually moves
        el.style.transitionDelay =
          dealt && !wasDealt
            ? `${(dealOrder.get(a.slug) ?? 0) * DEAL_STAGGER_MS}ms`
            : !dealt && wasDealt
              ? `${(recallOrder.get(a.slug) ?? 0) * RECALL_STAGGER_MS}ms`
              : "0ms"
        if (!styledOnce.current.has(a.slug)) {
          styledOnce.current.add(a.slug)
          anyFresh = true
          el.style.transitionDuration = "0s"
        }
      }
      prevDealt.current = new Set(dealOrder.keys())
    }
    apply()
    // re-arm the transitions after a fresh card's first placement — side
    // effect only, the subscription below must survive this pass
    if (anyFresh) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          for (const el of els.current.values()) el.style.transitionDuration = ""
        }),
      )
    }
    const onMove = () => apply()
    map.on("move", onMove)
    map.on("resize", onMove)
    return () => {
      map.off("move", onMove)
      map.off("resize", onMove)
    }
  }, [map, mounted, on, all, entries, dealOrder, jitter])

  if (!mounted) return null
  return (
    <div className={styles.markerLayer} aria-hidden>
      {all.map((a) => (
        <div
          key={a.slug}
          ref={(el) => {
            if (el) els.current.set(a.slug, el)
            else els.current.delete(a.slug)
          }}
          className={styles.slot}
        >
          <div className={markerStyles.photoMarker} data-show={visible || undefined}>
            <MarkerPhoto a={a} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Arch-list swap choreography — the city dossier's blur stagger. */
const itemVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(6px)" },
  visible: (d: number) => ({
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.3, ease: "easeOut", delay: d },
  }),
  exit: (d: number) => ({
    opacity: 0,
    filter: "blur(6px)",
    transition: { duration: 0.2, ease: "easeIn", delay: d * 0.6 },
  }),
}

const rowDelay = (slug: string) => {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 997
  return (h / 997) * 0.24
}

/** Dossier copy. The architect rolls its faces on a pick (the page's roll
 * is the deal animation, always upward); the works list under the
 * statement swaps in a blur stagger with it. */
function Statement({ name, works }: { name: string; works: ArchSummary[] }) {
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  return (
    <>
      <H2 className={styles.statementText}>
        You can name the works of <RollText text={name} />.
        <br />
        <span className={styles.accent}>Nolli</span> help you pin them on the map.
      </H2>
      {
        !mobile &&
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul key={name} className={styles.archList} initial="hidden" animate="visible" exit="exit">
            {works.map((p, i) => (
              <motion.li
                key={p.slug}
                variants={reduced ? undefined : itemVariants}
                custom={rowDelay(p.slug)}
              >
                <span className={styles.archNum}>{String(i + 1).padStart(2, "0")}</span>
                <Body2 className={styles.archName}>{p.name}</Body2>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      }
    </>
  )
}

/** The architect picker — a plain ledger list for now. */
function NameList({
  entries,
  selected,
  onSelect,
}: {
  entries: ArchEntry[]
  selected: string
  onSelect: (name: string) => void
}) {
  return (
    <div className={styles.nameList}>
      {entries.map((e) => (
        <button
          key={e.name}
          type="button"
          className={styles.nameRow}
          data-active={e.name === selected}
          aria-pressed={e.name === selected}
          onClick={() => onSelect(e.name)}
        >
          <span>{e.name}</span>
          <span className={styles.nameCount}>{e.works.length}</span>
        </button>
      ))}
    </div>
  )
}
