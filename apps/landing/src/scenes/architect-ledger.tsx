// Architect ledger on the map background. The map is the spine's
// fullscreen layer at world scale behind the whole hold, veiled by the
// map component itself, and the vellum dossier sits bottom-right. The
// scroll itself pages the ledger — one architect per step: the architect's
// works ride up with the scroll at scroll speed (glued below their pins,
// no fade) and stop dead at their true coordinates when the architect
// pages in; the previous architect's works dim (brightness only, the old
// marquee treatment) and stay on the map. The cube row at the pane's foot
// is the city ledger's; a cube click scrolls the page to that architect's
// selection spot.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, type MotionValue, type Variants } from "framer-motion"
import { Body2, H2, useIsMobile } from "@nolli/ui"
import { worldCamera } from "@/lib/world-camera"
import { type ArchEntry, type ArchSummary, type LandingData } from "@/lib/landing-data"
import { useSceneOwnsMap, useSceneRange, useSceneScroll, useSpineMap } from "@/spine/spine"
import type { HoldScene } from "@/spine/timeline"
import { useLinger } from "@/lib/use-linger"
import { scrollToY } from "@/lib/scroll-to"
import { MarkerPhoto } from "@/components/photo-markers"
import markerStyles from "@/components/photo-markers.module.css"
import { RollText } from "@/components/roll-text"
import { Pane, Screen } from "./page-layout"
import cityStyles from "./city-ledger.module.css"
import styles from "./architect-ledger.module.css"

/** Scroll per architect — the ledger pages one name per step. */
const STEP_VH = 40

/** Quiet lead before the first step, so the hold settles before the
 * first hand-off. */
const LEAD_VH = 30

export const architectHold = (data: LandingData): HoldScene => {
  const n = data.architectLedger.length
  return {
    kind: "hold",
    id: "architect",
    shape: "[data-spine-shape='architect']",
    heightVh: 100 + LEAD_VH + (n - 1) * STEP_VH,
    camera: worldCamera,
    Component: () => <ArchitectLedger entries={data.architectLedger} />,
  }
}

/** The scrollY where architect i pages in, in real pixels. The spine's
 * scene-local vh rides the whole-page progress (1 v-unit ≠ 1 scroll vh),
 * so both the markers' stick points and the cube jumps resolve through
 * the page's own geometry. Null before the spine flow exists. */
function stickMetrics(): { pageTop: number; pxPerV: number } | null {
  const flow = document.querySelector("[data-scene='architect']") as HTMLElement | null
  const page = (flow?.parentElement?.parentElement as HTMLElement | null) ?? null
  if (!page) return null
  const ih = window.innerHeight
  const totalVh = (page.offsetHeight / ih) * 100
  return {
    pageTop: page.getBoundingClientRect().top + window.scrollY,
    pxPerV: (page.offsetHeight - ih) / totalVh,
  }
}

const stickY = (m: { pageTop: number; pxPerV: number }, startVh: number, i: number) =>
  m.pageTop + (startVh + LEAD_VH / 2 + i * STEP_VH) * m.pxPerV

function ArchitectLedger({ entries }: { entries: ArchEntry[] }) {
  const ownsMap = useSceneOwnsMap()
  const local = useSceneScroll("architect")
  const idx = useScrollIdx(entries.length, local)
  const entry = entries[idx]

  return (
    <>
      <div aria-hidden data-spine-shape="architect" className={styles.mapAnchor} />
      <section className={styles.architect}>
        <LedgerMarkers entries={entries} idx={idx} local={local} on={ownsMap} />
        <Screen className={styles.screen}>
          <Pane className={styles.ledgerPane} blurred>
            <div className={styles.ledger}>
              <div className={styles.ledgerMain}>
                <Statement name={entry?.name ?? ""} />
                <ArchitectCubes entries={entries} idx={idx} />
              </div>
              <WorksList name={entry?.name ?? ""} works={entry?.works ?? []} />
            </div>
          </Pane>
        </Screen>
      </section>
    </>
  )
}

/** Scroll-paged selection — one architect per step past the lead, held at
 * both ends. Initialized from the live position so a deep-link lands on
 * the right name. */
function useScrollIdx(n: number, local: MotionValue<number>) {
  const idxFor = (v: number) => Math.max(0, Math.min(n - 1, Math.floor((v - LEAD_VH / 2) / STEP_VH)))
  const [idx, setIdx] = useState(() => idxFor(local.get()))
  useMotionValueEvent(local, "change", (v) => {
    const i = idxFor(v)
    setIdx((cur) => (cur === i ? cur : i))
  })
  return idx
}

