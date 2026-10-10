// City ledger on the map background. The map is the spine's fullscreen
// layer behind the whole hold; the scene lays content on it — a static
// paper veil dims the map end to end, the photo markers sit above the
// veil (every arch, always — no hover selection), and the dossier pane
// takes the first column. A selection (cube pick or auto-advance) writes
// the shared selected city — the hero sheet reads the same value — and
// flies the map to the new city's fit, focus pushed right of the column.
// Cities advance every ADVANCE_MS; hover pauses, click jumps.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion"
import { Body2, H2 } from "@nolli/ui"
import { useIsMobile } from "@nolli/ui"
import { applyMapTransition } from "@/lib/map-transition"
import type { SceneCamera } from "@nolli/map"
import { type ArchSummary, type LandingData } from "@/lib/landing-data"
import { CITY_LEDGER } from "@/lib/constants"
import { selectedCity, setSelectedCity, useSelectedCity } from "@/lib/city-store"
import { useSceneOwnsMap, useSpineMap } from "@/spine/spine"
import { SCREEN_SHAPE, type HoldScene } from "@/spine/timeline"
import { fitCamera } from "@/lib/camera"
import { useLinger } from "@/lib/use-linger"
import { MarkerPhoto } from "@/components/photo-markers"
import markerStyles from "@/components/photo-markers.module.css"
import { RollText } from "@/components/roll-text"
import { Pane, Rule, Screen } from "./page-layout"
import styles from "./city-ledger.module.css"

/** Hold height in scene vh — 100 of sticky scene + 40 of stay-still
 * budget. */
const SCENE_VH = 140

/** City auto-advance period. */
const ADVANCE_MS = 10000

/** Fit padding in viewport px. The dossier owns the first column, so the
 * focus lands right of it; photo cards hang below the pin, so the
 * south-most arch needs far more room below than the north-most above. */
const fitPad = (mobile: boolean) =>
  mobile
    ? { left: 48, right: 48, top: 96, bottom: 160 }
    : { left: Math.round(window.innerWidth * 0.32), right: 100, top: 140, bottom: 300 }

/** The hold's camera — the selected city's deck fit to the full viewport
 * with the right-biased pad. Null when the city has no deck (the spine's
 * deferred retry re-fires once it does). */
export const cityCamera = (data: LandingData): SceneCamera | null => {
  const archs = data.cityLedger[selectedCity()]
  if (!archs?.length) return null
  return fitCamera(
    archs.map((p) => p.coordinates),
    { width: window.innerWidth, height: window.innerHeight },
    fitPad(window.innerWidth < 768),
  )
}

export const cityHold = (data: LandingData): HoldScene => ({
  kind: "hold",
  id: "city",
  shape: SCREEN_SHAPE,
  heightVh: SCENE_VH,
  camera: () => cityCamera(data),
  Component: () => <CityLedger data={data} />,
})

function CityLedger({ data }: { data: LandingData }) {
  const map = useSpineMap()
  const ownsMap = useSceneOwnsMap()
  const city = useSelectedCity()
  const archs = data.cityLedger[city] ?? []

  // a pick flies the map; the store write re-targets the hero sheet too
  const onSelect = useCallback(
    (name: string) => {
      setSelectedCity(name)
      if (!ownsMap || !map) return
      const cam = cityCamera(data)
      if (cam) applyMapTransition(map, cam)
    },
    [data, map, ownsMap],
  )

  return (
    <>
      <div aria-hidden data-spine-shape="screen" className={styles.mapAnchor} />
      <section className={styles.city}>
        <div aria-hidden className={styles.veil} />
        <CityMarkers archs={archs} on={ownsMap} />
        <Screen className={styles.screen}>
          <Pane className={styles.dossierPane} blurred>
            <div className={styles.dossier}>
              <Statement city={city} archs={archs} />
              <CityDots selected={city} onSelect={onSelect} auto={ownsMap} />
            </div>
          </Pane>
          <Rule full className={styles.closingRule} />
        </Screen>
      </section>
    </>
  )
}

