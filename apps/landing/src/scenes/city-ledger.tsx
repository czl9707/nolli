// City ledger on the spine. The map is the spine's layer landing on the
// empty shape pane over the right columns; photo markers portal into it and
// gate through a container flag, while the dossier column carries the
// statement, the arch list, and the city cubes — a ledger line at the
// column's foot (cubes left, city name right). Selection swaps play as a
// directional pass: the outgoing cube swipes off toward travel and fades,
// the incoming one swipes in from behind it. Cities advance every
// ADVANCE_MS; hover pauses, click jumps.
import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react"
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion"
import { Body2, H2, Note } from "@nolli/ui"
import { applyMapTransition } from "@/lib/map-transition"
import { type ArchSummary, type LandingData } from "@/lib/landing-data"
import { CITY_LEDGER } from "@/lib/constants"
import { useSceneOwnsMap, useSpineMap } from "@/spine/spine"
import type { SceneCamera } from "@nolli/map"
import type { HoldScene } from "@/spine/timeline"
import { fitCamera } from "@/lib/camera"
import { useIsMobile } from "@nolli/ui"
import { CityMarkers } from "@/components/city-markers"
import { RollText } from "@/components/roll-text"
import { Pane, Rule, Screen } from "./page-layout"
import styles from "./city-ledger.module.css"

/** Hold height in scene vh. */
const SCENE_VH = 130

/** City auto-advance period. */
const ADVANCE_MS = 8000

/** Fit padding in pane px: photo cards hang below the pin, so the
 * south-most arch needs far more room below it than the north-most above. */
const FIT_PADDING = { left: 100, right: 100, top: 100, bottom: 240 }

/** Same shape scaled to the mobile map pane — a fraction of the px box. */
const FIT_PADDING_MOBILE = { left: 36, right: 36, top: 36, bottom: 96 }

export const cityHold = (data: LandingData): HoldScene => {
  const fit: RefObject<SceneCamera | null> = { current: null }
  return {
    id: "city",
    shape: "[data-spine-shape='city']",
    heightVh: SCENE_VH,
    camera: () => fit.current,
    Component: () => <CityLedger data={data} fit={fit} />,
  }
}

function CityLedger({ data, fit }: { data: LandingData; fit: RefObject<SceneCamera | null> }) {
  const map = useSpineMap()
  const mobile = useIsMobile()
  const paneRef = useRef<HTMLDivElement | null>(null)
  const archsByCity = data.cityLedger

  // the carousel always opens on the first city
  const [selected, setSelected] = useState<string>(CITY_LEDGER[0])
  // the carded arch — always one once the city loads; hovering a row or
  // marker moves the card
  const [cardSlug, setCardSlug] = useState<string | null>(null)
  const archs = archsByCity[selected] ?? []
  // new city → card back to its first arch
  useEffect(() => {
    setCardSlug(archs[0]?.slug ?? null)
  }, [archs])

  // camera fits the archs into the pane's measured px box — read at call
  // time from the ref; every caller (entry flight, city pick) runs long
  // after the pane has mounted
  const cameraFor = useCallback((cityArchs: ArchSummary[]) => {
    const pane = paneRef.current
    if (!pane) return null
    const { width, height } = pane.getBoundingClientRect()
    return fitCamera(
      cityArchs.map((p) => p.coordinates),
      { width, height },
      mobile ? FIT_PADDING_MOBILE : FIT_PADDING,
    )
  }, [mobile])

  useEffect(() => { fit.current = cameraFor(archs) }, [fit, archs, cameraFor])

  // map ownership gates the live pieces — markers, the cubes' auto-advance,
  // and the camera moves all follow the spine's owned-scene edge (the pane
  // itself is always in the page)
  const ownsMap = useSceneOwnsMap()

  const onSelect = useCallback(
    (name: string) => {
      setSelected(name)
      const cityArchs = archsByCity[name]
      if (!ownsMap || !map || !cityArchs?.length) return
      const cam = cameraFor(cityArchs)
      if (!cam) return
      applyMapTransition(map, cam)
    },
    [archsByCity, map, cameraFor, ownsMap],
  )

  return (
    <Screen className={styles.city} height={`${SCENE_VH}svh`}>
      <CityMarkers archs={archs} on={ownsMap} selected={cardSlug} onSelect={setCardSlug} />
      <Pane className={styles.mapPaneWrap}>
        <div ref={paneRef} data-spine-shape="city" className={styles.mapPane} />
      </Pane>
      {/* col lives in the css — the mobile block widens the pane to the
       * full 2-col field, and a `col` prop here would inline-override it */}
      <Pane className={styles.contentPane}>
        <div className={styles.content}>
          <Statement
            city={selected}
            listCity={selected}
            archs={archs}
            cardSlug={cardSlug}
            onCard={setCardSlug}
          />
          <CityDots selected={selected} onSelect={onSelect} auto={ownsMap} />
        </div>
      </Pane>
      <Rule col="1 / -1" />
    </Screen>
  )
}

/** Arch-list swap choreography: rows blur in and out in a scattered order —
 * a stable pseudo-random delay per slug, so every swap shuffles the same
 * way and a re-render never re-rolls it. */
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

/** Dossier copy. The city rolls its faces when the selection changes (the
 * page's roll is the swap animation, always upward); the architecture
 * list under the statement swaps in a blur stagger with it. */
