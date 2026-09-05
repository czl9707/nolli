// Index ledge on the spine (prototype variant A "Ledger" index). The map is
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
import type { LandingData } from "@/lib/landing-data"
import { fitCamera } from "@/lib/camera"
import { cityIdByName, pickIndexPhotos } from "@/lib/shape"
import { PhotoMarkers } from "@/components/photo-markers"
import { HSplit, Pane, Screen, VSplit } from "./grid"
import styles from "./index-ledge.module.css"

const CITIES = ["London", "New York", "Paris", "Tokyo", "Chicago", "Berlin"] as const

const PICKS_PER_CITY = 8

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
 * south-most pick needs far more room below it than the north-most above. */
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

export const indexHold =
  (data: LandingData, indexPane: PxRect): HoldScene => ({
    kind: "hold",
    id: "index",
    shape: "[data-spine-shape='index']",
    heightVh: TOTLE_VH,
    Component: () => <IndexLedge data={data} indexPane={indexPane} />,
  })

function IndexLedge({ data, indexPane }: { data: LandingData; indexPane: PxRect }) {
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
            if (!id) throw new Error(`index city "${name}" not found`)
            return [name, await dataSource.getAllArchitectures({ cityIds: [id] })] as const
          }),
        )
        setArchByCities((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
      } catch {
        // cities that didn't load stay dim in the grid
      }
    })()
  }, [dataSource])

  const archPickesByCity = useMemo(() => {
    const out: Record<string, ArchSummary[]> = {}
    for (const name of CITIES) {
      const items = archByCities[name]
      if (!items?.length) continue
      out[name] = pickIndexPhotos(items, items[0].coordinates, PICKS_PER_CITY)
    }
    return out
  }, [archByCities])

  const [selected, setSelected] = useState<string>(CITIES[0])
  const picks = archPickesByCity[selected] ?? data.heroPicks
  const displayCity = useCityDisplay(local, selected)

  const cameraFor = useCallback(
    (cityPicks: ArchSummary[]) =>
      fitCamera(
        cityPicks.map((p) => p.coordinates),
        { width: indexPane.width, height: indexPane.height },
        FIT_PADDING,
      ),
    [indexPane],
  )

  // fly in as the transition hands us the screen; hysteresis via ENTRY_REARM_VH
  // keeps a jittering scroll from refiring
  const picksRef = useRef(picks)
  picksRef.current = picks
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
      flyToSceneCinematic(map, cameraFor(picksRef.current))
    } else {
      flied.current = false
    }
  })

  const onSelect = useCallback(
    (name: string) => {
      setSelected(name)
      const cityPicks = archPickesByCity[name]
      if (!map || !cityPicks?.length) return
      flyToSceneCinematic(map, cameraFor(cityPicks))
    },
    [archPickesByCity, map, cameraFor],
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
      <Screen className={styles.index}>
        <PhotoMarkers picks={picks} on={markersOn} />
        <motion.div className={styles.splits} style={{ opacity: fade }}>
          <HSplit>
            <Pane size="var(--size-header-height)" />
            <Pane className={styles.visibleOverflow}>
              <VSplit>
                <Pane size="var(--grid-padding)" />
                <Pane size="calc(var(--grid-col) * 4)" className={styles.visibleOverflow}>
                  <HSplit>
                    <Pane className={`${styles.statementPane} ${styles.visibleOverflow}`}>
                      <Statement leadCity={displayCity} listCity={selected} picks={picks} />
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
                  <div data-spine-shape="index" className={styles.mapPane} />
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
  picks,
}: {
  leadCity: string
  listCity: string
  picks: ArchSummary[]
}) {
  const reduced = useReducedMotion()
  return (
    <>
      <div className={styles.leadTrack}>
        <H3 className={styles.lead}>
          Travelling to{" "}
          <span className={styles.leadCityClip}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={leadCity}
                className={styles.leadCity}
                initial={reduced ? false : { y: "110%" }}
                animate={{ y: 0 }}
                exit={reduced ? undefined : { y: "-110%" }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {leadCity}
              </motion.span>
            </AnimatePresence>
          </span>.
        </H3>
      </div>
      <Body1 asChild>
        <p className={styles.statementText}>Nolli has Architectures Worth Seeing.</p>
      </Body1>
      <AnimatePresence mode="wait" initial={false}>
        <motion.ul key={listCity} className={styles.archList} initial="hidden" animate="visible" exit="exit">
          {picks.map((p, i) => (
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

/** One city cell. Two faces roll in the clip — rest rides the building
 * tile with a dim label; lifted clears the fill and goes full color.
 * Hover/focus previews lifted; selection holds it, and handing selection
 * over rolls the old cell back to rest. */
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
  const reduced = useReducedMotion()
  // listeners stay attached even while selected — a leave during selection
  // must still clear armed, or the cell would re-show the armed face once
  // deselected. The face itself only arms when interactive.
  const faceArmed = armed && ready && !selected
  // selected and armed share the lifted face: selection holds it, hover
  // previews it, and handing selection over rolls the old cell back to rest
  const lifted = selected || faceArmed
  const cls = [
    styles.cityCell,
    selected ? styles.cityCellSelected : "",
    ready ? "" : styles.cityCellPending,
  ]
    .filter(Boolean)
    .join(" ")
  const arm = (v: boolean) => () => setArmed(v)
  return (
    <Pane>
      <div
        className={cls}
        onClick={() => ready && onSelect(name)}
        role="button"
        tabIndex={ready ? 0 : -1}
        aria-pressed={selected}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            if (ready) onSelect(name)
          }
        }}
        onMouseEnter={arm(true)}
        onMouseLeave={arm(false)}
        onFocus={arm(true)}
        onBlur={arm(false)}
      >
        <span className={styles.cityClip}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={lifted ? "lifted" : "rest"}
              className={styles.cityFace}
              data-armed={lifted}
              initial={reduced ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={reduced ? undefined : { y: "-100%" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {name}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </Pane>
  )
}