/** The hold's photo markers — every work of every ledger architect, above
 * the veil. A fixed layer over the whole viewport (the city's trick: the
 * map never moves, so raw viewport projections are exact). Each work
 * hangs at its pin plus the un-scrolled gap to its architect's stick
 * point — 1px closer per scrolled px, no fade — and stops dead there;
 * passed architects dim by brightness only. */
function LedgerMarkers({
  entries,
  idx,
  local,
  on,
}: {
  entries: ArchEntry[]
  idx: number
  local: MotionValue<number>
  on: boolean
}) {
  const [mounted, visible] = useLinger(on, 400)
  const map = useSpineMap()
  const { startVh } = useSceneRange("architect")
  const els = useRef(new Map<string, HTMLDivElement>())
  const all = useMemo(() => entries.flatMap((e) => e.works), [entries])
  const archIdx = useMemo(() => {
    const m = new Map<string, number>()
    entries.forEach((e, i) => e.works.forEach((a) => m.set(a.slug, i)))
    return m
  }, [entries])

  const apply = useCallback(() => {
    if (!map) return
    const m = stickMetrics()
    for (const a of all) {
      const el = els.current.get(a.slug)
      if (!el) continue
      const p = map.project([a.coordinates.lng, a.coordinates.lat])
      el.style.left = `${p.x}px`
      el.style.top = `${p.y}px`
      const i = archIdx.get(a.slug) ?? 0
      el.dataset.state = i === idx ? "lit" : "dim"
      el.style.zIndex = i === idx ? "10" : "1"
      const gap = m ? stickY(m, startVh, i) - window.scrollY : 0
      el.style.transform = `translate(-50%, ${Math.max(0, gap)}px)`
    }
  }, [map, all, archIdx, idx, startVh])

  useEffect(() => {
    if (!map || !mounted) return
    apply()
    const onMove = () => apply()
    map.on("move", onMove)
    map.on("resize", onMove)
    return () => {
      map.off("move", onMove)
      map.off("resize", onMove)
    }
  }, [map, mounted, apply])
  useMotionValueEvent(local, "change", apply)

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

/** Dossier copy — the left column, kept short: it shares the column
 * with the cube row. The name leads so the first line never wraps, and
 * it rolls its faces as the scroll pages the ledger. */
function Statement({ name }: { name: string }) {
  return (
    <H2 className={styles.statementText}>
      <RollText text={name} />,
      <br />
      you can name the works.
      <br />
      <span className={styles.accent}>Nolli</span> pins them on the map.
    </H2>
  )
}

/** The works list — the right column. It swaps in the city's blur
 * stagger with the selection. */
function WorksList({ name, works }: { name: string; works: ArchSummary[] }) {
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  if (mobile) return null
  return (
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
  )
}

/** The architect cubes — the city ledger's cube row (same styles, no
 * timer): hover previews the name, a click scrolls the page to that
 * architect's selection spot. */
export function ArchitectCubes({ entries, idx }: { entries: ArchEntry[]; idx: number }) {
  const { startVh } = useSceneRange("architect")
  const [hovered, setHovered] = useState<number | null>(null)

  // the cube that just lost the selection + the travel direction — the
  // only state the css needs to run the exit/entry pass
  const [exit, setExit] = useState<{ idx: number; dir: "fwd" | "back" } | null>(null)
  const prevIdx = useRef(idx)
  useEffect(() => {
    const old = prevIdx.current
    prevIdx.current = idx
    if (old === idx) return
    const n = entries.length
    const d = (idx - old + n) % n
    const dir = d === 1 || d === n - 1 || idx > old ? "fwd" : "back"
    setExit({ idx: old, dir })
  }, [idx, entries.length])
  // drop the exit flag once its animation has played so a later exit of
  // the same cube re-fires
  useEffect(() => {
    if (!exit) return
    const t = setTimeout(() => setExit(null), 450)
    return () => clearTimeout(t)
  }, [exit])

  const jump = (i: number) => {
    const m = stickMetrics()
    // a hair into the span — landing exactly on the stick point leaves
    // the floor() of the selection one step early
    if (m) scrollToY(stickY(m, startVh, i) + 2 * m.pxPerV)
  }

  return (
    <div className={cityStyles.indicatorContainer}>
      <div className={cityStyles.dotsRow}>
        <div className={cityStyles.cubes} data-dir={exit?.dir} onPointerLeave={() => setHovered(null)}>
          {entries.map((e, i) => (
            <button
              key={e.name}
              type="button"
              className={cityStyles.cube}
              data-active={i === idx}
              data-exit={exit?.idx === i ? exit.dir : undefined}
              aria-label={e.name}
              aria-current={i === idx}
              onClick={() => jump(i)}
              onPointerEnter={() => setHovered(i)}
            />
          ))}
        </div>
        <span className={cityStyles.currentCubeName}>{entries[hovered ?? idx]?.name}</span>
      </div>
    </div>
  )
}
