// City ledger on the spine. The map is the spine's layer landing on the
// empty shape pane over the right columns; photo markers portal into it and
// gate through a container flag, while the dossier column carries the
// statement, the arch list, and the city dots — square cells that
// auto-advance the city every ADVANCE_MS with an outline drawn around
// the selected square, hover to name a city, and click to jump.
import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useTransform, type MotionValue, type Variants } from "framer-motion"
import { Body2, H2, Note } from "@nolli/ui"
import { applyMapTransition } from "@/lib/map-transition"
import { type ArchSummary, type LandingData } from "@/lib/landing-data"
import { CITY_LEDGER } from "@/lib/constants"
import { useSceneOwnsMap, useSceneScroll, useSpineMap } from "@/spine/spine"
import type { SceneCamera } from "@nolli/map"
import type { HoldScene } from "@/spine/timeline"
import { fitCamera } from "@/lib/camera"
import { useIsMobile } from "@nolli/ui"
import { CityMarkers } from "@/components/city-markers"
import { RollText } from "@/components/roll-text"
import { Pane, Screen } from "./page-layout"
import styles from "./city-ledger.module.css"

/** Visibility windows in scene-local vh: the markers flag on at
 * −ENTRY_VH; the content fades and the markers flag off across
 * SCENE_VH − ENTRY_VH → SCENE_VH (fade lengths live in their own css).
 * ENTRY_REARM_VH is hysteresis for the pre-entry roll. */
const ENTRY_VH = 20
const ENTRY_REARM_VH = 20
const SCENE_VH = 140

/** City auto-advance period. */
const ADVANCE_MS = 8000

/** Fit padding in pane px: photo cards hang below the pin, so the
 * south-most arch needs far more room below it than the north-most above. */
const FIT_PADDING = { left: 100, right: 100, top: 100, bottom: 240 }

/** Same shape scaled to the mobile map pane — a fraction of the px box. */
const FIT_PADDING_MOBILE = { left: 36, right: 36, top: 36, bottom: 96 }

/** City-name pool for the pre-entry roll — names only, no data behind
 * them; walking the list in order is travel texture, not destinations
 * claimed. Won the prototype round against scramble/decode/flap/blur —
 * ordered pass-through with the page's roll as the swap. */
const CITY_POOL: string[] = [
  "Kyoto", "Osaka", "London", "Barcelona", "Vienna", "Prague", "Lisbon",
  "Copenhagen", "Stockholm", "New York", "Amsterdam", "Zurich", "Munich",
  "Warsaw", "Athens", "Istanbul", "Cairo", "Dubai", "Mumbai", "Bangkok",
  "Singapore", "Hong Kong", "Shanghai", "Seoul", "Sydney", "Melbourne",
  "Tokyo", "Mexico City", "Buenos Aires", "Rio", "Chicago", "Toronto",
  "Vancouver", "Berlin", "Paris", "Milan", "Rome", "Madrid", "Oslo",
  "Helsinki",
]

/** Scroll vh between pre-entry roll steps. */
const ROLL_STEP_VH = 6

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
  const local = useSceneScroll()
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
  const displayCity = useCityDisplay(local, selected)

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

  const onSelect = useCallback(
    (name: string) => {
      setSelected(name)
      const cityArchs = archsByCity[name]
      if (!map || !cityArchs?.length) return
      const cam = cameraFor(cityArchs)
      if (!cam) return
      applyMapTransition(map, cam)
    },
    [archsByCity, map, cameraFor],
  )

  const fade = useTransform(local, [SCENE_VH - ENTRY_VH, SCENE_VH], [1, 0])
  const ownsMap = useSceneOwnsMap()
  // markers own the screen from the landing run-in (same edge the entry
  // flight fires on) to the exit window — and only while the scene owns
  // the map (fade at the fire edge, not the scene tail)
  const [markersOn, setMarkersOn] = useState(() => {
    const v = local.get()
    return ownsMap && v >= -ENTRY_VH && v < SCENE_VH - ENTRY_VH
  })
  useMotionValueEvent(local, "change", (v) => setMarkersOn(ownsMap && v >= -ENTRY_VH && v < SCENE_VH - ENTRY_VH))
  // ownership can flip without a scroll change after it (deep-link load)
  useEffect(() => {
    const v = local.get()
    setMarkersOn(ownsMap && v >= -ENTRY_VH && v < SCENE_VH - ENTRY_VH)
  }, [ownsMap, local])

  return (
    <Screen className={styles.city} height={`${SCENE_VH}svh`}>
      <CityMarkers archs={archs} on={markersOn} selected={cardSlug} onSelect={setCardSlug} />
      <Pane className={styles.mapPaneWrap} data-owns={ownsMap ? "true" : "false"}>
        <div ref={paneRef} data-spine-shape="city" className={styles.mapPane} />
      </Pane>
      <Pane col="1" className={styles.contentPane}>
        <motion.div className={styles.content} style={{ opacity: fade }}>
          <Statement
            leadCity={displayCity}
            listCity={selected}
            archs={archs}
            cardSlug={cardSlug}
            onCard={setCardSlug}
          />
          <CityDots selected={selected} onSelect={onSelect} auto={markersOn} />
        </motion.div>
      </Pane>
    </Screen>
  )
}

