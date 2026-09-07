// City ledger on the spine. The map is
// the spine's layer landing on the empty shape pane; photo markers portal
// into it and gate through a container flag, while the flow tree carries
// the city dossier + 2x3 city-button grid and fades out over the hold's
// tail.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useTransform, type MotionValue, type Variants } from "framer-motion"
import { Body1, Body2, H3 } from "@nolli/ui"
import { flyToSceneCinematic } from "@nolli/map"
import { useDbStore, type ArchSummary } from "@nolli/data"
import { useSceneScroll, useSpineMap } from "@/spine/spine"
import type { HoldScene, PxRect } from "@/spine/timeline"
import { fitCamera } from "@/lib/camera"
import { cityIdByName, nearestPhotos } from "@/lib/shape"
import { CityMarkers } from "@/components/city-markers"
import { RollButton } from "@/components/roll-button"
import { RollText } from "@/components/roll-text"
import { HSplit, Pane, Screen, VSplit } from "./grid"
import styles from "./city-ledger.module.css"

const CITIES = ["New York", "London", "Paris", "Tokyo", "Chicago", "Berlin"] as const

const ARCHS_PER_CITY = 8

/** City grid row height. */
const CITY_ROW_H = "3.5rem"

/** Visibility windows in scene-local vh, all within TOTLE_VH ± ENTRY_VH:
 * the entry flight fires and the markers flag on at −ENTRY_VH; the
 * content fades and the markers flag off across TOTLE_VH − ENTRY_VH →
 * TOTLE_VH (fade lengths live in their own css). ENTRY_REARM_VH is
 * hysteresis only. */
const ENTRY_VH = 20
const ENTRY_REARM_VH = 20
const TOTLE_VH = 200

/** Fit padding in pane px: photo cards hang below the pin, so the
 * south-most arch needs far more room below it than the north-most above. */
const FIT_PADDING = { left: 100, right: 100, top: 100, bottom: 240 }

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

export const cityHold =
  (cityPane: PxRect): HoldScene => ({
    kind: "hold",
    id: "city",
    shape: "[data-spine-shape='city']",
    heightVh: TOTLE_VH,
    Component: () => <CityLedger cityPane={cityPane} />,
  })