/** The hold's photo markers — every arch of the selected city, above the
 * veil. A fixed layer over the whole viewport (same trick as the hero's
 * overlay): the map behind never moves, so raw viewport projections are
 * exact and nothing repositions on scroll. A city swap keeps the outgoing
 * set mounted under its fade while the incoming one fades in — the
 * photoMarker opacity transition plays both, the old set unmounts after. */
type MarkerSet = { key: string; archs: ArchSummary[]; on: boolean }

function CityMarkers({ archs, on }: { archs: ArchSummary[]; on: boolean }) {
  const [mounted, visible] = useLinger(on, 400)
  const map = useSpineMap()
  const els = useRef(new Map<string, HTMLDivElement>())
  const city = useSelectedCity()

  const [sets, setSets] = useState<MarkerSet[]>(() =>
    city ? [{ key: city, archs, on: true }] : [],
  )
  useEffect(() => {
    if (!city) return
    setSets((ss) =>
      ss[ss.length - 1]?.key === city
        ? ss
        : [...ss.map((s) => ({ ...s, on: false })), { key: city, archs, on: true }],
    )
  }, [city, archs])
  // drop the faded-out sets once their exit transition has played
  useEffect(() => {
    if (sets.length <= 1) return
    const t = setTimeout(() => setSets((ss) => ss.filter((s) => s.on)), 600)
    return () => clearTimeout(t)
  }, [sets])

  const all = sets.flatMap((s) => s.archs)
  useEffect(() => {
    if (!map || !mounted) return
    const update = () => {
      for (const a of all) {
        const el = els.current.get(a.slug)
        if (!el) continue
        const p = map.project([a.coordinates.lng, a.coordinates.lat])
        el.style.left = `${p.x}px`
        el.style.top = `${p.y}px`
      }
    }
    update()
    map.on("move", update)
    map.on("resize", update)
    return () => {
      map.off("move", update)
      map.off("resize", update)
    }
  }, [map, all, mounted])

  if (!mounted) return null
  return (
    <div className={styles.markerLayer} aria-hidden>
      {sets.map((s) =>
        s.archs.map((a) => (
          <div
            key={a.slug}
            ref={(el) => {
              if (el) els.current.set(a.slug, el)
              else els.current.delete(a.slug)
            }}
            className={markerStyles.marker}
            style={{ zIndex: Math.round((a.coordinates.lat + 90) * 1000) }}
          >
            <div className={markerStyles.photoMarker} data-show={(visible && s.on) || undefined}>
              <MarkerPhoto a={a} />
            </div>
          </div>
        )),
      )}
    </div>
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
  archs,
}: {
  city: string
  archs: ArchSummary[]
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
          <motion.ul key={city} className={styles.archList} initial="hidden" animate="visible" exit="exit">
            {archs.map((p, i) => (
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

/** The city carousel control — a ledger line at the column's foot: cubes
 * on the left, the city name small at the right, both over the rule. Idle
 * cubes are small gray grounds, the selected one large and accent; a
 * selection change plays as a directional pass — the outgoing cube swipes
 * off toward travel and fades, the incoming one swipes in from behind it
 * (all CSS, keyed off data-dir/data-exit). The rule carries the period as
 * a gold wipe (scaleX so it can hold mid-sweep); every switch — advance,
 * pick, pause/resume — clears the one timer and schedules a fresh full
 * period, and the wipe restarts with it. Hovering previews the name;
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

  // one timer: every switch (advance, pick, pause/resume, ownership edge)
  // clears it and schedules a fresh full period — no carried remainders,
  // so the countdown and the wipe always restart together
  const timer = useRef(0)
  const clearTimer = useCallback(() => window.clearTimeout(timer.current), [])
  useEffect(() => {
    if (!running) return
    clearTimer()
    timer.current = window.setTimeout(() => {
      setCycle((c) => c + 1)
      onSelect(CITY_LEDGER[(idx + 1) % CITY_LEDGER.length])
    }, ADVANCE_MS)
    return clearTimer
  }, [running, idx, cycle, onSelect, clearTimer])

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
    clearTimer()
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
            key={`${idx}-${cycle}-${running}`}
            className={styles.ruleFill}
            style={{ "--city-period": `${ADVANCE_MS}ms` } as CSSProperties}
          />
        )}
      </div>
    </div>
  )
}