function Statement({
  city,
  listCity,
  archs,
  cardSlug,
  onCard,
}: {
  city: string
  listCity: string
  archs: ArchSummary[]
  cardSlug: string | null
  onCard: (slug: string) => void
}) {
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  return (
    <>
      <H2 className={styles.statementText}>
        Travelling to <RollText text={city} />...
        <br />
        Nolli has Architectures Worth Seeing.
      </H2>
      {
        !mobile &&
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul key={listCity} className={styles.archList} initial="hidden" animate="visible" exit="exit">
            {archs.map((p, i) => (
              <motion.li
                key={p.slug}
                variants={reduced ? undefined : itemVariants}
                custom={rowDelay(p.slug)}
                data-hovered={cardSlug === p.slug}
                onMouseEnter={() => onCard(p.slug)}
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

/** The city carousel control — a ledger line at the column's foot: cubes
 * on the left, the city name small at the right, both over the rule. Idle
 * cubes are small gray grounds, the selected one large and accent; a
 * selection change plays as a directional pass — the outgoing cube swipes
 * off toward travel and fades, the incoming one swipes in from behind it
 * (all CSS, keyed off data-dir/data-exit). The rule carries the period as
 * a gold wipe (scaleX so it can hold mid-sweep) that pauses with the
 * countdown under hover and resumes from the same spot; advances and
 * picks restart both at a full period. Hovering previews the name;
 * clicking selects. */
function CityDots({
  selected,
  onSelect,
  auto,
}: {
  selected: string
  onSelect: (name: string) => void
  auto: boolean
}) {
  const reduced = useReducedMotion()
  const [hovered, setHovered] = useState<number | null>(null)
  // bumped on every advance/pick so the timer + wipe restart together
  const [cycle, setCycle] = useState(0)
  const idx = Math.max(0, CITY_LEDGER.indexOf(selected))
  const running = auto && !reduced && hovered === null

  // one timer. Advances and picks schedule a fresh full period; a hover
  // pause freezes the countdown instead — the remaining ms are banked
  // once, on the running->stopped edge only, so a teardown after an
  // advance or a pick can never subtract from the period it just reset
  const timer = useRef(0)
  const remaining = useRef(ADVANCE_MS)
  const startedAt = useRef(0)
  const clearTimer = useCallback(() => window.clearTimeout(timer.current), [])
  useEffect(() => {
    if (!running) return
    startedAt.current = Date.now()
    timer.current = window.setTimeout(() => {
      remaining.current = ADVANCE_MS
      setCycle((c) => c + 1)
      onSelect(CITY_LEDGER[(idx + 1) % CITY_LEDGER.length])
    }, remaining.current)
    return clearTimer
  }, [running, idx, cycle, onSelect, clearTimer])

  // bank what's left exactly once, when the countdown actually stops —
  // resuming continues the sweep instead of restarting it
  const wasRunning = useRef(false)
  useEffect(() => {
    if (wasRunning.current && !running) {
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current))
    }
    wasRunning.current = running
  }, [running])

  // the cube that just lost the selection + the travel direction — the
  // only state the css needs to run the exit/entry pass
  const [exit, setExit] = useState<{ idx: number; dir: "fwd" | "back" } | null>(null)
  const prevIdx = useRef(idx)
  useEffect(() => {
    const old = prevIdx.current
    prevIdx.current = idx
    if (old === idx) return
    const n = CITY_LEDGER.length
    const d = (idx - old + n) % n
    // single-step moves (auto-advance, wrap included) always read forward;
    // longer jumps take the positional direction
    const dir = d === 1 || d === n - 1 || idx > old ? "fwd" : "back"
    setExit({ idx: old, dir })
  }, [idx])
  // drop the exit flag once its animation has played so a later exit of
  // the same cube re-fires
  useEffect(() => {
    if (!exit) return
    const t = setTimeout(() => setExit(null), 450)
    return () => clearTimeout(t)
  }, [exit])

  const pick = (i: number) => {
    if (CITY_LEDGER[i] === selected) return
    // the click restarts the countdown at a full period
    clearTimer()
    remaining.current = ADVANCE_MS
    setCycle((c) => c + 1)
    onSelect(CITY_LEDGER[i])
  }

  return (
    <div className={styles.indicatorContainer} data-paused={hovered !== null}>
      <div className={styles.dotsRow}>
        <div
          className={styles.cubes}
          data-dir={exit?.dir}
          onPointerLeave={() => setHovered(null)}
        >
          {CITY_LEDGER.map((name, i) => (
            <button
              key={name}
              type="button"
              className={styles.cube}
              data-active={i === idx}
              data-exit={exit?.idx === i ? exit.dir : undefined}
              aria-label={name}
              aria-current={i === idx}
              onClick={() => pick(i)}
              onPointerEnter={() => setHovered(i)}
            />
          ))}
        </div>
        <span className={styles.currentCubeName}>{CITY_LEDGER[hovered ?? idx]}</span>
      </div>
      <div className={styles.rule} aria-hidden>
        {auto && !reduced && (
          <span
            key={`${idx}-${cycle}`}
            className={styles.ruleFill}
            style={{ "--city-period": `${ADVANCE_MS}ms` } as CSSProperties}
          />
        )}
      </div>
    </div>
  )
}