function CityLedger({ cityPane }: { cityPane: PxRect }) {
  const map = useSpineMap()
  const local = useSceneScroll()

  const dataSource = useDbStore((s) => s.dataSource)
  const [archByCities, setArchByCities] = useState<Record<string, ArchSummary[]>>(() => ({}))
  useEffect(() => {
    if (!dataSource) return
    ;(async () => {
      try {
        const options = await dataSource.getFilterOptions()
        const entries = await Promise.all(
          CITIES.map(async (name) => {
            const id = cityIdByName(options, name)
            if (!id) throw new Error(`city "${name}" not found`)
            return [name, await dataSource.getAllArchitectures({ cityIds: [id] })] as const
          }),
        )
        setArchByCities((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
      } catch {
        // cities that didn't load stay dim in the grid
      }
    })()
  }, [dataSource])

  const archsByCity = useMemo(() => {
    const out: Record<string, ArchSummary[]> = {}
    for (const name of CITIES) {
      const items = archByCities[name]
      if (!items?.length) continue
      out[name] = nearestPhotos(items, items[0].coordinates, ARCHS_PER_CITY)
    }
    return out
  }, [archByCities])

  const [selected, setSelected] = useState<string>(CITIES[0])
  // the carded arch — always one once the city loads; hovering a row or
  // marker moves the card
  const [cardSlug, setCardSlug] = useState<string | null>(null)
  const archs = archsByCity[selected] ?? []
  // new city → card back to its first arch
  useEffect(() => {
    setCardSlug(archs[0]?.slug ?? null)
  }, [archs])
  const displayCity = useCityDisplay(local, selected)

  const cameraFor = useCallback(
    (cityArchs: ArchSummary[]) =>
      fitCamera(
        cityArchs.map((p) => p.coordinates),
        { width: cityPane.width, height: cityPane.height },
        FIT_PADDING,
      ),
    [cityPane],
  )

  // fly in as the transition hands us the screen; hysteresis via ENTRY_REARM_VH
  // keeps a jittering scroll from refiring
  const archsRef = useRef(archs)
  archsRef.current = archs
  const entered = useRef(local.get() >= ENTRY_VH)
  const flied = useRef(false)
  useMotionValueEvent(local, "change", (v) => {
    if (v >= -ENTRY_VH && v < TOTLE_VH + ENTRY_REARM_VH) {
      // if (entered.current || !map) return
      entered.current = true
    } else if (v < -ENTRY_VH - ENTRY_REARM_VH || v >= TOTLE_VH + ENTRY_REARM_VH) {
      entered.current = false
    }

    if (v >= 0 && v < TOTLE_VH) {
      if (flied.current || !map) return
      flied.current = true
      flyToSceneCinematic(map, cameraFor(archsRef.current))
    } else {
      flied.current = false
    }
  })

  const onSelect = useCallback(
    (name: string) => {
      setSelected(name)
      const cityArchs = archsByCity[name]
      if (!map || !cityArchs?.length) return
      flyToSceneCinematic(map, cameraFor(cityArchs))
    },
    [archsByCity, map, cameraFor],
  )

  const fade = useTransform(local, [TOTLE_VH - ENTRY_VH, TOTLE_VH], [1, 0])
  // markers own the screen from the landing run-in (same edge the entry
  // flight fires on) to the exit window
  const [markersOn, setMarkersOn] = useState(() => {
    const v = local.get()
    return v >= -ENTRY_VH && v < TOTLE_VH - ENTRY_VH
  })
  useMotionValueEvent(local, "change", (v) => setMarkersOn(v >= -ENTRY_VH && v < TOTLE_VH - ENTRY_VH))

  return (
    <>
      <Screen className={styles.city}>
        <CityMarkers archs={archs} on={markersOn} selected={cardSlug} onSelect={setCardSlug} />
        <motion.div className={styles.splits} style={{ opacity: fade }}>
          <HSplit>
            <Pane size="var(--size-header-height)" />
            <Pane className={styles.visibleOverflow}>
              <VSplit>
                <Pane size="var(--grid-padding)" />
                <Pane size="calc(var(--grid-col) * 4)" className={styles.visibleOverflow}>
                  <HSplit>
                    <Pane className={`${styles.statementPane} ${styles.visibleOverflow}`}>
                      <Statement
                        leadCity={displayCity}
                        listCity={selected}
                        archs={archs}
                        cardSlug={cardSlug}
                        onCard={setCardSlug}
                      />
                    </Pane>
                    <CityRow
                      cities={CITIES.slice(0, 2)}
                      selected={selected}
                      loaded={Object.keys(archByCities)}
                      onSelect={onSelect}
                    />
                    <CityRow
                      cities={CITIES.slice(2, 4)}
                      selected={selected}
                      loaded={Object.keys(archByCities)}
                      onSelect={onSelect}
                    />
                    <CityRow
                      cities={CITIES.slice(4, 6)}
                      selected={selected}
                      loaded={Object.keys(archByCities)}
                      onSelect={onSelect}
                    />
                  </HSplit>
                </Pane>
                <Pane size="calc(var(--grid-col) * 8)">
                  <div data-spine-shape="city" className={styles.mapPane} />
                </Pane>
                <Pane size="var(--grid-padding)" />
              </VSplit>
            </Pane>
          </HSplit>
        </motion.div>
      </Screen>
    </>
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
  return (
    <>
      <div className={styles.leadTrack}>
        <H3 className={styles.lead}>
          Travelling to <RollText text={leadCity} />.
        </H3>
      </div>
      <Body1 asChild>
        <p className={styles.statementText}>Nolli has Architectures Worth Seeing.</p>
      </Body1>
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
    </>
  )
}

/** One row of the city grid — fixed-height pane, split into two cells;
 * each cell IS the button. */
function CityRow({
  cities,
  selected,
  loaded,
  onSelect,
}: {
  cities: readonly string[]
  selected: string
  loaded: string[]
  onSelect: (name: string) => void
}) {
  return (
    <Pane size={CITY_ROW_H}>
      <VSplit>
        {cities.map((name) => (
          <CityCell
            key={name}
            name={name}
            selected={name === selected}
            ready={loaded.includes(name)}
            onSelect={onSelect}
          />
        ))}
      </VSplit>
    </Pane>
  )
}

/** One city cell — RollButton with the city arming model: hover/focus
 * previews the focused face; selection holds it, and handing selection
 * over rolls the old cell back to default. */
function CityCell({
  name,
  selected,
  ready,
  onSelect,
}: {
  name: string
  selected: boolean
  ready: boolean
  onSelect: (name: string) => void
}) {
  const [armed, setArmed] = useState(false)
  // listeners stay attached even while selected — a leave during selection
  // must still clear armed, or the cell would re-show the armed face once
  // deselected. The face itself only arms when interactive.
  const faceArmed = armed && ready && !selected
  const arm = (v: boolean) => () => setArmed(v)
  return (
    <RollButton
      state={selected || faceArmed ? "focused" : "default"}
      disabled={!ready}
      className={styles.cityButton}
      onClick={() => onSelect(name)}
      aria-pressed={selected}
      onMouseEnter={arm(true)}
      onMouseLeave={arm(false)}
      onFocus={arm(true)}
      onBlur={arm(false)}
    >
      {name}
    </RollButton>
  )
}