/** The lead line's city. Before the entry window it rolls through the
 * city pool in order, a pure function of scroll distance — scrub back
 * replays it. Inside the window it is the selection; the roll itself is
 * the swap animation (in Statement), always upward. */
function useCityDisplay(local: MotionValue<number>, selected: string) {
  const [name, setName] = useState(selected)
  const inHold = useRef(local.get() >= -ENTRY_VH)
  useMotionValueEvent(local, "change", (v) => {
    inHold.current = v >= -ENTRY_VH - ENTRY_REARM_VH
    if (inHold.current) {
      setName(selected)
      return
    }
    const step = Math.floor((-v - ENTRY_VH) / ROLL_STEP_VH)
    const idx = ((step % CITY_POOL.length) + CITY_POOL.length) % CITY_POOL.length
    setName(CITY_POOL[idx])
  })
  useEffect(() => {
    if (inHold.current) setName(selected)
  }, [selected])
  return name
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

/** Dossier copy. The lead line rides the lead track — a tall box pulled
 * above the pane, the sticky's containing block — so it pins at the
 * line's docked spot from mid-transition and settles here once the scene
 * lands. The city rolls through its faces; the architecture list under
 * the statement swaps in a blur stagger when the city changes. */
function Statement({
  leadCity,
  listCity,
  archs,
  cardSlug,
  onCard,
}: {
  leadCity: string
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
        Travelling to <RollText text={leadCity} />...
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

/** The city carousel control — one square per city. The selected square
 * carries the accent ground; while the carousel runs (owning the map,
 * inside the hold window, pointer off the row, motion allowed) its
 * outline is drawn around it over the advance period. Hovering names a
 * city, clicking selects it and restarts the period. */
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
  // bumped on every pick so the timer + outline restart together
  const [cycle, setCycle] = useState(0)
  const idx = Math.max(0, CITY_LEDGER.indexOf(selected))
  const running = auto && !reduced && hovered === null

  useEffect(() => {
    if (!running) return
    const t = setTimeout(() => {
      setCycle((c) => c + 1)
      onSelect(CITY_LEDGER[(idx + 1) % CITY_LEDGER.length])
    }, ADVANCE_MS)
    return () => clearTimeout(t)
  }, [running, idx, cycle, onSelect])

  const pick = (i: number) => {
    if (CITY_LEDGER[i] === selected) return
    setCycle((c) => c + 1)
    onSelect(CITY_LEDGER[i])
  }

  return (
    <div className={styles.dots} onPointerLeave={() => setHovered(null)}>
      {CITY_LEDGER.map((name, i) => (
        <button
          key={name}
          type="button"
          className={styles.dot}
          data-active={i === idx}
          aria-label={name}
          aria-current={i === idx}
          onClick={() => pick(i)}
          onPointerEnter={() => setHovered(i)}
        >
          {i === idx && running && (
            <svg key={`${idx}-${cycle}`} className={styles.dotRing} viewBox="0 0 20 20" aria-hidden>
              <motion.rect
                x={1}
                y={1}
                width={18}
                height={18}
                fill="none"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: ADVANCE_MS / 1000, ease: "linear" }}
              />
            </svg>
          )}
          <span className={styles.dotLabel}>{name}</span>
        </button>
      ))}
    </div>
  )
}
